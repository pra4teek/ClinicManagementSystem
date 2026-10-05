const STORAGE_KEY = "carepointClinicAdminDataV2";
const LOGIN_KEY = "clinicAdminLoggedIn";

const labTestData = [
    { testId:101, testName:"Blood Count", sampleType:"Blood", normalValue:"4.5-5.5 million/µL", amount:300 },
    { testId:102, testName:"Glucose", sampleType:"Blood", normalValue:"70-100 mg/dL", amount:150 },
    { testId:103, testName:"Urine Test", sampleType:"Urine", normalValue:"Normal", amount:200 },
    { testId:104, testName:"Hemoglobin", sampleType:"Blood", normalValue:"12-16 g/dL", amount:180 },
    { testId:105, testName:"Cholesterol", sampleType:"Blood", normalValue:"Below 200 mg/dL", amount:350 },
    { testId:106, testName:"Thyroid (TSH)", sampleType:"Blood", normalValue:"0.4-4.0 mIU/L", amount:400 },
    { testId:107, testName:"Liver Function Test", sampleType:"Blood", normalValue:"Normal", amount:600 },
    { testId:108, testName:"Kidney Function Test", sampleType:"Blood", normalValue:"Normal", amount:550 },
    { testId:109, testName:"Blood Pressure", sampleType:"Physical", normalValue:"120/80 mmHg", amount:100 },
    { testId:110, testName:"Vitamin D", sampleType:"Blood", normalValue:"30-100 ng/mL", amount:500 }
];

const DEFAULT_MEDICINES = [
    { id: 'MED-001', name: 'Paracetamol', dosage: '500mg', type: 'Tablet' },
    { id: 'MED-002', name: 'Amoxicillin', dosage: '250mg', type: 'Capsule' },
    { id: 'MED-003', name: 'Cetirizine', dosage: '10mg', type: 'Tablet' },
    { id: 'MED-004', name: 'Metformin', dosage: '500mg', type: 'Tablet' },
    { id: 'MED-005', name: 'Omeprazole', dosage: '20mg', type: 'Capsule' },
    { id: 'MED-006', name: 'Ibuprofen', dosage: '400mg', type: 'Tablet' },
    { id: 'MED-007', name: 'Azithromycin', dosage: '500mg', type: 'Tablet' }
];

const seedData = {
    users: [
        { UserId:1, Name:"Bala Weslin", Username:"admin", Password:"admin123", DOB:"1990-01-01", Address:"CarePoint Clinic", PhoneNumber:"9999999999", EmailId:"bala@carepointclinic.com", DepartmentId:1, RoleId:1, isActive:true },
        { UserId:2, Name:"Dr. Prateek Pradeep", Username:"doctor1", Password:"doctor123", DOB:"1988-05-10", Address:"Thiruvananthapuram", PhoneNumber:"9876543210", EmailId:"prateek@carepointclinic.com", DepartmentId:1, RoleId:2, isActive:true },
        { UserId:3, Name:"Joel Jain", Username:"reception1", Password:"reception123", DOB:"1995-05-10", Address:"Thiruvananthapuram", PhoneNumber:"9876500000", EmailId:"joel@carepointclinic.com", DepartmentId:1, RoleId:3, isActive:true },
        { UserId:4, Name:"Malathi Sreekumar", Username:"labtech1", Password:"lab12345", DOB:"1993-03-12", Address:"Thiruvananthapuram", PhoneNumber:"9876511111", EmailId:"malathi@carepointclinic.com", DepartmentId:1, RoleId:4, isActive:true },
        { UserId:5, Name:"Adarsh Chandran", Username:"pharma1", Password:"pharma123", DOB:"1992-07-20", Address:"Thiruvananthapuram", PhoneNumber:"9876522222", EmailId:"adarsh@carepointclinic.com", DepartmentId:1, RoleId:5, isActive:true }
    ],
    roles: [
        { RoleId:1, RoleName:"Admin" },
        { RoleId:2, RoleName:"Doctor" },
        { RoleId:3, RoleName:"Receptionist" },
        { RoleId:4, RoleName:"Lab Technician" },
        { RoleId:5, RoleName:"Pharmacist" }
    ],
    departments: [
        { DepartmentId:1, DepartmentName:"General Medicine" },
        { DepartmentId:2, DepartmentName:"Cardiology" }
    ],
    staff: [
        { StaffId:1, Name:"Joel Jain", UserId:3, RoleId:3 }
    ],
    doctors: [
        { DoctorId:1, Name:"Dr. Prateek Pradeep", Qualification:"MBBS, MD", Specialization:"General Medicine", UserId:2, DepartmentId:1 }
    ],
    labTests: labTestData.map(x => ({
        LabtestId:x.testId, TestName:x.testName, SampleType:x.sampleType,
        NormalValue:x.normalValue, TestCost:x.amount
    })),
    medicines: DEFAULT_MEDICINES.map((m,i) => ({
        MedicineId:i+1, MedicineName:m.name, Manufacturer:"Not specified", GenericName:m.name,
        Category:m.type, Dosage:m.dosage, Type:m.type, CostValue:0, MRP:0, Quantity:50
    })).map(m => {
        const prices = {
            'Paracetamol': {CostValue:10, MRP:15},
            'Amoxicillin': {CostValue:15, MRP:25},
            'Cetirizine':  {CostValue:5,  MRP:10},
            'Metformin':   {CostValue:12, MRP:20},
            'Omeprazole':  {CostValue:10, MRP:18},
            'Ibuprofen':   {CostValue:8,  MRP:12},
            'Azithromycin':{CostValue:30, MRP:45}
        };
        return prices[m.MedicineName] ? {...m, ...prices[m.MedicineName]} : m;
    }),
    auditLogs: []
};

const sectionInfo = {
    dashboard:["Dashboard","Clinic administration overview"],
    users:["Users","Manage clinic user accounts"],
    roles:["Roles","Manage permitted clinic roles"],
    departments:["Departments","Manage clinic departments and assigned doctors"],
    staff:["Receptionist","Manage receptionist information and email"],
    doctors:["Doctors","Manage doctors linked to clinic users"],
    "lab-tests":["Lab Tests","Manage laboratory test catalog"],
    medicines:["Medicines","Manage medicine inventory"],
    "audit-logs":["Audit Logs","Review administrative system activity"],
    "reorder-requests":["Reorder Requests","Approve or reject pharmacist stock reorder requests"]
};

let data = loadData();
syncAllDoctorLogins();
// Always sync medicine prices to cms_medicines on page load
// so pharmacist billing has current MRP values
setTimeout(() => syncAdminMedicinesToCMS(), 0);

let currentSection = "dashboard";
let editing = null;
function clone(value){ return JSON.parse(JSON.stringify(value)); }

