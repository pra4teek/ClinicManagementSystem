from rest_framework import serializers
from django.db.models import Sum

from apibackendapp.models import (
    MasterMedicine,
    PharmacyStock,
    PharmacyBill,
    PharmacyBillItem,
    Prescription,
    PrescriptionItem,
    Supplier,
    StockReorderRequest,
    Notification,
)


class SupplierSerializer(serializers.ModelSerializer):
    class Meta:
        model = Supplier
        fields = '__all__'


class StockReorderRequestSerializer(serializers.ModelSerializer):
    MedicineName = serializers.CharField(source='Medicine.MedicineName', read_only=True)
    CurrentStock = serializers.SerializerMethodField()
    ReorderLevel = serializers.SerializerMethodField()
    UnitPrice = serializers.SerializerMethodField()

    class Meta:
        model = StockReorderRequest
        fields = [
            'ReorderId',
            'Medicine',
            'MedicineName',
            'Supplier',
            'SupplierName',
            'RequestedQuantity',
            'EstimatedCost',
            'Status',
            'RequestedBy',
            'AdminNote',
            'ReviewedBy',
            'CreatedAt',
            'UpdatedAt',
            'CurrentStock',
            'ReorderLevel',
            'UnitPrice',
        ]
        read_only_fields = ['ReorderId', 'CreatedAt', 'UpdatedAt']

    def get_CurrentStock(self, obj):
        stock = PharmacyStock.objects.filter(Medicine=obj.Medicine).first()
        return stock.QuantityOnHand if stock else 0

    def get_ReorderLevel(self, obj):
        stock = PharmacyStock.objects.filter(Medicine=obj.Medicine).first()
        return stock.ReorderLevel if stock else 10

    def get_UnitPrice(self, obj):
        stock = PharmacyStock.objects.filter(Medicine=obj.Medicine).first()
        return float(stock.UnitPrice) if stock else float(obj.Medicine.CostValue or 0)


class NotificationSerializer(serializers.ModelSerializer):
    class Meta:
        model = Notification
        fields = '__all__'


class MasterMedicineSerializer(serializers.ModelSerializer):
    """
    Read-only for the pharmacist. Medicines are created/maintained by Admin
    in the Master Medicine table — this app never writes to it.
    """

    class Meta:
        model = MasterMedicine
        fields = [
            "MedicineId",
            "MedicineName",
            "Manufacturer",
            "GenericName",
            "Category",
            "CostValue",
            "MRP",
        ]
        read_only_fields = fields


class PharmacyStockSerializer(serializers.ModelSerializer):
    MedicineName = serializers.CharField(source="Medicine.MedicineName", read_only=True)

    class Meta:
        model = PharmacyStock
        fields = [
            "StockId",
            "Medicine",
            "MedicineName",
            "QuantityOnHand",
            "UnitPrice",
            "SellingPrice",
            "ReorderLevel",
            "LastUpdated",
        ]
        read_only_fields = ["StockId", "LastUpdated"]

    def validate_QuantityOnHand(self, value):
        if value < 0:
            raise serializers.ValidationError("Quantity on hand cannot be negative.")
        return value

    def validate_ReorderLevel(self, value):
        if value < 0:
            raise serializers.ValidationError("Reorder level cannot be negative.")
        return value

    def validate(self, data):
        unit_price = data.get("UnitPrice", getattr(self.instance, "UnitPrice", None))
        selling_price = data.get("SellingPrice", getattr(self.instance, "SellingPrice", None))
        if unit_price is not None and selling_price is not None and selling_price < unit_price:
            raise serializers.ValidationError(
                "Selling price cannot be lower than unit (cost) price."
            )

        medicine = data.get("Medicine", getattr(self.instance, "Medicine", None))
        if medicine is not None:
            existing = PharmacyStock.objects.filter(Medicine=medicine)
            if self.instance is not None:
                existing = existing.exclude(pk=self.instance.pk)
            duplicate = existing.first()
            if duplicate is not None:
                raise serializers.ValidationError(
                    f"A stock record for '{medicine.MedicineName}' already exists "
                    f"(Stock ID {duplicate.StockId}). Edit that record instead of "
                    "creating a duplicate."
                )
        return data


