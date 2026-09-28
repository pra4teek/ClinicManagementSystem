/* ========================================================
   CAREPOINT CLINIC MANAGEMENT SYSTEM - DOCTOR LOGIC
   ======================================================== */

let currentUser = null;
let activeAppt = null;
let currentRxItems = [];
let currentFilter = 'all';

document.addEventListener('DOMContentLoaded', function() {
  currentUser = requireAuth(['Doctor', 'Admin'], '../index.html');
  if (!currentUser) return;

  document.getElementById('docName').textContent = currentUser.name || 'Dr. Jane Smith';
  document.getElementById('docAvatar').textContent = (currentUser.name || 'DR').substring(0, 2).toUpperCase();

  const now = new Date();
  document.getElementById('dateDisplay').textContent = `📅 ${now.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric', year: 'numeric' })}`;

  loadMedicineOptions();
  renderQueueAndStats();

  document.getElementById('consultationForm').addEventListener('submit', handleConsultationSave);
});

function loadMedicineOptions() {
  const meds = getStorage(CMS_KEYS.MEDICINES, []);
  const dl = document.getElementById('medOptions');
  dl.innerHTML = '';
  meds.forEach(m => {
    const opt = document.createElement('option');
    opt.value = m.name;
    opt.dataset.dosage = m.dosage;
    dl.appendChild(opt);
  });

  document.getElementById('rxMedName').addEventListener('input', function(e) {
    const found = meds.find(m => m.name.toLowerCase() === e.target.value.toLowerCase());
    if (found && found.dosage) {
      document.getElementById('rxDosage').value = found.dosage;
    }
  });
}

function setFilter(f) {
  currentFilter = f;
  document.getElementById('btnFilterAll').className = `btn btn-sm ${f === 'all' ? 'btn-primary' : 'btn-outline'}`;
  document.getElementById('btnFilterWait').className = `btn btn-sm ${f === 'Scheduled' ? 'btn-primary' : 'btn-outline'}`;
  document.getElementById('btnFilterDone').className = `btn btn-sm ${f === 'Completed' ? 'btn-primary' : 'btn-outline'}`;
  renderQueueAndStats();
}

function renderQueueAndStats() {
  const appts = getStorage(CMS_KEYS.APPOINTMENTS, []);
  const rxList = getStorage(CMS_KEYS.PRESCRIPTIONS, []);

  const total = appts.length;
  const waiting = appts.filter(a => a.status === 'Scheduled').length;
  const done = appts.filter(a => a.status === 'Completed').length;

  document.getElementById('statTotal').textContent = total;
  document.getElementById('statWaiting').textContent = waiting;
  document.getElementById('statCompleted').textContent = done;
  document.getElementById('statRx').textContent = rxList.length;
  document.getElementById('queueBadge').textContent = `${waiting} Waiting`;

  let list = [...appts];
  if (currentFilter === 'Scheduled') list = list.filter(a => a.status === 'Scheduled');
  else if (currentFilter === 'Completed') list = list.filter(a => a.status === 'Completed');

  const container = document.getElementById('queueList');
  container.innerHTML = '';

  if (list.length === 0) {
    container.innerHTML = `<div style="text-align:center; padding: 2rem; color: var(--text-muted);">No appointments found.</div>`;
    return;
  }

  list.forEach(a => {
    const isSelected = activeAppt && activeAppt.appointmentId === a.appointmentId;
    const card = document.createElement('div');
    card.className = `queue-card ${isSelected ? 'active' : ''}`;
    
    let badgeClass = 'badge-scheduled';
    if (a.status === 'Completed') badgeClass = 'badge-completed';
    else if (a.status === 'In-Progress') badgeClass = 'badge-in-progress';

    card.innerHTML = `
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.25rem;">
        <span class="token-badge">Token #${a.tokenNumber || '—'}</span>
        <span class="badge ${badgeClass}">${a.status}</span>
      </div>
      <div style="font-weight: 700; color: var(--text-main); font-size: 0.95rem;">${a.patientName}</div>
      <div style="font-size: 0.8rem; color: var(--text-muted); margin-top: 0.15rem;">
        🕒 ${a.time || '10:00 AM'} • ${a.reason || 'General Checkup'}
      </div>
    `;
    card.onclick = () => selectPatient(a);
    container.appendChild(card);
  });
}