function normalizeData(raw){
    const d = clone(seedData);
    if (!raw || typeof raw !== "object") return d;

    // Preserve existing records where possible, while migrating the old frontend schema.
    d.roles = Array.isArray(raw.roles) && raw.roles.length ? raw.roles : d.roles;
    d.departments = Array.isArray(raw.departments) && raw.departments.length
        ? raw.departments.map(x => ({DepartmentId:Number(x.DepartmentId), DepartmentName:x.DepartmentName}))
        : d.departments;

    if (Array.isArray(raw.users) && raw.users.length) {
        d.users = raw.users.map((u,i) => ({
            UserId:Number(u.UserId) || i+1,
            Name:u.Name || u.FullName || u.Username || "Clinic User",
            Username:u.Username || "",
            Password:u.Password || "",
            DOB:u.DOB || u.DateofBirth || "",
            Address:u.Address || "",
            PhoneNumber:u.PhoneNumber || u.phoneNumber || "",
            EmailId:u.EmailId || u.Email || "",
            DepartmentId:Number(u.DepartmentId) || 1,
            RoleId:Number(u.RoleId) || 1,
            isActive:u.isActive !== false
        }));
    }

    if (Array.isArray(raw.doctors) && raw.doctors.length) {
        d.doctors = raw.doctors
            .filter(x => x && x.Name && !/^\d+$/.test(String(x.Name).trim()))
            .map((x,i)=>({
                DoctorId:Number(x.DoctorId)||i+1, Name:x.Name||"Doctor",
                Qualification:x.Qualification||"Not specified",
                Specialization:x.Specialization||departmentNameRaw(x.DepartmentId,d.departments),
                UserId:Number(x.UserId)||null, DepartmentId:Number(x.DepartmentId)||1
            }));
        if (!d.doctors.length) d.doctors = clone(seedData.doctors);
    }
    if (Array.isArray(raw.staff) && raw.staff.length) {
        d.staff = raw.staff.map((x,i)=>({
            StaffId:Number(x.StaffId)||i+1, Name:x.Name||"Receptionist",
            UserId:Number(x.UserId)||null, RoleId:3
        }));
    }
    if (Array.isArray(raw.medicines) && raw.medicines.length) {
        d.medicines = raw.medicines.map((x,i)=>({
            MedicineId:Number(x.MedicineId)||i+1, MedicineName:x.MedicineName||"",
            Manufacturer:x.Manufacturer||"", GenericName:x.GenericName||"",
            Category:x.Category||x.Type||"", Dosage:x.Dosage||"", Type:x.Type||x.Category||"", CostValue:Number(x.CostValue)||0,
            MRP:Number(x.MRP)||0, Quantity:Number(x.Quantity ?? x.Stock ?? 0)
        }));
    }
    // Add any missing default medicines without changing existing medicine records.
    const existingMedicineNames = new Set(d.medicines.map(m => String(m.MedicineName||"").toLowerCase()));
    let nextMedicineId = Math.max(0, ...d.medicines.map(m => Number(m.MedicineId)||0)) + 1;
    DEFAULT_MEDICINES.forEach(m => {
        if (!existingMedicineNames.has(m.name.toLowerCase())) {
            d.medicines.push({
                MedicineId:nextMedicineId++, MedicineName:m.name, Manufacturer:"Not specified",
                GenericName:m.name, Category:m.type, Dosage:m.dosage, Type:m.type,
                CostValue:0, MRP:0, Quantity:50
            });
        }
    });
    // Fill dosage/type/prices for existing default medicines when those fields are missing.
    const DEFAULT_PRICES = {
        'Paracetamol': {CostValue:10, MRP:15},
        'Amoxicillin': {CostValue:15, MRP:25},
        'Cetirizine':  {CostValue:5,  MRP:10},
        'Metformin':   {CostValue:12, MRP:20},
        'Omeprazole':  {CostValue:10, MRP:18},
        'Ibuprofen':   {CostValue:8,  MRP:12},
        'Azithromycin':{CostValue:30, MRP:45}
    };
    d.medicines.forEach(med => {
        const preset = DEFAULT_MEDICINES.find(x => x.name.toLowerCase() === String(med.MedicineName||"").toLowerCase());
        if (preset) {
            if (!med.Dosage) med.Dosage = preset.dosage;
            if (!med.Type) med.Type = preset.type;
            // Restore default prices if MRP is still 0
            const dp = DEFAULT_PRICES[med.MedicineName];
            if (dp && Number(med.MRP) === 0) {
                med.CostValue = dp.CostValue;
                med.MRP = dp.MRP;
            }
            // Restore default quantity if everything is still at initial zero seed
            if (med.Quantity === 0 && Number(med.CostValue) === 0 && Number(med.MRP) === 0 && med.Manufacturer === "Not specified") {
                med.Quantity = 50;
            }
        }
    });
    // Always use the requested lab test catalog. It is intentionally status-free.
    d.labTests = clone(seedData.labTests);
    if (Array.isArray(raw.auditLogs)) {
        d.auditLogs = raw.auditLogs.map((a,i)=>({
            AuditId:Number(a.AuditId)||i+1, ActionType:a.ActionType||"ACTIVITY",
            Role:a.Role || roleNameRaw(a.RoleId,d.roles) || "Admin",
            RecordId:a.RecordId ?? "-", Details:a.Details||"",
            action_time:a.action_time||new Date().toISOString()
        }));
    }
    return d;
}
function departmentNameRaw(id,depts){ return depts.find(x=>Number(x.DepartmentId)===Number(id))?.DepartmentName||"-"; }
function roleNameRaw(id,roles){ return roles.find(x=>Number(x.RoleId)===Number(id))?.RoleName||"-"; }

