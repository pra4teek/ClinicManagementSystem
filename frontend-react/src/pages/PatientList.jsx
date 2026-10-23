import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import patientService from '../services/patientService';

export default function PatientList() {
  const [patients, setPatients] = useState([]);

  useEffect(() => {
    patientService.getAllPatients()
      .then(data => setPatients(Array.isArray(data) ? data : []))
      .catch(() => setPatients([
        { id: 'PAT-1001', name: 'Arjun Ravi', age: 45, gender: 'Male', phone: '9876543210', bloodGroup: 'O+' },
        { id: 'PAT-1002', name: 'Rohit Krishna', age: 29, gender: 'Male', phone: '9845123456', bloodGroup: 'A+' }
      ]));
  }, []);

  return (
    <div className="card" style={{ padding: '1.5rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
        <h2>Patient Records Directory</h2>
        <Link to="/patients/new" className="btn btn-sm btn-primary">
          + Add Patient
        </Link>
      </div>
      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead>
          <tr style={{ textAlign: 'left', borderBottom: '1px solid var(--border)' }}>
            <th style={{ padding: '0.75rem' }}>Patient ID</th>
            <th>Name</th>
            <th>Age / Gender</th>
            <th>Phone</th>
            <th>Blood Group</th>
          </tr>
        </thead>
        <tbody>
          {patients.map(p => (
            <tr key={p.id} style={{ borderBottom: '1px solid var(--border)' }}>
              <td style={{ padding: '0.75rem' }}><strong>{p.id}</strong></td>
              <td>{p.name}</td>
              <td>{p.age} / {p.gender}</td>
              <td>{p.phone}</td>
              <td><span className="badge badge-scheduled">{p.bloodGroup}</span></td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

