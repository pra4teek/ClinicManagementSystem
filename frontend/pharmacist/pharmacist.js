const SHARED = (function () {
  const hasSharedData = typeof getStorage === "function" && typeof CMS_KEYS !== "undefined";

  const loggedInUser = hasSharedData && typeof getCurrentUser === "function" ? getCurrentUser() : null;
  const currentUser = loggedInUser || { name: "Adarsh Chandran", role: "Pharmacist" }; // DEFAULT_USERS fallback

  const allUsers = hasSharedData ? getStorage(CMS_KEYS.USERS, []) : [];
  const doctors = allUsers.filter(u => u.role === "Doctor");

  const patients = hasSharedData ? getStorage(CMS_KEYS.PATIENTS, []) : [];
  const medicines = hasSharedData ? getStorage(CMS_KEYS.MEDICINES, []) : [];
  const sharedPrescriptions = hasSharedData ? getStorage(CMS_KEYS.PRESCRIPTIONS, []) : [];

  return { hasSharedData, currentUser, doctors, patients, medicines, sharedPrescriptions };
})();

function initialsFor(name) {
  return (name || "").split(" ").filter(w => w && w !== "Dr.").map(w => w[0]).slice(0, 2).join("").toUpperCase() || "U";
}

const CMS_PHARMACY_DATA = {
  currentUser: {
    name: SHARED.currentUser.name,
    role: SHARED.currentUser.role || "Pharmacist",
    initials: initialsFor(SHARED.currentUser.name),
    licenseNumber: "PH-78921-CMS",
    hasAlerts: true,
    alertCount: 3
  },

  dateInfo: {
    formattedDate: "Thursday, October 04, 2026",
    rawTimestamp: "2026-09-29T08:30:00Z"
  },
  navigation: [
    {
      section: "MENU",
      items: [
        { id: "prescriptions", label: "Prescriptions", icon: "file-text", active: true },
        { id: "inventory", label: "Inventory", icon: "box", active: false },
        { id: "billing", label: "Billing", icon: "file-check", active: false },
        { id: "reports", label: "Reports", icon: "clipboard-list", active: false },
        { id: "suppliers", label: "Suppliers", icon: "users", active: false }
      ]
    },
    {
      section: "OPERATIONS",
      items: [
        { id: "dispense-log", label: "Dispense Log", icon: "clipboard-list", active: false },
        { id: "stock-orders", label: "Stock Orders", icon: "shopping-cart", active: false },
        { id: "returns", label: "Returns", icon: "rotate-ccw", active: false }
      ]
    }
  ],

  sidebarAlert: {
    // heading is overwritten below once the real inventory is built, using
    // the actual low-stock count instead of a hardcoded "3".
    heading: "Checking stock…",
    supportingText: "Check inventory before next shift",
    linkText: "View inventory →",
    actionTarget: "inventory"
  },

  statCards: [
    {
      id: "prescriptions-filled",
      label: "Prescriptions Filled",
      value: 1284,
      prefix: "",
      suffix: "",
      change: 8.2,
      isPositive: true,
      comparisonText: "vs last month",
      isPrimary: true, // EXACT 1 SOLID PRIMARY CARD
      icon: "file-check"
    },
    {
      id: "orders-suppliers",
      label: "Orders to Suppliers",
      value: 342,
      prefix: "",
      suffix: "",
      change: 4.1,
      isPositive: true,
      comparisonText: "Orders vs last month",
      isPrimary: false,
      icon: "truck-fast"
    },
    {
      id: "patients-served",
      label: "Patients Served Today",
      value: 196,
      prefix: "",
      suffix: "",
      change: -2.3,
      isPositive: false,
      comparisonText: "Users vs last month",
      isPrimary: false,
      icon: "users-round"
    },
    {
      id: "medicines-dispensed",
      label: "Medicines Dispensed",
      value: 2910,
      prefix: "",
      suffix: "",
      change: 6.6,
      isPositive: true,
      comparisonText: "Products vs last month",
      isPrimary: false,
      icon: "pill"
    }
  ],

  dispensingActivity: {
    periods: ["This Week", "This Month", "This Year"],
    defaultPeriod: "This Year",
    legend: [
      { key: "filled", label: "Prescriptions Filled", color: "var(--primary)" },
      { key: "restocked", label: "Restocked Units", color: "var(--primary-light)" }
    ],
    datasets: {
      "This Week": {
        labels: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"],
        filled: [180, 210, 245, 195, 290, 260, 230],
        restocked: [120, 150, 170, 180, 210, 190, 160]
      },
      "This Month": {
        labels: ["Week 1", "Week 2", "Week 3", "Week 4"],
        filled: [310, 420, 390, 480],
        restocked: [250, 290, 330, 360]
      },
      "This Year": {
        labels: ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul"],
        filled: [420, 380, 510, 490, 610, 580, 640],
        restocked: [300, 340, 360, 400, 420, 410, 450]
      }
    }
  },

  stockByCategory: {
    title: "Stock by Category",
    subtitle: "Track your medicine inventory",
    currentPeriod: "Today",
    totalUnits: 8340,
    totalUnitLabel: "Total Units",
    change: 5.34,
    isPositive: true,
    rings: [
      {
        id: "antibiotics",
        label: "Antibiotics",
        percent: 78,
        color: "var(--primary)",
        radius: 72,
        strokeWidth: 9
      },
      {
        id: "painkillers",
        label: "Painkillers",
        percent: 62,
        color: "var(--danger-text)", // matches the distinctive red/coral middle ring in reference
        radius: 56,
        strokeWidth: 9
      },
      {
        id: "vitamins",
        label: "Vitamins & Supplements",
        percent: 45,
        color: "var(--primary-light)",
        radius: 40,
        strokeWidth: 9
      }
    ],
    categories: [
      {
        id: "cat-antibiotics",
        label: "Antibiotics",
        count: 2487,
        unit: "units",
        change: 1.8,
        isPositive: true,
        icon: "capsule"
      },
      {
        id: "cat-painkillers",
        label: "Painkillers",
        count: 1828,
        unit: "units",
        change: 2.3,
        isPositive: true,
        icon: "tablets"
      },
      {
        id: "cat-vitamins",
        label: "Vitamins & Supplements",
        count: 1463,
        unit: "units",
        change: -1.04,
        isPositive: false,
        icon: "flask"
      }
    ]
  },

  topPrescribingDoctors: (function () {
    // NOTE: data.js's DEFAULT_USERS currently defines exactly ONE doctor
    // (Dr. Prateek Pradeep). This card is built to scale to however many doctor
    // accounts actually exist in shared storage — 1 today, more once the
    // team adds them — rather than assuming a fixed roster.
    const palette = ["#4B3FE4", "#5B50EC", "#7469F1", "#9890F5", "#B4ADF8"];
    const sizeSteps = [104, 92, 78, 68, 56];
    const positions = [{ x: 38, y: 36 }, { x: 18, y: 72 }, { x: 74, y: 76 }, { x: 20, y: 30 }, { x: 55, y: 50 }];

    const sourceDoctors = SHARED.doctors.length ? SHARED.doctors : [{ name: "Dr. Prateek Pradeep", role: "Doctor" }];

    const doctors = sourceDoctors.slice(0, 5).map((doc, i) => {
      // Real count once the Doctor module has written prescriptions;
      // placeholder (clearly marked) so the chart isn't empty before then.
      const realCount = SHARED.sharedPrescriptions.filter(
        rx => rx.doctorName === doc.name || rx.doctor === doc.name
      ).length;
      return {
        id: `doc-${i + 1}`,
        name: doc.name,
        department: doc.department || "General Medicine",
        count: realCount || Math.max(120, 900 - i * 250),
        isPlaceholderCount: realCount === 0,
        bubbleSize: sizeSteps[i] || 48,
        bubblePos: positions[i] || { x: 50, y: 50 },
        color: palette[i] || "#C9C4F7",
        textColor: "#FFFFFF",
        badge: initialsFor(doc.name)
      };
    });

    return {
      title: "Top Prescribing Doctors",
      subtitle: "Track prescriptions by doctor",
      currentPeriod: "Today",
      totalPrescriptions: doctors.reduce((sum, d) => sum + d.count, 0),
      doctors
    };
  })()
};

// Make available globally in browser and module environments
if (typeof window !== "undefined") {
  window.CMS_PHARMACY_DATA = CMS_PHARMACY_DATA;
}
if (typeof module !== "undefined" && module.exports) {
  module.exports = CMS_PHARMACY_DATA;
}

/**
 * ==========================================================================
 * CMS PHARMACY MODULE — DASHBOARD LOGIC & RENDERING ENGINE
 * Strictly handles DOM generation, animations, Chart.js, and interactions.
 * Contains ZERO hardcoded business numbers or labels (all read from data source).
 * ==========================================================================
 */

