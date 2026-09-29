const state = { user: null, patients: [], appointments: [] };
const elements = {
  patientBody: document.getElementById("pat-body"),
  appointmentBody: document.getElementById("apt-body"),
  patientSearch: document.getElementById("pat-search"),
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

function renderPatients() {
  const query = elements.patientSearch.value.trim().toLowerCase();
  const visible = state.patients.filter(patient => [patientName(patient), patientId(patient), patient.phone].join(" ").toLowerCase().includes(query));
  if (!visible.length) {
    elements.patientBody.innerHTML = `<tr class="empty-row"><td colspan="6">${state.patients.length ? "No patients match your search." : "No patients registered yet."}</td></tr>`;
  } else {
    elements.patientBody.innerHTML = visible.map(patient => `
      <tr>
        <td><span class="strong">${escapeHtml(patientId(patient))}</span></td>
        <td>${escapeHtml(patientName(patient))}</td>
        <td>${escapeHtml(patient.age ?? "--")} / ${escapeHtml(patient.gender ?? "--")}</td>
        <td>${escapeHtml(patient.bloodGroup ?? "--")}</td>
        <td>${escapeHtml(patient.phone ?? "--")}</td>
        <td><button class="row-action" type="button" data-book-patient="${escapeHtml(patientId(patient))}">Book apt</button></td>
      </tr>`).join("");
  }
  const selected = elements.patientSelect.value;
  elements.patientSelect.innerHTML = `<option value="">Select a patient</option>${state.patients.map(patient => `<option value="${escapeHtml(patientId(patient))}">${escapeHtml(patientName(patient))} (${escapeHtml(patientId(patient))})</option>`).join("")}`;
  elements.patientSelect.value = selected;
  if (elements.patientSelect.value !== selected) document.getElementById("patient-preview").classList.remove("visible");
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
  document.getElementById("prev-age-gender").textContent = `${patient.age ?? "--"} / ${patient.gender ?? "--"}`;
  document.getElementById("prev-blood").textContent = patient.bloodGroup ?? "--";
  document.getElementById("prev-phone").textContent = patient.phone ?? "--";
  document.getElementById("prev-id").textContent = patientId(patient);
  preview.classList.add("visible");
}

function renderAll() {
  document.getElementById("stat-patients").textContent = state.patients.length;
  renderPatients();
  renderAppointments();
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
  const age = document.getElementById("reg-age");
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
      const value = age.value.trim();
      age.value = value;
      return /^\d{1,3}$/.test(value) && Number(value) >= 0 && Number(value) <= 120 ? "" : "Age must be a whole number between 0 and 120.";
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
    const patient = {
      patientId: newPatientId,
      name: document.getElementById("reg-name").value.trim(),
      age: Number(document.getElementById("reg-age").value),
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
    showMessage("apt-message", `${appointment.appointmentId} booked - Token #${appointment.tokenNumber}.`, true);
    form.reset();
    document.getElementById("patient-preview").classList.remove("visible");
    loadDashboard();
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
  elements.patientSearch.addEventListener("input", renderPatients);
  elements.appointmentSearch.addEventListener("input", renderAppointments);
  elements.patientForm.addEventListener("submit", registerPatient);
  elements.appointmentForm.addEventListener("submit", bookAppointment);
  elements.statusForm.addEventListener("submit", updateAppointmentStatus);
  elements.patientSelect.addEventListener("change", updatePatientPreview);
  elements.patientBody.addEventListener("click", event => {
    const button = event.target.closest("[data-book-patient]");
    if (!button) return;
    elements.patientSelect.value = button.dataset.bookPatient;
    updatePatientPreview();
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
}

document.addEventListener("DOMContentLoaded", async () => {
  state.user = requireAuth(["Receptionist"], "../index.html");
  if (!state.user) return;
  document.getElementById("user-name").textContent = state.user.name || "Receptionist";
  document.getElementById("user-avatar").textContent = String(state.user.name || "Receptionist").split(/\s+/).map(part => part[0]).join("").slice(0, 2).toUpperCase();
  bindDashboardEvents();
  await loadDashboard();
});
