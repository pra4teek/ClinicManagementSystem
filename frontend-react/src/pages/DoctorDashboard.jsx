import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import doctorService from '../services/doctorService';
import appointmentService from '../services/appointmentService';

export default function DoctorDashboard() {
  const [appointments, setAppointments] = useState([]);
  const [selectedAppt, setSelectedAppt] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadQueue();
  }, []);

  const loadQueue = async () => {
    try {
      setLoading(true);
      const data = await appointmentService.getAllAppointments();
      setAppointments(Array.isArray(data) ? data : []);
    } catch (err) {
      console.warn('API offline, showing placeholder queue');
      setAppointments([
        { id: 1, tokenNumber: 1, patientName: 'Arjun Ravi', time: '10:00 AM', AppointmentStatus: 'Scheduled', reason: 'Fever and headache' },
        { id: 2, tokenNumber: 2, patientName: 'Rohit Krishna', time: '10:30 AM', AppointmentStatus: 'Scheduled', reason: 'Throat irritation' },
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--text-main)' }}>
            Doctor Workspace
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
            Consultation management, patient queue, and clinical diagnosis.
          </p>
        </div>
        <Link to="/consultations/new" className="btn btn-primary">
          + Start Consultation
        </Link>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '320px 1fr', gap: '1.5rem' }}>
        {/* Patient Queue Card */}
        <div className="card">
          <div className="card-header">
            <h2 className="card-title">Patient Queue</h2>
            <span className="badge badge-scheduled">{appointments.length} Patients</span>
          </div>
          <div className="card-body" style={{ padding: '0.75rem' }}>
            {appointments.length === 0 ? (
              <p style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '1rem' }}>No appointments</p>
            ) : (
              appointments.map((a) => (
                <div
                  key={a.id || a.tokenNumber}
                  className={`queue-card ${selectedAppt?.id === a.id ? 'active' : ''}`}
                  onClick={() => setSelectedAppt(a)}
                  style={{
                    padding: '0.75rem',
                    border: '1px solid var(--border)',
                    borderRadius: 'var(--radius-sm)',
                    marginBottom: '0.5rem',
                    cursor: 'pointer',
                    background: selectedAppt?.id === a.id ? 'var(--primary-light)' : 'var(--bg-card)'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <strong>Token #{a.tokenNumber}</strong>
                    <span className="badge badge-scheduled">{a.AppointmentStatus || a.status || 'Scheduled'}</span>
                  </div>
                  <div style={{ fontWeight: 600, marginTop: '0.25rem' }}>{a.patientName}</div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{a.time} · {a.reason}</div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Examination workspace */}
        <div className="card">
          <div className="card-header">
            <h2 className="card-title">
              {selectedAppt ? `Consultation: ${selectedAppt.patientName}` : 'Clinical Examination'}
            </h2>
          </div>
          <div className="card-body" style={{ padding: '2rem' }}>
            {selectedAppt ? (
              <div>
                <div style={{ background: 'var(--primary-subtle)', padding: '1rem', borderRadius: 'var(--radius-sm)', marginBottom: '1.5rem' }}>
                  <strong>Selected: </strong> {selectedAppt.patientName} (Token #{selectedAppt.tokenNumber}) — <em>{selectedAppt.reason}</em>
                </div>
                <Link to={`/consultations/new?patientId=${selectedAppt.id}`} className="btn btn-primary">
                  Proceed to Fill Vitals & Prescription →
                </Link>
              </div>
            ) : (
              <div style={{ textAlign: 'center', color: 'var(--text-muted)' }}>
                <p>Select a patient from the queue to start clinical examination.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

