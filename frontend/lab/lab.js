const STORAGE_KEY="lab-technician-demo-v4";
const TEST_MASTER_KEY="lab-test-master";
const SHARED_REPORTS_KEY="cms_lab_reports";
const SHARED_BILLS_KEY="cms_lab_bills";

let orders=[];
let reports=[];
let bills=[];
let testMaster=[];

const defaultTestMaster=[
    {
        testId:"LT001",
        testName:"Blood Count",
        sampleType:"Blood",
        normalValue:"4.5-5.5 million/µL",
        charge:300
    },
    {
        testId:"LT002",
        testName:"Glucose",
        sampleType:"Blood",
        normalValue:"70-100 mg/dL",
        charge:150
    },
    {
        testId:"LT003",
        testName:"Urine Test",
        sampleType:"Urine",
        normalValue:"Normal",
        charge:200
    },
    {
        testId:"LT004",
        testName:"Hemoglobin",
        sampleType:"Blood",
        normalValue:"12-16 g/dL",
        charge:180
    },
    {
        testId:"LT005",
        testName:"Cholesterol",
        sampleType:"Blood",
        normalValue:"Below 200 mg/dL",
        charge:400
    },
    {
        testId:"LT006",
        testName:"Thyroid",
        sampleType:"Blood",
        normalValue:"0.4-4.0 mIU/L",
        charge:500
    }
];

const defaultData={
    orders:[
        {
            id:101,
            patientId:"P001",
            patient:"Anu Kumar",
            doctorId:"D001",
            doctorName:"Dr. Arun",
            testId:"LT001",
            status:"Pending"
        },
        {
            id:102,
            patientId:"P002",
            patient:"Rahul Menon",
            doctorId:"D002",
            doctorName:"Dr. Priya",
            testId:"LT002",
            status:"Pending"
        },
        {
            id:103,
            patientId:"P003",
            patient:"Meera Das",
            doctorId:"D001",
            doctorName:"Dr. Arun",
            testId:"LT003",
            status:"Pending"
        },
        {
            id:104,
            patientId:"P004",
            patient:"Kiran Raj",
            doctorId:"D003",
            doctorName:"Dr. Kumar",
            testId:"LT004",
            status:"Pending"
        },
        {
            id:105,
            patientId:"P005",
            patient:"Divya Nair",
            doctorId:"D002",
            doctorName:"Dr. Priya",
            testId:"LT005",
            status:"In Progress"
        },
        {
            id:106,
            patientId:"P006",
            patient:"Vishnu S",
            doctorId:"D003",
            doctorName:"Dr. Kumar",
            testId:"LT006",
            status:"In Progress"
        },
        {
            id:107,
            patientId:"P007",
            patient:"Lakshmi P",
            doctorId:"D001",
            doctorName:"Dr. Arun",
            testId:"LT001",
            status:"In Progress"
        },
        {
            id:108,
            patientId:"P008",
            patient:"Akhil Kumar",
            doctorId:"D002",
            doctorName:"Dr. Priya",
            testId:"LT002",
            status:"Completed"
        },
        {
            id:109,
            patientId:"P009",
            patient:"Sneha Raj",
            doctorId:"D003",
            doctorName:"Dr. Kumar",
            testId:"LT003",
            status:"Completed"
        },
        {
            id:110,
            patientId:"P010",
            patient:"Manu Thomas",
            doctorId:"D001",
            doctorName:"Dr. Arun",
            testId:"LT004",
            status:"Completed"
        }
    ],

    reports:[
        {
            reportId:1001,
            testId:108,
            patientId:"P008",
            patientName:"Akhil Kumar",
            doctorId:"D002",
            doctorName:"Dr. Priya",
            testName:"Glucose",
            sampleType:"Blood",
            normalValue:"70-100 mg/dL",
            actualReading:"92 mg/dL",
            remarks:"Reading is within the normal range.",
            date:"29/09/2026",
            time:"09:30 AM"
        },
        {
            reportId:1002,
            testId:109,
            patientId:"P009",
            patientName:"Sneha Raj",
            doctorId:"D003",
            doctorName:"Dr. Kumar",
            testName:"Urine Test",
            sampleType:"Urine",
            normalValue:"Normal",
            actualReading:"Normal",
            remarks:"No abnormality detected.",
            date:"29/09/2026",
            time:"10:15 AM"
        },
        {
            reportId:1003,
            testId:110,
            patientId:"P010",
            patientName:"Manu Thomas",
            doctorId:"D001",
            doctorName:"Dr. Arun",
            testName:"Hemoglobin",
            sampleType:"Blood",
            normalValue:"12-16 g/dL",
            actualReading:"14.2 g/dL",
            remarks:"Hemoglobin level is normal.",
            date:"29/09/2026",
            time:"11:00 AM"
        }
    ],

    bills:[]
};

function loadTestMaster(){
    const savedMaster=localStorage.getItem(TEST_MASTER_KEY);

    if(savedMaster){
        testMaster=JSON.parse(savedMaster);
    }else{
        testMaster=JSON.parse(
            JSON.stringify(defaultTestMaster)
        );

        localStorage.setItem(
            TEST_MASTER_KEY,
            JSON.stringify(testMaster)
        );
    }
}

function getTestDetails(testId){
    return testMaster.find(
        test=>String(test.testId)===String(testId)
    );
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
        return "Dr. Jane Smith";
    }

    return "Dr. Jane Smith";
}