function loadData(){
    const saved=localStorage.getItem(STORAGE_KEY);
    if(!saved){
        const fresh=clone(seedData);
        localStorage.setItem(STORAGE_KEY,JSON.stringify(fresh));
        return fresh;
    }
    try{
        const migrated=normalizeData(JSON.parse(saved));
        localStorage.setItem(STORAGE_KEY,JSON.stringify(migrated));
        return migrated;
    }catch{
        localStorage.setItem(STORAGE_KEY,JSON.stringify(seedData));
        return clone(seedData);
    }
}
function syncAdminMedicinesToCMS(){
    if (!data || !Array.isArray(data.medicines)) return;
    const cmsMeds = data.medicines.map(m => ({
        id: `MED-${m.MedicineId}`,
        MedicineId: m.MedicineId,
        name: m.MedicineName,
        MedicineName: m.MedicineName,
        dosage: m.Dosage || '500mg',
        Dosage: m.Dosage || '500mg',
        type: m.Type || m.Category || 'Tablet',
        Type: m.Type || m.Category || 'Tablet',
        category: m.Category || m.Type || 'General',
        manufacturer: m.Manufacturer || 'Not specified',
        genericName: m.GenericName || m.MedicineName,
        costValue: Number(m.CostValue) || 0,
        mrp: Number(m.MRP) || 15,
        quantity: Number(m.Quantity ?? 0),
        Quantity: Number(m.Quantity ?? 0)
    }));
    try {
        localStorage.setItem('cms_medicines', JSON.stringify(cmsMeds));
        window.dispatchEvent(new Event('cms_stock_updated'));
    } catch(e) {}
}
function saveData(){ 
    localStorage.setItem(STORAGE_KEY,JSON.stringify(data)); 
    syncAdminMedicinesToCMS();
}
function nextId(collection,field){
    return data[collection].length ? Math.max(...data[collection].map(x=>Number(x[field])||0))+1 : 1;
}
function roleName(id){ return data.roles.find(r=>Number(r.RoleId)===Number(id))?.RoleName||"-"; }
function departmentName(id){ return data.departments.find(d=>Number(d.DepartmentId)===Number(id))?.DepartmentName||"-"; }
function esc(value){
    return String(value ?? "").replaceAll("&","&amp;").replaceAll("<","&lt;")
        .replaceAll(">","&gt;").replaceAll('"',"&quot;").replaceAll("'","&#039;");
}
function money(value){ return `₹${Number(value||0).toFixed(2)}`; }
function ageFromDOB(dob){
    if(!dob) return "";
    const birth=new Date(dob+"T00:00:00"), today=new Date();
    let age=today.getFullYear()-birth.getFullYear();
    const m=today.getMonth()-birth.getMonth();
    if(m<0 || (m===0 && today.getDate()<birth.getDate())) age--;
    return age;
}
function addAudit(action,role,recordId,details){
    data.auditLogs.unshift({
        AuditId:nextId("auditLogs","AuditId"), ActionType:action,
        Role:role || "Admin", RecordId:recordId ?? "-", Details:details,
        action_time:new Date().toISOString()
    });
    saveData();
}
function showToast(message){
    const toast=document.getElementById("toast");
    toast.textContent=message; toast.classList.add("show");
    setTimeout(()=>toast.classList.remove("show"),2200);
}

function render(){
    const [title,subtitle]=sectionInfo[currentSection];
    document.getElementById("pageTitle").textContent=title;
    document.getElementById("pageSubtitle").textContent=subtitle;
    document.querySelectorAll(".nav-btn").forEach(btn=>btn.classList.toggle("active",btn.dataset.section===currentSection));
    const content=document.getElementById("content");
    const pages={
        dashboard:dashboardHTML,users:usersHTML,roles:rolesHTML,departments:departmentsHTML,
        staff:staffHTML,doctors:doctorsHTML,"lab-tests":labTestsHTML,medicines:medicinesHTML,
        "audit-logs":auditLogsHTML,"reorder-requests":reorderRequestsHTML
    };
    content.innerHTML=pages[currentSection]();

    // Show pending reorder badge on nav button
    const pendingCount = loadAdminReorders().filter(r=>r.status==='Pending').length;
    const reorderNavBtn = document.querySelector('[data-section="reorder-requests"]');
    if (reorderNavBtn) {
        const existing = reorderNavBtn.querySelector('.reorder-badge');
        if (existing) existing.remove();
        if (pendingCount > 0) {
            const badge = document.createElement('span');
            badge.className = 'reorder-badge';
            badge.style.cssText = 'background:#e53935;color:#fff;border-radius:999px;font-size:10px;font-weight:800;padding:1px 6px;margin-left:6px;vertical-align:middle;';
            badge.textContent = pendingCount;
            reorderNavBtn.appendChild(badge);
        }
    }
}

function dashboardHTML(){
    const lowStock=data.medicines.filter(m=>Number(m.Quantity)<=10).length;
    const pendingReorders = loadAdminReorders().filter(r=>r.status==='Pending').length;
    return `
      <div class="stat-grid">
        ${stat("Total Users",data.users.length)}
        ${stat("Doctors",data.doctors.length)}
        ${stat("Departments",data.departments.length)}
        ${stat("Receptionists",data.staff.length)}
        ${stat("Lab Tests",data.labTests.length)}
        ${stat("Medicines",data.medicines.length)}
        ${stat("Low Stock",lowStock)}
        ${stat("Audit Activities",data.auditLogs.length)}
      </div>
      ${pendingReorders > 0 ? `
      <div style="background:#fff8e1;border:1px solid #ffe082;border-radius:10px;padding:14px 18px;margin-bottom:18px;display:flex;align-items:center;justify-content:space-between;">
        <span style="color:#795548;font-weight:600;">&#9888; ${pendingReorders} pharmacist reorder request${pendingReorders>1?'s':''} awaiting your approval.</span>
        <button class="btn small" onclick="currentSection='reorder-requests';render()" style="background:#4b3fe4;color:#fff;">Review Now &rarr;</button>
      </div>` : ''}
      <div class="dashboard-grid">
        <div class="panel">
          <div class="panel-header"><h2>Doctors</h2><button class="btn small secondary" onclick="currentSection='doctors';render()">View All</button></div>
          <div class="table-wrap"><table><thead><tr><th>Name</th><th>Department</th><th>Qualification</th></tr></thead><tbody>
            ${data.doctors.slice(-5).reverse().map(d=>`<tr><td>${esc(d.Name)}</td><td>${esc(departmentName(d.DepartmentId))}</td><td>${esc(d.Qualification)}</td></tr>`).join("") || emptyRow(3,"No doctors found.")}
          </tbody></table></div>
        </div>
        <div class="panel">
          <div class="panel-header"><h2>Medicine Inventory</h2><button class="btn small secondary" onclick="currentSection='medicines';render()">Manage</button></div>
          <div class="table-wrap"><table><thead><tr><th>Medicine</th><th>Quantity</th><th>Stock</th></tr></thead><tbody>
            ${data.medicines.slice(-5).reverse().map(m=>`<tr><td>${esc(m.MedicineName)}</td><td>${m.Quantity}</td><td>${stockBadge(m.Quantity)}</td></tr>`).join("") || emptyRow(3,"No medicines found.")}
          </tbody></table></div>
        </div>
      </div>`;
}
function stat(label,value){return `<div class="stat-card"><div><div class="label">${label}</div><div class="value">${value}</div></div></div>`;}
function emptyRow(cols,msg){return `<tr><td colspan="${cols}" class="empty">${msg}</td></tr>`;}
function stockBadge(qty){
    qty=Number(qty)||0;
    if(qty<=0) return `<span class="badge out">Out of Stock</span>`;
    if(qty<=10) return `<span class="badge low">Low Stock</span>`;
    return `<span class="badge stock-ok">In Stock</span>`;
}

function usersHTML(){
    return tableSection("users",[
      ["UserId","ID"],["Name","Name"],["Username","Username"],["EmailId","Email"],
      ["DepartmentId","Department"],["RoleId","Role"],["DOB","DOB"],["PhoneNumber","Phone"]
    ],data.users.map(u=>`
      <tr><td>${u.UserId}</td><td>${esc(u.Name)}</td><td>${esc(u.Username)}</td><td>${esc(u.EmailId)}</td>
      <td>${esc(departmentName(u.DepartmentId))}</td><td>${esc(roleName(u.RoleId))}</td><td>${esc(u.DOB)}</td><td>${esc(u.PhoneNumber)}</td>
      <td class="action-cell"><button class="btn small secondary" onclick="openEdit('users',${u.UserId})">Edit</button>
      <button class="btn small danger" onclick="deleteRecord('users',${u.UserId})">Delete</button></td></tr>`).join(""),"Add User");
}

