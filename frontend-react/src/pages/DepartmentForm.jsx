import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

export default function DepartmentForm() {
  const navigate = useNavigate();
  const [departmentName, setDepartmentName] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    alert(`Department "${departmentName}" created!`);
    navigate('/departments');
  };

  return (
    <div style={{ maxWidth: '540px', margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <h2>Create Department</h2>
        <button type="button" className="btn btn-sm btn-outline" onClick={() => navigate('/departments')}>
          ← Back to Departments
        </button>
      </div>

      <div className="card" style={{ padding: '2rem' }}>
        <form onSubmit={handleSubmit}>
          <div className="form-group" style={{ marginBottom: '1.5rem' }}>
            <label className="form-label">Department Name *</label>
            <input
              type="text"
              className="form-control"
              placeholder="e.g. Neurology, Cardiology"
              value={departmentName}
              onChange={(e) => setDepartmentName(e.target.value)}
              required
            />
          </div>

          <button type="submit" className="btn btn-primary" style={{ width: '100%' }}>
            Save Department
          </button>
        </form>
      </div>
    </div>
  );
}

