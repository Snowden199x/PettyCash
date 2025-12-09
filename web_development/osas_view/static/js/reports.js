const REPORT_TIMESTAMPS_KEY = 'reportLastModified';

function saveReportTimestamp(reportId) {
  const timestamps = JSON.parse(localStorage.getItem(REPORT_TIMESTAMPS_KEY) || '{}');
  timestamps[reportId] = new Date().getTime();
  localStorage.setItem(REPORT_TIMESTAMPS_KEY, JSON.stringify(timestamps));
}

function getReportTimestamps() {
  return JSON.parse(localStorage.getItem(REPORT_TIMESTAMPS_KEY) || '{}');
}

function sortByRecent(reportsArray) {
  const timestamps = getReportTimestamps();
  const sorted = [...reportsArray].sort((a, b) => {
    const timeA = timestamps[a.id] || 0;
    const timeB = timestamps[b.id] || 0;
    return timeB - timeA;
  });
  return sorted;
}

// ===== END LOCAL STORAGE HELPER =====

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
  const completeReportBtn = document.getElementById("completeReport");
  const modalOrgName = document.getElementById("modalOrgName");
  const modalSubmissionDate = document.getElementById("modalSubmissionDate");
  const monthsList = document.getElementById("monthsList");
  const adminNotesTextarea = document.getElementById("adminNotes");
  const toast = document.getElementById("toast");
  const paginationEl = document.getElementById("pagination");
  const API_BASE = "/osas/api";
  const params = new URLSearchParams(window.location.search);
  const orgIdParam = params.get("org_id");
  const reportIdParam = params.get("report_id");

  // notification elements (galing sa homepage layout)
  const notifBtn = document.getElementById("notifBtn");
  const notifMenu = document.getElementById("notifMenu");
  const notifList = document.getElementById("notifList");
  const notifDot = document.getElementById("notifDot");

  //pang complete elements
  const confirmationModal = document.getElementById("confirmationModal");
  const confirmTitle = document.getElementById("confirmTitle");
  const confirmMessage = document.getElementById("confirmMessage");
  const confirmAccept = document.getElementById("confirmAccept");
  const confirmCancel = document.getElementById("confirmCancel");
  const closeConfirm = document.getElementById("closeConfirm");

  let reports = [];
  let organizations = [];
  let currentReportId = null;
  let currentPage = 1;
  const pageSize = 6;
  let departments = [];
  let notifications = [];
  

  if (orgIdParam || reportIdParam) {
    openFromNotification(Number(orgIdParam), Number(reportIdParam));
  }
  // ===== HELPERS =====
  function statusBadgeClass(status) {
    switch (status) {
      case "Pending report":
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
      case "Pending report":
      case "Pending Review":
        return "Pending Report";
      case "In Review":
        return "In Review";
      case "Completed":
        return "Completed";
      default:
        return status || "";
    }
  }

  // ===== LOGO CLICK =====
  const logoLink = document.getElementById("logoLink");
  if (logoLink) {
    logoLink.addEventListener("click", () => {
      window.location.href = "/osas/dashboard";
    });
  }

  // ===== UTILS =====
  function deriveDeptAbbrev(dept) {
    if (!dept) return "";
    const parenMatch = dept.match(/\(([^)]+)\)/);
    if (parenMatch) return parenMatch[1].toLowerCase();
    const words = dept.split(/\s+/).filter(Boolean);
    const initials = words.map((w) => w[0]).join("");
    return initials.toLowerCase();
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
    "may",
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
    may: "May",
  };

  // LOADING UI
  function showLoading() {
    reportsGrid.style.display = "block";
    emptyState.style.display = "none";
    paginationEl.innerHTML = "";
    reportsGrid.innerHTML = `
      <div style="grid-column: 1 / -1; text-align: center; padding: 48px 0;">
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

      departments.forEach((dep) => {
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
      const res = await fetch(
        `${API_BASE}/organizations/${orgId}/financial_reports`
      );
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
        let msg = "Unknown error";
        try {
          const errData = await res.json();
          msg = errData.error || msg;
        } catch {
          /* ignore */
        }
        showToast("Failed to update report: " + msg, "error");
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
    const receivedCount = checklistValues.filter((v) => v === true).length;
    const totalCount = MONTH_KEYS.length;

    if (receivedCount === 0) return "Pending Review";
    if (receivedCount < totalCount) return "In Review";
    return "Completed";
  }

  // ===== OPTIMIZED: Load everything in ONE API for org+reports =====
  async function loadInitialData() {
    showLoading();
    try {
      const [deptRes, comboRes] = await Promise.all([
        fetch(`${API_BASE}/departments`)
          .then((r) => (r.ok ? r.json() : { departments: [] }))
          .catch(() => ({ departments: [] })),
        fetch(`${API_BASE}/organizations_with_reports`)
          .then((r) => (r.ok ? r.json() : { organizations: [], reports: [] }))
          .catch(() => ({ organizations: [], reports: [] })),
      ]);

      departments = deptRes.departments || [];
      organizations = comboRes.organizations || [];

      departmentFilter.innerHTML = `<option value="">All Departments</option>`;
      departments.forEach((dep) => {
        departmentFilter.innerHTML += `<option value="${dep.name}">${dep.name}</option>`;
      });

      const rawReports = comboRes.reports || [];
      let allReports = rawReports.map((rep) => {
        const org =
          organizations.find(
            (o) => Number(o.id) === Number(rep.organization_id)
          ) || {};
        return {
          ...rep,
          orgName: org.name,
          department: org.department,
          department_abbrev: deriveDeptAbbrev(org.department),
        };
      });

      reports = sortByRecent(allReports);
      renderReports();
    } catch (err) {
      console.error("Load error:", err);
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
      filtered = filtered.filter(
        (report) => report.department === selectedDept
      );
    }

    if (searchTerm) {
      filtered = filtered.filter((report) => {
        const orgName = (report.orgName || "").toLowerCase();
        const deptName = (report.department || "").toLowerCase();
        const deptAbbrev = (report.department_abbrev || "").toLowerCase();
        return (
          orgName.includes(searchTerm) ||
          deptName.includes(searchTerm) ||
          deptAbbrev.includes(searchTerm)
        );
      });
    }

    if (selectedStatus && selectedStatus !== "all") {
      filtered = filtered.filter((report) => report.status === selectedStatus);
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

    pageItems.forEach((report) => {
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

    const maxVisible = 10; // max buttons na nakikita
    let startPage = Math.max(1, currentPage - Math.floor(maxVisible / 2));
    let endPage = startPage + maxVisible - 1;

    if (endPage > totalPages) {
      endPage = totalPages;
      startPage = Math.max(1, endPage - maxVisible + 1);
    }

    let html = "";

    // left arrow
    html += `
    <button class="page-btn arrow" data-page="${Math.max(
      1,
      currentPage - 1
    )}" ${currentPage === 1 ? "disabled" : ""}>
      ‹
    </button>
  `;

    // number buttons
    for (let i = startPage; i <= endPage; i++) {
      html += `
      <button class="page-btn ${
        i === currentPage ? "active" : ""
      }" data-page="${i}">
        ${i}
      </button>
    `;
    }

    // right arrow
    html += `
    <button class="page-btn arrow" data-page="${Math.min(
      totalPages,
      currentPage + 1
    )}" ${currentPage === totalPages ? "disabled" : ""}>
      ›
    </button>
  `;

    paginationEl.innerHTML = html;

    paginationEl.querySelectorAll(".page-btn").forEach((btn) => {
      const page = parseInt(btn.dataset.page, 10);
      if (isNaN(page)) return;
      btn.addEventListener("click", () => {
        if (page === currentPage) return;
        currentPage = page;
        renderReports();
      });
    });
  }

  // --- Formatting ---
  function formatDate(dateString) {
    if (!dateString) return "";
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  }

  // --- Cards ---
  function createReportCard(report) {
    const card = document.createElement("div");
    card.className = "report-card";
    card.dataset.reportId = report.id;

    const checklistValues = Object.values(report.checklist || {});
    const completedCount = checklistValues.filter((v) => v === true).length;
    const totalCount = MONTH_KEYS.length;
    const progressPercent = totalCount
      ? Math.round((completedCount / totalCount) * 100)
      : 0;

    const notesPreview = report.notes
      ? `"${report.notes}"`
      : "No notes added yet";
    const notesClass = report.notes ? "" : "no-notes";

    const deptText = report.department || "No department";
    const accText = formatDate(report.submission_date) || "N/A";
    const statusClass = statusBadgeClass(report.status);
    const statusText = statusBadgeText(report.status);

    card.innerHTML = `
  <div class="report-card-top">
    <div class="report-title-row">
      <h3 class="report-org">${report.orgName}</h3>
      <span class="status-badge ${statusClass}">${statusText}</span>
    </div>
    <p class="report-meta">${deptText}</p>
    <p class="report-meta-muted">Accredited on: ${accText}</p>
  </div>

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
    const numericId = Number(reportId);
    const report = reports.find((r) => Number(r.id) === numericId);
    if (!report) return;

    currentReportId = report.id;

    modalOrgName.textContent = report.orgName;
    const accText = formatDate(report.submission_date) || "N/A";
    modalSubmissionDate.textContent = `Accredited on: ${accText}`;

    adminNotesTextarea.value = report.notes || "";

    renderMonths(report);
    reportModal.style.display = "flex";
  }

  function renderMonths(report) {
    if (!monthsList) return;

    const checklist = report.checklist || {};
    const monthNotes = report.monthNotes || {};

    monthsList.innerHTML = MONTH_KEYS.map((key) => {
      const received = checklist[key] === true;
      const hasNoteOnly = received && monthNotes[key];

      const rowClass = received ? "month-row received" : "month-row";

      // If report not submitted, show "N/A" as text, not a button
      const actionContent = received
        ? `<button
            type="button"
            class="month-btn ${hasNoteOnly ? "secondary" : "primary"}"
            data-month="${key}"
            data-received="1"
          >
            ${hasNoteOnly ? "View note" : "View report"}
          </button>`
        : '<span class="month-action-na">N/A</span>';

      return `
        <div class="${rowClass}" data-month="${key}">
          <span class="month-label">${MONTH_LABELS[key]}</span>
          ${actionContent}
        </div>
      `;
    }).join("");

    // Only attach click handlers to actual buttons (not N/A spans)
    monthsList.querySelectorAll(".month-btn").forEach((btn) => {
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

        const idx = reports.findIndex((r) => r.id === report.id);
        if (idx !== -1) {
          reports[idx] = { ...reports[idx], ...updated };
        }

        showToast("Report received!");
        saveReportTimestamp(report.id);
        reports = sortByRecent(reports);  // ← ADD
        currentPage = 1;  // ← ADD
        openReportModal(report.id);
        renderReports();
      }
    } else {
      // direct download ng report para sa org + month na ito - OPEN IN NEW TAB
      const orgId = report.organization_id || report.org_id || report.id;
      window.open(`/osas/reports/${orgId}/months/${monthKey}/print`, "_blank");
    }
  }

  function closeReportModal() {
    reportModal.style.display = "none";
    currentReportId = null;
  }

  closeModalBtn.addEventListener("click", closeReportModal);
  cancelModalBtn.addEventListener("click", closeReportModal);

  window.addEventListener("click", (e) => {
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

      const idx = reports.findIndex((r) => r.id === currentReportId);
      if (idx !== -1) {
        reports[idx] = { ...reports[idx], ...updated };
      }

      showToast("Report updated!");
      saveReportTimestamp(currentReportId);
      reports = sortByRecent(reports);  // ← ADD
      closeReportModal();
      currentPage = 1;  // ← ADD
      renderReports();
    }
  });

  // --- Mark as Complete ---
  completeReportBtn.addEventListener("click", async () => {
    if (!currentReportId) return;

    confirmTitle.textContent = "Mark as Complete?";
    confirmMessage.textContent = "Mark this financial report as complete? All months will be considered received.";
    confirmationModal.style.display = "flex";

    let confirmHandled = false;

    const handleConfirm = async () => {
      if (confirmHandled) return;
      confirmHandled = true;
      
      confirmationModal.style.display = "none";
      confirmAccept.removeEventListener("click", handleConfirm);
      confirmCancel.removeEventListener("click", handleCancel);
      closeConfirm.removeEventListener("click", handleCancel);

      const updated = await updateFinancialReport(currentReportId, {
        completeAll: true,
      });

      if (updated) {
        updated.checklist = updated.checklist || {};
        updated.status = "Completed";

        const idx = reports.findIndex((r) => r.id === currentReportId);
        if (idx !== -1) {
          const newChecklist = { ...(reports[idx].checklist || {}) };
          MONTH_KEYS.forEach((k) => (newChecklist[k] = true));
          reports[idx] = {
            ...reports[idx],
            ...updated,
            checklist: newChecklist,
            status: "Completed",
          };
        }

        showToast("Report marked as complete!");
        saveReportTimestamp(currentReportId);
        reports = sortByRecent(reports);
        closeReportModal();
        currentPage = 1;
        renderReports();
      }
    };

    const handleCancel = () => {
      if (confirmHandled) return;
      confirmHandled = true;
      
      confirmationModal.style.display = "none";
      confirmAccept.removeEventListener("click", handleConfirm);
      confirmCancel.removeEventListener("click", handleCancel);
      closeConfirm.removeEventListener("click", handleCancel);
    };

    confirmAccept.addEventListener("click", handleConfirm);
    confirmCancel.addEventListener("click", handleCancel);
    closeConfirm.addEventListener("click", handleCancel);
  });


  // --- Notifications ---
  if (notifBtn && notifMenu) {
    notifBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      notifMenu.style.display =
        notifMenu.style.display === "block" ? "none" : "block";
    });

    window.addEventListener("click", () => {
      notifMenu.style.display = "none";
    });
  }

  async function loadNotifications() {
    if (!notifList) return;

    try {
      const res = await fetch(`${API_BASE}/admin/notifications`);
      if (!res.ok) throw new Error("Failed to load notifications");
      const data = await res.json();
      notifications = data.notifications || [];
      const hasUnread = data.has_unread;

      // toggle red dot
      if (notifDot) notifDot.style.display = hasUnread ? "block" : "none";

      if (!notifications.length) {
        notifList.innerHTML = '<p class="notif-empty">Nothing here yet</p>';
        return;
      }

      if (notifDot) notifDot.style.display = "block";

      notifList.innerHTML = notifications
        .map(
          (n) => `
        <div class="notif-item" data-org-id="${n.org_id}" data-report-id="${
            n.report_id
          }">
          <p class="notif-text"><strong>${n.org_name}</strong> ${n.message}</p>
          <p class="notif-time">${formatDate(n.created_at)}</p>
        </div>`
        )
        .join("");

      notifList.querySelectorAll(".notif-item").forEach((item) => {
        item.addEventListener("click", () => {
          const orgId = Number(item.dataset.orgId);
          const reportId = Number(item.dataset.reportId);

          // hide red dot once user clicks any notification
          if (notifDot) notifDot.style.display = "none";

          openFromNotification(orgId, reportId);
          notifMenu.style.display = "none";
        });
      });
    } catch (err) {
      notifList.innerHTML =
        '<p class="notif-empty">Error loading notifications</p>';
      if (notifDot) notifDot.style.display = "none";
    }
  }

  function openFromNotification(orgId, reportId) {
    // hanapin report sa list; kung wala, reload reports then hanapin
    const openNow = () => {
      const report =
        reports.find((r) => Number(r.id) === Number(reportId)) ||
        reports.find((r) => Number(r.organization_id) === Number(orgId));
      if (!report) return;
      // ensure nasa current page yung card
      const idx = reports.findIndex((r) => r.id === report.id);
      if (idx !== -1) {
        currentPage = Math.floor(idx / pageSize) + 1;
        renderReports();
        // small timeout para sure na-render bago buksan modal
        setTimeout(() => openReportModal(report.id), 0);
      } else {
        openReportModal(report.id);
      }
    };

    if (!reports.length) {
      loadInitialData().then(openNow);
    } else {
      openNow();
    }
  }

  // --- Toast ---
  function showToast(message, type = "success") {
    toast.textContent = message;
    toast.className = "toast";
    if (type === "error") toast.classList.add("error");
    toast.style.display = "block";
    setTimeout(() => (toast.style.display = "none"), 3000);
  }

  // --- Initial Load ---
  // --- Initial Load ---
  loadInitialData();
  loadNotifications();
  setInterval(loadNotifications, 60000); // refresh notifs every minute

  searchInput.addEventListener("input", () => {
    currentPage = 1;
    renderReports();
  });

  statusFilter.addEventListener("change", () => {
    currentPage = 1;
    renderReports();
  });
});
