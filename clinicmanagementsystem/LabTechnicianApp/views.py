from rest_framework import viewsets
from apibackendapp.models import LabReport, LabTest,LabPrescription
from .serializers import LabReportSerializer, LabTestSerializer,LabPrescriptionSerializer


class LabReportViewSet(viewsets.ModelViewSet):
    queryset = LabReport.objects.all()
    serializer_class = LabReportSerializer


class LabTestViewSet(viewsets.ModelViewSet):
    queryset = LabTest.objects.all()
    serializer_class = LabTestSerializer
class LabPrescriptionViewSet(viewsets.ModelViewSet):
    queryset=LabPrescription.objects.all()
    serializer_class=LabPrescriptionSerializer
    