function selectPatient(appt) {
  activeAppt = appt;
  currentRxItems = [];
  renderRxTable();

  const patients = getStorage(CMS_KEYS.PATIENTS, []);
  const p = patients.find(pat => pat.patientId === appt.patientId) || {
    name: appt.patientName,
    age: '—',
    gender: '—',
    bloodGroup: '—',
    phone: '—'
  };

  document.getElementById('panelPatName').textContent = p.name;
  document.getElementById('panelPatMeta').textContent = `Age: ${p.age || '—'} | ${p.gender || '—'} | Blood Group: ${p.bloodGroup || '—'}`;
  document.getElementById('panelPatPhone').textContent = p.phone || '—';
  document.getElementById('panelToken').textContent = `Token #${appt.tokenNumber || '—'}`;
  document.getElementById('panelTime').textContent = appt.time || '—';
  document.getElementById('panelComplaint').textContent = appt.reason || 'General Consultation';

  // Defaults
  document.getElementById('vitalBP').value = '120/80';
  document.getElementById('vitalPulse').value = '72';
  document.getElementById('vitalTemp').value = '98.6';
  document.getElementById('vitalWeight').value = '68';
  document.getElementById('diagSymptoms').value = appt.reason || '';
  document.getElementById('diagPrimary').value = '';
  document.getElementById('diagRemarks').value = '';
  document.getElementById('labRemarks').value = '';
  document.querySelectorAll('input[name="labCheck"]').forEach(cb => cb.checked = false);

  if (appt.status === 'Completed') {
    document.getElementById('btnPrintRx').style.display = 'inline-flex';
    const cons = getStorage(CMS_KEYS.CONSULTATIONS, []);
    const existing = cons.find(c => c.appointmentId === appt.appointmentId);
    if (existing) {
      if (existing.vitals) {
        document.getElementById('vitalBP').value = existing.vitals.bp || '';
        document.getElementById('vitalPulse').value = existing.vitals.pulse || '';
        document.getElementById('vitalTemp').value = existing.vitals.temp || '';
        document.getElementById('vitalWeight').value = existing.vitals.weight || '';
      }
      document.getElementById('diagSymptoms').value = existing.symptoms || '';
      document.getElementById('diagPrimary').value = existing.diagnosis || '';
      document.getElementById('diagRemarks').value = existing.remarks || '';
    }

    const rxList = getStorage(CMS_KEYS.PRESCRIPTIONS, []);
    const existingRx = rxList.find(r => r.appointmentId === appt.appointmentId);
    if (existingRx && existingRx.items) {
      currentRxItems = [...existingRx.items];
      renderRxTable();
    }
  } else {
    document.getElementById('btnPrintRx').style.display = 'none';
  }

  document.getElementById('noSelection').style.display = 'none';
  document.getElementById('consultationPanel').style.display = 'block';
  renderQueueAndStats();
}

function addRxItem() {
  const name = document.getElementById('rxMedName').value.trim();
  const dosage = document.getElementById('rxDosage').value.trim() || '500mg';
  const freq = document.getElementById('rxFrequency').value;
  const dur = document.getElementById('rxDuration').value.trim() || '5 Days';
  const inst = document.getElementById('rxInstructions').value;

  if (!name) {
    showToast('Please type a medicine name!', 'warning');
    return;
  }

  currentRxItems.push({
    medicineName: name,
    dosage: dosage,
    frequency: freq,
    duration: dur,
    instructions: inst
  });

  document.getElementById('rxMedName').value = '';
  document.getElementById('rxDosage').value = '';
  document.getElementById('rxDuration').value = '';
  document.getElementById('rxMedName').focus();

  renderRxTable();
  showToast(`Added ${name} to prescription.`, 'info');
}

