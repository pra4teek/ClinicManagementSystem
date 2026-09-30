/* ========================================================
   CAREPOINT CLINIC MANAGEMENT SYSTEM - DOCTOR LOGIC
   ======================================================== */

let currentUser = null;
let activeAppt = null;
let currentRxItems = [];
let currentFilter = 'all';

const DRAFTS_KEY = 'cms_consultation_drafts';

function saveConsultationDraft() {
  if (!activeAppt || activeAppt.status === 'Completed') return;
  try {
    const drafts = JSON.parse(localStorage.getItem(DRAFTS_KEY) || '{}');
    const checkedLabs = [];
    document.querySelectorAll('input[name="labCheck"]:checked').forEach(cb => checkedLabs.push(cb.value));

    drafts[activeAppt.appointmentId] = {
      symptoms: document.getElementById('diagSymptoms')?.value || '',
      diagnosis: document.getElementById('diagPrimary')?.value || '',
      remarks: document.getElementById('diagRemarks')?.value || '',
      vitals: {
        bp: document.getElementById('vitalBP')?.value || '',
        pulse: document.getElementById('vitalPulse')?.value || '',
        temp: document.getElementById('vitalTemp')?.value || '',
        weight: document.getElementById('vitalWeight')?.value || ''
      },
      labRemarks: document.getElementById('labRemarks')?.value || '',
      labTests: checkedLabs,
      rxItems: currentRxItems || [],
      savedAt: Date.now()
    };
    localStorage.setItem(DRAFTS_KEY, JSON.stringify(drafts));
  } catch(e) {}
}

function getConsultationDraft(apptId) {
  try {
    const drafts = JSON.parse(localStorage.getItem(DRAFTS_KEY) || '{}');
    return drafts[apptId] || null;
  } catch(e) {
    return null;
  }
}

function clearConsultationDraft(apptId) {
  try {
    const drafts = JSON.parse(localStorage.getItem(DRAFTS_KEY) || '{}');
    delete drafts[apptId];
    localStorage.setItem(DRAFTS_KEY, JSON.stringify(drafts));
  } catch(e) {}
}

document.addEventListener('DOMContentLoaded', function() {
  currentUser = requireAuth(['Doctor', 'Admin'], '../index.html');
  if (!currentUser) return;

  const name = currentUser.name || 'Doctor';
  document.getElementById('docName').textContent = name;
  document.getElementById('docAvatar').textContent = name.substring(0, 2).toUpperCase();

  const now = new Date();
  const hour = now.getHours();
  const greeting = hour < 12 ? 'Good Morning' : hour < 17 ? 'Good Afternoon' : 'Good Evening';

  document.getElementById('greetingText').textContent = `${greeting}, ${name}`;
  document.getElementById('dateDisplay').textContent =
    now.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' });

  loadMedicineOptions();
  renderQueueAndStats();

  const cForm = document.getElementById('consultationForm');
  if (cForm) {
    cForm.addEventListener('submit', handleConsultationSave);
    cForm.addEventListener('input', saveConsultationDraft);
    cForm.addEventListener('change', saveConsultationDraft);
  }
});

function loadMedicineOptions() {
  const meds = typeof getAdminMedicineStock === 'function' ? getAdminMedicineStock() : getStorage(CMS_KEYS.MEDICINES, []);
  const dl = document.getElementById('medOptions');
  if (!dl) return;
  dl.innerHTML = '';

  meds.forEach(m => {
    const medName = m.name || m.MedicineName;
    const dosage = m.dosage || m.Dosage || '500mg';
    const qty = Number(m.quantity ?? m.Quantity ?? 0);
    const opt = document.createElement('option');
    opt.value = medName;
    opt.dataset.dosage = dosage;
    opt.dataset.stock = qty;
    opt.label = `${medName} (${dosage}) — ${qty > 0 ? qty + ' in stock' : 'OUT OF STOCK'}`;
    dl.appendChild(opt);
  });

  const medInput = document.getElementById('rxMedName');
  if (!medInput) return;

  // Remove previous listeners by replacing with cloned node if needed, or simply assign oninput
  medInput.oninput = function(e) {
    const val = e.target.value.trim().toLowerCase();
    const found = meds.find(m => (m.name || m.MedicineName || '').toLowerCase() === val);
    const stockHelp = document.getElementById('rxStockIndicator');
    if (found) {
      if (found.dosage || found.Dosage) {
        document.getElementById('rxDosage').value = found.dosage || found.Dosage;
      }
      const qty = Number(found.quantity ?? found.Quantity ?? 0);
      if (stockHelp) {
        if (qty > 0) {
          stockHelp.innerHTML = `<span style="color:var(--success);font-weight:600;">✓ In Stock: ${qty} units available in Pharmacy</span>`;
        } else {
          stockHelp.innerHTML = `<span style="color:var(--danger);font-weight:700;">⚠ Out of Stock in Pharmacy (0 units available)</span>`;
        }
      }
    } else if (stockHelp) {
      stockHelp.innerHTML = val ? `<span style="color:var(--text-muted);font-size:0.75rem;">Select from Admin pharmacy catalog</span>` : '';
    }
  };
}

function setFilter(f) {
  currentFilter = f;
  document.getElementById('btnFilterAll').className = `btn btn-sm ${f === 'all' ? 'btn-primary' : 'btn-outline'}`;
  document.getElementById('btnFilterWait').className = `btn btn-sm ${f === 'Scheduled' ? 'btn-primary' : 'btn-outline'}`;
  document.getElementById('btnFilterDone').className = `btn btn-sm ${f === 'Completed' ? 'btn-primary' : 'btn-outline'}`;
  renderQueueAndStats();
}

/* ──────────────────────────────────────────────────────────
   SIDEBAR NAVIGATION
────────────────────────────────────────────────────────── */
var SECTION_MAP = {
  dashboard:   'sectionDashboard',
  history:     'sectionHistory',
  labrequests: 'sectionLabRequests',
  labresults:  'sectionLabResults'
};

function activateSection(sectionId) {
  // 1. Update nav button highlights
  document.querySelectorAll('.nav-item[data-section]').forEach(function(btn) {
    if (btn.dataset.section === sectionId) {
      btn.classList.add('active');
    } else {
      btn.classList.remove('active');
    }
  });

  // 2. Show the target section, hide all others
  var targetId = SECTION_MAP[sectionId];
  document.querySelectorAll('.section').forEach(function(sec) {
    if (sec.id === targetId) {
      sec.classList.add('active');
    } else {
      sec.classList.remove('active');
    }
  });

  // 3. Lazy-render content
  if (sectionId === 'dashboard') {
    renderQueueAndStats();
    renderPatientLabStatus();
  }
  if (sectionId === 'history')     renderHistory();
  if (sectionId === 'labrequests') renderLabRequests();
  if (sectionId === 'labresults')  renderLabResults();
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

  // Always sort by token number
  list.sort((a, b) => (a.tokenNumber || 0) - (b.tokenNumber || 0));

  const container = document.getElementById('queueList');
  container.innerHTML = '';

  if (list.length === 0) {
    container.innerHTML = `<div style="text-align:center; padding: 2rem; color: var(--text-muted);">No appointments found.</div>`;
    return;
  }

  // Find the lowest pending token (next to be served)
  const allAppts = getStorage(CMS_KEYS.APPOINTMENTS, []);
  const nextScheduled = allAppts
    .filter(a => a.status === 'Scheduled')
    .sort((a, b) => (a.tokenNumber || 0) - (b.tokenNumber || 0));
  const nextToken = nextScheduled.length > 0 ? nextScheduled[0].tokenNumber : null;

  list.forEach(a => {
    const isSelected = activeAppt && activeAppt.appointmentId === a.appointmentId;
    const card = document.createElement('div');
    card.className = `queue-card ${isSelected ? 'active' : ''}`;

    let badgeClass = 'badge-scheduled';
    if (a.status === 'Completed') badgeClass = 'badge-completed';
    else if (a.status === 'In-Progress') badgeClass = 'badge-in-progress';

    // Show a subtle "Next" indicator on the next-in-queue card
    const isNext = a.status === 'Scheduled' && a.tokenNumber === nextToken;
    const nextIndicator = isNext
      ? `<span style="font-size:0.65rem;font-weight:700;color:var(--success);text-transform:uppercase;letter-spacing:.05em;">Next</span>`
      : '';

    card.innerHTML = `
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.25rem;">
        <div style="display:flex;align-items:center;gap:0.4rem;">
          <span class="token-badge">Token #${a.tokenNumber || '—'}</span>
          ${nextIndicator}
        </div>
        <span class="badge ${badgeClass}">${a.status}</span>
      </div>
      <div style="font-weight: 700; color: var(--text-main); font-size: 0.95rem;">${a.patientName}</div>
      <div style="font-size: 0.8rem; color: var(--text-muted); margin-top: 0.15rem;">
        ${a.time || '10:00 AM'} &nbsp;·&nbsp; ${a.reason || 'General Checkup'}
      </div>
    `;
    card.onclick = () => selectPatient(a);
    container.appendChild(card);
  });
}

