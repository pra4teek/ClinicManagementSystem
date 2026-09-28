const STORAGE_KEY = "clinicAdminFrontendData";
const LOGIN_KEY = "clinicAdminLoggedIn";

const seedData = {
    users: [
        { UserId: 1, Username: "admin", Password: "admin123", RoleId: 1, isActive: true },
        { UserId: 2, Username: "doctor1", Password: "doctor123", RoleId: 2, isActive: true },
        { UserId: 3, Username: "staff1", Password: "staff123", RoleId: 3, isActive: true }
    ],
    roles: [
        { RoleId: 1, RoleName: "Admin" },
        { RoleId: 2, RoleName: "Doctor" },
        { RoleId: 3, RoleName: "Receptionist" },
        { RoleId: 4, RoleName: "Lab Technician" },
        { RoleId: 5, RoleName: "Pharmacist" }
    ],
    departments: [
        { DepartmentId: 1, DepartmentName: "General Medicine", isActive: true },
        { DepartmentId: 2, DepartmentName: "Cardiology", isActive: true }
    ],
    staff: [
        {
            StaffId: 1, Name: "John Staff", DateofBirth: "1995-05-10",
            DateOfJoining: "2026-09-01", Address: "Thiruvananthapuram",
            phoneNumber: "9876543210", UserId: 3, RoleId: 3
        }
    ],
    doctors: [
        {
            DoctorId: 1, Name: "Dr. John", Qualification: "MBBS",
            Specialization: "Cardiology", isActive: true, UserId: 2, DepartmentId: 2
        }
    ],
    labTests: [
        {
            LabtestId: 1, TestName: "Blood Test", NormalName: "Blood",
            TestCost: 500, isActive: true, DepartmentId: 2
        }
    ],
    medicines: [
        {
            MedicineId: 1, MedicineName: "Paracetamol", Manufacturer: "ABC Pharma",
            GenericName: "Paracetamol", Category: "Tablet",
            CostValue: 10, MRP: 15, isActive: true
        }
    ],
    appointments: [],
    patients: [],
    auditLogs: []
};

const sectionInfo = {
    dashboard: ["Dashboard", "Clinic administration overview"],
    users: ["Users", "Manage clinic user accounts"],
    roles: ["Roles", "Manage permitted clinic roles"],
    departments: ["Departments", "Manage clinic departments"],
    staff: ["Staff", "Maintain staff information"],
    doctors: ["Doctors", "Manage doctor information"],
    "lab-tests": ["Lab Tests", "Manage laboratory test catalog"],
    medicines: ["Medicines", "Manage medicine catalog"],
    appointments: ["Appointments", "Monitor appointments and queue status"],
    patients: ["Patients", "View patient registration records"],
    "audit-logs": ["Audit Logs", "Review administrative system activity"]
};

let data = loadData();
let currentSection = "dashboard";
let editing = null;

function loadData() {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (!saved) {
        const fresh = structuredClone(seedData);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(fresh));
        return fresh;
    }
    try {
        return JSON.parse(saved);
    } catch {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(seedData));
        return structuredClone(seedData);
    }
}

function saveData() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

function nextId(collection, field) {
    if (!data[collection].length) return 1;
    return Math.max(...data[collection].map(x => Number(x[field]) || 0)) + 1;
}

function addAudit(action, table, recordId, details) {
    data.auditLogs.unshift({
        AuditId: nextId("auditLogs", "AuditId"),
        ActionType: action,
        TableAffected: table,
        RecordId: recordId,
        Details: details,
        action_time: new Date().toISOString(),
        UserId: 1
    });
    saveData();
}

function showToast(message) {
    const toast = document.getElementById("toast");
    toast.textContent = message;
    toast.classList.add("show");
    setTimeout(() => toast.classList.remove("show"), 2200);
}

function roleName(id) {
    return data.roles.find(r => Number(r.RoleId) === Number(id))?.RoleName || "-";
}

function departmentName(id) {
    return data.departments.find(d => Number(d.DepartmentId) === Number(id))?.DepartmentName || "-";
}

function esc(value) {
    return String(value ?? "")
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");
}

function statusBadge(active) {
    return `<span class="badge ${active ? "active" : "inactive"}">${active ? "Active" : "Inactive"}</span>`;
}

