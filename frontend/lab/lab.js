const TEST_MASTER_KEY="lab-test-master";

let orders=[];
let reports=[];
let bills=[];
let testMaster=[];

const defaultTestMaster=[
    {testId:"LT001",testName:"Blood Count",sampleType:"Blood",normalValue:"4.5-5.5 million/µL",charge:300},
    {testId:"LT002",testName:"Glucose",sampleType:"Blood",normalValue:"70-100 mg/dL",charge:150},
    {testId:"LT003",testName:"Urine Test",sampleType:"Urine",normalValue:"Normal",charge:200},
    {testId:"LT004",testName:"Hemoglobin",sampleType:"Blood",normalValue:"12-16 g/dL",charge:180},
    {testId:"LT005",testName:"Cholesterol",sampleType:"Blood",normalValue:"Below 200 mg/dL",charge:400},
    {testId:"LT006",testName:"Thyroid",sampleType:"Blood",normalValue:"0.4-4.0 mIU/L",charge:500}
];

function loadTestMaster(){
    testMaster=getStorage(TEST_MASTER_KEY,defaultTestMaster);

    // Auto-upgrade any old generic "Reference Normal" placeholders to realistic medical ranges
    let upgraded = false;
    testMaster.forEach(t => {
        if (!t.normalValue || t.normalValue.includes("Reference Normal") || t.normalValue === "Standard Reference Range") {
            const meta = getStandardTestMeta(t.testName);
            t.normalValue = meta.normalValue;
            if (!t.sampleType || t.sampleType === "Blood") {
                t.sampleType = meta.sampleType;
            }
            upgraded = true;
        }
    });
    if (upgraded) {
        setStorage(TEST_MASTER_KEY,testMaster);
    }
}

function getTestDetails(testId){
    let match = testMaster.find(
        test=>String(test.testId)===String(testId)
    );
    if(!match && testId){
        match = testMaster.find(
            test=>test.testName.toLowerCase()===String(testId).toLowerCase()
        );
    }
    if(!match){
        match = {
            testId: testId || "LT-GEN",
            testName: typeof testId === "string" && isNaN(testId) ? testId : "Diagnostic Lab Test",
            sampleType: "Blood / Diagnostic Specimen",
            normalValue: "Standard Reference Range",
            charge: 250
        };
    }
    return match;
}

function getAvailableDoctorName(){
    try{
        const appointments=JSON.parse(
            localStorage.getItem("cms_appointments")||"[]"
        );
        const appointment=appointments.find(
            item=>typeof item.doctorName==="string"&&item.doctorName.trim()
        );

        if(appointment){
            return appointment.doctorName.trim();
        }

        const users=JSON.parse(
            localStorage.getItem("cms_users")||"[]"
        );
        const doctor=users.find(
            user=>String(user.role).toLowerCase()==="doctor"&&
                typeof user.name==="string"&&user.name.trim()
        );

        if(doctor){
            return doctor.name.trim();
        }
    }catch(error){
        return "Dr. Prateek Pradeep";
    }

    return "Dr. Prateek Pradeep";
}

function getStandardTestMeta(testName){
    const name=String(testName||"").toLowerCase();

    if(name.includes("cbc")||name.includes("complete blood count")||name.includes("blood count")){
        return {
            sampleType:"Whole Blood (EDTA)",
            normalValue:"WBC: 4.5-11.0 ×10³/µL, RBC: 4.5-5.5 ×10⁶/µL, Platelets: 150-450 ×10³/µL",
            charge:300
        };
    }
    if(name.includes("fbs")||name.includes("fasting blood sugar")||name.includes("fasting glucose")||name.includes("glucose")){
        return {
            sampleType:"Fluoride Plasma",
            normalValue:"70 - 99 mg/dL (Normal Fasting)",
            charge:150
        };
    }
    if(name.includes("ppbs")||name.includes("post prandial")){
        return {
            sampleType:"Fluoride Plasma",
            normalValue:"< 140 mg/dL",
            charge:150
        };
    }
    if(name.includes("hba1c")||name.includes("glycated")){
        return {
            sampleType:"Whole Blood (EDTA)",
            normalValue:"< 5.7% (Normal), 5.7-6.4% (Prediabetic)",
            charge:450
        };
    }
    if(name.includes("lipid")||name.includes("cholesterol")){
        return {
            sampleType:"Serum",
            normalValue:"Total Chol: < 200 mg/dL, Triglycerides: < 150 mg/dL, HDL: > 40 mg/dL",
            charge:400
        };
    }
    if(name.includes("urine")){
        return {
            sampleType:"Clean Catch Midstream Urine",
            normalValue:"Color: Pale Yellow, pH: 5.0-7.0, Protein: Nil, Sugar: Nil",
            charge:200
        };
    }
    if(name.includes("thyroid")||name.includes("tsh")||name.includes("t3")||name.includes("t4")){
        return {
            sampleType:"Serum",
            normalValue:"TSH: 0.4 - 4.2 µIU/mL, Free T4: 0.8 - 1.8 ng/dL",
            charge:500
        };
    }
    if(name.includes("lft")||name.includes("liver")){
        return {
            sampleType:"Serum",
            normalValue:"Total Bilirubin: 0.2-1.2 mg/dL, SGOT/AST: 8-40 U/L, SGPT/ALT: 7-56 U/L",
            charge:450
        };
    }
    if(name.includes("kft")||name.includes("kidney")||name.includes("renal")||name.includes("creatinine")){
        return {
            sampleType:"Serum",
            normalValue:"Serum Creatinine: 0.6-1.2 mg/dL, Blood Urea: 15-40 mg/dL",
            charge:400
        };
    }
    if(name.includes("x-ray")||name.includes("chest")||name.includes("radiology")){
        return {
            sampleType:"Radiology / Imaging",
            normalValue:"Clear lung fields, normal cardiothoracic ratio (<0.5), no active lesion",
            charge:350
        };
    }
    if(name.includes("hemoglobin")||name.includes("hb")){
        return {
            sampleType:"Whole Blood (EDTA)",
            normalValue:"Male: 13.5-17.5 g/dL, Female: 12.0-15.5 g/dL",
            charge:180
        };
    }
    if(name.includes("electrolyte")||name.includes("sodium")||name.includes("potassium")){
        return {
            sampleType:"Serum",
            normalValue:"Sodium: 135-145 mEq/L, Potassium: 3.5-5.0 mEq/L",
            charge:350
        };
    }

    return {
        sampleType:"Diagnostic Specimen",
        normalValue:"Standard Reference Range",
        charge:250
    };
}

