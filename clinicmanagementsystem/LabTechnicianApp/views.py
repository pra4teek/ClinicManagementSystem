from django.db import transaction
from rest_framework import status, viewsets
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework import permissions
from apibackendapp.models import LabReport, LabTest, LabPrescription
from .serializers import LabReportSerializer, LabTestSerializer, LabPrescriptionSerializer


class LabReportViewSet(viewsets.ModelViewSet):
    permission_classes = [permissions.AllowAny]
    queryset = LabReport.objects.select_related(
        'LabPrescriptionId__PatientId',
        'LabPrescriptionId__DoctorId',
        'LabPrescriptionId__LabTestId',
    )
    serializer_class = LabReportSerializer


class LabTestViewSet(viewsets.ModelViewSet):
    permission_classes = [permissions.AllowAny]
    queryset = LabTest.objects.all()
    serializer_class = LabTestSerializer


class LabPrescriptionViewSet(viewsets.ModelViewSet):
    permission_classes = [permissions.AllowAny]
    queryset = LabPrescription.objects.select_related(
        'LabTestId',
        'PatientId',
        'DoctorId',
        'ConsultationId',
    )
    serializer_class = LabPrescriptionSerializer

    @action(detail=True, methods=['post'], url_path='submit-report')
    def submit_report(self, request, pk=None):
        with transaction.atomic():
            prescription = self.get_object()
            existing_report = prescription.reports.order_by('-ReportDate').first()
            report_data = {
                **request.data,
                'LabPrescriptionId': prescription.pk,
            }
            if existing_report:
                report_serializer = LabReportSerializer(
                    existing_report,
                    data=report_data,
                    partial=True,
                )
            else:
                report_serializer = LabReportSerializer(data=report_data)
            report_serializer.is_valid(raise_exception=True)
            report = report_serializer.save()
            prescription.Status = 'Completed'
            prescription.save(update_fields=['Status'])

        return Response({
            'report': LabReportSerializer(report).data,
            'prescription': LabPrescriptionSerializer(prescription).data,
        }, status=status.HTTP_200_OK if existing_report else status.HTTP_201_CREATED)
