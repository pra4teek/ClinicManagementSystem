# from django.shortcuts import render

# # Create your views here.

from rest_framework import viewsets, permissions, filters

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
    permission_classes = [permissions.AllowAny]

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
    permission_classes = [permissions.AllowAny]


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
    permission_classes = [permissions.AllowAny]


class BillViewSet(viewsets.ModelViewSet):

    queryset = (
        Bill.objects
        .select_related("PatientId")
        .all()
        .order_by("-BillDate")
    )

    serializer_class = BillSerializer
    permission_classes = [permissions.AllowAny]


class PaymentViewSet(viewsets.ModelViewSet):
    queryset = (
        Payment.objects
        .select_related("BillId", "BillId__PatientId")
        .all()
        .order_by("-PaymentDate")
    )

    serializer_class = PaymentSerializer
    permission_classes = [permissions.AllowAny]