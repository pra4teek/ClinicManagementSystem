from rest_framework import viewsets, permissions
from apibackendapp.models import LabReport, LabTest, LabPrescription
from .serializers import LabReportSerializer, LabTestSerializer, LabPrescriptionSerializer


class LabReportViewSet(viewsets.ModelViewSet):
    permission_classes = [permissions.AllowAny]
    queryset = LabReport.objects.all()
    serializer_class = LabReportSerializer


class LabTestViewSet(viewsets.ModelViewSet):
    permission_classes = [permissions.AllowAny]
    queryset = LabTest.objects.all()
    serializer_class = LabTestSerializer


class LabPrescriptionViewSet(viewsets.ModelViewSet):
    permission_classes = [permissions.AllowAny]
    queryset = LabPrescription.objects.all()
    serializer_class = LabPrescriptionSerializer
