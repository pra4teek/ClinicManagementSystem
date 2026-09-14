from django.shortcuts import render
from rest_framework import viewsets, filters
from rest_framework.permissions import IsAuthenticated
from apibackendapp.models import Doctor, Consultation, Prescription, PrescriptionItem, LabPrescription
from .serializers import DoctorSerializer,ConsultationSerializer,PrescriptionSerializer,PrescriptionCreateSerializer,PrescriptionItemSerializer,LabPrescriptionSerializer


# Create your views here.

class DoctorViewSet(viewsets.ModelViewSet):
    # permission_classes=[IsAuthenticated]
    queryset=Doctor.objects.all()
    serializer_class=DoctorSerializer
    filter_backends=[filters.SearchFilter]
    search_fields=['Name', 'Specialization']


class ConsultationViewSet(viewsets.ModelViewSet):
    permission_classes=[IsAuthenticated]
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


class PrescriptionViewSet(viewsets.ModelViewSet):
    permission_classes=[IsAuthenticated]
    queryset=Prescription.objects.all()
    filter_backends=[filters.SearchFilter]
    search_fields=['Status']

    def get_serializer_class(self):
        if self.action == 'create':
            return PrescriptionCreateSerializer
        return PrescriptionSerializer


class PrescriptionItemViewSet(viewsets.ModelViewSet):
    permission_classes=[IsAuthenticated]
    queryset=PrescriptionItem.objects.all()
    serializer_class=PrescriptionItemSerializer


class LabPrescriptionViewSet(viewsets.ModelViewSet):
    permission_classes=[IsAuthenticated]
    queryset=LabPrescription.objects.all()
    serializer_class=LabPrescriptionSerializer
    filter_backends=[filters.SearchFilter]
    search_fields=['Status', 'SampleType']