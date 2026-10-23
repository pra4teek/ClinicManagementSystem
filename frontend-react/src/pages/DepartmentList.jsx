import React, { useState } from 'react';
import { Link } from 'react-router-dom';

export default function DepartmentList() {
  const [departments, setDepartments] = useState([
    { id: 1, name: 'General Medicine', doctorCount: 2, head: 'Dr. Prateek Pradeep' },
    { id: 2, name: 'Cardiology', doctorCount: 1, head: 'Dr. Sarah Thomas' },
    { id: 3, name: 'Pediatrics', doctorCount: 1, head: 'Dr. Arjun K.' },
  ]);

  return (
    <div className="card" style={{ padding: '1.5rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
        <h2>Clinic Departments</h2>
        <Link to="/departments/new" className="btn btn-sm btn-primary">
          + Add Department
        </Link>
      </div>

      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead>
          <tr style={{ textAlign: 'left', borderBottom: '1px solid var(--border)' }}>
            <th style={{ padding: '0.75rem' }}>ID</th>
            <th>Department Name</th>
            <th>Assigned Doctors</th>
            <th>Department Head</th>
          </tr>
        </thead>
        <tbody>
          {departments.map(d => (
            <tr key={d.id} style={{ borderBottom: '1px solid var(--border)' }}>
              <td style={{ padding: '0.75rem' }}><strong>{d.id}</strong></td>
              <td>{d.name}</td>
              <td>{d.doctorCount} Doctors</td>
              <td>{d.head}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