/* ──────────────────────────────────────────────────────────
   STRUCTURED TEST PARAMETER SCHEMAS & CLINICAL VALIDATION
────────────────────────────────────────────────────────── */
const TEST_PARAM_SCHEMAS = {
    "lipid": {
        title: "Lipid Profile Panel",
        params: [
            { id: "totalChol", name: "Total Cholesterol", unit: "mg/dL", ref: "< 200 mg/dL", normalVal: 175, highVal: 245, min: 40, max: 1000 },
            { id: "triglycerides", name: "Triglycerides", unit: "mg/dL", ref: "< 150 mg/dL", normalVal: 125, highVal: 220, min: 20, max: 2000 },
            { id: "hdl", name: "HDL Cholesterol", unit: "mg/dL", ref: "> 40 mg/dL", normalVal: 48, highVal: 32, min: 10, max: 200 },
            { id: "ldl", name: "LDL Cholesterol", unit: "mg/dL", ref: "< 100 mg/dL", normalVal: 102, highVal: 168, min: 20, max: 800 }
        ]
    },
    "cbc": {
        title: "Complete Blood Count (CBC)",
        params: [
            { id: "hb", name: "Hemoglobin (Hb)", unit: "g/dL", ref: "12.0 - 16.0 g/dL", normalVal: 14.2, highVal: 8.5, min: 2.5, max: 25.0 },
            { id: "wbc", name: "Total WBC Count", unit: "×10³/µL", ref: "4.5 - 11.0 ×10³/µL", normalVal: 7.2, highVal: 15.8, min: 0.5, max: 100.0 },
            { id: "platelets", name: "Platelet Count", unit: "×10³/µL", ref: "150 - 450 ×10³/µL", normalVal: 260, highVal: 95, min: 10, max: 2000 },
            { id: "rbc", name: "RBC Count", unit: "×10⁶/µL", ref: "4.5 - 5.5 ×10⁶/µL", normalVal: 4.8, highVal: 3.2, min: 1.0, max: 10.0 }
        ]
    },
    "glucose": {
        title: "Fasting Blood Sugar / Glucose",
        params: [
            { id: "fbs", name: "Blood Glucose (Fasting)", unit: "mg/dL", ref: "70 - 99 mg/dL", normalVal: 88, highVal: 172, min: 30, max: 1000 }
        ]
    },
    "ppbs": {
        title: "Post Prandial Blood Sugar",
        params: [
            { id: "ppbs", name: "Blood Glucose (PP)", unit: "mg/dL", ref: "< 140 mg/dL", normalVal: 115, highVal: 220, min: 30, max: 1000 }
        ]
    },
    "hba1c": {
        title: "Glycated Hemoglobin (HbA1c)",
        params: [
            { id: "hba1c", name: "HbA1c", unit: "%", ref: "< 5.7%", normalVal: 5.2, highVal: 8.4, min: 3.0, max: 20.0 }
        ]
    },
    "urine": {
        title: "Urine Routine Examination",
        params: [
            { id: "urineColor", name: "Color & Appearance", unit: "Visual", ref: "Pale Yellow, Clear", normalVal: "Pale Yellow / Clear", highVal: "Turbid Amber", isText: true },
            { id: "urinePH", name: "pH", unit: "pH", ref: "5.0 - 7.0", normalVal: 6.0, highVal: 8.5, min: 4.0, max: 9.0 },
            { id: "urineProtein", name: "Protein / Albumin", unit: "Semi-quant", ref: "Nil", normalVal: "Nil", highVal: "2+ (Positive)", isText: true },
            { id: "urineSugar", name: "Sugar / Glucose", unit: "Semi-quant", ref: "Nil", normalVal: "Nil", highVal: "1+ (Positive)", isText: true },
            { id: "urinePus", name: "Pus Cells / WBC", unit: "/HPF", ref: "0 - 2 /HPF", normalVal: "1-2 /HPF", highVal: "15-20 /HPF", isText: true }
        ]
    },
    "thyroid": {
        title: "Thyroid Profile (TFT)",
        params: [
            { id: "tsh", name: "TSH", unit: "µIU/mL", ref: "0.4 - 4.2 µIU/mL", normalVal: 2.1, highVal: 8.6, min: 0.01, max: 150.0 },
            { id: "ft4", name: "Free T4", unit: "ng/dL", ref: "0.8 - 1.8 ng/dL", normalVal: 1.2, highVal: 0.5, min: 0.1, max: 20.0 }
        ]
    },
    "lft": {
        title: "Liver Function Test (LFT)",
        params: [
            { id: "bilirubin", name: "Total Bilirubin", unit: "mg/dL", ref: "0.2 - 1.2 mg/dL", normalVal: 0.7, highVal: 3.2, min: 0.1, max: 50.0 },
            { id: "sgot", name: "SGOT / AST", unit: "U/L", ref: "8 - 40 U/L", normalVal: 24, highVal: 110, min: 1, max: 2000 },
            { id: "sgpt", name: "SGPT / ALT", unit: "U/L", ref: "7 - 56 U/L", normalVal: 28, highVal: 145, min: 1, max: 2000 }
        ]
    },
    "kft": {
        title: "Kidney Function Test (KFT)",
        params: [
            { id: "creatinine", name: "Serum Creatinine", unit: "mg/dL", ref: "0.6 - 1.2 mg/dL", normalVal: 0.9, highVal: 2.8, min: 0.2, max: 30.0 },
            { id: "urea", name: "Blood Urea", unit: "mg/dL", ref: "15 - 40 mg/dL", normalVal: 26, highVal: 85, min: 2, max: 400 }
        ]
    },
    "hemoglobin": {
        title: "Hemoglobin (Hb)",
        params: [
            { id: "hb_single", name: "Hemoglobin", unit: "g/dL", ref: "12.0 - 16.0 g/dL", normalVal: 14.0, highVal: 8.2, min: 2.5, max: 25.0 }
        ]
    }
};

