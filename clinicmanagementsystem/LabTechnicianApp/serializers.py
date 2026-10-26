from rest_framework import serializers
from apibackendapp.models import LabReport,LabTest,LabPrescription


class LabReportSerializer(serializers.ModelSerializer):
    PatientName = serializers.SerializerMethodField()
    DoctorName = serializers.SerializerMethodField()
    TestName = serializers.SerializerMethodField()
    NormalName = serializers.SerializerMethodField()
    SampleType = serializers.SerializerMethodField()

    class Meta:
        model = LabReport
        fields = (
            'ReportId',
            'LabPrescriptionId',
            'LabTechnician',
            'ReportDate',
            'ActualReading',
            'remarks',
            'PatientName',
            'DoctorName',
            'TestName',
            'NormalName',
            'SampleType',
        )

    def get_PatientName(self, obj):
        prescription = obj.LabPrescriptionId
        patient = prescription.PatientId if prescription else None
        return patient.Name if patient else ''

    def get_DoctorName(self, obj):
        prescription = obj.LabPrescriptionId
        doctor = prescription.DoctorId if prescription else None
        return doctor.Name if doctor else ''

    def get_TestName(self, obj):
        prescription = obj.LabPrescriptionId
        test = prescription.LabTestId if prescription else None
        return test.TestName if test else ''

    def get_NormalName(self, obj):
        prescription = obj.LabPrescriptionId
        test = prescription.LabTestId if prescription else None
        return test.NormalName if test else ''

    def get_SampleType(self, obj):
        prescription = obj.LabPrescriptionId
        return prescription.SampleType if prescription else ''

    def validate_ActualReading(self,value):
        if not value.strip():
            raise serializers.ValidationError("Actual reading cannot be empty.")
        return value
    def validate_remarks(self,value):
        if not value.strip():
            raise serializers.ValidationError("Remarks cannot be empty.")
        return value


class LabTestSerializer(serializers.ModelSerializer):
    class Meta:
        model = LabTest
        fields = '__all__'
    def validate_NormalName(self,value):
        value=value.strip()
        if not value:
            raise serializers.ValidationError("Normal value cannot be empty.")
        if value.isdigit():
            raise serializers.ValidationError("Normal name cannot contain only numbers.")
        return value
    def validate_TestCost(self,value):
        if value<=0:
            raise serializers.ValidationError("Test cost must be greater than 0.")
        return value
class LabPrescriptionSerializer(serializers.ModelSerializer):
    PatientName = serializers.SerializerMethodField()
    DoctorName = serializers.SerializerMethodField()
    TestName = serializers.SerializerMethodField()
    NormalName = serializers.SerializerMethodField()
    TestCost = serializers.SerializerMethodField()

    class Meta:
        model=LabPrescription
        fields = (
            'LabPrescriptionId',
            'LabTestId',
            'PatientId',
            'DoctorId',
            'ConsultationId',
            'Status',
            'SampleType',
            'LabTestDate',
            'PatientName',
            'DoctorName',
            'TestName',
            'NormalName',
            'TestCost',
        )

    def get_PatientName(self, obj):
        return obj.PatientId.Name if obj.PatientId else ''

    def get_DoctorName(self, obj):
        return obj.DoctorId.Name if obj.DoctorId else ''

    def get_TestName(self, obj):
        return obj.LabTestId.TestName if obj.LabTestId else ''

    def get_NormalName(self, obj):
        return obj.LabTestId.NormalName if obj.LabTestId else ''

    def get_TestCost(self, obj):
        return obj.LabTestId.TestCost if obj.LabTestId else None
        
    def validate_SampleType(self,value):
        if not value.strip():
            raise serializers.ValidationError("Sample type cannot be empty.")
        if len(value)<3:
            raise serializers.ValidationError("Sample type must contain at least 3 characters.")
        return value


class LabPrescriptionStatusSerializer(serializers.ModelSerializer):
    class Meta:
        model = LabPrescription
        fields = ('Status',)

    def validate_Status(self, value):
        allowed_next = {
            'Pending': {'Pending', 'Sample collected', 'In Progress', 'Cancelled'},
            'Sample collected': {'Sample collected', 'In Progress', 'Cancelled'},
            'In Progress': {'In Progress', 'Cancelled'},
            'Completed': {'Completed'},
            'Cancelled': {'Cancelled'},
        }
        current = self.instance.Status if self.instance else 'Pending'
        if value == 'Completed' and current != 'Completed':
            raise serializers.ValidationError('Submit the report to complete a lab order.')
        if value not in allowed_next.get(current, set()):
            raise serializers.ValidationError(f'Cannot change a lab order from {current} to {value}.')
        return value
