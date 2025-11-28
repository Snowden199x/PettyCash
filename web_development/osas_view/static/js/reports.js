document.addEventListener("DOMContentLoaded", () => {
  // DOM ELEMENTS
  const reportsGrid = document.getElementById("reportsGrid");
  const emptyState = document.getElementById("emptyState");
  const searchInput = document.getElementById("searchReports");
  const statusFilter = document.getElementById("statusFilter");
  const departmentFilter = document.getElementById("departmentFilter");
  const reportModal = document.getElementById("reportModal");
  const closeModalBtn = document.getElementById("closeModal");
  const cancelModalBtn = document.getElementById("cancelModal");
  const saveReportBtn = document.getElementById("saveReport");
  const modalOrgName = document.getElementById("modalOrgName");
  const modalSubmissionDate = document.getElementById("modalSubmissionDate");
  const reportStatusSelect = document.getElementById("reportStatus");
  const monthsList = document.getElementById("monthsList");
  const adminNotesTextarea = document.getElementById("adminNotes");
  const toast = document.getElementById("toast");
  const paginationEl = document.getElementById("pagination");
  const API_BASE = "/osas/api";

  let reports = [];
  let organizations = [];
  let currentReportId = null;
  let currentPage = 1;
  const pageSize = 6;
  let departments = [];

  // ===== LOGO CLICK =====
  const logoLink = document.getElementById("logoLink");
  if (logoLink) {
    logoLink.addEventListener("click", () => {
      window.location.href = "/osas/dashboard";
    });
  }

  // MONTH CONFIG
  const MONTH_KEYS = [
    "august",
    "september",
    "october",
    "november",
    "december",
    "january",
    "february",
    "march",
    "april",
    "may"
  ];

  const MONTH_LABELS = {
    august: "August",
    september: "September",
    october: "October",
    november: "November",
    december: "December",
    january: "January",
    february: "February",
    march: "March",
    april: "April",
    may: "May"
  };

  // LOADING UI
  function showLoading() {
    reportsGrid.style.display = "block";
    emptyState.style.display = "none";
    paginationEl.innerHTML = "";
    reportsGrid.innerHTML =
      `<div style="grid-column: 1 / -1; text-align: center; padding: 48px 0;">
        <span class="loading-spinner"></span>
        <span style="margin-left: 10px; font-size: 16px; color: #a17c50;">
          Loading reports...
        </span>
      </div>`;
  }

  // --- Department Filter ---
  async function loadDepartmentFilter() {
    try {
      const res = await fetch(`${API_BASE}/departments`);
      if (!res.ok) throw new Error("Failed to fetch departments");
      const data = await res.json();

      departments = data.departments || [];
      departmentFilter.innerHTML = `<option value="">All Departments</option>`;

      departments.forEach(dep => {
        departmentFilter.innerHTML += `<option value="${dep.name}">${dep.name}</option>`;
      });
    } catch (err) {
      showToast("Failed to load departments", "error");
      departmentFilter.innerHTML = `<option value="">All Departments</option>`;
    }
  }

  departmentFilter.addEventListener("change", () => {
    currentPage = 1;
    renderReports();
  });

  // --- Organization & Reports Load ---
  async function getFinancialReportsByOrg(orgId) {
    if (!orgId || isNaN(orgId)) return [];
    try {
      const res = await fetch(`${API_BASE}/organizations/${orgId}/financial_reports`);
      if (!res.ok) throw new Error("Failed to get financial reports");

      const data = await res.json();
      return Array.isArray(data.reports) ? data.reports : [];
    } catch (err) {
      return [];
    }
  }

  async function updateFinancialReport(reportId, updateObj) {
    if (!reportId || isNaN(reportId)) return null;

    try {
      const res = await fetch(`${API_BASE}/financial_reports/${reportId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updateObj),
      });

      if (!res.ok) {
        const errData = await res.json();
        showToast(
          "Failed to update report: " +
            (errData.error || "Unknown error"),
          "error"
        );
        return null;
      }

      const data = await res.json();
      return data.updated;
    } catch (err) {
      showToast("Failed to update report.", "error");
      return null;
    }
  }

  // STATUS FROM CHECKLIST
  function computeStatusFromChecklist(report) {
    const checklistValues = Object.values(report.checklist || {});
    const receivedCount = checklistValues.filter(v => v === true).length;
    const totalCount = MONTH_KEYS.length;

    if (receivedCount === 0) return "Pending Review";
    if (receivedCount < totalCount) return "In Review";
    return "Completed";
  }

  async function loadOrganizationsAndReports() {
    showLoading();
    try {
      const res = await fetch(`${API_BASE}/organizations`);
      if (!res.ok) throw new Error("Failed to fetch organizations");

      const data = await res.json();
      organizations = Array.isArray(data.organizations)
        ? data.organizations
        : [];

      if (organizations.length === 0) {
        reports = [];
        renderReports();
        return;
      }

      let allReports = [];

      for (let org of organizations) {
        const orgReports = await getFinancialReportsByOrg(org.id);

        orgReports.forEach(report => {
          report.orgName = org.name;
          report.department = org.department;
        });

        allReports = allReports.concat(orgReports);
      }

      reports = allReports;
      renderReports();
    } catch (err) {
      showToast("Failed to load organizations/reports.", "error");
      reports = [];
      renderReports();
    }
  }

  // --- Filtering ---
  function getFilteredReports() {
    const searchTerm = searchInput.value.toLowerCase().trim();
    const selectedStatus = statusFilter.value;
    const selectedDept = departmentFilter.value;

    let filtered = reports;

    if (selectedDept) {
      filtered = filtered.filter(report => report.department === selectedDept);
    }

    if (searchTerm) {
      filtered = filtered.filter(report =>
        report.orgName.toLowerCase().includes(searchTerm)
      );
    }

    if (selectedStatus && selectedStatus !== "all") {
      filtered = filtered.filter(report => report.status === selectedStatus);
    }

    return filtered;
  }

  // --- Report Rendering ---
  function showEmptyState() {
    reportsGrid.style.display = "none";
    emptyState.style.display = "flex";
    paginationEl.innerHTML = "";
  }

  function renderReports() {
    const filtered = getFilteredReports();

    if (!filtered || filtered.length === 0) {
      showEmptyState();
      return;
    }

    const totalPages = Math.ceil(filtered.length / pageSize);
    if (currentPage > totalPages) currentPage = 1;

    const start = (currentPage - 1) * pageSize;
    const end = start + pageSize;
    const pageItems = filtered.slice(start, end);

    reportsGrid.innerHTML = "";
    reportsGrid.style.display = "grid";
    emptyState.style.display = "none";

    pageItems.forEach(report => {
      const card = createReportCard(report);
      reportsGrid.appendChild(card);
    });

    renderPagination(totalPages);
  }

  function renderPagination(totalPages) {
    if (!paginationEl) return;

    if (totalPages <= 1) {
      paginationEl.innerHTML = "";
      return;
    }

    let html = "";

    for (let i = 1; i <= totalPages; i++) {
      html += `
        <button class="page-btn ${i === currentPage ? "active" : ""}" data-page="${i}">
          ${i}
        </button>`;
    }

    paginationEl.innerHTML = html;

    paginationEl.querySelectorAll(".page-btn").forEach(btn => {
      btn.addEventListener("click", () => {
        const page = parseInt(btn.dataset.page, 10);
        if (!isNaN(page)) {
          currentPage = page;
          renderReports();
        }
      });
    });
  }

  // --- Formatting / Status ---
  function formatDate(dateString) {
    if (!dateString) return "";
    const date = new Date(dateString);

    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  }

  function statusBadgeClass(status) {
    switch (status) {
      case "Pending Review":
        return "status-pending";
      case "In Review":
        return "status-inreview";
      case "Completed":
        return "status-completed";
      default:
        return "";
    }
  }

  function statusBadgeText(status) {
    switch (status) {
      case "Pending Review":
        return "Pending Review";
      case "In Review":
        return "In Review";
      case "Completed":
        return "Completed";
      default:
        return status;
    }
  }

  function createReportCard(report) {
    const card = document.createElement("div");
    card.className = "report-card";
    card.dataset.reportId = report.id;

    const checklistValues = Object.values(report.checklist || {});
    const completedCount = checklistValues.filter(v => v === true).length;
    const totalCount = MONTH_KEYS.length;

    const progressPercent = totalCount
      ? Math.round((completedCount / totalCount) * 100)
      : 0;

    const statusClass = statusBadgeClass(report.status);
    const statusText = statusBadgeText(report.status);

    const notesPreview = report.notes
      ? `"${report.notes}"`
      : "No notes added yet";

    const notesClass = report.notes ? "" : "no-notes";

    card.innerHTML = `
      <div class="report-card-header">
        <h3>${report.orgName}</h3>
        <span class="status-badge ${statusClass}">${statusText}</span>
      </div>

      <p class="report-card-date">
        Accredited: ${formatDate(report.submissionDate)}
      </p>

      <div class="progress-section">
        <div class="progress-label">
          <span>Documents</span>
          <span>${completedCount}/${totalCount}</span>
        </div>

        <div class="progress-bar">
          <div class="progress-fill" style="width: ${progressPercent}%"></div>
        </div>
      </div>

      <p class="notes-preview ${notesClass}">${notesPreview}</p>
    `;

    card.addEventListener("click", () => openReportModal(report.id));
    return card;
  }

  // --- Modal Logic ---
  function openReportModal(reportId) {
    const report = reports.find(r => r.id === reportId);
    if (!report) return;

    currentReportId = reportId;

    modalOrgName.textContent = report.orgName;
    modalSubmissionDate.textContent =
      `Accredited on: ${formatDate(report.submissionDate)}`;

    reportStatusSelect.value = report.status;
    adminNotesTextarea.value = report.notes || "";

    renderMonths(report);

    reportModal.style.display = "flex";
  }

  function renderMonths(report) {
    if (!monthsList) return;

    const checklist = report.checklist || {};
    const monthNotes = report.monthNotes || {};

    monthsList.innerHTML = MONTH_KEYS.map(key => {
      const received = checklist[key] === true;
      const hasNoteOnly = received && monthNotes[key];

      const btnLabel = !received
        ? "Receive"
        : hasNoteOnly
        ? "View note"
        : "View report";

      return `
        <div class="month-row" data-month="${key}">
          <span class="month-label">${MONTH_LABELS[key]}</span>
          <button
            type="button"
            class="month-btn ${received ? "secondary" : "primary"}"
            data-month="${key}"
            data-received="${received ? "1" : "0"}"
          >
            ${btnLabel}
          </button>
        </div>
      `;
    }).join("");

    monthsList.querySelectorAll(".month-btn").forEach(btn => {
      btn.addEventListener("click", () => handleMonthAction(report, btn));
    });
  }

  async function handleMonthAction(report, button) {
    const monthKey = button.dataset.month;
    const alreadyReceived = button.dataset.received === "1";

    if (!alreadyReceived) {
      const confirmed = window.confirm(
        `Receive ${MONTH_LABELS[monthKey]} report from ${report.orgName}?`
      );
      if (!confirmed) return;

      const updated = await updateFinancialReport(report.id, {
        receiveMonth: monthKey,
      });

      if (updated) {
        updated.checklist = updated.checklist || {};
        updated.status = computeStatusFromChecklist(updated);

        const idx = reports.findIndex(r => r.id === report.id);
        if (idx !== -1) {
          reports[idx] = { ...reports[idx], ...updated };
        }

        showToast("Report received!");
        openReportModal(report.id);
        renderReports();
      }
    } else {
      alert(
        `${button.textContent} for ${MONTH_LABELS[monthKey]} (implement actual viewer).`
      );
    }
  }

  function closeReportModal() {
    reportModal.style.display = "none";
    currentReportId = null;
  }

  closeModalBtn.addEventListener("click", closeReportModal);
  cancelModalBtn.addEventListener("click", closeReportModal);

  window.addEventListener("click", e => {
    if (e.target === reportModal) closeReportModal();
  });

  // --- Save Button ---
  saveReportBtn.addEventListener("click", async () => {
    if (!currentReportId) return;

    const notes = adminNotesTextarea.value.trim();

    const updated = await updateFinancialReport(currentReportId, { notes });

    if (updated) {
      updated.checklist = updated.checklist || {};
      updated.status = computeStatusFromChecklist(updated);

      const idx = reports.findIndex(r => r.id === currentReportId);
      if (idx !== -1) {
        reports[idx] = { ...reports[idx], ...updated };
      }

      showToast("Report updated!");
      closeReportModal();
      renderReports();
    }
  });

  // --- Toast ---
  function showToast(message, type = "success") {
    toast.textContent = message;
    toast.className = "toast";

    if (type === "error") toast.classList.add("error");

    toast.style.display = "block";
    setTimeout(() => (toast.style.display = "none"), 3000);
  }

  // --- Initial Load ---
  loadDepartmentFilter();
  loadOrganizationsAndReports();

  searchInput.addEventListener("input", () => {
    currentPage = 1;
    renderReports();
  });

  statusFilter.addEventListener("change", () => {
    currentPage = 1;
    renderReports();
  });
});
