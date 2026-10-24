import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import receptionistService, { getApiErrorMessage } from '../services/receptionistService';

const initialForm = { Name: '', Gender: '', DOB: '', PhoneNumber: '', Address: '', BloodGroup: '', Weight: '', Height: '' };

export default function PatientForm() {
  const navigate = useNavigate();
  const [form, setForm] = useState(initialForm);
  const [state, setState] = useState({ submitting: false, error: '' });
  const update = (event) => setForm({ ...form, [event.target.name]: event.target.value });

  const submit = async (event) => {
    event.preventDefault();
    setState({ submitting: true, error: '' });
    try {
      await receptionistService.createPatient({ ...form, Weight: Number(form.Weight), Height: Number(form.Height) });
      navigate('/patients');
    } catch (error) {
      setState({ submitting: false, error: getApiErrorMessage(error, 'Unable to register patient.') });
    }
  };

  return <div style={{ maxWidth: '720px', margin: '0 auto' }}>
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}><h2>Patient Registration Form</h2><button type="button" className="btn btn-sm btn-outline" onClick={() => navigate('/patients')}>Back to Patients</button></div>
    <div className="card" style={{ padding: '2rem' }}><form onSubmit={submit}>
      <div className="form-group"><label className="form-label" htmlFor="patient-name">Full Name *</label><input id="patient-name" name="Name" className="form-control" value={form.Name} onChange={update} required /></div>
      <div className="form-row"><div className="form-group"><label className="form-label" htmlFor="patient-dob">Date of Birth *</label><input id="patient-dob" name="DOB" type="date" className="form-control" value={form.DOB} onChange={update} required /></div><div className="form-group"><label className="form-label" htmlFor="patient-gender">Gender *</label><select id="patient-gender" name="Gender" className="form-control" value={form.Gender} onChange={update} required><option value="">Select</option><option>Male</option><option>Female</option><option>Other</option></select></div></div>
      <div className="form-row"><div className="form-group"><label className="form-label" htmlFor="patient-phone">Phone Number *</label><input id="patient-phone" name="PhoneNumber" className="form-control" inputMode="numeric" value={form.PhoneNumber} onChange={update} required /></div><div className="form-group"><label className="form-label" htmlFor="patient-blood">Blood Group *</label><select id="patient-blood" name="BloodGroup" className="form-control" value={form.BloodGroup} onChange={update} required><option value="">Select</option>{['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'].map((group) => <option key={group}>{group}</option>)}</select></div></div>
      <div className="form-group"><label className="form-label" htmlFor="patient-address">Address *</label><textarea id="patient-address" name="Address" className="form-control" value={form.Address} onChange={update} required /></div>
      <div className="form-row"><div className="form-group"><label className="form-label" htmlFor="patient-weight">Weight (kg) *</label><input id="patient-weight" name="Weight" type="number" min="0.1" step="0.1" className="form-control" value={form.Weight} onChange={update} required /></div><div className="form-group"><label className="form-label" htmlFor="patient-height">Height (cm) *</label><input id="patient-height" name="Height" type="number" min="0.1" step="0.1" className="form-control" value={form.Height} onChange={update} required /></div></div>
      {state.error && <p className="text-danger text-sm" role="alert">{state.error}</p>}<button type="submit" className="btn btn-primary" disabled={state.submitting} style={{ width: '100%' }}>{state.submitting ? 'Registering…' : 'Register Patient'}</button>
    </form></div>
  </div>;
}
