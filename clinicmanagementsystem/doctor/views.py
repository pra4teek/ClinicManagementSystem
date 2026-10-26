from django.db import transaction
from django.utils import timezone
from rest_framework import viewsets, filters, permissions, status
from rest_framework.decorators import action
from rest_framework.exceptions import ValidationError
from rest_framework.response import Response
from apibackendapp.models import (
    Appointment, Doctor, Consultation, Prescription, PrescriptionItem,
    LabPrescription, LabTest, MasterMedicine, Dosage, Notification,
)
from .serializers import DoctorSerializer,ConsultationSerializer,PrescriptionSerializer,PrescriptionCreateSerializer,PrescriptionItemSerializer,LabPrescriptionSerializer
from adminapp.authentication import (
    IsDoctor, IsDoctorOrPharmacistRead, IsDoctorCreateOrLabTechnicianUpdate,
    IsDoctorOrReceptionist,
)


# Create your views here.

class DoctorViewSet(viewsets.ReadOnlyModelViewSet):
    permission_classes = [IsDoctorOrReceptionist]
    queryset=Doctor.objects.all()
    serializer_class=DoctorSerializer
    filter_backends=[filters.SearchFilter]
    search_fields=['Name', 'Specialization']

    def get_queryset(self):
        doctor = getattr(self.request.user, 'doctor_profile', None)
        if doctor is not None:
            return Doctor.objects.filter(pk=doctor.pk)
        return Doctor.objects.filter(isActive=True).order_by('Name')


