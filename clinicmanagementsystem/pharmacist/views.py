import re
from django.db import transaction
from django.db.models import Count, F, Sum
from django.utils.dateparse import parse_date
from rest_framework import filters, permissions, status, viewsets
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.views import APIView

from apibackendapp.models import (
    Staff,
    MasterMedicine,
    PharmacyBill,
    PharmacyBillItem,
    PharmacyStock,
    Prescription,
    PrescriptionItem,
    Supplier,
    StockReorderRequest,
    Notification,
    AuditLog,
)
from .serializers import (
    DispenseRequestSerializer,
    MasterMedicineSerializer,
    PharmacyBillItemSerializer,
    PharmacyBillSerializer,
    PharmacyStockSerializer,
    PrescriptionQueueSerializer,
    SupplierSerializer,
    StockReorderRequestSerializer,
    NotificationSerializer,
)
from .services import DispenseError, dispense_prescription


class MasterMedicineViewSet(viewsets.ReadOnlyModelViewSet):
    """Pharmacist looks medicines up here. Creating/editing is Admin's job —
    read-only enforces that at the API level, not just by convention."""

    queryset = MasterMedicine.objects.all().order_by("MedicineName")
    serializer_class = MasterMedicineSerializer
    permission_classes = [permissions.AllowAny]
    filter_backends = [filters.SearchFilter]
    search_fields = ["MedicineName", "GenericName"]


class PharmacyStockViewSet(viewsets.ModelViewSet):
    queryset = PharmacyStock.objects.select_related("Medicine").all()
    serializer_class = PharmacyStockSerializer
    permission_classes = [permissions.AllowAny]