function rolesHTML(){
    return tableSection("roles",[["RoleId","ID"],["RoleName","Role"]],data.roles.map(r=>`
      <tr><td>${r.RoleId}</td><td>${esc(r.RoleName)}</td><td class="action-cell"><button class="btn small secondary" onclick="openEdit('roles',${r.RoleId})">Edit</button>
      <button class="btn small danger" onclick="deleteRecord('roles',${r.RoleId})">Delete</button></td></tr>`).join(""),"Add Role");
}
function departmentsHTML(){
    return tableSection("departments",[["DepartmentId","ID"],["DepartmentName","Department"],["Doctors","Doctor Name(s)"]],data.departments.map(d=>{
      const docs=data.doctors.filter(x=>Number(x.DepartmentId)===Number(d.DepartmentId)).map(x=>x.Name);
      return `<tr><td>${d.DepartmentId}</td><td>${esc(d.DepartmentName)}</td><td>${docs.length?esc(docs.join(", ")):"No doctor assigned"}</td>
      <td class="action-cell"><button class="btn small secondary" onclick="openEdit('departments',${d.DepartmentId})">Edit</button>
      <button class="btn small danger" onclick="deleteRecord('departments',${d.DepartmentId})">Delete</button></td></tr>`;
    }).join(""),"Add Department");
}
function staffHTML(){
    const receptionists=data.staff.map(s=>({s,u:data.users.find(u=>Number(u.UserId)===Number(s.UserId))})).filter(x=>x.u && roleName(x.u.RoleId)==="Receptionist");
    return tableSection("staff",[["StaffId","ID"],["Name","Name"],["Username","Username"],["EmailId","Receptionist Gmail"],["PhoneNumber","Phone"],["DepartmentId","Department"]],receptionists.map(({s,u})=>`
      <tr><td>${s.StaffId}</td><td>${esc(u.Name)}</td><td>${esc(u.Username)}</td><td>${esc(u.EmailId)}</td><td>${esc(u.PhoneNumber)}</td><td>${esc(departmentName(u.DepartmentId))}</td>
      <td class="action-cell"><button class="btn small secondary" onclick="openEdit('users',${u.UserId})">Edit</button></td></tr>`).join(""),null);
}
function doctorsHTML(){
    return tableSection("doctors",[["DoctorId","ID"],["Name","Doctor Name"],["Qualification","Qualification"],["Specialization","Specialization"],["DepartmentId","Department"]],data.doctors.map(d=>`
      <tr><td>${d.DoctorId}</td><td>${esc(d.Name)}</td><td>${esc(d.Qualification)}</td><td>${esc(d.Specialization)}</td><td>${esc(departmentName(d.DepartmentId))}</td>
      <td class="action-cell"><button class="btn small secondary" onclick="openEdit('doctors',${d.DoctorId})">Edit</button>
      <button class="btn small danger" onclick="deleteRecord('doctors',${d.DoctorId})">Delete</button></td></tr>`).join(""),"Add Doctor");
}
function labTestsHTML(){
    return tableSection("labTests",[["LabtestId","ID"],["TestName","Test"],["SampleType","Sample Type"],["NormalValue","Normal Value"],["TestCost","Cost"]],data.labTests.map(t=>`
      <tr><td>${t.LabtestId}</td><td>${esc(t.TestName)}</td><td>${esc(t.SampleType)}</td><td>${esc(t.NormalValue)}</td><td>${money(t.TestCost)}</td>
      <td class="action-cell"><button class="btn small secondary" onclick="openEdit('labTests',${t.LabtestId})">Edit</button>
      <button class="btn small danger" onclick="deleteRecord('labTests',${t.LabtestId})">Delete</button></td></tr>`).join(""),"Add Lab Test");
}
function medicinesHTML(){
    return tableSection("medicines",[["MedicineId","ID"],["MedicineName","Medicine"],["Manufacturer","Manufacturer"],["GenericName","Generic"],["Category","Category"],["CostValue","Cost"],["MRP","MRP"],["Quantity","Quantity"],["Stock","Stock"]],data.medicines.map(m=>`
      <tr><td>${m.MedicineId}</td><td>${esc(m.MedicineName)}</td><td>${esc(m.Manufacturer)}</td><td>${esc(m.GenericName)}</td><td>${esc(m.Category)}</td>
      <td>${money(m.CostValue)}</td><td>${money(m.MRP)}</td><td>${Number(m.Quantity)||0}</td><td>${stockBadge(m.Quantity)}</td>
      <td class="action-cell"><button class="btn small secondary" onclick="openEdit('medicines',${m.MedicineId})">Edit</button>
      <button class="btn small danger" onclick="deleteRecord('medicines',${m.MedicineId})">Delete</button></td></tr>`).join(""),"Add Medicine");
}
function auditLogsHTML(){
    return `<div class="panel"><div class="panel-header"><h2>Audit Logs</h2><div class="toolbar">
      <select id="auditAction" class="form-control" onchange="filterAudits()"><option value="">All Actions</option>${[...new Set(data.auditLogs.map(a=>a.ActionType))].map(a=>`<option>${esc(a)}</option>`).join("")}</select>
      <select id="auditRole" class="form-control" onchange="filterAudits()"><option value="">All Roles</option>${[...new Set(data.auditLogs.map(a=>a.Role))].map(r=>`<option>${esc(r)}</option>`).join("")}</select>
      <input id="auditStart" class="form-control" type="date" onchange="filterAudits()"><input id="auditEnd" class="form-control" type="date" onchange="filterAudits()"></div></div>
      <div class="table-wrap"><table><thead><tr><th>ID</th><th>Action</th><th>Role</th><th>Record</th><th>Details</th><th>Time</th></tr></thead>
      <tbody id="auditRows">${auditRows()}</tbody></table></div></div>`;
}
function auditRows(){
    return data.auditLogs.map(a=>`<tr data-action="${esc(a.ActionType)}" data-role="${esc(a.Role)}" data-date="${esc(a.action_time.slice(0,10))}">
      <td>${a.AuditId}</td><td>${esc(a.ActionType)}</td><td>${esc(a.Role)}</td><td>${esc(a.RecordId)}</td><td>${esc(a.Details)}</td><td>${new Date(a.action_time).toLocaleString()}</td></tr>`).join("")
      || emptyRow(6,"No audit records found.");
}