class ConsultationViewSet(viewsets.ReadOnlyModelViewSet):
    permission_classes = [IsDoctor]
    queryset=Consultation.objects.all()
    serializer_class=ConsultationSerializer
    filter_backends=[filters.SearchFilter]
    search_fields=['Diagnosis', 'Symptoms']

    def get_queryset(self):
        queryset=Consultation.objects.all()
        doctor = getattr(self.request.user, 'doctor_profile', None)
        if doctor is not None:
            queryset=queryset.filter(DoctorId=doctor)
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

    @action(detail=False, methods=['post'], url_path='complete')
    @transaction.atomic
    def complete(self, request):
        """Atomically save a consultation and the resulting pharmacy/lab work."""
        doctor = getattr(request.user, 'doctor_profile', None)
        if doctor is None:
            raise ValidationError({'detail': 'The signed-in account has no doctor profile.'})
        try:
            appointment_id = int(request.data.get('AppointmentId'))
            patient_id = int(request.data.get('PatientId'))
            appointment = Appointment.objects.select_for_update().select_related(
                'PatientId', 'DoctorId'
            ).get(AppointmentId=appointment_id)
        except (Appointment.DoesNotExist, TypeError, ValueError):
            raise ValidationError({'AppointmentId': 'Choose a valid appointment.'})
        if appointment.DoctorId_id != doctor.DoctorId:
            raise ValidationError({'AppointmentId': 'This appointment belongs to another doctor.'})
        if appointment.PatientId_id != patient_id:
            raise ValidationError({'PatientId': 'The patient does not match this appointment.'})
        diagnosis = str(request.data.get('Diagnosis') or '').strip()
        symptoms = str(request.data.get('Symptoms') or '').strip()
        if len(diagnosis) < 3 or len(symptoms) < 3:
            raise ValidationError({'detail': 'Symptoms and diagnosis must each contain at least 3 characters.'})
        consultation = Consultation.objects.select_for_update().filter(AppointmentId=appointment).first()
        consultation_created = consultation is None
        if consultation_created:
            consultation = Consultation.objects.create(
                AppointmentId=appointment,
                PatientId=appointment.PatientId,
                DoctorId=doctor,
                ConsultationStatus='Completed',
                Diagnosis=diagnosis[:100],
                Symptoms=symptoms[:100],
                Remarks=str(request.data.get('Remarks') or '').strip()[:200],
            )
        elif consultation.DoctorId_id != doctor.DoctorId or consultation.PatientId_id != patient_id:
            raise ValidationError({'AppointmentId': 'The existing consultation does not match this doctor and patient.'})

        prescription_items = request.data.get('prescription_items') or []
        if not isinstance(prescription_items, list):
            raise ValidationError({'prescription_items': 'Expected a list of prescribed medicines.'})
        existing_prescription = consultation.prescriptions.order_by('PrescriptionId').first()
        if prescription_items and existing_prescription is None:
            prescription = Prescription.objects.create(
                ConsultationId=consultation,
                PatientId=appointment.PatientId,
                DoctorId=doctor,
                PrescriptionDateTime=timezone.now(),
                Status='Not Dispensed',
            )
            Notification.objects.create(
                RecipientRole='Pharmacist',
                Title=f'New Prescription RX-{prescription.PrescriptionId}',
                Message=f'Dr. {doctor.Name} sent a new prescription for patient {appointment.PatientId.Name}.',
                NotificationType='NEW_PRESCRIPTION',
                RelatedRecordId=prescription.PrescriptionId,
            )
            for index, item in enumerate(prescription_items):
                if not isinstance(item, dict):
                    raise ValidationError({'prescription_items': f'Item {index + 1} is invalid.'})
                medicine_name = str(item.get('medicineName') or '').strip()
                dosage_value = str(item.get('dosage') or '').strip()
                medicine = MasterMedicine.objects.filter(MedicineName__iexact=medicine_name, isActive=True).first()
                dosage = Dosage.objects.filter(DosageValue__iexact=dosage_value).first()
                if medicine is None:
                    raise ValidationError({'prescription_items': f'Medicine "{medicine_name}" is not in the active medicine catalog.'})
                if not dosage_value:
                    raise ValidationError({'prescription_items': f'Item {index + 1} needs a dosage.'})
                if dosage is None:
                    dosage = Dosage.objects.create(
                        DosageValue=dosage_value[:50],
                        Instructions=str(item.get('instructions') or '').strip()[:255],
                    )
                try:
                    quantity = int(item.get('quantity'))
                except (TypeError, ValueError):
                    quantity = 0
                if quantity < 1:
                    raise ValidationError({'prescription_items': f'Item {index + 1} needs a valid quantity.'})
                PrescriptionItem.objects.create(
                    PrescriptionId=prescription,
                    MedicineId=medicine,
                    DosageId=dosage,
                    Duration=str(item.get('duration') or '').strip()[:30],
                    Frequency=str(item.get('frequency') or '').strip()[:30],
                    Instructions=str(item.get('instructions') or '').strip()[:255],
                    Quantity=quantity,
                )

        lab_orders = request.data.get('lab_orders') or []
        if not isinstance(lab_orders, list):
            raise ValidationError({'lab_orders': 'Expected a list of lab tests.'})
        for index, item in enumerate(lab_orders):
            if isinstance(item, dict):
                test_name = str(item.get('testName') or '').strip()
                sample_type = str(item.get('sampleType') or 'Diagnostic Specimen').strip()
            else:
                test_name = str(item).strip()
                sample_type = 'Diagnostic Specimen'
            lab_test = LabTest.objects.filter(TestName__iexact=test_name, isActive=True).first()
            if lab_test is None:
                raise ValidationError({'lab_orders': f'Lab test "{test_name}" is not in the active test catalog.'})
            if consultation.lab_orders.filter(LabTestId=lab_test).exists():
                continue
            LabPrescription.objects.create(
                LabTestId=lab_test,
                PatientId=appointment.PatientId,
                DoctorId=doctor,
                ConsultationId=consultation,
                Status='Pending',
                SampleType=sample_type[:100] or 'Diagnostic Specimen',
                LabTestDate=timezone.now(),
            )

        appointment.AppointmentStatus = 'Completed'
        appointment.save(update_fields=['AppointmentStatus'])
        return Response(
            ConsultationSerializer(consultation).data,
            status=status.HTTP_201_CREATED if consultation_created else status.HTTP_200_OK,
        )


class PrescriptionViewSet(viewsets.ReadOnlyModelViewSet):
    permission_classes = [IsDoctorOrPharmacistRead]
    queryset=Prescription.objects.all()
    filter_backends=[filters.SearchFilter]
    search_fields=['Status']

    def get_queryset(self):
        queryset = super().get_queryset()
        doctor = getattr(self.request.user, 'doctor_profile', None)
        if doctor is not None:
            queryset = queryset.filter(DoctorId=doctor)
        return queryset

    def get_serializer_class(self):
        if self.action == 'create':
            return PrescriptionCreateSerializer
        return PrescriptionSerializer


class PrescriptionItemViewSet(viewsets.ReadOnlyModelViewSet):
    permission_classes = [IsDoctorOrPharmacistRead]
    queryset=PrescriptionItem.objects.all()
    serializer_class=PrescriptionItemSerializer

    def get_queryset(self):
        queryset = super().get_queryset()
        doctor = getattr(self.request.user, 'doctor_profile', None)
        if doctor is not None:
            queryset = queryset.filter(PrescriptionId__DoctorId=doctor)
        return queryset


class LabPrescriptionViewSet(viewsets.ReadOnlyModelViewSet):
    permission_classes = [IsDoctor]
    queryset=LabPrescription.objects.all()
    serializer_class=LabPrescriptionSerializer
    filter_backends=[filters.SearchFilter]
    search_fields=['Status', 'SampleType']