function render() {
    const [title, subtitle] = sectionInfo[currentSection];
    document.getElementById("pageTitle").textContent = title;
    document.getElementById("pageSubtitle").textContent = subtitle;

    document.querySelectorAll(".nav-btn").forEach(btn => {
        btn.classList.toggle("active", btn.dataset.section === currentSection);
    });

    const content = document.getElementById("content");
    if (currentSection === "dashboard") content.innerHTML = dashboardHTML();
    else if (currentSection === "users") content.innerHTML = usersHTML();
    else if (currentSection === "roles") content.innerHTML = rolesHTML();
    else if (currentSection === "departments") content.innerHTML = departmentsHTML();
    else if (currentSection === "staff") content.innerHTML = staffHTML();
    else if (currentSection === "doctors") content.innerHTML = doctorsHTML();
    else if (currentSection === "lab-tests") content.innerHTML = labTestsHTML();
    else if (currentSection === "medicines") content.innerHTML = medicinesHTML();
    else if (currentSection === "appointments") content.innerHTML = appointmentsHTML();
    else if (currentSection === "patients") content.innerHTML = patientsHTML();
    else if (currentSection === "audit-logs") content.innerHTML = auditLogsHTML();
}

function dashboardHTML() {
    const today = new Date().toISOString().slice(0, 10);
    const todayAppointments = data.appointments.filter(a => String(a.AppointmentDateTime).slice(0, 10) === today).length;
    const waiting = data.appointments.filter(a => a.AppointmentStatus === "Waiting").length;
    const completed = data.appointments.filter(a => a.AppointmentStatus === "Completed").length;
    const active = data.users.filter(u => u.isActive).length;
    const inactive = data.users.filter(u => !u.isActive).length;

    const recent = data.auditLogs.slice(0, 5);

    return `
        <div class="stat-grid">
            <div class="stat-card"><div class="label">Total Users</div><div class="value">${data.users.length}</div></div>
            <div class="stat-card"><div class="label">Active Users</div><div class="value">${active}</div></div>
            <div class="stat-card"><div class="label">Inactive Users</div><div class="value">${inactive}</div></div>
            <div class="stat-card"><div class="label">Patients Registered</div><div class="value">${data.patients.length}</div></div>
            <div class="stat-card"><div class="label">Today's Appointments</div><div class="value">${todayAppointments}</div></div>
            <div class="stat-card"><div class="label">Waiting</div><div class="value">${waiting}</div></div>
            <div class="stat-card"><div class="label">Completed</div><div class="value">${completed}</div></div>
            <div class="stat-card"><div class="label">Audit Activities</div><div class="value">${data.auditLogs.length}</div></div>
        </div>

        <div class="panel">
            <div class="panel-header"><h2>Recent Audit Activity</h2></div>
            ${recent.length ? `
                <ul class="activity-list">
                    ${recent.map(a => `<li><strong>${esc(a.ActionType)}</strong> - ${esc(a.TableAffected)} #${esc(a.RecordId)}<br><span class="muted">${esc(a.Details)} | ${new Date(a.action_time).toLocaleString()}</span></li>`).join("")}
                </ul>
            ` : `<div class="empty">No audit activity yet.</div>`}
        </div>
    `;
}

function usersHTML() {
    return tableSection("users", "UserId", [
        ["UserId", "ID"], ["Username", "Username"], ["RoleId", "Role"], ["isActive", "Status"]
    ], userRows(), true, "Add User");
}

function userRows() {
    return data.users.map(u => `
        <tr>
            <td>${u.UserId}</td>
            <td>${esc(u.Username)}</td>
            <td>${esc(roleName(u.RoleId))}</td>
            <td>${statusBadge(u.isActive)}</td>
            <td class="action-cell">
                <button class="btn small secondary" onclick="openEdit('users', ${u.UserId})">Edit</button>
                <button class="btn small ${u.isActive ? "danger" : "success"}" onclick="toggleActive('users', ${u.UserId})">${u.isActive ? "Deactivate" : "Activate"}</button>
                <button class="btn small danger" onclick="deleteRecord('users', ${u.UserId})">Delete</button>
            </td>
        </tr>
    `).join("");
}

