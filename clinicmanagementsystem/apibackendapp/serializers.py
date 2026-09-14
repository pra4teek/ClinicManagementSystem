from rest_framework import serializers
from .models import Doctor, Consultation, Prescription, PrescriptionItem, LabPrescription
from .models import User, Department, MasterMedicine, Dosage, LabTest
import re

def symptoms_validation(value):
    if len(value.strip()) < 3:
        raise serializers.ValidationError("Symptoms must be at least 3 characters.")
    return value

def diagnosis_validation(value):
    if len(value.strip()) < 3:
        raise serializers.ValidationError("Diagnosis must be at least 3 characters.")
    return value

def frequency_validation(value):
    if not re.match(r'^[\d\-A-Za-z\s]+$', value):
        raise serializers.ValidationError("Frequency must be a valid pattern,like '1-0-1' or 'Once daily'.")
    return value


class UserMiniSerializer(serializers.ModelSerializer):
    class Meta:
        model=User
        fields=('UserId', 'Username')

class DepartmentMiniSerializer(serializers.ModelSerializer):
    class Meta:
        model=Department
        fields=('DepartmentId', 'DepartmentName')

class MedicineMiniSerializer(serializers.ModelSerializer):
    class Meta:
        model=MasterMedicine
        fields=('MedicineId', 'MedicineName')

class DosageMiniSerializer(serializers.ModelSerializer):
    class Meta:
        model=Dosage
        fields=('DosageId', 'DosageValue', 'Instructions')

class LabTestMiniSerializer(serializers.ModelSerializer):
    class Meta:
        model=LabTest
        fields=('LabtestId', 'TestName', 'TestCost')


class DoctorSerializer(serializers.ModelSerializer):
    User=UserMiniSerializer(source='UserId', read_only=True)
    Department=DepartmentMiniSerializer(source='DepartmentId', read_only=True)

    class Meta:
        model=Doctor
        fields=('DoctorId', 'Name', 'UserId', 'User', 'DepartmentId', 'Department',
                  'Qualification', 'Specialization', 'isActive')


class PrescriptionItemSerializer(serializers.ModelSerializer):
    Medicine=MedicineMiniSerializer(source='MedicineId', read_only=True)
    Dosage=DosageMiniSerializer(source='DosageId', read_only=True)
    Frequency=serializers.CharField(max_length=30, validators=[frequency_validation])

    class Meta:
        model=PrescriptionItem
        fields=('PrescriptionItemId', 'PrescriptionId', 'MedicineId', 'Medicine','DosageId', 'Dosage', 'Duration', 'Frequency')


class PrescriptionSerializer(serializers.ModelSerializer):
    item_details=PrescriptionItemSerializer(source='prescriptionitem_set', many=True, read_only=True)

    class Meta:
        model=Prescription
        fields=('PrescriptionId', 'ConsultationId', 'PatientId', 'DoctorId','PrescriptionDateTime', 'Status', 'item_details')


class LabPrescriptionSerializer(serializers.ModelSerializer):
    LabTest=LabTestMiniSerializer(source='LabTestId', read_only=True)

    class Meta:
        model=LabPrescription
        fields=('LabPrescriptionId', 'LabTestId', 'LabTest', 'PatientId', 'DoctorId','ConsultationId', 'Status', 'SampleType', 'LabTestDate')


class ConsultationSerializer(serializers.ModelSerializer):
    Symptoms=serializers.CharField(max_length=100, validators=[symptoms_validation])
    Diagnosis=serializers.CharField(max_length=100, validators=[diagnosis_validation])

    prescription_details = PrescriptionSerializer(source='prescription_set', many=True, read_only=True)
    lab_prescription_details = LabPrescriptionSerializer(source='labprescription_set', many=True, read_only=True)

    class Meta:
        model=Consultation
        fields=('ConsultationId', 'AppointmentId', 'PatientId', 'DoctorId','ConsultationStatus', 'Diagnosis', 'Symptoms', 'Remarks',
        'prescription_details', 'lab_prescription_details')

class PrescriptionItemWriteSerializer(serializers.ModelSerializer):
    Frequency = serializers.CharField(max_length=30, validators=[frequency_validation])

    class Meta:
        model = PrescriptionItem
        fields = ('MedicineId', 'DosageId', 'Duration', 'Frequency')


class PrescriptionCreateSerializer(serializers.ModelSerializer):
    items = PrescriptionItemWriteSerializer(many=True, write_only=True)

    class Meta:
        model = Prescription
        fields = ('ConsultationId', 'PatientId', 'DoctorId', 'PrescriptionDateTime', 'Status', 'items')

    def create(self, validated_data):

        items_data = validated_data.pop('items')

        prescription = Prescription.objects.create(**validated_data)

        for item_data in items_data:
            PrescriptionItem.objects.create(PrescriptionId=prescription, **item_data)

        return prescription

    def to_representation(self, instance):
        return PrescriptionSerializer(instance).data