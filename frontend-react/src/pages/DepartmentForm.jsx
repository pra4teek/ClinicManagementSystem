import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import adminService from '../services/adminService';

export default function DepartmentForm() {
  const navigate = useNavigate();
  const [departmentName, setDepartmentName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await adminService.createDepartment({ DepartmentName: departmentName.trim() });
      navigate('/departments');
    } catch (err) {
      setError(err.message || 'Failed to create department');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: '540px', margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <h2>Create Department</h2>
        <Link to="/departments" className="btn btn-sm btn-outline">
          ← Back to Departments
        </Link>
      </div>

      <div className="card" style={{ padding: '2rem' }}>
        {error && (
          <div style={{ background: 'var(--danger-light)', color: 'var(--danger)', padding: '0.75rem', borderRadius: '4px', marginBottom: '1rem', fontSize: '0.85rem' }}>
            {error}
          </div>
        )}
        <form onSubmit={handleSubmit}>
          <div className="form-group" style={{ marginBottom: '1.5rem' }}>
            <label className="form-label">Department Name * (max 30 characters)</label>
            <input
              type="text"
              maxLength={30}
              className="form-control"
              placeholder="e.g. Neurology, Cardiology"
              value={departmentName}
              onChange={(e) => setDepartmentName(e.target.value)}
              required
            />
          </div>

          <button type="submit" className="btn btn-primary" style={{ width: '100%' }} disabled={loading}>
            {loading ? 'Saving Department...' : 'Save Department'}
          </button>
        </form>
      </div>
    </div>
  );
}