function tableSection(collection,headers,rows,addText){
    const searchId=`${collection}Search`;
    return `<div class="panel"><div class="panel-header"><h2>${sectionInfo[currentSection][0]}</h2><div class="toolbar">
      <input id="${searchId}" class="form-control" placeholder="Search..." oninput="filterTable('${collection}')">
      ${addText?`<button class="btn primary" onclick="openAdd('${collection}')">+ ${addText}</button>`:""}</div></div>
      <div class="table-wrap"><table><thead><tr>${headers.map(h=>`<th>${h[1]}</th>`).join("")}<th>Actions</th></tr></thead>
      <tbody id="${collection}Rows">${rows||emptyRow(headers.length+1,"No records found.")}</tbody></table></div></div>`;
}
function filterTable(collection){
    const el=document.getElementById(`${collection}Search`); if(!el)return;
    const value=el.value.toLowerCase();
    document.querySelectorAll(`#${collection}Rows tr`).forEach(row=>row.style.display=row.textContent.toLowerCase().includes(value)?"":"none");
}
function filterAudits(){
    const action=document.getElementById("auditAction").value, role=document.getElementById("auditRole").value;
    const start=document.getElementById("auditStart").value, end=document.getElementById("auditEnd").value;
    document.querySelectorAll("#auditRows tr").forEach(row=>{
      const date=row.dataset.date||"", okAction=!action||row.dataset.action===action, okRole=!role||row.dataset.role===role;
      row.style.display=okAction&&okRole&&(!start||date>=start)&&(!end||date<=end)?"":"none";
    });
}

const fields = {
    users:[
      ["Name","text","Name",true],["Username","text","Username",true],["Password","password","Password",true],
      ["DOB","date","Date of Birth",true],["Address","text","Address",true],["PhoneNumber","tel","Phone Number",true],
      ["EmailId","email","Email ID",true],["DepartmentId","select","Department",true,()=>data.departments.map(d=>[d.DepartmentId,d.DepartmentName])],
      ["RoleId","select","Role",true,()=>data.roles.map(r=>[r.RoleId,r.RoleName])]
    ],
    roles:[["RoleName","text","Role Name",true]],
    departments:[["DepartmentName","text","Department Name",true]],
    doctors:[
      ["Name","text","Doctor Name",true],["Qualification","text","Qualification (e.g. MBBS, MD)",true],
      ["Specialization","text","Specialization (e.g. Cardiology)",true],
      ["DepartmentId","select","Department",true,()=>data.departments.map(d=>[d.DepartmentId,d.DepartmentName])]
    ],
    labTests:[
      ["TestName","text","Test Name",true],["SampleType","text","Sample Type",true],
      ["NormalValue","text","Normal Value",true],["TestCost","number","Test Cost (₹)",true]
    ],
    medicines:[
      ["MedicineName","text","Medicine Name",true],
      ["Manufacturer","text","Manufacturer",true],
      ["GenericName","text","Generic Name",true],
      ["Category","text","Category",true],
      ["Dosage","text","Dosage (e.g. 500mg)",true],
      ["Type","text","Type (e.g. Tablet, Capsule)",true],
      ["CostValue","number","Cost Value (₹)",true],
      ["MRP","number","MRP (₹)",true],
      ["Quantity","number","Quantity",true]
    ]
};

function openAdd(collection){ editing={collection,id:null}; openModal(collection,null); }
function openEdit(collection,id){ editing={collection,id}; openModal(collection,id); }

function openModal(collection,id){
    const record=id==null?{}:data[collection].find(x=>Number(x[primaryId(collection)])===Number(id))||{};
    const titles={users:"User",roles:"Role",departments:"Department",doctors:"Doctor",labTests:"Lab Test",medicines:"Medicine"};
    document.getElementById("modalTitle").textContent=id==null?`Add ${titles[collection]||"Record"}`:"Edit Record";
    const form=document.getElementById("recordForm"), list=fields[collection]||[];
    form.innerHTML=`<div class="form-grid">${list.map(([name,type,label,required,optionsFn])=>{
      if(type==="checkbox") return `<div class="form-group"><label><input id="field_${name}" type="checkbox" ${record[name]?"checked":""} style="width:auto;margin-right:6px">${label}</label></div>`;
      if(type==="select"){
        const opts=optionsFn().map(([v,t])=>`<option value="${v}" ${String(record[name])===String(v)?"selected":""}>${esc(t)}</option>`).join("");
        return `<div class="form-group"><label>${label}${required?" *":""}</label><select id="field_${name}" class="form-control" ${required?"required":""}><option value="">Select ${label}</option>${opts}</select></div>`;
      }
      const passwordEdit = name==="Password" && id!=null;
      const requiredNow = required && !passwordEdit;
      const passwordValue = passwordEdit ? "" : (record[name]??"");
      const placeholder = passwordEdit ? 'Leave blank to keep current password' : "";
      return `<div class="form-group"><label>${label}${requiredNow?" *":""}</label><input id="field_${name}" class="form-control" type="${type}" value="${esc(passwordValue)}" placeholder="${placeholder}" ${requiredNow?"required":""} ${type==="number"?'min="0" step="0.01"':""}></div>`;
    }).join("")}</div><div id="formError" class="form-error"></div>
    <div class="form-actions"><button type="button" class="btn secondary" onclick="closeModal()">Cancel</button><button type="submit" class="btn primary">Save</button></div>`;
    form.onsubmit=saveForm;
    document.getElementById("modal").classList.remove("hidden");
}

function primaryId(collection){
    return {users:"UserId",roles:"RoleId",departments:"DepartmentId",doctors:"DoctorId",labTests:"LabtestId",medicines:"MedicineId"}[collection];
}

