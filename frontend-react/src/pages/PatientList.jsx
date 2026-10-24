import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import receptionistService, { getApiErrorMessage } from '../services/receptionistService';

const ageFromDob = (dob) => {
  if (!dob) return '—';
  const date = new Date(`${dob}T00:00:00`);
  const now = new Date();
  let age = now.getFullYear() - date.getFullYear();
  if (now < new Date(now.getFullYear(), date.getMonth(), date.getDate())) age -= 1;
  return Number.isNaN(age) ? '—' : age;
};

export default function PatientList() {
  const [patients, setPatients] = useState([]);
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let isMounted = true;
    const fetchInitial = async () => {
      setLoading(true);
      try {
        const nextPatients = await receptionistService.getPatients();
        if (isMounted) {
          setPatients(nextPatients);
          setError('');
        }
      } catch (requestError) {
        if (isMounted) {
          setPatients([]);
          setError(getApiErrorMessage(requestError, 'Unable to load patients.'));
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    fetchInitial();
    return () => {
      isMounted = false;
    };
  }, []);

  const handleSearch = async (event) => {
    event?.preventDefault();
    setLoading(true);
    try {
      const nextPatients = await receptionistService.getPatients(query);
      setPatients(nextPatients);
      setError('');
    } catch (requestError) {
      setPatients([]);
      setError(getApiErrorMessage(requestError, 'Unable to search patients.'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="card" style={{ padding: '1.5rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '1rem', flexWrap: 'wrap', marginBottom: '1rem' }}>
        <div>
          <h2>Patient Records Directory</h2>
          <p className="text-muted text-sm">Live data from the receptionist patient API.</p>
        </div>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <Link to="/receptionist" className="btn btn-sm btn-outline">Reception Portal</Link>
          <Link to="/patients/new" className="btn btn-sm btn-primary">+ Add Patient</Link>
        </div>
      </div>
      <form onSubmit={handleSearch} style={{ display: 'flex', gap: '.5rem', marginBottom: '1rem' }}>
        <input
          className="form-control"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Search name, ID, phone, or address"
          aria-label="Search patients"
        />
        <button className="btn btn-primary" type="submit" disabled={loading}>
          {loading ? 'Searching…' : 'Search'}
        </button>
      </form>
      {error && <p className="text-danger text-sm">{error}</p>}
      {loading ? (
        <p className="empty-state">Loading patients…</p>
      ) : (
        <div className="table-responsive">
          <table className="table">
            <thead>
              <tr>
                <th>Patient ID</th>
                <th>Name</th>
                <th>Age / Gender</th>
                <th>Phone</th>
                <th>Blood Group</th>
              </tr>
            </thead>
            <tbody>
              {patients.length === 0 ? (
                <tr>
                  <td colSpan="5" className="empty-state">No patients found.</td>
                </tr>
              ) : (
                patients.map((patient) => (
                  <tr key={patient.PatientId}>
                    <td><strong>{patient.PatientId}</strong></td>
                    <td>{patient.Name}</td>
                    <td>{ageFromDob(patient.DOB)} / {patient.Gender}</td>
                    <td>{patient.PhoneNumber}</td>
                    <td><span className="badge badge-scheduled">{patient.BloodGroup}</span></td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
