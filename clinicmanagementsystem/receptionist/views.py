# from django.shortcuts import render

# # Create your views here.

from rest_framework import viewsets, permissions, filters
from rest_framework.decorators import action
from rest_framework.response import Response
from adminapp.authentication import (
    IsDoctorOrReceptionistWrite,
    IsDoctorOrReceptionistAppointment,
    IsReceptionistOrPharmacistRead,
    IsDoctorOrReceptionist,
)

from apibackendapp.models import (
    Patient,
    Appointment,
    Token,
    Bill,
    Payment,
)

from .serializers import (
    PatientSerializer,
    AppointmentSerializer,
    TokenSerializer,
    BillSerializer,
    PaymentSerializer,
)


class PatientViewSet(viewsets.ModelViewSet):
    queryset = Patient.objects.all().order_by("PatientId")
    serializer_class = PatientSerializer
    permission_classes = [IsDoctorOrReceptionistWrite]

    def get_queryset(self):
        queryset = super().get_queryset()
        doctor = getattr(self.request.user, 'doctor_profile', None)
        if doctor is not None:
            queryset = queryset.filter(appointment__DoctorId=doctor).distinct()
        return queryset

    filter_backends = [filters.SearchFilter]
    search_fields = [
        "Name",
        "PatientId",
        "PhoneNumber",
        "Address",
    ]


class AppointmentViewSet(viewsets.ModelViewSet):
    queryset = (
        Appointment.objects
        .select_related(
            "PatientId",
            "ReceptionistId",
            "DoctorId",
            "DepartmentId",
        )
        .all()
        .order_by("-AppointmentDateTime")
    )

    serializer_class = AppointmentSerializer
    permission_classes = [IsDoctorOrReceptionistAppointment]

    def get_queryset(self):
        queryset = super().get_queryset()
        doctor = getattr(self.request.user, 'doctor_profile', None)
        if doctor is not None:
            queryset = queryset.filter(DoctorId=doctor)
        return queryset

    def perform_create(self, serializer):
        appointment = serializer.save()
        from apibackendapp.models import Token
        if not Token.objects.filter(AppointmentId=appointment).exists():
            Token.objects.create(
                AppointmentId=appointment,
                PatientId=appointment.PatientId,
                DoctorId=appointment.DoctorId,
                TokenDate=appointment.AppointmentDateTime
            )

    @action(detail=False, methods=["post"], url_path="reset-all-status", permission_classes=[IsDoctorOrReceptionist])
    def reset_all_status(self, request):
        doctor = getattr(request.user, 'doctor_profile', None)
        qs = self.get_queryset()
        if doctor is None:
            doctor_id = request.data.get("doctor_id") or request.query_params.get("doctor_id")
            if doctor_id and str(doctor_id).lower() != 'all':
                qs = qs.filter(DoctorId=doctor_id)
        count = qs.update(AppointmentStatus="Scheduled")
        return Response({
            "detail": f"{count} appointment(s) successfully reset to Scheduled.",
            "count": count
        })


class TokenViewSet(viewsets.ModelViewSet):
    queryset = (
        Token.objects
        .select_related(
            "AppointmentId",
            "PatientId",
            "DoctorId",
        )
        .all()
        .order_by("-TokenDate")
    )

    serializer_class = TokenSerializer
    permission_classes = [IsDoctorOrReceptionistWrite]


class BillViewSet(viewsets.ModelViewSet):

    queryset = (
        Bill.objects
        .select_related("PatientId")
        .all()
        .order_by("-BillDate")
    )

    serializer_class = BillSerializer
    permission_classes = [IsReceptionistOrPharmacistRead]


class PaymentViewSet(viewsets.ModelViewSet):
    queryset = (
        Payment.objects
        .select_related("BillId", "BillId__PatientId")
        .all()
        .order_by("-PaymentDate")
    )

    serializer_class = PaymentSerializer
    permission_classes = [IsReceptionistOrPharmacistRead]