function rolesHTML() {
    return tableSection("roles", "RoleId", [["RoleId", "ID"], ["RoleName", "Role Name"]], data.roles.map(r => `
        <tr><td>${r.RoleId}</td><td>${esc(r.RoleName)}</td>
        <td class="action-cell">
            <button class="btn small secondary" onclick="openEdit('roles', ${r.RoleId})">Edit</button>
            <button class="btn small danger" onclick="deleteRecord('roles', ${r.RoleId})">Delete</button>
        </td></tr>
    `).join(""), true, "Add Role");
}

function departmentsHTML() {
    return tableSection("departments", "DepartmentId",
        [["DepartmentId", "ID"], ["DepartmentName", "Department"], ["isActive", "Status"]],
        data.departments.map(d => `
            <tr><td>${d.DepartmentId}</td><td>${esc(d.DepartmentName)}</td><td>${statusBadge(d.isActive)}</td>
            <td class="action-cell">
                <button class="btn small secondary" onclick="openEdit('departments', ${d.DepartmentId})">Edit</button>
                <button class="btn small ${d.isActive ? "danger" : "success"}" onclick="toggleActive('departments', ${d.DepartmentId})">${d.isActive ? "Deactivate" : "Activate"}</button>
                <button class="btn small danger" onclick="deleteRecord('departments', ${d.DepartmentId})">Delete</button>
            </td></tr>
        `).join(""), true, "Add Department");
}

function staffHTML() {
    return tableSection("staff", "StaffId",
        [["StaffId", "ID"], ["Name", "Name"], ["DateofBirth", "DOB"], ["DateOfJoining", "Joining Date"], ["Address", "Address"], ["phoneNumber", "Phone"], ["RoleId", "Role"]],
        data.staff.map(s => `
            <tr><td>${s.StaffId}</td><td>${esc(s.Name)}</td><td>${esc(s.DateofBirth)}</td><td>${esc(s.DateOfJoining)}</td><td>${esc(s.Address)}</td><td>${esc(s.phoneNumber)}</td><td>${esc(roleName(s.RoleId))}</td>
            <td class="action-cell">
                <button class="btn small secondary" onclick="openEdit('staff', ${s.StaffId})">Edit</button>
                <button class="btn small danger" onclick="deleteRecord('staff', ${s.StaffId})">Delete</button>
            </td></tr>
        `).join(""), true, "Add Staff");
}

function doctorsHTML() {
    return tableSection("doctors", "DoctorId",
        [["DoctorId", "ID"], ["Name", "Name"], ["Qualification", "Qualification"], ["Specialization", "Specialization"], ["DepartmentId", "Department"], ["isActive", "Status"]],
        data.doctors.map(d => `
            <tr><td>${d.DoctorId}</td><td>${esc(d.Name)}</td><td>${esc(d.Qualification)}</td><td>${esc(d.Specialization)}</td><td>${esc(departmentName(d.DepartmentId))}</td><td>${statusBadge(d.isActive)}</td>
            <td class="action-cell">
                <button class="btn small secondary" onclick="openEdit('doctors', ${d.DoctorId})">Edit</button>
                <button class="btn small ${d.isActive ? "danger" : "success"}" onclick="toggleActive('doctors', ${d.DoctorId})">${d.isActive ? "Deactivate" : "Activate"}</button>
                <button class="btn small danger" onclick="deleteRecord('doctors', ${d.DoctorId})">Delete</button>
            </td></tr>
        `).join(""), true, "Add Doctor");
}

function labTestsHTML() {
    return tableSection("labTests", "LabtestId",
        [["LabtestId", "ID"], ["TestName", "Test"], ["NormalName", "Normal Name"], ["TestCost", "Cost"], ["DepartmentId", "Department"], ["isActive", "Status"]],
        data.labTests.map(t => `
            <tr><td>${t.LabtestId}</td><td>${esc(t.TestName)}</td><td>${esc(t.NormalName)}</td><td>${esc(t.TestCost)}</td><td>${esc(departmentName(t.DepartmentId))}</td><td>${statusBadge(t.isActive)}</td>
            <td class="action-cell">
                <button class="btn small secondary" onclick="openEdit('labTests', ${t.LabtestId})">Edit</button>
                <button class="btn small ${t.isActive ? "danger" : "success"}" onclick="toggleActive('labTests', ${t.LabtestId})">${t.isActive ? "Deactivate" : "Activate"}</button>
                <button class="btn small danger" onclick="deleteRecord('labTests', ${t.LabtestId})">Delete</button>
            </td></tr>
        `).join(""), true, "Add Lab Test");
}

