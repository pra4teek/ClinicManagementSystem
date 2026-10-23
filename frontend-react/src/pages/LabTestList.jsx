import React, { useState } from 'react';
import { Link } from 'react-router-dom';

export default function LabTestList() {
  const [labTests, setLabTests] = useState([
    { id: 101, name: 'Complete Blood Count (CBC)', sample: 'Blood', ref: '4.5-5.5 M/µL', cost: 300 },
    { id: 102, name: 'Fasting Blood Sugar (FBS)', sample: 'Blood', ref: '70-100 mg/dL', cost: 150 },
    { id: 103, name: 'Urine Routine Examination', sample: 'Urine', ref: 'Normal', cost: 200 },
    { id: 104, name: 'Lipid Profile', sample: 'Blood', ref: '< 200 mg/dL', cost: 650 },
    { id: 105, name: 'Chest X-Ray (PA View)', sample: 'Imaging', ref: 'Clear lung fields', cost: 500 }
  ]);

  return (
    <div className="card" style={{ padding: '1.5rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
        <h2>Laboratory Diagnostic Tests Catalog</h2>
        <Link to="/lab-reports/new" className="btn btn-sm btn-primary">
          + Enter Lab Results
        </Link>
      </div>

      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead>
          <tr style={{ textAlign: 'left', borderBottom: '1px solid var(--border)' }}>
            <th style={{ padding: '0.75rem' }}>Code</th>
            <th>Test Investigation</th>
            <th>Sample Type</th>
            <th>Standard Reference</th>
            <th>Cost (₹)</th>
          </tr>
        </thead>
        <tbody>
          {labTests.map(t => (
            <tr key={t.id} style={{ borderBottom: '1px solid var(--border)' }}>
              <td style={{ padding: '0.75rem' }}><strong>#{t.id}</strong></td>
              <td>{t.name}</td>
              <td><span className="badge badge-scheduled">{t.sample}</span></td>
              <td>{t.ref}</td>
              <td>₹{t.cost}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

