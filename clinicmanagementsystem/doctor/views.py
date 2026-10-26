from django.shortcuts import render
from rest_framework import viewsets, filters, permissions
from apibackendapp.models import (
    Doctor,
    Consultation,
    Prescription,
    PrescriptionItem,
    LabPrescription,
    Notification,
)
from .serializers import DoctorSerializer,ConsultationSerializer,PrescriptionSerializer,PrescriptionCreateSerializer,PrescriptionItemSerializer,LabPrescriptionSerializer


# Create your views here.

class DoctorViewSet(viewsets.ModelViewSet):
    permission_classes = [permissions.AllowAny]
    queryset=Doctor.objects.all()
    serializer_class=DoctorSerializer
    filter_backends=[filters.SearchFilter]
    search_fields=['Name', 'Specialization']


class ConsultationViewSet(viewsets.ModelViewSet):
    permission_classes = [permissions.AllowAny]
    queryset=Consultation.objects.all()
    serializer_class=ConsultationSerializer
    filter_backends=[filters.SearchFilter]
    search_fields=['Diagnosis', 'Symptoms']

    def get_queryset(self):
        queryset=Consultation.objects.all()
        doctor_id=self.request.query_params.get('doctor_id')
        if doctor_id:
            queryset=queryset.filter(DoctorId=doctor_id)
        return queryset

    def perform_create(self, serializer):
        instance = serializer.save()
        if instance.ConsultationStatus == 'Completed' and instance.AppointmentId:
            appointment = instance.AppointmentId
            appointment.AppointmentStatus = 'Completed'
            appointment.save(update_fields=['AppointmentStatus'])

    def perform_update(self, serializer):
        instance = serializer.save()
        # Auto-update appointment status when consultation is completed
        if instance.ConsultationStatus == 'Completed' and instance.AppointmentId:
            appointment = instance.AppointmentId
            appointment.AppointmentStatus = 'Completed'
            appointment.save(update_fields=['AppointmentStatus'])


class PrescriptionViewSet(viewsets.ModelViewSet):
    permission_classes = [permissions.AllowAny]
    queryset=Prescription.objects.all()
    filter_backends=[filters.SearchFilter]
    search_fields=['Status']

    def get_serializer_class(self):
        if self.action == 'create':
            return PrescriptionCreateSerializer
        return PrescriptionSerializer

    def perform_create(self, serializer):
        prescription = serializer.save()
        doc_name = prescription.DoctorId.Name if prescription.DoctorId else "Doctor"
        patient_name = prescription.PatientId.Name if prescription.PatientId else "Patient"
        Notification.objects.create(
            RecipientRole="Pharmacist",
            Title=f"New Prescription RX-{prescription.PrescriptionId}",
            Message=f"Dr. {doc_name} sent a new prescription for patient {patient_name}.",
            NotificationType="NEW_PRESCRIPTION",
            RelatedRecordId=prescription.PrescriptionId,
        )


class PrescriptionItemViewSet(viewsets.ModelViewSet):
    permission_classes = [permissions.AllowAny]
    queryset=PrescriptionItem.objects.all()
    serializer_class=PrescriptionItemSerializer


class LabPrescriptionViewSet(viewsets.ModelViewSet):
    permission_classes = [permissions.AllowAny]
    queryset=LabPrescription.objects.all()
    serializer_class=LabPrescriptionSerializer
    filter_backends=[filters.SearchFilter]
    search_fields=['Status', 'SampleType']
