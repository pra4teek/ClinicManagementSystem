let currentUser = null;
let orders = [];
let reports = [];

function escapeHtml(value) {
	return String(value ?? "").replace(/[&<>"']/g, character => ({
		"&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
	})[character]);
}

function orderId(order) { return order.labOrderId ?? order.LabPrescriptionId ?? order.id; }
function orderStatus(order) { return order.status ?? order.Status ?? "Pending"; }
function patientLabel(order) {
	return order.patientName || (order.patientId ? `Patient #${order.patientId}` : `Patient #${order.PatientId ?? "-"}`);
}
function testLabel(order) {
	if (Array.isArray(order.tests)) return order.tests.join(", ");
	return order.TestName || (order.LabTestId ? `Test #${order.LabTestId}` : "Test not specified");
}
function statusClass(status) {
	if (status === "Completed") return "status status-completed";
	if (status === "Cancelled") return "status status-cancelled";
	if (status === "In Progress" || status === "In-Progress") return "status status-progress";
	return "status";
}
function formatDate(value) {
	if (!value) return "-";
	const date = new Date(value);
	return Number.isNaN(date.getTime()) ? escapeHtml(value) : date.toLocaleDateString();
}

function renderOrders() {
	const search = document.getElementById("order-search").value.trim().toLowerCase();
	const visibleOrders = orders.filter(order => {
		const content = [orderId(order), patientLabel(order), testLabel(order), order.sampleType || order.SampleType, orderStatus(order)].join(" ").toLowerCase();
		return content.includes(search);
	});
	const body = document.getElementById("orders-body");
	if (!visibleOrders.length) {
		body.innerHTML = `<tr><td colspan="5" class="empty-state">${orders.length ? "No orders match your search." : "No lab orders found."}</td></tr>`;
	} else {
		body.innerHTML = visibleOrders.map(order => `
			<tr>
				<td><span class="strong">#${escapeHtml(orderId(order))}</span><span class="subtext">${formatDate(order.date || order.LabTestDate)}</span></td>
				<td><span class="strong">${escapeHtml(patientLabel(order))}</span><span class="subtext">${escapeHtml(testLabel(order))}</span></td>
				<td>${escapeHtml(order.sampleType || order.SampleType || "-")}</td>
				<td><span class="${statusClass(orderStatus(order))}">${escapeHtml(orderStatus(order))}</span></td>
				<td><button class="row-action" type="button" data-order-id="${escapeHtml(orderId(order))}">Record result</button></td>
			</tr>`).join("");
	}

	const selectable = orders.filter(order => orderStatus(order) !== "Completed" && orderStatus(order) !== "Cancelled");
	const reportSelect = document.getElementById("order-select");
	const statusSelect = document.getElementById("status-order");
	const options = selectable.map(order => `<option value="${escapeHtml(orderId(order))}">#${escapeHtml(orderId(order))} · ${escapeHtml(patientLabel(order))} · ${escapeHtml(testLabel(order))}</option>`).join("");
	reportSelect.innerHTML = `<option value="">Select an order</option>${options}`;
	statusSelect.innerHTML = `<option value="">Select an order</option>${orders.map(order => `<option value="${escapeHtml(orderId(order))}">#${escapeHtml(orderId(order))} · ${escapeHtml(orderStatus(order))}</option>`).join("")}`;
	document.getElementById("open-count").textContent = selectable.length;
	document.getElementById("progress-count").textContent = orders.filter(order => orderStatus(order) === "In Progress" || orderStatus(order) === "In-Progress").length;
	document.querySelectorAll("[data-order-id]").forEach(button => {
		button.addEventListener("click", () => {
			reportSelect.value = button.dataset.orderId;
			document.getElementById("actual-reading").focus();
		});
	});
}

function renderReports() {
	const body = document.getElementById("reports-body");
	const recentReports = [...reports].sort((left, right) => new Date(right.reportDate || right.date || 0) - new Date(left.reportDate || left.date || 0)).slice(0, 8);
	if (!recentReports.length) {
		body.innerHTML = '<tr><td colspan="4" class="empty-state">No reports have been recorded yet.</td></tr>';
	} else {
		body.innerHTML = recentReports.map(report => `
			<tr>
				<td class="strong">#${escapeHtml(orderId(report))}</td>
				<td>${escapeHtml(patientLabel(report))}</td>
				<td>${escapeHtml(report.actualReading || report.ActualReading || "-")}</td>
				<td>${formatDate(report.reportDate || report.date)}</td>
			</tr>`).join("");
	}
	document.getElementById("report-count").textContent = reports.length;
}

function loadData() {
	orders = getStorage(CMS_KEYS.LAB_ORDERS, []);
	reports = orders.filter(order => order.actualReading || order.ActualReading);
	renderOrders();
	renderReports();
}

function saveReport(event) {
	event.preventDefault();
	const form = event.currentTarget;
	const message = document.getElementById("form-message");
	const submit = document.getElementById("submit-report");
	const selectedId = form.elements.LabPrescriptionId.value;
	const technicianId = form.elements.LabTechnician.value;
	const actualReading = form.elements.ActualReading.value.trim();
	const remarks = form.elements.remarks.value.trim();
	if (!selectedId || !actualReading || !remarks) {
		message.textContent = "Enter both the actual reading and remarks.";
		return false;
	}
	submit.disabled = true;
	orders = getStorage(CMS_KEYS.LAB_ORDERS, []);
	const order = orders.find(item => String(orderId(item)) === String(selectedId));
	if (!order) {
		message.textContent = "That lab order could not be found.";
		submit.disabled = false;
		return false;
	}
	order.actualReading = actualReading;
	order.reportRemarks = remarks;
	order.technicianName = currentUser.name || "Lab Technician";
	order.technicianId = technicianId || currentUser.staffId || currentUser.userId || null;
	order.reportDate = new Date().toISOString().split("T")[0];
	setStorage(CMS_KEYS.LAB_ORDERS, orders);
	form.reset();
	message.textContent = "Report saved.";
	submit.disabled = false;
	loadData();
	if (typeof showToast === "function") showToast("Lab result saved.", "success");
	return false;
}

function saveStatus(event) {
	event.preventDefault();
	const orderIdValue = document.getElementById("status-order").value;
	const status = document.getElementById("new-status").value;
	const message = document.getElementById("status-message");
	const saveButton = document.getElementById("save-status");
	if (!orderIdValue) {
		message.textContent = "Select a lab order first.";
		return false;
	}
	saveButton.disabled = true;
	orders = getStorage(CMS_KEYS.LAB_ORDERS, []);
	const order = orders.find(item => String(orderId(item)) === String(orderIdValue));
	if (!order) {
		message.textContent = "That lab order could not be found.";
		saveButton.disabled = false;
		return false;
	}
	order.status = status;
	setStorage(CMS_KEYS.LAB_ORDERS, orders);
	message.textContent = "Order status updated.";
	saveButton.disabled = false;
	loadData();
	if (typeof showToast === "function") showToast("Lab order status updated.", "success");
	return false;
}

document.addEventListener("DOMContentLoaded", function() {
	currentUser = requireAuth(["Lab Technician", "Admin"], "../index.html");
	if (!currentUser) return;

	document.getElementById("refresh-button").addEventListener("click", loadData);
	document.getElementById("order-search").addEventListener("input", renderOrders);
	document.getElementById("report-form").addEventListener("submit", saveReport);
	document.getElementById("status-form").addEventListener("submit", saveStatus);
	loadData();
});
