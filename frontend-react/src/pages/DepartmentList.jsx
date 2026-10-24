import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import adminService from '../services/adminService';

export default function DepartmentList() {
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchDepts() {
      try {
        const data = await adminService.getDepartments();
        setDepartments(Array.isArray(data) ? data : []);
      } catch (err) {
        console.error(err);
        setDepartments([]);
      } finally {
        setLoading(false);
      }
    }
    fetchDepts();
  }, []);

  return (
    <div className="card" style={{ padding: '1.5rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '0.75rem' }}>
        <div>
          <h2 style={{ margin: '0 0 0.25rem' }}>Clinic Departments</h2>
          <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-muted)' }}>
            Configured medical specialties and diagnostic departments
          </p>
        </div>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <Link to="/admin?tab=departments" className="btn btn-sm btn-outline">
            Open Full Admin Portal →
          </Link>
          <Link to="/departments/new" className="btn btn-sm btn-primary">
            + Add Department
          </Link>
        </div>
      </div>

      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.88rem' }}>
        <thead>
          <tr style={{ textAlign: 'left', borderBottom: '1px solid var(--border)', background: 'var(--bg-page)' }}>
            <th style={{ padding: '0.75rem 1rem' }}>ID</th>
            <th>Department Name</th>
            <th>Status</th>
          </tr>
        </thead>
        <tbody>
          {loading ? (
            <tr><td colSpan="3" style={{ padding: '2rem', textAlign: 'center' }}>Loading departments...</td></tr>
          ) : !Array.isArray(departments) || departments.length === 0 ? (
            <tr><td colSpan="3" style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>No departments found.</td></tr>
          ) : (
            departments.map(d => (
              <tr key={d.DepartmentId || d.id} style={{ borderBottom: '1px solid var(--border)' }}>
                <td style={{ padding: '0.75rem 1rem' }}><strong>#{d.DepartmentId || d.id}</strong></td>
                <td><strong>{d.DepartmentName || d.name}</strong></td>
                <td>
                  <span className={`badge ${d.isActive !== false ? 'badge-completed' : 'badge-danger'}`}>
                    {d.isActive !== false ? 'Active' : 'Inactive'}
                  </span>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}
