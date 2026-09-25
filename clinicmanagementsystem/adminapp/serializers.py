from rest_framework import serializers

from apibackendapp.models import (
    User,
    Role,
    Department,
    Staff,
    Doctor,
    LabTest,
    MasterMedicine,
    AuditLog
)


class UserSerializer(serializers.ModelSerializer):

    class Meta:
        model = User
        fields = '__all__'
        extra_kwargs = {
            'Password': {'write_only': True}
        }

    def validate_Username(self, value):
        if not value.strip():
            raise serializers.ValidationError("Username cannot be empty.")

        if len(value) < 3:
            raise serializers.ValidationError(
                "Username must contain at least 3 characters."
            )

        return value

    def validate_Password(self, value):
        if not value.strip():
            raise serializers.ValidationError("Password cannot be empty.")

        if len(value) < 4:
            raise serializers.ValidationError(
                "Password must contain at least 4 characters."
            )

        return value


class RoleSerializer(serializers.ModelSerializer):

    class Meta:
        model = Role
        fields = '__all__'

    def validate_RoleName(self, value):
        if not value.strip():
            raise serializers.ValidationError(
                "Role name cannot be empty."
            )

        return value


class DepartmentSerializer(serializers.ModelSerializer):

    class Meta:
        model = Department
        fields = '__all__'

    def validate_DepartmentName(self, value):
        if not value.strip():
            raise serializers.ValidationError(
                "Department name cannot be empty."
            )

        return value


class StaffSerializer(serializers.ModelSerializer):

    class Meta:
        model = Staff
        fields = '__all__'

    def validate_Name(self, value):
        if not value.strip():
            raise serializers.ValidationError(
                "Staff name cannot be empty."
            )

        return value

    def validate_phoneNumber(self, value):
        if not value.isdigit():
            raise serializers.ValidationError(
                "Phone number must contain only numbers."
            )

        if len(value) != 10:
            raise serializers.ValidationError(
                "Phone number must contain 10 digits."
            )

        return value


class DoctorSerializer(serializers.ModelSerializer):

    class Meta:
        model = Doctor
        fields = '__all__'

    def validate_Name(self, value):
        if not value.strip():
            raise serializers.ValidationError(
                "Doctor name cannot be empty."
            )

        return value


class LabTestSerializer(serializers.ModelSerializer):

    class Meta:
        model = LabTest
        fields = '__all__'

    def validate_TestName(self, value):
        if not value.strip():
            raise serializers.ValidationError(
                "Test name cannot be empty."
            )

        return value

    def validate_TestCost(self, value):
        if value < 0:
            raise serializers.ValidationError(
                "Test cost cannot be negative."
            )

        return value


class MasterMedicineSerializer(serializers.ModelSerializer):

    class Meta:
        model = MasterMedicine
        fields = '__all__'

    def validate_MedicineName(self, value):
        if not value.strip():
            raise serializers.ValidationError(
                "Medicine name cannot be empty."
            )

        return value

    def validate_CostValue(self, value):
        if value < 0:
            raise serializers.ValidationError(
                "Cost value cannot be negative."
            )

        return value

    def validate_MRP(self, value):
        if value < 0:
            raise serializers.ValidationError(
                "MRP cannot be negative."
            )

        return value


class AuditLogSerializer(serializers.ModelSerializer):

    class Meta:
        model = AuditLog
        fields = '__all__'