let currentActiveSchema = null;

function getTestSchema(testName) {
    const name = String(testName || "").toLowerCase();
    if (name.includes("lipid") || name.includes("cholesterol")) return TEST_PARAM_SCHEMAS["lipid"];
    if (name.includes("cbc") || name.includes("complete blood count") || name.includes("blood count")) return TEST_PARAM_SCHEMAS["cbc"];
    if (name.includes("ppbs") || name.includes("post prandial")) return TEST_PARAM_SCHEMAS["ppbs"];
    if (name.includes("fbs") || name.includes("fasting") || name.includes("glucose") || name.includes("sugar")) return TEST_PARAM_SCHEMAS["glucose"];
    if (name.includes("hba1c") || name.includes("glycated")) return TEST_PARAM_SCHEMAS["hba1c"];
    if (name.includes("urine")) return TEST_PARAM_SCHEMAS["urine"];
    if (name.includes("thyroid") || name.includes("tsh") || name.includes("t3") || name.includes("t4")) return TEST_PARAM_SCHEMAS["thyroid"];
    if (name.includes("lft") || name.includes("liver")) return TEST_PARAM_SCHEMAS["lft"];
    if (name.includes("kft") || name.includes("kidney") || name.includes("renal") || name.includes("creatinine")) return TEST_PARAM_SCHEMAS["kft"];
    if (name.includes("hemoglobin") || name.includes("hb")) return TEST_PARAM_SCHEMAS["hemoglobin"];
    return null;
}

function renderStructuredTestParams(testName) {
    const card = document.getElementById("structuredParamsCard");
    const list = document.getElementById("dynamicParamsList");
    const rawGroup = document.getElementById("rawActualReadingGroup");
    const actualReadingInput = document.getElementById("actualReading");

    clearValidationAlert();

    const schema = getTestSchema(testName);
    currentActiveSchema = schema;

    if (!card || !list) return;

    if (!schema) {
        card.style.display = "none";
        list.innerHTML = "";
        if (rawGroup) rawGroup.style.display = "block";
        if (actualReadingInput) {
            actualReadingInput.readOnly = false;
            actualReadingInput.placeholder = "Enter analyzer reading with units";
        }
        const label = document.getElementById("actualReadingLabel");
        if (label) label.textContent = "Actual Reading";
        return;
    }

    card.style.display = "block";
    if (rawGroup && actualReadingInput) {
        actualReadingInput.readOnly = true;
        actualReadingInput.placeholder = "Auto-compiled from component parameters above";
        const label = document.getElementById("actualReadingLabel");
        if (label) label.textContent = "Compiled Reading Summary";
    }

    list.innerHTML = schema.params.map(p => `
        <div class="param-row">
            <div class="param-meta">
                <span class="param-name">${escapeHtml(p.name)}</span>
                <span class="param-ref">Ref: ${escapeHtml(p.ref)}</span>
            </div>
            <div>
                <input
                    type="${p.isText ? 'text' : 'number'}"
                    step="any"
                    id="param_${p.id}"
                    class="param-input"
                    data-param-id="${p.id}"
                    placeholder="${p.isText ? p.ref : 'e.g. ' + p.normalVal}"
                    oninput="onParamInputChange()"
                >
            </div>
            <div>
                <span class="param-unit-badge">${escapeHtml(p.unit)}</span>
            </div>
        </div>
    `).join("");
}

function onParamInputChange() {
    clearValidationAlert();
    syncParamsToActualReading();
}

function syncParamsToActualReading() {
    if (!currentActiveSchema) return;
    const parts = [];
    currentActiveSchema.params.forEach(p => {
        const input = document.getElementById(`param_${p.id}`);
        const val = input ? input.value.trim() : "";
        if (val) {
            parts.push(`${p.name}: ${val} ${p.unit}`);
        }
    });
    const actualReadingInput = document.getElementById("actualReading");
    if (actualReadingInput) {
        actualReadingInput.value = parts.join(", ");
    }
}

function fillTestPreset(type) {
    if (!currentActiveSchema) return;
    clearValidationAlert();
    currentActiveSchema.params.forEach(p => {
        const input = document.getElementById(`param_${p.id}`);
        if (input) {
            input.value = (type === 'high') ? p.highVal : p.normalVal;
        }
    });
    syncParamsToActualReading();

    const remarksArea = document.getElementById("remarks");
    if (remarksArea) {
        if (type === 'normal') {
            remarksArea.value = "All measured parameters are within healthy biological reference intervals.";
        } else {
            remarksArea.value = "Elevated/abnormal parameters noted. Clinical correlation and follow-up recommended.";
        }
    }
}

