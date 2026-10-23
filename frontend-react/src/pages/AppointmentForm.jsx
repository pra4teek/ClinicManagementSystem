import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

export default function AppointmentForm() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    patientName: '',
    doctorName: 'Dr. Prateek Pradeep',
    time: '10:00 AM',
    reason: '',
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    alert(`Appointment booked for ${formData.patientName}! Token generated.`);
    navigate('/appointments');
  };

  return (
    <div style={{ maxWidth: '640px', margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <h2>Book New Appointment</h2>
        <button type="button" className="btn btn-sm btn-outline" onClick={() => navigate('/appointments')}>
          ← Back to Appointments
        </button>
      </div>

      <div className="card" style={{ padding: '2rem' }}>
        <form onSubmit={handleSubmit}>
          <div className="form-group" style={{ marginBottom: '1rem' }}>
            <label className="form-label">Patient Name *</label>
            <input
              type="text"
              className="form-control"
              placeholder="e.g. Arjun Ravi"
              value={formData.patientName}
              onChange={(e) => setFormData({ ...formData, patientName: e.target.value })}
              required
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
            <div className="form-group">
              <label className="form-label">Doctor *</label>
              <select
                className="form-control"
                value={formData.doctorName}
                onChange={(e) => setFormData({ ...formData, doctorName: e.target.value })}
              >
                <option>Dr. Prateek Pradeep</option>
                <option>Dr. Sarah Thomas</option>
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Time Slot *</label>
              <select
                className="form-control"
                value={formData.time}
                onChange={(e) => setFormData({ ...formData, time: e.target.value })}
              >
                <option>10:00 AM</option>
                <option>10:30 AM</option>
                <option>11:00 AM</option>
                <option>11:30 AM</option>
                <option>02:00 PM</option>
                <option>02:30 PM</option>
              </select>
            </div>
          </div>

          <div className="form-group" style={{ marginBottom: '1.5rem' }}>
            <label className="form-label">Chief Complaint / Reason *</label>
            <textarea
              className="form-control"
              rows={2}
              placeholder="e.g. Fever, dry cough, sore throat"
              value={formData.reason}
              onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
              required
            />
          </div>

          <button type="submit" className="btn btn-primary" style={{ width: '100%' }}>
            Confirm Appointment & Generate Token
          </button>
        </form>
      </div>
    </div>
  );
}