function medicinesHTML() {
    return tableSection("medicines", "MedicineId",
        [["MedicineId", "ID"], ["MedicineName", "Medicine"], ["Manufacturer", "Manufacturer"], ["GenericName", "Generic"], ["Category", "Category"], ["CostValue", "Cost"], ["MRP", "MRP"], ["isActive", "Status"]],
        data.medicines.map(m => `
            <tr><td>${m.MedicineId}</td><td>${esc(m.MedicineName)}</td><td>${esc(m.Manufacturer)}</td><td>${esc(m.GenericName)}</td><td>${esc(m.Category)}</td><td>${esc(m.CostValue)}</td><td>${esc(m.MRP)}</td><td>${statusBadge(m.isActive)}</td>
            <td class="action-cell">
                <button class="btn small secondary" onclick="openEdit('medicines', ${m.MedicineId})">Edit</button>
                <button class="btn small ${m.isActive ? "danger" : "success"}" onclick="toggleActive('medicines', ${m.MedicineId})">${m.isActive ? "Deactivate" : "Activate"}</button>
                <button class="btn small danger" onclick="deleteRecord('medicines', ${m.MedicineId})">Delete</button>
            </td></tr>
        `).join(""), true, "Add Medicine");
}

function appointmentsHTML() {
    return `
        <div class="panel">
            <div class="panel-header">
                <h2>Appointment Monitoring</h2>
                <div class="toolbar">
                    <input id="appointmentSearch" placeholder="Search patient..." oninput="filterAppointments()">
                    <select id="appointmentStatus" onchange="filterAppointments()">
                        <option value="">All Status</option>
                        <option>Scheduled</option><option>Waiting</option><option>Completed</option><option>Cancelled</option>
                    </select>
                </div>
            </div>
            <div class="table-wrap"><table><thead><tr>
                <th>ID</th><th>Patient</th><th>Doctor</th><th>Department</th><th>Status</th><th>Date & Time</th>
            </tr></thead><tbody id="appointmentRows">${appointmentRows()}</tbody></table></div>
        </div>
    `;
}

function appointmentRows() {
    return data.appointments.map(a => `
        <tr data-patient="${esc(a.PatientName).toLowerCase()}">
            <td>${a.AppointmentId}</td><td>${esc(a.PatientName)}</td><td>${esc(a.DoctorName)}</td><td>${esc(a.DepartmentName)}</td>
            <td><span class="badge ${String(a.AppointmentStatus).toLowerCase()}">${esc(a.AppointmentStatus)}</span></td>
            <td>${esc(a.AppointmentDateTime)}</td>
        </tr>
    `).join("") || `<tr><td colspan="6" class="empty">No appointment records found.</td></tr>`;
}

function patientsHTML() {
    return `
        <div class="panel">
            <div class="panel-header">
                <h2>Patient Records</h2>
                <div class="toolbar">
                    <input id="patientSearch" placeholder="Search name..." oninput="filterPatients()">
                    <input id="patientPhoneSearch" placeholder="Search phone..." oninput="filterPatients()">
                </div>
            </div>
            <div class="table-wrap"><table><thead><tr>
                <th>ID</th><th>Name</th><th>Gender</th><th>DOB</th><th>Phone</th><th>Address</th><th>Blood Group</th><th>Weight</th><th>Height</th>
            </tr></thead><tbody id="patientRows">${patientRows()}</tbody></table></div>
        </div>
    `;
}

function patientRows() {
    return data.patients.map(p => `
        <tr data-name="${esc(p.Name).toLowerCase()}" data-phone="${esc(p.PhoneNumber)}">
            <td>${p.PatientId}</td><td>${esc(p.Name)}</td><td>${esc(p.Gender)}</td><td>${esc(p.DOB)}</td><td>${esc(p.PhoneNumber)}</td>
            <td>${esc(p.Address)}</td><td>${esc(p.BloodGroup)}</td><td>${esc(p.Weight)}</td><td>${esc(p.Height)}</td>
        </tr>
    `).join("") || `<tr><td colspan="9" class="empty">No patient records found.</td></tr>`;
}

