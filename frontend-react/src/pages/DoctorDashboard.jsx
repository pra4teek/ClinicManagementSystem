import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import doctorService from '../services/doctorService';
import authService from '../services/authService';
import {
  StethoscopeIcon,
  ClipboardIcon,
  PillIcon,
  RefreshIcon,
  ArrowRightIcon
} from '../components/Icons';

export default function DoctorDashboard() {
  const navigate = useNavigate();
  const currentUser = authService.getCurrentUser() || { name: 'Dr. Prateek Pradeep', role: 'Doctor' };

  const [appointments, setAppointments] = useState([]);
  const [selectedAppt, setSelectedAppt] = useState(null);
  const [filter, setFilter] = useState('all');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadQueue();
  }, []);

  const loadQueue = async () => {
    try {
      setLoading(true);
      const data = await doctorService.getAppointments();
      setAppointments(data);
      if (data.length > 0 && !selectedAppt) {
        setSelectedAppt(data[0]);
      }
    } catch (err) {
      console.error('Failed to load queue:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (appointmentId, newStatus) => {
    const updated = await doctorService.updateAppointmentStatus(appointmentId, newStatus);
    setAppointments(updated);
    if (selectedAppt && (selectedAppt.appointmentId === appointmentId || selectedAppt.id === appointmentId)) {
      setSelectedAppt({ ...selectedAppt, status: newStatus });
    }
  };

  const startConsultation = (appt) => {
    navigate(`/consultations/new?appointmentId=${appt.appointmentId || appt.id}`);
  };

  // Filtered queue
  const filteredAppointments = appointments.filter((a) => {
    if (filter === 'waiting') return a.status === 'Waiting';
    if (filter === 'in-consultation') return a.status === 'In-Consultation';
    if (filter === 'completed') return a.status === 'Completed';
    return true;
  });

  // Counters for filter badges
  const totalCount = appointments.length;
  const waitingCount = appointments.filter((a) => a.status === 'Waiting').length;
  const inConsultCount = appointments.filter((a) => a.status === 'In-Consultation').length;
  const completedCount = appointments.filter((a) => a.status === 'Completed').length;

  return (
    <div>
      {/* Doctor Header Banner */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
            <StethoscopeIcon size={24} color="var(--primary)" />
            Doctor Clinical Workspace
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginTop: '0.2rem' }}>
            Consulting Physician: <strong style={{ color: 'var(--primary)' }}>{currentUser.name || 'Dr. Prateek Pradeep'}</strong> &bull; General Medicine (Room 102)
          </p>
        </div>
        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <Link to="/consultations" className="btn btn-outline btn-sm" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}>
            <ClipboardIcon size={14} />
            Past Consultations
          </Link>
          <Link to="/prescriptions" className="btn btn-outline btn-sm" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}>
            <PillIcon size={14} />
            Prescriptions Directory
          </Link>
          <Link to="/consultations/new" className="btn btn-primary btn-sm" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}>
            + New Consultation
          </Link>
        </div>
      </div>

      {/* Main Workspace: Left Column (Queue) + Right Column (Selected Patient Inspection) */}
      <div style={{ display: 'grid', gridTemplateColumns: '360px 1fr', gap: '1.5rem' }}>
        
        {/* Patient Queue Card */}
        <div className="card" style={{ padding: '1.25rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <h3 style={{ fontSize: '1.05rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              Patient Queue
            </h3>
            <button
              onClick={loadQueue}
              className="btn btn-sm btn-outline"
              title="Refresh Queue"
              style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem', padding: '0.25rem 0.55rem', fontSize: '0.75rem' }}
            >
              <RefreshIcon size={12} />
              Refresh
            </button>
          </div>

          {/* Filter Pills */}
          <div style={{ display: 'flex', gap: '0.35rem', marginBottom: '1rem', flexWrap: 'wrap' }}>
            <button
              className={`btn btn-sm ${filter === 'all' ? 'btn-primary' : 'btn-outline'}`}
              style={{ padding: '0.25rem 0.6rem', fontSize: '0.75rem' }}
              onClick={() => setFilter('all')}
            >
              All ({totalCount})
            </button>
            <button
              className={`btn btn-sm ${filter === 'waiting' ? 'btn-primary' : 'btn-outline'}`}
              style={{ padding: '0.25rem 0.6rem', fontSize: '0.75rem' }}
              onClick={() => setFilter('waiting')}
            >
              Waiting ({waitingCount})
            </button>
            <button
              className={`btn btn-sm ${filter === 'in-consultation' ? 'btn-primary' : 'btn-outline'}`}
              style={{ padding: '0.25rem 0.6rem', fontSize: '0.75rem' }}
              onClick={() => setFilter('in-consultation')}
            >
              Active ({inConsultCount})
            </button>
            <button
              className={`btn btn-sm ${filter === 'completed' ? 'btn-primary' : 'btn-outline'}`}
              style={{ padding: '0.25rem 0.6rem', fontSize: '0.75rem' }}
              onClick={() => setFilter('completed')}
            >
              Done ({completedCount})
            </button>
          </div>

          {/* Queue List */}
          {loading ? (
            <p style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '2rem' }}>Loading patient queue...</p>
          ) : filteredAppointments.length === 0 ? (
            <p style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '2rem' }}>No patients found for this filter.</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
              {filteredAppointments.map((appt) => {
                const isSelected = selectedAppt && (selectedAppt.appointmentId === appt.appointmentId || selectedAppt.id === appt.id);
                return (
                  <div
                    key={appt.appointmentId || appt.id}
                    onClick={() => setSelectedAppt(appt)}
                    style={{
                      padding: '0.85rem 1rem',
                      borderRadius: 'var(--radius-md)',
                      border: isSelected ? '2px solid var(--primary)' : '1px solid var(--border)',
                      background: isSelected ? 'var(--primary-subtle, rgba(0,87,184,0.06))' : 'var(--bg-card)',
                      cursor: 'pointer',
                      transition: 'all 0.15s ease'
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.35rem' }}>
                      <span style={{ fontWeight: 800, fontSize: '0.9rem', color: 'var(--primary)' }}>
                        Token #{appt.tokenNumber}
                      </span>
                      <span
                        className={`badge ${
                          appt.status === 'Completed'
                            ? 'badge-completed'
                            : appt.status === 'In-Consultation'
                            ? 'badge-warning'
                            : 'badge-scheduled'
                        }`}
                        style={{ fontSize: '0.7rem' }}
                      >
                        {appt.status || 'Scheduled'}
                      </span>
                    </div>

                    <div style={{ fontWeight: 600, fontSize: '0.95rem', color: 'var(--text-main)' }}>
                      {appt.patientName}
                    </div>

                    <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>
                      {appt.age ? `${appt.age} yrs • ${appt.gender}` : 'Patient ID: ' + (appt.patientId || 'N/A')} &bull; {appt.time}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Selected Patient Details & Consultation Action */}
        <div>
          {selectedAppt ? (
            <div className="card" style={{ padding: '1.75rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '1px solid var(--border)', paddingBottom: '1.25rem', marginBottom: '1.5rem' }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <h2 style={{ fontSize: '1.4rem', fontWeight: 800 }}>
                      {selectedAppt.patientName}
                    </h2>
                    <span className="badge badge-scheduled" style={{ fontSize: '0.8rem' }}>
                      Token #{selectedAppt.tokenNumber}
                    </span>
                  </div>
                  <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginTop: '0.25rem' }}>
                    Patient ID: <strong>{selectedAppt.patientId || 'PAT-1001'}</strong> &bull; Scheduled Time: <strong>{selectedAppt.time || '10:00 AM'}</strong>
                  </p>
                </div>

                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  {selectedAppt.status !== 'Completed' && (
                    <button
                      className="btn btn-primary"
                      onClick={() => startConsultation(selectedAppt)}
                      style={{ padding: '0.6rem 1.25rem', fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: '0.5rem' }}
                    >
                      <StethoscopeIcon size={16} />
                      Open Examination & Prescribe
                      <ArrowRightIcon size={15} />
                    </button>
                  )}
                </div>
              </div>

              {/* Patient Demographics Grid */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1rem', background: 'var(--bg-page)', padding: '1rem', borderRadius: 'var(--radius-md)', marginBottom: '1.5rem' }}>
                <div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600 }}>AGE / GENDER</div>
                  <div style={{ fontSize: '0.95rem', fontWeight: 700, marginTop: '0.2rem' }}>
                    {selectedAppt.age || 45} yrs / {selectedAppt.gender || 'Male'}
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600 }}>BLOOD GROUP</div>
                  <div style={{ fontSize: '0.95rem', fontWeight: 700, marginTop: '0.2rem', color: 'var(--danger, #dc2626)' }}>
                    {selectedAppt.bloodGroup || 'O+'}
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600 }}>PHONE NUMBER</div>
                  <div style={{ fontSize: '0.95rem', fontWeight: 700, marginTop: '0.2rem' }}>
                    {selectedAppt.phone || '9876543210'}
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600 }}>QUEUE STATUS</div>
                  <div style={{ fontSize: '0.95rem', fontWeight: 700, marginTop: '0.2rem' }}>
                    <span className={`badge ${selectedAppt.status === 'Completed' ? 'badge-completed' : 'badge-scheduled'}`}>
                      {selectedAppt.status}
                    </span>
                  </div>
                </div>
              </div>

              {/* Reason for Visit */}
              <div style={{ marginBottom: '1.5rem' }}>
                <h4 style={{ fontSize: '0.9rem', fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>
                  Chief Complaint / Reason for Appointment
                </h4>
                <div style={{ padding: '0.85rem 1rem', background: 'var(--bg-page)', borderRadius: 'var(--radius-sm)', borderLeft: '4px solid var(--primary)', fontSize: '0.95rem', lineHeight: 1.5 }}>
                  {selectedAppt.reason || 'Patient reported recurring fever, mild headache, and general body weakness.'}
                </div>
              </div>

              {/* Status Actions */}
              <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', borderTop: '1px solid var(--border)', paddingTop: '1.25rem' }}>
                <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: 600 }}>Change Queue State:</span>
                <button
                  className="btn btn-sm btn-outline"
                  onClick={() => handleStatusChange(selectedAppt.appointmentId || selectedAppt.id, 'Waiting')}
                  disabled={selectedAppt.status === 'Waiting'}
                >
                  Mark Waiting
                </button>
                <button
                  className="btn btn-sm btn-outline"
                  onClick={() => handleStatusChange(selectedAppt.appointmentId || selectedAppt.id, 'In-Consultation')}
                  disabled={selectedAppt.status === 'In-Consultation'}
                >
                  Call into Room (In-Consultation)
                </button>
                <button
                  className="btn btn-sm btn-outline"
                  onClick={() => handleStatusChange(selectedAppt.appointmentId || selectedAppt.id, 'Completed')}
                  disabled={selectedAppt.status === 'Completed'}
                >
                  Mark Completed
                </button>
              </div>

            </div>
          ) : (
            <div className="card" style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>
              Select a patient from the queue to view their profile and start consultation.
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