function clearTestParams() {
    clearValidationAlert();
    if (currentActiveSchema) {
        currentActiveSchema.params.forEach(p => {
            const input = document.getElementById(`param_${p.id}`);
            if (input) input.value = "";
        });
    }
    const actualReadingInput = document.getElementById("actualReading");
    if (actualReadingInput) actualReadingInput.value = "";
    const remarksArea = document.getElementById("remarks");
    if (remarksArea) remarksArea.value = "";
}

function showValidationAlert(message, inputElement) {
    const banner = document.getElementById("validationAlertBanner");
    const msgSpan = document.getElementById("validationAlertMessage");
    if (banner && msgSpan) {
        msgSpan.textContent = message;
        banner.style.display = "block";
        banner.scrollIntoView({ behavior: "smooth", block: "center" });
    } else {
        alert(message);
    }
    if (inputElement) {
        inputElement.classList.add("is-invalid");
        inputElement.focus();
    }
}

function clearValidationAlert() {
    const banner = document.getElementById("validationAlertBanner");
    if (banner) banner.style.display = "none";
    document.querySelectorAll(".param-input, #actualReading").forEach(el => el.classList.remove("is-invalid"));
}

function validateTestReadings(testName) {
    clearValidationAlert();
    const schema = currentActiveSchema || getTestSchema(testName);

    if (schema) {
        for (const p of schema.params) {
            const input = document.getElementById(`param_${p.id}`);
            if (!input) continue;
            const val = input.value.trim();

            if (!val) {
                showValidationAlert(`Please enter a measured value for "${p.name}".`, input);
                return false;
            }

            if (!p.isText) {
                const num = parseFloat(val);
                if (isNaN(num)) {
                    showValidationAlert(`"${p.name}" must be a valid numeric measurement.`, input);
                    return false;
                }
                // STRICT CHECK: 0 is completely invalid for clinical analyzer readings
                if (num <= 0) {
                    showValidationAlert(`Validation Error: "${p.name}" cannot be 0 or negative. An analyzer reading must be greater than 0 ${p.unit}.`, input);
                    return false;
                }
                if (p.min !== undefined && num < p.min) {
                    showValidationAlert(`Value for "${p.name}" (${num}) is implausibly low. Minimum clinical threshold is ${p.min} ${p.unit}.`, input);
                    return false;
                }
                if (p.max !== undefined && num > p.max) {
                    showValidationAlert(`Value for "${p.name}" (${num}) is implausibly high. Maximum clinical threshold is ${p.max} ${p.unit}.`, input);
                    return false;
                }
            }
        }
        return true;
    } else {
        // Freeform / raw actual reading validation
        const input = document.getElementById("actualReading");
        const val = input ? input.value.trim() : "";

        if (!val) {
            showValidationAlert("Please enter the actual reading.", input);
            return false;
        }

        // Strict 0 check
        if (val === "0" || val === "0.0" || (!isNaN(val) && Number(val) === 0)) {
            showValidationAlert("Validation Error: Actual reading cannot be 0. A valid clinical reading must be greater than 0.", input);
            return false;
        }

        if (!isNaN(val) && Number(val) < 0) {
            showValidationAlert("Validation Error: Actual reading cannot be negative.", input);
            return false;
        }

        return true;
    }
}

function syncWithDoctorOrders(){
    const sharedOrders=getStorage(CMS_KEYS.LAB_ORDERS,[]);
    const patients=getStorage(CMS_KEYS.PATIENTS,[]);

    orders=sharedOrders.flatMap(shared=>{
        const orderId=shared.labOrderId||shared.id;
        const testNames=Array.isArray(shared.tests)&&shared.tests.length
            ?shared.tests
            :[shared.testName||"Clinical Diagnostic Test"];
        const patient=patients.find(item=>String(item.patientId)===String(shared.patientId));
        const testStatuses=Array.isArray(shared.testStatuses)?shared.testStatuses:[];

        return testNames.map((testName,index)=>{
            let masterMatch=testMaster.find(
                test=>String(test.testName).toLowerCase()===String(testName).toLowerCase()
            );
            const standardMeta=getStandardTestMeta(testName);

            if(!masterMatch){
                masterMatch={
                    testId:"LT"+(100+testMaster.length+1),
                    testName:testName,
                    sampleType:standardMeta.sampleType,
                    normalValue:standardMeta.normalValue,
                    charge:standardMeta.charge
                };
                testMaster.push(masterMatch);
                setStorage(TEST_MASTER_KEY,testMaster);
            }else if(!masterMatch.normalValue||masterMatch.normalValue.includes("Reference Normal")||masterMatch.normalValue==="Standard Reference Range"){
                masterMatch.normalValue=standardMeta.normalValue;
                masterMatch.sampleType=standardMeta.sampleType;
                setStorage(TEST_MASTER_KEY,testMaster);
            }

            return {
                id:testNames.length>1?`${orderId}-${index+1}`:orderId,
                labOrderId:orderId,
                patientId:shared.patientId||"",
                patient:shared.patientName||patient?.name||"Patient",
                doctorId:shared.doctorId||"",
                doctorName:shared.doctorName||"",
                testId:masterMatch.testId,
                status:testStatuses[index]||shared.status||"Pending",
                date:shared.date||"",
                remarks:shared.remarks||""
            };
        });
    });
}

