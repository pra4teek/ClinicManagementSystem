const state = { user: null, patients: [], appointments: [] };
const elements = {
  patientBody: document.getElementById("pat-body"),
  appointmentBody: document.getElementById("apt-body"),
  patientSearch: document.getElementById("pat-search"),
  patientSearchFilter: document.getElementById("pat-search-filter"),
  patientSearchBtn: document.getElementById("pat-search-btn"),
  appointmentSearch: document.getElementById("apt-search"),
  patientSelect: document.getElementById("apt-patient"),
  statusSelect: document.getElementById("status-apt"),
  patientForm: document.getElementById("reg-form"),
  appointmentForm: document.getElementById("apt-form"),
  statusForm: document.getElementById("status-form")
};

function escapeHtml(value) {
  return String(value ?? "").replace(/[&<>"']/g, character => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[character]);
}

function showMessage(id, text, success = false) {
  const message = document.getElementById(id);
  if (!message) return;
  message.className = success ? "form-message ok" : "form-message";
  message.textContent = text;
}

function validateText(input, label, minimum, maximum, pattern, patternMessage) {
  const value = input.value.trim();
  input.value = value;
  if (!value) return `${label} is required.`;
  if (value.length < minimum || value.length > maximum) return `${label} must be between ${minimum} and ${maximum} characters.`;
  if (pattern && !pattern.test(value)) return patternMessage;
  return "";
}

function validateForm(form, messageId, checks) {
  const errors = checks.map(check => check()).filter(Boolean);
  form.querySelectorAll("input, textarea, select").forEach(input => {
    if (input.required && !input.value.trim()) input.setAttribute("aria-invalid", "true");
    else input.removeAttribute("aria-invalid");
  });
  showMessage(messageId, errors.join(" "));
  return errors.length === 0;
}

function patientId(patient) {
  return patient.patientId ?? patient.PatientId ?? patient.id;
}

function patientName(patient) {
  return patient.name ?? patient.Name ?? "Unknown patient";
}

function calculateAge(dob) {
  if (!dob) return null;
  let birthYear, birthMonth, birthDay;
  if (typeof dob === "string" && /^\d{4}-\d{2}-\d{2}$/.test(dob)) {
    const parts = dob.split("-").map(Number);
    birthYear = parts[0];
    birthMonth = parts[1] - 1;
    birthDay = parts[2];
  } else {
    const birth = new Date(dob);
    if (Number.isNaN(birth.getTime())) return null;
    birthYear = birth.getFullYear();
    birthMonth = birth.getMonth();
    birthDay = birth.getDate();
  }
  const today = new Date();
  let age = today.getFullYear() - birthYear;
  const m = today.getMonth() - birthMonth;
  if (m < 0 || (m === 0 && today.getDate() < birthDay)) {
    age--;
  }
  return age;
}

function isFutureDate(dob) {
  if (!dob) return false;
  let birthYear, birthMonth, birthDay;
  if (typeof dob === "string" && /^\d{4}-\d{2}-\d{2}$/.test(dob)) {
    const parts = dob.split("-").map(Number);
    birthYear = parts[0];
    birthMonth = parts[1] - 1;
    birthDay = parts[2];
  } else {
    const birth = new Date(dob);
    if (Number.isNaN(birth.getTime())) return false;
    birthYear = birth.getFullYear();
    birthMonth = birth.getMonth();
    birthDay = birth.getDate();
  }
  const today = new Date();
  const currentYear = today.getFullYear();
  const currentMonth = today.getMonth();
  const currentDay = today.getDate();
  if (birthYear > currentYear) return true;
  if (birthYear === currentYear && birthMonth > currentMonth) return true;
  if (birthYear === currentYear && birthMonth === currentMonth && birthDay > currentDay) return true;
  return false;
}

function getPatientAge(patient) {
  if (!patient) return null;
  const dob = patient.dob ?? patient.DOB ?? patient.DateOfBirth;
  if (dob) {
    const age = calculateAge(dob);
    if (age !== null && age >= 0) return age;
  }
  if (patient.age != null && patient.age !== "") {
    const parsed = Number(patient.age);
    return Number.isNaN(parsed) ? patient.age : parsed;
  }
  return null;
}

function appointmentId(appointment) {
  return appointment.appointmentId ?? appointment.AppointmentId ?? appointment.id;
}

function appointmentDate(appointment) {
  return appointment.date ?? appointment.AppointmentDateTime ?? "";
}

function appointmentStatus(appointment) {
  return appointment.status ?? appointment.AppointmentStatus ?? "Scheduled";
}

function sameLocalDay(value) {
  if (!value) return true;
  if (/^\d{1,2}:\d{2}\s*(AM|PM)$/i.test(value)) return true;
  const date = /^\d{4}-\d{2}-\d{2}$/.test(value) ? new Date(`${value}T00:00:00`) : new Date(value);
  const today = new Date();
  return !Number.isNaN(date.getTime()) && date.getFullYear() === today.getFullYear() && date.getMonth() === today.getMonth() && date.getDate() === today.getDate();
}

function displayTime(value) {
  if (!value) return "--";
  if (/^\d{1,2}:\d{2}\s*(AM|PM)$/i.test(value)) return value;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? String(value) : date.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
}

function patientLabel(id) {
  const patient = state.patients.find(item => String(patientId(item)) === String(id));
  return patient ? patientName(patient) : `Patient #${id || "--"}`;
}

function doctorLabel(appointment) {
  return appointment.doctorName ?? "--";
}

function tokenFor(appointment) {
  return appointment.tokenNumber ?? "--";
}

function formatDob(dob) {
  if (!dob) return "--";
  if (typeof dob === "string" && /^\d{4}-\d{2}-\d{2}$/.test(dob)) {
    const parts = dob.split("-").map(Number);
    const months = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
    const day = String(parts[2]).padStart(2, "0");
    const month = months[parts[1] - 1] || "";
    const year = parts[0];
    return `${day} ${month} ${year}`;
  }
  return String(dob);
}

function isPatientMatch(patient, query, filterType) {
  const pid = String(patientId(patient) || "").trim().toLowerCase();
  const pname = String(patientName(patient) || "").trim().toLowerCase();
  const rawPhone = String(patient.phone || "").trim().toLowerCase();
  const pphoneDigits = rawPhone.replace(/\D/g, "");
  const q = query.toLowerCase();
  const qDigits = q.replace(/\D/g, "");

  if (filterType === "id") {
    return pid.includes(q);
  }
  if (filterType === "name") {
    return pname.includes(q);
  }
  if (filterType === "phone") {
    return rawPhone.includes(q) || (qDigits.length > 0 && pphoneDigits.includes(qDigits));
  }
  return pid.includes(q) || pname.includes(q) || rawPhone.includes(q) || (qDigits.length > 0 && pphoneDigits.includes(qDigits));
}

function getMatchScore(patient, query) {
  const pid = String(patientId(patient) || "").trim().toLowerCase();
  const pname = String(patientName(patient) || "").trim().toLowerCase();
  const rawPhone = String(patient.phone || "").trim().toLowerCase();
  const pphoneDigits = rawPhone.replace(/\D/g, "");
  const q = query.toLowerCase();
  const qDigits = q.replace(/\D/g, "");

  if (pid === q) return 1;
  if (rawPhone === q || (qDigits.length > 0 && pphoneDigits === qDigits)) return 2;
  if (pname === q) return 3;
  if (pname.startsWith(q)) return 4;
  if (pname.includes(q)) return 5;
  if (rawPhone.includes(q) || (qDigits.length > 0 && pphoneDigits.includes(qDigits))) return 6;
  if (pid.includes(q)) return 7;
  return 8;
}

function populatePatientSelect() {
  if (!elements.patientSelect) return;
  const selected = elements.patientSelect.value;
  elements.patientSelect.innerHTML = `<option value="">Select a patient</option>${state.patients.map(patient => {
    const age = getPatientAge(patient);
    const meta = [patientId(patient), age != null ? `${age} yrs` : "", patient.phone].filter(Boolean).join(" · ");
    return `<option value="${escapeHtml(patientId(patient))}">${escapeHtml(patientName(patient))} (${escapeHtml(meta)})</option>`;
  }).join("")}`;
  elements.patientSelect.value = selected;
  if (elements.patientSelect.value !== selected) {
    const preview = document.getElementById("patient-preview");
    if (preview) preview.classList.remove("visible");
  }
}

function renderPatients() {
  populatePatientSelect();
  const searchInput = elements.patientSearch || document.getElementById("pat-search");
  const filterSelect = document.getElementById("pat-search-filter");
  const query = searchInput ? searchInput.value.trim() : "";
  const filterType = filterSelect ? filterSelect.value : "all";

  if (!query) {
    elements.patientBody.innerHTML = `<tr class="empty-row"><td colspan="7">Enter a patient name, ID, or phone number to search.</td></tr>`;
    return;
  }

  const matching = state.patients.filter(patient => isPatientMatch(patient, query, filterType));

  if (!matching.length) {
    elements.patientBody.innerHTML = `<tr class="empty-row"><td colspan="7">No patients found.</td></tr>`;
    return;
  }

  const sorted = matching.sort((a, b) => {
    const scoreA = getMatchScore(a, query);
    const scoreB = getMatchScore(b, query);
    if (scoreA !== scoreB) return scoreA - scoreB;
    const nameDiff = patientName(a).localeCompare(patientName(b));
    if (nameDiff !== 0) return nameDiff;
    return String(patientId(a)).localeCompare(String(patientId(b)));
  });

  const selectedPatientId = elements.patientSelect ? elements.patientSelect.value : "";

  elements.patientBody.innerHTML = sorted.map(patient => {
    const pid = patientId(patient);
    const pname = patientName(patient);
    const age = getPatientAge(patient);
    const ageStr = age != null ? `${age} years` : "--";
    const dobStr = formatDob(patient.dob || patient.DOB);
    const isSelected = selectedPatientId && String(selectedPatientId) === String(pid);

    return `
      <tr class="${isSelected ? "patient-selected-row" : ""}" style="${isSelected ? "background:#f0f7ff;" : ""}">
        <td><span class="strong">${escapeHtml(pid)}</span></td>
        <td>
          <span class="strong">${escapeHtml(pname)}</span>
        </td>
        <td>${escapeHtml(dobStr)}</td>
        <td>${escapeHtml(ageStr)} / ${escapeHtml(patient.gender ?? "--")}</td>
        <td>${escapeHtml(patient.bloodGroup ?? "--")}</td>
        <td>${escapeHtml(patient.phone ?? "--")}</td>
        <td>
          <button class="row-action" type="button" data-book-patient="${escapeHtml(pid)}" style="${isSelected ? "font-weight:700;color:var(--primary);" : ""}">
            ${isSelected ? "✓ Selected" : "Select Patient"}
          </button>
        </td>
      </tr>`;
  }).join("");
}

function renderAppointments() {
  const query = elements.appointmentSearch.value.trim().toLowerCase();
  const todaysAppointments = state.appointments.filter(appointment => sameLocalDay(appointmentDate(appointment)));
  const visible = todaysAppointments.filter(appointment => {
    const values = [appointmentId(appointment), tokenFor(appointment), patientLabel(appointment.patientId), appointment.patientName, doctorLabel(appointment), appointmentStatus(appointment), appointment.time, appointmentDate(appointment), appointment.reason];
    return values.join(" ").toLowerCase().includes(query);
  });
  if (!visible.length) {
    elements.appointmentBody.innerHTML = `<tr class="empty-row"><td colspan="7">${query ? "No appointments match your search." : "No appointments booked for today."}</td></tr>`;
  } else {
    elements.appointmentBody.innerHTML = visible.map(appointment => {
      const status = appointmentStatus(appointment);
      const statusClass = status === "Completed" ? "status-completed" : status === "Cancelled" ? "status-cancelled" : "status-scheduled";
      return `<tr>
        <td><span class="token-chip">${escapeHtml(tokenFor(appointment))}</span></td>
        <td><span class="strong">${escapeHtml(appointment.patientName || patientLabel(appointment.patientId))}</span><span class="subtext">${escapeHtml(appointment.patientId)}</span></td>
        <td>${escapeHtml(doctorLabel(appointment))}</td>
        <td>${escapeHtml(displayTime(appointment.time ?? appointmentDate(appointment)))}</td>
        <td style="max-width:180px;white-space:normal">${escapeHtml(appointment.reason || "--")}</td>
        <td><span class="status ${statusClass}">${escapeHtml(status)}</span></td>
        <td><button class="row-action" type="button" data-edit-appointment="${escapeHtml(appointmentId(appointment))}" data-current-status="${escapeHtml(status)}">Edit</button> <button class="row-action danger" type="button" data-set-status="${escapeHtml(appointmentId(appointment))}" data-status="Cancelled">Cancel</button></td>
      </tr>`;
    }).join("");
  }
  const selected = elements.statusSelect.value;
  elements.statusSelect.innerHTML = `<option value="">Select appointment</option>${todaysAppointments.map(appointment => `<option value="${escapeHtml(appointmentId(appointment))}">${escapeHtml(tokenFor(appointment))}. ${escapeHtml(appointment.patientName || patientLabel(appointment.patientId))} · ${escapeHtml(displayTime(appointment.time ?? appointmentDate(appointment)))}</option>`).join("")}`;
  elements.statusSelect.value = selected;
  if (elements.statusSelect.value !== selected) elements.statusSelect.value = "";
  document.getElementById("stat-total-apts").textContent = todaysAppointments.length;
  document.getElementById("stat-scheduled").textContent = todaysAppointments.filter(item => ["Scheduled", "Waiting", "Consulting"].includes(appointmentStatus(item))).length;
  document.getElementById("stat-completed").textContent = todaysAppointments.filter(item => appointmentStatus(item) === "Completed").length;
}

function updatePatientPreview() {
  const patient = state.patients.find(item => String(patientId(item)) === elements.patientSelect.value);
  const preview = document.getElementById("patient-preview");
  if (!patient) {
    preview.classList.remove("visible");
    return;
  }
  const age = getPatientAge(patient);
  document.getElementById("prev-age-gender").textContent = `${age ?? "--"} / ${patient.gender ?? "--"}`;
  document.getElementById("prev-blood").textContent = patient.bloodGroup ?? "--";
  document.getElementById("prev-phone").textContent = patient.phone ?? "--";
  document.getElementById("prev-id").textContent = patientId(patient);
  preview.classList.add("visible");
}

function renderAll() {
  document.getElementById("stat-patients").textContent = state.patients.length;
  renderPatients();
  renderAppointments();
  renderBillingTable();
}

function loadDashboard() {
  state.patients = getStorage(CMS_KEYS.PATIENTS, DEFAULT_PATIENTS);
  state.appointments = getStorage(CMS_KEYS.APPOINTMENTS, DEFAULT_APPOINTMENTS);
  if (!Array.isArray(state.patients)) state.patients = [...DEFAULT_PATIENTS];
  if (!Array.isArray(state.appointments)) state.appointments = [...DEFAULT_APPOINTMENTS];
  renderAll();
}

function registrationChecks() {
  const name = document.getElementById("reg-name");
  const phone = document.getElementById("reg-phone");
  const dob = document.getElementById("reg-dob") || document.getElementById("reg-age");
  return [
    () => validateText(name, "Name", 3, 100, /^[A-Za-z ]+$/, "Name must contain only letters and spaces."),
    () => {
      const value = phone.value.trim();
      phone.value = value;
      if (!/^\d{10}$/.test(value)) return "Phone must contain exactly 10 digits.";
      const patients = getStorage(CMS_KEYS.PATIENTS, DEFAULT_PATIENTS);
      return patients.some(patient => String(patient.phone ?? "").trim() === value) ? "A patient with this phone number is already registered." : "";
    },
    () => {
      if (!dob) return "Date of birth is required.";
      const value = dob.value.trim();
      dob.value = value;
      if (!value) return "Date of birth is required.";
      if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return "Please enter a valid date of birth.";
      if (isFutureDate(value)) return "Date of birth cannot be in the future.";
      const age = calculateAge(value);
      if (age === null || age < 0 || age > 100) return "Patient age must be between 0 and 100 years.";
      return "";
    },
    () => document.getElementById("reg-gender").value ? "" : "Gender is required.",
    () => document.getElementById("reg-blood").value ? "" : "Blood group is required."
  ];
}

async function registerPatient(event) {
  event.preventDefault();
  const form = event.currentTarget;
  if (!validateForm(form, "reg-message", registrationChecks())) return;
  const submit = document.getElementById("reg-submit");
  submit.disabled = true;
  try {
    const patients = getStorage(CMS_KEYS.PATIENTS, DEFAULT_PATIENTS);
    const highestId = patients.reduce((highest, patient) => Math.max(highest, Number(String(patientId(patient)).replace(/\D/g, "")) || 0), 1000);
    const newPatientId = `PAT-${highestId + 1}`;
    if (patients.some(patient => String(patientId(patient)) === newPatientId)) throw new Error("That patient ID already exists. Refresh the dashboard and try again.");
    const dobInput = document.getElementById("reg-dob") || document.getElementById("reg-age");
    const patient = {
      patientId: newPatientId,
      name: document.getElementById("reg-name").value.trim(),
      dob: dobInput ? dobInput.value.trim() : "",
      gender: document.getElementById("reg-gender").value,
      phone: document.getElementById("reg-phone").value.trim(),
      bloodGroup: document.getElementById("reg-blood").value
    };
    patients.push(patient);
    if (!setStorage(CMS_KEYS.PATIENTS, patients)) throw new Error("Patient could not be saved in this browser.");
    showMessage("reg-message", `Registered: ${patient.patientId}.`, true);
    form.reset();
    loadDashboard();
    if (typeof showToast === "function") showToast("Patient registered successfully.", "success");
  } catch (error) {
    showMessage("reg-message", error.message);
  } finally {
    submit.disabled = false;
  }
}

function appointmentChecks() {
  return [
    () => elements.patientSelect.value ? "" : "Select a patient.",
    () => validateText(document.getElementById("apt-doctor"), "Doctor name", 3, 30, /^[A-Za-z .'-]+$/, "Doctor name contains unsupported characters."),
    () => document.getElementById("apt-time").value ? "" : "Select a time slot.",
    () => validateText(document.getElementById("apt-reason"), "Reason for visit", 3, 200, /^[A-Za-z0-9 ,.'()/-]+$/, "Reason contains unsupported characters.")
  ];
}

function nextId(items, key, prefix, firstNumber) {
  const highest = items.reduce((current, item) => Math.max(current, Number(String(item[key] || "").replace(/\D/g, "")) || 0), firstNumber - 1);
  return `${prefix}${highest + 1}`;
}

function todayString() {
  const today = new Date();
  return `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;
}

function isNewPatient(patId) {
  if (!patId) return false;
  const appts = getStorage(CMS_KEYS.APPOINTMENTS, []);
  const bills = getStorage(CMS_KEYS.BILLS, []);
  const existingAppts = appts.filter(a => String(a.patientId) === String(patId) && a.status !== "Cancelled");
  const existingBills = bills.filter(b => String(b.patientId) === String(patId));
  return existingAppts.length === 0 && existingBills.length === 0;
}

function bookAppointment(event) {
  event.preventDefault();
  const form = event.currentTarget;
  if (!validateForm(form, "apt-message", appointmentChecks())) return;
  const submit = document.getElementById("apt-submit");
  submit.disabled = true;
  try {
    const appointments = getStorage(CMS_KEYS.APPOINTMENTS, DEFAULT_APPOINTMENTS);
    const patient = state.patients.find(item => String(patientId(item)) === elements.patientSelect.value);
    if (!patient) throw new Error("Select a registered patient.");
    const time = document.getElementById("apt-time").value;
    if (appointments.some(item => String(item.patientId) === String(patientId(patient)) && sameLocalDay(item.date) && item.time === time && item.status !== "Cancelled")) {
      throw new Error("This patient already has an appointment at that time today.");
    }
    const appointment = {
      appointmentId: nextId(appointments, "appointmentId", "APT-", 2001),
      patientId: patientId(patient),
      patientName: patientName(patient),
      doctorName: document.getElementById("apt-doctor").value.trim(),
      tokenNumber: appointments.reduce((highest, item) => Math.max(highest, Number(item.tokenNumber) || 0), 0) + 1,
      time,
      date: todayString(),
      status: document.getElementById("apt-status-init").value,
      reason: document.getElementById("apt-reason").value.trim()
    };
    appointments.push(appointment);
    if (!setStorage(CMS_KEYS.APPOINTMENTS, appointments)) throw new Error("Appointment could not be saved in this browser.");

    const newPat = isNewPatient(patientId(patient));
    const regFee = newPat ? 200 : 0;
    const docFee = 500;
    const totalAmount = docFee + regFee;
    const bill = {
      id: Date.now().toString(),
      billId: `BILL-${Date.now()}`,
      patientId: patientId(patient),
      patientName: appointment.patientName,
      appointmentId: appointment.appointmentId,
      date: todayString(),
      source: newPat ? "Registration & Consultation" : "Doctor Consultation",
      regFee: regFee,
      docFee: docFee,
      amount: totalAmount,
      status: "Pending"
    };
    const bills = JSON.parse(localStorage.getItem(CMS_KEYS.BILLS)) || [];
    bills.push(bill);
    localStorage.setItem(CMS_KEYS.BILLS, JSON.stringify(bills));
    showMessage("apt-message", `${appointment.appointmentId} booked - Token #${appointment.tokenNumber}.`, true);
    form.reset();
    document.getElementById("patient-preview").classList.remove("visible");
    loadDashboard();
    renderBillingTable();
    if (typeof showToast === "function") showToast("Appointment booked successfully.", "success");
  } catch (error) {
    showMessage("apt-message", error.message);
  } finally {
    submit.disabled = false;
  }
}

function updateAppointmentStatus(event) {
  event.preventDefault();
  const appointmentKey = elements.statusSelect.value;
  const status = document.getElementById("status-new").value;
  const button = document.getElementById("status-submit");
  if (!appointmentKey) {
    showMessage("status-message", "Select an appointment to update.");
    return;
  }
  if (![
    "Scheduled",
    "Waiting",
    "Consulting",
    "Completed",
    "Cancelled"
  ].includes(status)) {
    showMessage("status-message", "Select a valid appointment status.");
    return;
  }
  button.disabled = true;
  try {
    const appointments = getStorage(CMS_KEYS.APPOINTMENTS, DEFAULT_APPOINTMENTS);
    const appointment = appointments.find(item => String(appointmentId(item)) === appointmentKey);
    if (!appointment) throw new Error("Appointment not found.");
    appointment.status = status;
    if (!setStorage(CMS_KEYS.APPOINTMENTS, appointments)) throw new Error("Status could not be saved in this browser.");
    showMessage("status-message", `Status updated to ${status}.`, true);
    loadDashboard();
    if (typeof showToast === "function") showToast("Appointment status updated.", "success");
  } catch (error) {
    showMessage("status-message", error.message);
  } finally {
    button.disabled = false;
  }
}

function bindDashboardEvents() {
  document.getElementById("refresh-btn").addEventListener("click", async () => {
    await loadDashboard();
    if (typeof showToast === "function") showToast("Data refreshed.", "success");
  });
  if (elements.patientSearch) {
    elements.patientSearch.addEventListener("input", renderPatients);
    elements.patientSearch.addEventListener("keydown", event => {
      if (event.key === "Enter") {
        event.preventDefault();
        renderPatients();
      }
    });
  }
  const searchFilter = document.getElementById("pat-search-filter");
  if (searchFilter) {
    searchFilter.addEventListener("change", renderPatients);
  }
  const searchBtn = document.getElementById("pat-search-btn");
  if (searchBtn) {
    searchBtn.addEventListener("click", renderPatients);
  }
  elements.appointmentSearch.addEventListener("input", renderAppointments);
  elements.patientForm.addEventListener("submit", registerPatient);
  elements.appointmentForm.addEventListener("submit", bookAppointment);
  elements.statusForm.addEventListener("submit", updateAppointmentStatus);
  elements.patientSelect.addEventListener("change", () => {
    updatePatientPreview();
    renderPatients();
  });
  elements.patientBody.addEventListener("click", event => {
    const button = event.target.closest("[data-book-patient]");
    if (!button) return;
    const selectedId = button.dataset.bookPatient;
    elements.patientSelect.value = selectedId;
    updatePatientPreview();
    renderPatients();
    elements.appointmentForm.scrollIntoView({ behavior: "smooth", block: "start" });
  });
  elements.appointmentBody.addEventListener("click", event => {
    const editButton = event.target.closest("[data-edit-appointment]");
    const statusButton = event.target.closest("[data-set-status]");
    if (editButton) {
      elements.statusSelect.value = editButton.dataset.editAppointment;
      document.getElementById("status-new").value = editButton.dataset.currentStatus;
      elements.statusForm.scrollIntoView({ behavior: "smooth", block: "nearest" });
    }
    if (statusButton) {
      elements.statusSelect.value = statusButton.dataset.setStatus;
      document.getElementById("status-new").value = statusButton.dataset.status;
      elements.statusForm.requestSubmit();
    }
  });
  const billingNavBtn = document.querySelector('[data-section="billing"]');
  if (billingNavBtn) {
    billingNavBtn.addEventListener("click", () => switchSection("billing"));
  }
}

function switchSection(sectionId) {
  document.querySelectorAll(".sidebar-nav .nav-item").forEach(button => {
    button.classList.toggle("active", button.dataset.section === sectionId);
  });
  if (sectionId === "billing") {
    const billingSection = document.getElementById("sectionBilling");
    if (billingSection) {
      billingSection.scrollIntoView({ behavior: "smooth" });
      renderBillingTable();
    }
  } else if (sectionId === "dashboard") {
    document.getElementById("page-title")?.scrollIntoView({ behavior: "smooth" });
  } else if (sectionId === "register") {
    document.getElementById("reg-title")?.scrollIntoView({ behavior: "smooth" });
  } else if (sectionId === "queue") {
    document.getElementById("queue-title")?.scrollIntoView({ behavior: "smooth" });
  }
}

function renderBillingTable() {
  const billingBody = document.getElementById("billing-body");
  if (!billingBody) return;
  const bills = getStorage(CMS_KEYS.BILLS, []);
  if (!bills || bills.length === 0) {
    billingBody.innerHTML = '<tr class="empty-row"><td colspan="6">No billing records found.</td></tr>';
    return;
  }
  billingBody.innerHTML = bills.map((bill, index) => {
    const billId = bill.billId ?? bill.id ?? index;
    const status = bill.status || "Pending";
    const isPaid = String(status).toLowerCase() === "paid";
    const statusClass = isPaid ? "status-completed" : "status-scheduled";
    const amountVal = bill.amount != null ? (typeof bill.amount === "number" ? `₹${bill.amount.toFixed(2)}` : `₹${bill.amount}`) : "₹0.00";
    const dateVal = bill.date || bill.billDate || bill.createdAt || "--";
    const patientVal = bill.patientName || bill.patient || (bill.patientId ? patientLabel(bill.patientId) : "Unknown");
    const sourceVal = bill.source || bill.department || bill.service || "Consultation";
    const actionHtml = isPaid
      ? `<button class="row-action" type="button" onclick="previewTableBill('${escapeHtml(billId)}')">View Invoice</button>`
      : `<button class="row-action" type="button" onclick="previewTableBill('${escapeHtml(billId)}')">Preview Bill</button>`;
    return `<tr>
      <td>${escapeHtml(dateVal)}</td>
      <td><span class="strong">${escapeHtml(patientVal)}</span></td>
      <td>${escapeHtml(sourceVal)}</td>
      <td><span class="strong">${escapeHtml(amountVal)}</span></td>
      <td><span class="status ${statusClass}">${escapeHtml(status)}</span></td>
      <td>${actionHtml}</td>
    </tr>`;
  }).join("");
}

function markAsPaid(billId) {
  const bills = getStorage(CMS_KEYS.BILLS, []);
  const bill = bills.find((item, index) => String(item.billId ?? item.id ?? index) === String(billId));
  if (bill) {
    bill.status = "Paid";
    setStorage(CMS_KEYS.BILLS, bills);
    renderBillingTable();
    if (typeof showToast === "function") {
      showToast("Bill marked as paid.", "success");
    }
  }
}

/* ── Receptionist: Consolidated Final Billing (Pharmacy → Receptionist) ─── */

let currentFinalInvoice = {
  patientId: null,
  patientName: null,
  consultationId: null,
  doctorFee: 500,
  regFee: 0,
  pharmacyBill: null,
  grandTotal: 0,
  appointment: null
};

async function fetchPatientPendingBills() {
  const query = (document.getElementById("billingSearchPatient")?.value || "").trim();
  if (!query) {
    if (typeof showToast === "function") showToast("Please enter a Patient ID, Appointment ID, or Prescription ID.", "warning");
    else alert("Please enter a Patient ID, Appointment ID, or Prescription ID.");
    return;
  }

  let pharmacyBill = null;

  try {
    const token = localStorage.getItem("token") || localStorage.getItem("accessToken");
    const res = await fetch(`/api/receptionist/bills/pending/?search=${encodeURIComponent(query)}`, {
      headers: token ? { Authorization: `Bearer ${token}` } : {}
    });
    if (res.ok) {
      const data = await res.json();
      pharmacyBill = Array.isArray(data)
        ? data.find(b => b.status === "PENDING_RECEPTIONIST_PAYMENT")
        : null;
    }
  } catch (_) { }

  if (!pharmacyBill) {
    const stored = JSON.parse(localStorage.getItem("pending_receptionist_bills") || "[]");
    pharmacyBill = stored.find(b =>
      b.status === "PENDING_RECEPTIONIST_PAYMENT" &&
      (String(b.patientId).toLowerCase() === query.toLowerCase() ||
       String(b.consultationId).toLowerCase() === query.toLowerCase() ||
       String(b.prescriptionId).toLowerCase() === query.toLowerCase() ||
       String(b.id).toLowerCase() === query.toLowerCase())
    );
  }

  if (pharmacyBill) {
    renderFinalInvoice(pharmacyBill);
    return;
  }

  const patients = getStorage(CMS_KEYS.PATIENTS, DEFAULT_PATIENTS);
  const appointments = getStorage(CMS_KEYS.APPOINTMENTS, DEFAULT_APPOINTMENTS);
  const patient = patients.find(p =>
    String(patientId(p)).toLowerCase() === query.toLowerCase() ||
    String(p.name || "").toLowerCase() === query.toLowerCase() ||
    String(p.phone || "") === query
  );

  let appt = null;
  if (patient) {
    appt = appointments.find(a => String(a.patientId) === String(patientId(patient)) && sameLocalDay(a.date));
  } else {
    appt = appointments.find(a => String(a.appointmentId || "").toLowerCase() === query.toLowerCase());
  }

  const resolvedPatient = patient || (appt ? patients.find(p => String(patientId(p)) === String(appt.patientId)) : null);

  if (!resolvedPatient && !appt) {
    if (typeof showToast === "function") showToast("No patient or pending bill found for this ID.", "warning");
    else alert("No patient or pending bill found for this ID.");
    return;
  }

  renderFinalInvoice(null, resolvedPatient, appt);
}

function renderFinalInvoice(pharmacyBill, patientOverride, apptOverride) {
  const patId = pharmacyBill?.patientId || (patientOverride ? patientId(patientOverride) : apptOverride?.patientId);
  const pat = patientOverride || state.patients.find(p => String(patientId(p)) === String(patId));
  const patName = pharmacyBill?.patientName || (pat ? patientName(pat) : apptOverride?.patientName || "--");
  const consultId = pharmacyBill?.consultationId || pharmacyBill?.prescriptionId || (apptOverride ? apptOverride.appointmentId : "--");

  const newPatient = isNewPatient(patId);
  const regFee = newPatient ? 200 : 0;
  const docFee = 500;
  const pharmTotal = pharmacyBill ? Number(pharmacyBill.totalAmount || pharmacyBill.total || 0) : 0;
  const grandTotal = docFee + regFee + pharmTotal;

  currentFinalInvoice = {
    patientId: patId,
    patientName: patName,
    consultationId: consultId,
    doctorFee: docFee,
    regFee: regFee,
    pharmacyBill: pharmacyBill,
    grandTotal: grandTotal,
    appointment: apptOverride || null
  };

  const card = document.getElementById("finalInvoiceCard");
  if (!card) return;

  document.getElementById("finalPatientName").textContent = patName;
  document.getElementById("finalPatientId").textContent = patId || "--";
  document.getElementById("finalConsultationId").textContent = consultId || "--";

  const tbody = document.getElementById("finalBillBreakdownBody");
  tbody.innerHTML = "";

  const trDoc = document.createElement("tr");
  trDoc.innerHTML = `
    <td><strong>Doctor Consultation</strong></td>
    <td>OPD / General Checkup</td>
    <td>₹${docFee.toFixed(2)}</td>`;
  tbody.appendChild(trDoc);

  if (newPatient) {
    const trReg = document.createElement("tr");
    trReg.innerHTML = `
      <td><strong>Registration Fee</strong></td>
      <td>New Patient Registration</td>
      <td>₹${regFee.toFixed(2)}</td>`;
    tbody.appendChild(trReg);
  }

  const trPharm = document.createElement("tr");
  if (pharmacyBill) {
    const medSummary = Array.isArray(pharmacyBill.items)
      ? pharmacyBill.items.map(i => `${i.medicineName} ×${i.quantity}`).join(", ")
      : (pharmacyBill.medicine || "Medicines");
    trPharm.innerHTML = `
      <td><strong>Pharmacy / Medicines</strong></td>
      <td style="font-size:12px;color:#777b98">${escapeHtml(medSummary)}</td>
      <td>₹${pharmTotal.toFixed(2)}</td>`;
  } else {
    trPharm.innerHTML = `
      <td><strong>Pharmacy / Medicines</strong></td>
      <td style="font-size:12px;color:#777b98">None / Not Prescribed</td>
      <td>₹0.00</td>`;
  }
  tbody.appendChild(trPharm);

  document.getElementById("finalGrandTotal").textContent = `₹${grandTotal.toFixed(2)}`;
  card.style.display = "block";
  card.scrollIntoView({ behavior: "smooth", block: "nearest" });
}

/* ── Professional Bill Preview & Settlement Workflow ─── */

let currentPreviewBill = null;
let isProcessingPayment = false;

function openBillPreview(previewData) {
  if (!previewData) {
    if (typeof showToast === "function") showToast("No billing information available.", "warning");
    return;
  }
  if (!previewData.patientId && !previewData.patientName) {
    if (typeof showToast === "function") showToast("No patient selected.", "warning");
    else alert("No patient selected.");
    return;
  }
  if (previewData.grandTotal <= 0 || isNaN(previewData.grandTotal)) {
    if (typeof showToast === "function") showToast("Invalid billing amount. Total payable must be greater than zero.", "warning");
    else alert("Invalid billing amount. Total payable must be greater than zero.");
    return;
  }
  if (!previewData.items || previewData.items.length === 0) {
    if (typeof showToast === "function") showToast("No billing items available to preview.", "warning");
    else alert("No billing items available to preview.");
    return;
  }

  currentPreviewBill = previewData;

  const modal = document.getElementById("billPreviewModal");
  if (!modal) return;

  document.getElementById("invModalId").textContent = previewData.invoiceId || `INV-${Date.now().toString().slice(-6)}`;
  document.getElementById("invModalDate").textContent = previewData.date || todayString();

  const isPaid = String(previewData.paymentStatus || "").toLowerCase() === "paid";
  const statusBadge = document.getElementById("invModalStatusBadge");
  statusBadge.className = isPaid ? "status status-completed" : "status status-scheduled";
  statusBadge.textContent = isPaid ? "Paid" : "Pending";

  document.getElementById("invPatId").textContent = previewData.patientId || "--";
  document.getElementById("invPatName").textContent = previewData.patientName || "--";
  const patientAgeVal = previewData.patientAge != null && previewData.patientAge !== "" ? `${previewData.patientAge} yrs` : "";
  document.getElementById("invPatAgeGender").textContent = [patientAgeVal, previewData.patientGender].filter(Boolean).join(" / ") || "--";
  document.getElementById("invPatPhone").textContent = previewData.patientPhone || "--";

  document.getElementById("invAptId").textContent = previewData.appointmentId || "--";
  document.getElementById("invAptDoctor").textContent = previewData.doctorName || "Dr. Prateek Pradeep";
  document.getElementById("invAptDept").textContent = previewData.department || "General Medicine (OPD)";
  document.getElementById("invAptDate").textContent = previewData.appointmentDate || previewData.date || todayString();

  const tokenEl = document.getElementById("invAptToken");
  if (previewData.tokenNumber != null && previewData.tokenNumber !== "" && previewData.tokenNumber !== "--") {
    tokenEl.textContent = `#${previewData.tokenNumber}`;
    tokenEl.style.display = "inline-block";
  } else {
    tokenEl.textContent = isPaid ? "--" : "Generated upon payment";
  }

  const tbody = document.getElementById("invModalItemsBody");
  tbody.innerHTML = previewData.items.map((item, idx) => `
    <tr>
      <td>${idx + 1}</td>
      <td>
        <strong style="color:var(--text-main);display:block;">${escapeHtml(item.description)}</strong>
        ${item.details ? `<span class="subtext">${escapeHtml(item.details)}</span>` : ""}
      </td>
      <td>${escapeHtml(item.department || "Clinic")}</td>
      <td style="text-align:right;font-weight:600;">₹${Number(item.amount || 0).toFixed(2)}</td>
    </tr>
  `).join("");

  const subtotal = previewData.subtotal != null ? previewData.subtotal : previewData.grandTotal;
  const grandTotal = previewData.grandTotal;
  const amountPaid = isPaid ? grandTotal : (previewData.amountPaid || 0);
  const balance = Math.max(0, grandTotal - amountPaid);

  document.getElementById("invSubtotal").textContent = `₹${subtotal.toFixed(2)}`;
  document.getElementById("invGrandTotal").textContent = `₹${grandTotal.toFixed(2)}`;
  document.getElementById("invAmountPaid").textContent = `₹${amountPaid.toFixed(2)}`;

  const balanceEl = document.getElementById("invBalanceDue");
  balanceEl.textContent = `₹${balance.toFixed(2)}`;
  if (balance === 0) {
    balanceEl.className = "invoice-total-row balance settled";
  } else {
    balanceEl.className = "invoice-total-row balance";
  }

  const modeContainer = document.getElementById("invPaymentModeContainer");
  const confirmBtn = document.getElementById("btnConfirmBillPayment");
  const noteEl = document.getElementById("invPaymentNote");

  if (isPaid) {
    modeContainer.innerHTML = `<span class="strong" style="font-size:0.95rem;color:var(--text-main);">${escapeHtml(previewData.paymentMode || "CASH")}</span>`;
    confirmBtn.style.display = "none";
    noteEl.textContent = "Invoice has been settled and closed.";
  } else {
    modeContainer.innerHTML = `
      <select id="invPaymentModeSelect" class="form-control" style="font-weight:600;">
        <option value="CASH"${(previewData.paymentMode || "CASH") === "CASH" ? " selected" : ""}>Cash</option>
        <option value="CARD"${previewData.paymentMode === "CARD" ? " selected" : ""}>Debit / Credit Card</option>
        <option value="UPI"${previewData.paymentMode === "UPI" ? " selected" : ""}>UPI / QR</option>
      </select>
    `;
    confirmBtn.style.display = "inline-flex";
    confirmBtn.disabled = false;
    confirmBtn.innerHTML = '<svg class="icon" viewBox="0 0 24 24"><polyline points="20 6 9 17 4 12"/></svg> Confirm Payment';
    noteEl.textContent = "Review bill charges before confirming payment.";
  }

  modal.classList.add("show");
  modal.setAttribute("aria-hidden", "false");
}

function closeBillPreview() {
  const modal = document.getElementById("billPreviewModal");
  if (modal) {
    modal.classList.remove("show");
    modal.setAttribute("aria-hidden", "true");
  }
  currentPreviewBill = null;
  isProcessingPayment = false;
}

function previewCurrentFinalInvoice() {
  if (!currentFinalInvoice.patientId && !currentFinalInvoice.pharmacyBill) {
    const query = (document.getElementById("billingSearchPatient")?.value || "").trim();
    if (!query) {
      if (typeof showToast === "function") showToast("No patient selected. Please find a pending bill first.", "warning");
      else alert("No patient selected. Please find a pending bill first.");
      return;
    }
    fetchPatientPendingBills();
    return;
  }

  const patient = state.patients.find(p => String(patientId(p)) === String(currentFinalInvoice.patientId));
  const newPatient = isNewPatient(currentFinalInvoice.patientId);
  const selectedMode = document.getElementById("paymentMode")?.value || "CASH";

  const items = [
    { description: "Doctor Consultation Fee", department: "OPD", details: "OPD General Consultation", amount: currentFinalInvoice.doctorFee }
  ];

  if (newPatient) {
    items.push({
      description: "Registration Fee",
      department: "Front Desk",
      details: "New Patient Registration",
      amount: currentFinalInvoice.regFee || 200
    });
  }

  if (currentFinalInvoice.pharmacyBill) {
    const pharm = currentFinalInvoice.pharmacyBill;
    const medSummary = Array.isArray(pharm.items)
      ? pharm.items.map(i => `${i.medicineName} ×${i.quantity}`).join(", ")
      : (pharm.medicine || "Medicines");
    items.push({
      description: "Pharmacy / Medicine Bill",
      department: "Pharmacy",
      details: medSummary,
      amount: Number(pharm.totalAmount || pharm.total || 0)
    });
  }

  const grandTotal = items.reduce((sum, item) => sum + item.amount, 0);

  const previewData = {
    invoiceId: `INV-${Date.now().toString().slice(-6)}`,
    date: todayString(),
    patientId: currentFinalInvoice.patientId,
    patientName: currentFinalInvoice.patientName || (patient ? patientName(patient) : "--"),
    patientAge: getPatientAge(patient),
    patientGender: patient?.gender,
    patientPhone: patient?.phone,
    appointmentId: currentFinalInvoice.consultationId || "--",
    doctorName: "Dr. Prateek Pradeep",
    department: "General Medicine (OPD)",
    appointmentDate: todayString(),
    tokenNumber: currentFinalInvoice.appointment ? currentFinalInvoice.appointment.tokenNumber : null,
    items: items,
    subtotal: grandTotal,
    grandTotal: grandTotal,
    amountPaid: 0,
    balance: grandTotal,
    paymentMode: selectedMode,
    paymentStatus: "Pending",
    sourceType: "FINAL_INVOICE"
  };

  openBillPreview(previewData);
}

function previewAppointmentBill() {
  if (!validateForm(elements.appointmentForm, "apt-message", appointmentChecks())) return;
  const patId = elements.patientSelect.value;
  const patient = state.patients.find(item => String(patientId(item)) === patId);
  if (!patient) {
    showMessage("apt-message", "Select a registered patient.");
    return;
  }

  const doctor = document.getElementById("apt-doctor").value.trim();
  const time = document.getElementById("apt-time").value;
  const newPatient = isNewPatient(patId);
  const docFee = 500;
  const regFee = newPatient ? 200 : 0;

  const items = [
    { description: "Doctor Consultation Fee", department: "OPD", details: `Doctor: ${doctor} · Time: ${time}`, amount: docFee }
  ];

  if (newPatient) {
    items.push({
      description: "Registration Fee",
      department: "Front Desk",
      details: "New Patient Registration",
      amount: regFee
    });
  }

  const total = docFee + regFee;

  const previewData = {
    invoiceId: `INV-${Date.now().toString().slice(-6)}`,
    date: todayString(),
    patientId: patId,
    patientName: patientName(patient),
    patientAge: getPatientAge(patient),
    patientGender: patient.gender,
    patientPhone: patient.phone,
    appointmentId: "Pending Generation",
    doctorName: doctor,
    department: "General Medicine (OPD)",
    appointmentDate: todayString(),
    tokenNumber: null,
    items: items,
    subtotal: total,
    grandTotal: total,
    amountPaid: 0,
    balance: total,
    paymentMode: "CASH",
    paymentStatus: "Pending",
    sourceType: "APPOINTMENT_FORM"
  };

  openBillPreview(previewData);
}

function previewTableBill(billId) {
  const bills = getStorage(CMS_KEYS.BILLS, []);
  const bill = bills.find((item, index) => String(item.billId ?? item.id ?? index) === String(billId));
  if (!bill) {
    if (typeof showToast === "function") showToast("Bill not found.", "warning");
    return;
  }

  const patient = state.patients.find(p => String(patientId(p)) === String(bill.patientId) || patientName(p) === bill.patientName);
  const appointments = getStorage(CMS_KEYS.APPOINTMENTS, DEFAULT_APPOINTMENTS);
  const appt = appointments.find(a => (bill.appointmentId && String(a.appointmentId) === String(bill.appointmentId)) || (patient && String(a.patientId) === String(patientId(patient))));

  const isPaid = String(bill.status || "").toLowerCase() === "paid";
  const items = [];

  if (Array.isArray(bill.items) && bill.items.length) {
    bill.items.forEach(i => {
      items.push({
        description: i.medicineName || i.name || i.description || "Service Charge",
        department: bill.source || "Pharmacy",
        details: i.dosage ? `${i.dosage} × ${i.quantity || 1}` : (i.details || ""),
        amount: Number(i.totalPrice || i.amount || 0)
      });
    });
  } else if (bill.docFee || bill.regFee) {
    if (bill.docFee) items.push({ description: "Doctor Consultation Fee", department: "OPD", details: "OPD Checkup", amount: Number(bill.docFee) });
    if (bill.regFee) items.push({ description: "Registration Fee", department: "Front Desk", details: "New Patient Registration", amount: Number(bill.regFee) });
  } else {
    items.push({
      description: bill.source || "Consultation Charge",
      department: bill.department || "OPD",
      details: bill.details || (bill.medicinesSummary ? bill.medicinesSummary : "Service Charge"),
      amount: Number(bill.amount || 0)
    });
  }

  const total = Number(bill.amount || items.reduce((s, i) => s + i.amount, 0) || 0);

  const previewData = {
    invoiceId: bill.billId || bill.id || `INV-${Date.now().toString().slice(-6)}`,
    date: bill.date || todayString(),
    patientId: bill.patientId || (patient ? patientId(patient) : "--"),
    patientName: bill.patientName || (patient ? patientName(patient) : "Patient"),
    patientAge: getPatientAge(patient),
    patientGender: patient?.gender,
    patientPhone: patient?.phone,
    appointmentId: bill.appointmentId || appt?.appointmentId || "--",
    doctorName: bill.doctorName || appt?.doctorName || "Dr. Prateek Pradeep",
    department: "General Medicine (OPD)",
    appointmentDate: appt?.date || bill.date || todayString(),
    tokenNumber: appt?.tokenNumber || null,
    items: items,
    subtotal: total,
    grandTotal: total,
    amountPaid: isPaid ? total : 0,
    balance: isPaid ? 0 : total,
    paymentMode: bill.paymentMode || "CASH",
    paymentStatus: bill.status || "Pending",
    sourceType: "TABLE_BILL",
    sourceRef: bill
  };

  openBillPreview(previewData);
}

async function confirmBillPayment() {
  if (isProcessingPayment) return;
  if (!currentPreviewBill) {
    if (typeof showToast === "function") showToast("No active bill preview found.", "warning");
    return;
  }
  if (String(currentPreviewBill.paymentStatus).toLowerCase() === "paid") {
    if (typeof showToast === "function") showToast("This bill has already been paid.", "warning");
    return;
  }

  const modeSelect = document.getElementById("invPaymentModeSelect");
  const selectedMode = modeSelect ? modeSelect.value : (currentPreviewBill.paymentMode || "CASH");
  if (!selectedMode) {
    if (typeof showToast === "function") showToast("Please select a payment method.", "warning");
    return;
  }

  isProcessingPayment = true;
  const confirmBtn = document.getElementById("btnConfirmBillPayment");
  if (confirmBtn) {
    confirmBtn.disabled = true;
    confirmBtn.textContent = "Processing...";
  }

  try {
    if (currentPreviewBill.sourceType === "APPOINTMENT_FORM") {
      const appointments = getStorage(CMS_KEYS.APPOINTMENTS, DEFAULT_APPOINTMENTS);
      const patient = state.patients.find(item => String(patientId(item)) === elements.patientSelect.value);
      if (!patient) throw new Error("Select a registered patient.");
      const time = document.getElementById("apt-time").value;
      const appointment = {
        appointmentId: nextId(appointments, "appointmentId", "APT-", 2001),
        patientId: patientId(patient),
        patientName: patientName(patient),
        doctorName: document.getElementById("apt-doctor").value.trim(),
        tokenNumber: appointments.reduce((highest, item) => Math.max(highest, Number(item.tokenNumber) || 0), 0) + 1,
        time,
        date: todayString(),
        status: document.getElementById("apt-status-init").value,
        reason: document.getElementById("apt-reason").value.trim()
      };
      appointments.push(appointment);
      setStorage(CMS_KEYS.APPOINTMENTS, appointments);

      const newPat = isNewPatient(patientId(patient));
      const regFee = newPat ? 200 : 0;
      const docFee = 500;
      const bill = {
        id: Date.now().toString(),
        billId: `BILL-${Date.now()}`,
        patientId: patientId(patient),
        patientName: appointment.patientName,
        appointmentId: appointment.appointmentId,
        date: todayString(),
        source: newPat ? "Registration & Consultation" : "Doctor Consultation",
        regFee: regFee,
        docFee: docFee,
        amount: currentPreviewBill.grandTotal,
        status: "Paid",
        paymentMode: selectedMode,
        settledAt: new Date().toISOString()
      };
      const bills = getStorage(CMS_KEYS.BILLS, []);
      bills.push(bill);
      setStorage(CMS_KEYS.BILLS, bills);

      showMessage("apt-message", `${appointment.appointmentId} booked - Token #${appointment.tokenNumber}. Paid via ${selectedMode}.`, true);
      elements.appointmentForm.reset();
      document.getElementById("patient-preview").classList.remove("visible");

      currentPreviewBill.appointmentId = appointment.appointmentId;
      currentPreviewBill.tokenNumber = appointment.tokenNumber;
    } else if (currentPreviewBill.sourceType === "FINAL_INVOICE") {
      const billId = currentFinalInvoice.pharmacyBill ? currentFinalInvoice.pharmacyBill.id : `INV-${Date.now()}`;

      try {
        const token = localStorage.getItem("token") || localStorage.getItem("accessToken");
        await fetch(`/api/receptionist/bills/${billId}/settle/`, {
          method: "POST",
          headers: { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}) },
          body: JSON.stringify({ paymentMode: selectedMode, status: "PAID" })
        });
      } catch (_) { }

      const stored = JSON.parse(localStorage.getItem("pending_receptionist_bills") || "[]");
      const target = stored.find(b => b.id === billId);
      if (target) {
        target.status = "PAID";
        target.paymentMode = selectedMode;
        target.settledAt = new Date().toISOString();
        localStorage.setItem("pending_receptionist_bills", JSON.stringify(stored));
      }

      const cmsBills = getStorage(CMS_KEYS.BILLS, []);
      cmsBills.unshift({
        billId: `FINAL-${billId}`,
        patientId: currentFinalInvoice.patientId,
        patientName: currentFinalInvoice.patientName || (currentFinalInvoice.pharmacyBill ? currentFinalInvoice.pharmacyBill.patientName : "--"),
        amount: currentPreviewBill.grandTotal,
        status: "Paid",
        paymentMode: selectedMode,
        source: currentFinalInvoice.pharmacyBill ? "Pharmacy + Consultation" : "Doctor Consultation",
        date: new Date().toLocaleDateString("en-IN")
      });
      setStorage(CMS_KEYS.BILLS, cmsBills);

      const invoiceCard = document.getElementById("finalInvoiceCard");
      if (invoiceCard) invoiceCard.style.display = "none";
      const inp = document.getElementById("billingSearchPatient");
      if (inp) inp.value = "";
      currentFinalInvoice = { patientId: null, patientName: null, consultationId: null, doctorFee: 500, regFee: 0, pharmacyBill: null, grandTotal: 0, appointment: null };
    } else if (currentPreviewBill.sourceType === "TABLE_BILL") {
      const bills = getStorage(CMS_KEYS.BILLS, []);
      const target = bills.find((b, idx) => String(b.billId ?? b.id ?? idx) === String(currentPreviewBill.sourceRef?.billId ?? currentPreviewBill.sourceRef?.id));
      if (target) {
        target.status = "Paid";
        target.paymentMode = selectedMode;
        target.settledAt = new Date().toISOString();
        setStorage(CMS_KEYS.BILLS, bills);
      }
    }

    currentPreviewBill.paymentStatus = "Paid";
    currentPreviewBill.paymentMode = selectedMode;
    currentPreviewBill.amountPaid = currentPreviewBill.grandTotal;
    currentPreviewBill.balance = 0;

    loadDashboard();
    renderBillingTable();
    openBillPreview(currentPreviewBill);

    if (typeof showToast === "function") {
      showToast(`Payment of ₹${currentPreviewBill.grandTotal.toFixed(2)} confirmed via ${selectedMode}.`, "success");
    }
  } catch (error) {
    if (typeof showToast === "function") showToast(error.message, "danger");
    else alert(error.message);
  } finally {
    isProcessingPayment = false;
  }
}

async function processFinalPayment() {
  if (!currentFinalInvoice.pharmacyBill && !currentFinalInvoice.patientId) {
    if (typeof showToast === "function") showToast("No active invoice to settle.", "warning");
    else alert("No active invoice to settle.");
    return;
  }
  previewCurrentFinalInvoice();
}

window.switchSection = switchSection;
window.renderBillingTable = renderBillingTable;
window.markAsPaid = markAsPaid;
window.fetchPatientPendingBills = fetchPatientPendingBills;
window.processFinalPayment = processFinalPayment;
window.openBillPreview = openBillPreview;
window.closeBillPreview = closeBillPreview;
window.previewCurrentFinalInvoice = previewCurrentFinalInvoice;
window.previewAppointmentBill = previewAppointmentBill;
window.previewTableBill = previewTableBill;
window.confirmBillPayment = confirmBillPayment;

document.addEventListener("DOMContentLoaded", async () => {
  state.user = requireAuth(["Receptionist"], "../index.html");
  if (!state.user) return;
  document.getElementById("user-name").textContent = state.user.name || "Receptionist";
  document.getElementById("user-avatar").textContent = String(state.user.name || "Receptionist").split(/\s+/).map(part => part[0]).join("").slice(0, 2).toUpperCase();
  bindDashboardEvents();
  await loadDashboard();

  const modal = document.getElementById("billPreviewModal");
  if (modal) {
    modal.addEventListener("click", e => {
      if (e.target === modal) closeBillPreview();
    });
  }
  document.addEventListener("keydown", e => {
    if (e.key === "Escape" && modal && modal.classList.contains("show")) {
      closeBillPreview();
    }
  });
});
