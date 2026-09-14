from rest_framework import serializers
from datetime import date
import re
from apibackendapp.models import (
    Patient,
    Appointment,
    Token,
    Bill,
    Payment,
)


# ---------- Validation helper functions (same style as reference project) ----------

def name_validation(value):
    value = value.strip()
    if len(value) < 3 or not re.match(r"^[A-Za-z ]+$", value):
        raise serializers.ValidationError(
            "Name must be at least 3 characters and contain only letters and spaces."
        )
    return value


def phone_validation(value):
    value = value.strip()
    if not value.isdigit():
        raise serializers.ValidationError("Phone number must contain only digits.")
    if not (7 <= len(value) <= 15):
        raise serializers.ValidationError("Phone number must be between 7 and 15 digits.")
    return value


def dob_validation(value):
    today = date.today()
    if value > today:
        raise serializers.ValidationError("Date of birth cannot be in the future.")
    age = today.year - value.year
    if (today.month, today.day) < (value.month, value.day):
        age -= 1
    if age > 100:
        raise serializers.ValidationError("Patient age must be between 0 and 100 years.")
    return value


# ---------- Serializers ----------

class PatientSerializer(serializers.ModelSerializer):
    Name = serializers.CharField(max_length=100, validators=[name_validation])
    PhoneNumber = serializers.CharField(max_length=15, validators=[phone_validation])
    DOB = serializers.DateField(validators=[dob_validation])

    class Meta:
        model = Patient
        fields = [
            "PatientId",
            "Name",
            "Gender",
            "DOB",
            "PhoneNumber",
            "Address",
            "BloodGroup",
            "Weight",
            "Height",
        ]
        read_only_fields = ["PatientId"]

    def validate(self, data):
        weight = data.get("Weight")
        height = data.get("Height")

        if weight is not None and weight <= 0:
            raise serializers.ValidationError({"Weight": "Weight must be greater than 0."})
        if height is not None and height <= 0:
            raise serializers.ValidationError({"Height": "Height must be greater than 0."})
        return data


class AppointmentSerializer(serializers.ModelSerializer):
    class Meta:
        model = Appointment
        fields = [
            "AppointmentId",
            "PatientId",
            "ReceptionistId",
            "DoctorId",
            "DepartmentId",
            "AppointmentStatus",
            "AppointmentDateTime",
        ]
        read_only_fields = ["AppointmentId", "AppointmentStatus"]

    def validate(self, data):
        doctor = data.get("DoctorId")
        department = data.get("DepartmentId")

        # Doctor must belong to the selected department (business rule)
        if doctor and department:
            if doctor.DepartmentId_id != department.DepartmentId:
                raise serializers.ValidationError(
                    "Selected doctor does not belong to the selected department."
                )
        return data


class TokenSerializer(serializers.ModelSerializer):
    class Meta:
        model = Token
        fields = [
            "TokenNo",
            "AppointmentId",
            "PatientId",
            "DoctorId",
            "TokenDate",
        ]
        read_only_fields = ["TokenNo", "TokenDate"]

    def validate(self, data):
        appointment = data.get("AppointmentId")
        patient = data.get("PatientId")
        doctor = data.get("DoctorId")

        if appointment:
            if patient and appointment.PatientId_id != patient.PatientId:
                raise serializers.ValidationError(
                    "Patient does not match the selected appointment."
                )
            if doctor and appointment.DoctorId_id != doctor.DoctorId:
                raise serializers.ValidationError(
                    "Doctor does not match the selected appointment."
                )
        return data


class BillSerializer(serializers.ModelSerializer):
    class Meta:
        model = Bill
        fields = [
            "BillId",
            "PatientId",
            "BillDate",
            "Amount",
            "BillStatus",
            "BillType",
        ]
        read_only_fields = ["BillId"]

    def validate_Amount(self, value):
        if value <= 0:
            raise serializers.ValidationError("Bill amount must be greater than 0.")
        return value


class PaymentSerializer(serializers.ModelSerializer):
    class Meta:
        model = Payment
        fields = [
            "PaymentId",
            "BillId",
            "Amount",
            "PaymentMethod",
            "PaymentDate",
            "PaymentStatus",
        ]
        read_only_fields = ["PaymentId"]

    def validate_Amount(self, value):
        if value <= 0:
            raise serializers.ValidationError("Payment amount must be greater than 0.")
        return value

    def validate(self, data):
        bill = data.get("BillId")
        amount = data.get("Amount")

        if bill and amount:
            if amount > bill.Amount:
                raise serializers.ValidationError(
                    "Payment amount cannot exceed the bill amount."
                )
        return data