function removeRx(idx) {
  currentRxItems.splice(idx, 1);
  renderRxTable();
}

function renderRxTable() {
  const tbl = document.getElementById('rxTable');
  const tbody = document.getElementById('rxTableBody');
  tbody.innerHTML = '';

  if (currentRxItems.length === 0) {
    tbl.style.display = 'none';
    return;
  }

  tbl.style.display = 'table';
  currentRxItems.forEach((it, i) => {
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td><strong>${it.medicineName}</strong></td>
      <td>${it.dosage}</td>
      <td><span class="badge badge-scheduled">${it.frequency}</span></td>
      <td>${it.duration}</td>
      <td>${it.instructions}</td>
      <td>
        <button type="button" class="btn btn-outline btn-sm" style="color: var(--danger); border-color:#fca5a5;" onclick="removeRx(${i})">🗑️</button>
      </td>
    `;
    tbody.appendChild(tr);
  });
}

function cancelConsultation() {
  activeAppt = null;
  currentRxItems = [];
  document.getElementById('noSelection').style.display = 'block';
  document.getElementById('consultationPanel').style.display = 'none';
  renderQueueAndStats();
}

function handleConsultationSave(e) {
  e.preventDefault();
  if (!activeAppt) return;

  const diag = document.getElementById('diagPrimary').value.trim();
  const symp = document.getElementById('diagSymptoms').value.trim();
  const remarks = document.getElementById('diagRemarks').value.trim();

  if (!diag) {
    showToast('Primary diagnosis is required!', 'warning');
    return;
  }

  const vitals = {
    bp: document.getElementById('vitalBP').value.trim(),
    pulse: document.getElementById('vitalPulse').value.trim(),
    temp: document.getElementById('vitalTemp').value.trim(),
    weight: document.getElementById('vitalWeight').value.trim()
  };

  const todayStr = new Date().toISOString().split('T')[0];
  const uid = Date.now().toString().slice(-4);
  const consultationId = `CNS-${uid}`;

  // 1. Save Consultation
  const consList = getStorage(CMS_KEYS.CONSULTATIONS, []);
  const newCons = {
    consultationId: consultationId,
    appointmentId: activeAppt.appointmentId,
    patientId: activeAppt.patientId,
    patientName: activeAppt.patientName,
    doctorName: currentUser.name || 'Dr. Jane Smith',
    date: todayStr,
    vitals: vitals,
    symptoms: symp,
    diagnosis: diag,
    remarks: remarks,
    status: 'Completed'
  };

  const cIdx = consList.findIndex(c => c.appointmentId === activeAppt.appointmentId);
  if (cIdx >= 0) consList[cIdx] = newCons;
  else consList.push(newCons);
  setStorage(CMS_KEYS.CONSULTATIONS, consList);

  // 2. Save Prescription (Shared with Pharmacist Adarsh!)
  if (currentRxItems.length > 0) {
    const rxList = getStorage(CMS_KEYS.PRESCRIPTIONS, []);
    const newRx = {
      prescriptionId: `RX-${uid}`,
      consultationId: consultationId,
      appointmentId: activeAppt.appointmentId,
      patientId: activeAppt.patientId,
      patientName: activeAppt.patientName,
      doctorName: currentUser.name || 'Dr. Jane Smith',
      date: todayStr,
      items: currentRxItems,
      status: 'Pending'
    };

    const rIdx = rxList.findIndex(r => r.appointmentId === activeAppt.appointmentId);
    if (rIdx >= 0) rxList[rIdx] = newRx;
    else rxList.push(newRx);
    setStorage(CMS_KEYS.PRESCRIPTIONS, rxList);
  }

  // 3. Save Lab Orders (Shared with Lab Tech!)
  const labTests = [];
  document.querySelectorAll('input[name="labCheck"]:checked').forEach(cb => labTests.push(cb.value));

  if (labTests.length > 0) {
    const labList = getStorage(CMS_KEYS.LAB_ORDERS, []);
    labList.push({
      labOrderId: `LAB-${uid}`,
      consultationId: consultationId,
      appointmentId: activeAppt.appointmentId,
      patientId: activeAppt.patientId,
      patientName: activeAppt.patientName,
      doctorName: currentUser.name || 'Dr. Jane Smith',
      date: todayStr,
      tests: labTests,
      remarks: document.getElementById('labRemarks').value.trim(),
      status: 'Pending'
    });
    setStorage(CMS_KEYS.LAB_ORDERS, labList);
  }

  // 4. Update Appointment Status to Completed
  const appts = getStorage(CMS_KEYS.APPOINTMENTS, []);
  const aIdx = appts.findIndex(a => a.appointmentId === activeAppt.appointmentId);
  if (aIdx >= 0) {
    appts[aIdx].status = 'Completed';
    setStorage(CMS_KEYS.APPOINTMENTS, appts);
  }

  showToast(`Consultation completed for ${activeAppt.patientName}!`, 'success');
  document.getElementById('btnPrintRx').style.display = 'inline-flex';

  renderQueueAndStats();
}

function openPrintModal() {
  if (!activeAppt) return;

  const consList = getStorage(CMS_KEYS.CONSULTATIONS, []);
  const cons = consList.find(c => c.appointmentId === activeAppt.appointmentId);
  const rxList = getStorage(CMS_KEYS.PRESCRIPTIONS, []);
  const rx = rxList.find(r => r.appointmentId === activeAppt.appointmentId);
  const labList = getStorage(CMS_KEYS.LAB_ORDERS, []);
  const lab = labList.find(l => l.appointmentId === activeAppt.appointmentId);

  document.getElementById('modalDoc').textContent = currentUser.name || 'Dr. Jane Smith';
  document.getElementById('modalPat').textContent = activeAppt.patientName;
  document.getElementById('modalMeta').textContent = document.getElementById('panelPatMeta').textContent;
  document.getElementById('modalDate').textContent = cons ? cons.date : new Date().toISOString().split('T')[0];
  document.getElementById('modalRx').textContent = rx ? rx.prescriptionId : 'RX-NEW';
  document.getElementById('modalDiag').textContent = cons ? cons.diagnosis : document.getElementById('diagPrimary').value;
  document.getElementById('modalAdvice').textContent = (cons && cons.remarks) ? cons.remarks : (document.getElementById('diagRemarks').value || 'Rest and review in 5 days.');

  const rxTable = document.getElementById('modalRxList');
  rxTable.innerHTML = '';
  const items = (rx && rx.items) ? rx.items : currentRxItems;
  if (items.length === 0) {
    rxTable.innerHTML = `<tr><td colspan="6" style="padding: 0.5rem 0; color: #64748b;">No medications prescribed.</td></tr>`;
  } else {
    items.forEach((it, i) => {
      rxTable.innerHTML += `
        <tr style="border-bottom: 1px dashed #e2e8f0;">
          <td style="padding: 0.4rem 0;">${i+1}</td>
          <td style="padding: 0.4rem 0;"><strong>${it.medicineName}</strong></td>
          <td style="padding: 0.4rem 0;">${it.dosage}</td>
          <td style="padding: 0.4rem 0;">${it.frequency}</td>
          <td style="padding: 0.4rem 0;">${it.duration}</td>
          <td style="padding: 0.4rem 0;">${it.instructions}</td>
        </tr>
      `;
    });
  }

  const labBox = document.getElementById('modalLabBox');
  if (lab && lab.tests && lab.tests.length > 0) {
    labBox.style.display = 'block';
    document.getElementById('modalLabTests').textContent = lab.tests.join(', ');
  } else {
    labBox.style.display = 'none';
  }

  document.getElementById('printModal').classList.add('show');
}

function closePrintModal() {
  document.getElementById('printModal').classList.remove('show');
}
