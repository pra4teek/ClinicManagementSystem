from django.db import transaction
from django.utils import timezone

from apibackendapp.models import (
    PharmacyStock,
    PharmacyBill,
    PharmacyBillItem,
    Bill,
    PrescriptionItem,
)


class DispenseError(Exception):
    """Raised for any business-rule failure during dispensing (bad item,
    insufficient stock, etc). Callers should turn this into a 400 response."""


@transaction.atomic
def dispense_prescription(prescription, items_data, dispensing_staff):
    """
    Core dispensing workflow:
    - Validates each requested item actually belongs to this prescription.
    - Locks the matching stock row with select_for_update() so concurrent
      dispensing against the same medicine can't oversell stock.
    - Validates stockOnHand >= quantity (raises DispenseError with clear message).
    - Decrements stockOnHand -= quantity and saves to MySQL.
    - Creates PharmacyBill and PharmacyBillItem rows in MySQL.
    - Updates Prescription.Status = "Dispensed".
    - Auto-generates a Receptionist Bill (BillType="Pharmacy", BillStatus="Pending").
    """

    if not items_data:
        raise DispenseError("No items provided for dispensing.")

    seen_item_ids = set()
    normalized_items = []
    for entry in items_data:
        prescription_item = entry.get("PrescriptionItemId")
        if isinstance(prescription_item, (int, str)):
            try:
                clean_pk = int(str(prescription_item).replace("RX-", "").replace("MED-", ""))
                prescription_item = PrescriptionItem.objects.select_related("MedicineId").get(pk=clean_pk)
            except (PrescriptionItem.DoesNotExist, ValueError):
                raise DispenseError(f"PrescriptionItem ID '{prescription_item}' not found.")

        if not prescription_item:
            raise DispenseError("Missing PrescriptionItem in dispense payload.")

        item_id = prescription_item.pk
        if item_id in seen_item_ids:
            raise DispenseError(
                f"PrescriptionItem {item_id} was submitted more than once in this request."
            )
        seen_item_ids.add(item_id)

        qty = entry.get("Quantity") or entry.get("quantity") or 1
        try:
            qty = int(qty)
        except (ValueError, TypeError):
            qty = 1
        if qty <= 0:
            qty = 1

        normalized_items.append((prescription_item, qty))

    bill = PharmacyBill.objects.create(
        Patient=prescription.PatientId,
        Prescription=prescription,
        DispensedBy=dispensing_staff,
        TotalAmount=0,
    )

    total = 0
    for prescription_item, quantity in normalized_items:
        if prescription_item.PrescriptionId_id != prescription.pk:
            raise DispenseError(
                f"PrescriptionItem {prescription_item.pk} does not belong to "
                f"Prescription {prescription.pk}."
            )

        medicine = prescription_item.MedicineId
        stock = (
            PharmacyStock.objects.select_for_update()
            .filter(Medicine=medicine)
            .order_by("StockId")
            .first()
        )
        if stock is None:
            raise DispenseError(f"No stock record exists for '{medicine.MedicineName}'.")
        if stock.QuantityOnHand <= 0:
            raise DispenseError(
                f"Medicine '{medicine.MedicineName}' is out of stock (available: 0, required: {quantity})."
            )
        if stock.QuantityOnHand < quantity:
            raise DispenseError(
                f"Insufficient stock for '{medicine.MedicineName}': "
                f"requested {quantity}, only {stock.QuantityOnHand} available."
            )

        stock.QuantityOnHand -= quantity
        stock.save(update_fields=["QuantityOnHand", "LastUpdated"])

        # Billed at SellingPrice (what the patient is charged)
        line_amount = quantity * stock.SellingPrice
        PharmacyBillItem.objects.create(
            Bill=bill,
            Medicine=medicine,
            Quantity=quantity,
            UnitPrice=stock.SellingPrice,
            LineAmount=line_amount,
        )
        total += line_amount

    bill.TotalAmount = total
    bill.save(update_fields=["TotalAmount"])

    # Update prescription status
    prescription.Status = "Dispensed"
    prescription.save(update_fields=["Status"])

    # Auto-generate a general Bill for the patient after dispensing
    Bill.objects.create(
        PatientId=prescription.PatientId,
        BillDate=timezone.now().date(),
        Amount=total,
        BillStatus='Pending',
        BillType='Pharmacy',
    )

    return bill