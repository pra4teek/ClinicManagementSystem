import os
import sys
import django
from datetime import date, datetime, timedelta
from decimal import Decimal

# Setup django environment
sys.path.append(os.path.dirname(os.path.abspath(__file__)))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'clinicmanagementsystem.settings')
django.setup()

from django.utils import timezone
from apibackendapp.models import (
    Role, User, Department, Staff, Doctor, Patient, Appointment,
    Token, Dosage, MasterMedicine, LabTest, Consultation,
    Prescription, PrescriptionItem, LabPrescription, LabReport,
    PharmacyStock
)

def seed():
    print("--- Starting database seeding for Clinic Management System ---")

    # 1. ROLES
    roles_data = ['Doctor', 'Receptionist', 'Pharmacist', 'Lab Technician', 'Admin']
    role_objs = {}
    for r in roles_data:
        obj, created = Role.objects.get_or_create(RoleName=r)
        role_objs[r] = obj
        if created:
            print(f"Created Role: {r}")

    # 2. DEPARTMENTS
    depts_data = ['General Medicine', 'ENT', 'Cardiology', 'Pediatrics', 'Diagnostic Lab', 'Pharmacy']
    dept_objs = {}
    for d in depts_data:
        obj, created = Department.objects.get_or_create(DepartmentName=d)
        dept_objs[d] = obj
        if created:
            print(f"Created Department: {d}")

    # 3. USERS
    users_data = [
        ('prateek', 'prateek123', 'Doctor'),
        ('Dr.Arun', 'arun123', 'Doctor'),
        ('reception', '123', 'Receptionist'),
        ('pharma', '123', 'Pharmacist'),
        ('labtech', '123', 'Lab Technician'),
        ('admin', '123', 'Admin')
    ]
    user_objs = {}
    for u, p, r in users_data:
        obj, created = User.objects.get_or_create(
            Username=u,
            defaults={'Password': p, 'RoleId': role_objs[r], 'isActive': True}
        )
        user_objs[u] = obj
        if created:
            print(f"Created User: {u} ({r})")

    # 4. STAFF PROFILES
    staff_data = [
        ('reception', 'Joel Jain', 'Receptionist', '9876500001', '14 MG Road, Bangalore'),
        ('pharma', 'Adarsh Chandran', 'Pharmacist', '9876500002', '22 Church Street, Bangalore'),
        ('labtech', 'Malathi Sreekumar', 'Lab Technician', '9876500003', '35 Brigade Road, Bangalore'),
    ]
    staff_objs = {}
    for username, name, role_name, phone, addr in staff_data:
        u_obj = user_objs[username]
        s_obj, created = Staff.objects.get_or_create(
            UserId=u_obj,
            defaults={
                'Name': name,
                'DateofBirth': date(1992, 4, 15),
                'DateOfJoining': date(2022, 1, 10),
                'RoleId': role_objs[role_name],
                'Address': addr,
                'phoneNumber': phone
            }
        )
        staff_objs[username] = s_obj
        if created:
            print(f"Created Staff: {name}")

    # 5. DOCTORS
    doctors_data = [
        ('Dr.Arun', 'Arun', 'ENT', 'MBBS, MS (ENT)', 'Otolaryngology'),
        ('prateek', 'Prateek Pradeep', 'General Medicine', 'MBBS, MD (General Medicine)', 'Consultant Physician')
    ]
    doctor_objs = {}
    for username, doc_name, dept_name, qual, spec in doctors_data:
        u_obj = user_objs[username]
        d_obj = dept_objs[dept_name]
        doc, created = Doctor.objects.get_or_create(
            UserId=u_obj,
            defaults={
                'Name': doc_name,
                'DepartmentId': d_obj,
                'Qualification': qual,
                'Specialization': spec,
                'isActive': True
            }
        )
        doctor_objs[username] = doc
        if created:
            print(f"Created Doctor: Dr. {doc_name} ({spec})")

    # 6. PATIENTS
    patients_data = [
        ('Arjun Ravi', 'Male', date(1979, 5, 12), '9876543210', '12 MG Road, Bangalore', 'O+', 70.0, 175.0),
        ('Rohit Krishna', 'Male', date(1995, 8, 22), '9845123456', '45 Indiranagar, Bangalore', 'A+', 68.0, 172.0),
        ('Priya Nair', 'Female', date(1986, 11, 4), '9895012345', '78 Koramangala, Bangalore', 'B+', 58.0, 162.0),
        ('Sneha Thomas', 'Female', date(1991, 3, 15), '9812345678', '23 Whitefield, Bangalore', 'AB+', 55.0, 160.0),
        ('Vikram Malhotra', 'Male', date(1968, 7, 30), '9822334455', '99 HSR Layout, Bangalore', 'B+', 76.0, 170.0)
    ]
    patient_objs = []
    for name, gender, dob, phone, addr, bg, wt, ht in patients_data:
        p, created = Patient.objects.get_or_create(
            PhoneNumber=phone,
            defaults={
                'Name': name,
                'Gender': gender,
                'DOB': dob,
                'Address': addr,
                'BloodGroup': bg,
                'Weight': wt,
                'Height': ht
            }
        )
        patient_objs.append(p)
        if created:
            print(f"Created Patient: {name} ({bg})")

    # 7. APPOINTMENTS & TOKENS
    receptionist_staff = staff_objs['reception']
    doc_prateek = doctor_objs['prateek']
    general_dept = dept_objs['General Medicine']
    now = timezone.now()

    appointments_data = [
        (patient_objs[0], now.replace(hour=10, minute=0, second=0), 'Scheduled'),
        (patient_objs[1], now.replace(hour=10, minute=30, second=0), 'Scheduled'),
        (patient_objs[2], now.replace(hour=11, minute=0, second=0), 'Scheduled'),
    ]

    for idx, (patient, appt_time, status) in enumerate(appointments_data, 1):
        appt, created = Appointment.objects.get_or_create(
            PatientId=patient,
            DoctorId=doc_prateek,
            AppointmentDateTime=appt_time,
            defaults={
                'ReceptionistId': receptionist_staff,
                'DepartmentId': general_dept,
                'AppointmentStatus': status
            }
        )
        if created:
            token, t_created = Token.objects.get_or_create(
                AppointmentId=appt,
                defaults={
                    'PatientId': patient,
                    'DoctorId': doc_prateek,
                    'TokenDate': appt_time
                }
            )
            print(f"Created Appointment & Token #{idx} for {patient.Name} at {appt_time.strftime('%I:%M %p')}")

    # 8. DOSAGES
    dosages_data = [
        ('500mg', 'Take with plenty of water after food'),
        ('250mg', 'Take before food'),
        ('650mg', 'Take after food for high fever'),
        ('1000mg', 'Take strictly as advised'),
        ('5ml', 'Take with measuring cup thrice daily'),
        ('10ml', 'Take with warm water after dinner'),
        ('1 tablet', 'Swallow whole with water')
    ]
    dosage_objs = {}
    for d_val, inst in dosages_data:
        d_obj, created = Dosage.objects.get_or_create(
            DosageValue=d_val,
            defaults={'Instructions': inst}
        )
        dosage_objs[d_val] = d_obj
        if created:
            print(f"Created Dosage: {d_val}")

    # 9. MASTER MEDICINES
    medicines_data = [
        ('Paracetamol 500mg', 'Cipla Ltd', 'Paracetamol', 'Analgesic / Antipyretic', Decimal('10.00'), Decimal('15.00')),
        ('Amoxicillin 500mg', 'Sun Pharma', 'Amoxicillin Trihydrate', 'Antibiotic', Decimal('15.00'), Decimal('25.00')),
        ('Cetirizine 10mg', 'Dr. Reddy Labs', 'Cetirizine HCl', 'Antihistamine', Decimal('5.00'), Decimal('10.00')),
        ('Metformin 500mg', 'USV Ltd', 'Metformin Hydrochloride', 'Antidiabetic', Decimal('12.00'), Decimal('20.00')),
        ('Omeprazole 20mg', 'Torrent Pharma', 'Omeprazole Magnesium', 'Antacid / PPI', Decimal('10.00'), Decimal('18.00')),
        ('Ibuprofen 400mg', 'Abbott Healthcare', 'Ibuprofen', 'NSAID Anti-inflammatory', Decimal('8.00'), Decimal('12.00')),
        ('Azithromycin 500mg', 'Alembic Pharma', 'Azithromycin Dihydrate', 'Broad Spectrum Antibiotic', Decimal('30.00'), Decimal('45.00')),
        ('Pantoprazole 40mg', 'Alkem Laboratories', 'Pantoprazole Sodium', 'Gastroprotective / PPI', Decimal('12.00'), Decimal('22.00')),
        ('Cough Syrup (Ascoril-D)', 'Glenmark Pharma', 'Dextromethorphan + CPM', 'Antitussive Cough Syrup', Decimal('45.00'), Decimal('75.00')),
        ('Salbutamol Inhaler 100mcg', 'Cipla Ltd', 'Salbutamol Sulfate', 'Bronchodilator Inhaler', Decimal('120.00'), Decimal('180.00')),
    ]
    med_objs = []
    for name, mfg, gen, cat, cost, mrp in medicines_data:
        m, created = MasterMedicine.objects.get_or_create(
            MedicineName=name,
            defaults={
                'Manufacturer': mfg,
                'GenericName': gen,
                'Category': cat,
                'CostValue': cost,
                'MRP': mrp,
                'isActive': True
            }
        )
        med_objs.append(m)
        if created:
            print(f"Created Master Medicine: {name} (MRP: Rs.{mrp})")

        # 10. PHARMACY STOCKS
        stock, s_created = PharmacyStock.objects.get_or_create(
            Medicine=m,
            defaults={
                'QuantityOnHand': 50,
                'UnitPrice': cost,
                'SellingPrice': mrp,
                'ReorderLevel': 10
            }
        )
        if s_created:
            print(f"  -> Added 50 units in Pharmacy Stock for {name}")

    # 11. LAB TESTS
    lab_tests_data = [
        ('Complete Blood Count (CBC)', '4.5-5.5 M/uL (RBC), 4.0-11.0 K/uL (WBC)', Decimal('300.00')),
        ('Fasting Blood Sugar (FBS)', '70-99 mg/dL', Decimal('150.00')),
        ('Lipid Profile', 'Total Cholesterol < 200 mg/dL, Triglycerides < 150 mg/dL', Decimal('650.00')),
        ('Urine Routine Examination', 'Clear / Pale Yellow, Nil Protein, Nil Sugar', Decimal('200.00')),
        ('Thyroid Profile (T3, T4, TSH)', 'TSH: 0.4 - 4.2 uIU/mL', Decimal('550.00')),
        ('Chest X-Ray PA View', 'Normal cardiothoracic ratio, clear bilateral lung fields', Decimal('500.00')),
        ('Serum Creatinine', '0.7 - 1.3 mg/dL', Decimal('180.00')),
        ('Liver Function Test (LFT)', 'Bilirubin < 1.2 mg/dL, SGOT/AST < 40 U/L, SGPT/ALT < 56 U/L', Decimal('750.00'))
    ]
    lab_test_objs = []
    lab_dept = dept_objs['Diagnostic Lab']
    for test_name, normal_ref, cost in lab_tests_data:
        t, created = LabTest.objects.get_or_create(
            TestName=test_name,
            defaults={
                'DepartmentId': lab_dept,
                'NormalName': normal_ref,
                'TestCost': cost,
                'isActive': True
            }
        )
        lab_test_objs.append(t)
        if created:
            print(f"Created Lab Test: {test_name} (Cost: Rs.{cost})")

    # 12. COMPLETED CONSULTATION & PRESCRIPTION (For history)
    past_appt, p_created = Appointment.objects.get_or_create(
        PatientId=patient_objs[4], # Vikram Malhotra
        DoctorId=doc_prateek,
        AppointmentDateTime=now - timedelta(days=2),
        defaults={
            'ReceptionistId': receptionist_staff,
            'DepartmentId': general_dept,
            'AppointmentStatus': 'Completed'
        }
    )

    cons, c_created = Consultation.objects.get_or_create(
        AppointmentId=past_appt,
        defaults={
            'PatientId': patient_objs[4],
            'DoctorId': doc_prateek,
            'ConsultationStatus': 'Completed',
            'Diagnosis': 'Hypertension Grade 1 & Acid Peptic Disease',
            'Symptoms': 'Occasional occipital headaches and post-prandial heartburn',
            'Remarks': 'Low salt diet, morning walks, avoid spicy meals and follow up after 2 weeks'
        }
    )
    if c_created:
        print(f"Created Completed Consultation for {patient_objs[4].Name}")

        # Add Prescription
        rx, r_created = Prescription.objects.get_or_create(
            ConsultationId=cons,
            defaults={
                'PatientId': patient_objs[4],
                'DoctorId': doc_prateek,
                'PrescriptionDateTime': now - timedelta(days=2),
                'Status': 'Dispensed'
            }
        )
        if r_created:
            PrescriptionItem.objects.get_or_create(
                PrescriptionId=rx,
                MedicineId=med_objs[4], # Omeprazole
                defaults={
                    'DosageId': dosage_objs['1 tablet'],
                    'Duration': '14 Days',
                    'Frequency': '1-0-0'
                }
            )
            print(f"  -> Prescribed Omeprazole 20mg for {patient_objs[4].Name}")

        # Add Lab Prescription
        lab_rx, l_created = LabPrescription.objects.get_or_create(
            ConsultationId=cons,
            defaults={
                'LabTestId': lab_test_objs[2], # Lipid Profile
                'PatientId': patient_objs[4],
                'DoctorId': doc_prateek,
                'Status': 'Completed',
                'SampleType': 'Venous Blood',
                'LabTestDate': now - timedelta(days=2)
            }
        )
        if l_created:
            LabReport.objects.get_or_create(
                LabPrescriptionId=lab_rx,
                defaults={
                    'LabTechnician': staff_objs['labtech'],
                    'ReportDate': now - timedelta(days=1),
                    'ActualReading': 'Total Cholesterol: 215 mg/dL (High), HDL: 42 mg/dL, Triglycerides: 165 mg/dL',
                    'remarks': 'Mild dyslipidemia noted. Advised dietary modifications and physical activity.'
                }
            )
            print(f"  -> Generated Verified Lab Report for {patient_objs[4].Name}")

    print("--- SUCCESS: Database successfully populated with realistic data! ---")

if __name__ == '__main__':
    seed()