function loadData(){
    const savedData=localStorage.getItem(STORAGE_KEY);

    if(savedData){
        const data=JSON.parse(savedData);

        orders=data.orders||[];
        reports=data.reports||[];
        bills=data.bills||[];
    }else{
        orders=JSON.parse(
            JSON.stringify(defaultData.orders)
        );

        reports=JSON.parse(
            JSON.stringify(defaultData.reports)
        );

        bills=[];

        saveData();
    }

    const doctorName=getAvailableDoctorName();

    orders.forEach(order=>{
        order.doctorName=doctorName;
    });

    reports.forEach(report=>{
        report.doctorName=doctorName;
    });

    const doctorNameLabel=
        document.getElementById("assignedDoctorName");

    if(doctorNameLabel){
        doctorNameLabel.textContent="Doctor: "+doctorName;
    }

    saveData();
}

function saveData(){
    localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({
            orders:orders,
            reports:reports,
            bills:bills
        })
    );

    syncSharedRecords();
}

function syncSharedRecords(){
    localStorage.setItem(
        SHARED_REPORTS_KEY,
        JSON.stringify(reports)
    );

    localStorage.setItem(
        SHARED_BILLS_KEY,
        JSON.stringify(bills)
    );
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
                            onclick="viewReport(${order.id})">
                            View Report
                        </button>`
                        :
                        `<button
                            class="btn btn-primary btn-sm"
                            onclick="processTest(${order.id})">
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
                            onclick="processTest(${order.id})">
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
                            onclick="processTest(${order.id})">
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
                            onclick="viewReport(${order.id})">
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
        item=>Number(item.id)===Number(id)
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
    document.getElementById("doctorId").value=order.doctorId;
    document.getElementById("doctorName").value=order.doctorName;
    document.getElementById("testName").value=test.testName;
    document.getElementById("sampleType").value=test.sampleType;
    document.getElementById("normalValue").value=test.normalValue;

    const existingReport=reports.find(
        report=>Number(report.testId)===Number(order.id)
    );

    if(existingReport){
        document.getElementById("actualReading").value=
            existingReport.actualReading||"";

        document.getElementById("remarks").value=
            existingReport.remarks||"";
    }else{
        document.getElementById("actualReading").value="";
        document.getElementById("remarks").value="";
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

    processFormCard
        .scrollIntoView({
            behavior:"smooth",
            block:"start"
        });
}

document.getElementById("patientForm")
.addEventListener("submit",function(event){

    event.preventDefault();

    const testId=Number(
        document.getElementById("testId").value
    );

    const order=orders.find(
        item=>Number(item.id)===testId
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

    const actualReading=
        document.getElementById("actualReading")
        .value
        .trim();

    if(actualReading===""){
        alert("Please enter the actual reading.");
        return;
    }

    const now=new Date();

    const report={
        reportId:Date.now(),
        testId:order.id,
        patientId:order.patientId,
        patientName:order.patient,
        doctorId:order.doctorId,
        doctorName:order.doctorName,
        testName:test.testName,
        sampleType:test.sampleType,
        normalValue:test.normalValue,
        actualReading:actualReading,
        remarks:
            document.getElementById("remarks")
            .value
            .trim(),
        date:now.toLocaleDateString(),
        time:now.toLocaleTimeString()
    };

    const existingReport=reports.find(
        item=>Number(item.testId)===testId
    );

    if(existingReport){
        Object.assign(
            existingReport,
            report
        );
    }else{
        reports.push(report);
    }

    order.status="Completed";

    saveData();

    renderOrders();
    renderQueues();
    renderReports();
    updateDashboard();

    alert("Lab report saved and sent to the doctor.");

    clearProcessForm();

    showSection(
        "billing",
        order.id
    );
});

function clearProcessForm(){
    document.getElementById("patientForm").reset();
    document.getElementById("testId").value="";
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

    container.innerHTML=
        reports.map(report=>`

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

                            <tr>

                                <td>
                                    ${escapeHtml(report.testName)}
                                </td>

                                <td>
                                    ${escapeHtml(report.normalValue)}
                                </td>

                                <td>
                                    ${escapeHtml(report.actualReading)}
                                </td>

                            </tr>

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
        item=>Number(item.testId)===Number(testId)
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
            item=>Number(item.testId)===Number(testId)
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
                    Number(bill.testId)===
                    Number(order.id)
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

    const testId=Number(
        document.getElementById("billingTestId").value
    );

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
        item=>Number(item.id)===testId
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
        bill=>Number(bill.testId)===testId
    );

    document.getElementById(
        "paymentStatus"
    ).value=
        existingBill
        ?existingBill.status
        :"Pending";
}

function createBill(){

    const testId=Number(
        document.getElementById("billingTestId").value
    );

    if(!testId){
        alert("Please select a completed test.");
        return;
    }

    const order=orders.find(
        item=>Number(item.id)===testId
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
        bill=>Number(bill.testId)===testId
    );

    if(existingBill){
        alert("Bill already created for this test.");
        return;
    }

    const bill={
        billId:Date.now(),
        testId:order.id,
        patientId:order.patientId,
        patientName:order.patient,
        testName:test.testName,
        amount:test.charge,
        status:"Pending",
        date:new Date().toLocaleDateString()
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

    if(bills.length===0){

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
        bills.map(bill=>`

        <tr>

            <td>
                ${escapeHtml(bill.billId)}
            </td>

            <td>
                ${escapeHtml(bill.patientId)}
            </td>

            <td>
                ${escapeHtml(bill.testName)}
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