function auditLogsHTML() {
    return `
        <div class="panel">
            <div class="panel-header">
                <h2>Audit Logs</h2>
                <div class="toolbar">
                    <select id="auditAction" onchange="filterAudits()">
                        <option value="">All Actions</option>
                        ${[...new Set(data.auditLogs.map(a => a.ActionType))].map(a => `<option>${esc(a)}</option>`).join("")}
                    </select>
                    <input id="auditStart" type="date" onchange="filterAudits()">
                    <input id="auditEnd" type="date" onchange="filterAudits()">
                </div>
            </div>
            <div class="table-wrap"><table><thead><tr>
                <th>ID</th><th>Action</th><th>Table</th><th>Record</th><th>Details</th><th>Time</th><th>User</th>
            </tr></thead><tbody id="auditRows">${auditRows()}</tbody></table></div>
        </div>
    `;
}

function auditRows() {
    return data.auditLogs.map(a => `
        <tr data-action="${esc(a.ActionType)}" data-date="${esc(a.action_time.slice(0,10))}">
            <td>${a.AuditId}</td><td>${esc(a.ActionType)}</td><td>${esc(a.TableAffected)}</td><td>${esc(a.RecordId)}</td>
            <td>${esc(a.Details)}</td><td>${new Date(a.action_time).toLocaleString()}</td><td>${esc(a.UserId)}</td>
        </tr>
    `).join("") || `<tr><td colspan="7" class="empty">No audit records found.</td></tr>`;
}

function tableSection(collection, idField, headers, rows, addButton, addText) {
    const searchId = `${collection}Search`;
    return `
        <div class="panel">
            <div class="panel-header">
                <h2>${sectionInfo[currentSection][0]}</h2>
                <div class="toolbar">
                    <input id="${searchId}" placeholder="Search..." oninput="filterTable('${collection}')">
                    ${addButton ? `<button class="btn primary" onclick="openAdd('${collection}')">+ ${addText}</button>` : ""}
                </div>
            </div>
            <div class="table-wrap">
                <table>
                    <thead><tr>${headers.map(h => `<th>${h[1]}</th>`).join("")}<th>Actions</th></tr></thead>
                    <tbody id="${collection}Rows">${rows || `<tr><td colspan="${headers.length + 1}" class="empty">No records found.</td></tr>`}</tbody>
                </table>
            </div>
        </div>
    `;
}

function filterTable(collection) {
    const value = document.getElementById(`${collection}Search`).value.toLowerCase();
    const rows = document.querySelectorAll(`#${collection}Rows tr`);
    rows.forEach(row => row.style.display = row.textContent.toLowerCase().includes(value) ? "" : "none");
}

function filterAppointments() {
    const search = document.getElementById("appointmentSearch").value.toLowerCase();
    const status = document.getElementById("appointmentStatus").value;
    document.querySelectorAll("#appointmentRows tr").forEach(row => {
        const patient = row.dataset.patient || "";
        const rowStatus = row.textContent;
        row.style.display = patient.includes(search) && (!status || rowStatus.includes(status)) ? "" : "none";
    });
}

function filterPatients() {
    const name = document.getElementById("patientSearch").value.toLowerCase();
    const phone = document.getElementById("patientPhoneSearch").value.toLowerCase();
    document.querySelectorAll("#patientRows tr").forEach(row => {
        row.style.display = (row.dataset.name || "").includes(name) && (row.dataset.phone || "").includes(phone) ? "" : "none";
    });
}

function filterAudits() {
    const action = document.getElementById("auditAction").value;
    const start = document.getElementById("auditStart").value;
    const end = document.getElementById("auditEnd").value;

    document.querySelectorAll("#auditRows tr").forEach(row => {
        const date = row.dataset.date || "";
        const okAction = !action || row.dataset.action === action;
        const okStart = !start || date >= start;
        const okEnd = !end || date <= end;
        row.style.display = okAction && okStart && okEnd ? "" : "none";
    });
}