class PrescriptionItemSerializer(serializers.ModelSerializer):
    """Read-only line item shown inside the pharmacist's prescription queue."""

    MedicineName = serializers.CharField(source="MedicineId.MedicineName", read_only=True)
    Dosage = serializers.CharField(source="DosageId.DosageValue", read_only=True)
    DosageInstructions = serializers.CharField(source="DosageId.Instructions", read_only=True)

    class Meta:
        model = PrescriptionItem
        fields = [
            "PrescriptionItemId",
            "MedicineId",
            "MedicineName",
            "Dosage",
            "DosageInstructions",
            "Duration",
            "Frequency",
            "Instructions",
            "Quantity",
            "DispensedQuantity",
            "RemainingQuantity",
        ]
        read_only_fields = fields

    Instructions = serializers.CharField(read_only=True)
    Quantity = serializers.IntegerField(read_only=True)
    DispensedQuantity = serializers.SerializerMethodField()
    RemainingQuantity = serializers.SerializerMethodField()

    def get_DispensedQuantity(self, obj):
        return obj.dispensed_lines.aggregate(total=Sum("Quantity"))["total"] or 0

    def get_RemainingQuantity(self, obj):
        return max(0, obj.Quantity - self.get_DispensedQuantity(obj))


class PrescriptionQueueSerializer(serializers.ModelSerializer):
    """
    Read-only. The pharmacist can see a doctor's prescription in full detail
    but has no write fields here at all — editing a prescription is never
    exposed through this app.
    """

    PatientName = serializers.CharField(source="PatientId.Name", read_only=True)
    DoctorName = serializers.SerializerMethodField()
    items = PrescriptionItemSerializer(many=True, read_only=True)

    class Meta:
        model = Prescription
        fields = [
            "PrescriptionId",
            "PatientId",
            "PatientName",
            "DoctorId",
            "DoctorName",
            "PrescriptionDateTime",
            "Status",
            "items",
        ]
        read_only_fields = fields

    def get_DoctorName(self, obj):
        return obj.DoctorId.Name if obj.DoctorId else None


class DispenseItemInputSerializer(serializers.Serializer):
    """One line of what's actually being dispensed right now."""

    PrescriptionItemId = serializers.PrimaryKeyRelatedField(
        queryset=PrescriptionItem.objects.all(), required=True
    )
    prescriptionItemId = serializers.IntegerField(required=False, allow_null=True)
    MedicineId = serializers.IntegerField(required=False, allow_null=True)
    medicine_id = serializers.IntegerField(required=False, allow_null=True)
    medicineId = serializers.CharField(required=False, allow_null=True, allow_blank=True)
    MedicineName = serializers.CharField(required=False, allow_null=True, allow_blank=True)
    medicineName = serializers.CharField(required=False, allow_null=True, allow_blank=True)
    Quantity = serializers.IntegerField(required=False, default=1, min_value=1)
    quantity = serializers.IntegerField(required=False, default=1, min_value=1)


class DispenseRequestSerializer(serializers.Serializer):
    """
    Input for POST /api/pharmacist/prescriptions/{id}/dispense/.
    """

    items = DispenseItemInputSerializer(many=True, required=False, default=list)


class PharmacyBillItemSerializer(serializers.ModelSerializer):
    """
    Fully read-only. Bill items are only ever created inside the atomic
    dispense transaction (see services.dispense_prescription) — never via
    a direct POST here, so stock validation can't be bypassed.
    """

    MedicineName = serializers.CharField(source="Medicine.MedicineName", read_only=True)

    class Meta:
        model = PharmacyBillItem
        fields = ["BillItemId", "Bill", "Medicine", "MedicineName", "Quantity", "UnitPrice", "LineAmount"]
        read_only_fields = fields


class PharmacyBillSerializer(serializers.ModelSerializer):
    """Fully read-only for the same reason as PharmacyBillItemSerializer above."""

    PatientName = serializers.CharField(source="Patient.Name", read_only=True)
    DispensedByName = serializers.CharField(source="DispensedBy.Name", read_only=True)
    DoctorName = serializers.SerializerMethodField()
    billNumber = serializers.SerializerMethodField()
    items = PharmacyBillItemSerializer(many=True, read_only=True)

    class Meta:
        model = PharmacyBill
        fields = [
            "BillId",
            "billNumber",
            "Patient",
            "PatientName",
            "Prescription",
            "DispensedBy",
            "DispensedByName",
            "DoctorName",
            "BillDate",
            "TotalAmount",
            "items",
        ]
        read_only_fields = fields

    def get_billNumber(self, obj):
        return f"PB-{obj.BillId}"

    def get_DoctorName(self, obj):
        if obj.Prescription and obj.Prescription.DoctorId:
            doc_name = obj.Prescription.DoctorId.Name
            return doc_name if doc_name.startswith("Dr.") else f"Dr. {doc_name}"
        return "Staff Physician"