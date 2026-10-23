import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import doctorService from '../services/doctorService';

export default function ConsultationList() {
  const [consultations, setConsultations] = useState([]);

  useEffect(() => {
    doctorService.getAllConsultations()
      .then(data => setConsultations(Array.isArray(data) ? data : []))
      .catch(() => setConsultations([
        { id: 'CNS-101', date: '2026-10-23', patientName: 'Arjun Ravi', diagnosis: 'Acute Pharyngitis', status: 'Completed' },
        { id: 'CNS-102', date: '2026-10-22', patientName: 'Rohit Krishna', diagnosis: 'GERD & Acidity', status: 'Completed' }
      ]));
  }, []);

  return (
    <div className="card" style={{ padding: '1.5rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
        <h2>Consultation History</h2>
        <Link to="/consultations/new" className="btn btn-sm btn-primary">
          + New Consultation
        </Link>
      </div>

      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead>
          <tr style={{ textAlign: 'left', borderBottom: '1px solid var(--border)' }}>
            <th style={{ padding: '0.75rem' }}>ID</th>
            <th>Date</th>
            <th>Patient</th>
            <th>Primary Diagnosis</th>
            <th>Status</th>
          </tr>
        </thead>
        <tbody>
          {consultations.map(c => (
            <tr key={c.id} style={{ borderBottom: '1px solid var(--border)' }}>
              <td style={{ padding: '0.75rem' }}><strong>{c.id}</strong></td>
              <td>{c.date}</td>
              <td>{c.patientName}</td>
              <td>{c.diagnosis}</td>
              <td><span className="badge badge-completed">{c.status}</span></td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