(function () {
  "use strict";

  // Reference to DRF data layer
  const data = window.CMS_PHARMACY_DATA;
  if (!data) {
    console.error("CMS_PHARMACY_DATA source not found.");
    return;
  }

  // Application State
  const state = {
    selectedChartPeriod: data.dispensingActivity.defaultPeriod,
    selectedCategoryPeriod: data.stockByCategory.currentPeriod,
    selectedDoctorsPeriod: data.topPrescribingDoctors.currentPeriod,
    sidebarOpen: false,
    chartInstance: null,
    currentPage: "prescriptions"
  };

  /* ------------------------------------------------------------------------
     localStorage Persistence Layer
     All pharmacyUI mutations call savePUI() to persist across reloads.
     ------------------------------------------------------------------------ */
  const PUI_KEY = "cms_pharmacy_ui";
  function savePUI() {
    try { localStorage.setItem(PUI_KEY, JSON.stringify(pharmacyUI)); } catch(e) {}
  }

  function syncPharmacyWithAdminStock() {
    const adminMeds = typeof getAdminMedicineStock === 'function' ? getAdminMedicineStock() : [];
    if (adminMeds.length > 0) {
      pharmacyUI.inventory = adminMeds.map((m, i) => ({
        id: m.MedicineId || i + 1,
        medicine: `${m.name || m.MedicineName} ${m.dosage || m.Dosage || ''}`.trim(),
        medicineName: m.name || m.MedicineName,
        category: m.category || m.type || (typeof MED_CATEGORY !== 'undefined' ? MED_CATEGORY[m.name || m.MedicineName] : "General") || "General",
        quantity: Number(m.quantity ?? 0),
        unitPrice: Number(m.costValue || 10),
        sellingPrice: Number(m.mrp || 15),
        reorderLevel: 10
      }));
    }
  }

  function getSharedDoctorPrescriptions() {
    const sharedRx = typeof getStorage === 'function' ? getStorage(CMS_KEYS.PRESCRIPTIONS, []) : [];
    if (Array.isArray(sharedRx) && sharedRx.length > 0) {
      return sharedRx.map(r => ({
        id: r.prescriptionId || `RX-${r.appointmentId || '001'}`,
        prescriptionId: r.prescriptionId,
        appointmentId: r.appointmentId,
        consultationId: r.consultationId,
        patient: r.patientName || 'Patient',
        patientId: r.patientId || 'PAT-1001',
        doctor: r.doctorName || 'Dr. Prateek Pradeep',
        date: r.date || 'Today',
        symptoms: r.symptoms || '',
        diagnosis: r.diagnosis || '',
        items: r.items || [],
        medicines: Array.isArray(r.items) && r.items.length > 0
          ? r.items.map(it => `${it.medicineName} ${it.dosage || ''} (${it.frequency || '1-0-1'}, ${it.duration || '5 Days'})`).join('; ')
          : (r.medicines || 'Prescribed medications'),
        status: r.status === 'Dispensed' || r.status === 'Completed' ? 'Dispensed' : 'Ready'
      }));
    }
    return pharmacyUI.prescriptions || [];
  }

  function loadPUI() {
    try {
      const raw = localStorage.getItem(PUI_KEY);
      if (raw) {
        const saved = JSON.parse(raw);
        ["dispenseLog","stockOrders","returns","suppliers","bills"].forEach(k => {
          if (Array.isArray(saved[k])) pharmacyUI[k] = saved[k];
        });
      }
    } catch(e) {}
    syncPharmacyWithAdminStock();
  }

  /* ------------------------------------------------------------------------
     Build pharmacy-only demo data FROM the shared medicine/patient/doctor
     lists in data.js, instead of inventing names that exist nowhere else
     in the app. Category, price, quantity and reorder level are pharmacist-
     owned attributes with no equivalent in data.js, so they're generated
     here as demo starting values only.
     ------------------------------------------------------------------------ */
  const MED_CATEGORY = {
    Paracetamol: "Painkillers", Ibuprofen: "Painkillers",
    Amoxicillin: "Antibiotics", Azithromycin: "Antibiotics",
    Cetirizine: "Allergy", Metformin: "Diabetes", Omeprazole: "Gastro"
  };
  // [quantity, reorderLevel, unitPrice, sellingPrice] — first two are seeded
  // low/out-of-stock on purpose so Inventory/Reports have something to flag.
  const DEMO_STOCK_LEVELS = [
    [8, 15, 4.5, 6], [180, 30, 1.2, 2], [46, 20, 2.1, 3.5],
    [5, 10, 3.2, 5], [22, 15, 6.8, 9], [14, 15, 2.5, 4], [0, 10, 8.5, 12]
  ];

  const seedMedicines = SHARED.medicines.length ? SHARED.medicines : [
    { name: "Paracetamol", dosage: "500mg", type: "Tablet" }
  ];

  const inventory = seedMedicines.map((m, i) => {
    const [quantity, reorderLevel, unitPrice, sellingPrice] = DEMO_STOCK_LEVELS[i % DEMO_STOCK_LEVELS.length];
    return {
      id: i + 1,
      medicine: `${m.name} ${m.dosage}`,
      category: MED_CATEGORY[m.name] || "General",
      quantity, unitPrice, sellingPrice, reorderLevel
    };
  });

  const seedPatients = SHARED.patients.length ? SHARED.patients : [
    { name: "Demo Patient", patientId: "PAT-0000" }
  ];
  const primaryDoctorName = (SHARED.doctors[0] && SHARED.doctors[0].name) || "Dr. Prateek Pradeep";
  const today = "29 Sep 2026", yesterday = "28 Sep 2026";
  const pharmacistName = SHARED.currentUser.name;

  function rxLine(i) {
    const med = inventory[i % inventory.length];
    const qty = (i % 3) + 1;
    return `${med.medicine} × ${qty}`;
  }

  const prescriptions = seedPatients.slice(0, 4).map((p, i) => ({
    id: `RX-100${i + 1}`,
    patient: p.name,
    patientId: p.patientId,
    doctor: primaryDoctorName,
    date: i < 2 ? today : yesterday,
    medicines: rxLine(i),
    status: i === 2 ? "Dispensed" : "Ready"
  }));

  const pharmacyUI = {
    inventory,
    prescriptions,
    dispenseLog: [
      { id: "D-501", patient: seedPatients[2]?.name || seedPatients[0].name, medicine: inventory[3]?.medicine || inventory[0].medicine, quantity: 2, date: today, pharmacist: pharmacistName },
      { id: "D-500", patient: seedPatients[3]?.name || seedPatients[0].name, medicine: inventory[1]?.medicine || inventory[0].medicine, quantity: 4, date: today, pharmacist: pharmacistName }
    ],
    stockOrders: [
      { id: "SO-301", supplier: "MedSupply Kerala", medicine: inventory[0].medicine, quantity: 100, date: today, status: "Pending" },
      { id: "SO-300", supplier: "HealthFirst Distributors", medicine: inventory[3]?.medicine || inventory[0].medicine, quantity: 80, date: yesterday, status: "Ordered" }
    ],
    returns: [
      { id: "RET-101", patient: seedPatients[0].name, medicine: inventory[1]?.medicine || inventory[0].medicine, quantity: 2, reason: "Wrong quantity", date: today, status: "Processed" },
      { id: "RET-100", patient: seedPatients[1]?.name || seedPatients[0].name, medicine: inventory[5]?.medicine || inventory[0].medicine, quantity: 1, reason: "Damaged pack", date: "27 Sep 2026", status: "Pending" }
    ],
    // Suppliers are pharmacist-only entities with no shared record elsewhere
    // in data.js, so these stay as this module's own demo data.
    suppliers: [
      { id: "SUP-01", name: "MedSupply Kerala", contact: "+91 98765 43210", email: "orders@medsupply.example", medicines: 42 },
      { id: "SUP-02", name: "HealthFirst Distributors", contact: "+91 98470 11223", email: "sales@healthfirst.example", medicines: 36 }
    ],
    bills: [
      { id: "PB-7001", patient: seedPatients[2]?.name || seedPatients[0].name, medicine: inventory[3]?.medicine || inventory[0].medicine, quantity: 2, unitPrice: inventory[3]?.sellingPrice || 5, total: (inventory[3]?.sellingPrice || 5) * 2, date: today },
      { id: "PB-7000", patient: seedPatients[3]?.name || seedPatients[0].name, medicine: inventory[1]?.medicine || inventory[0].medicine, quantity: 4, unitPrice: inventory[1]?.sellingPrice || 2, total: (inventory[1]?.sellingPrice || 2) * 4, date: today }
    ]
  };

  // Reflect the real low-stock count in the sidebar alert heading.
  const lowStockCount = inventory.filter(x => x.quantity <= x.reorderLevel).length;
  data.sidebarAlert.heading = lowStockCount > 0
    ? `${lowStockCount} item${lowStockCount === 1 ? "" : "s"} low on stock`
    : "All stock levels healthy";

  /* ------------------------------------------------------------------------
     SVG Icon Provider Helper (Clean outline SVGs matching reference style)
     ------------------------------------------------------------------------ */
  function getIconSvg(iconName) {
    const icons = {
      "file-text": `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><line x1="10" y1="9" x2="8" y2="9"/></svg>`,
      box: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/><polyline points="3.27 6.96 12 12.01 20.73 6.96"/><line x1="12" y1="22.08" x2="12" y2="12"/></svg>`,
      users: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>`,
      "clipboard-list": `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor"><rect x="8" y="2" width="8" height="4" rx="1" ry="1"/><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/><line x1="9" y1="12" x2="15" y2="12"/><line x1="9" y1="16" x2="15" y2="16"/></svg>`,
      "shopping-cart": `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor"><circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/></svg>`,
      "rotate-ccw": `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor"><polyline points="1 4 1 10 7 10"/><path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10"/></svg>`,
      settings: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>`,
      "help-circle": `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor"><circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>`,
      "file-check": `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><path d="m9 15 2 2 4-4"/></svg>`,
      "truck-fast": `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor"><path d="M1 3h15v13H1z"/><path d="M16 8h4l3 3v5h-7V8z"/><circle cx="5.5" cy="18.5" r="2.5"/><circle cx="18.5" cy="18.5" r="2.5"/></svg>`,
      "users-round": `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>`,
      pill: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor"><path d="m10.5 20.5 10-10a4.95 4.95 0 1 0-7-7l-10 10a4.95 4.95 0 1 0 7 7Z"/><path d="m8.5 8.5 7 7"/></svg>`,
      capsule: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor"><rect x="3" y="6" width="18" height="12" rx="6"/><line x1="12" y1="6" x2="12" y2="18"/></svg>`,
      tablets: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor"><circle cx="7" cy="12" r="5"/><circle cx="17" cy="12" r="5"/><line x1="17" y1="9.5" x2="17" y2="14.5"/></svg>`,
      flask: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor"><path d="M9 3h6"/><path d="M10 9V3"/><path d="M14 9V3"/><path d="M6 21h12a2 2 0 0 0 1.6-3.2L14 9h-4l-5.6 8.8A2 2 0 0 0 6 21z"/></svg>`,
      "arrow-up": `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" class="pill-icon"><polyline points="18 15 12 9 6 15"/></svg>`,
      "arrow-down": `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" class="pill-icon"><polyline points="6 9 12 15 18 9"/></svg>`,
      chevron: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" class="dropdown-chevron"><polyline points="6 9 12 15 18 9"/></svg>`,
      arrowRight: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>`
    };
    return icons[iconName] || icons.dashboard;
  }

  /* ------------------------------------------------------------------------
     1. Topbar & User Profile Rendering
     ------------------------------------------------------------------------ */
  function renderTopbar() {
    const dateEl = document.getElementById("topbar-date");
    if (dateEl) {
      dateEl.textContent = data.dateInfo.formattedDate;
    }

    const badgeEl = document.getElementById("notification-badge");
    if (badgeEl) {
      badgeEl.style.display = data.currentUser.hasAlerts ? "block" : "none";
    }


    // Populate the new dark sidebar user footer
    const sidebarAvatar = document.getElementById("pharm-sidebar-avatar");
    if (sidebarAvatar) {
      sidebarAvatar.textContent = data.currentUser.initials || "PH";
    }
    const sidebarName = document.getElementById("pharm-sidebar-name");
    if (sidebarName) {
      sidebarName.textContent = data.currentUser.name;
    }
  }

  /* ------------------------------------------------------------------------
     2. Sidebar Navigation & Alert Card Rendering
     ------------------------------------------------------------------------ */
  function renderSidebar() {
    const navContainer = document.getElementById("sidebar-nav-container");
    if (!navContainer) return;

    navContainer.innerHTML = "";

    data.navigation.forEach(section => {
      const sectionEl = document.createElement("div");
      sectionEl.className = "nav-section";

      const titleEl = document.createElement("span");
      titleEl.className = "nav-section-title";
      titleEl.textContent = section.section;
      sectionEl.appendChild(titleEl);

      const listEl = document.createElement("ul");
      listEl.className = "nav-list";

      section.items.forEach(item => {
        const itemLi = document.createElement("li");
        const btn = document.createElement("button");
        btn.className = `nav-link ${item.active ? "active" : ""}`;
        btn.setAttribute("type", "button");
        btn.setAttribute("data-id", item.id);
        btn.setAttribute("aria-label", item.label);

        btn.innerHTML = `
          ${getIconSvg(item.icon)}
          <span class="nav-item-label">${item.label}</span>
        `;

        btn.addEventListener("click", () => {
          document.querySelectorAll(".nav-link").forEach(el => el.classList.remove("active"));
          btn.classList.add("active");
          showPage(item.id);
          if (window.innerWidth <= 767) {
            document.getElementById("app-sidebar")?.classList.remove("open");
            document.getElementById("sidebar-backdrop")?.classList.remove("active");
            document.body.style.overflow = "";
            state.sidebarOpen = false;
          }
        });

        itemLi.appendChild(btn);
        listEl.appendChild(itemLi);
      });

      sectionEl.appendChild(listEl);
      navContainer.appendChild(sectionEl);
    });

    // Sidebar bottom low-stock alert card
    const alertContainer = document.getElementById("sidebar-alert-container");
    if (alertContainer && data.sidebarAlert) {
      alertContainer.innerHTML = `
        <div class="sidebar-alert-card">
          <div class="sidebar-alert-badge" aria-hidden="true">
            ${getIconSvg("box")}
          </div>
          <div class="sidebar-alert-title">${data.sidebarAlert.heading}</div>
          <div class="sidebar-alert-desc">${data.sidebarAlert.supportingText}</div>
          <button type="button" id="sidebar-inventory-btn" class="sidebar-alert-link">
            <span>${data.sidebarAlert.linkText}</span>
          </button>
        </div>
        <div class="sidebar-alert-icon-only" title="${data.sidebarAlert.heading}" aria-label="${data.sidebarAlert.heading}">
          ${getIconSvg("box")}
        </div>
      `;

      const linkBtn = document.getElementById("sidebar-inventory-btn");
      if (linkBtn) {
        linkBtn.addEventListener("click", () => {
          // Switch active state to inventory
          const invBtn = document.querySelector('[data-id="inventory"]');
          if (invBtn) invBtn.click();
        });
      }
    }
  }

  /* ------------------------------------------------------------------------
     3. Count-Up Animation (800ms, requestAnimationFrame, ease-out)
     ------------------------------------------------------------------------ */
  function animateValue(element, start, end, duration) {
    if (!element) return;
    const startTime = performance.now();

    function update(currentTime) {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      // Ease-out cubic
      const easeOut = 1 - Math.pow(1 - progress, 3);
      const current = Math.floor(start + (end - start) * easeOut);

      element.textContent = current.toLocaleString();

      if (progress < 1) {
        requestAnimationFrame(update);
      } else {
        element.textContent = end.toLocaleString();
      }
    }

    requestAnimationFrame(update);
  }

  /* ------------------------------------------------------------------------
     4. Stat Cards Rendering (1 Solid Primary Card + 3 White Cards)
     ------------------------------------------------------------------------ */
  function renderStatCards() {
    const container = document.getElementById("stat-cards-container");
    if (!container) return;

    container.innerHTML = "";

    data.statCards.forEach((card, index) => {
      const cardEl = document.createElement("article");
      const isPrimary = card.isPrimary;
      cardEl.className = `stat-card ${isPrimary ? "stat-card-primary" : ""}`;
      cardEl.setAttribute("aria-label", card.label);

      const pillClass = card.isPositive ? "pill-success" : "pill-danger";
      const arrowIcon = card.isPositive ? getIconSvg("arrow-up") : getIconSvg("arrow-down");
      const sign = card.change > 0 ? `+${card.change.toFixed(1)}%` : `${card.change.toFixed(1)}%`;

      cardEl.innerHTML = `
        <div class="stat-card-top">
          <div class="icon-badge ${isPrimary ? "icon-badge-primary" : ""}" aria-hidden="true">
            ${getIconSvg(card.icon)}
          </div>
          <div class="pill ${pillClass}">
            ${arrowIcon}
            <span>${sign}</span>
          </div>
        </div>
        <div class="stat-card-label">${card.label}</div>
        <div class="stat-card-bottom-row">
          <div class="stat-card-value" id="stat-val-${index}">0</div>
          <div class="stat-card-meta">${card.comparisonText}</div>
        </div>
      `;

      container.appendChild(cardEl);

      // Trigger smooth 800ms count-up
      const valueEl = document.getElementById(`stat-val-${index}`);
      animateValue(valueEl, 0, card.value, 800);
    });
  }

  /* ------------------------------------------------------------------------
     5. Interactive Pill Dropdown Component Helper
     ------------------------------------------------------------------------ */
  function createDropdown(options, initialValue, onSelect) {
    const wrapper = document.createElement("div");
    wrapper.className = "dropdown-wrapper";

    const btn = document.createElement("button");
    btn.className = "dropdown-btn";
    btn.type = "button";
    btn.setAttribute("aria-haspopup", "listbox");
    btn.setAttribute("aria-expanded", "false");
    btn.innerHTML = `
      <span class="dropdown-label">${initialValue}</span>
      ${getIconSvg("chevron")}
    `;

    const menu = document.createElement("ul");
    menu.className = "dropdown-menu";
    menu.setAttribute("role", "listbox");

    options.forEach(opt => {
      const item = document.createElement("li");
      item.className = `dropdown-item ${opt === initialValue ? "selected" : ""}`;
      item.textContent = opt;
      item.setAttribute("role", "option");
      item.setAttribute("aria-selected", opt === initialValue ? "true" : "false");

      item.addEventListener("click", e => {
        e.stopPropagation();
        btn.querySelector(".dropdown-label").textContent = opt;
        menu.querySelectorAll(".dropdown-item").forEach(el => {
          el.classList.remove("selected");
          el.setAttribute("aria-selected", "false");
        });
        item.classList.add("selected");
        item.setAttribute("aria-selected", "true");
        wrapper.classList.remove("open");
        btn.setAttribute("aria-expanded", "false");
        onSelect(opt);
      });

      menu.appendChild(item);
    });

    btn.addEventListener("click", e => {
      e.stopPropagation();
      const isOpen = wrapper.classList.toggle("open");
      btn.setAttribute("aria-expanded", isOpen ? "true" : "false");
    });

    document.addEventListener("click", () => {
      wrapper.classList.remove("open");
      btn.setAttribute("aria-expanded", "false");
    });

    wrapper.appendChild(btn);
    wrapper.appendChild(menu);
    return wrapper;
  }

  /* ------------------------------------------------------------------------
     6. Main Bar Chart (Chart.js & Custom Speech Bubble Tooltip)
     ------------------------------------------------------------------------ */
  function initDispensingChart() {
    const canvas = document.getElementById("dispensing-activity-chart");
    if (!canvas || typeof Chart === "undefined") return;

    const chartDataConfig = data.dispensingActivity;
    const currentDataset = chartDataConfig.datasets[state.selectedChartPeriod];

    // Render Dropdown
    const dropdownContainer = document.getElementById("chart-dropdown-container");
    if (dropdownContainer) {
      dropdownContainer.innerHTML = "";
      dropdownContainer.appendChild(
        createDropdown(chartDataConfig.periods, state.selectedChartPeriod, period => {
          state.selectedChartPeriod = period;
          updateChartData(period);
        })
      );
    }

    // Render Custom HTML Legend
    const legendContainer = document.getElementById("chart-legend-container");
    if (legendContainer) {
      legendContainer.innerHTML = chartDataConfig.legend
        .map(
          item => `
          <div class="chart-legend-item">
            <span class="chart-legend-dot" style="background-color: ${item.color};"></span>
            <span>${item.label}</span>
          </div>
        `
        )
        .join("");
    }

    // Custom Speech Bubble Tooltip Handler (Matches reference screenshot)
    const customTooltip = context => {
      const tooltipEl = document.getElementById("chartjs-custom-tooltip");
      if (!tooltipEl) return;

      const tooltipModel = context.tooltip;
      if (tooltipModel.opacity === 0) {
        tooltipEl.style.opacity = "0";
        return;
      }

      if (tooltipModel.body) {
        const titleLines = tooltipModel.title || [];
        const bodyLines = tooltipModel.body.map(b => b.lines);

        let innerHtml = "";
        bodyLines.forEach((body, i) => {
          const colors = tooltipModel.labelColors[i];
          const text = body[0];
          innerHtml += `
            <div class="tooltip-row">
              <span class="tooltip-dot" style="background:${colors.backgroundColor};"></span>
              <span>${text}</span>
            </div>
          `;
        });

        tooltipEl.innerHTML = innerHtml;
      }

      tooltipEl.style.opacity = "1";
      tooltipEl.style.left = tooltipModel.caretX + "px";
      tooltipEl.style.top = tooltipModel.caretY - 14 + "px";
    };

    // Chart.js Configuration
    const ctx = canvas.getContext("2d");
    state.chartInstance = new Chart(ctx, {
      type: "bar",
      data: {
        labels: currentDataset.labels,
        datasets: [
          {
            label: "Prescriptions Filled",
            data: currentDataset.filled,
            backgroundColor: "#4B3FE4",
            borderRadius: 8,
            borderSkipped: false,
            barPercentage: 0.65,
            categoryPercentage: 0.65,
            maxBarThickness: 22
          },
          {
            label: "Restocked Units",
            data: currentDataset.restocked,
            backgroundColor: "#C9C4F7",
            borderRadius: 8,
            borderSkipped: false,
            barPercentage: 0.65,
            categoryPercentage: 0.65,
            maxBarThickness: 22
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        layout: {
          padding: { top: 20, right: 10, left: -5, bottom: 0 }
        },
        interaction: {
          mode: "index",
          intersect: false
        },
        plugins: {
          legend: { display: false },
          tooltip: {
            enabled: false,
            external: customTooltip
          }
        },
        scales: {
          x: {
            grid: { display: false, drawBorder: false },
            ticks: {
              font: { family: "'Plus Jakarta Sans', sans-serif", size: 12, weight: "600" },
              color: "#6E7191",
              padding: 8
            }
          },
          y: {
            border: { dash: [4, 4], display: false },
            grid: {
              color: "#EFEDF9",
              drawTicks: false
            },
            ticks: {
              font: { family: "'Plus Jakarta Sans', sans-serif", size: 11, weight: "500" },
              color: "#A0A3BD",
              padding: 10,
              callback: function (val) {
                if (val >= 1000) return val / 1000 + "K";
                return val;
              }
            }
          }
        }
      }
    });
  }

  // Update existing chart without destroying instance
  function updateChartData(periodName) {
    if (!state.chartInstance) return;
    const newDataset = data.dispensingActivity.datasets[periodName];
    if (!newDataset) return;

    state.chartInstance.data.labels = newDataset.labels;
    state.chartInstance.data.datasets[0].data = newDataset.filled;
    state.chartInstance.data.datasets[1].data = newDataset.restocked;
    state.chartInstance.update();
  }

  /* ------------------------------------------------------------------------
     7. Radial Concentric SVG Progress Rings Calculation
     ------------------------------------------------------------------------ */
  function calculateRingProgress(percent, radius) {
    const circumference = 2 * Math.PI * radius;
    const offset = circumference - (percent / 100) * circumference;
    return {
      circumference,
      offset
    };
  }

  function renderStockByCategory() {
    const catData = data.stockByCategory;

    // Dropdown in card header
    const dropdownContainer = document.getElementById("radial-dropdown-container");
    if (dropdownContainer) {
      dropdownContainer.innerHTML = "";
      dropdownContainer.appendChild(
        createDropdown(["Today", "This Week", "This Month"], state.selectedCategoryPeriod, p => {
          state.selectedCategoryPeriod = p;
        })
      );
    }

    // Build Concentric SVG Circles dynamically
    const svgBox = document.getElementById("radial-svg-box");
    if (svgBox) {
      const size = 160;
      const center = size / 2;

      let svgContent = `<svg class="radial-svg" viewBox="0 0 ${size} ${size}">`;

      // Render background tracks and active animated rings
      catData.rings.forEach(ring => {
        const { circumference, offset } = calculateRingProgress(ring.percent, ring.radius);

        // Background Track
        svgContent += `
          <circle
            class="ring-bg"
            cx="${center}"
            cy="${center}"
            r="${ring.radius}"
            stroke-width="${ring.strokeWidth}"
          />
        `;

        // Active Value Foreground Ring
        svgContent += `
          <circle
            class="ring-fg"
            cx="${center}"
            cy="${center}"
            r="${ring.radius}"
            stroke="${ring.color}"
            stroke-width="${ring.strokeWidth}"
            stroke-dasharray="${circumference}"
            stroke-dashoffset="${offset}"
          />
        `;
      });

      svgContent += `</svg>`;
      svgBox.innerHTML = svgContent;
    }

    // Center/Side Stat Display
    const statContainer = document.getElementById("radial-center-stat");
    if (statContainer) {
      const sign = catData.change > 0 ? `+${catData.change.toFixed(2)}%` : `${catData.change.toFixed(2)}%`;
      statContainer.innerHTML = `
        <span class="radial-stat-number" id="radial-total-units">0</span>
        <span class="radial-stat-label">${catData.totalUnitLabel}</span>
        <div class="pill pill-success radial-stat-pill">
          ${getIconSvg("arrow-up")}
          <span>${sign}</span>
        </div>
      `;

      const unitEl = document.getElementById("radial-total-units");
      animateValue(unitEl, 0, catData.totalUnits, 800);
    }

    // Category Rows List Underneath
    const listContainer = document.getElementById("stock-category-list");
    if (listContainer) {
      listContainer.innerHTML = catData.categories
        .map(cat => {
          const pillClass = cat.isPositive ? "pill-success" : "pill-danger";
          const arrow = cat.isPositive ? getIconSvg("arrow-up") : getIconSvg("arrow-down");
          const changeSign = cat.change > 0 ? `+${cat.change.toFixed(1)}%` : `${cat.change.toFixed(1)}%`;

          return `
          <div class="category-row">
            <div class="category-row-left">
              <div class="icon-badge icon-badge-sm" aria-hidden="true">
                ${getIconSvg(cat.icon)}
              </div>
              <div class="category-info">
                <span class="category-name">${cat.label}</span>
                <span class="category-count">${cat.count.toLocaleString()} ${cat.unit}</span>
              </div>
            </div>
            <div class="pill ${pillClass}">
              ${arrow}
              <span>${changeSign}</span>
            </div>
          </div>
        `;
        })
        .join("");
    }
  }

  /* ------------------------------------------------------------------------
     8. Bubble / Growth Card: Top Prescribing Doctors
     ------------------------------------------------------------------------ */
  function renderTopPrescribingDoctors() {
    const docData = data.topPrescribingDoctors;

    // Header Dropdown
    const dropdownContainer = document.getElementById("doctors-dropdown-container");
    if (dropdownContainer) {
      dropdownContainer.innerHTML = "";
      dropdownContainer.appendChild(
        createDropdown(["Today", "This Week", "This Month"], state.selectedDoctorsPeriod, p => {
          state.selectedDoctorsPeriod = p;
        })
      );
    }

    // Overlapping Bubbles Stage
    const stage = document.getElementById("bubbles-stage");
    if (stage) {
      stage.innerHTML = "";

      docData.doctors.forEach((doc, idx) => {
        const bubble = document.createElement("div");
        bubble.className = "bubble-circle";
        bubble.setAttribute("title", `${doc.name}: ${doc.count} prescriptions`);
        bubble.style.width = `${doc.bubbleSize}px`;
        bubble.style.height = `${doc.bubbleSize}px`;
        bubble.style.backgroundColor = doc.color;
        bubble.style.color = doc.textColor;
        bubble.style.left = `${doc.bubblePos.x}%`;
        bubble.style.top = `${doc.bubblePos.y}%`;
        bubble.style.transform = "translate(-50%, -50%)";
        bubble.style.zIndex = 5 - idx;

        bubble.innerHTML = `
          <span class="bubble-number">${doc.count.toLocaleString()}</span>
          <span class="bubble-badge">${doc.badge}</span>
        `;

        stage.appendChild(bubble);
      });
    }

    // Doctors List with mini progress bar
    const listEl = document.getElementById("doctors-list");
    if (listEl) {
      const maxCount = Math.max(...docData.doctors.map(d => d.count));

      listEl.innerHTML = docData.doctors
        .map(doc => {
          const percent = Math.round((doc.count / maxCount) * 100);

          return `
          <div class="doctor-item">
            <div class="doctor-item-left">
              <div class="doctor-avatar-badge">${doc.badge}</div>
              <div class="doctor-name-group">
                <span class="doctor-name">${doc.name}</span>
                <span class="doctor-specialty">${doc.department}</span>
              </div>
            </div>
            <div class="doctor-progress-bar" title="${percent}% of max volume">
              <div class="doctor-progress-fill" style="width: ${percent}%;"></div>
            </div>
            <div class="doctor-rx-count">${doc.count.toLocaleString()}</div>
          </div>
        `;
        })
        .join("");
    }
  }

  /* ------------------------------------------------------------------------
     9. Dynamic Pharmacist Pages - Frontend Demo
     ------------------------------------------------------------------------ */
  function escapeHtml(v){return String(v??"").replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;").replace(/'/g,"&#039;");}
  function money(v){return "₹"+Number(v||0).toFixed(2);}
  function statusFor(x){return x.quantity<=0?["Out of Stock","status-out"]:(x.quantity<=x.reorderLevel?["Low Stock","status-low"]:["In Stock","status-good"]);}
  function toast(msg){document.querySelector(".toast-message")?.remove();const e=document.createElement("div");e.className="toast-message";e.textContent=msg;document.body.appendChild(e);setTimeout(()=>e.remove(),2200);}
  function title(t){const e=document.querySelector(".topbar-title");if(e)e.textContent=t;}

  function showPage(id){
    const dash=document.getElementById("dashboard-page"), box=document.getElementById("dynamic-page-content");
    if(!dash||!box)return; state.currentPage=id;
    dash.style.display="none";box.style.display="block";
    const names={inventory:"Inventory Management",prescriptions:"Prescriptions",billing:"Pharmacy Billing",reports:"Pharmacy Reports",suppliers:"Suppliers","dispense-log":"Dispense Log","stock-orders":"Stock Orders",returns:"Returns"}; title(names[id]||"Pharmacist Module");
    const renderers={inventory:renderInventory,prescriptions:renderPrescriptions,billing:renderBilling,reports:renderReports,suppliers:renderSuppliers,"dispense-log":renderDispenseLog,"stock-orders":renderOrders,returns:renderReturns};
    if(renderers[id]) renderers[id](); else box.innerHTML='<div class="page-card"><h3>Page not available</h3></div>';
    // Also update sidebar active state to match programmatic navigation
    document.querySelectorAll('.nav-link').forEach(el=>{
      el.classList.toggle('active', el.getAttribute('data-id')===id);
    });
  }
  // Expose showPage globally so inline onclick attributes in rendered HTML can call it
  window._pharmShowPage = function(id){
    showPage(id);
  };
  window.showPage = function(id){
    showPage(id);
  };

  function pageHead(h,p,action=""){return `<div class="page-heading"><div><h2>${h}</h2><p>${p}</p></div>${action?`<div class="page-actions">${action}</div>`:""}</div>`;}
  function renderInventory(){
    syncPharmacyWithAdminStock();
    const b=document.getElementById("dynamic-page-content");
    b.innerHTML=pageHead("Inventory Management","Manage pharmacy stock, prices and reorder levels.",'<button class="btn-primary" id="add-stock">+ Add Stock</button>')+`<div class="metric-grid"><div class="metric-card"><span>Total Medicines</span><strong>${pharmacyUI.inventory.length}</strong></div><div class="metric-card"><span>Total Units</span><strong>${pharmacyUI.inventory.reduce((a,x)=>a+x.quantity,0)}</strong></div><div class="metric-card"><span>Low Stock</span><strong>${pharmacyUI.inventory.filter(x=>x.quantity>0&&x.quantity<=x.reorderLevel).length}</strong></div><div class="metric-card"><span>Out of Stock</span><strong>${pharmacyUI.inventory.filter(x=>x.quantity<=0).length}</strong></div></div><div class="page-card"><div class="toolbar"><div class="search-box"><span>⌕</span><input id="inv-search" placeholder="Search medicine or category..."></div><button class="btn-secondary" id="low-stock">Show Low Stock</button></div><div class="table-wrap"><table class="data-table"><thead><tr><th>ID</th><th>Medicine</th><th>Category</th><th>Quantity</th><th>Unit Price</th><th>Selling Price</th><th>Reorder</th><th>Status</th><th>Actions</th></tr></thead><tbody id="inv-body"></tbody></table></div></div>`;
    const rows=(items)=>{document.getElementById("inv-body").innerHTML=items.length?items.map(x=>{const s=statusFor(x);return `<tr><td>#${x.id}</td><td><strong>${escapeHtml(x.medicine)}</strong></td><td>${escapeHtml(x.category)}</td><td>${x.quantity}</td><td>${money(x.unitPrice)}</td><td>${money(x.sellingPrice)}</td><td>${x.reorderLevel}</td><td><span class="status-badge ${s[1]}">${s[0]}</span></td><td><button class="btn-small" data-edit="${x.id}">Edit</button> <button class="btn-small danger" data-del="${x.id}">Delete</button></td></tr>`}).join(""):`<tr><td colspan="9" class="empty-state">No medicines found.</td></tr>`};
    rows(pharmacyUI.inventory);
    document.getElementById("inv-search").oninput=e=>{const q=e.target.value.toLowerCase();rows(pharmacyUI.inventory.filter(x=>(x.medicine+" "+x.category).toLowerCase().includes(q)));};
    document.getElementById("low-stock").onclick=()=>rows(pharmacyUI.inventory.filter(x=>x.quantity<=x.reorderLevel));
    document.getElementById("add-stock").onclick=()=>stockForm();
    b.querySelectorAll("[data-edit]").forEach(e=>e.onclick=()=>stockForm(+e.dataset.edit));
    b.querySelectorAll("[data-del]").forEach(e=>e.onclick=()=>{const id=+e.dataset.del;if(confirm("Delete this demo stock item?")){pharmacyUI.inventory=pharmacyUI.inventory.filter(x=>x.id!==id);savePUI();renderInventory();toast("Stock deleted.");}});
  }
  function stockForm(id=null){
    const b=document.getElementById("dynamic-page-content"),x=id?pharmacyUI.inventory.find(a=>a.id===id):null;
    b.innerHTML=pageHead(x?"Edit Stock":"Add Stock","Manage medicine details in pharmacy inventory.")+`
    <div class="page-card">
      <form id="stock-form">
        <div class="form-grid">
          <div class="form-group"><label>Medicine Name *</label><input id="sm" required placeholder="e.g. Paracetamol 500mg" value="${escapeHtml(x?.medicine||"")}"></div>
          <div class="form-group"><label>Category *</label><input id="sc" required placeholder="e.g. Analgesic, Antibiotic" value="${escapeHtml(x?.category||"")}"></div>
          <div class="form-group"><label>Quantity *</label><input id="sq" type="number" min="0" required placeholder="e.g. 50" value="${x?.quantity??""}"></div>
          <div class="form-group"><label>Reorder Level *</label><input id="sr" type="number" min="0" required placeholder="e.g. 10" value="${x?.reorderLevel??10}"></div>
          <div class="form-group"><label>Unit Price (₹) *</label><input id="su" type="number" step="0.01" min="0" required placeholder="e.g. 10.00" value="${x?.unitPrice??""}"></div>
          <div class="form-group"><label>Selling Price (₹) *</label><input id="ss" type="number" step="0.01" min="0" required placeholder="e.g. 15.00" value="${x?.sellingPrice??""}"></div>
        </div>
        <div class="form-actions">
          <button type="button" class="btn-secondary" id="cancel-stock">Cancel</button>
          <button class="btn-primary" type="submit">${x?"Update":"Save"} Stock</button>
        </div>
      </form>
    </div>`;
    document.getElementById("cancel-stock").onclick=renderInventory;
    document.getElementById("stock-form").onsubmit=e=>{
      e.preventDefault();
      const medicine=sm.value.trim(),category=sc.value.trim();
      const qVal=sq.value.trim(), rVal=sr.value.trim(), uVal=su.value.trim(), sVal=ss.value.trim();

      if(!medicine){ toast("Medicine Name is mandatory."); sm.focus(); return; }
      if(!category){ toast("Category is mandatory."); sc.focus(); return; }
      if(qVal==="" || isNaN(+qVal) || +qVal < 0){ toast("Quantity is mandatory and cannot be negative."); sq.focus(); return; }
      if(rVal==="" || isNaN(+rVal) || +rVal < 0){ toast("Reorder Level is mandatory."); sr.focus(); return; }
      if(uVal==="" || isNaN(+uVal) || +uVal < 0){ toast("Unit Price is mandatory and cannot be negative."); su.focus(); return; }
      if(sVal==="" || isNaN(+sVal) || +sVal <= 0){ toast("Selling Price is mandatory and must be greater than 0."); ss.focus(); return; }
      if(+sVal < +uVal){ toast("Selling Price cannot be less than Unit Price."); ss.focus(); return; }

      const quantity=+qVal, reorderLevel=+rVal, unitPrice=+uVal, sellingPrice=+sVal;
      if(x) Object.assign(x,{medicine,category,quantity,reorderLevel,unitPrice,sellingPrice});
      else pharmacyUI.inventory.push({id:Math.max(0,...pharmacyUI.inventory.map(a=>a.id))+1,medicine,category,quantity,reorderLevel,unitPrice,sellingPrice});
      savePUI();
      renderInventory();
      toast(x?"Stock updated successfully.":"Stock added successfully.");
    };
  }
  function renderPrescriptions(){
    const b = document.getElementById("dynamic-page-content");
    if (!b) return;
    syncPharmacyWithAdminStock();
    const liveRx = getSharedDoctorPrescriptions();

    b.innerHTML = pageHead("Prescription Queue","Review doctor recommendations, check Admin stock availability, and issue medicines to patients.") + `
      <div class="page-card">
        <div class="toolbar">
          <div class="search-box"><span>⌕</span><input id="rx-search" placeholder="Search patient, prescription or doctor..."></div>
          <button class="btn-primary" onclick="document.getElementById('quick-dispense-fab')?.click()">+ Quick Dispense</button>
        </div>
        <div class="table-wrap">
          <table class="data-table">
            <thead>
              <tr>
                <th>Prescription</th>
                <th>Patient</th>
                <th>Doctor</th>
                <th>Date</th>
                <th>Symptoms / Diagnosis</th>
                <th>Doctor Recommended Medicines &amp; Admin Stock</th>
                <th>Status</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody id="rx-body"></tbody>
          </table>
        </div>
      </div>
    `;

    const renderRows = (items) => {
      const tbody = document.getElementById("rx-body");
      if (!tbody) return;
      if (!items || items.length === 0) {
        tbody.innerHTML = `<tr><td colspan="8" class="empty-state">No prescription requests from doctors yet.</td></tr>`;
        return;
      }

      tbody.innerHTML = items.map(x => {
        let medsHtml = '';
        if (Array.isArray(x.items) && x.items.length > 0) {
          medsHtml = x.items.map(it => {
            const stockCheck = typeof checkMedicineStock === 'function' ? checkMedicineStock(it.medicineName) : { inStock: true, quantity: 50 };
            const badge = stockCheck.inStock
              ? `<span class="status-badge status-good" style="font-size:10px;margin-left:4px;">In Stock: ${stockCheck.quantity}</span>`
              : `<span class="status-badge status-out" style="font-size:10px;margin-left:4px;">OUT OF STOCK</span>`;
            return `<div style="margin-bottom:4px;line-height:1.4;"><strong>${escapeHtml(it.medicineName)}</strong> ${escapeHtml(it.dosage || '')} <span class="muted">(${escapeHtml(it.frequency || '1-0-1')}, ${escapeHtml(it.duration || '5 Days')})</span> ${badge}</div>`;
          }).join('');
        } else {
          medsHtml = `<div>${escapeHtml(x.medicines || 'Medications')}</div>`;
        }

        const isDispensed = x.status === "Dispensed";
        const statusBadge = isDispensed
          ? `<span class="status-badge status-good">Issued to Patient</span>`
          : `<span class="status-badge status-info">Pending Issue</span>`;

        const actionBtn = isDispensed
          ? `<span style="font-size:12px;color:#23814c;font-weight:700;">✓ Issued</span> <button class="btn-small" style="background:#e8f5e9;color:#2e7d32;margin-left:6px;" data-bill="${x.id}">Generate Bill</button>`
          : `<button class="btn-small" data-rx="${x.id}" style="background:#4b3fe4;color:#fff;font-weight:700;">Issue Medicines</button> <button class="btn-small" style="background:#e8f5e9;color:#2e7d32;margin-left:6px;" data-bill="${x.id}">Generate Bill</button>`;

        const diagText = x.diagnosis || x.symptoms || '—';

        return `
          <tr>
            <td><strong>${escapeHtml(x.id)}</strong></td>
            <td><strong>${escapeHtml(x.patient)}</strong><div class="muted">${escapeHtml(x.patientId)}</div></td>
            <td>${escapeHtml(x.doctor)}</td>
            <td>${escapeHtml(x.date)}</td>
            <td><div style="max-width:180px;font-size:12px;color:#555873;">${escapeHtml(diagText)}</div></td>
            <td><div style="max-width:320px;">${medsHtml}</div></td>
            <td>${statusBadge}</td>
            <td>${actionBtn}</td>
          </tr>
        `;
      }).join("");

      tbody.querySelectorAll("[data-rx]").forEach(e => {
        e.onclick = () => dispense(e.dataset.rx);
      });
      tbody.querySelectorAll("[data-bill]").forEach(e => {
        e.onclick = () => loadPrescriptionForBilling(e.dataset.bill);
      });
    };

    renderRows(liveRx);

    const searchInput = document.getElementById("rx-search");
    if (searchInput) {
      searchInput.oninput = e => {
        const q = e.target.value.toLowerCase();
        renderRows(liveRx.filter(x => (x.id + " " + x.patient + " " + x.doctor + " " + x.medicines + " " + (x.diagnosis||'')).toLowerCase().includes(q)));
      };
    }
  }

  function dispense(id){
    const liveRx = getSharedDoctorPrescriptions();
    const r = liveRx.find(x => x.id === id);
    if (!r) {
      toast("Prescription request not found.");
      return;
    }

    if (!confirm(`Issue doctor-recommended medicines for ${r.patient} (${r.id})?`)) return;

    const itemsToDispense = Array.isArray(r.items) && r.items.length > 0
      ? r.items
      : [{ medicineName: (r.medicines || '').split(" × ")[0].split(" ")[0] || 'Medicine', dosage: "" }];

    // 1. Verify stock availability in Admin inventory
    for (const it of itemsToDispense) {
      const stockCheck = typeof checkMedicineStock === 'function' ? checkMedicineStock(it.medicineName) : { inStock: true, quantity: 50 };
      if (!stockCheck.inStock) {
        alert(`Cannot issue prescription: "${it.medicineName}" is currently OUT OF STOCK in Admin inventory (Stock: ${stockCheck.quantity}). Please ask the Admin to restock before issuing to patient.`);
        return;
      }
    }

    // 2. Deduct stock from Admin inventory
    const medNamesIssued = [];
    for (const it of itemsToDispense) {
      if (typeof deductAdminMedicineStock === 'function') {
        deductAdminMedicineStock(it.medicineName, 1);
      }
      medNamesIssued.push(it.medicineName);
    }

    // 3. Mark prescription as Dispensed in CMS_KEYS.PRESCRIPTIONS
    const sharedRx = getStorage(CMS_KEYS.PRESCRIPTIONS, []);
    const matchIdx = sharedRx.findIndex(rx =>
      rx.prescriptionId === r.id ||
      `RX-${rx.appointmentId}` === r.id ||
      (rx.patientId === r.patientId && rx.status !== 'Dispensed')
    );
    if (matchIdx >= 0) {
      sharedRx[matchIdx].status = 'Dispensed';
      sharedRx[matchIdx].dispensedAt = new Date().toISOString();
      sharedRx[matchIdx].dispensedBy = data.currentUser.name;
      setStorage(CMS_KEYS.PRESCRIPTIONS, sharedRx);
    }

    r.status = "Dispensed";

    // 4. Record transaction in dispenseLog
    pharmacyUI.dispenseLog.unshift({
      id: "D-" + (502 + pharmacyUI.dispenseLog.length),
      patient: r.patient,
      medicine: medNamesIssued.join(", "),
      quantity: medNamesIssued.length,
      date: new Date().toLocaleDateString('en-GB'),
      pharmacist: data.currentUser.name
    });

    const c = data.statCards.find(x => x.id === "prescriptions-filled");
    if (c) c.value++;

    savePUI();
    syncPharmacyWithAdminStock();
    renderPrescriptions();

    // Notify other portals (Doctor history and Admin inventory)
    try {
      window.dispatchEvent(new Event('cms_rx_updated'));
      window.dispatchEvent(new Event('cms_stock_updated'));
    } catch(e) {}

    toast(`Medicines successfully issued to ${r.patient} based on Doctor recommendation!`);
  }

  /* ── Pharmacy Bill Generation (Prescription-Based) ─────────────────────── */
  let currentPharmacyBill = {
    prescriptionId: null, patientId: null, patientName: '', doctorName: '', consultationId: null,
    items: [], subtotal: 0, tax: 0, totalAmount: 0
  };

  /**
   * Looks up admin medicine MRP from cms_medicines localStorage key.
   * Falls back to pharmacist local inventory, then to 0.
   */
  function getAdminMedicinePrice(medicineName) {
    // First try cms_medicines (synced from admin)
    try {
      const cmsMeds = JSON.parse(localStorage.getItem('cms_medicines') || '[]');
      const found = cmsMeds.find(m =>
        (m.name || m.MedicineName || '').toLowerCase() === (medicineName || '').toLowerCase()
      );
      if (found) {
        const mrp = Number(found.mrp || found.MRP || found.sellingPrice || 0);
        if (mrp > 0) return mrp;
      }
    } catch(e) {}
    // Fallback: admin data storage
    try {
      const adminData = JSON.parse(localStorage.getItem('carepointClinicAdminDataV2') || '{}');
      const meds = adminData.medicines || [];
      const found = meds.find(m =>
        (m.MedicineName || '').toLowerCase() === (medicineName || '').toLowerCase()
      );
      if (found) {
        const mrp = Number(found.MRP || 0);
        if (mrp > 0) return mrp;
      }
    } catch(e) {}
    // Fallback: pharmacist local inventory
    const stock = pharmacyUI.inventory.find(m =>
      (m.medicine || '').toLowerCase().startsWith((medicineName || '').toLowerCase())
    );
    return stock ? stock.sellingPrice : 0;
  }

  /**
   * Builds bill items from a prescription row and renders the billing page
   * with a fully-populated, auto-calculated summary table (read-only).
   */
  function loadPrescriptionForBilling(rxId) {
    const liveRx = getSharedDoctorPrescriptions();
    const rx = liveRx.find(x => x.id === rxId) || pharmacyUI.prescriptions.find(x => x.id === rxId);
    if (!rx) { toast("Prescription not found."); return; }

    showPage("billing");

    let parsedItems = [];

    // Prefer structured items array from doctor prescription (has medicineName, dosage, frequency, duration, quantity)
    if (Array.isArray(rx.items) && rx.items.length > 0) {
      parsedItems = rx.items.map(it => {
        const qty = Math.max(1, Number(it.quantity) || 1);
        const unitPrice = getAdminMedicinePrice(it.medicineName);
        return {
          medicineName: it.medicineName || 'Medicine',
          dosage: it.dosage || '',
          frequency: it.frequency || '1-0-1',
          duration: it.duration || '5 Days',
          quantity: qty,
          unitPrice,
          totalPrice: qty * unitPrice
        };
      });
    } else {
      // Fallback: parse compact "Name × qty" strings
      const itemLines = (rx.medicines || '').split(/,|;/).map(s => s.trim()).filter(Boolean);
      parsedItems = itemLines.map(line => {
        const [namePart, qtyStr] = line.split('×').map(s => s.trim());
        const qty = Math.max(1, parseInt(qtyStr) || 1);
        const unitPrice = getAdminMedicinePrice(namePart);
        return {
          medicineName: namePart || 'Medicine',
          dosage: '',
          frequency: '1-0-1',
          duration: '5 Days',
          quantity: qty,
          unitPrice,
          totalPrice: qty * unitPrice
        };
      });
    }

    currentPharmacyBill.prescriptionId = rx.id;
    currentPharmacyBill.patientId      = rx.patientId;
    currentPharmacyBill.patientName    = rx.patient;
    currentPharmacyBill.doctorName     = rx.doctor || '';
    currentPharmacyBill.consultationId = rx.id;
    currentPharmacyBill.items          = parsedItems;

    renderBillingWithItems(parsedItems, rx);
  }

  function renderBillingWithItems(items, rx) {
    const subtotal = items.reduce((s, i) => s + i.totalPrice, 0);
    const tax      = subtotal * 0.05;
    const grand    = subtotal + tax;

    currentPharmacyBill.subtotal     = subtotal;
    currentPharmacyBill.tax          = tax;
    currentPharmacyBill.totalAmount  = grand;

    const b = document.getElementById("dynamic-page-content");
    const hasPrice = items.some(i => i.unitPrice > 0);
    const priceNote = hasPrice ? '' : `
      <div style="background:#fff8e1;border:1px solid #ffe082;border-radius:8px;padding:10px 14px;margin-bottom:14px;font-size:13px;color:#795548;">
        ⚠ Some medicines have no price set. Please ask the Admin to set MRP in the Medicines section.
      </div>`;

    const itemRows = items.map(i => `
      <tr>
        <td><strong>${escapeHtml(i.medicineName)}</strong>${i.dosage ? `<div style="font-size:11px;color:#8588a3;">${escapeHtml(i.dosage)}</div>` : ''}</td>
        <td style="font-size:12px;color:#666;">${escapeHtml(i.frequency || '1-0-1')}, ${escapeHtml(i.duration || '5 Days')}</td>
        <td>${i.quantity}</td>
        <td>${i.unitPrice > 0 ? money(i.unitPrice) : '<span style="color:#e53935;font-size:12px;">Not set</span>'}</td>
        <td><strong>${money(i.totalPrice)}</strong></td>
      </tr>`).join('');

    b.innerHTML = pageHead(
      '🧾 Pharmacy Bill',
      `Prescription ${rx.id} · ${escapeHtml(rx.patient)} · Doctor: ${escapeHtml(rx.doctor || '')}`,
      `<button class="btn-secondary" onclick="(function(){window._resetBillView&&window._resetBillView();})()">← Back to Prescriptions</button>`
    ) + `
    <div class="page-card">
      ${priceNote}
      <div class="info-grid" style="margin-bottom:18px">
        <div class="info-item"><strong>Patient Name</strong><span id="billPatientName">${escapeHtml(rx.patient)}</span></div>
        <div class="info-item"><strong>Patient ID</strong><span id="billPatientId">${escapeHtml(rx.patientId || '—')}</span></div>
        <div class="info-item"><strong>Prescription ID</strong><span id="displayPrescriptionId">${escapeHtml(rx.id)}</span></div>
        <div class="info-item"><strong>Prescribing Doctor</strong><span>${escapeHtml(rx.doctor || '—')}</span></div>
        <div class="info-item"><strong>Date</strong><span>${escapeHtml(rx.date || new Date().toLocaleDateString('en-IN'))}</span></div>
        <div class="info-item"><strong>Diagnosis / Symptoms</strong><span style="font-size:12px;">${escapeHtml(rx.diagnosis || rx.symptoms || '—')}</span></div>
      </div>

      <div style="background:#f0f4ff;border:1px solid #c7d2fe;border-radius:10px;padding:10px 16px;margin-bottom:14px;font-size:13px;color:#3730a3;">
        🔒 <strong>Medicines are auto-populated from the doctor's prescription.</strong> Prices are fetched from Admin inventory. Pharmacist cannot modify this list.
      </div>

      <div class="table-wrap" style="margin-bottom:18px">
        <table class="data-table">
          <thead><tr><th>Medicine</th><th>Frequency &amp; Duration</th><th>Qty</th><th>Unit Price (MRP)</th><th>Total (₹)</th></tr></thead>
          <tbody id="pharmacyItemsBody">${itemRows}</tbody>
        </table>
      </div>
      <div class="bill-summary">
        <div class="bill-total" style="text-align:left;min-width:300px;background:#f7f6ff;border:1px solid #e0e0fa;border-radius:14px;padding:18px 22px;">
          <div style="display:flex;justify-content:space-between;margin-bottom:8px">
            <span style="color:#777b98;font-size:13px">Subtotal</span>
            <span id="pharmacySubtotal" style="font-weight:600;">${money(subtotal)}</span>
          </div>
          <div style="display:flex;justify-content:space-between;margin-bottom:8px">
            <span style="color:#777b98;font-size:13px">GST (5%)</span>
            <span id="pharmacyTax" style="font-weight:600;">${money(tax)}</span>
          </div>
          <div style="display:flex;justify-content:space-between;border-top:2px solid #ececf5;padding-top:12px;margin-top:6px">
            <strong style="font-size:15px;">Total Amount</strong>
            <strong id="pharmacyTotalAmount" style="color:#4b3fe4;font-size:22px;">${money(grand)}</strong>
          </div>
        </div>
      </div>
      <div class="form-actions" style="margin-top:24px;gap:12px;">
        <button type="button" class="btn-secondary" id="btnCancelBill">✕ Cancel</button>
        <button type="button" class="btn-primary" id="btnSendToReceptionist" style="background:linear-gradient(135deg,#4b3fe4,#0d9488);padding:11px 28px;font-size:15px;letter-spacing:.02em;">
          ✉ Generate &amp; Send Bill to Receptionist
        </button>
      </div>
    </div>
    <div class="page-card" style="margin-top:0">
      <h3 style="margin-bottom:14px;">📋 Recent Bills Sent to Receptionist</h3>
      <div class="table-wrap"><table class="data-table">
        <thead><tr><th>Bill ID</th><th>Patient</th><th>Prescription</th><th>Total Amount</th><th>Status</th><th>Date</th></tr></thead>
        <tbody>${pharmacyUI.bills.length ? pharmacyUI.bills.map(x=>`<tr><td><strong>${x.id}</strong></td><td>${escapeHtml(x.patient)}</td><td>${escapeHtml(x.prescriptionId||x.medicine||'—')}</td><td><strong style="color:#4b3fe4;">${money(x.total||x.amount||0)}</strong></td><td><span class="status-badge ${x.status==='Sent'||x.status==='Pending'?'status-info':'status-good'}">${x.status||'Sent'}</span></td><td>${x.date}</td></tr>`).join('') : '<tr><td colspan="6" class="empty-state">No bills sent yet.</td></tr>'}</tbody>
      </table></div>
    </div>`;

    document.getElementById('btnCancelBill').onclick   = resetPharmacyBill;
    document.getElementById('btnSendToReceptionist').onclick = submitPharmacyBillToReceptionist;

    // expose back-nav helper for the header button
    window._resetBillView = resetPharmacyBill;
  }

  /**
   * Sends the generated pharmacy bill to the receptionist via localStorage.
   * Writes to both "pending_receptionist_bills" (for the consolidated invoice
   * search flow) AND to CMS_KEYS.BILLS (so it appears immediately in the
   * receptionist's main billing table — the same key used by the lab module).
   */
  async function submitPharmacyBillToReceptionist() {
    if (!currentPharmacyBill.prescriptionId || !currentPharmacyBill.items.length) {
      toast('No prescription items to bill.'); return;
    }

    const billId = 'PB-' + Date.now();
    const payload = {
      id:             billId,
      billId:         billId,
      ...currentPharmacyBill,
      billType:       'PHARMACY',
      status:         'PENDING_RECEPTIONIST_PAYMENT',
      generatedBy:    data.currentUser.name,
      generatedAt:    new Date().toISOString(),
      // Human-readable breakdown for receptionist
      medicinesSummary: currentPharmacyBill.items.map(i =>
        `${i.medicineName}${i.dosage ? ' ' + i.dosage : ''} × ${i.quantity} @ ${money(i.unitPrice)} = ${money(i.totalPrice)}`
      ).join(' | ')
    };

    const btn = document.getElementById('btnSendToReceptionist');
    if (btn) { btn.disabled = true; btn.textContent = 'Sending…'; }

    try {
      const token = localStorage.getItem('token') || localStorage.getItem('accessToken');
      const res = await fetch('/api/pharmacist/bills/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
        body: JSON.stringify(payload)
      });
      if (!res.ok) throw new Error('API error');
      const d = await res.json();
      toast(`Bill #${d.id || billId} sent to Receptionist.`);
    } catch (_) {
      // ── Offline / prototype fallback ──

      // 1. pending_receptionist_bills (consolidated invoice search)
      const pending = JSON.parse(localStorage.getItem('pending_receptionist_bills') || '[]');
      pending.push(payload);
      localStorage.setItem('pending_receptionist_bills', JSON.stringify(pending));

      // 2. CMS_KEYS.BILLS — immediately visible in receptionist billing table
      const sharedBillEntry = {
        id:              billId,
        billId:          billId,
        patientId:       currentPharmacyBill.patientId,
        patientName:     currentPharmacyBill.patientName,
        doctorName:      currentPharmacyBill.doctorName || '',
        prescriptionId:  currentPharmacyBill.prescriptionId,
        source:          'Pharmacy',
        billType:        'PHARMACY',
        // Full items array so receptionist can show itemised details
        items:           currentPharmacyBill.items,
        subtotal:        currentPharmacyBill.subtotal,
        tax:             currentPharmacyBill.tax,
        amount:          currentPharmacyBill.totalAmount,
        totalAmount:     currentPharmacyBill.totalAmount,
        medicinesSummary: payload.medicinesSummary,
        status:          'Pending',
        date:            new Date().toLocaleDateString('en-IN'),
        generatedBy:     data.currentUser.name,
        generatedAt:     payload.generatedAt
      };

      const cmsBills = typeof getStorage === 'function'
        ? getStorage(CMS_KEYS.BILLS, [])
        : JSON.parse(localStorage.getItem(CMS_KEYS.BILLS) || '[]');

      // Avoid duplicate entries if re-submitted
      const alreadyExists = cmsBills.some(b =>
        b.prescriptionId === sharedBillEntry.prescriptionId
      );
      if (!alreadyExists) {
        cmsBills.unshift(sharedBillEntry);
        if (typeof setStorage === 'function') {
          setStorage(CMS_KEYS.BILLS, cmsBills);
        } else {
          localStorage.setItem(CMS_KEYS.BILLS, JSON.stringify(cmsBills));
        }
      }

      // 3. Also track in local pharmacyUI.bills for the Recent Bills table
      pharmacyUI.bills.unshift({
        id:            billId,
        patient:       currentPharmacyBill.patientName,
        prescriptionId: currentPharmacyBill.prescriptionId,
        medicine:      currentPharmacyBill.items.map(i => i.medicineName).join(', '),
        quantity:      currentPharmacyBill.items.reduce((a, i) => a + i.quantity, 0),
        unitPrice:     currentPharmacyBill.subtotal,
        total:         currentPharmacyBill.totalAmount,
        amount:        currentPharmacyBill.totalAmount,
        status:        'Sent',
        date:          new Date().toLocaleDateString('en-IN')
      });
      savePUI();

      toast(`✅ Bill ${billId} forwarded to Receptionist successfully!`);
    } finally {
      if (btn) { btn.disabled = false; btn.textContent = '✉ Generate & Send Bill to Receptionist'; }
      resetPharmacyBill();
    }
  }

  /** Clears the active bill and navigates back to Prescriptions. */
  function resetPharmacyBill() {
    currentPharmacyBill = { prescriptionId: null, patientId: null, patientName: '', doctorName: '', consultationId: null, items: [], subtotal: 0, tax: 0, totalAmount: 0 };
    // Navigate to prescriptions so pharmacist can see the queue
    const rxBtn = document.querySelector('[data-id="prescriptions"]');
    if (rxBtn) { rxBtn.click(); } else { showPage('prescriptions'); }
  }

  function renderBilling(){
    const b = document.getElementById('dynamic-page-content');
    b.innerHTML = pageHead('Pharmacy Billing', 'Pharmacy bills are auto-generated from doctor prescriptions.') + `
    <div class="page-card" style="text-align:center;padding:40px 24px;">
      <div style="font-size:3rem;margin-bottom:14px;">💊</div>
      <h3 style="color:#252642;margin-bottom:8px;">Bills Are Generated From Prescriptions</h3>
      <p style="color:#777b98;max-width:480px;margin:0 auto 20px;font-size:14px;line-height:1.6;">
        Medicines are automatically populated from the doctor's prescription. Prices are fetched from the Admin medicine catalog.
        To generate a bill, go to <strong>Prescriptions</strong>, find the dispensed prescription, and click <strong>Generate Bill</strong>.
      </p>
      <button class="btn-primary" id="billing-goto-rx-btn" onclick="window.showPage('prescriptions')" style="padding:12px 28px;font-size:15px;">
        &#8594; Go to Prescriptions
      </button>
    </div>
    <div class="page-card" style="margin-top:0">
      <h3 style="margin-bottom:14px;">&#128203; Bills Sent to Receptionist</h3>
      <div class="table-wrap"><table class="data-table">
        <thead><tr><th>Bill ID</th><th>Patient</th><th>Prescription</th><th>Medicines</th><th>Total Amount</th><th>Status</th><th>Date</th></tr></thead>
        <tbody>${pharmacyUI.bills.length ? pharmacyUI.bills.map(x=>`<tr>
          <td><strong>${x.id}</strong></td>
          <td>${escapeHtml(x.patient)}</td>
          <td><span class="muted">${escapeHtml(x.prescriptionId||'—')}</span></td>
          <td style="font-size:12px;max-width:220px;white-space:normal;">${escapeHtml(x.medicine||'—')}</td>
          <td><strong style="color:#4b3fe4;">${money(x.total||x.amount||0)}</strong></td>
          <td><span class="status-badge ${x.status==='Sent'||x.status==='Pending'?'status-info':'status-good'}">${x.status||'Sent'}</span></td>
          <td>${x.date}</td></tr>`).join('') : '<tr><td colspan="7" class="empty-state">No bills sent yet. <button class="btn-small" onclick="window.showPage(\'prescriptions\')" style="margin-left:8px;background:#4b3fe4;color:#fff;">Go to Prescriptions &rarr;</button></td></tr>'}
        </tbody>
      </table></div>
    </div>`;

    // Wire up the "Go to Prescriptions" button safely — no inline onclick needed
    const gotoBtn = document.getElementById('billing-goto-rx-btn');
    if (gotoBtn) {
      gotoBtn.addEventListener('click', function() {
        // Click the sidebar nav link so active state also updates
        const rxNavBtn = document.querySelector('[data-id="prescriptions"]');
        if (rxNavBtn) { rxNavBtn.click(); } else { showPage('prescriptions'); }
      });
    }
  }
  function renderReports(){const b=document.getElementById("dynamic-page-content"),revenue=pharmacyUI.bills.reduce((a,x)=>a+x.total,0),low=pharmacyUI.inventory.filter(x=>x.quantity<=x.reorderLevel);b.innerHTML=pageHead("Pharmacy Reports","Review revenue and medicines below reorder level.")+`<div class="metric-grid"><div class="metric-card"><span>Total Revenue</span><strong>${money(revenue)}</strong></div><div class="metric-card"><span>Total Bills</span><strong>${pharmacyUI.bills.length}</strong></div><div class="metric-card"><span>Units Dispensed</span><strong>${pharmacyUI.dispenseLog.reduce((a,x)=>a+x.quantity,0)}</strong></div><div class="metric-card"><span>Reorder Alerts</span><strong>${low.length}</strong></div></div><div class="page-card"><h3>Medicines Below Reorder Level</h3><p class="muted">Current quantity is less than or equal to reorder level.</p><div class="table-wrap"><table class="data-table"><thead><tr><th>Medicine</th><th>Category</th><th>Current</th><th>Reorder Level</th><th>Action</th></tr></thead><tbody>${low.length?low.map(x=>`<tr><td><strong>${escapeHtml(x.medicine)}</strong></td><td>${escapeHtml(x.category)}</td><td>${x.quantity}</td><td>${x.reorderLevel}</td><td><span class="status-badge status-low">Reorder</span></td></tr>`).join(""):"<tr><td colspan=5 class=empty-state>No reorder alerts.</td></tr>"}</tbody></table></div></div>`;}
  function simpleTable(titleText,subtitle,headers,rows){const b=document.getElementById("dynamic-page-content");b.innerHTML=pageHead(titleText,subtitle)+`<div class="page-card"><div class="table-wrap"><table class="data-table"><thead><tr>${headers.map(x=>`<th>${x}</th>`).join("")}</tr></thead><tbody>${rows}</tbody></table></div></div>`;}
  function renderDispenseLog(){simpleTable("Dispense Log","Track completed medicine dispensing transactions.",["ID","Patient","Medicine","Quantity","Date","Pharmacist"],pharmacyUI.dispenseLog.map(x=>`<tr><td>${x.id}</td><td>${escapeHtml(x.patient)}</td><td>${escapeHtml(x.medicine)}</td><td>${x.quantity}</td><td>${x.date}</td><td>${escapeHtml(x.pharmacist)}</td></tr>`).join(""));}
  function renderReturns(){simpleTable("Medicine Returns","Review returned or rejected pharmacy items.",["Return ID","Patient","Medicine","Quantity","Reason","Date","Status"],pharmacyUI.returns.map(x=>`<tr><td>${x.id}</td><td>${escapeHtml(x.patient)}</td><td>${escapeHtml(x.medicine)}</td><td>${x.quantity}</td><td>${escapeHtml(x.reason)}</td><td>${x.date}</td><td><span class="status-badge ${x.status==="Pending"?"status-low":"status-good"}">${x.status}</span></td></tr>`).join(""));}

  /* ========================================================================
     REORDER WORKFLOW (replaces the old stub renderOrders + renderSuppliers)
     Storage key: "cms_reorder_requests"   (shared between pharmacist & admin)
     Each request object:
     { id, medicineId, medicine, supplier, quantity, note, status,
       requestedBy, requestedAt,
       adminAction, adminNote, adminBy, adminAt,
       receivedQuantity, receivedAt }
     Status lifecycle: Pending → Approved | Rejected → Received
     ======================================================================== */
  const REORDER_KEY = 'cms_reorder_requests';

  function loadReorders() {
    try { return JSON.parse(localStorage.getItem(REORDER_KEY) || '[]'); } catch(e) { return []; }
  }
  function saveReorders(arr) {
    localStorage.setItem(REORDER_KEY, JSON.stringify(arr));
  }

  /** Pharmacist: submit a new reorder request */
  function submitReorderRequest(medicine, supplier, quantity, note) {
    if (!medicine) { toast('Please select a medicine.'); return false; }
    if (!quantity || isNaN(+quantity) || +quantity <= 0) { toast('Quantity must be a positive number.'); return false; }

    const existing = loadReorders();
    const dup = existing.find(r =>
      r.medicine === medicine && (r.status === 'Pending' || r.status === 'Approved')
    );
    if (dup) {
      toast(`A reorder request for "${medicine}" is already ${dup.status}. Wait for admin action.`);
      return false;
    }

    const newReq = {
      id:          'RO-' + Date.now(),
      medicine,
      supplier:    supplier || '(Not specified)',
      quantity:    +quantity,
      note:        note || '',
      status:      'Pending',
      requestedBy: data.currentUser.name,
      requestedAt: new Date().toISOString(),
      adminAction: null, adminNote: '', adminBy: '', adminAt: null,
      receivedQuantity: null, receivedAt: null
    };

    existing.unshift(newReq);
    saveReorders(existing);

    // Audit log entry in shared audit store
    try {
      const auditLog = JSON.parse(localStorage.getItem('cms_pharmacy_audit') || '[]');
      auditLog.unshift({
        id: 'AL-' + Date.now(), action: 'REORDER_REQUESTED',
        detail: `${data.currentUser.name} requested reorder of ${medicine} (qty: ${+quantity}) from supplier: ${supplier||'N/A'}`,
        by: data.currentUser.name, at: new Date().toISOString()
      });
      localStorage.setItem('cms_pharmacy_audit', JSON.stringify(auditLog));
    } catch(e) {}

    toast(`Reorder request for "${medicine}" submitted to Admin.`);
    return true;
  }

  /** Pharmacist: mark an approved request as Received and update stock */
  function markReorderReceived(reqId, receivedQty) {
    if (!receivedQty || isNaN(+receivedQty) || +receivedQty <= 0) {
      toast('Enter a valid received quantity (positive number).');
      return false;
    }
    const all = loadReorders();
    const idx = all.findIndex(r => r.id === reqId);
    if (idx < 0) { toast('Request not found.'); return false; }
    const req = all[idx];
    if (req.status !== 'Approved') {
      toast('Only Admin-approved requests can be marked as received.');
      return false;
    }

    req.status           = 'Received';
    req.receivedQuantity = +receivedQty;
    req.receivedAt       = new Date().toISOString();
    saveReorders(all);

    // Auto-update pharmacist local inventory stock
    const invItem = pharmacyUI.inventory.find(m =>
      (m.medicine || '').toLowerCase().includes((req.medicine || '').toLowerCase())
    );
    if (invItem) {
      invItem.quantity += +receivedQty;
      savePUI();
      syncPharmacyWithAdminStock();
    }

    // Audit log
    try {
      const auditLog = JSON.parse(localStorage.getItem('cms_pharmacy_audit') || '[]');
      auditLog.unshift({
        id: 'AL-' + Date.now(), action: 'STOCK_RECEIVED',
        detail: `${data.currentUser.name} received ${+receivedQty} units of "${req.medicine}" (Request ${reqId})`,
        by: data.currentUser.name, at: new Date().toISOString()
      });
      localStorage.setItem('cms_pharmacy_audit', JSON.stringify(auditLog));
    } catch(e) {}

    toast(`Stock updated: +${receivedQty} units of "${req.medicine}" added to inventory.`);
    return true;
  }

  /** Render the Stock Orders page — full reorder workflow for pharmacist */
  function renderOrders() {
    const b = document.getElementById('dynamic-page-content');
    const all = loadReorders();
    const lowStock = pharmacyUI.inventory.filter(x => x.quantity <= x.reorderLevel);

    const statusBadgeClass = s => ({
      'Pending':  'status-low',
      'Approved': 'status-good',
      'Rejected': 'status-out',
      'Received': 'status-info'
    }[s] || 'status-info');

    const tableRows = all.length
      ? all.map(r => {
          const canReceive = r.status === 'Approved';
          const actionCell = canReceive
            ? `<button class="btn-small" style="background:#4b3fe4;color:#fff;" data-receive="${r.id}">Mark Received</button>`
            : `<span class="muted" style="font-size:12px;">${r.status === 'Received' ? `&#10003; Received (${r.receivedQuantity} units)` : r.status === 'Rejected' ? `&#10007; Rejected` : 'Awaiting admin'}</span>`;
          const adminNote = r.adminNote ? `<div class="muted" style="font-size:11px;margin-top:3px;">Admin note: ${escapeHtml(r.adminNote)}</div>` : '';
          return `<tr>
            <td><strong>${escapeHtml(r.id)}</strong></td>
            <td><strong>${escapeHtml(r.medicine)}</strong></td>
            <td>${escapeHtml(r.supplier)}</td>
            <td>${r.quantity}</td>
            <td>${escapeHtml(r.requestedBy)}</td>
            <td>${new Date(r.requestedAt).toLocaleDateString('en-IN')}</td>
            <td><span class="status-badge ${statusBadgeClass(r.status)}">${r.status}</span>${adminNote}</td>
            <td>${actionCell}</td>
          </tr>`;
        }).join('')
      : '<tr><td colspan="8" class="empty-state">No reorder requests yet. Use the form below to request a restock.</td></tr>';

    const lowStockOptions = lowStock.length
      ? lowStock.map(x => `<option value="${escapeHtml(x.medicine)}">${escapeHtml(x.medicine)} (Stock: ${x.quantity} / Reorder: ${x.reorderLevel})</option>`).join('')
      : pharmacyUI.inventory.map(x => `<option value="${escapeHtml(x.medicine)}">${escapeHtml(x.medicine)}</option>`).join('');

    const supplierOptions = pharmacyUI.suppliers.map(s => `<option value="${escapeHtml(s.name)}">${escapeHtml(s.name)}</option>`).join('');

    b.innerHTML = pageHead(
      'Stock Orders &amp; Reorder Requests',
      'Request medicine restocks from suppliers. All requests need Admin approval before stock is updated.',
      `<span class="status-badge status-low" style="font-size:13px;padding:8px 14px;">${lowStock.length} Low/Out of Stock</span>`
    ) + `

    <!-- Low stock alert banner -->
    ${lowStock.length > 0 ? `
    <div style="background:#fff8e1;border:1px solid #ffe082;border-radius:12px;padding:14px 18px;margin-bottom:18px;">
      <strong style="color:#795548;">&#9888; ${lowStock.length} medicine(s) need restocking:</strong>
      <span style="color:#795548;font-size:13px;margin-left:8px;">${lowStock.map(x=>`${escapeHtml(x.medicine)} (${x.quantity} left)`).join(' &bull; ')}</span>
    </div>` : ''}

    <!-- NEW REQUEST FORM -->
    <div class="page-card" style="margin-bottom:20px;">
      <h3 style="margin-bottom:4px;">&#43; Request Reorder from Supplier</h3>
      <p class="muted" style="margin-bottom:18px;">Submit a restock request. Admin must approve before stock is updated.</p>
      <form id="reorder-form">
        <div class="form-grid">
          <div class="form-group">
            <label>Medicine *</label>
            <select id="ro-medicine" required>
              <option value="">Select medicine...</option>
              ${lowStockOptions}
            </select>
          </div>
          <div class="form-group">
            <label>Preferred Supplier</label>
            <select id="ro-supplier">
              <option value="">Select supplier (optional)...</option>
              ${supplierOptions}
            </select>
          </div>
          <div class="form-group">
            <label>Quantity to Order *</label>
            <input id="ro-qty" type="number" min="1" placeholder="e.g. 100" required>
          </div>
          <div class="form-group">
            <label>Note for Admin</label>
            <input id="ro-note" type="text" placeholder="e.g. Urgent — running low before weekend">
          </div>
        </div>
        <div class="form-actions">
          <button type="reset" class="btn-secondary">Clear</button>
          <button type="submit" class="btn-primary" style="background:linear-gradient(135deg,#4b3fe4,#0d9488);">&#128229; Submit Reorder Request to Admin</button>
        </div>
      </form>
    </div>

    <!-- REQUESTS TABLE -->
    <div class="page-card">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:14px;">
        <div>
          <h3 style="margin:0 0 4px;">&#128203; All Reorder Requests</h3>
          <p class="muted">Pending = waiting for admin · Approved = ready to receive · Received = stock updated</p>
        </div>
      </div>
      <div class="table-wrap">
        <table class="data-table">
          <thead><tr>
            <th>Request ID</th><th>Medicine</th><th>Supplier</th><th>Qty Ordered</th>
            <th>Requested By</th><th>Date</th><th>Status</th><th>Action</th>
          </tr></thead>
          <tbody id="reorder-table-body">${tableRows}</tbody>
        </table>
      </div>
    </div>`;

    // Form submit
    document.getElementById('reorder-form').addEventListener('submit', function(e) {
      e.preventDefault();
      const medicine  = document.getElementById('ro-medicine').value.trim();
      const supplier  = document.getElementById('ro-supplier').value.trim();
      const qty       = document.getElementById('ro-qty').value.trim();
      const note      = document.getElementById('ro-note').value.trim();
      if (submitReorderRequest(medicine, supplier, qty, note)) {
        renderOrders(); // re-render to show the new request
      }
    });

    // "Mark Received" buttons
    document.querySelectorAll('[data-receive]').forEach(btn => {
      btn.addEventListener('click', function() {
        const reqId = this.dataset.receive;
        const qtyStr = prompt('Enter the actual quantity received from supplier:');
        if (qtyStr === null) return; // user cancelled
        if (markReorderReceived(reqId, qtyStr)) {
          renderOrders();
        }
      });
    });
  }

  /** Render Suppliers page — view suppliers + manage reorder from here too */
  function renderSuppliers() {
    const b = document.getElementById('dynamic-page-content');
    const all = loadReorders();

    // Per-supplier order summary
    const bySupplier = {};
    all.forEach(r => {
      const key = r.supplier;
      if (!bySupplier[key]) bySupplier[key] = { pending: 0, total: 0, lastOrder: '' };
      bySupplier[key].total++;
      if (r.status === 'Pending') bySupplier[key].pending++;
      if (!bySupplier[key].lastOrder || r.requestedAt > bySupplier[key].lastOrder) {
        bySupplier[key].lastOrder = r.requestedAt;
      }
    });

    const supplierRows = pharmacyUI.suppliers.map(s => {
      const stats = bySupplier[s.name] || { pending: 0, total: 0, lastOrder: '' };
      return `<tr>
        <td>${escapeHtml(s.id)}</td>
        <td><strong>${escapeHtml(s.name)}</strong></td>
        <td>${escapeHtml(s.contact)}</td>
        <td>${escapeHtml(s.email)}</td>
        <td>${s.medicines} medicines</td>
        <td>${stats.total} orders${stats.pending > 0 ? ` <span class="status-badge status-low">${stats.pending} pending</span>` : ''}</td>
        <td>${stats.lastOrder ? new Date(stats.lastOrder).toLocaleDateString('en-IN') : '—'}</td>
        <td><button class="btn-small" data-reorder-from="${escapeHtml(s.name)}" style="background:#4b3fe4;color:#fff;">+ Reorder</button></td>
      </tr>`;
    }).join('') || '<tr><td colspan="8" class="empty-state">No suppliers configured.</td></tr>';

    b.innerHTML = pageHead('Suppliers', 'Manage medicine suppliers and initiate reorder requests.') + `
    <div class="page-card">
      <div class="table-wrap">
        <table class="data-table">
          <thead><tr>
            <th>ID</th><th>Supplier Name</th><th>Contact</th><th>Email</th>
            <th>Medicines</th><th>Orders Placed</th><th>Last Order</th><th>Action</th>
          </tr></thead>
          <tbody>${supplierRows}</tbody>
        </table>
      </div>
    </div>`;

    // Quick-jump to Stock Orders with supplier pre-selected
    document.querySelectorAll('[data-reorder-from]').forEach(btn => {
      btn.addEventListener('click', function() {
        const supplierName = this.dataset.reorderFrom;
        const soBtn = document.querySelector('[data-id="stock-orders"]');
        if (soBtn) soBtn.click(); else showPage('stock-orders');
        // Pre-select supplier after re-render
        setTimeout(() => {
          const sel = document.getElementById('ro-supplier');
          if (sel) {
            const opt = Array.from(sel.options).find(o => o.value === supplierName);
            if (opt) { sel.value = supplierName; }
          }
        }, 100);
      });
    });
  }


  /* ------------------------------------------------------------------------
     9. Responsive Sidebar & Mobile Drawer Behavior
     ------------------------------------------------------------------------ */
  function setupResponsiveBehavior() {
    const sidebar = document.getElementById("app-sidebar");
    const backdrop = document.getElementById("sidebar-backdrop");
    const hamburger = document.getElementById("hamburger-btn");

    function openMobileSidebar() {
      state.sidebarOpen = true;
      sidebar.classList.add("open");
      backdrop.classList.add("active");
      document.body.style.overflow = "hidden";
    }

    function closeMobileSidebar() {
      state.sidebarOpen = false;
      sidebar.classList.remove("open");
      backdrop.classList.remove("active");
      document.body.style.overflow = "";
    }

    if (hamburger) {
      hamburger.addEventListener("click", () => {
        if (state.sidebarOpen) {
          closeMobileSidebar();
        } else {
          openMobileSidebar();
        }
      });
    }

    if (backdrop) {
      backdrop.addEventListener("click", closeMobileSidebar);
    }

    // Close on Escape
    document.addEventListener("keydown", e => {
      if (e.key === "Escape" && state.sidebarOpen) {
        closeMobileSidebar();
      }
    });

    // Window Resize sync with matchMedia
    const mobileQuery = window.matchMedia("(max-width: 767px)");
    function handleScreenChange(e) {
      if (!e.matches && state.sidebarOpen) {
        closeMobileSidebar();
      }
    }
    mobileQuery.addEventListener("change", handleScreenChange);
  }

  /* ------------------------------------------------------------------------
     10. Quick Dispense Modal & Floating Action Button
     ------------------------------------------------------------------------ */
  function setupQuickDispenseModal() {
    const fab = document.getElementById("quick-dispense-fab");
    const modal = document.getElementById("quick-dispense-modal");
    const closeBtn = document.getElementById("modal-close-btn");
    const cancelBtn = document.getElementById("modal-cancel-btn");
    const form = document.getElementById("quick-dispense-form");
    const rxSelect = document.getElementById("dispense-prescription-select");
    const patInput = document.getElementById("dispense-patient");
    const docInput = document.getElementById("dispense-doctor");
    const summaryBox = document.getElementById("dispense-meds-summary");

    function refreshModalOptions() {
      if (!rxSelect) return;
      const liveRx = getSharedDoctorPrescriptions();
      const pendingRx = liveRx.filter(x => x.status !== 'Dispensed');

      if (pendingRx.length === 0) {
        rxSelect.innerHTML = `<option value="">No pending doctor prescriptions</option>`;
        if (summaryBox) summaryBox.innerHTML = `<span style="color:#23814c;font-weight:600;">✓ All doctor prescriptions have been issued to patients!</span>`;
        if (patInput) patInput.value = '';
        if (docInput) docInput.value = '';
        return;
      }

      rxSelect.innerHTML = `<option value="">Select pending doctor prescription (${pendingRx.length} waiting)...</option>` +
        pendingRx.map(x => `<option value="${x.id}">${x.patient} — ${x.id} (${x.doctor})</option>`).join('');

      // Auto-select first if available
      rxSelect.value = pendingRx[0].id;
      updateSelectedPrescription(pendingRx[0].id);
    }

    function updateSelectedPrescription(selectedId) {
      const liveRx = getSharedDoctorPrescriptions();
      const r = liveRx.find(x => x.id === selectedId);
      if (!r) {
        if (patInput) patInput.value = '';
        if (docInput) docInput.value = '';
        if (summaryBox) summaryBox.innerHTML = 'Select a doctor prescription above to review recommendations.';
        return;
      }

      if (patInput) patInput.value = `${r.patient} (#${r.patientId})`;
      if (docInput) docInput.value = r.doctor;

      if (summaryBox) {
        let medsHtml = '';
        if (Array.isArray(r.items) && r.items.length > 0) {
          medsHtml = r.items.map(it => {
            const stockCheck = typeof checkMedicineStock === 'function' ? checkMedicineStock(it.medicineName) : { inStock: true, quantity: 50 };
            const badge = stockCheck.inStock
              ? `<span style="background:#e9f8ef;color:#23814c;padding:2px 7px;border-radius:999px;font-size:11px;font-weight:700;">In Stock: ${stockCheck.quantity}</span>`
              : `<span style="background:#ffeaea;color:#c43d3d;padding:2px 7px;border-radius:999px;font-size:11px;font-weight:700;">OUT OF STOCK</span>`;
            return `<div style="display:flex;justify-content:space-between;align-items:center;padding:4px 0;border-bottom:1px solid #eef;"><span><strong>${escapeHtml(it.medicineName)}</strong> ${escapeHtml(it.dosage || '')} (${escapeHtml(it.frequency || '1-0-1')}, ${escapeHtml(it.duration || '5 Days')})</span>${badge}</div>`;
          }).join('');
        } else {
          medsHtml = `<div>${escapeHtml(r.medicines || 'Medications prescribed')}</div>`;
        }

        summaryBox.innerHTML = `
          <div style="font-weight:700;color:#20213d;margin-bottom:6px;">Doctor's Prescribed Items:</div>
          ${medsHtml}
          ${r.symptoms || r.diagnosis ? `<div style="margin-top:6px;font-size:12px;color:#777b98;"><em>Diagnosis/Symptoms: ${escapeHtml(r.diagnosis || r.symptoms)}</em></div>` : ''}
        `;
      }
    }

    if (rxSelect) {
      rxSelect.onchange = (e) => updateSelectedPrescription(e.target.value);
    }

    function openModal() {
      refreshModalOptions();
      modal.classList.add("active");
      modal.setAttribute("aria-hidden", "false");
    }

    function closeModal() {
      modal.classList.remove("active");
      modal.setAttribute("aria-hidden", "true");
      if (fab) fab.focus();
    }

    if (fab) fab.addEventListener("click", openModal);
    if (closeBtn) closeBtn.addEventListener("click", closeModal);
    if (cancelBtn) cancelBtn.addEventListener("click", closeModal);

    modal.addEventListener("click", e => {
      if (e.target === modal) closeModal();
    });

    document.addEventListener("keydown", e => {
      if (e.key === "Escape" && modal.classList.contains("active")) {
        closeModal();
      }
    });

    if (form) {
      form.addEventListener("submit", e => {
        e.preventDefault();
        const selectedId = rxSelect ? rxSelect.value : '';
        if (!selectedId) {
          toast("Please select a prescription first.");
          return;
        }
        closeModal();
        dispense(selectedId);
      });
    }
  }

  /* ------------------------------------------------------------------------
     Initialize Everything on DOM Ready & Setup Cross-Tab Synchronization
     ------------------------------------------------------------------------ */
  function init() {
    loadPUI();          // Restore persisted data before any render
    renderTopbar();
    renderSidebar();
    renderStatCards();
    initDispensingChart();
    renderStockByCategory();
    renderTopPrescribingDoctors();
    setupResponsiveBehavior();
    setupQuickDispenseModal();
    showPage("prescriptions");
  }

  // Cross-tab synchronization listeners
  window.addEventListener('storage', function(e) {
    if (!e.key || e.key.includes('prescription') || e.key.includes('medicine') || e.key.includes('carepointClinicAdminDataV2')) {
      syncPharmacyWithAdminStock();
      if (state.currentPage === "prescriptions") renderPrescriptions();
      if (state.currentPage === "inventory") renderInventory();
      if (state.currentPage === "dashboard") renderDashboard();
    }
  });

  window.addEventListener('focus', function() {
    syncPharmacyWithAdminStock();
    if (state.currentPage === "prescriptions") renderPrescriptions();
    if (state.currentPage === "inventory") renderInventory();
    if (state.currentPage === "dashboard") renderDashboard();
  });

  window.addEventListener('cms_rx_updated', function() {
    if (state.currentPage === "prescriptions") renderPrescriptions();
    if (state.currentPage === "dashboard") renderDashboard();
  });

  window.addEventListener('cms_stock_updated', function() {
    syncPharmacyWithAdminStock();
    if (state.currentPage === "inventory") renderInventory();
    if (state.currentPage === "prescriptions") renderPrescriptions();
    if (state.currentPage === "dashboard") renderDashboard();
  });

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();