function selectPatient(appt) {
  // ── Sequential token enforcement ──
  // Completed patients can always be viewed. Only block Scheduled ones that are out of order.
  if (appt.status !== 'Completed') {
    const allAppts = getStorage(CMS_KEYS.APPOINTMENTS, []);
    const scheduled = allAppts
      .filter(a => a.status === 'Scheduled')
      .sort((a, b) => (a.tokenNumber || 0) - (b.tokenNumber || 0));

    if (scheduled.length > 0) {
      const nextToken = scheduled[0].tokenNumber;
      if ((appt.tokenNumber || 0) > nextToken) {
        const nextPatient = scheduled[0].patientName;
        showToast(
          `Token #${nextToken} (${nextPatient}) must be consulted first. Please follow the queue order.`,
          'warning'
        );
        return; // Block the selection
      }
    }
  }

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

  // Store patient details on activeAppt for the prescription modal
  activeAppt._patientDetails = p;

  document.getElementById('panelPatName').textContent = p.name;
  // Comma-separated, no pipes
  document.getElementById('panelPatMeta').textContent =
    `Age: ${p.age || '—'}, Gender: ${p.gender || '—'}, Blood Group: ${p.bloodGroup || '—'}`;
  document.getElementById('panelPatPhone').textContent = p.phone || '—';
  document.getElementById('panelToken').textContent = `Token #${appt.tokenNumber || '—'}`;
  document.getElementById('panelTime').textContent = appt.time || '—';
  document.getElementById('panelComplaint').textContent = appt.reason || 'General Consultation';

  if (appt.status === 'Completed') {
    document.getElementById('btnPrintRx').style.display = 'inline-flex';
    const cons = getStorage(CMS_KEYS.CONSULTATIONS, []);
    let existing = cons.find(c => c.appointmentId === appt.appointmentId);
    if (!existing) {
      existing = {
        consultationId: `CNS-${appt.appointmentId || Date.now()}`,
        appointmentId: appt.appointmentId,
        patientId: appt.patientId,
        patientName: appt.patientName,
        doctorName: appt.doctorName || (currentUser && currentUser.name) || 'Doctor',
        date: new Date().toISOString().split('T')[0],
        vitals: { bp: '118/76', pulse: '78', temp: '98.4', weight: '62' },
        symptoms: appt.reason || 'Acidity and stomach discomfort',
        diagnosis: 'Gastroesophageal Reflux Disease (GERD)',
        remarks: 'Avoid spicy food. Take medications on schedule. Follow up in 2 weeks.',
        status: 'Completed'
      };
      cons.push(existing);
      setStorage(CMS_KEYS.CONSULTATIONS, cons);
    }

    if (existing) {
      if (existing.vitals) {
        document.getElementById('vitalBP').value = existing.vitals.bp || '120/80';
        document.getElementById('vitalPulse').value = existing.vitals.pulse || '72';
        document.getElementById('vitalTemp').value = existing.vitals.temp || '98.6';
        document.getElementById('vitalWeight').value = existing.vitals.weight || '68';
      }
      document.getElementById('diagSymptoms').value = existing.symptoms || appt.reason || '';
      document.getElementById('diagPrimary').value = existing.diagnosis || '';
      document.getElementById('diagRemarks').value = existing.remarks || '';
    }

    const rxList = getStorage(CMS_KEYS.PRESCRIPTIONS, []);
    let existingRx = rxList.find(r => r.appointmentId === appt.appointmentId);

    if (existingRx && existingRx.items) {
      currentRxItems = [...existingRx.items];
      renderRxTable();
    }
  } else {
    document.getElementById('btnPrintRx').style.display = 'none';

    // Check for draft saved during active consultation or prior to lab request
    const draft = getConsultationDraft(appt.appointmentId);
    if (draft) {
      if (draft.vitals) {
        document.getElementById('vitalBP').value = draft.vitals.bp || '120/80';
        document.getElementById('vitalPulse').value = draft.vitals.pulse || '72';
        document.getElementById('vitalTemp').value = draft.vitals.temp || '98.6';
        document.getElementById('vitalWeight').value = draft.vitals.weight || '68';
      }
      document.getElementById('diagSymptoms').value = draft.symptoms || appt.reason || '';
      document.getElementById('diagPrimary').value = draft.diagnosis || '';
      document.getElementById('diagRemarks').value = draft.remarks || '';
      document.getElementById('labRemarks').value = draft.labRemarks || '';
      document.querySelectorAll('input[name="labCheck"]').forEach(cb => {
        cb.checked = Array.isArray(draft.labTests) && draft.labTests.includes(cb.value);
      });
      if (Array.isArray(draft.rxItems) && draft.rxItems.length > 0) {
        currentRxItems = [...draft.rxItems];
        renderRxTable();
      } else {
        currentRxItems = [];
        renderRxTable();
      }
    } else {
      document.getElementById('vitalBP').value = '120/80';
      document.getElementById('vitalPulse').value = '72';
      document.getElementById('vitalTemp').value = '98.6';
      document.getElementById('vitalWeight').value = '68';
      document.getElementById('diagSymptoms').value = appt.reason || '';
      document.getElementById('diagPrimary').value = '';
      document.getElementById('diagRemarks').value = '';
      document.getElementById('labRemarks').value = '';
      document.querySelectorAll('input[name="labCheck"]').forEach(cb => cb.checked = false);
      currentRxItems = [];
      renderRxTable();
    }
  }

  const completedNotice = document.getElementById('completedNotice');
  if (completedNotice) {
    completedNotice.style.display = appt.status === 'Completed' ? 'flex' : 'none';
  }

  document.getElementById('noSelection').style.display = 'none';
  document.getElementById('consultationPanel').style.display = 'block';
  renderQueueAndStats();
  renderPatientLabStatus(appt);
}

function addRxItem() {
  const name = document.getElementById('rxMedName').value.trim();
  const dosage = document.getElementById('rxDosage').value.trim();
  const freq = document.getElementById('rxFrequency').value.trim();
  const dur = document.getElementById('rxDuration').value.trim();
  const inst = document.getElementById('rxInstructions').value.trim();

  if (!name) {
    showToast('Medicine Name is mandatory! Please select or enter a medicine.', 'warning');
    document.getElementById('rxMedName').focus();
    return;
  }
  if (!dosage) {
    showToast('Dosage (e.g. 500mg, 250mg) is mandatory!', 'warning');
    document.getElementById('rxDosage').focus();
    return;
  }
  if (!freq) {
    showToast('Frequency (e.g. 1-0-1) is mandatory!', 'warning');
    document.getElementById('rxFrequency').focus();
    return;
  }
  if (!dur) {
    showToast('Duration (e.g. 5 Days, 10 Days) is mandatory!', 'warning');
    document.getElementById('rxDuration').focus();
    return;
  }
  if (!inst) {
    showToast('Instructions (e.g. After Food) are mandatory!', 'warning');
    document.getElementById('rxInstructions').focus();
    return;
  }

  // Check stock availability in Admin medicine inventory
  const stockCheck = typeof checkMedicineStock === 'function'
    ? checkMedicineStock(name)
    : { exists: true, inStock: true, quantity: 50 };

  if (stockCheck.exists && !stockCheck.inStock) {
    showToast(`Note: "${name}" is currently Out of Stock in Pharmacy (Available: 0). Recommending anyway will alert Pharmacist to restock.`, 'warning');
  }

  currentRxItems.push({
    medicineName: name,
    dosage: dosage,
    frequency: freq,
    duration: dur,
    instructions: inst,
    inStock: stockCheck.inStock,
    availableStock: stockCheck.quantity
  });

  document.getElementById('rxMedName').value = '';
  document.getElementById('rxDosage').value = '';
  document.getElementById('rxDuration').value = '';
  const stockHelp = document.getElementById('rxStockIndicator');
  if (stockHelp) stockHelp.innerHTML = '';
  document.getElementById('rxMedName').focus();

  renderRxTable();
  saveConsultationDraft();
  showToast(`${name} added to prescription.`, 'success');
}

function removeRx(idx) {
  currentRxItems.splice(idx, 1);
  renderRxTable();
  saveConsultationDraft();
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
    const stockInfo = typeof checkMedicineStock === 'function' ? checkMedicineStock(it.medicineName) : { inStock: true, quantity: 50 };
    const stockBadge = stockInfo.inStock
      ? `<span class="badge badge-completed" style="font-size:0.68rem;padding:0.1rem 0.4rem;">In Stock: ${stockInfo.quantity}</span>`
      : `<span class="badge" style="background:#fee2e2;color:#b91c1c;border:1px solid #fca5a5;font-size:0.68rem;padding:0.1rem 0.4rem;font-weight:700;">Out of Stock</span>`;

    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td><strong>${it.medicineName}</strong> &nbsp;${stockBadge}</td>
      <td>${it.dosage}</td>
      <td><span class="badge badge-scheduled">${it.frequency}</span></td>
      <td>${it.duration}</td>
      <td>${it.instructions}</td>
      <td>
        <button type="button" class="btn btn-outline btn-sm" style="color:var(--danger);border-color:#fca5a5;" onclick="removeRx(${i})">
          <svg style="width:14px;height:14px;stroke:currentColor;fill:none;stroke-width:1.75;stroke-linecap:round;stroke-linejoin:round;" viewBox="0 0 24 24"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4h6v2"/></svg>
        </button>
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
  const labBanner = document.getElementById('patientLabStatusBanner');
  if (labBanner) {
    labBanner.style.display = 'none';
    labBanner.innerHTML = '';
  }
  renderQueueAndStats();
}

