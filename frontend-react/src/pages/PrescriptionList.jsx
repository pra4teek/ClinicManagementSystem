import React, { useState, useEffect } from 'react';
import doctorService from '../services/doctorService';

export default function PrescriptionList() {
  const [prescriptions, setPrescriptions] = useState([]);

  useEffect(() => {
    doctorService.getPrescriptions()
      .then(data => setPrescriptions(Array.isArray(data) ? data : []))
      .catch(() => setPrescriptions([]));
  }, []);

  return (
    <div className="card" style={{ padding: '1.5rem' }}>
      <h2 style={{ marginBottom: '1rem' }}>Prescriptions Registry</h2>
      {prescriptions.length === 0 ? (
        <p style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '2rem' }}>No prescriptions found.</p>
      ) : (
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ textAlign: 'left', borderBottom: '1px solid var(--border)' }}>
              <th style={{ padding: '0.75rem' }}>Prescription ID</th>
              <th>Patient</th>
              <th>Date</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {prescriptions.map(p => (
              <tr key={p.id} style={{ borderBottom: '1px solid var(--border)' }}>
                <td style={{ padding: '0.75rem' }}>{p.id}</td>
                <td>{p.patientName}</td>
                <td>{p.date}</td>
                <td><span className="badge badge-scheduled">{p.Status}</span></td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}

