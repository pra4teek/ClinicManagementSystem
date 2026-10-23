import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import doctorService from '../services/doctorService';
import {
  StethoscopeIcon,
  SearchIcon,
  FlaskIcon
} from '../components/Icons';

export default function ConsultationList() {
  const [consultations, setConsultations] = useState([]);
  const [search, setSearch] = useState('');
  const [activeModal, setActiveModal] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const data = await doctorService.getAllConsultations();
      setConsultations(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const filtered = consultations.filter((c) => {
    const q = search.toLowerCase();
    return (
      (c.patientName || '').toLowerCase().includes(q) ||
      (c.diagnosis || '').toLowerCase().includes(q) ||
      (c.id || '').toLowerCase().includes(q) ||
      (c.patientId || '').toLowerCase().includes(q)
    );
  });

  return (
    <div>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 800 }}>Consultation History</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
            Permanent medical consultation records, clinical diagnoses, and prescriptions.
          </p>
        </div>
        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <Link to="/doctor" className="btn btn-outline btn-sm" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}>
            <StethoscopeIcon size={14} />
            Doctor Workspace
          </Link>
          <Link to="/consultations/new" className="btn btn-primary btn-sm">
            + New Consultation
          </Link>
        </div>
      </div>

      {/* Search & Stats Bar */}
      <div className="card" style={{ padding: '1rem 1.25rem', marginBottom: '1.5rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
          <div style={{ flex: '1', minWidth: '260px', position: 'relative' }}>
            <div style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }}>
              <SearchIcon size={15} />
            </div>
            <input
              type="text"
              className="form-control"
              style={{ paddingLeft: '2.25rem' }}
              placeholder="Search consultations by patient name, diagnosis, or record ID..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
            Showing <strong>{filtered.length}</strong> of <strong>{consultations.length}</strong> total records
          </div>
        </div>
      </div>

      {/* Consultations Table */}
      <div className="card" style={{ padding: '1.5rem' }}>
        {loading ? (
          <p style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '2rem' }}>Loading records...</p>
        ) : filtered.length === 0 ? (
          <p style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '2rem' }}>No consultation records found.</p>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ textAlign: 'left', borderBottom: '2px solid var(--border)', fontSize: '0.82rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                <th style={{ padding: '0.75rem' }}>Record ID</th>
                <th>Date</th>
                <th>Patient Name</th>
                <th>Primary Diagnosis</th>
                <th>Vitals Summary</th>
                <th>Prescribed Rx</th>
                <th>Status</th>
                <th style={{ textAlign: 'right' }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((c) => (
                <tr key={c.id} style={{ borderBottom: '1px solid var(--border)' }}>
                  <td style={{ padding: '0.85rem 0.75rem', fontWeight: 800, color: 'var(--primary)' }}>
                    {c.id}
                  </td>
                  <td style={{ fontSize: '0.85rem' }}>{c.date}</td>
                  <td>
                    <strong>{c.patientName}</strong>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{c.patientId || 'PAT-1001'}</div>
                  </td>
                  <td style={{ fontSize: '0.9rem', maxWidth: '240px' }}>
                    {c.diagnosis}
                  </td>
                  <td style={{ fontSize: '0.82rem' }}>
                    {c.vitals ? (
                      <span>BP: <strong>{c.vitals.bp}</strong> &bull; HR: <strong>{c.vitals.pulse}</strong></span>
                    ) : (
                      <span style={{ color: 'var(--text-muted)' }}>—</span>
                    )}
                  </td>
                  <td>
                    <span className="badge badge-scheduled" style={{ fontSize: '0.75rem' }}>
                      {c.medicines ? c.medicines.length : 0} items
                    </span>
                  </td>
                  <td>
                    <span className="badge badge-completed" style={{ fontSize: '0.75rem' }}>
                      {c.status || 'Completed'}
                    </span>
                  </td>
                  <td style={{ textAlign: 'right' }}>
                    <button
                      className="btn btn-sm btn-outline"
                      onClick={() => setActiveModal(c)}
                      style={{ padding: '0.3rem 0.65rem', fontSize: '0.75rem' }}
                    >
                      View Details
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* View Details Modal */}
      {activeModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0,0,0,0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
          padding: '1rem'
        }}>
          <div className="card" style={{ maxWidth: '650px', width: '100%', maxHeight: '90vh', overflowY: 'auto', padding: '2rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border)', paddingBottom: '1rem', marginBottom: '1.25rem' }}>
              <div>
                <h2 style={{ fontSize: '1.35rem', fontWeight: 800 }}>Consultation Summary</h2>
                <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                  ID: <strong>{activeModal.id}</strong> &bull; Date: <strong>{activeModal.date}</strong> &bull; Doctor: <strong>{activeModal.doctorName || 'Dr. Prateek Pradeep'}</strong>
                </div>
              </div>
              <button
                onClick={() => setActiveModal(null)}
                style={{ background: 'transparent', border: 'none', fontSize: '1.5rem', cursor: 'pointer' }}
              >
                ✕
              </button>
            </div>

            {/* Patient Header */}
            <div style={{ background: 'var(--bg-page)', padding: '0.85rem 1rem', borderRadius: 'var(--radius-sm)', marginBottom: '1rem' }}>
              <strong>{activeModal.patientName}</strong> &bull; Patient ID: <strong>{activeModal.patientId || 'PAT-1001'}</strong>
            </div>

            {/* Vitals */}
            {activeModal.vitals && (
              <div style={{ marginBottom: '1rem' }}>
                <h4 style={{ fontSize: '0.8rem', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '0.35rem' }}>Vitals Recorded</h4>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '0.5rem', textAlign: 'center', background: 'var(--bg-page)', padding: '0.75rem', borderRadius: 'var(--radius-sm)' }}>
                  <div>
                    <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>BP</div>
                    <strong>{activeModal.vitals.bp || '120/80'}</strong>
                  </div>
                  <div>
                    <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>PULSE</div>
                    <strong>{activeModal.vitals.pulse || '76'} bpm</strong>
                  </div>
                  <div>
                    <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>TEMP</div>
                    <strong>{activeModal.vitals.temp || '98.6'} °F</strong>
                  </div>
                  <div>
                    <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>BMI</div>
                    <strong>{activeModal.vitals.bmi || '22.9'}</strong>
                  </div>
                </div>
              </div>
            )}

            {/* Symptoms & Diagnosis */}
            <div style={{ marginBottom: '1rem' }}>
              <h4 style={{ fontSize: '0.8rem', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '0.25rem' }}>Symptoms</h4>
              <p style={{ margin: 0, fontSize: '0.9rem' }}>{activeModal.symptoms}</p>
            </div>

            <div style={{ marginBottom: '1rem' }}>
              <h4 style={{ fontSize: '0.8rem', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '0.25rem' }}>Diagnosis</h4>
              <p style={{ margin: 0, fontSize: '0.95rem', fontWeight: 700, color: 'var(--primary)' }}>{activeModal.diagnosis}</p>
            </div>

            {activeModal.remarks && (
              <div style={{ marginBottom: '1rem' }}>
                <h4 style={{ fontSize: '0.8rem', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '0.25rem' }}>Doctor's Advice</h4>
                <p style={{ margin: 0, fontSize: '0.88rem', fontStyle: 'italic' }}>"{activeModal.remarks}"</p>
              </div>
            )}

            {/* Medicines List */}
            {activeModal.medicines && activeModal.medicines.length > 0 && (
              <div style={{ marginBottom: '1rem' }}>
                <h4 style={{ fontSize: '0.8rem', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '0.5rem' }}>Prescribed Medications</h4>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
                  <thead>
                    <tr style={{ textAlign: 'left', borderBottom: '1px solid var(--border)' }}>
                      <th>Medicine</th>
                      <th>Dosage</th>
                      <th>Frequency</th>
                      <th>Duration</th>
                    </tr>
                  </thead>
                  <tbody>
                    {activeModal.medicines.map((m, i) => (
                      <tr key={i} style={{ borderBottom: '1px solid var(--border)' }}>
                        <td style={{ padding: '0.4rem 0', fontWeight: 600 }}>{m.name}</td>
                        <td>{m.dosage}</td>
                        <td>{m.freq} ({m.timing})</td>
                        <td>{m.duration}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* Lab Tests */}
            {activeModal.labTests && activeModal.labTests.length > 0 && (
              <div style={{ marginBottom: '1.25rem' }}>
                <h4 style={{ fontSize: '0.8rem', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '0.35rem' }}>Diagnostic Investigations Ordered</h4>
                <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                  {activeModal.labTests.map((t, i) => (
                    <span key={i} className="badge badge-scheduled" style={{ fontSize: '0.75rem', display: 'inline-flex', alignItems: 'center', gap: '0.3rem' }}>
                      <FlaskIcon size={12} />
                      {t}
                    </span>
                  ))}
                </div>
              </div>
            )}

            <div style={{ display: 'flex', justifyContent: 'flex-end', borderTop: '1px solid var(--border)', paddingTop: '1rem' }}>
              <button className="btn btn-outline btn-sm" onClick={() => setActiveModal(null)}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