function loadData(){
    syncWithDoctorOrders();
    reports=getStorage(CMS_KEYS.LAB_REPORTS,[]);
    bills=getStorage(CMS_KEYS.BILLS,[]).filter(bill=>bill.source==="Lab");

    const doctorNameLabel=
        document.getElementById("assignedDoctorName");

    if(doctorNameLabel){
        doctorNameLabel.textContent="Doctor: "+(orders[0]?.doctorName||getAvailableDoctorName());
    }

    saveData();
}

function saveData(){
    const sharedOrders=getStorage(CMS_KEYS.LAB_ORDERS,[]);

    sharedOrders.forEach(shared=>{
        const orderId=String(shared.labOrderId||shared.id);
        const relatedOrders=orders.filter(
            order=>String(order.labOrderId||order.id)===orderId
        );

        if(!relatedOrders.length){
            return;
        }

        const statuses=relatedOrders.map(order=>order.status);
        shared.testStatuses=statuses;
        shared.status=statuses.every(status=>status==="Completed")
            ?"Completed"
            :statuses.every(status=>status==="Cancelled")
                ?"Cancelled"
                :statuses.some(status=>status!=="Pending")
                    ?"In Progress"
                    :"Pending";
    });

    setStorage(CMS_KEYS.LAB_ORDERS,sharedOrders);
    setStorage(CMS_KEYS.LAB_REPORTS,reports);

    const allBills=getStorage(CMS_KEYS.BILLS,[]);
    const otherBills=allBills.filter(bill=>bill.source!=="Lab");
    setStorage(CMS_KEYS.BILLS,[...otherBills,...bills]);
}