function resetAllConsultationsToScheduled() {
  if (typeof setAllAppointmentsScheduled === 'function') {
    setAllAppointmentsScheduled();
  }
  cancelConsultation();
  renderQueueAndStats();
  renderHistory();
  renderLabRequests();
  renderLabResults();
  showToast('All patient consultations have been reset to Scheduled! Consultation and lab history cleared.', 'success');
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
    doctorName: currentUser.name || 'Doctor',
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

  // 2. Save Prescription
  if (currentRxItems.length > 0) {
    const rxList = getStorage(CMS_KEYS.PRESCRIPTIONS, []);
    const newRx = {
      prescriptionId: `RX-${uid}`,
      consultationId: consultationId,
      appointmentId: activeAppt.appointmentId,
      patientId: activeAppt.patientId,
      patientName: activeAppt.patientName,
      doctorName: currentUser.name || 'Doctor',
      date: todayStr,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      createdAt: Date.now(),
      symptoms: symp,
      diagnosis: diag,
      items: currentRxItems,
      status: 'Pending'
    };

    const rIdx = rxList.findIndex(r => r.appointmentId === activeAppt.appointmentId);
    if (rIdx >= 0) rxList[rIdx] = newRx;
    else rxList.push(newRx);
    setStorage(CMS_KEYS.PRESCRIPTIONS, rxList);
    try { window.dispatchEvent(new Event('cms_rx_updated')); } catch(e) {}
  }

  // 3. Save Lab Orders
  const labTests = [];
  document.querySelectorAll('input[name="labCheck"]:checked').forEach(cb => labTests.push(cb.value));

  if (labTests.length > 0) {
    labList.push({
      labOrderId: `LAB-${uid}`,
      consultationId: consultationId,
      appointmentId: activeAppt.appointmentId,
      patientId: activeAppt.patientId,
      patientName: activeAppt.patientName,
      doctorName: currentUser.name || 'Doctor',
      date: todayStr,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      createdAt: Date.now(),
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
    activeAppt.status = 'Completed'; // keep local state in sync
  }

  clearConsultationDraft(activeAppt.appointmentId);

  showToast(`Consultation completed for ${activeAppt.patientName}.`, 'success');
  document.getElementById('btnPrintRx').style.display = 'inline-flex';

  renderQueueAndStats();
}

function openPrintModal(specificApptId) {
  const consList = getStorage(CMS_KEYS.CONSULTATIONS, []);
  const appts = getStorage(CMS_KEYS.APPOINTMENTS, []);
  const patients = getStorage(CMS_KEYS.PATIENTS, []);
  const rxList = getStorage(CMS_KEYS.PRESCRIPTIONS, []);
  const labList = getStorage(CMS_KEYS.LAB_ORDERS, []);

  const targetApptId = specificApptId || (activeAppt && activeAppt.appointmentId);
  if (!targetApptId) return;

  const appt = appts.find(a => a.appointmentId === targetApptId) || (activeAppt && activeAppt.appointmentId === targetApptId ? activeAppt : null);
  const cons = consList.find(c => c.appointmentId === targetApptId);
  const rx = rxList.find(r => r.appointmentId === targetApptId);
  const lab = labList.find(l => l.appointmentId === targetApptId);

  const patientId = (appt && appt.patientId) || (cons && cons.patientId);
  const patientName = (appt && appt.patientName) || (cons && cons.patientName) || 'Patient';
  const p = patients.find(pat => pat.patientId === patientId) || (activeAppt && activeAppt._patientDetails) || {};

  document.getElementById('modalDoc').textContent = (cons && cons.doctorName) || (currentUser && currentUser.name) || 'Doctor';
  document.getElementById('modalPat').textContent = patientName;
  document.getElementById('modalAge').textContent = p.age || '—';
  document.getElementById('modalGender').textContent = p.gender || '—';
  document.getElementById('modalBloodGroup').textContent = p.bloodGroup || '—';
  document.getElementById('modalDate').textContent = cons ? cons.date : (appt && appt.date ? appt.date : new Date().toISOString().split('T')[0]);
  document.getElementById('modalDiag').textContent = (cons && cons.diagnosis) ? cons.diagnosis : ((document.getElementById('diagPrimary') && document.getElementById('diagPrimary').value) || 'General Checkup');
  document.getElementById('modalAdvice').textContent = (cons && cons.remarks) ? cons.remarks : ((document.getElementById('diagRemarks') && document.getElementById('diagRemarks').value) || 'Rest and review as advised.');

  const rxTable = document.getElementById('modalRxList');
  rxTable.innerHTML = '';
  const items = (rx && rx.items) ? rx.items : (activeAppt && activeAppt.appointmentId === targetApptId ? currentRxItems : []);
  if (items.length === 0) {
    rxTable.innerHTML = `<tr><td colspan="6" style="padding: 0.5rem 0; color: #64748b;">No medications prescribed.</td></tr>`;
  } else {
    items.forEach((it, i) => {
      rxTable.innerHTML += `
        <tr style="border-bottom: 1px dashed #e2e8f0;">
          <td style="padding: 0.4rem 0.3rem;">${i + 1}</td>
          <td style="padding: 0.4rem 0.3rem;"><strong>${it.medicineName}</strong></td>
          <td style="padding: 0.4rem 0.3rem;">${it.dosage}</td>
          <td style="padding: 0.4rem 0.3rem;">${it.frequency}</td>
          <td style="padding: 0.4rem 0.3rem;">${it.duration}</td>
          <td style="padding: 0.4rem 0.3rem;">${it.instructions}</td>
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

/* ──────────────────────────────────────────────────────────
   CONSULTATION HISTORY SECTION
────────────────────────────────────────────────────────── */
function renderHistory() {
  const q = (document.getElementById('historySearch')?.value || '').toLowerCase().trim();
  const consList = getStorage(CMS_KEYS.CONSULTATIONS, []);
  const appts    = getStorage(CMS_KEYS.APPOINTMENTS, []);
  const patients = getStorage(CMS_KEYS.PATIENTS, []);
  const rxList   = getStorage(CMS_KEYS.PRESCRIPTIONS, []);
  const labList  = getStorage(CMS_KEYS.LAB_ORDERS, []);

  // Merge any appointment marked 'Completed' that doesn't have an explicit consultation record yet
  const completedAppts = appts.filter(a => a.status === 'Completed');
  completedAppts.forEach(a => {
    if (!consList.some(c => c.appointmentId === a.appointmentId)) {
      consList.push({
        consultationId: `CNS-${a.appointmentId}`,
        appointmentId: a.appointmentId,
        patientId: a.patientId,
        patientName: a.patientName,
        doctorName: a.doctorName || 'Dr. Prateek Pradeep',
        date: new Date().toISOString().split('T')[0],
        vitals: { bp: '118/76', pulse: '78', temp: '98.4', weight: '62' },
        symptoms: a.reason || 'General health consultation',
        diagnosis: a.reason || 'Routine Checkup Completed',
        remarks: 'Consultation completed. Advised lifestyle management and routine review.',
        status: 'Completed'
      });
    }
  });

  let list = [...consList].sort((a, b) => (b.date || '').localeCompare(a.date || ''));

  if (q) {
    list = list.filter(c =>
      (c.patientName || '').toLowerCase().includes(q) ||
      (c.diagnosis || '').toLowerCase().includes(q) ||
      (c.symptoms || '').toLowerCase().includes(q)
    );
  }

  const container = document.getElementById('historyList');
  if (!container) return;

  if (list.length === 0) {
    container.innerHTML = `
      <div class="empty-panel">
        <div class="empty-panel-icon">
          <svg class="icon" style="width:1.75rem;height:1.75rem;" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
        </div>
        <h3>No Consultations Found</h3>
        <p>${q ? 'No records match your search.' : 'Completed patient consultations will appear here.'}</p>
      </div>`;
    return;
  }

  container.innerHTML = '';
  list.forEach(c => {
    const appt = appts.find(a => a.appointmentId === c.appointmentId) || {};
    const p    = patients.find(pt => pt.patientId === c.patientId) || {};
    const rx   = rxList.find(r => r.appointmentId === c.appointmentId || r.consultationId === c.consultationId || (r.patientId === c.patientId && (r.date === c.date || r.date === appt.date)));
    const lab  = labList.find(l => l.appointmentId === c.appointmentId);

    const card = document.createElement('div');
    card.className = 'history-card';

    const v = c.vitals || {};
    const meds = rx && rx.items ? rx.items : (c.items || c.medicines || []);

    card.innerHTML = `
      <div class="history-card-header" onclick="toggleHistoryCard(this)">
        <div style="display:flex;align-items:center;gap:0.85rem;flex-wrap:wrap;">
          <div style="width:40px;height:40px;border-radius:50%;background:var(--primary-light);color:var(--primary);display:flex;align-items:center;justify-content:center;font-weight:800;font-size:0.95rem;flex-shrink:0;">
            ${(c.patientName || '?').charAt(0)}
          </div>
          <div>
            <div style="display:flex;align-items:center;gap:0.5rem;">
              <span style="font-weight:700;color:var(--text-main);font-size:1rem;">${c.patientName || 'Patient'}</span>
              <span class="badge badge-completed">Completed</span>
            </div>
            <div style="font-size:0.8rem;color:var(--text-muted);margin-top:0.15rem;">
              Gender: ${p.gender || '—'}, Age: ${p.age || '—'}, Blood Group: ${p.bloodGroup || '—'}
            </div>
          </div>
        </div>
        <div style="display:flex;align-items:center;gap:1.25rem;flex-wrap:wrap;">
          <div style="text-align:right;">
            <div style="font-size:0.85rem;font-weight:700;color:var(--primary);">${c.diagnosis || 'General Checkup'}</div>
            <div style="font-size:0.75rem;color:var(--text-muted);margin-top:0.1rem;">
              ${c.date || 'Today'} &nbsp;·&nbsp; Token #${appt.tokenNumber || '—'}
            </div>
          </div>
          <button type="button" class="btn btn-outline btn-sm" onclick="event.stopPropagation(); openPrintModal('${c.appointmentId}')" title="View Prescription">
            <svg class="icon" viewBox="0 0 24 24"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
            Rx
          </button>
          <svg class="icon" style="color:var(--text-hint);transition:transform 0.2s;" viewBox="0 0 24 24"><polyline points="6 9 12 15 18 9"/></svg>
        </div>
      </div>

      <div class="history-card-body">
        <div class="vitals-row">
          ${v.bp     ? `<div class="vital-chip"><small>Blood Pressure</small><span>${v.bp} mmHg</span></div>` : ''}
          ${v.pulse  ? `<div class="vital-chip"><small>Pulse Rate</small><span>${v.pulse} bpm</span></div>` : ''}
          ${v.temp   ? `<div class="vital-chip"><small>Body Temp</small><span>${v.temp} °F</span></div>` : ''}
          ${v.weight ? `<div class="vital-chip"><small>Weight</small><span>${v.weight} kg</span></div>` : ''}
        </div>

        <div style="display:grid;grid-template-columns:1fr 1fr;gap:1.25rem;margin-bottom:1.25rem;">
          <div>
            <div class="detail-label">Chief Complaint &amp; Symptoms</div>
            <div class="detail-value">${c.symptoms || '—'}</div>
          </div>
          <div>
            <div class="detail-label">Primary Diagnosis</div>
            <div class="detail-value" style="font-weight:700;color:var(--primary);">${c.diagnosis || '—'}</div>
          </div>
          ${c.remarks ? `
          <div style="grid-column:1/-1;">
            <div class="detail-label">Doctor's Clinical Advice &amp; Remarks</div>
            <div class="detail-value">${c.remarks}</div>
          </div>` : ''}
        </div>

        <div style="margin-bottom:1.25rem;">
          <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:0.5rem;flex-wrap:wrap;gap:0.4rem;">
            <div class="detail-label" style="margin-bottom:0;">Medications Prescribed ${meds.length > 0 ? `(${meds.length})` : ''}</div>
            ${rx ? `
              <span class="badge ${rx.status === 'Dispensed' ? 'badge-completed' : 'badge-scheduled'}" style="font-size:0.75rem;">
                ${rx.status === 'Dispensed' ? '✓ Dispensed by Pharmacist' : '⏳ Pending with Pharmacist'}
              </span>
            ` : ''}
          </div>
          ${meds.length > 0 ? `
            <div class="table-responsive">
              <table style="width:100%;border-collapse:collapse;font-size:0.83rem;background:white;border-radius:var(--radius-sm);overflow:hidden;border:1px solid var(--border);">
                <thead>
                  <tr style="background:var(--bg-main);text-align:left;border-bottom:1px solid var(--border);">
                    <th style="padding:0.45rem 0.6rem;font-weight:700;color:var(--text-muted);font-size:0.7rem;text-transform:uppercase;">Medicine</th>
                    <th style="padding:0.45rem 0.6rem;font-weight:700;color:var(--text-muted);font-size:0.7rem;text-transform:uppercase;">Dosage</th>
                    <th style="padding:0.45rem 0.6rem;font-weight:700;color:var(--text-muted);font-size:0.7rem;text-transform:uppercase;">Frequency</th>
                    <th style="padding:0.45rem 0.6rem;font-weight:700;color:var(--text-muted);font-size:0.7rem;text-transform:uppercase;">Duration</th>
                    <th style="padding:0.45rem 0.6rem;font-weight:700;color:var(--text-muted);font-size:0.7rem;text-transform:uppercase;">Instructions</th>
                  </tr>
                </thead>
                <tbody>
                  ${meds.map(m => `
                    <tr style="border-top:1px solid #f1f5f9;">
                      <td style="padding:0.45rem 0.6rem;font-weight:700;color:var(--text-main);">${m.medicineName}</td>
                      <td style="padding:0.45rem 0.6rem;">${m.dosage}</td>
                      <td style="padding:0.45rem 0.6rem;"><span class="badge badge-scheduled">${m.frequency}</span></td>
                      <td style="padding:0.45rem 0.6rem;">${m.duration}</td>
                      <td style="padding:0.45rem 0.6rem;color:var(--text-muted);">${m.instructions}</td>
                    </tr>
                  `).join('')}
                </tbody>
              </table>
            </div>` : `
            <div style="font-size:0.82rem;color:var(--text-muted);font-style:italic;background:var(--bg-main);padding:0.45rem 0.75rem;border-radius:4px;">No medications prescribed for this consultation.</div>`}
        </div>

        ${lab && lab.tests && lab.tests.length > 0 ? `
          <div>
            <div class="detail-label" style="margin-bottom:0.35rem;">Diagnostic Lab Tests Ordered</div>
            <div>
              ${lab.tests.map(t => `<span class="test-tag">${t}</span>`).join('')}
            </div>
          </div>` : ''}

        <div style="margin-top:1rem;display:flex;justify-content:flex-end;">
          <button type="button" class="btn btn-outline btn-sm" onclick="openPrintModal('${c.appointmentId}')">
            <svg class="icon" viewBox="0 0 24 24"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
            View Full Prescription
          </button>
        </div>
      </div>
    `;

    container.appendChild(card);
  });
}

function toggleHistoryCard(header) {
  const body = header.nextElementSibling;
  const chevron = header.querySelector('svg:last-child');
  const isOpen = body.classList.toggle('open');
  if (chevron) {
    chevron.style.transform = isOpen ? 'rotate(180deg)' : 'rotate(0deg)';
  }
}

/* ──────────────────────────────────────────────────────────
   LAB REQUESTS SECTION
────────────────────────────────────────────────────────── */
function getLabSortTimestamp(report, order) {
  // 1. Explicit millisecond timestamp if present
  const explicitTs = Number(report?.completedAt || order?.completedAt || order?.createdAt || report?.createdAt);
  if (!isNaN(explicitTs) && explicitTs > 1000000000000) {
    return explicitTs;
  }

  // 2. Numeric reportId if generated via Date.now()
  const rIdNum = Number(report?.reportId);
  if (!isNaN(rIdNum) && rIdNum > 1000000000000) {
    return rIdNum;
  }

  // 3. Try parsing date and time
  const dateStr = (report && report.date) || (order && (order.reportDate || order.date)) || '';
  const timeStr = (report && report.time) || (order && order.time) || '';
  
  if (dateStr) {
    let combinedStr = timeStr ? `${dateStr} ${timeStr}` : dateStr;
    let parsed = Date.parse(combinedStr);
    
    // If not standard ISO, check DD/MM/YYYY or DD-MM-YYYY
    if (isNaN(parsed)) {
      const parts = dateStr.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})/);
      if (parts) {
        parsed = Date.parse(`${parts[3]}-${parts[2].padStart(2, '0')}-${parts[1].padStart(2, '0')}${timeStr ? ' ' + timeStr : ''}`);
        if (isNaN(parsed)) {
          parsed = Date.parse(`${parts[3]}-${parts[1].padStart(2, '0')}-${parts[2].padStart(2, '0')}${timeStr ? ' ' + timeStr : ''}`);
        }
      }
    }
    if (!isNaN(parsed)) {
      return parsed;
    }
  }

  // 4. Fallback to order ID / report ID numeric sequence
  const idStr = String((order && order.labOrderId) || (report && (report.labOrderId || report.reportId)) || '');
  const digits = idStr.replace(/\D/g, '');
  if (digits) {
    return parseInt(digits, 10);
  }

  return 0;
}

function compareLabItemsLatestFirst(aReport, aOrder, bReport, bOrder) {
  const tsA = getLabSortTimestamp(aReport, aOrder);
  const tsB = getLabSortTimestamp(bReport, bOrder);

  if (tsB !== tsA) {
    return tsB - tsA;
  }

  // Tie-breaker: numeric digits from ID
  const idA = parseInt(String((aOrder?.labOrderId) || (aReport?.labOrderId) || (aReport?.reportId) || '').replace(/\D/g, '') || '0', 10);
  const idB = parseInt(String((bOrder?.labOrderId) || (bReport?.labOrderId) || (bReport?.reportId) || '').replace(/\D/g, '') || '0', 10);
  return idB - idA;
}

function renderLabRequests() {
  const q = (document.getElementById('labReqSearch')?.value || '').toLowerCase().trim();
  const labOrders = getStorage(CMS_KEYS.LAB_ORDERS, []);
  const labReports = getStorage(CMS_KEYS.LAB_REPORTS, []);

  // Sort latest lab requests at the top
  let list = [...labOrders].sort((a, b) => compareLabItemsLatestFirst(null, a, null, b));
  if (q) {
    list = list.filter(o =>
      (o.patientName || '').toLowerCase().includes(q) ||
      (o.tests || []).join(' ').toLowerCase().includes(q) ||
      (o.labOrderId || '').toLowerCase().includes(q)
    );
  }

  const container = document.getElementById('labRequestsList');
  if (!container) return;

  if (list.length === 0) {
    container.innerHTML = `
      <div class="empty-panel">
        <div class="empty-panel-icon">
          <svg class="icon" style="width:1.75rem;height:1.75rem;" viewBox="0 0 24 24"><path d="M9 3H5a2 2 0 0 0-2 2v4m6-6h10a2 2 0 0 1 2 2v4M9 3v11m0 0H5m4 0h4m6-5v5m0 0h-4m4 0h2"/></svg>
        </div>
        <h3>No Lab Requests Found</h3>
        <p>${q ? 'No orders match your search.' : 'Lab test orders will appear here once you order from a consultation.'}</p>
      </div>`;
    return;
  }

  container.innerHTML = '';
  list.forEach(order => {
    const report = labReports.find(r =>
      String(r.labOrderId) === String(order.labOrderId) ||
      (r.patientId && String(r.patientId) === String(order.patientId) && (r.testName || '').toLowerCase() === ((order.tests && order.tests[0]) || '').toLowerCase())
    );
    const statusBadge = report || order.status === 'Completed' || order.actualReading
      ? `<span class="badge badge-completed">Results Ready</span>`
      : `<span class="badge badge-scheduled">${order.status || 'Pending'}</span>`;

    const row = document.createElement('div');
    row.className = 'lab-order-row';
    row.innerHTML = `
      <div style="flex:1;min-width:0;">
        <div style="display:flex;align-items:center;gap:0.6rem;margin-bottom:0.35rem;flex-wrap:wrap;">
          <span style="font-size:0.75rem;font-weight:700;color:var(--text-muted);font-family:monospace;">${order.labOrderId}</span>
          ${statusBadge}
        </div>
        <div style="font-weight:700;color:var(--text-main);font-size:0.95rem;margin-bottom:0.2rem;">${order.patientName || 'Patient'}</div>
        <div style="margin:0.35rem 0;">
          ${(order.tests || []).map(t => `<span class="test-tag">${t}</span>`).join('')}
        </div>
        ${order.remarks ? `<div style="font-size:0.78rem;color:var(--text-muted);margin-top:0.25rem;">Note: ${order.remarks}</div>` : ''}
        ${report || order.status === 'Completed' || order.actualReading ? `
          <div style="margin-top:0.5rem;">
            <button type="button" class="btn btn-outline btn-sm" onclick="openLabReportModal('${report ? report.reportId : ''}', '${order.labOrderId}')">
              <svg class="icon" viewBox="0 0 24 24"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
              View Report
            </button>
          </div>` : ''}
      </div>
      <div style="text-align:right;flex-shrink:0;">
        <div style="font-size:0.78rem;color:var(--text-muted);">Ordered On</div>
        <div style="font-weight:600;font-size:0.85rem;color:var(--text-main);">${order.date || '—'}</div>
        <div style="font-size:0.75rem;color:var(--text-muted);margin-top:0.15rem;">Dr. ${order.doctorName || 'Doctor'}</div>
      </div>
    `;
    container.appendChild(row);
  });
}

/* ──────────────────────────────────────────────────────────
   CLINICAL LAB EVALUATOR (Normal vs Abnormal Color Flagging)
────────────────────────────────────────────────────────── */
function evaluateLabReading(testName, readingStr, normalRef) {
  const name = String(testName || '').toLowerCase();
  const valStr = String(readingStr || '').trim();
  const refStr = String(normalRef || '').toLowerCase();

  if (!valStr || valStr === '—') return { isAbnormal: false, tag: 'RECORDED' };

  // Explicit clinical text indicators
  if (valStr.includes('(High)') || valStr.includes('Elevated') || valStr.includes('Positive') || valStr.includes('Critical') || valStr.includes('2+') || valStr.includes('3+') || valStr.includes('Turbid')) {
    return { isAbnormal: true, tag: 'HIGH' };
  }
  if (valStr.includes('(Low)') || valStr.includes('Deficient')) {
    return { isAbnormal: true, tag: 'LOW' };
  }

  // Extract primary numeric value
  const numMatch = valStr.match(/-?\d+(\.\d+)?/);
  if (!numMatch) {
    if (valStr.toLowerCase() === 'normal' || valStr.toLowerCase() === 'nil' || valStr.toLowerCase() === 'negative' || valStr.toLowerCase().includes('pale yellow')) {
      return { isAbnormal: false, tag: 'NORMAL' };
    }
    return { isAbnormal: false, tag: 'RECORDED' };
  }
  const val = parseFloat(numMatch[0]);

  // Standard medical reference thresholds
  if (name.includes('total chol')) {
    if (val >= 200) return { isAbnormal: true, tag: 'HIGH' };
  } else if (name.includes('triglyceride')) {
    if (val >= 150) return { isAbnormal: true, tag: 'HIGH' };
  } else if (name.includes('hdl')) {
    if (val < 40) return { isAbnormal: true, tag: 'LOW' };
  } else if (name.includes('ldl')) {
    if (val >= 100) return { isAbnormal: true, tag: 'HIGH' };
  } else if (name.includes('fasting') || name.includes('fbs') || (name.includes('glucose') && !name.includes('pp'))) {
    if (val >= 100) return { isAbnormal: true, tag: 'HIGH' };
    if (val < 70) return { isAbnormal: true, tag: 'LOW' };
  } else if (name.includes('ppbs') || name.includes('post prandial')) {
    if (val >= 140) return { isAbnormal: true, tag: 'HIGH' };
  } else if (name.includes('hba1c')) {
    if (val >= 5.7) return { isAbnormal: true, tag: 'HIGH' };
  } else if (name.includes('hemoglobin') || name === 'hb') {
    if (val < 12.0) return { isAbnormal: true, tag: 'LOW' };
    if (val > 17.5) return { isAbnormal: true, tag: 'HIGH' };
  } else if (name.includes('wbc') || name.includes('white blood')) {
    if (val < 4.0) return { isAbnormal: true, tag: 'LOW' };
    if (val > 11.0) return { isAbnormal: true, tag: 'HIGH' };
  } else if (name.includes('platelet')) {
    if (val < 150) return { isAbnormal: true, tag: 'LOW' };
    if (val > 450) return { isAbnormal: true, tag: 'HIGH' };
  } else if (name.includes('creatinine')) {
    if (val > 1.2) return { isAbnormal: true, tag: 'HIGH' };
  } else if (name.includes('urea')) {
    if (val > 40) return { isAbnormal: true, tag: 'HIGH' };
  } else if (name.includes('tsh')) {
    if (val > 4.2) return { isAbnormal: true, tag: 'HIGH' };
    if (val < 0.4) return { isAbnormal: true, tag: 'LOW' };
  } else if (name.includes('sgot') || name.includes('ast')) {
    if (val > 40) return { isAbnormal: true, tag: 'HIGH' };
  } else if (name.includes('sgpt') || name.includes('alt')) {
    if (val > 56) return { isAbnormal: true, tag: 'HIGH' };
  } else if (name.includes('bilirubin')) {
    if (val > 1.2) return { isAbnormal: true, tag: 'HIGH' };
  }

  // Parse reference interval like "70-99" or "< 200" or "> 40"
  if (refStr.includes('<')) {
    const limit = parseFloat(refStr.replace(/[^0-9.]/g, ''));
    if (!isNaN(limit) && val >= limit) return { isAbnormal: true, tag: 'HIGH' };
  } else if (refStr.includes('>')) {
    const limit = parseFloat(refStr.replace(/[^0-9.]/g, ''));
    if (!isNaN(limit) && val < limit) return { isAbnormal: true, tag: 'LOW' };
  } else if (refStr.includes('-')) {
    const parts = refStr.split('-');
    const min = parseFloat(parts[0].replace(/[^0-9.]/g, ''));
    const max = parseFloat(parts[1].replace(/[^0-9.]/g, ''));
    if (!isNaN(min) && val < min) return { isAbnormal: true, tag: 'LOW' };
    if (!isNaN(max) && val > max) return { isAbnormal: true, tag: 'HIGH' };
  }

  return { isAbnormal: false, tag: 'NORMAL' };
}

/* ──────────────────────────────────────────────────────────
   LAB RESULTS SECTION
────────────────────────────────────────────────────────── */
function renderLabResults() {
  const q = (document.getElementById('labResSearch')?.value || '').toLowerCase().trim();
  const labOrders  = getStorage(CMS_KEYS.LAB_ORDERS, []);
  const labReports = getStorage(CMS_KEYS.LAB_REPORTS, []);

  // Show both explicit reports and any orders with actual readings
  const combined = [];
  labReports.forEach(r => {
    const order = labOrders.find(o => String(o.labOrderId) === String(r.labOrderId)) || {
      labOrderId: r.labOrderId,
      patientId: r.patientId,
      patientName: r.patientName,
      doctorName: r.doctorName,
      tests: [r.testName || 'Diagnostic Test'],
      status: 'Completed',
      date: r.date
    };
    combined.push({ report: r, order });
  });

  labOrders.forEach(o => {
    if ((o.actualReading || o.status === 'Completed') && !combined.some(c => String(c.order.labOrderId) === String(o.labOrderId))) {
      combined.push({
        report: {
          reportId: o.labOrderId || Date.now(),
          labOrderId: o.labOrderId,
          patientId: o.patientId,
          patientName: o.patientName,
          testName: (o.tests || ['Diagnostic Test']).join(', '),
          technicianName: o.technicianName || 'Malathi Sreekumar (Certified Lab Technologist)',
          date: o.reportDate || o.date || new Date().toISOString().split('T')[0],
          actualReading: o.actualReading,
          results: o.results || (o.tests || ['Diagnostic Test']).map(t => ({
            test: t,
            reading: o.actualReading,
            remarks: o.reportRemarks || ''
          })),
          remarks: o.reportRemarks || ''
        },
        order: o
      });
    }
  });

  // Also include any reports from the Lab Technician portal (carepoint_lab_data)
  try {
    const techData = JSON.parse(localStorage.getItem('carepoint_lab_data') || '{}');
    if (Array.isArray(techData.reports)) {
      techData.reports.forEach(tr => {
        const idToMatch = String(tr.labOrderId || tr.testId || tr.reportId);
        if (!combined.some(c => String(c.report.reportId) === String(tr.reportId) || String(c.order.labOrderId) === idToMatch)) {
          combined.push({
            report: {
              reportId: tr.reportId,
              labOrderId: idToMatch,
              patientId: tr.patientId,
              patientName: tr.patientName,
              doctorName: tr.doctorName || 'Dr. Prateek Pradeep',
              testName: tr.testName,
              sampleType: tr.sampleType,
              normalValue: tr.normalValue,
              actualReading: tr.actualReading,
              results: tr.results,
              remarks: tr.remarks,
              date: tr.date,
              time: tr.time,
              technicianName: tr.technicianName || 'Malathi Sreekumar (Lab Tech)'
            },
            order: {
              labOrderId: idToMatch,
              patientId: tr.patientId,
              patientName: tr.patientName,
              doctorName: tr.doctorName || 'Dr. Prateek Pradeep',
              tests: [tr.testName || 'Diagnostic Test'],
              status: 'Completed',
              date: tr.date
            }
          });
        }
      });
    }
  } catch(e) {}

  // Sort latest lab results at the top
  combined.sort((a, b) => compareLabItemsLatestFirst(a.report, a.order, b.report, b.order));

  let list = combined;

  if (q) {
    list = list.filter(({ report, order }) => {
      const pName = (order.patientName || report.patientName || '').toLowerCase();
      const oId = (order.labOrderId || report.labOrderId || '').toLowerCase();
      const tNames = (order.tests || [report.testName || '']).join(' ').toLowerCase();
      const reading = (report.actualReading || '').toLowerCase();
      const notes = (report.remarks || report.notes || '').toLowerCase();
      return pName.includes(q) || oId.includes(q) || tNames.includes(q) || reading.includes(q) || notes.includes(q);
    });
  }

  const container = document.getElementById('labResultsList');
  if (!container) return;

  if (list.length === 0) {
    container.innerHTML = `
      <div class="empty-panel">
        <div class="empty-panel-icon">
          <svg class="icon" style="width:1.75rem;height:1.75rem;" viewBox="0 0 24 24"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
        </div>
        <h3>${q ? 'No Results Match Your Search' : 'No Lab Results Yet'}</h3>
        <p>${q ? 'Try a different search term.' : 'Results will appear here once the lab technician records findings for your orders.'}</p>
      </div>`;
    return;
  }

  container.innerHTML = '';
  list.forEach(({ report, order }) => {
    const row = document.createElement('div');
    row.className = 'lab-order-row';
    row.style.alignItems = 'flex-start';

    const repId = report.reportId || '';
    const ordId = order.labOrderId || report.labOrderId || '';
    const patName = order.patientName || report.patientName || 'Patient';
    const testList = order.tests || [report.testName || 'Diagnostic Panel'];

    // Check if any component in this test is abnormal
    let hasAnyAbnormal = false;
    if (report.results && report.results.length > 0) {
      hasAnyAbnormal = report.results.some(r => evaluateLabReading(r.test, r.reading, r.normalValue).isAbnormal);
    } else if (report.actualReading) {
      hasAnyAbnormal = evaluateLabReading(report.testName, report.actualReading, report.normalValue).isAbnormal;
    }

    const overallBadge = hasAnyAbnormal
      ? `<span class="badge" style="background:#fee2e2;color:#b91c1c;border:1px solid #fca5a5;font-weight:700;">Abnormal Findings Flagged</span>`
      : `<span class="badge badge-completed">All Values Normal</span>`;

    row.innerHTML = `
      <div style="flex:1;min-width:0;">
        <div style="display:flex;align-items:center;gap:0.6rem;margin-bottom:0.4rem;flex-wrap:wrap;">
          <span style="font-size:0.75rem;font-weight:700;color:var(--text-muted);font-family:monospace;">${ordId || '—'}</span>
          ${overallBadge}
          <span style="font-size:0.7rem;color:var(--text-muted);background:var(--bg-main);padding:0.1rem 0.45rem;border-radius:4px;border:1px solid var(--border);">VIEW ONLY</span>
        </div>
        <div style="font-weight:700;color:var(--text-main);font-size:1.05rem;margin-bottom:0.25rem;">${patName}</div>

        <div style="margin-bottom:0.5rem;">
          ${testList.map(t => `<span class="test-tag">${t}</span>`).join('')}
        </div>

        <!-- DIAGNOSTIC FINDINGS DISPLAY -->
        ${report.results && report.results.length > 0 ? `
          <div style="margin-top:0.65rem;">
            <!-- Parameter Chips -->
            <div style="display:flex;gap:0.5rem;flex-wrap:wrap;margin-bottom:0.75rem;">
              ${report.results.map(r => {
                const evalResult = evaluateLabReading(r.test || report.testName, r.reading, r.normalValue || report.normalValue);
                const chipClass = evalResult.isAbnormal ? 'result-chip chip-abnormal' : 'result-chip chip-normal';
                const badgeClass = evalResult.isAbnormal ? 'badge-status-abnormal' : 'badge-status-normal';
                return `
                  <div class="${chipClass}">
                    <strong>
                      <span>${r.test || 'Parameter'}</span>
                      <span class="${badgeClass}">${evalResult.tag}</span>
                    </strong>
                    <div class="chip-val">${r.reading || '—'}</div>
                    ${r.normalValue ? `<div style="font-size:0.68rem;opacity:0.8;margin-top:0.15rem;">Ref: ${r.normalValue}</div>` : ''}
                  </div>
                `;
              }).join('')}
            </div>

            <!-- Full Findings Table -->
            <div class="table-responsive">
              <table class="lab-results-table">
                <thead>
                  <tr>
                    <th>Component Parameter</th>
                    <th>Observed Reading</th>
                    <th>Reference Range</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  ${report.results.map(r => {
                    const evalResult = evaluateLabReading(r.test || report.testName, r.reading, r.normalValue || report.normalValue);
                    const rowClass = evalResult.isAbnormal ? 'row-abnormal' : '';
                    const valColor = evalResult.isAbnormal ? '#b91c1c;font-weight:800;' : '#065f46;font-weight:700;';
                    const badge = evalResult.isAbnormal
                      ? `<span class="badge-status-abnormal">${evalResult.tag} (ABNORMAL)</span>`
                      : `<span class="badge-status-normal">NORMAL</span>`;
                    return `
                      <tr class="${rowClass}">
                        <td><strong>${r.test || 'Parameter'}</strong></td>
                        <td style="color:${valColor};font-size:0.88rem;">${r.reading || '—'}</td>
                        <td style="color:var(--text-muted);font-size:0.8rem;">${r.normalValue || report.normalValue || 'Standard Reference Range'}</td>
                        <td>${badge}</td>
                      </tr>
                    `;
                  }).join('')}
                </tbody>
              </table>
            </div>
          </div>
        ` : report.actualReading ? `
          <div style="margin-top:0.65rem;">
            ${(() => {
              const evalResult = evaluateLabReading(report.testName, report.actualReading, report.normalValue);
              const chipClass = evalResult.isAbnormal ? 'result-chip chip-abnormal' : 'result-chip chip-normal';
              const badgeClass = evalResult.isAbnormal ? 'badge-status-abnormal' : 'badge-status-normal';
              return `
                <div class="${chipClass}" style="min-width:280px;display:inline-block;">
                  <strong>
                    <span>${report.testName || 'Diagnostic Finding'}</span>
                    <span class="${badgeClass}">${evalResult.tag}</span>
                  </strong>
                  <div class="chip-val">${report.actualReading}</div>
                  ${report.normalValue ? `<div style="font-size:0.72rem;opacity:0.85;margin-top:0.2rem;">Normal Reference: ${report.normalValue}</div>` : ''}
                </div>
              `;
            })()}
          </div>
        ` : ''}

        ${report.remarks ? `
          <div style="font-size:0.8rem;color:var(--text-muted);margin-top:0.6rem;background:var(--bg-main);padding:0.45rem 0.75rem;border-radius:var(--radius-sm);border-left:3px solid var(--border);">
            <strong>Technician Note:</strong> ${report.remarks}
          </div>
        ` : ''}

        <div style="margin-top:0.85rem;">
          <button type="button" class="btn btn-outline btn-sm" onclick="openLabReportModal('${repId}', '${ordId}')">
            <svg class="icon" viewBox="0 0 24 24"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
            View Official Report (Read Only)
          </button>
        </div>
      </div>
      <div style="text-align:right;flex-shrink:0;">
        <div style="font-size:0.78rem;color:var(--text-muted);">Reported on</div>
        <div style="font-weight:600;font-size:0.85rem;color:var(--text-main);">${report.date || '—'}</div>
        <div style="font-size:0.75rem;color:var(--text-muted);margin-top:0.15rem;">By ${report.technicianName || 'Malathi Sreekumar (Lab Tech)'}</div>
      </div>
    `;
    container.appendChild(row);
  });
}

/* ──────────────────────────────────────────────────────────
   PATIENT LAB RESULTS BANNER FOR CONSULTATION SECTION 4
────────────────────────────────────────────────────────── */
function renderPatientLabStatus(appt) {
  const container = document.getElementById('patientLabStatusBanner');
  if (!container) return;

  const currentAppt = appt || activeAppt;
  if (!currentAppt) {
    container.style.display = 'none';
    container.innerHTML = '';
    return;
  }

  const labOrders = getStorage(CMS_KEYS.LAB_ORDERS, []);
  const labReports = getStorage(CMS_KEYS.LAB_REPORTS, []);

  // Match lab orders strictly for this specific appointment/visit
  const patientOrders = labOrders.filter(o =>
    currentAppt.appointmentId && String(o.appointmentId) === String(currentAppt.appointmentId)
  );

  const patientReports = labReports.filter(r =>
    patientOrders.some(po => String(po.labOrderId) === String(r.labOrderId)) ||
    (currentAppt.appointmentId && String(r.appointmentId) === String(currentAppt.appointmentId))
  );

  if (patientOrders.length === 0 && patientReports.length === 0) {
    container.style.display = 'none';
    container.innerHTML = '';
    return;
  }

  const completedItems = [];

  patientReports.forEach(r => {
    completedItems.push({
      reportId: r.reportId,
      labOrderId: r.labOrderId,
      testName: r.testName || (r.results && r.results.map(x => x.test).join(', ')) || 'Diagnostic Panel',
      actualReading: r.actualReading || (r.results && r.results.map(x => `${x.test}: ${x.reading}`).join(', ')) || 'Verified',
      date: r.date || 'Today'
    });
  });

  patientOrders.forEach(o => {
    if ((o.status === 'Completed' || o.actualReading) && !completedItems.some(ci => String(ci.labOrderId) === String(o.labOrderId))) {
      completedItems.push({
        reportId: o.labOrderId,
        labOrderId: o.labOrderId,
        testName: (o.tests || ['Diagnostic Test']).join(', '),
        actualReading: o.actualReading || 'Completed',
        date: o.reportDate || o.date || 'Today'
      });
    }
  });

  const pendingOrders = patientOrders.filter(o => o.status === 'Pending' && !completedItems.some(ci => String(ci.labOrderId) === String(o.labOrderId)));

  // Sort latest findings at top
  completedItems.sort((a, b) => compareLabItemsLatestFirst(a, a, b, b));

  let html = '';

  if (completedItems.length > 0) {
    completedItems.forEach(ci => {
      const evalResult = evaluateLabReading(ci.testName, ci.actualReading, '');
      const isAb = evalResult.isAbnormal;
      const cardBg = isAb ? '#fef2f2' : '#ecfdf5';
      const cardBorder = isAb ? '#fecaca' : '#a7f3d0';
      const cardAccent = isAb ? '#ef4444' : 'var(--success)';
      const titleColor = isAb ? '#991b1b' : '#065f46';
      const badge = isAb
        ? `<span class="badge-status-abnormal">${evalResult.tag} (ABNORMAL)</span>`
        : `<span class="badge-status-normal">ALL NORMAL</span>`;
      const resBorder = isAb ? '#fca5a5' : '#bbf7d0';
      const resColor = isAb ? '#b91c1c' : '#047857';

      html += `
        <div style="background:${cardBg};border:1px solid ${cardBorder};border-left:4px solid ${cardAccent};padding:0.85rem 1rem;border-radius:var(--radius-sm);display:flex;align-items:center;justify-content:space-between;gap:0.75rem;flex-wrap:wrap;margin-bottom:0.5rem;box-shadow:0 1px 2px rgba(0,0,0,0.04);">
          <div style="flex:1;min-width:240px;">
            <div style="font-weight:700;color:${titleColor};font-size:0.9rem;display:flex;align-items:center;gap:0.4rem;">
              <svg class="icon" viewBox="0 0 24 24" style="stroke:${cardAccent};width:1.2rem;height:1.2rem;"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
              <span>Lab Findings Ready: <strong>${ci.testName}</strong></span>
              ${badge}
            </div>
            <div style="font-size:0.8rem;color:${resColor};margin-top:0.25rem;background:#ffffff;padding:0.35rem 0.6rem;border-radius:4px;border:1px solid ${resBorder};display:inline-block;">
              <strong>Result:</strong> ${ci.actualReading}
            </div>
          </div>
          <div>
            <button type="button" class="btn btn-sm ${isAb ? 'btn-primary' : 'btn-primary'}" onclick="openLabReportModal('${ci.reportId || ''}', '${ci.labOrderId || ''}')" style="${isAb ? 'background:#dc2626;border-color:#dc2626;' : ''}box-shadow:0 1px 3px rgba(0,0,0,0.15);">
              <svg class="icon" viewBox="0 0 24 24"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
              View Official Report (Read Only)
            </button>
          </div>
        </div>
      `;
    });
  }

  if (pendingOrders.length > 0) {
    pendingOrders.forEach(po => {
      html += `
        <div style="background:#fffbeb;border:1px solid #fde68a;border-left:4px solid #f59e0b;padding:0.65rem 1rem;border-radius:var(--radius-sm);display:flex;align-items:center;justify-content:space-between;gap:0.75rem;flex-wrap:wrap;margin-bottom:0.5rem;">
          <div style="font-size:0.84rem;color:#92400e;">
            <strong>Test Order Pending:</strong> ${(po.tests || ['Lab Investigation']).join(', ')} (Order #${po.labOrderId}) is queued in the laboratory.
          </div>
          <span class="badge badge-scheduled">Pending Lab Processing</span>
        </div>
      `;
    });
  }

  container.innerHTML = html;
  container.style.display = html ? 'block' : 'none';
}

/* ──────────────────────────────────────────────────────────
   INSTANT LAB REQUEST FROM CONSULTATION
────────────────────────────────────────────────────────── */
function sendLabRequestFromConsultation() {
  if (!activeAppt) {
    showToast('Please select a patient first!', 'warning');
    return;
  }

  const labTests = [];
  document.querySelectorAll('input[name="labCheck"]:checked').forEach(cb => labTests.push(cb.value));

  const remarks = (document.getElementById('labRemarks')?.value || '').trim();

  if (labTests.length === 0 && !remarks) {
    showToast('Please select at least one lab test to request!', 'warning');
    return;
  }

  const labList = getStorage(CMS_KEYS.LAB_ORDERS, []);
  const uid = Date.now().toString().slice(-4);
  const newOrder = {
    labOrderId: `LAB-${uid}`,
    appointmentId: activeAppt.appointmentId,
    patientId: activeAppt.patientId,
    patientName: activeAppt.patientName,
    doctorName: (currentUser && currentUser.name) || 'Dr. Prateek Pradeep',
    date: new Date().toISOString().split('T')[0],
    time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    createdAt: Date.now(),
    tests: labTests.length > 0 ? labTests : ['Diagnostic Evaluation'],
    remarks: remarks,
    status: 'Pending'
  };

  labList.unshift(newOrder);
  setStorage(CMS_KEYS.LAB_ORDERS, labList);
  saveConsultationDraft();

  showToast(`Lab test requested for ${activeAppt.patientName}. Sent to Lab Technician pending queue!`, 'success');
  renderLabRequests();
}

/* ──────────────────────────────────────────────────────────
   MODAL: NEW LAB REQUEST FOR ANY PATIENT
────────────────────────────────────────────────────────── */
function openNewLabRequestModal() {
  const select = document.getElementById('labReqPatientSelect');
  if (select) {
    select.innerHTML = '<option value="">-- Choose Patient --</option>';
    const patients = getStorage(CMS_KEYS.PATIENTS, []);
    patients.forEach(p => {
      select.innerHTML += `<option value="${p.patientId}" data-name="${p.name}">${p.name} (${p.patientId} · Age ${p.age || '—'} · ${p.gender || '—'})</option>`;
    });

    if (activeAppt && activeAppt.patientId) {
      select.value = activeAppt.patientId;
    }
  }

  document.querySelectorAll('input[name="modalLabTest"]').forEach(cb => cb.checked = false);
  const custom = document.getElementById('labReqCustomTest');
  if (custom) custom.value = '';
  const rem = document.getElementById('labReqRemarks');
  if (rem) rem.value = '';

  const modal = document.getElementById('newLabRequestModal');
  if (modal) modal.classList.add('show');
}

function closeNewLabRequestModal() {
  const modal = document.getElementById('newLabRequestModal');
  if (modal) modal.classList.remove('show');
}

function handleNewLabRequestSubmit(e) {
  e.preventDefault();
  const select = document.getElementById('labReqPatientSelect');
  const patientId = select.value;
  if (!patientId) {
    showToast('Please select a patient!', 'warning');
    return;
  }

  const selectedOpt = select.options[select.selectedIndex];
  const patientName = selectedOpt.dataset.name || 'Patient';

  const tests = [];
  document.querySelectorAll('input[name="modalLabTest"]:checked').forEach(cb => tests.push(cb.value));

  const customTest = (document.getElementById('labReqCustomTest')?.value || '').trim();
  if (customTest) tests.push(customTest);

  if (tests.length === 0) {
    showToast('Please select or specify at least one lab test!', 'warning');
    return;
  }

  const remarks = (document.getElementById('labReqRemarks')?.value || '').trim();
  const labList = getStorage(CMS_KEYS.LAB_ORDERS, []);
  const uid = Date.now().toString().slice(-4);

  const newOrder = {
    labOrderId: `LAB-${uid}`,
    appointmentId: activeAppt && activeAppt.patientId === patientId ? activeAppt.appointmentId : null,
    patientId: patientId,
    patientName: patientName,
    doctorName: (currentUser && currentUser.name) || 'Dr. Prateek Pradeep',
    date: new Date().toISOString().split('T')[0],
    tests: tests,
    remarks: remarks,
    status: 'Pending'
  };

  labList.unshift(newOrder);
  setStorage(CMS_KEYS.LAB_ORDERS, labList);

  closeNewLabRequestModal();
  showToast(`Lab request #${newOrder.labOrderId} sent to Lab Technician pending queue!`, 'success');
  renderLabRequests();
}

/* ──────────────────────────────────────────────────────────
   MODAL: VIEW READ-ONLY LAB REPORT
────────────────────────────────────────────────────────── */
function openLabReportModal(reportId, labOrderId) {
  const labReports = getStorage(CMS_KEYS.LAB_REPORTS, []);
  const labOrders  = getStorage(CMS_KEYS.LAB_ORDERS, []);
  const patients   = getStorage(CMS_KEYS.PATIENTS, []);

  const report = labReports.find(r =>
    (reportId && String(r.reportId) === String(reportId)) ||
    (labOrderId && String(r.labOrderId) === String(labOrderId))
  );

  const order = labOrders.find(o => String(o.labOrderId) === String(labOrderId));
  const patientId = (report && report.patientId) || (order && order.patientId);
  const p = patients.find(pt => pt.patientId === patientId) || {};

  const patName = (report && report.patientName) || (order && order.patientName) || 'Patient';
  const docName = (report && report.doctorName) || (order && order.doctorName) || (currentUser && currentUser.name) || 'Dr. Prateek Pradeep';
  const repDate = (report && report.date) || (order && order.reportDate) || (order && order.date) || new Date().toLocaleDateString();
  const techName = (report && report.technicianName) || 'Malathi Sreekumar (Certified Medical Lab Technologist)';
  const remarks = (report && report.remarks) || (order && order.reportRemarks) || 'Findings recorded and verified within standard laboratory parameters.';

  document.getElementById('reportViewPatName').textContent = patName;
  document.getElementById('reportViewPatMeta').textContent = `ID: ${patientId || '—'} · Gender: ${p.gender || '—'}, Age: ${p.age || '—'}, Blood Group: ${p.bloodGroup || '—'}`;
  document.getElementById('reportViewDocName').textContent = docName;
  document.getElementById('reportViewDate').textContent = repDate;
  document.getElementById('reportViewRemarks').textContent = remarks;
  document.getElementById('reportViewTechName').textContent = techName;

  const tbody = document.getElementById('reportViewTbody');
  tbody.innerHTML = '';

  if (report && report.results && report.results.length > 0) {
    report.results.forEach(r => {
      const evalResult = evaluateLabReading(r.test || report.testName, r.reading, r.normalValue || report.normalValue);
      const rowBg = evalResult.isAbnormal ? '#fff5f5' : '#ffffff';
      const rowBorder = evalResult.isAbnormal ? '#fca5a5' : '#f1f5f9';
      const valColor = evalResult.isAbnormal ? '#dc2626' : '#059669';
      const badge = evalResult.isAbnormal
        ? `<span class="badge-status-abnormal">${evalResult.tag} (OUT OF RANGE)</span>`
        : `<span class="badge-status-normal">NORMAL</span>`;

      tbody.innerHTML += `
        <tr style="background:${rowBg};border-top:1px solid ${rowBorder};">
          <td style="padding:0.6rem 0.75rem;font-weight:700;color:var(--text-main);">${r.test || r.testName || 'Test Parameter'}</td>
          <td style="padding:0.6rem 0.75rem;color:var(--text-muted);">${r.sampleType || report.sampleType || 'Diagnostic Specimen'}</td>
          <td style="padding:0.6rem 0.75rem;color:var(--text-muted);">${r.normalValue || report.normalValue || 'Standard Reference Range'}</td>
          <td style="padding:0.6rem 0.75rem;font-weight:800;color:${valColor};">
            ${r.reading || '—'} &nbsp; ${badge}
          </td>
        </tr>
      `;
    });
  } else if (report && report.testName) {
    const evalResult = evaluateLabReading(report.testName, report.actualReading, report.normalValue);
    const rowBg = evalResult.isAbnormal ? '#fff5f5' : '#ffffff';
    const valColor = evalResult.isAbnormal ? '#dc2626' : '#059669';
    const badge = evalResult.isAbnormal
      ? `<span class="badge-status-abnormal">${evalResult.tag} (ABNORMAL)</span>`
      : `<span class="badge-status-normal">NORMAL</span>`;

    tbody.innerHTML = `
      <tr style="background:${rowBg};border-top:1px solid #f1f5f9;">
        <td style="padding:0.6rem 0.75rem;font-weight:700;color:var(--text-main);">${report.testName}</td>
        <td style="padding:0.6rem 0.75rem;color:var(--text-muted);">${report.sampleType || 'Blood'}</td>
        <td style="padding:0.6rem 0.75rem;color:var(--text-muted);">${report.normalValue || 'Standard Reference Range'}</td>
        <td style="padding:0.6rem 0.75rem;font-weight:800;color:${valColor};">
          ${report.actualReading || 'Normal'} &nbsp; ${badge}
        </td>
      </tr>
    `;
  } else if (order && order.actualReading) {
    const tests = order.tests || ['Laboratory Investigation'];
    tests.forEach(t => {
      const evalResult = evaluateLabReading(t, order.actualReading, '');
      const rowBg = evalResult.isAbnormal ? '#fff5f5' : '#ffffff';
      const valColor = evalResult.isAbnormal ? '#dc2626' : '#059669';
      const badge = evalResult.isAbnormal
        ? `<span class="badge-status-abnormal">${evalResult.tag} (ABNORMAL)</span>`
        : `<span class="badge-status-normal">NORMAL</span>`;

      tbody.innerHTML += `
        <tr style="background:${rowBg};border-top:1px solid #f1f5f9;">
          <td style="padding:0.6rem 0.75rem;font-weight:700;color:var(--text-main);">${t}</td>
          <td style="padding:0.6rem 0.75rem;color:var(--text-muted);">Diagnostic Specimen</td>
          <td style="padding:0.6rem 0.75rem;color:var(--text-muted);">Normal Reference Values</td>
          <td style="padding:0.6rem 0.75rem;font-weight:800;color:${valColor};">
            ${order.actualReading} &nbsp; ${badge}
          </td>
        </tr>
      `;
    });
  } else {
    tbody.innerHTML = `
      <tr>
        <td colspan="4" style="padding:1rem;text-align:center;color:var(--text-muted);">
          No detailed test parameters recorded.
        </td>
      </tr>
    `;
  }

  const modal = document.getElementById('viewLabReportModal');
  if (modal) modal.classList.add('show');
}

function closeLabReportModal() {
  const modal = document.getElementById('viewLabReportModal');
  if (modal) modal.classList.remove('show');
}

/* ──────────────────────────────────────────────────────────
   REAL-TIME CROSS-TAB SYNC (Auto-refresh on lab, rx, medicine updates)
────────────────────────────────────────────────────────── */
window.addEventListener('storage', function(e) {
  if (!e.key || e.key.includes('lab') || e.key.includes('appointment') || e.key.includes('consultation') || e.key.includes('prescription') || e.key.includes('medicine')) {
    renderQueueAndStats();
    renderLabRequests();
    renderLabResults();
    renderPatientLabStatus();
    loadMedicineOptions();
    renderHistory();
  }
});

window.addEventListener('focus', function() {
  renderQueueAndStats();
  renderLabRequests();
  renderLabResults();
  renderPatientLabStatus();
  loadMedicineOptions();
  renderHistory();
});

window.addEventListener('cms_stock_updated', function() {
  loadMedicineOptions();
  renderHistory();
});

window.addEventListener('cms_rx_updated', function() {
  renderQueueAndStats();
  renderHistory();
});

