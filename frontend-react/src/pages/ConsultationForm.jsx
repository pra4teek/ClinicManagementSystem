import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import doctorService from '../services/doctorService';

export default function ConsultationForm() {
  const navigate = useNavigate();

  // Vitals
  const [bp, setBp] = useState('');
  const [pulse, setPulse] = useState('');
  const [temp, setTemp] = useState('');
  const [weight, setWeight] = useState('');

  // Diagnosis
  const [symptoms, setSymptoms] = useState('');
  const [diagnosis, setDiagnosis] = useState('');
  const [remarks, setRemarks] = useState('');

  // Medicines
  const [medicines, setMedicines] = useState([]);
  const [medName, setMedName] = useState('');
  const [dosage, setDosage] = useState('');
  const [freq, setFreq] = useState('1-0-1');
  const [duration, setDuration] = useState('5 Days');

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const handleAddMedicine = () => {
    if (!medName.trim()) return;
    setMedicines([...medicines, { name: medName, dosage, freq, duration }]);
    setMedName('');
    setDosage('');
  };

  const handleRemoveMedicine = (index) => {
    setMedicines(medicines.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    // Validation
    if (!symptoms.trim()) {
      setError('Symptoms & Observations are required.');
      return;
    }
    if (!diagnosis.trim()) {
      setError('Primary Diagnosis is required.');
      return;
    }

    try {
      setSaving(true);
      await doctorService.createConsultation({
        Symptoms: symptoms,
        Diagnosis: diagnosis,
        Remarks: remarks,
        BP: bp,
        Pulse: pulse,
        Temperature: temp,
        Weight: weight,
        ConsultationStatus: 'Completed',
      });

      alert('Consultation saved successfully!');
      navigate('/doctor');
    } catch (err) {
      setError(err.response?.data?.detail || err.message || 'Failed to save consultation.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div style={{ maxWidth: '960px', margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <h2>New Patient Consultation</h2>
        <button type="button" className="btn btn-outline btn-sm" onClick={() => navigate('/doctor')}>
          ← Back to Queue
        </button>
      </div>

      {error && (
        <div style={{ background: 'var(--danger-light)', color: 'var(--danger)', padding: '0.75rem', borderRadius: 'var(--radius-sm)', marginBottom: '1rem' }}>
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit}>
        {/* Section 1: Vitals */}
        <div className="card" style={{ marginBottom: '1.5rem', padding: '1.5rem' }}>
          <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '1rem' }}>1. Patient Vitals</h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1rem' }}>
            <div className="form-group">
              <label className="form-label">Blood Pressure (mmHg)</label>
              <input
                type="text"
                className="form-control"
                placeholder="120/80"
                value={bp}
                onChange={(e) => setBp(e.target.value.replace(/[^\d/]/g, ''))}
              />
            </div>
            <div className="form-group">
              <label className="form-label">Pulse (bpm)</label>
              <input
                type="text"
                className="form-control"
                placeholder="72"
                value={pulse}
                onChange={(e) => setPulse(e.target.value.replace(/[^\d]/g, ''))}
              />
            </div>
            <div className="form-group">
              <label className="form-label">Temperature (°C)</label>
              <input
                type="text"
                className="form-control"
                placeholder="37.0"
                value={temp}
                onChange={(e) => setTemp(e.target.value)}
              />
            </div>
            <div className="form-group">
              <label className="form-label">Weight (kg)</label>
              <input
                type="text"
                className="form-control"
                placeholder="68"
                value={weight}
                onChange={(e) => setWeight(e.target.value)}
              />
            </div>
          </div>
        </div>

        {/* Section 2: Clinical Findings */}
        <div className="card" style={{ marginBottom: '1.5rem', padding: '1.5rem' }}>
          <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '1rem' }}>2. Clinical Diagnosis</h3>
          <div className="form-group" style={{ marginBottom: '1rem' }}>
            <label className="form-label">Symptoms & Observations *</label>
            <textarea
              className="form-control"
              rows={2}
              placeholder="e.g. Headache, high fever for 3 days..."
              value={symptoms}
              onChange={(e) => setSymptoms(e.target.value)}
              required
            />
          </div>
          <div className="form-group" style={{ marginBottom: '1rem' }}>
            <label className="form-label">Primary Diagnosis *</label>
            <input
              type="text"
              className="form-control"
              placeholder="e.g. Acute Pharyngitis, Viral Fever"
              value={diagnosis}
              onChange={(e) => setDiagnosis(e.target.value)}
              required
            />
          </div>
          <div className="form-group">
            <label className="form-label">Doctor's Advice / Remarks</label>
            <textarea
              className="form-control"
              rows={2}
              placeholder="Bed rest, stay hydrated, avoid cold drinks..."
              value={remarks}
              onChange={(e) => setRemarks(e.target.value)}
            />
          </div>
        </div>

        {/* Section 3: Prescribe Medicines */}
        <div className="card" style={{ marginBottom: '1.5rem', padding: '1.5rem' }}>
          <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '1rem' }}>3. Prescriptions</h3>
          <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr auto', gap: '0.75rem', alignItems: 'end', marginBottom: '1rem' }}>
            <div>
              <label className="form-label">Medicine</label>
              <input
                type="text"
                className="form-control"
                placeholder="Paracetamol"
                value={medName}
                onChange={(e) => setMedName(e.target.value)}
              />
            </div>
            <div>
              <label className="form-label">Dosage</label>
              <input
                type="text"
                className="form-control"
                placeholder="500mg"
                value={dosage}
                onChange={(e) => setDosage(e.target.value)}
              />
            </div>
            <div>
              <label className="form-label">Frequency</label>
              <input
                type="text"
                className="form-control"
                placeholder="1-0-1"
                value={freq}
                onChange={(e) => setFreq(e.target.value)}
              />
            </div>
            <div>
              <label className="form-label">Duration</label>
              <input
                type="text"
                className="form-control"
                placeholder="5 Days"
                value={duration}
                onChange={(e) => setDuration(e.target.value)}
              />
            </div>
            <button type="button" className="btn btn-outline" onClick={handleAddMedicine}>
              + Add
            </button>
          </div>

          {medicines.length > 0 && (
            <table className="table" style={{ width: '100%', borderCollapse: 'collapse', marginTop: '0.5rem' }}>
              <thead>
                <tr style={{ textAlign: 'left', borderBottom: '1px solid var(--border)' }}>
                  <th style={{ padding: '0.5rem' }}>Medicine</th>
                  <th>Dosage</th>
                  <th>Frequency</th>
                  <th>Duration</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {medicines.map((m, idx) => (
                  <tr key={idx} style={{ borderBottom: '1px solid var(--border)' }}>
                    <td style={{ padding: '0.5rem' }}><strong>{m.name}</strong></td>
                    <td>{m.dosage}</td>
                    <td>{m.freq}</td>
                    <td>{m.duration}</td>
                    <td>
                      <button
                        type="button"
                        className="btn btn-sm btn-outline"
                        style={{ color: 'var(--danger)' }}
                        onClick={() => handleRemoveMedicine(idx)}
                      >
                        Remove
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Form Action */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem' }}>
          <button type="button" className="btn btn-outline" onClick={() => navigate('/doctor')}>
            Cancel
          </button>
          <button type="submit" className="btn btn-primary" disabled={saving}>
            {saving ? 'Saving...' : 'Save & Complete Consultation'}
          </button>
        </div>
      </form>
    </div>
  );
}