function escapeHtml(value){
    return String(value??"").replace(
        /[&<>"']/g,
        character=>({
            "&":"&amp;",
            "<":"&lt;",
            ">":"&gt;",
            '"':"&quot;",
            "'":"&#39;"
        })[character]
    );
}

function statusClass(status){
    const value=String(status).toLowerCase();

    if(value==="completed"){
        return "badge-completed";
    }

    if(value==="in progress"){
        return "badge-in-progress";
    }

    if(value==="cancelled"){
        return "badge-cancelled";
    }

    return "badge-scheduled";
}

function renderOrders(){
    const tableBody=document.getElementById("ordersList");

    if(!tableBody){
        return;
    }

    if(orders.length===0){
        tableBody.innerHTML=`
            <tr>
                <td colspan="8">
                    No lab tests available
                </td>
            </tr>
        `;
        return;
    }

    tableBody.innerHTML=orders.map(order=>{
        const test=getTestDetails(order.testId);

        return `
            <tr>
                <td>${escapeHtml(order.id)}</td>
                <td>${escapeHtml(order.patientId)}</td>
                <td>${escapeHtml(order.doctorId)}</td>
                <td>${escapeHtml(order.doctorName)}</td>
                <td>${escapeHtml(test?.testName||"Test unavailable")}</td>
                <td>${escapeHtml(test?.sampleType||"")}</td>
                <td>
                    <span class="badge ${statusClass(order.status)}">
                        ${escapeHtml(order.status)}
                    </span>
                </td>
                <td>
                    ${
                        order.status==="Completed"
                        ?
                        `<button
                            class="btn btn-outline btn-sm"
                            onclick="viewReport('${order.id}')">
                            View Report
                        </button>`
                        :
                        `<button
                            class="btn btn-primary btn-sm"
                            onclick="processTest('${order.id}')">
                            ${
                                order.status==="Pending"
                                ?"Process"
                                :"Continue"
                            }
                        </button>`
                    }
                </td>
            </tr>
        `;
    }).join("");
}

function renderQueues(){
    const pendingQueue=document.getElementById("pendingQueue");
    const progressQueue=document.getElementById("progressQueue");
    const completedQueue=document.getElementById("completedQueue");

    if(!pendingQueue||!progressQueue||!completedQueue){
        return;
    }

    const pending=orders.filter(
        order=>order.status==="Pending"
    );

    const progress=orders.filter(
        order=>order.status==="In Progress"
    );

    const completed=orders.filter(
        order=>order.status==="Completed"
    );

    if(pending.length===0){
        pendingQueue.innerHTML=`
            <tr>
                <td colspan="6">
                    No pending tests.
                </td>
            </tr>
        `;
    }else{
        pendingQueue.innerHTML=pending.map(order=>{
            const test=getTestDetails(order.testId);

            return `
                <tr>
                    <td>${escapeHtml(order.id)}</td>
                    <td>${escapeHtml(order.patientId)}</td>
                    <td>${escapeHtml(order.patient)}</td>
                    <td>${escapeHtml(order.doctorName)}</td>
                    <td>${escapeHtml(test?.testName||"")}</td>
                    <td>
                        <button
                            class="btn btn-primary btn-sm"
                            onclick="processTest('${order.id}')">
                            Process
                        </button>
                    </td>
                </tr>
            `;
        }).join("");
    }

    if(progress.length===0){
        progressQueue.innerHTML=`
            <tr>
                <td colspan="6">
                    No tests in progress.
                </td>
            </tr>
        `;
    }else{
        progressQueue.innerHTML=progress.map(order=>{
            const test=getTestDetails(order.testId);

            return `
                <tr>
                    <td>${escapeHtml(order.id)}</td>
                    <td>${escapeHtml(order.patientId)}</td>
                    <td>${escapeHtml(order.patient)}</td>
                    <td>${escapeHtml(order.doctorName)}</td>
                    <td>${escapeHtml(test?.testName||"")}</td>
                    <td>
                        <button
                            class="btn btn-primary btn-sm"
                            onclick="processTest('${order.id}')">
                            Continue
                        </button>
                    </td>
                </tr>
            `;
        }).join("");
    }

    if(completed.length===0){
        completedQueue.innerHTML=`
            <tr>
                <td colspan="6">
                    No completed tests.
                </td>
            </tr>
        `;
    }else{
        completedQueue.innerHTML=completed.map(order=>{
            const test=getTestDetails(order.testId);

            return `
                <tr>
                    <td>${escapeHtml(order.id)}</td>
                    <td>${escapeHtml(order.patientId)}</td>
                    <td>${escapeHtml(order.patient)}</td>
                    <td>${escapeHtml(order.doctorName)}</td>
                    <td>${escapeHtml(test?.testName||"")}</td>
                    <td>
                        <button
                            class="btn btn-outline btn-sm"
                            onclick="viewReport('${order.id}')">
                            View Report
                        </button>
                    </td>
                </tr>
            `;
        }).join("");
    }
}

function processTest(id){
    const order=orders.find(
        item=>String(item.id)===String(id)
    );

    if(!order){
        alert("Lab test not found.");
        return;
    }

    const test=getTestDetails(order.testId);

    if(!test){
        alert("Test details are not available.");
        return;
    }

    document.getElementById("testId").value=order.id;
    document.getElementById("patientId").value=order.patientId;
    document.getElementById("patientName").value=order.patient;
    document.getElementById("doctorId").value=order.doctorId||"DOC-101";
    document.getElementById("doctorName").value=order.doctorName||"Dr. Prateek Pradeep";
    document.getElementById("testName").value=test.testName;
    document.getElementById("sampleType").value=test.sampleType;
    document.getElementById("normalValue").value=test.normalValue;

    renderStructuredTestParams(test.testName);

    const existingReport=reports.find(
        report=>String(report.testId)===String(order.id)
    );

    if(existingReport){
        if(currentActiveSchema && existingReport.results && existingReport.results.length > 0){
            existingReport.results.forEach(r => {
                const matched = currentActiveSchema.params.find(p => p.name.toLowerCase() === (r.test||"").toLowerCase());
                if(matched){
                    const el = document.getElementById(`param_${matched.id}`);
                    if(el){
                        const clean = String(r.reading).replace(/[^\d.-]/g, '');
                        el.value = clean || r.reading;
                    }
                }
            });
            syncParamsToActualReading();
        } else {
            const rawInp = document.getElementById("actualReading");
            if(rawInp) rawInp.value = existingReport.actualReading||"";
        }

        const remarksArea = document.getElementById("remarks");
        if(remarksArea) remarksArea.value = existingReport.remarks||"";
    }else{
        clearTestParams();
    }

    if(order.status==="Pending"){
        order.status="In Progress";
        saveData();
    }

    renderOrders();
    renderQueues();
    updateDashboard();

    showSection("patient");

    const processFormCard=
        document.getElementById("processFormCard");

    if(processFormCard){
        processFormCard.style.display="block";
    }

    setTimeout(()=>{
        if(processFormCard){
            processFormCard.scrollIntoView({
                behavior:"smooth",
                block:"start"
            });
        }
        if(currentActiveSchema && currentActiveSchema.params.length > 0){
            const firstParam = document.getElementById(`param_${currentActiveSchema.params[0].id}`);
            if(firstParam) firstParam.focus();
        } else {
            const input = document.getElementById("actualReading");
            if(input) input.focus();
        }
    }, 120);
}

document.getElementById("patientForm")
.addEventListener("submit",function(event){

    event.preventDefault();

    const testId=document.getElementById("testId").value.trim();

    const order=orders.find(
        item=>String(item.id)===String(testId)
    );

    if(!order){
        alert("Lab test not found.");
        return;
    }

    const test=getTestDetails(order.testId);

    if(!test){
        alert("Test details not found.");
        return;
    }

    // STRICT CLINICAL VALIDATION (Cannot be 0, blank, negative, or implausible)
    if(!validateTestReadings(test.testName)){
        return;
    }

    let actualReading = document.getElementById("actualReading").value.trim();
    let detailedResults = [];

    const schema = currentActiveSchema || getTestSchema(test.testName);
    if(schema){
        detailedResults = schema.params.map(p => {
            const input = document.getElementById(`param_${p.id}`);
            const val = input ? input.value.trim() : "";
            return {
                test: p.name,
                sampleType: test.sampleType,
                normalValue: p.ref,
                reading: p.isText ? val : `${val} ${p.unit}`
            };
        });
        actualReading = detailedResults.map(r => `${r.test}: ${r.reading}`).join(", ");
    }

    const now=new Date();
    const editedNormal=document.getElementById("normalValue") ? document.getElementById("normalValue").value.trim() : "";
    const effectiveNormal=editedNormal || test.normalValue || "Standard Reference Range";

    // Update master test normalValue if technician edited it
    if(editedNormal && editedNormal !== test.normalValue){
        test.normalValue = editedNormal;
        try {
            setStorage(TEST_MASTER_KEY,testMaster);
        } catch(e){}
    }

    const report={
        reportId:Date.now(),
        completedAt:Date.now(),
        testId:order.id,
        labOrderId:order.labOrderId||order.id,
        patientId:order.patientId,
        patientName:order.patient,
        doctorId:order.doctorId||"DOC-101",
        doctorName:order.doctorName||"Dr. Prateek Pradeep",
        testName:test.testName,
        sampleType:test.sampleType,
        normalValue:effectiveNormal,
        actualReading:actualReading,
        results:detailedResults.length > 0 ? detailedResults : null,
        remarks:
            document.getElementById("remarks")
            .value
            .trim(),
        date:now.toLocaleDateString(),
        time:now.toLocaleTimeString(),
        technicianName:"Malathi Sreekumar (Lab Technician)"
    };

    const existingReport=reports.find(
        item=>String(item.testId)===String(testId)
    );

    if(existingReport){
        Object.assign(
            existingReport,
            report
        );
    }else{
        reports.unshift(report);
    }

    order.status="Completed";

    saveData();

    renderOrders();
    renderQueues();
    renderReports();
    updateDashboard();

    alert("Lab report completed and sent to Doctor for viewing.");

    clearProcessForm();

    showSection(
        "billing",
        order.id
    );
});

function clearProcessForm(){
    document.getElementById("patientForm").reset();
    document.getElementById("testId").value="";
    clearValidationAlert();
    clearTestParams();
}

function renderReports(){
    const container=
        document.getElementById("reportsContainer");

    if(!container){
        return;
    }

    if(reports.length===0){
        container.innerHTML=
            "<p>No reports available.</p>";

        return;
    }

    const sortedReports = [...reports].sort((a, b) => {
        const timeA = Number(a.completedAt || a.reportId) || 0;
        const timeB = Number(b.completedAt || b.reportId) || 0;
        return timeB - timeA;
    });

    container.innerHTML=
        sortedReports.map(report=>`

        <div class="card">

            <div class="card-header">

                <div>

                    <h3 class="card-title">
                        CarePoint Clinic
                    </h3>

                    <p class="page-subtitle">
                        Laboratory Report
                    </p>

                </div>

                <div>

                    <strong>Date:</strong>
                    ${escapeHtml(report.date)}

                    <br>

                    <strong>Time:</strong>
                    ${escapeHtml(report.time)}

                </div>

            </div>

            <div class="card-body">

                <div class="form-row">

                    <div>

                        <strong>
                            Patient ID:
                        </strong>

                        ${escapeHtml(report.patientId)}

                        <br>

                        <strong>
                            Patient Name:
                        </strong>

                        ${escapeHtml(report.patientName)}

                    </div>

                    <div>

                        <strong>
                            Doctor ID:
                        </strong>

                        ${escapeHtml(report.doctorId)}

                        <br>

                        <strong>
                            Doctor Name:
                        </strong>

                        ${escapeHtml(report.doctorName)}

                    </div>

                </div>

                <div class="section-divider"></div>

                <div class="table-responsive">

                    <table class="table">

                        <thead>

                            <tr>

                                <th>
                                    Test Name
                                </th>

                                <th>
                                    Normal Value
                                </th>

                                <th>
                                    Actual Reading
                                </th>

                            </tr>

                        </thead>

                        <tbody>

                            ${report.results && report.results.length > 0 ? report.results.map(r => `
                                <tr>
                                    <td><strong>${escapeHtml(r.test || report.testName)}</strong></td>
                                    <td>${escapeHtml(r.normalValue || report.normalValue)}</td>
                                    <td style="font-weight:700;color:var(--primary);">${escapeHtml(r.reading)}</td>
                                </tr>
                            `).join("") : `
                                <tr>
                                    <td>${escapeHtml(report.testName)}</td>
                                    <td>${escapeHtml(report.normalValue)}</td>
                                    <td style="font-weight:700;">${escapeHtml(report.actualReading)}</td>
                                </tr>
                            `}

                        </tbody>

                    </table>

                </div>

                <div class="form-group">

                    <label class="form-label">
                        Remarks
                    </label>

                    <p>
                        ${escapeHtml(
                            report.remarks||"No remarks"
                        )}
                    </p>

                </div>

            </div>

        </div>

    `).join("");
}

function viewReport(testId){

    const report=reports.find(
        item=>String(item.testId)===String(testId)
    );

    if(!report){
        alert("Report not found.");
        return;
    }

    showSection("reports");

    setTimeout(()=>{

        const reportCards=
            document.querySelectorAll(
                "#reportsContainer .card"
            );

        const index=reports.findIndex(
            item=>String(item.testId)===String(testId)
        );

        if(reportCards[index]){
            reportCards[index].scrollIntoView({
                behavior:"smooth",
                block:"start"
            });
        }

    },100);
}

function loadBillingTests(selectedTestId=null){

    const select=
        document.getElementById("billingTestId");

    if(!select){
        return;
    }

    const completedOrders=
        orders.filter(
            order=>order.status==="Completed"
        );

    select.innerHTML=`
        <option value="">
            Select Completed Test
        </option>
    `;

    completedOrders.forEach(order=>{

        const alreadyBilled=
            bills.some(
                bill=>
                    String(bill.testId)===
                    String(order.id)
            );

        if(!alreadyBilled){

            const test=
                getTestDetails(order.testId);

            select.innerHTML+=`
                <option value="${order.id}">
                    ${escapeHtml(order.id)}
                    -
                    ${escapeHtml(test?.testName||"")}
                    -
                    ${escapeHtml(order.patient)}
                </option>
            `;
        }

    });

    if(selectedTestId){
        select.value=selectedTestId;
        loadBillingDetails();
    }
}

function loadBillingDetails(){

    const testId=document.getElementById("billingTestId").value.trim();

    if(!testId){

        document.getElementById(
            "billingPatientId"
        ).value="";

        document.getElementById(
            "billingTestName"
        ).value="";

        document.getElementById(
            "testCharge"
        ).value="";

        document.getElementById(
            "paymentStatus"
        ).value="Pending";

        return;
    }

    const order=orders.find(
        item=>String(item.id)===String(testId)
    );

    if(!order){
        return;
    }

    const test=
        getTestDetails(order.testId);

    if(!test){
        return;
    }

    document.getElementById(
        "billingPatientId"
    ).value=order.patientId;

    document.getElementById(
        "billingTestName"
    ).value=test.testName;

    document.getElementById(
        "testCharge"
    ).value="₹"+test.charge;

    const existingBill=bills.find(
        bill=>String(bill.testId)===String(testId)
    );

    document.getElementById(
        "paymentStatus"
    ).value=
        existingBill
        ?existingBill.status
        :"Pending";
}

function createBill(){

    const testId=document.getElementById("billingTestId").value.trim();

    if(!testId){
        alert("Please select a completed test.");
        return;
    }

    const order=orders.find(
        item=>String(item.id)===String(testId)
    );

    if(!order){
        alert("Test not found.");
        return;
    }

    const test=
        getTestDetails(order.testId);

    if(!test){
        alert("Test details not found.");
        return;
    }

    const existingBill=bills.find(
        bill=>String(bill.testId)===String(testId)
    );

    if(existingBill){
        alert("Bill already created for this test.");
        return;
    }

    const bill={
        id:Date.now().toString(),
        billId:Date.now(),
        testId:order.id,
        patientId:order.patientId,
        patientName:order.patient||order.patientName,
        testName:test.testName,
        source:"Lab",
        amount:test.charge,
        status:"Pending",
        date:new Date().toISOString().split("T")[0]
    };

    bills.push(bill);

    saveData();

    renderBills();
    loadBillingTests();

    document.getElementById(
        "billingPatientId"
    ).value="";

    document.getElementById(
        "billingTestName"
    ).value="";

    document.getElementById(
        "testCharge"
    ).value="";

    document.getElementById(
        "paymentStatus"
    ).value="Pending";

    document.getElementById(
        "billingTestId"
    ).value="";

    alert(
        "Bill created successfully and sent to receptionist."
    );
}

function renderBills(){

    const tableBody=
        document.getElementById("billingList");

    if(!tableBody){
        return;
    }

    const centralBills=JSON.parse(localStorage.getItem(CMS_KEYS.BILLS))||[];
    const labBills=centralBills.filter(bill=>bill.source==="Lab");

    if(labBills.length===0){

        tableBody.innerHTML=`
            <tr>
                <td colspan="5">
                    No bills available.
                </td>
            </tr>
        `;

        return;
    }

    tableBody.innerHTML=
        labBills.map(bill=>`

        <tr>

            <td>
                ${escapeHtml(bill.billId||bill.id)}
            </td>

            <td>
                ${escapeHtml(bill.patientId||"--")}
            </td>

            <td>
                ${escapeHtml(bill.testName||"--")}
            </td>

            <td>
                ₹${escapeHtml(bill.amount)}
            </td>

            <td>

                <span class="badge ${
                    bill.status==="Paid"
                    ?"badge-completed"
                    :"badge-scheduled"
                }">

                    ${escapeHtml(bill.status)}

                </span>

            </td>

        </tr>

    `).join("");
}

function updateDashboard(){

    const totalTests=
        document.getElementById("totalTests");

    const pendingTests=
        document.getElementById("pendingTests");

    const progressTests=
        document.getElementById("progressTests");

    const completedTests=
        document.getElementById("completedTests");

    const totalReports=
        document.getElementById("totalReports");

    if(totalTests){
        totalTests.textContent=orders.length;
    }

    if(pendingTests){
        pendingTests.textContent=
            orders.filter(
                order=>order.status==="Pending"
            ).length;
    }

    if(progressTests){
        progressTests.textContent=
            orders.filter(
                order=>order.status==="In Progress"
            ).length;
    }

    if(completedTests){
        completedTests.textContent=
            orders.filter(
                order=>order.status==="Completed"
            ).length;
    }

    if(totalReports){
        totalReports.textContent=reports.length;
    }
}

function showSection(
    section,
    selectedTestId=null
){

    const ordersSection=
        document.getElementById("ordersSection");

    const patientSection=
        document.getElementById("patientSection");

    const reportsSection=
        document.getElementById("reportsSection");

    const billingSection=
        document.getElementById("billingSection");

    const processFormCard=
        document.getElementById("processFormCard");

    const progressQueueCard=
        document.getElementById("progressQueueCard");

    const completedQueueCard=
        document.getElementById("completedQueueCard");

    document.querySelectorAll(".lab-nav-item").forEach(button=>{
        button.classList.toggle(
            "active",
            button.dataset.section===section
        );
    });

    if(ordersSection){
        ordersSection.style.display="none";
    }

    if(patientSection){
        patientSection.style.display="none";
    }

    if(reportsSection){
        reportsSection.style.display="none";
    }

    if(billingSection){
        billingSection.style.display="none";
    }

    if(processFormCard){
        processFormCard.style.display="none";
    }

    if(progressQueueCard){
        progressQueueCard.style.display=
            section==="orders"?"block":"none";
    }

    if(completedQueueCard){
        completedQueueCard.style.display=
            section==="orders"?"block":"none";
    }

    if(section==="orders"){

        ordersSection.style.display="block";
        patientSection.style.display="block";

        renderOrders();
        renderQueues();

    }else if(section==="patient"){

        patientSection.style.display="block";

        renderQueues();

    }else if(section==="reports"){

        reportsSection.style.display="block";

        renderReports();

    }else if(section==="billing"){

        billingSection.style.display="block";

        loadBillingTests(
            selectedTestId
        );

        renderBills();
    }
}

window.addEventListener(
    "focus",
    function(){

        loadTestMaster();

        loadData();

        renderOrders();

        renderQueues();

        renderReports();

        renderBills();

        updateDashboard();

    }
);

loadTestMaster();

loadData();

renderOrders();

renderQueues();

renderReports();

renderBills();

updateDashboard();

showSection("orders");