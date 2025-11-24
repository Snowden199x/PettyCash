document.addEventListener("DOMContentLoaded", () => {
  const reportsGrid = document.getElementById("reportsGrid");
  const emptyState = document.getElementById("emptyState");
  const searchInput = document.getElementById("searchReports");
  const statusFilter = document.getElementById("statusFilter");

  const reportModal = document.getElementById("reportModal");
  const closeModalBtn = document.getElementById("closeModal");
  const cancelModalBtn = document.getElementById("cancelModal");
  const saveReportBtn = document.getElementById("saveReport");

  const modalOrgName = document.getElementById("modalOrgName");
  const modalSubmissionDate = document.getElementById("modalSubmissionDate");
  const reportStatusSelect = document.getElementById("reportStatus");
  const documentChecklist = document.getElementById("documentChecklist");
  const adminNotesTextarea = document.getElementById("adminNotes");

  const toast = document.getElementById("toast");
  const paginationEl = document.getElementById("pagination");

  let reports = [];
  let currentReportId = null;
  let currentPage = 1;
  const pageSize = 6;

  async function loadReports() {
    try {
      const orgRes = await fetch("/osas/api/organizations");
      const orgData = await orgRes.json();

      if (!orgData.organizations || orgData.organizations.length === 0) {
        showEmptyState();
        return;
      }

      // No backend /api/reports yet; generate fake from organizations
      reports = orgData.organizations.map((org) => ({
        id: org.id,
        orgName: org.name,
        submissionDate:
          org.date || new Date().toISOString().split("T")[0],
        status: "pending",
        checklist: {
          august: false,
          september: false,
          october: false,
          november: false,
          december: false,
          january: false,
          february: false,
          march: false,
          april: false,
          may: false,
        },
        notes: "",
      }));

      renderReports();
    } catch (err) {
      console.error("Error loading reports:", err);
      showToast("Failed to load reports", "error");
      showEmptyState();
    }
  }

  function showEmptyState() {
    reportsGrid.style.display = "none";
    emptyState.style.display = "flex";
    paginationEl.innerHTML = "";
  }

  function getFilteredReports() {
    const searchTerm = searchInput.value.toLowerCase().trim();
    const selectedStatus = statusFilter.value;

    let filtered = reports;

    if (searchTerm) {
      filtered = filtered.filter((report) =>
        report.orgName.toLowerCase().includes(searchTerm)
      );
    }

    if (selectedStatus !== "all") {
      filtered = filtered.filter((report) => report.status === selectedStatus);
    }

    return filtered;
  }

  function renderReports() {
    const filtered = getFilteredReports();
    if (filtered.length === 0) {
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
    let html = "";
    for (let i = 1; i <= totalPages; i++) {
      html += `<button class="page-btn ${
        i === currentPage ? "active" : ""
      }" data-page="${i}">${i}</button>`;
    }
    paginationEl.innerHTML = html;

    paginationEl.querySelectorAll(".page-btn").forEach((btn) => {
      btn.addEventListener("click", () => {
        const page = parseInt(btn.dataset.page, 10);
        if (!isNaN(page)) {
          currentPage = page;
          renderReports();
        }
      });
    });
  }

  function createReportCard(report) {
    const card = document.createElement("div");
    card.className = "report-card";
    card.dataset.reportId = report.id;

    const checklistValues = Object.values(report.checklist);
    const completedCount = checklistValues.filter((v) => v === true).length;
    const totalCount = checklistValues.length;
    const progressPercent = Math.round((completedCount / totalCount) * 100);

    const statusClass = `status-${report.status}`;
    const statusText =
      report.status === "pending"
        ? "Pending Review"
        : report.status === "in-review"
        ? "In Review"
        : "Completed";

    const notesPreview = report.notes
      ? `"${report.notes}"`
      : "No notes added yet";
    const notesClass = report.notes ? "" : "no-notes";

    card.innerHTML = `
      <div class="report-card-header">
        <h3>${report.orgName}</h3>
        <span class="status-badge ${statusClass}">${statusText}</span>
      </div>
      <p class="report-card-date">Accredited: ${formatDate(
        report.submissionDate
      )}</p>

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

  function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  }

  searchInput.addEventListener("input", () => {
    currentPage = 1;
    renderReports();
  });
  statusFilter.addEventListener("change", () => {
    currentPage = 1;
    renderReports();
  });

  function openReportModal(reportId) {
    const report = reports.find((r) => r.id === reportId);
    if (!report) return;

    currentReportId = reportId;

    modalOrgName.textContent = report.orgName;
    modalSubmissionDate.textContent = `Accredited on: ${formatDate(
      report.submissionDate
    )}`;
    reportStatusSelect.value = report.status;
    adminNotesTextarea.value = report.notes;

    const checkboxes = documentChecklist.querySelectorAll(
      'input[type="checkbox"]'
    );
    checkboxes.forEach((checkbox) => {
      const docType = checkbox.dataset.doc;
      checkbox.checked = report.checklist[docType] || false;
    });

    reportModal.style.display = "flex";
  }

  closeModalBtn.addEventListener("click", closeReportModal);
  cancelModalBtn.addEventListener("click", closeReportModal);

  function closeReportModal() {
    reportModal.style.display = "none";
    currentReportId = null;
  }

  window.addEventListener("click", (e) => {
    if (e.target === reportModal) {
      closeReportModal();
    }
  });

  saveReportBtn.addEventListener("click", () => {
    if (!currentReportId) return;

    const status = reportStatusSelect.value;
    const notes = adminNotesTextarea.value.trim();

    const checklist = {};
    const checkboxes = documentChecklist.querySelectorAll(
      'input[type="checkbox"]'
    );
    checkboxes.forEach((checkbox) => {
      const docType = checkbox.dataset.doc;
      checklist[docType] = checkbox.checked;
    });

    const reportIndex = reports.findIndex((r) => r.id === currentReportId);
    if (reportIndex !== -1) {
      reports[reportIndex] = {
        ...reports[reportIndex],
        status,
        notes,
        checklist,
      };
    }

    showToast("Report updated (local only)");
    closeReportModal();
    renderReports();
  });

  function showToast(message, type = "success") {
    toast.textContent = message;
    toast.className = "toast";
    if (type === "error") toast.classList.add("error");
    toast.style.display = "block";
    setTimeout(() => {
      toast.style.display = "none";
    }, 3000);
  }

  loadReports();
});