function validateRecord(collection,record){
    const error=document.getElementById("formError");
    error.textContent = "";

    if(collection==="users"){
      const required=["Name","Username","DOB","Address","PhoneNumber","EmailId","DepartmentId","RoleId"];
      for(const field of required){
        if(record[field]===undefined || record[field]===null || String(record[field]).trim()===""){ error.textContent="Please fill all required fields."; return false; }
      }
      const name = String(record.Name || "").trim();
      if(/\d/.test(name)){ error.textContent="Name cannot contain numbers."; return false; }
      if(!/^[a-zA-Z\s.,'-]{2,60}$/.test(name)){ error.textContent="Name must contain valid letters (at least 2 characters)."; return false; }
      if(editing.id==null && !String(record.Password||"").trim()){error.textContent="Password is required.";return false}
      if(/\s/.test(record.Username)){error.textContent="Username cannot contain spaces.";return false}
      if(String(record.Username).length < 3){error.textContent="Username must be at least 3 characters.";return false}
      if(editing.id==null && /\s/.test(record.Password)){error.textContent="Password cannot contain spaces.";return false}
      if(editing.id==null && String(record.Password).length < 3){error.textContent="Password must be at least 3 characters.";return false}
      if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(record.EmailId)){error.textContent="Enter a valid email address.";return false}
      if(!/^\d{10}$/.test(record.PhoneNumber)){error.textContent="Phone number must contain exactly 10 digits.";return false}
      if(!/[a-zA-Z]/.test(String(record.Address || ""))){error.textContent="Address must contain descriptive text/letters.";return false}
      const age=ageFromDOB(record.DOB);
      if(age==="" || age<23 || age>56){
        error.textContent="User age must be between 23 and 56 years.";
        return false;
      }
      if(new Date(record.DOB)>new Date()){
        error.textContent="Date of birth cannot be in the future.";
        return false;
      }
      const duplicate=data.users.find(u=>u.Username.toLowerCase()===record.Username.toLowerCase() && Number(u.UserId)!==Number(editing.id));
      if(duplicate){error.textContent="Username already exists.";return false}
      const dupEmail=data.users.find(u=>u.EmailId.toLowerCase()===record.EmailId.toLowerCase() && Number(u.UserId)!==Number(editing.id));
      if(dupEmail){error.textContent="Email ID already exists.";return false}
    }

    if(collection==="roles"){
      const role = String(record.RoleName||"").trim();
      if(!role){error.textContent="Role name is required.";return false}
      if(/\d/.test(role)){error.textContent="Role name cannot contain numbers.";return false}
      if(!/^[a-zA-Z\s]{2,40}$/.test(role)){error.textContent="Role name must contain valid letters.";return false}
      const dupRole=data.roles.find(r=>r.RoleName.toLowerCase()===role.toLowerCase() && Number(r.RoleId)!==Number(editing.id));
      if(dupRole){error.textContent="Role already exists.";return false}
    }

    if(collection==="departments"){
      const dept = String(record.DepartmentName||"").trim();
      if(!dept){error.textContent="Department name is required.";return false}
      if(/\d/.test(dept)){error.textContent="Department name cannot contain numbers.";return false}
      if(!/^[a-zA-Z\s.,'-]{2,50}$/.test(dept)){error.textContent="Department name must contain valid letters.";return false}
      const dupDept=data.departments.find(d=>d.DepartmentName.toLowerCase()===dept.toLowerCase() && Number(d.DepartmentId)!==Number(editing.id));
      if(dupDept){error.textContent="Department already exists.";return false}
    }

    if(collection==="doctors"){
      const name = String(record.Name || "").trim();
      const qual = String(record.Qualification || "").trim();
      const spec = String(record.Specialization || "").trim();
      const deptId = Number(record.DepartmentId);

      if(!name){error.textContent="Doctor Name is required.";return false}
      if(/\d/.test(name)){error.textContent="Doctor Name cannot contain numbers.";return false}
      if(!/^[a-zA-Z\s.,'-]{2,60}$/.test(name)){error.textContent="Doctor Name must contain valid letters (e.g. Dr. John Doe).";return false}

      if(!qual){error.textContent="Qualification is required.";return false}
      if(/^\d+$/.test(qual) || !/[a-zA-Z]/.test(qual)){error.textContent="Qualification must contain medical degree letters (e.g. MBBS, MD).";return false}

      if(!spec){error.textContent="Specialization is required.";return false}
      if(/\d/.test(spec)){error.textContent="Specialization cannot contain numbers.";return false}
      if(!/^[a-zA-Z\s.,'-]{2,60}$/.test(spec)){error.textContent="Specialization must contain valid letters (e.g. Cardiology).";return false}

      if(!deptId || deptId <= 0 || isNaN(deptId)){error.textContent="Please select a valid Department.";return false}
    }

    if(collection==="labTests"){
      const tName = String(record.TestName||"").trim();
      const sType = String(record.SampleType||"").trim();
      const nVal  = String(record.NormalValue||"").trim();
      const cost  = Number(record.TestCost);

      if(!tName){error.textContent="Test Name is required.";return false}
      if(!/[a-zA-Z]/.test(tName)){error.textContent="Test Name must contain letters.";return false}

      if(!sType){error.textContent="Sample Type is required.";return false}
      if(/\d/.test(sType)){error.textContent="Sample Type cannot contain numbers (e.g. Blood, Urine).";return false}
      if(!/[a-zA-Z]/.test(sType)){error.textContent="Sample Type must contain letters.";return false}

      if(!nVal){error.textContent="Normal Reference Value is required.";return false}

      if(record.TestCost==="" || record.TestCost===null || isNaN(cost) || cost <= 0){
        error.textContent="Test Cost must be greater than ₹0.";
        return false;
      }
      const dupTest=data.labTests.find(t=>t.TestName.toLowerCase()===tName.toLowerCase() && Number(t.LabtestId)!==Number(editing.id));
      if(dupTest){error.textContent="Lab Test name already exists.";return false}
    }

    if(collection==="medicines"){
      const strFields = [
        ["MedicineName", "Medicine Name"],
        ["Manufacturer", "Manufacturer"],
        ["GenericName", "Generic Name"],
        ["Category", "Category"],
        ["Dosage", "Dosage"],
        ["Type", "Type"]
      ];
      for(const [k, lbl] of strFields){
        const val = String(record[k]||"").trim();
        if(!val){
          error.textContent = `${lbl} is mandatory. Please fill all fields.`;
          return false;
        }
        if(["MedicineName","Manufacturer","GenericName","Category","Type"].includes(k) && !/[a-zA-Z]/.test(val)){
          error.textContent = `${lbl} must contain valid letters.`;
          return false;
        }
      }
      if(record.CostValue==="" || record.CostValue===null || record.CostValue===undefined || isNaN(Number(record.CostValue)) || Number(record.CostValue)<0){
        error.textContent = "Cost Value is mandatory and must be 0 or greater.";
        return false;
      }
      if(record.MRP==="" || record.MRP===null || record.MRP===undefined || isNaN(Number(record.MRP)) || Number(record.MRP)<=0){
        error.textContent = "MRP is mandatory and must be greater than 0.";
        return false;
      }
      if(record.Quantity==="" || record.Quantity===null || record.Quantity===undefined || isNaN(Number(record.Quantity)) || Number(record.Quantity)<0){
        error.textContent = "Quantity is mandatory and must be 0 or greater.";
        return false;
      }
      if(Number(record.MRP) < Number(record.CostValue)){
        error.textContent = "MRP cannot be lower than Cost Value.";
        return false;
      }
    }
    return true;
}

function syncRoleRecord(user,oldRoleId){
    const newRole=roleName(user.RoleId);
    const oldRole=roleName(oldRoleId);
    if(oldRole==="Doctor" && newRole!=="Doctor") data.doctors=data.doctors.filter(d=>Number(d.UserId)!==Number(user.UserId));
    if(oldRole==="Receptionist" && newRole!=="Receptionist") data.staff=data.staff.filter(s=>Number(s.UserId)!==Number(user.UserId));

    if(newRole==="Doctor"){
      let doctor=data.doctors.find(d=>Number(d.UserId)===Number(user.UserId));
      if(!doctor){
        doctor={DoctorId:nextId("doctors","DoctorId"),Name:user.Name,Qualification:"Not specified",Specialization:departmentName(user.DepartmentId),UserId:user.UserId,DepartmentId:user.DepartmentId};
        data.doctors.push(doctor);
      }else{
        doctor.Name=user.Name; doctor.DepartmentId=user.DepartmentId; doctor.Specialization=departmentName(user.DepartmentId);
      }
    }
    if(newRole==="Receptionist"){
      let staff=data.staff.find(s=>Number(s.UserId)===Number(user.UserId));
      if(!staff) data.staff.push({StaffId:nextId("staff","StaffId"),Name:user.Name,UserId:user.UserId,RoleId:3});
      else staff.Name=user.Name;
    }
}
function syncDoctorLogin(user){
    if(!user || Number(user.RoleId) !== 2) return;

    const sharedUsers = JSON.parse(localStorage.getItem("cms_users") || "[]");

    const username = String(user.Username || "").trim();
    if(!username) return;

    const doctorLogin = {
        username: username,
        password: String(user.Password || ""),
        role: "Doctor",
        name: String(user.Name || "Doctor"),
        adminUserId: Number(user.UserId)
    };

    const index = sharedUsers.findIndex(
        u => String(u.username || "").toLowerCase() === username.toLowerCase()
    );

    if(index >= 0){
        sharedUsers[index] = {
            ...sharedUsers[index],
            ...doctorLogin
        };
    }else{
        sharedUsers.push(doctorLogin);
    }

    localStorage.setItem("cms_users", JSON.stringify(sharedUsers));
}

function syncAllDoctorLogins(){
    data.users
        .filter(u => Number(u.RoleId) === 2)
        .forEach(syncDoctorLogin);
}
function saveForm(event){
    event.preventDefault();
    const {collection,id}=editing;
    const record=id==null?{}:data[collection].find(x=>Number(x[primaryId(collection)])===Number(id));
    const oldRoleId=collection==="users" ? record?.RoleId : null;
    for(const [name,type] of fields[collection]){
      const el=document.getElementById(`field_${name}`);
      if(type==="checkbox") record[name]=el.checked;
      else if(type==="number") record[name]=Number(el.value);
      else if(type==="select") record[name]=Number(el.value);
      else if(name==="Password" && id!=null && el.value==="") { /* keep existing password */ }
      else record[name]=el.value.trim();
    }
    if(collection==="doctors" && record.UserId === undefined){
      record.UserId = null;
    }
    if(!validateRecord(collection,record)) return;

  if(id==null){
  record[primaryId(collection)]=nextId(collection,primaryId(collection));
  data[collection].push(record);

  if(collection==="users"){
    syncRoleRecord(record,null);
    syncDoctorLogin(record);
  }

  addAudit("CREATE",collectionRole(collection),record[primaryId(collection)],`${collectionLabel(collection)} created.`);
      showToast(`${collectionLabel(collection)} created successfully.`);
  }else{
  if(collection==="users"){
    syncRoleRecord(record,oldRoleId);
    syncDoctorLogin(record);
  }

  addAudit("UPDATE",collectionRole(collection),id,`${collectionLabel(collection)} updated.`);
      showToast(`${collectionLabel(collection)} updated successfully.`);
    }
    saveData(); closeModal(); render();
}
function collectionLabel(c){return {users:"User",roles:"Role",departments:"Department",doctors:"Doctor",labTests:"Lab Test",medicines:"Medicine"}[c]||"Record";}
function collectionRole(c){return c==="users"?"Admin":c==="doctors"?"Doctor":c==="staff"?"Receptionist":"Admin";}

function deleteRecord(collection,id){
    if(collection==="users"){
      const user=data.users.find(u=>Number(u.UserId)===Number(id));
      if(user && Number(user.UserId)===1){showToast("The primary administrator cannot be deleted.");return;}
    }
    if(!confirm(`Delete this ${collectionLabel(collection).toLowerCase()}?`))return;
    const idx=data[collection].findIndex(x=>Number(x[primaryId(collection)])===Number(id));
    if(idx<0)return;
    const record=data[collection][idx];
    if(collection==="users"){
      data.doctors=data.doctors.filter(d=>Number(d.UserId)!==Number(id));
      data.staff=data.staff.filter(s=>Number(s.UserId)!==Number(id));
    }
    data[collection].splice(idx,1);
    addAudit("DELETE","Admin",id,`${collectionLabel(collection)} deleted.`);
    saveData(); render(); showToast("Deleted successfully.");
}
function closeModal(){document.getElementById("modal").classList.add("hidden");editing=null;}

function login(event){
    event.preventDefault();
    const username=document.getElementById("loginUsername").value.trim();
    const password=document.getElementById("loginPassword").value;
    const user=data.users.find(u=>u.Username===username&&u.Password===password&&u.isActive&&roleName(u.RoleId)==="Admin");
    if(!user){document.getElementById("loginError").textContent="Invalid admin username or password.";return;}
    localStorage.setItem(LOGIN_KEY,"true");
    addAudit("LOGIN","Admin",user.UserId,"Administrator logged in successfully.");
    document.getElementById("loginError").textContent="";
    document.getElementById("loginPage").classList.add("hidden");
    document.getElementById("appPage").classList.remove("hidden");
    const displayName = user.Name||user.EmailId||user.Username;
    document.getElementById("adminIdentity").textContent = displayName;
    const sidebarName = document.getElementById("adminIdentitySidebar");
    if (sidebarName) sidebarName.textContent = displayName;
    render();
}
function logout() {
    localStorage.removeItem(LOGIN_KEY);
    window.location.href = "../index.html";
}
// Reorder Requests Workflow for Admin Monitoring
const REORDER_KEY = 'cms_reorder_requests';

function loadAdminReorders() {
    try {
        return JSON.parse(localStorage.getItem(REORDER_KEY) || '[]');
    } catch(e) {
        return [];
    }
}

function saveAdminReorders(arr) {
    try {
        localStorage.setItem(REORDER_KEY, JSON.stringify(arr));
        window.dispatchEvent(new Event('cms_stock_updated'));
    } catch(e) {}
}

let adminReorderFilter = 'All';

function setReorderFilter(filter) {
    adminReorderFilter = filter;
    render();
}

function approveReorderRequest(reqId) {
    const requests = loadAdminReorders();
    const req = requests.find(r => r.id === reqId);
    if (!req) { showToast("Reorder request not found."); return; }

    const adminNote = prompt(`Approve reorder for "${req.medicine}" (${req.quantity} units)? Enter optional admin note:`, "Approved by Admin - Restock authorized");
    if (adminNote === null) return; // user cancelled

    req.status = 'Approved';
    req.adminAction = 'Approved';
    req.adminNote = adminNote || 'Approved by Admin';
    req.adminBy = (data.users.find(u => roleName(u.RoleId) === "Admin")?.Name) || 'Bala Weslin';
    req.adminAt = new Date().toISOString();

    saveAdminReorders(requests);

    // Automatically update or add medicine quantity in Admin medicine catalog
    let med = data.medicines.find(m =>
        String(m.MedicineName || '').toLowerCase().trim() === String(req.medicine || '').toLowerCase().trim()
    );

    if (med) {
        med.Quantity = (Number(med.Quantity) || 0) + Number(req.quantity);
    } else {
        const newMedId = nextId('medicines', 'MedicineId');
        med = {
            MedicineId: newMedId,
            MedicineName: req.medicine,
            Category: 'General',
            Type: 'Tablet',
            Dosage: '500mg',
            Manufacturer: req.supplier || 'Supplier',
            GenericName: req.medicine,
            CostValue: 10,
            MRP: 15,
            Quantity: Number(req.quantity)
        };
        data.medicines.push(med);
    }

    saveData();
    addAudit("UPDATE", "Admin", req.id, `Approved reorder request for "${req.medicine}" (${req.quantity} units). Stock updated to ${med.Quantity}.`);
    showToast(`Reorder request approved! Added ${req.quantity} units to "${req.medicine}" inventory.`);
    render();
}

function rejectReorderRequest(reqId) {
    const requests = loadAdminReorders();
    const req = requests.find(r => r.id === reqId);
    if (!req) { showToast("Reorder request not found."); return; }

    const adminNote = prompt(`Reject reorder for "${req.medicine}"? Enter reason for rejection:`, "Out of stock with supplier / Not approved");
    if (adminNote === null) return; // user cancelled

    req.status = 'Rejected';
    req.adminAction = 'Rejected';
    req.adminNote = adminNote || 'Rejected by Admin';
    req.adminBy = (data.users.find(u => roleName(u.RoleId) === "Admin")?.Name) || 'Bala Weslin';
    req.adminAt = new Date().toISOString();

    saveAdminReorders(requests);
    addAudit("UPDATE", "Admin", req.id, `Rejected reorder request for "${req.medicine}". Reason: ${req.adminNote}`);
    showToast(`Reorder request for "${req.medicine}" rejected.`);
    render();
}

function reorderRequestsHTML() {
    const all = loadAdminReorders();
    const pending = all.filter(r => r.status === 'Pending').length;
    const approved = all.filter(r => r.status === 'Approved').length;
    const rejected = all.filter(r => r.status === 'Rejected').length;
    const received = all.filter(r => r.status === 'Received').length;

    let filtered = all;
    if (adminReorderFilter !== 'All') {
        filtered = all.filter(r => r.status === adminReorderFilter);
    }

    const badgeClass = s => ({
        'Pending':  'badge low',
        'Approved': 'badge stock-ok',
        'Rejected': 'badge out',
        'Received': 'badge active'
    }[s] || 'badge active');

    const rows = filtered.length ? filtered.map(r => {
        const dateStr = r.requestedAt ? new Date(r.requestedAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : '—';
        const isPending = r.status === 'Pending';
        const actions = isPending ? `
            <button class="btn small success" onclick="approveReorderRequest('${r.id}')">&#10003; Approve &amp; Restock</button>
            <button class="btn small danger" onclick="rejectReorderRequest('${r.id}')">&#10007; Reject</button>
        ` : `<span class="text-muted text-xs">${r.adminNote ? esc(r.adminNote) : esc(r.status)}</span>`;

        return `<tr>
            <td><strong>${esc(r.id)}</strong></td>
            <td><strong>${esc(r.medicine)}</strong></td>
            <td>${esc(r.supplier || 'N/A')}</td>
            <td><strong>${r.quantity}</strong></td>
            <td>${esc(r.requestedBy || 'Pharmacist')}</td>
            <td>${dateStr}</td>
            <td><span class="${badgeClass(r.status)}">${esc(r.status)}</span></td>
            <td>${actions}</td>
        </tr>`;
    }).join('') : `<tr><td colspan="8" class="empty">No ${adminReorderFilter === 'All' ? '' : adminReorderFilter.toLowerCase()} reorder requests found.</td></tr>`;

    return `
        <div class="stat-grid">
            <div class="stat-card"><div><div class="label">Total Reorder Requests</div><div class="value">${all.length}</div></div></div>
            <div class="stat-card"><div><div class="label">Pending Approval</div><div class="value" style="color:#d97706;">${pending}</div></div></div>
            <div class="stat-card"><div><div class="label">Approved</div><div class="value" style="color:#059669;">${approved}</div></div></div>
            <div class="stat-card"><div><div class="label">Received &amp; Stocked</div><div class="value" style="color:#0057b8;">${received}</div></div></div>
        </div>

        <div class="panel">
            <div class="panel-header">
                <h2>Pharmacist Stock Reorder Requests</h2>
                <div class="toolbar">
                    <button class="btn small ${adminReorderFilter==='All'?'primary':'secondary'}" onclick="setReorderFilter('All')">All (${all.length})</button>
                    <button class="btn small ${adminReorderFilter==='Pending'?'primary':'secondary'}" onclick="setReorderFilter('Pending')">Pending (${pending})</button>
                    <button class="btn small ${adminReorderFilter==='Approved'?'primary':'secondary'}" onclick="setReorderFilter('Approved')">Approved (${approved})</button>
                    <button class="btn small ${adminReorderFilter==='Received'?'primary':'secondary'}" onclick="setReorderFilter('Received')">Received (${received})</button>
                    <button class="btn small ${adminReorderFilter==='Rejected'?'primary':'secondary'}" onclick="setReorderFilter('Rejected')">Rejected (${rejected})</button>
                </div>
            </div>
            <div class="table-wrap">
                <table>
                    <thead>
                        <tr>
                            <th>Req ID</th>
                            <th>Medicine</th>
                            <th>Supplier</th>
                            <th>Qty Requested</th>
                            <th>Requested By</th>
                            <th>Requested Date</th>
                            <th>Status</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>${rows}</tbody>
                </table>
            </div>
        </div>
    `;
}

document.getElementById("loginForm").addEventListener("submit",login);
document.getElementById("logoutBtn").addEventListener("click",logout);
document.getElementById("closeModal").addEventListener("click",closeModal);
document.querySelectorAll(".nav-btn").forEach(btn=>btn.addEventListener("click",()=>{currentSection=btn.dataset.section;render();}));
document.getElementById("modal").addEventListener("click",e=>{if(e.target.id==="modal")closeModal();});
if(localStorage.getItem(LOGIN_KEY)==="true"){
    const admin=data.users.find(u=>roleName(u.RoleId)==="Admin");
    document.getElementById("loginPage").classList.add("hidden");
    document.getElementById("appPage").classList.remove("hidden");
    const displayName = admin?.Name||admin?.EmailId||"Bala Weslin";
    document.getElementById("adminIdentity").textContent = displayName;
    const sidebarName = document.getElementById("adminIdentitySidebar");
    if (sidebarName) sidebarName.textContent = displayName;
    render();
}

// Cross-tab synchronization: refresh Admin tables if Pharmacist dispenses medicines or submits reorders
window.addEventListener('storage', function(e) {
    if (e.key === 'carepointClinicAdminDataV2' || e.key === 'cms_medicines' || e.key === 'cms_reorder_requests') {
        data = loadData();
        render();
    }
});
window.addEventListener('focus', function() {
    data = loadData();
    render();
});
window.addEventListener('cms_stock_updated', function() {
    data = loadData();
    render();
});