class PrescriptionQueueViewSet(viewsets.ReadOnlyModelViewSet):
    """
    Incoming prescription queue plus the dispense action. Read-only on the
    prescription itself: the pharmacist can view it in full detail but has
    no path in this app to edit a doctor's prescription.
    """

    serializer_class = PrescriptionQueueSerializer
    permission_classes = [permissions.AllowAny]

    def get_queryset(self):
        return (
            Prescription.objects.all()
            .select_related("PatientId", "DoctorId", "ConsultationId")
            .prefetch_related("items__MedicineId", "items__DosageId")
            .order_by("-PrescriptionDateTime")
        )

    @action(detail=True, methods=["post"])
    def dispense(self, request, pk=None):
        prescription = self.get_object()

        items_payload = request.data.get("items")
        rx_items = list(prescription.items.select_related("MedicineId").all())
        if not items_payload:
            items_data = [
                {
                    "PrescriptionItemId": item,
                    "Quantity": 1,
                }
                for item in rx_items
            ]
        else:
            items_data = []
            for entry in items_payload:
                rx_item_id = entry.get("PrescriptionItemId") or entry.get("prescriptionItemId")
                med_id = entry.get("MedicineId") or entry.get("medicine_id") or entry.get("medicineId")
                med_name = entry.get("MedicineName") or entry.get("medicineName")
                qty = entry.get("Quantity") or entry.get("quantity") or 1
                try:
                    qty = int(qty)
                except (ValueError, TypeError):
                    qty = 1

                matched_item = None
                if rx_item_id:
                    try:
                        clean_id = int(re.sub(r'\D', '', str(rx_item_id)))
                        matched_item = next((it for it in rx_items if it.PrescriptionItemId == clean_id), None)
                        if not matched_item:
                            matched_item = PrescriptionItem.objects.filter(pk=clean_id, PrescriptionId=prescription).first()
                    except ValueError:
                        pass

                if not matched_item and med_id:
                    try:
                        clean_med_id = int(re.sub(r'\D', '', str(med_id)))
                        matched_item = next((it for it in rx_items if it.MedicineId_id == clean_med_id), None)
                    except (ValueError, TypeError):
                        pass

                if not matched_item and med_name:
                    clean_name = str(med_name).strip().lower()
                    matched_item = next((it for it in rx_items if it.MedicineId.MedicineName.strip().lower() == clean_name), None)

                if not matched_item and len(rx_items) == 1:
                    matched_item = rx_items[0]

                if matched_item:
                    items_data.append({
                        "PrescriptionItemId": matched_item,
                        "Quantity": qty,
                    })

        if not items_data and rx_items:
            items_data = [{"PrescriptionItemId": it, "Quantity": 1} for it in rx_items]

        if not items_data:
            return Response(
                {"detail": "No prescription items found to dispense."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        staff = getattr(request.user, "staff_profile", None)
        if staff is None:
            staff = Staff.objects.filter(RoleId__RoleName__icontains="Pharmacist").first()
        if staff is None:
            staff = Staff.objects.first()
        if staff is None:
            return Response(
                {"detail": "No Staff record found in clinic system."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        try:
            bill = dispense_prescription(
                prescription=prescription,
                items_data=items_data,
                dispensing_staff=staff,
            )
        except DispenseError as exc:
            return Response({"detail": str(exc)}, status=status.HTTP_400_BAD_REQUEST)

        return Response(PharmacyBillSerializer(bill).data, status=status.HTTP_201_CREATED)


class SupplierViewSet(viewsets.ModelViewSet):
    queryset = Supplier.objects.filter(IsActive=True).order_by("SupplierName")
    serializer_class = SupplierSerializer
    permission_classes = [permissions.AllowAny]


class StockReorderRequestViewSet(viewsets.ModelViewSet):
    queryset = StockReorderRequest.objects.select_related("Medicine", "Supplier").all().order_by("-CreatedAt")
    serializer_class = StockReorderRequestSerializer
    permission_classes = [permissions.AllowAny]

    def create(self, request, *args, **kwargs):
        med_val = request.data.get('Medicine') or request.data.get('MedicineId') or request.data.get('medicineId') or request.data.get('rawMedicineId')
        if not med_val:
            return Response({"detail": "Medicine is required."}, status=status.HTTP_400_BAD_REQUEST)

        try:
            clean_med_id = int(re.sub(r'\D', '', str(med_val)))
            medicine = MasterMedicine.objects.filter(pk=clean_med_id).first()
        except ValueError:
            medicine = None

        if not medicine:
            med_name = request.data.get('medicineName') or request.data.get('MedicineName')
            if med_name:
                medicine = MasterMedicine.objects.filter(MedicineName__icontains=str(med_name).strip()).first()

        if not medicine:
            return Response({"detail": f"Medicine with ID {med_val} not found."}, status=status.HTTP_404_NOT_FOUND)

        req_qty = int(request.data.get('RequestedQuantity') or request.data.get('requestedQty') or 50)
        supplier_name = request.data.get('SupplierName') or request.data.get('supplier') or 'Default Pharma Supplier'
        estimated_cost = request.data.get('EstimatedCost') or request.data.get('estimatedCost') or (req_qty * float(medicine.CostValue or 10))

        supplier_obj = None
        sup_val = request.data.get('Supplier') or request.data.get('supplierId')
        if sup_val:
            try:
                clean_sup_id = int(re.sub(r'\D', '', str(sup_val)))
                supplier_obj = Supplier.objects.filter(pk=clean_sup_id).first()
            except ValueError:
                pass
        if not supplier_obj:
            supplier_obj = Supplier.objects.filter(SupplierName__iexact=str(supplier_name).strip()).first()

        reorder = StockReorderRequest.objects.create(
            Medicine=medicine,
            Supplier=supplier_obj,
            SupplierName=supplier_name,
            RequestedQuantity=req_qty,
            EstimatedCost=estimated_cost,
            Status='Pending Admin Approval',
            RequestedBy='Pharmacist',
        )

        Notification.objects.create(
            RecipientRole="Admin",
            Title="Reorder Permission Requested",
            Message=f"Pharmacist requested permission to order {req_qty} units of {medicine.MedicineName}.",
            NotificationType="REORDER_PERMISSION_REQUEST",
            RelatedRecordId=reorder.ReorderId,
        )

        return Response(self.get_serializer(reorder).data, status=status.HTTP_201_CREATED)

    @action(detail=True, methods=['post'])
    def approve_permission(self, request, pk=None):
        reorder = self.get_object()
        admin_note = request.data.get('AdminNote') or request.data.get('adminNote') or ''
        reorder.Status = 'Approved by Admin'
        reorder.AdminNote = admin_note
        reorder.ReviewedBy = 'Admin'
        reorder.save()

        AuditLog.objects.create(
            ActionType='APPROVE_REORDER_PERMISSION',
            TableAffected='StockReorderRequest',
            RecordId=reorder.ReorderId,
            Details=f"Admin confirmed reorder permission for {reorder.Medicine.MedicineName} (Qty: {reorder.RequestedQuantity}). Note: {admin_note}"
        )

        Notification.objects.create(
            RecipientRole="Pharmacist",
            Title="Admin Confirmed Reorder Permission",
            Message=f"Admin confirmed permission to order {reorder.RequestedQuantity} units of {reorder.Medicine.MedicineName}. You can now request it from {reorder.SupplierName}.",
            NotificationType="REORDER_APPROVED",
            RelatedRecordId=reorder.ReorderId,
        )

        return Response(self.get_serializer(reorder).data, status=status.HTTP_200_OK)

    @action(detail=True, methods=['post'])
    def reject_permission(self, request, pk=None):
        reorder = self.get_object()
        admin_note = request.data.get('AdminNote') or request.data.get('adminNote') or 'Request rejected by Administrator.'
        reorder.Status = 'Rejected by Admin'
        reorder.AdminNote = admin_note
        reorder.ReviewedBy = 'Admin'
        reorder.save()

        AuditLog.objects.create(
            ActionType='REJECT_REORDER_PERMISSION',
            TableAffected='StockReorderRequest',
            RecordId=reorder.ReorderId,
            Details=f"Admin rejected reorder permission for {reorder.Medicine.MedicineName}. Note: {admin_note}"
        )

        Notification.objects.create(
            RecipientRole="Pharmacist",
            Title="Admin Rejected Reorder Request",
            Message=f"Admin rejected permission for {reorder.Medicine.MedicineName}. Note: {admin_note}",
            NotificationType="REORDER_REJECTED",
            RelatedRecordId=reorder.ReorderId,
        )

        return Response(self.get_serializer(reorder).data, status=status.HTTP_200_OK)

    @action(detail=True, methods=['post'])
    def order_from_supplier(self, request, pk=None):
        reorder = self.get_object()
        reorder.Status = 'Ordered from Supplier'
        reorder.save()
        return Response(self.get_serializer(reorder).data, status=status.HTTP_200_OK)

    @action(detail=True, methods=['post'])
    def mark_received(self, request, pk=None):
        reorder = self.get_object()
        with transaction.atomic():
            reorder.Status = 'Received'
            reorder.save()

            stock, _ = PharmacyStock.objects.select_for_update().get_or_create(
                Medicine=reorder.Medicine,
                defaults={
                    'QuantityOnHand': 0,
                    'UnitPrice': reorder.Medicine.CostValue or 10,
                    'SellingPrice': reorder.Medicine.MRP or 15,
                    'ReorderLevel': 10
                }
            )
            stock.QuantityOnHand += reorder.RequestedQuantity
            stock.save(update_fields=['QuantityOnHand', 'LastUpdated'])

            AuditLog.objects.create(
                ActionType='RESTOCK_FROM_SUPPLIER',
                TableAffected='PharmacyStock',
                RecordId=stock.StockId,
                Details=f"Restocked {reorder.RequestedQuantity} units of {reorder.Medicine.MedicineName} via PO #{reorder.ReorderId}."
            )

        return Response(self.get_serializer(reorder).data, status=status.HTTP_200_OK)


class NotificationViewSet(viewsets.ModelViewSet):
    queryset = Notification.objects.all().order_by("-CreatedAt")
    serializer_class = NotificationSerializer
    permission_classes = [permissions.AllowAny]

    def list(self, request, *args, **kwargs):
        role = request.query_params.get("role")
        qs = self.get_queryset()
        if role:
            qs = qs.filter(RecipientRole__iexact=role.strip())
        unread_count = qs.filter(IsRead=False).count()
        latest_items = qs[:30]
        data = self.get_serializer(latest_items, many=True).data
        return Response({
            "unread_count": unread_count,
            "results": data
        })

    @action(detail=True, methods=['post'])
    def mark_read(self, request, pk=None):
        notif = self.get_object()
        notif.IsRead = True
        notif.save(update_fields=['IsRead'])
        return Response({"status": "success", "NotificationId": notif.NotificationId, "IsRead": True})

    @action(detail=False, methods=['post'])
    def mark_all_read(self, request):
        role = request.query_params.get("role") or request.data.get("role")
        qs = Notification.objects.filter(IsRead=False)
        if role:
            qs = qs.filter(RecipientRole__iexact=role.strip())
        updated = qs.update(IsRead=True)
        return Response({"status": "success", "marked_read_count": updated})



class PharmacyBillViewSet(viewsets.ReadOnlyModelViewSet):
    """
    Read-only. Bills are only ever created through the dispense action
    (see PrescriptionQueueViewSet.dispense), never posted here directly, so
    client-supplied totals can never be trusted and stock validation can
    never be bypassed.
    """

    queryset = (
        PharmacyBill.objects.select_related("Patient", "Prescription", "DispensedBy")
        .prefetch_related("items__Medicine")
        .all()
        .order_by("-BillDate")
    )
    serializer_class = PharmacyBillSerializer
    permission_classes = [permissions.AllowAny]


class PharmacyBillItemViewSet(viewsets.ReadOnlyModelViewSet):
    """Read-only, same reasoning as PharmacyBillViewSet above."""

    queryset = PharmacyBillItem.objects.select_related("Bill", "Medicine").all()
    serializer_class = PharmacyBillItemSerializer
    permission_classes = [permissions.AllowAny]


class PharmacyRevenueReportView(APIView):
    permission_classes = [permissions.AllowAny]

    def get(self, request):
        from_date_str = request.query_params.get("from_date")
        to_date_str = request.query_params.get("to_date")

        from_date = parse_date(from_date_str) if from_date_str else None
        to_date = parse_date(to_date_str) if to_date_str else None

        if from_date_str and from_date is None:
            return Response(
                {"detail": "Invalid from_date. Use YYYY-MM-DD."}, status=status.HTTP_400_BAD_REQUEST
            )
        if to_date_str and to_date is None:
            return Response(
                {"detail": "Invalid to_date. Use YYYY-MM-DD."}, status=status.HTTP_400_BAD_REQUEST
            )
        if from_date and to_date and from_date > to_date:
            return Response(
                {"detail": "from_date cannot be after to_date."}, status=status.HTTP_400_BAD_REQUEST
            )

        bills = PharmacyBill.objects.all()
        if from_date:
            bills = bills.filter(BillDate__gte=from_date)
        if to_date:
            bills = bills.filter(BillDate__lte=to_date)

        summary = bills.aggregate(bill_count=Count("BillId"), total_revenue=Sum("TotalAmount"))

        return Response(
            {
                "from_date": from_date_str,
                "to_date": to_date_str,
                "number_of_bills": summary["bill_count"] or 0,
                "total_revenue": summary["total_revenue"] or 0,
            }
        )


class PharmacyReorderReportView(APIView):
    permission_classes = [permissions.AllowAny]

    def get(self, request):
        low_stock = (
            PharmacyStock.objects.select_related("Medicine")
            .filter(QuantityOnHand__lte=F("ReorderLevel"))
            .order_by("QuantityOnHand")
        )

        results = [
            {
                "MedicineId": row.Medicine.MedicineId,
                "MedicineName": row.Medicine.MedicineName,
                "QuantityOnHand": row.QuantityOnHand,
                "ReorderLevel": row.ReorderLevel,
                "UnitPrice": row.UnitPrice,
                "SellingPrice": row.SellingPrice,
                "StockStatus": "Out of stock" if row.QuantityOnHand <= 0 else "Below reorder level",
            }
            for row in low_stock
        ]

        return Response({"count": len(results), "results": results})