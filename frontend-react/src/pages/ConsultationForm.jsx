import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import doctorService from '../services/doctorService';
import authService from '../services/authService';
import {
  HeartPulseIcon,
  StethoscopeIcon,
  PillIcon,
  FlaskIcon,
  SaveIcon
} from '../components/Icons';

const COMMON_SYMPTOMS = [
  'Fever',
  'Cold / Cough',
  'Severe Headache',
  'Sore Throat',
  'Abdominal Pain',
  'Body Ache',
  'Nausea / Vomiting',
  'Extreme Fatigue',
  'Chest Discomfort',
  'Dizziness'
];

const COMMON_DIAGNOSES = [
  'Acute Nasopharyngitis (Common Cold)',
  'Upper Respiratory Tract Infection (URTI)',
  'Acute Viral Fever',
  'Acute Gastroenteritis',
  'Essential Hypertension (Stage 1)',
  'Type 2 Diabetes Mellitus',
  'Allergic Rhinitis',
  'Migraine with Aura',
  'Gastroesophageal Reflux Disease (GERD)',
  'Acute Tonsillitis'
];

export default function ConsultationForm() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const apptIdParam = searchParams.get('appointmentId');
  const currentUser = authService.getCurrentUser() || { name: 'Dr. Prateek Pradeep', role: 'Doctor' };

  // Appointment & Patient info
  const [appointments, setAppointments] = useState([]);
  const [selectedApptId, setSelectedApptId] = useState(apptIdParam || '');
  const [activePatient, setActivePatient] = useState({
    id: 'PAT-1001',
    name: 'Arjun Ravi',
    age: 45,
    gender: 'Male',
    token: 1,
    reason: 'Frequent headaches and mild fever'
  });

  // Vitals
  const [bpSystolic, setBpSystolic] = useState('120');
  const [bpDiastolic, setBpDiastolic] = useState('80');
  const [pulse, setPulse] = useState('76');
  const [temp, setTemp] = useState('98.6');
  const [weight, setWeight] = useState('70');
  const [height, setHeight] = useState('175');
  const [bmi, setBmi] = useState('22.9');
  const [bmiClass, setBmiClass] = useState('Normal (18.5 - 24.9)');

  // Clinical Examination
  const [symptoms, setSymptoms] = useState('');
  const [diagnosis, setDiagnosis] = useState('');
  const [remarks, setRemarks] = useState('');

  // Prescription Items (Rx)
  const [medicineCatalog, setMedicineCatalog] = useState([]);
  const [medicines, setMedicines] = useState([]);
  const [selectedMed, setSelectedMed] = useState('');
  const [dosage, setDosage] = useState('500mg');
  const [freq, setFreq] = useState('1-0-1');
  const [timing, setTiming] = useState('After Food');
  const [duration, setDuration] = useState('5 Days');
  const [instructions, setInstructions] = useState('');

  // Lab Orders
  const [labCatalog, setLabCatalog] = useState([]);
  const [selectedLabs, setSelectedLabs] = useState([]);
  const [labPriority, setLabPriority] = useState('Routine');
  const [labRemarks, setLabRemarks] = useState('');

  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState('');

  // Load appointments and catalogs
  useEffect(() => {
    doctorService.getAppointments().then((list) => {
      setAppointments(list);
      if (apptIdParam) {
        const found = list.find((a) => String(a.appointmentId) === String(apptIdParam) || String(a.id) === String(apptIdParam));
        if (found) {
          applyPatient(found);
        }
      } else if (list.length > 0) {
        applyPatient(list[0]);
      }
    });

    doctorService.getMedicineCatalog().then(setMedicineCatalog);
    doctorService.getLabCatalog().then(setLabCatalog);
  }, [apptIdParam]);

  const applyPatient = (appt) => {
    setSelectedApptId(appt.appointmentId || appt.id);
    setActivePatient({
      id: appt.patientId || 'PAT-1001',
      name: appt.patientName,
      age: appt.age || 45,
      gender: appt.gender || 'Male',
      token: appt.tokenNumber || 1,
      reason: appt.reason || 'General checkup'
    });
  };

  const handleApptSelect = (e) => {
    const id = e.target.value;
    setSelectedApptId(id);
    const found = appointments.find((a) => String(a.appointmentId) === String(id) || String(a.id) === String(id));
    if (found) applyPatient(found);
  };

  // Auto-calculate BMI
  useEffect(() => {
    const w = parseFloat(weight);
    const h = parseFloat(height);
    if (w > 0 && h > 0) {
      const hMeters = h / 100;
      const calcBmi = (w / (hMeters * hMeters)).toFixed(1);
      setBmi(calcBmi);

      if (calcBmi < 18.5) setBmiClass('Underweight');
      else if (calcBmi <= 24.9) setBmiClass('Normal (18.5 - 24.9)');
      else if (calcBmi <= 29.9) setBmiClass('Overweight (25 - 29.9)');
      else setBmiClass('Obese (30+)');
    }
  }, [weight, height]);

  // Quick symptoms adder
  const addSymptomChip = (sym) => {
    if (!symptoms.includes(sym)) {
      setSymptoms(symptoms ? `${symptoms}, ${sym}` : sym);
    }
  };

  // Medicine Selection change
  const handleMedChange = (e) => {
    const name = e.target.value;
    setSelectedMed(name);
    const found = medicineCatalog.find((m) => m.name === name);
    if (found) {
      setDosage(found.dosage);
    }
  };

  // Add Medicine Item
  const handleAddMedicine = () => {
    if (!selectedMed.trim()) return;
    const item = {
      name: selectedMed,
      dosage: dosage || 'Standard',
      freq,
      timing,
      duration,
      instructions: instructions || 'As directed'
    };
    setMedicines([...medicines, item]);
    setSelectedMed('');
    setInstructions('');
  };

  const handleRemoveMedicine = (idx) => {
    setMedicines(medicines.filter((_, i) => i !== idx));
  };

  // Lab Checkbox toggle
  const toggleLabTest = (testName) => {
    if (selectedLabs.includes(testName)) {
      setSelectedLabs(selectedLabs.filter((t) => t !== testName));
    } else {
      setSelectedLabs([...selectedLabs, testName]);
    }
  };

  // Submit Consultation
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!symptoms.trim()) {
      alert('Please enter at least one symptom or observation.');
      return;
    }
    if (!diagnosis.trim()) {
      alert('Please enter or select a Primary Diagnosis.');
      return;
    }

    try {
      setSaving(true);
      const consultationPayload = {
        appointmentId: selectedApptId,
        patientId: activePatient.id,
        patientName: activePatient.name,
        doctorName: currentUser.name || 'Dr. Prateek Pradeep',
        vitals: {
          bp: `${bpSystolic}/${bpDiastolic}`,
          pulse,
          temp,
          weight,
          height,
          bmi
        },
        symptoms,
        diagnosis,
        remarks,
        medicines,
        labTests: selectedLabs,
        labPriority,
        labRemarks
      };

      await doctorService.createConsultation(consultationPayload);
      setToast('Consultation saved successfully! Prescription dispatched to Pharmacy.');
      setTimeout(() => {
        navigate('/doctor');
      }, 1500);
    } catch (err) {
      alert('Failed to save consultation: ' + err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div style={{ maxWidth: '1000px', margin: '0 auto' }}>
      {/* Top Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Link to="/doctor" className="btn btn-sm btn-outline" style={{ padding: '0.2rem 0.5rem' }}>
              ← Back to Queue
            </Link>
            <h1 style={{ fontSize: '1.6rem', fontWeight: 800 }}>Clinical Consultation Form</h1>
          </div>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginTop: '0.25rem' }}>
            Examine patient, record vitals, write diagnosis, prescribe drugs, and order investigations.
          </p>
        </div>
      </div>

      {toast && (
        <div style={{ background: '#dcfce7', color: '#166534', padding: '1rem', borderRadius: 'var(--radius-md)', marginBottom: '1.5rem', fontWeight: 600 }}>
          ✓ {toast}
        </div>
      )}

      {/* Patient Selection Banner */}
      <div className="card" style={{ padding: '1.25rem', marginBottom: '1.5rem', background: 'linear-gradient(135deg, rgba(0,87,184,0.06), rgba(0,87,184,0.02))', borderLeft: '5px solid var(--primary)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <div style={{ fontSize: '0.8rem', color: 'var(--primary)', fontWeight: 700, textTransform: 'uppercase' }}>
              CONSULTING PATIENT
            </div>
            <div style={{ fontSize: '1.3rem', fontWeight: 800, marginTop: '0.15rem' }}>
              {activePatient.name} &bull; Token #{activePatient.token}
            </div>
            <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
              ID: <strong>{activePatient.id}</strong> &bull; {activePatient.age} yrs / {activePatient.gender} &bull; Chief Complaint: <em>"{activePatient.reason}"</em>
            </div>
          </div>

          <div>
            <label style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', display: 'block', marginBottom: '0.25rem' }}>
              CHANGE ACTIVE TOKEN
            </label>
            <select className="form-control" value={selectedApptId} onChange={handleApptSelect} style={{ padding: '0.4rem 0.75rem', fontSize: '0.85rem' }}>
              {appointments.map((a) => (
                <option key={a.appointmentId || a.id} value={a.appointmentId || a.id}>
                  Token #{a.tokenNumber} - {a.patientName} ({a.status})
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        
        {/* Section 1: Patient Vitals */}
        <div className="card" style={{ padding: '1.5rem', marginBottom: '1.5rem' }}>
          <h3 style={{ fontSize: '1.1rem', fontWeight: 800, marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <HeartPulseIcon size={20} color="var(--primary)" />
            Patient Vital Signs
          </h3>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1rem' }}>
            <div>
              <label className="form-label">Blood Pressure (mmHg)</label>
              <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                <input
                  type="number"
                  className="form-control"
                  placeholder="Sys (120)"
                  value={bpSystolic}
                  onChange={(e) => setBpSystolic(e.target.value)}
                  required
                />
                <span>/</span>
                <input
                  type="number"
                  className="form-control"
                  placeholder="Dia (80)"
                  value={bpDiastolic}
                  onChange={(e) => setBpDiastolic(e.target.value)}
                  required
                />
              </div>
            </div>

            <div>
              <label className="form-label">Pulse Rate (BPM)</label>
              <input
                type="number"
                className="form-control"
                placeholder="e.g. 76"
                value={pulse}
                onChange={(e) => setPulse(e.target.value)}
                required
              />
            </div>

            <div>
              <label className="form-label">Temperature (°F)</label>
              <input
                type="number"
                step="0.1"
                className="form-control"
                placeholder="e.g. 98.6"
                value={temp}
                onChange={(e) => setTemp(e.target.value)}
                required
              />
            </div>

            <div>
              <label className="form-label">Weight (kg) & Height (cm)</label>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <input
                  type="number"
                  className="form-control"
                  placeholder="kg"
                  value={weight}
                  onChange={(e) => setWeight(e.target.value)}
                />
                <input
                  type="number"
                  className="form-control"
                  placeholder="cm"
                  value={height}
                  onChange={(e) => setHeight(e.target.value)}
                />
              </div>
            </div>
          </div>

          <div style={{ marginTop: '1rem', padding: '0.75rem 1rem', background: 'var(--bg-page)', borderRadius: 'var(--radius-sm)', display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Calculated BMI:</span>
            <strong style={{ fontSize: '1.05rem', color: 'var(--primary)' }}>{bmi} kg/m²</strong>
            <span className="badge badge-scheduled" style={{ fontSize: '0.75rem' }}>{bmiClass}</span>
          </div>
        </div>

        {/* Section 2: Clinical Examination & Diagnosis */}
        <div className="card" style={{ padding: '1.5rem', marginBottom: '1.5rem' }}>
          <h3 style={{ fontSize: '1.1rem', fontWeight: 800, marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <StethoscopeIcon size={20} color="var(--primary)" />
            Clinical Examination & Diagnosis
          </h3>

          <div className="form-group" style={{ marginBottom: '1rem' }}>
            <label className="form-label">Symptoms & Chief Complaints *</label>
            <div style={{ display: 'flex', gap: '0.35rem', flexWrap: 'wrap', marginBottom: '0.5rem' }}>
              {COMMON_SYMPTOMS.map((sym) => (
                <button
                  type="button"
                  key={sym}
                  className="btn btn-sm btn-outline"
                  style={{ padding: '0.15rem 0.5rem', fontSize: '0.75rem', borderRadius: '12px' }}
                  onClick={() => addSymptomChip(sym)}
                >
                  + {sym}
                </button>
              ))}
            </div>
            <textarea
              className="form-control"
              rows={3}
              placeholder="Record presenting symptoms, onset, and duration..."
              value={symptoms}
              onChange={(e) => setSymptoms(e.target.value)}
              required
            />
          </div>

          <div className="form-group" style={{ marginBottom: '1rem' }}>
            <label className="form-label">Primary Diagnosis *</label>
            <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.5rem' }}>
              <select
                className="form-control"
                onChange={(e) => {
                  if (e.target.value) setDiagnosis(e.target.value);
                }}
                defaultValue=""
              >
                <option value="">-- Or Choose From Standard Diagnosis Catalog --</option>
                {COMMON_DIAGNOSES.map((d) => (
                  <option key={d} value={d}>{d}</option>
                ))}
              </select>
            </div>
            <input
              type="text"
              className="form-control"
              placeholder="e.g. Acute Pharyngitis & Upper Respiratory Infection"
              value={diagnosis}
              onChange={(e) => setDiagnosis(e.target.value)}
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">Doctor's Clinical Remarks / Advice</label>
            <textarea
              className="form-control"
              rows={2}
              placeholder="e.g. Bed rest for 2 days, maintain warm fluid intake, review if fever persists > 48h."
              value={remarks}
              onChange={(e) => setRemarks(e.target.value)}
            />
          </div>
        </div>

        {/* Section 3: Prescription Builder (Rx) */}
        <div className="card" style={{ padding: '1.5rem', marginBottom: '1.5rem' }}>
          <h3 style={{ fontSize: '1.1rem', fontWeight: 800, marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <PillIcon size={20} color="var(--primary)" />
            Prescription & Medicine Builder (Rx)
          </h3>

          <div style={{ background: 'var(--bg-page)', padding: '1rem', borderRadius: 'var(--radius-md)', marginBottom: '1.25rem' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1.2fr 1.2fr 1fr', gap: '0.75rem', marginBottom: '0.75rem' }}>
              <div>
                <label className="form-label" style={{ fontSize: '0.75rem' }}>Medicine Name</label>
                <input
                  type="text"
                  list="medicineCatalogList"
                  className="form-control"
                  placeholder="Select or type drug"
                  value={selectedMed}
                  onChange={handleMedChange}
                />
                <datalist id="medicineCatalogList">
                  {medicineCatalog.map((m) => (
                    <option key={m.id} value={m.name}>
                      {m.dosage} ({m.type}) &bull; Stock: {m.stock}
                    </option>
                  ))}
                </datalist>
              </div>

              <div>
                <label className="form-label" style={{ fontSize: '0.75rem' }}>Dosage</label>
                <input
                  type="text"
                  className="form-control"
                  placeholder="500mg"
                  value={dosage}
                  onChange={(e) => setDosage(e.target.value)}
                />
              </div>

              <div>
                <label className="form-label" style={{ fontSize: '0.75rem' }}>Frequency</label>
                <select className="form-control" value={freq} onChange={(e) => setFreq(e.target.value)}>
                  <option value="1-0-1">1-0-1 (Morning & Night)</option>
                  <option value="1-0-0">1-0-0 (Morning only)</option>
                  <option value="0-0-1">0-0-1 (Night only)</option>
                  <option value="1-1-1">1-1-1 (Thrice daily)</option>
                  <option value="SOS">SOS (As needed)</option>
                </select>
              </div>

              <div>
                <label className="form-label" style={{ fontSize: '0.75rem' }}>Timing</label>
                <select className="form-control" value={timing} onChange={(e) => setTiming(e.target.value)}>
                  <option value="After Food">After Food</option>
                  <option value="Before Food">Before Food</option>
                  <option value="With Food">With Food</option>
                </select>
              </div>

              <div>
                <label className="form-label" style={{ fontSize: '0.75rem' }}>Duration</label>
                <select className="form-control" value={duration} onChange={(e) => setDuration(e.target.value)}>
                  <option value="3 Days">3 Days</option>
                  <option value="5 Days">5 Days</option>
                  <option value="7 Days">7 Days</option>
                  <option value="10 Days">10 Days</option>
                  <option value="14 Days">14 Days</option>
                  <option value="1 Month">1 Month</option>
                </select>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'flex-end' }}>
              <div style={{ flex: 1 }}>
                <input
                  type="text"
                  className="form-control"
                  placeholder="Special instructions (e.g. Dissolve in warm water)"
                  value={instructions}
                  onChange={(e) => setInstructions(e.target.value)}
                />
              </div>
              <button type="button" className="btn btn-primary" onClick={handleAddMedicine} style={{ padding: '0.5rem 1.25rem' }}>
                + Add to Rx
              </button>
            </div>
          </div>

          {/* Added Medicines Table */}
          {medicines.length === 0 ? (
            <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', textAlign: 'center', margin: '1rem 0' }}>
              No medications added yet. Select a medicine above and click "+ Add to Rx".
            </p>
          ) : (
            <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: '0.5rem' }}>
              <thead>
                <tr style={{ textAlign: 'left', borderBottom: '2px solid var(--border)', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                  <th style={{ padding: '0.5rem' }}>Medicine</th>
                  <th>Dosage</th>
                  <th>Frequency</th>
                  <th>Timing</th>
                  <th>Duration</th>
                  <th>Instructions</th>
                  <th style={{ textAlign: 'right' }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {medicines.map((m, idx) => (
                  <tr key={idx} style={{ borderBottom: '1px solid var(--border)', fontSize: '0.88rem' }}>
                    <td style={{ padding: '0.6rem 0.5rem', fontWeight: 700 }}>{m.name}</td>
                    <td>{m.dosage}</td>
                    <td><span className="badge badge-scheduled">{m.freq}</span></td>
                    <td>{m.timing}</td>
                    <td>{m.duration}</td>
                    <td style={{ color: 'var(--text-muted)' }}>{m.instructions}</td>
                    <td style={{ textAlign: 'right' }}>
                      <button
                        type="button"
                        onClick={() => handleRemoveMedicine(idx)}
                        style={{ background: 'transparent', border: 'none', color: 'var(--danger, #dc2626)', cursor: 'pointer', fontWeight: 700 }}
                      >
                        ✕ Remove
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Section 4: Laboratory Test Investigation Orders */}
        <div className="card" style={{ padding: '1.5rem', marginBottom: '1.5rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <FlaskIcon size={20} color="var(--primary)" />
              Laboratory Diagnostic Orders
            </h3>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 600 }}>Priority:</span>
              <select
                className="form-control"
                value={labPriority}
                onChange={(e) => setLabPriority(e.target.value)}
                style={{ padding: '0.2rem 0.5rem', fontSize: '0.8rem' }}
              >
                <option value="Routine">Routine</option>
                <option value="STAT / Urgent">STAT / Urgent</option>
              </select>
            </div>
          </div>

          <p style={{ color: 'var(--text-muted)', fontSize: '0.82rem', marginBottom: '0.75rem' }}>
            Check any tests required for diagnostic confirmation. Ordered tests are instantly routed to the Lab Technician queue:
          </p>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '0.5rem', marginBottom: '1rem' }}>
            {labCatalog.map((test) => {
              const isChecked = selectedLabs.includes(test.name);
              return (
                <label
                  key={test.id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.6rem',
                    padding: '0.5rem 0.75rem',
                    borderRadius: 'var(--radius-sm)',
                    border: isChecked ? '1px solid var(--primary)' : '1px solid var(--border)',
                    background: isChecked ? 'rgba(0,87,184,0.05)' : 'var(--bg-card)',
                    cursor: 'pointer',
                    fontSize: '0.85rem'
                  }}
                >
                  <input
                    type="checkbox"
                    checked={isChecked}
                    onChange={() => toggleLabTest(test.name)}
                  />
                  <span>
                    <strong>{test.name}</strong> <span style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>({test.sample})</span>
                  </span>
                </label>
              );
            })}
          </div>

          <input
            type="text"
            className="form-control"
            placeholder="Clinical instructions for lab technician (e.g. Fasting 10 hours required)..."
            value={labRemarks}
            onChange={(e) => setLabRemarks(e.target.value)}
          />
        </div>

        {/* Submit Bar */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginBottom: '3rem' }}>
          <button
            type="button"
            className="btn btn-outline"
            onClick={() => navigate('/doctor')}
          >
            Cancel
          </button>
          <button
            type="submit"
            className="btn btn-primary"
            style={{ padding: '0.75rem 2rem', fontSize: '1rem', fontWeight: 800, display: 'inline-flex', alignItems: 'center', gap: '0.5rem' }}
            disabled={saving}
          >
            <SaveIcon size={18} />
            {saving ? 'Saving Consultation...' : 'Save Consultation & Prescribe'}
          </button>
        </div>

      </form>
    </div>
  );
}
