from django.db import transaction
from django.utils import timezone
from rest_framework import status, viewsets
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework import permissions
from apibackendapp.models import LabReport, LabTest, LabPrescription, Patient, Appointment
from .serializers import (
    LabReportSerializer, LabTestSerializer, LabPrescriptionSerializer,
    LabPrescriptionStatusSerializer,
)
from adminapp.authentication import (
    IsDoctorCreateOrLabTechnicianUpdate,
    IsDoctorOrLabReadOnly,
    IsLabTechnician,
    IsDoctorReadOrLabTechnician,
)


class LabReportViewSet(viewsets.ReadOnlyModelViewSet):
    permission_classes = [IsDoctorReadOrLabTechnician]
    queryset = LabReport.objects.select_related(
        'LabPrescriptionId__PatientId',
        'LabPrescriptionId__DoctorId',
        'LabPrescriptionId__LabTestId',
    )
    serializer_class = LabReportSerializer

    def get_queryset(self):
        queryset = super().get_queryset()
        doctor = getattr(self.request.user, 'doctor_profile', None)
        if doctor is not None:
            queryset = queryset.filter(LabPrescriptionId__DoctorId=doctor)
        return queryset


class LabTestViewSet(viewsets.ReadOnlyModelViewSet):
    permission_classes = [IsDoctorOrLabReadOnly]
    queryset = LabTest.objects.all()
    serializer_class = LabTestSerializer


class LabPrescriptionViewSet(viewsets.ModelViewSet):
    permission_classes = [IsDoctorCreateOrLabTechnicianUpdate]
    queryset = LabPrescription.objects.select_related(
        'LabTestId',
        'PatientId',
        'DoctorId',
        'ConsultationId',
    ).order_by('-LabTestDate', '-LabPrescriptionId')
    serializer_class = LabPrescriptionSerializer

    def get_serializer_class(self):
        if self.action in ('update', 'partial_update'):
            return LabPrescriptionStatusSerializer
        return self.serializer_class

    def get_queryset(self):
        queryset = super().get_queryset()
        doctor = getattr(self.request.user, 'doctor_profile', None)
        if doctor is not None:
            queryset = queryset.filter(DoctorId=doctor)
        return queryset

    def perform_create(self, serializer):
        doctor = getattr(self.request.user, 'doctor_profile', None)
        if doctor is None:
            from rest_framework.exceptions import PermissionDenied
            raise PermissionDenied('Only a doctor can create a lab order.')
        from rest_framework.exceptions import ValidationError
        if not Appointment.objects.filter(DoctorId=doctor, PatientId=serializer.validated_data.get('PatientId')).exists():
            raise ValidationError({'PatientId': 'You can only order tests for patients assigned to you.'})
        serializer.save(DoctorId=doctor, Status='Pending')

    @action(detail=False, methods=['post'], url_path='request-batch')
    @transaction.atomic
    def request_batch(self, request):
        doctor = getattr(request.user, 'doctor_profile', None)
        if doctor is None:
            from rest_framework.exceptions import PermissionDenied
            raise PermissionDenied('Only a doctor can request lab tests.')
        try:
            patient = Patient.objects.get(PatientId=int(request.data.get('PatientId')))
        except (Patient.DoesNotExist, TypeError, ValueError):
            from rest_framework.exceptions import ValidationError
            raise ValidationError({'PatientId': 'Choose a valid patient.'})
        if not Appointment.objects.filter(DoctorId=doctor, PatientId=patient).exists():
            from rest_framework.exceptions import PermissionDenied
            raise PermissionDenied('You can only order tests for patients assigned to you.')
        tests = request.data.get('tests')
        if not isinstance(tests, list) or not tests:
            from rest_framework.exceptions import ValidationError
            raise ValidationError({'tests': 'Choose at least one test.'})

        orders = []
        for name in tests:
            lab_test = LabTest.objects.filter(TestName__iexact=str(name).strip(), isActive=True).first()
            if lab_test is None:
                from rest_framework.exceptions import ValidationError
                raise ValidationError({'tests': f'Lab test "{name}" is not in the active catalog.'})
            orders.append(LabPrescription.objects.create(
                LabTestId=lab_test,
                PatientId=patient,
                DoctorId=doctor,
                Status='Pending',
                SampleType=str(request.data.get('SampleType') or 'Diagnostic Specimen')[:100],
                LabTestDate=timezone.now(),
            ))
        return Response(
            LabPrescriptionSerializer(orders, many=True).data,
            status=status.HTTP_201_CREATED,
        )

    def perform_update(self, serializer):
        if serializer.validated_data.get('Status') == 'Completed':
            from rest_framework.exceptions import ValidationError
            raise ValidationError({'Status': 'A lab order can only be completed when its report is submitted.'})
        serializer.save()

    @action(detail=True, methods=['post'], url_path='submit-report', permission_classes=[IsLabTechnician])
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
            staff = getattr(request.user, 'staff_profile', None)
            if staff is None:
                from rest_framework.exceptions import ValidationError
                raise ValidationError({'LabTechnician': 'The signed-in user has no technician profile.'})
            report = report_serializer.save(LabTechnician=staff)
            prescription.Status = 'Completed'
            prescription.save(update_fields=['Status'])

        return Response({
            'report': LabReportSerializer(report).data,
            'prescription': LabPrescriptionSerializer(prescription).data,
        }, status=status.HTTP_200_OK if existing_report else status.HTTP_201_CREATED)
