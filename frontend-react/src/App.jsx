import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import AppLayout from './components/AppLayout';
import ProtectedRoute from './components/ProtectedRoute';

// Pages
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';

// Doctor Module
import DoctorDashboard from './pages/DoctorDashboard';
import ConsultationForm from './pages/ConsultationForm';
import ConsultationList from './pages/ConsultationList';
import PrescriptionList from './pages/PrescriptionList';

// Receptionist Module
import AppointmentList from './pages/AppointmentList';
import AppointmentForm from './pages/AppointmentForm';
import PatientList from './pages/PatientList';
import PatientForm from './pages/PatientForm';

// Pharmacist Module
import PharmacistDashboard from './pages/PharmacistDashboard';
import MedicineList from './pages/MedicineList';
import MedicineForm from './pages/MedicineForm';

// Lab Technician Module
import LabTestList from './pages/LabTestList';
import LabReportForm from './pages/LabReportForm';

// Admin Module
import DepartmentList from './pages/DepartmentList';
import DepartmentForm from './pages/DepartmentForm';

import './styles/style.css';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public Login Route */}
        <Route path="/login" element={<Login />} />
        <Route path="/" element={<Navigate to="/dashboard" replace />} />

        {/* Protected Application Routes */}
        <Route element={<ProtectedRoute />}>
          {/* Doctor Module has its own full-screen layout with dark sidebar matching original frontend/doctor */}
          <Route path="/doctor" element={<DoctorDashboard />} />

          {/* Pharmacist Module has its own full-screen layout with dark navy sidebar matching Doctor & Lab */}
          <Route path="/pharmacist" element={<PharmacistDashboard />} />
          <Route path="/medicines" element={<PharmacistDashboard />} />

          {/* Shared AppLayout for other modules */}
          <Route element={<AppLayout />}>
            <Route path="/dashboard" element={<Dashboard />} />
            
            {/* Doctor Supporting Pages for course requirements */}
            <Route path="/consultations" element={<ConsultationList />} />
            <Route path="/consultations/new" element={<ConsultationForm />} />
            <Route path="/prescriptions" element={<PrescriptionList />} />

            {/* Receptionist Routes */}
            <Route path="/appointments" element={<AppointmentList />} />
            <Route path="/appointments/new" element={<AppointmentForm />} />
            <Route path="/patients" element={<PatientList />} />
            <Route path="/patients/new" element={<PatientForm />} />

            {/* Pharmacist Routes */}
            <Route path="/medicines" element={<MedicineList />} />
            <Route path="/medicines/new" element={<MedicineForm />} />

            {/* Lab Technician Routes */}
            <Route path="/lab-tests" element={<LabTestList />} />
            <Route path="/lab-reports/new" element={<LabReportForm />} />

            {/* Admin Routes */}
            <Route path="/departments" element={<DepartmentList />} />
            <Route path="/departments/new" element={<DepartmentForm />} />
          </Route>
        </Route>

        <Route path="*" element={<h2 style={{ padding: '2rem', textAlign: 'center' }}>404 - Page Not Found</h2>} />
      </Routes>
    </BrowserRouter>
  );
}
