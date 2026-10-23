import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

export default function MedicineForm() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    name: '',
    dosage: '500mg',
    type: 'Tablet',
    costValue: '',
    mrp: '',
    quantity: '50'
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    alert(`Medicine ${formData.name} added to pharmacy inventory!`);
    navigate('/medicines');
  };

  return (
    <div style={{ maxWidth: '640px', margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <h2>Add Medicine to Stock</h2>
        <button type="button" className="btn btn-sm btn-outline" onClick={() => navigate('/medicines')}>
          ← Back to Medicines
        </button>
      </div>

      <div className="card" style={{ padding: '2rem' }}>
        <form onSubmit={handleSubmit}>
          <div className="form-group" style={{ marginBottom: '1rem' }}>
            <label className="form-label">Medicine Name *</label>
            <input
              type="text"
              className="form-control"
              placeholder="e.g. Paracetamol"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
            <div className="form-group">
              <label className="form-label">Dosage *</label>
              <input
                type="text"
                className="form-control"
                placeholder="e.g. 500mg, 10ml"
                value={formData.dosage}
                onChange={(e) => setFormData({ ...formData, dosage: e.target.value })}
                required
              />
            </div>
            <div className="form-group">
              <label className="form-label">Type *</label>
              <select
                className="form-control"
                value={formData.type}
                onChange={(e) => setFormData({ ...formData, type: e.target.value })}
              >
                <option>Tablet</option>
                <option>Capsule</option>
                <option>Syrup</option>
                <option>Injection</option>
                <option>Drops</option>
              </select>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem', marginBottom: '1.5rem' }}>
            <div className="form-group">
              <label className="form-label">Cost (₹) *</label>
              <input
                type="number"
                className="form-control"
                placeholder="10"
                value={formData.costValue}
                onChange={(e) => setFormData({ ...formData, costValue: e.target.value })}
                required
              />
            </div>
            <div className="form-group">
              <label className="form-label">MRP (₹) *</label>
              <input
                type="number"
                className="form-control"
                placeholder="15"
                value={formData.mrp}
                onChange={(e) => setFormData({ ...formData, mrp: e.target.value })}
                required
              />
            </div>
            <div className="form-group">
              <label className="form-label">Quantity *</label>
              <input
                type="number"
                className="form-control"
                placeholder="50"
                value={formData.quantity}
                onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
                required
              />
            </div>
          </div>

          <button type="submit" className="btn btn-primary" style={{ width: '100%' }}>
            Save Medicine to Inventory
          </button>
        </form>
      </div>
    </div>
  );
}

