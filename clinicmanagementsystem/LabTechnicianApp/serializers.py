from rest_framework import serializers
from apibackendapp.models import LabReport,LabTest,LabPrescription


class LabReportSerializer(serializers.ModelSerializer):
    class Meta:
        model = LabReport
        fields = '__all__'
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
    class Meta:
        model=LabPrescription
        fields='__all__'
        
    def validate_SampleType(self,value):
        if not value.strip():
            raise serializers.ValidationError("Sample type cannot be empty.")
        if len(value)<3:
            raise serializers.ValidationError("Sample type must contain at least 3 characters.")
        return value