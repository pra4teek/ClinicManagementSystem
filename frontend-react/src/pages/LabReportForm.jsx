import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

export default function LabReportForm() {
  const navigate = useNavigate();
  const [patientName, setPatientName] = useState('Arjun Ravi');
  const [testName, setTestName] = useState('Complete Blood Count (CBC)');
  const [reading, setReading] = useState('');
  const [remarks, setRemarks] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    alert(`Lab report submitted for ${patientName}! Doctor notified.`);
    navigate('/lab-tests');
  };

  return (
    <div style={{ maxWidth: '640px', margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <h2>Enter Diagnostic Lab Results</h2>
        <button type="button" className="btn btn-sm btn-outline" onClick={() => navigate('/lab-tests')}>
          ← Back to Lab Tests
        </button>
      </div>

      <div className="card" style={{ padding: '2rem' }}>
        <form onSubmit={handleSubmit}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
            <div className="form-group">
              <label className="form-label">Patient Name</label>
              <input
                type="text"
                className="form-control"
                value={patientName}
                onChange={(e) => setPatientName(e.target.value)}
                required
              />
            </div>
            <div className="form-group">
              <label className="form-label">Test Investigation</label>
              <select
                className="form-control"
                value={testName}
                onChange={(e) => setTestName(e.target.value)}
              >
                <option>Complete Blood Count (CBC)</option>
                <option>Fasting Blood Sugar (FBS)</option>
                <option>Lipid Profile</option>
                <option>Chest X-Ray (PA View)</option>
              </select>
            </div>
          </div>

          <div className="form-group" style={{ marginBottom: '1rem' }}>
            <label className="form-label">Actual Lab Reading / Value *</label>
            <input
              type="text"
              className="form-control"
              placeholder="e.g. 14.5 g/dL (or Normal, Clear)"
              value={reading}
              onChange={(e) => setReading(e.target.value)}
              required
            />
          </div>

          <div className="form-group" style={{ marginBottom: '1.5rem' }}>
            <label className="form-label">Technologist Remarks</label>
            <textarea
              className="form-control"
              rows={2}
              placeholder="Verified within standard diagnostic parameters."
              value={remarks}
              onChange={(e) => setRemarks(e.target.value)}
            />
          </div>

          <button type="submit" className="btn btn-primary" style={{ width: '100%' }}>
            Save & Publish Lab Report to Doctor
          </button>
        </form>
      </div>
    </div>
  );
}

