from django.test import TestCase

# Create your tests here.
from datetime import date

from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase

from apibackendapp.models import (
    Role,
    User,
    Department,
    Staff,
    Doctor,
    Patient,
)


class PatientAPITestCase(APITestCase):

    def setUp(self):
        self.patient_url = reverse("patient-list")

    def test_create_patient(self):
        data = {
            "Name": "Test Patient",
            "Gender": "Male",
            "DOB": "2000-01-15",
            "PhoneNumber": "9000000001",
            "Address": "Pathanamthitta",
            "BloodGroup": "O+",
            "Weight": 65,
            "Height": 170,
        }

        response = self.client.post(
            self.patient_url,
            data,
            format="json",
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_201_CREATED,
        )

        self.assertIn("PatientId", response.data)
        self.assertEqual(
            response.data["Name"],
            "Test Patient",
        )

    def test_patient_name_cannot_contain_numbers(self):
        data = {
            "Name": "Test123",
            "Gender": "Male",
            "DOB": "2000-01-15",
            "PhoneNumber": "9000000001",
            "Address": "Pathanamthitta",
            "BloodGroup": "O+",
            "Weight": 65,
            "Height": 170,
        }

        response = self.client.post(
            self.patient_url,
            data,
            format="json",
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_400_BAD_REQUEST,
        )

    def test_future_dob_is_rejected(self):
        data = {
            "Name": "Test Patient",
            "Gender": "Male",
            "DOB": "2030-01-01",
            "PhoneNumber": "9000000001",
            "Address": "Pathanamthitta",
            "BloodGroup": "O+",
            "Weight": 65,
            "Height": 170,
        }

        response = self.client.post(
            self.patient_url,
            data,
            format="json",
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_400_BAD_REQUEST,
        )

    def test_patient_over_100_years_is_rejected(self):
        old_year = date.today().year - 101

        data = {
            "Name": "Test Patient",
            "Gender": "Male",
            "DOB": f"{old_year}-01-01",
            "PhoneNumber": "9000000001",
            "Address": "Pathanamthitta",
            "BloodGroup": "O+",
            "Weight": 65,
            "Height": 170,
        }

        response = self.client.post(
            self.patient_url,
            data,
            format="json",
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_400_BAD_REQUEST,
        )

    def test_patient_search(self):
        Patient.objects.create(
            Name="Search Patient",
            Gender="Male",
            DOB="2000-01-15",
            PhoneNumber="9000000002",
            Address="Kochi",
            BloodGroup="O+",
            Weight=65,
            Height=170,
        )

        response = self.client.get(
            self.patient_url,
            {"search": "Search Patient"},
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_200_OK,
        )

        self.assertEqual(
            len(response.data),
            1,
        )


class AppointmentAPITestCase(APITestCase):

    def setUp(self):
        self.appointment_url = reverse("appointment-list")

        role = Role.objects.create(
            RoleName="Receptionist"
        )

        user = User.objects.create(
            Username="receptionist_test",
            Password="testpassword",
            RoleId=role,
        )

        staff = Staff.objects.create(
            UserId=user,
            Name="Receptionist Test",
            DateofBirth="1995-01-01",
            DateOfJoining="2024-01-01",
            RoleId=role,
            Address="Pathanamthitta",
            phoneNumber="9000000010",
        )

        department = Department.objects.create(
            DepartmentName="General Medicine"
        )

        doctor_user = User.objects.create(
            Username="doctor_test",
            Password="testpassword",
            RoleId=role,
        )

        doctor = Doctor.objects.create(
            Name="Doctor Test",
            UserId=doctor_user,
            DepartmentId=department,
            Qualification="MBBS",
            Specialization="General Medicine",
        )

        patient = Patient.objects.create(
            Name="Appointment Patient",
            Gender="Male",
            DOB="2000-01-15",
            PhoneNumber="9000000011",
            Address="Pathanamthitta",
            BloodGroup="O+",
            Weight=65,
            Height=170,
        )

        self.staff = staff
        self.department = department
        self.doctor = doctor
        self.patient = patient

    def test_create_appointment(self):
        data = {
            "PatientId": self.patient.PatientId,
            "ReceptionistId": self.staff.StaffId,
            "DoctorId": self.doctor.DoctorId,
            "DepartmentId": self.department.DepartmentId,
            "AppointmentDateTime": "2026-09-12T10:00:00",
        }

        response = self.client.post(
            self.appointment_url,
            data,
            format="json",
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_201_CREATED,
        )

        self.assertEqual(
            response.data["PatientId"],
            self.patient.PatientId,
        )

        self.assertEqual(
            response.data["DoctorId"],
            self.doctor.DoctorId,
        )

    def test_doctor_department_mismatch_is_rejected(self):
        another_department = Department.objects.create(
            DepartmentName="Cardiology"
        )

        data = {
            "PatientId": self.patient.PatientId,
            "ReceptionistId": self.staff.StaffId,
            "DoctorId": self.doctor.DoctorId,
            "DepartmentId": another_department.DepartmentId,
            "AppointmentDateTime": "2026-09-12T10:00:00",
        }

        response = self.client.post(
            self.appointment_url,
            data,
            format="json",
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_400_BAD_REQUEST,
        )  