import React, { useState } from 'react';
import { Link } from 'react-router-dom';

export default function MedicineList() {
  const [medicines, setMedicines] = useState([
    { id: 'MED-001', name: 'Paracetamol', dosage: '500mg', type: 'Tablet', quantity: 50, costValue: 10, mrp: 15 },
    { id: 'MED-002', name: 'Amoxicillin', dosage: '250mg', type: 'Capsule', quantity: 45, costValue: 15, mrp: 25 },
    { id: 'MED-003', name: 'Cetirizine', dosage: '10mg', type: 'Tablet', quantity: 60, costValue: 5, mrp: 10 },
    { id: 'MED-004', name: 'Metformin', dosage: '500mg', type: 'Tablet', quantity: 30, costValue: 12, mrp: 20 },
    { id: 'MED-005', name: 'Omeprazole', dosage: '20mg', type: 'Capsule', quantity: 40, costValue: 10, mrp: 18 }
  ]);

  return (
    <div className="card" style={{ padding: '1.5rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
        <h2>Pharmacy Medicine Inventory</h2>
        <Link to="/medicines/new" className="btn btn-sm btn-primary">
          + Add Medicine
        </Link>
      </div>

      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead>
          <tr style={{ textAlign: 'left', borderBottom: '1px solid var(--border)' }}>
            <th style={{ padding: '0.75rem' }}>ID</th>
            <th>Medicine Name</th>
            <th>Dosage</th>
            <th>Type</th>
            <th>Stock</th>
            <th>MRP (₹)</th>
          </tr>
        </thead>
        <tbody>
          {medicines.map(m => (
            <tr key={m.id} style={{ borderBottom: '1px solid var(--border)' }}>
              <td style={{ padding: '0.75rem' }}><strong>{m.id}</strong></td>
              <td>{m.name}</td>
              <td>{m.dosage}</td>
              <td>{m.type}</td>
              <td>
                <span className={`badge ${m.quantity > 10 ? 'badge-completed' : 'badge-scheduled'}`}>
                  {m.quantity} in stock
                </span>
              </td>
              <td>₹{m.mrp}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

