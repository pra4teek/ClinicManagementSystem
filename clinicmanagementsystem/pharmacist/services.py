from django.db import transaction
from django.db.models import Sum
from django.utils import timezone

from apibackendapp.models import (
    PharmacyStock, PharmacyBill, PharmacyBillItem, Bill, Prescription, PrescriptionItem,
)


class DispenseError(Exception):
    """Raised for any business-rule failure during dispensing (bad item,
    insufficient stock, etc). Callers should turn this into a 400 response."""


@transaction.atomic
def dispense_prescription(prescription, items_data, dispensing_staff):
    """
    Core dispensing workflow (SRS requirement 5).

    - Validates each requested item actually belongs to this prescription.
    - Locks the matching stock row with select_for_update() so concurrent
      dispensing against the same medicine can't oversell stock.
    - Decrements stock and creates the PharmacyBill + PharmacyBillItem rows.
    - Updates Prescription.Status based on medicine coverage.

    Runs inside one transaction: any DispenseError raised here rolls back
    every stock decrement and bill row created earlier in this same call,
    so a failure partway through never leaves a half-dispensed record.
    """

    prescription = Prescription.objects.select_for_update().get(pk=prescription.pk)
    seen_item_ids = set()
    for entry in items_data:
        item_id = entry["PrescriptionItemId"].pk
        if item_id in seen_item_ids:
            raise DispenseError(
                f"PrescriptionItem {item_id} was submitted more than once in this request."
            )
        seen_item_ids.add(item_id)

    bill = PharmacyBill.objects.create(
        Patient=prescription.PatientId,
        Prescription=prescription,
        DispensedBy=dispensing_staff,
        TotalAmount=0,
    )

    total = 0
    for entry in items_data:
        prescription_item = PrescriptionItem.objects.select_for_update().get(
            pk=entry["PrescriptionItemId"].pk
        )
        quantity = entry["Quantity"]

        if prescription_item.PrescriptionId_id != prescription.pk:
            raise DispenseError(
                f"PrescriptionItem {prescription_item.pk} does not belong to "
                f"Prescription {prescription.pk}."
            )

        already_dispensed = sum(
            PharmacyBillItem.objects.filter(PrescriptionItem=prescription_item)
            .values_list("Quantity", flat=True)
        )
        remaining = max(0, prescription_item.Quantity - already_dispensed)
        if quantity > remaining:
            raise DispenseError(
                f"Requested quantity for '{prescription_item.MedicineId.MedicineName}' "
                f"exceeds the remaining prescribed quantity of {remaining}."
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
        if stock.QuantityOnHand < quantity:
            raise DispenseError(
                f"Insufficient stock for '{medicine.MedicineName}': "
                f"requested {quantity}, only {stock.QuantityOnHand} available."
            )

        stock.QuantityOnHand -= quantity
        stock.save(update_fields=["QuantityOnHand", "LastUpdated"])

        # Billed at SellingPrice (what the patient is charged), not UnitPrice
        # (the pharmacy's cost basis) — see "Assumptions" in chat.
        line_amount = quantity * stock.SellingPrice
        PharmacyBillItem.objects.create(
            Bill=bill,
            PrescriptionItem=prescription_item,
            Medicine=medicine,
            Quantity=quantity,
            UnitPrice=stock.SellingPrice,
            LineAmount=line_amount,
        )
        total += line_amount

    bill.TotalAmount = total
    bill.save(update_fields=["TotalAmount"])

    _update_prescription_status(prescription)

    # Auto-generate a general Bill for the patient after dispensing
    Bill.objects.create(
        PatientId=prescription.PatientId,
        BillDate=timezone.now().date(),
        Amount=total,
        BillStatus='Pending',
        BillType='Pharmacy',
    )

    # Notify doctor that prescription was dispensed
    try:
        from apibackendapp.models import Notification
        pat_name = prescription.PatientId.Name if prescription.PatientId else 'Patient'
        Notification.objects.create(
            RecipientRole="Doctor",
            Title=f"Prescription Dispensed (RX-{prescription.PrescriptionId})",
            Message=f"Medicines for {pat_name} have been dispensed by the pharmacy.",
            NotificationType="PRESCRIPTION_DISPENSED",
            RelatedRecordId=prescription.PrescriptionId,
        )
    except Exception:
        pass

    return bill


def _update_prescription_status(prescription):
    """
    PharmacyBillItem has no direct FK to PrescriptionItem — the only link
    between a bill and a prescription is at the Bill level
    (PharmacyBill.Prescription). So "fully dispensed" is inferred by
    comparing the set of prescribed medicines against the set of medicines
    actually billed against this prescription across all its bills. This
    detects per-medicine coverage, not partial-quantity fulfillment of a
    single medicine — see "Assumptions" in chat for the shared-model gap
    this works around.
    """

    prescription_items = list(prescription.items.all())
    dispensed_by_item = dict(
        PharmacyBillItem.objects.filter(Bill__Prescription=prescription, PrescriptionItem__isnull=False)
        .values_list("PrescriptionItem_id")
        .annotate(total=Sum("Quantity"))
    )
    # Older bills may not have a PrescriptionItem link. Count these against
    # their medicine, without claiming any individual line was fully covered.
    legacy_by_medicine = dict(
        PharmacyBillItem.objects.filter(Bill__Prescription=prescription, PrescriptionItem__isnull=True)
        .values_list("Medicine_id")
        .annotate(total=Sum("Quantity"))
    )
    any_dispensed = bool(dispensed_by_item or legacy_by_medicine)
    required_by_medicine = {}
    dispensed_by_medicine = {}
    for item in prescription_items:
        required_by_medicine[item.MedicineId_id] = required_by_medicine.get(item.MedicineId_id, 0) + item.Quantity
        dispensed_by_medicine[item.MedicineId_id] = (
            dispensed_by_medicine.get(item.MedicineId_id, 0) + dispensed_by_item.get(item.pk, 0)
        )
    fully_dispensed = bool(required_by_medicine) and all(
        dispensed_by_medicine.get(medicine_id, 0) + legacy_by_medicine.get(medicine_id, 0) >= required
        for medicine_id, required in required_by_medicine.items()
    )

    if fully_dispensed:
        prescription.Status = "Dispensed"
    elif any_dispensed:
        prescription.Status = "Partially Dispensed"
    else:
        prescription.Status = "Not Dispensed"

    prescription.save(update_fields=["Status"])