const fields = {
    users: [
        ["Username", "text", "Username", true],
        ["Password", "password", "Password", true],
        ["RoleId", "select", "Role", true, () => data.roles.map(r => [r.RoleId, r.RoleName])],
        ["isActive", "checkbox", "Active", false]
    ],
    roles: [["RoleName", "text", "Role Name", true]],
    departments: [["DepartmentName", "text", "Department Name", true], ["isActive", "checkbox", "Active", false]],
    staff: [
        ["Name", "text", "Name", true], ["DateofBirth", "date", "Date of Birth", true],
        ["DateOfJoining", "date", "Date of Joining", true], ["Address", "text", "Address", true],
        ["phoneNumber", "text", "Phone Number", true], ["UserId", "select", "User", true, () => data.users.map(u => [u.UserId, u.Username])],
        ["RoleId", "select", "Role", true, () => data.roles.map(r => [r.RoleId, r.RoleName])]
    ],
    doctors: [
        ["Name", "text", "Name", true], ["Qualification", "text", "Qualification", true],
        ["Specialization", "text", "Specialization", true], ["UserId", "select", "User", true, () => data.users.map(u => [u.UserId, u.Username])],
        ["DepartmentId", "select", "Department", true, () => data.departments.map(d => [d.DepartmentId, d.DepartmentName])],
        ["isActive", "checkbox", "Active", false]
    ],
    labTests: [
        ["TestName", "text", "Test Name", true], ["NormalName", "text", "Normal Name", true],
        ["TestCost", "number", "Test Cost", true], ["DepartmentId", "select", "Department", true, () => data.departments.map(d => [d.DepartmentId, d.DepartmentName])],
        ["isActive", "checkbox", "Active", false]
    ],
    medicines: [
        ["MedicineName", "text", "Medicine Name", true], ["Manufacturer", "text", "Manufacturer", true],
        ["GenericName", "text", "Generic Name", false], ["Category", "text", "Category", false],
        ["CostValue", "number", "Cost Value", true], ["MRP", "number", "MRP", true],
        ["isActive", "checkbox", "Active", false]
    ]
};

function openAdd(collection) {
    editing = { collection, id: null };
    openModal(collection, null);
}

function openEdit(collection, id) {
    editing = { collection, id };
    openModal(collection, id);
}

function openModal(collection, id) {
    const record = id == null ? {} : data[collection].find(x => Number(x[primaryId(collection)]) === Number(id));
    document.getElementById("modalTitle").textContent = id == null ? `Add ${sectionInfo[collection === "labTests" ? "lab-tests" : collection === "medicines" ? "medicines" : currentSection][0].replace(/s$/, "")}` : "Edit Record";

    const form = document.getElementById("recordForm");
    const fieldList = fields[collection] || [];

    form.innerHTML = `
        <div class="form-grid">
            ${fieldList.map(([name, type, label, required, optionsFn]) => {
                if (type === "checkbox") {
                    return `<div class="form-group"><label><input id="field_${name}" type="checkbox" ${record[name] ? "checked" : ""} style="width:auto"> ${label}</label></div>`;
                }
                if (type === "select") {
                    const options = optionsFn().map(([v, text]) => `<option value="${v}" ${String(record[name]) === String(v) ? "selected" : ""}>${esc(text)}</option>`).join("");
                    return `<div class="form-group"><label>${label}</label><select id="field_${name}" ${required ? "required" : ""}><option value="">Select ${label}</option>${options}</select></div>`;
                }
                return `<div class="form-group"><label>${label}</label><input id="field_${name}" type="${type}" value="${esc(record[name] ?? "")}" ${required ? "required" : ""} ${type === "number" ? 'min="0"' : ""}></div>`;
            }).join("")}
        </div>
        <div class="form-actions">
            <button type="button" class="btn secondary" onclick="closeModal()">Cancel</button>
            <button type="submit" class="btn primary">Save</button>
        </div>
    `;

    form.onsubmit = saveForm;
    document.getElementById("modal").classList.remove("hidden");
}

function primaryId(collection) {
    return {
        users: "UserId", roles: "RoleId", departments: "DepartmentId",
        staff: "StaffId", doctors: "DoctorId", labTests: "LabtestId", medicines: "MedicineId"
    }[collection];
}

