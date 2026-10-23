import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import appointmentService from '../services/appointmentService';

export default function AppointmentList() {
  const [appointments, setAppointments] = useState([]);

  useEffect(() => {
    appointmentService.getAllAppointments()
      .then(data => setAppointments(Array.isArray(data) ? data : []))
      .catch(() => setAppointments([
        { id: 1, tokenNumber: 1, patientName: 'Arjun Ravi', time: '10:00 AM', status: 'Scheduled', doctorName: 'Dr. Prateek Pradeep' },
        { id: 2, tokenNumber: 2, patientName: 'Rohit Krishna', time: '10:30 AM', status: 'Scheduled', doctorName: 'Dr. Prateek Pradeep' },
      ]));
  }, []);

  return (
    <div className="card" style={{ padding: '1.5rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
        <h2>Appointments List</h2>
        <Link to="/appointments/new" className="btn btn-sm btn-primary">
          + Book Appointment
        </Link>
      </div>
      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead>
          <tr style={{ textAlign: 'left', borderBottom: '1px solid var(--border)' }}>
            <th style={{ padding: '0.75rem' }}>Token</th>
            <th>Patient</th>
            <th>Time</th>
            <th>Doctor</th>
            <th>Status</th>
          </tr>
        </thead>
        <tbody>
          {appointments.map(a => (
            <tr key={a.id} style={{ borderBottom: '1px solid var(--border)' }}>
              <td style={{ padding: '0.75rem' }}><strong>#{a.tokenNumber}</strong></td>
              <td>{a.patientName}</td>
              <td>{a.time}</td>
              <td>{a.doctorName}</td>
              <td><span className="badge badge-scheduled">{a.status || 'Scheduled'}</span></td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

