import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import doctorService from '../services/doctorService';
import {
  StethoscopeIcon,
  SearchIcon,
  PillIcon
} from '../components/Icons';

export default function PrescriptionList() {
  const [prescriptions, setPrescriptions] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadPrescriptions();
  }, []);

  const loadPrescriptions = async () => {
    try {
      setLoading(true);
      const data = await doctorService.getPrescriptions();
      setPrescriptions(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const filtered = prescriptions.filter((rx) => {
    const q = search.toLowerCase();
    const hasMed = rx.items && rx.items.some((m) => m.name.toLowerCase().includes(q));
    return (
      (rx.patientName || '').toLowerCase().includes(q) ||
      (rx.id || '').toLowerCase().includes(q) ||
      hasMed
    );
  });

  return (
    <div>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <PillIcon size={24} color="var(--primary)" />
            Prescriptions Directory
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginTop: '0.2rem' }}>
            All medical prescriptions issued by physicians for pharmacy fulfillment and dispensing.
          </p>
        </div>
        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <Link to="/doctor" className="btn btn-outline btn-sm" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}>
            <StethoscopeIcon size={14} />
            Doctor Workspace
          </Link>
          <Link to="/consultations/new" className="btn btn-primary btn-sm">
            + New Consultation & Rx
          </Link>
        </div>
      </div>

      {/* Search Bar */}
      <div className="card" style={{ padding: '1rem 1.25rem', marginBottom: '1.5rem' }}>
        <div style={{ position: 'relative' }}>
          <div style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }}>
            <SearchIcon size={15} />
          </div>
          <input
            type="text"
            className="form-control"
            style={{ paddingLeft: '2.25rem' }}
            placeholder="Search prescriptions by patient name, prescription ID, or medication name..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      {/* Prescriptions List */}
      <div className="card" style={{ padding: '1.5rem' }}>
        {loading ? (
          <p style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '2rem' }}>Loading prescriptions...</p>
        ) : filtered.length === 0 ? (
          <p style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '2rem' }}>No prescriptions found.</p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            {filtered.map((rx) => (
              <div
                key={rx.id}
                style={{
                  border: '1px solid var(--border)',
                  borderRadius: 'var(--radius-md)',
                  padding: '1.25rem',
                  background: 'var(--bg-page)'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '1px solid var(--border)', paddingBottom: '0.75rem', marginBottom: '0.75rem' }}>
                  <div>
                    <span style={{ fontWeight: 800, color: 'var(--primary)', fontSize: '1.05rem', marginRight: '0.75rem' }}>
                      {rx.id}
                    </span>
                    <span style={{ fontWeight: 700, fontSize: '1rem' }}>
                      {rx.patientName}
                    </span>
                    <span style={{ color: 'var(--text-muted)', fontSize: '0.82rem', marginLeft: '0.5rem' }}>
                      ({rx.patientId || 'PAT-1001'})
                    </span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <span style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                      Date: <strong>{rx.date}</strong>
                    </span>
                    <span className={`badge ${rx.status === 'Dispensed' ? 'badge-completed' : 'badge-scheduled'}`}>
                      {rx.status || 'Prescribed'}
                    </span>
                  </div>
                </div>

                <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>
                  Prescribed by: <strong>{rx.doctorName || 'Dr. Prateek Pradeep'}</strong> &bull; Consultation Ref: <strong>{rx.consultationId}</strong>
                </div>

                {/* Items */}
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.88rem', background: 'var(--bg-card)', borderRadius: 'var(--radius-sm)' }}>
                  <thead>
                    <tr style={{ textAlign: 'left', borderBottom: '1px solid var(--border)', fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                      <th style={{ padding: '0.5rem 0.75rem' }}>Medicine</th>
                      <th>Dosage</th>
                      <th>Frequency</th>
                      <th>Timing</th>
                      <th>Duration</th>
                      <th>Instructions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(rx.items || []).map((item, i) => (
                      <tr key={i} style={{ borderBottom: i !== rx.items.length - 1 ? '1px solid var(--border)' : 'none' }}>
                        <td style={{ padding: '0.5rem 0.75rem', fontWeight: 700 }}>{item.name}</td>
                        <td>{item.dosage}</td>
                        <td><span className="badge badge-scheduled" style={{ fontSize: '0.7rem' }}>{item.freq}</span></td>
                        <td>{item.timing}</td>
                        <td>{item.duration}</td>
                        <td style={{ color: 'var(--text-muted)' }}>{item.instructions}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