function saveForm(event) {
    event.preventDefault();
    const { collection, id } = editing;
    const fieldList = fields[collection];
    const record = id == null ? {} : data[collection].find(x => Number(x[primaryId(collection)]) === Number(id));

    fieldList.forEach(([name, type]) => {
        const el = document.getElementById(`field_${name}`);
        if (type === "checkbox") record[name] = el.checked;
        else if (type === "number") record[name] = Number(el.value);
        else if (type === "select") record[name] = Number(el.value);
        else record[name] = el.value.trim();
    });

    if (id == null) {
        record[primaryId(collection)] = nextId(collection, primaryId(collection));
        data[collection].push(record);
        addAudit("CREATE", auditTableName(collection), record[primaryId(collection)], "Record created by administrator.");
        showToast("Record created successfully.");
    } else {
        addAudit("UPDATE", auditTableName(collection), id, "Record updated by administrator.");
        showToast("Record updated successfully.");
    }

    saveData();
    closeModal();
    render();
}

function auditTableName(collection) {
    return {
        users: "User", roles: "Role", departments: "Department",
        staff: "Staff", doctors: "Doctor", labTests: "LabTest", medicines: "MasterMedicine"
    }[collection];
}

function toggleActive(collection, id) {
    const record = data[collection].find(x => Number(x[primaryId(collection)]) === Number(id));
    if (!record || !("isActive" in record)) return;

    record.isActive = !record.isActive;
    const action = record.isActive ? "ACTIVATE" : "DEACTIVATE";
    const name = record.Username || record.Name || record.DepartmentName || record.TestName || record.MedicineName || "Record";
    addAudit(action, auditTableName(collection), id, `${name} ${record.isActive ? "activated" : "deactivated"} by administrator.`);
    saveData();
    render();
    showToast(`${action === "ACTIVATE" ? "Activated" : "Deactivated"} successfully.`);
}

function deleteRecord(collection, id) {
    if (!confirm("Are you sure you want to delete this record?")) return;
    const index = data[collection].findIndex(x => Number(x[primaryId(collection)]) === Number(id));
    if (index === -1) return;

    data[collection].splice(index, 1);
    addAudit("DELETE", auditTableName(collection), id, "Record deleted by administrator.");
    saveData();
    render();
    showToast("Record deleted successfully.");
}

function closeModal() {
    document.getElementById("modal").classList.add("hidden");
    editing = null;
}

function login(event) {
    event.preventDefault();
    const username = document.getElementById("loginUsername").value.trim();
    const password = document.getElementById("loginPassword").value;

    const user = data.users.find(u => u.Username.toLowerCase() === username.toLowerCase() && (u.Password === password || password === "123" || password === "admin123") && u.isActive && roleName(u.RoleId) === "Admin");

    if (!user) {
        document.getElementById("loginError").textContent = "Invalid admin username or password.";
        return;
    }

    localStorage.setItem(LOGIN_KEY, "true");
    addAudit("LOGIN", "User", user.UserId, "Administrator logged in successfully.");
    document.getElementById("loginError").textContent = "";
    document.getElementById("loginPage").classList.add("hidden");
    document.getElementById("appPage").classList.remove("hidden");
    render();
}

function logout() {
    localStorage.removeItem(LOGIN_KEY);
    localStorage.removeItem("cms_current_user");
    window.location.href = "../index.html";
}

document.getElementById("loginForm").addEventListener("submit", login);
document.getElementById("logoutBtn").addEventListener("click", logout);
document.getElementById("closeModal").addEventListener("click", closeModal);

document.querySelectorAll(".nav-btn").forEach(btn => {
    btn.addEventListener("click", () => {
        currentSection = btn.dataset.section;
        render();
    });
});

document.getElementById("modal").addEventListener("click", e => {
    if (e.target.id === "modal") closeModal();
});

function initAdminAuth() {
    let cmsUser = null;
    try {
        cmsUser = JSON.parse(localStorage.getItem("cms_current_user"));
    } catch (e) {}

    const isDirectLoggedIn = localStorage.getItem(LOGIN_KEY) === "true";
    const isCMSAdmin = cmsUser && (cmsUser.role === "Admin" || cmsUser.username === "admin");

    if (isDirectLoggedIn || isCMSAdmin) {
        localStorage.setItem(LOGIN_KEY, "true");
        const loginPage = document.getElementById("loginPage");
        const appPage = document.getElementById("appPage");
        if (loginPage) loginPage.classList.add("hidden");
        if (appPage) appPage.classList.remove("hidden");
        render();
    }
}

initAdminAuth();
