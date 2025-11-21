document.addEventListener("DOMContentLoaded", () => {
  // --- ELEMENTS ---
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

  // ============================
  // LOAD REPORTS
  // ============================
  async function loadReports() {
    try {
      const orgRes = await fetch("/osas/api/organizations");
      const orgData = await orgRes.json();
      
      if (!orgData.organizations || orgData.organizations.length === 0) {
        showEmptyState();
        return;
      }

      try {
        const reportRes = await fetch("/osas/api/reports");
        const reportData = await reportRes.json();
        
        reports = orgData.organizations.map(org => {
          const existingReport = reportData.reports?.find(r => r.orgId === org.id);
          return {
            id: org.id,
            orgName: org.name,
            submissionDate: existingReport?.submissionDate || new Date().toISOString().split('T')[0],
            status: existingReport?.status || "pending",
            checklist: existingReport?.checklist || {
              "august": false,
              "september": false,
              "october": false,
              "november": false,
              "december": false,
              "january": false,
              "february": false,
              "march": false,
              "april": false,              
              "may": false
            },
            notes: existingReport?.notes || ""
          };
        });
      } catch (err) {
        reports = orgData.organizations.map(org => ({
          id: org.id,
          orgName: org.name,
          submissionDate: new Date().toISOString().split('T')[0],
          status: "pending",
          checklist: {
            "august": false,
            "september": false,
            "october": false,
            "november": false,
            "december": false,
            "january": false,
            "february": false,
            "march": false,
            "april": false,              
            "may": false
          },
          notes: ""
        }));
      }

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
  }

  // ============================
  // RENDER REPORTS
  // ============================
  function renderReports(filteredReports = null) {
    const reportsToRender = filteredReports || reports;
    
    if (reportsToRender.length === 0) {
      showEmptyState();
      return;
    }

    reportsGrid.innerHTML = "";
    reportsGrid.style.display = "grid";
    emptyState.style.display = "none";

    reportsToRender.forEach(report => {
      const card = createReportCard(report);
      reportsGrid.appendChild(card);
    });
  }

  function createReportCard(report) {
    const card = document.createElement("div");
    card.className = "report-card";
    card.dataset.reportId = report.id;

    const checklistValues = Object.values(report.checklist);
    const completedCount = checklistValues.filter(v => v === true).length;
    const totalCount = checklistValues.length;
    const progressPercent = Math.round((completedCount / totalCount) * 100);

    const statusClass = `status-${report.status}`;
    const statusText = report.status === "pending" 
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
      <p class="report-card-date">Accredited: ${formatDate(report.submissionDate)}</p>
      
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
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric' 
    });
  }

  // ============================
  // SEARCH & FILTER
  // ============================
  searchInput.addEventListener("input", () => filterReports());
  statusFilter.addEventListener("change", () => filterReports());

  function filterReports() {
    const searchTerm = searchInput.value.toLowerCase().trim();
    const selectedStatus = statusFilter.value;

    let filtered = reports;

    if (searchTerm) {
      filtered = filtered.filter(report =>
        report.orgName.toLowerCase().includes(searchTerm)
      );
    }

    if (selectedStatus !== "all") {
      filtered = filtered.filter(report => report.status === selectedStatus);
    }

    renderReports(filtered);
  }

  // ============================
  // REPORT MODAL
  // ============================
  function openReportModal(reportId) {
    const report = reports.find(r => r.id === reportId);
    if (!report) return;

    currentReportId = reportId;

    modalOrgName.textContent = report.orgName;
    modalSubmissionDate.textContent = `Accredited on: ${formatDate(report.submissionDate)}`;
    reportStatusSelect.value = report.status;
    adminNotesTextarea.value = report.notes;

    const checkboxes = documentChecklist.querySelectorAll('input[type="checkbox"]');
    checkboxes.forEach(checkbox => {
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

  // ============================
  // SAVE REPORT
  // ============================
  saveReportBtn.addEventListener("click", async () => {
    if (!currentReportId) return;

    const status = reportStatusSelect.value;
    const notes = adminNotesTextarea.value.trim();
    
    const checklist = {};
    const checkboxes = documentChecklist.querySelectorAll('input[type="checkbox"]');
    checkboxes.forEach(checkbox => {
      const docType = checkbox.dataset.doc;
      checklist[docType] = checkbox.checked;
    });

    const reportData = {
      status,
      notes,
      checklist
    };

    try {
      const res = await fetch(`/osas/api/reports/${currentReportId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(reportData)
      });

      if (!res.ok) throw new Error("Failed to save report");

      const reportIndex = reports.findIndex(r => r.id === currentReportId);
      if (reportIndex !== -1) {
        reports[reportIndex] = {
          ...reports[reportIndex],
          ...reportData
        };
      }

      showToast("Report updated successfully!");
      closeReportModal();
      renderReports();
    } catch (err) {
      console.error("Error saving report:", err);

      const reportIndex = reports.findIndex(r => r.id === currentReportId);
      if (reportIndex !== -1) {
        reports[reportIndex] = {
          ...reports[reportIndex],
          ...reportData
        };
      }
      
      showToast("Report updated", "warning");
      closeReportModal();
      renderReports();
    }
  });

  // ============================
  // TOAST NOTIFICATIONS
  // ============================
  function showToast(message, type = "success") {
    toast.textContent = message;
    toast.className = "toast";
    
    if (type === "error") toast.classList.add("error");

    toast.style.display = "block";
    
    setTimeout(() => {
      toast.style.display = "none";
    }, 3000);
  }

  // INITIAL LOAD
  loadReports();
});
