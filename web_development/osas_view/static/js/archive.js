document.addEventListener("DOMContentLoaded", () => {
  // --- ELEMENTS ---
  const archiveGrid = document.getElementById("archiveGrid");
  const emptyState = document.getElementById("emptyState");
  const searchInput = document.getElementById("searchArchive");
  const emptyArchiveBtn = document.getElementById("emptyArchiveBtn");
  
  // Restore Modal
  const restoreModal = document.getElementById("restoreModal");
  const closeRestoreModal = document.getElementById("closeRestoreModal");
  const cancelRestoreBtn = document.getElementById("cancelRestoreBtn");
  const confirmRestoreBtn = document.getElementById("confirmRestoreBtn");
  const restoreMessage = document.getElementById("restoreMessage");
  
  // Permanent Delete Modal
  const permanentDeleteModal = document.getElementById("permanentDeleteModal");
  const closePermanentDeleteModal = document.getElementById("closePermanentDeleteModal");
  const cancelPermanentDeleteBtn = document.getElementById("cancelPermanentDeleteBtn");
  const confirmPermanentDeleteBtn = document.getElementById("confirmPermanentDeleteBtn");
  const permanentDeleteMessage = document.getElementById("permanentDeleteMessage");
  
  // Empty Archive Modal
  const emptyArchiveModal = document.getElementById("emptyArchiveModal");
  const closeEmptyArchiveModal = document.getElementById("closeEmptyArchiveModal");
  const cancelEmptyArchiveBtn = document.getElementById("cancelEmptyArchiveBtn");
  const confirmEmptyArchiveBtn = document.getElementById("confirmEmptyArchiveBtn");
  const totalArchiveCount = document.getElementById("totalArchiveCount");
  
  const toast = document.getElementById("toast");
  const logoLink = document.getElementById("logoLink");

  let archivedOrgs = [];
  let currentOrgId = null;

  // ============================
  // LOGO CLICK
  // ============================
  if (logoLink) {
    logoLink.addEventListener("click", () => {
      window.location.href = "/osas/dashboard";
    });
  }

  // ============================
  // LOAD ARCHIVED ORGANIZATIONS
  // ============================
  async function loadArchivedOrgs() {
    try {
      const res = await fetch("/osas/api/archive");
      const data = await res.json();
      
      if (data.archived) {
        archivedOrgs = data.archived;
      } else {
        // Fallback: check if organizations endpoint has deleted flag
        const orgRes = await fetch("/osas/api/organizations");
        const orgData = await orgRes.json();
        archivedOrgs = (orgData.organizations || []).filter(org => org.deleted === true);
      }
      
      updateStats();
      renderArchive();
    } catch (err) {
      console.error("Error loading archived organizations:", err);
      archivedOrgs = [];
      updateStats();
      renderArchive();
    }
  }



  // ============================
  // RENDER ARCHIVE
  // ============================
  function renderArchive(filteredOrgs = null) {
    const orgsToRender = filteredOrgs || archivedOrgs;
    
    if (orgsToRender.length === 0) {
      archiveGrid.style.display = "none";
      emptyState.style.display = "flex";
      return;
    }

    archiveGrid.style.display = "grid";
    emptyState.style.display = "none";
    archiveGrid.innerHTML = "";

    orgsToRender.forEach(org => {
      const card = createArchiveCard(org);
      archiveGrid.appendChild(card);
    });
  }

  function createArchiveCard(org) {
    const card = document.createElement("div");
    card.className = "archive-card";
    card.dataset.orgId = org.id;

    const deletedDate = org.deletedDate || org.date || new Date().toISOString();
    const daysAgo = Math.floor((new Date() - new Date(deletedDate)) / (1000 * 60 * 60 * 24));
    const timeAgo = daysAgo === 0 ? "Today" : daysAgo === 1 ? "Yesterday" : `${daysAgo} days ago`;

    card.innerHTML = `
      <div class="archive-card-header">
        <h3>${org.name}</h3>
        <span class="archive-badge">Deleted</span>
      </div>
      
      <div class="archive-info">
        <div class="info-row">
          <span class="info-icon">👤</span>
          <span>Username: ${org.username || "N/A"}</span>
        </div>
        <div class="info-row">
          <span class="info-icon">📅</span>
          <span>Deleted: ${timeAgo}</span>
        </div>
        <div class="info-row">
          <span class="info-icon">🏛️</span>
          <span>Department: ${org.department || "General"}</span>
        </div>
      </div>

      <div class="archive-actions">
        <button class="restore-btn" data-id="${org.id}">
          <span>↻</span>
          <span>Restore</span>
        </button>
        <button class="delete-forever-btn" data-id="${org.id}">
          <span>🗑️</span>
          <span>Delete Forever</span>
        </button>
      </div>
    `;

    // Add event listeners
    const restoreBtn = card.querySelector(".restore-btn");
    const deleteBtn = card.querySelector(".delete-forever-btn");

    restoreBtn.addEventListener("click", () => openRestoreModal(org.id, org.name));
    deleteBtn.addEventListener("click", () => openPermanentDeleteModal(org.id, org.name));

    return card;
  }

  // ============================
  // SEARCH FUNCTIONALITY
  // ============================
  searchInput.addEventListener("input", (e) => {
    const searchTerm = e.target.value.toLowerCase().trim();
    
    if (searchTerm === "") {
      renderArchive();
    } else {
      const filtered = archivedOrgs.filter(org =>
        org.name.toLowerCase().includes(searchTerm) ||
        (org.username && org.username.toLowerCase().includes(searchTerm))
      );
      renderArchive(filtered);
    }
  });

  // ============================
  // RESTORE MODAL
  // ============================
  function openRestoreModal(orgId, orgName) {
    currentOrgId = orgId;
    restoreMessage.textContent = `Are you sure you want to restore "${orgName}"?`;
    restoreModal.style.display = "flex";
  }

  closeRestoreModal.addEventListener("click", () => {
    restoreModal.style.display = "none";
    currentOrgId = null;
  });

  cancelRestoreBtn.addEventListener("click", () => {
    restoreModal.style.display = "none";
    currentOrgId = null;
  });

  confirmRestoreBtn.addEventListener("click", async () => {
    if (!currentOrgId) return;

    try {
      const res = await fetch(`/osas/api/archive/${currentOrgId}/restore`, {
        method: "POST"
      });

      if (!res.ok) throw new Error("Failed to restore organization");

      // Remove from archived list
      archivedOrgs = archivedOrgs.filter(org => org.id !== currentOrgId);
      
      showToast("Organization restored successfully!");
      updateStats();
      renderArchive();
      restoreModal.style.display = "none";
      currentOrgId = null;
    } catch (err) {
      console.error("Error restoring organization:", err);
      showToast("Error restoring organization", "error");
    }
  });

  // ============================
  // PERMANENT DELETE MODAL
  // ============================
  function openPermanentDeleteModal(orgId, orgName) {
    currentOrgId = orgId;
    permanentDeleteMessage.textContent = `This will permanently delete "${orgName}" and all its data. This action cannot be undone.`;
    permanentDeleteModal.style.display = "flex";
  }

  closePermanentDeleteModal.addEventListener("click", () => {
    permanentDeleteModal.style.display = "none";
    currentOrgId = null;
  });

  cancelPermanentDeleteBtn.addEventListener("click", () => {
    permanentDeleteModal.style.display = "none";
    currentOrgId = null;
  });

  confirmPermanentDeleteBtn.addEventListener("click", async () => {
    if (!currentOrgId) return;

    try {
      const res = await fetch(`/osas/api/archive/${currentOrgId}`, {
        method: "DELETE"
      });

      if (!res.ok) throw new Error("Failed to delete organization permanently");

      // Remove from archived list
      archivedOrgs = archivedOrgs.filter(org => org.id !== currentOrgId);
      
      showToast("Organization deleted permanently", "warning");
      updateStats();
      renderArchive();
      permanentDeleteModal.style.display = "none";
      currentOrgId = null;
    } catch (err) {
      console.error("Error deleting organization:", err);
      showToast("Error deleting organization", "error");
    }
  });

  // ============================
  // EMPTY ARCHIVE MODAL
  // ============================
  emptyArchiveBtn.addEventListener("click", () => {
    if (archivedOrgs.length === 0) {
      showToast("Archive is already empty", "warning");
      return;
    }
    
    totalArchiveCount.textContent = archivedOrgs.length;
    emptyArchiveModal.style.display = "flex";
  });

  closeEmptyArchiveModal.addEventListener("click", () => {
    emptyArchiveModal.style.display = "none";
  });

  cancelEmptyArchiveBtn.addEventListener("click", () => {
    emptyArchiveModal.style.display = "none";
  });

  confirmEmptyArchiveBtn.addEventListener("click", async () => {
    try {
      const res = await fetch("/osas/api/archive/empty", {
        method: "DELETE"
      });

      if (!res.ok) throw new Error("Failed to empty archive");

      archivedOrgs = [];
      
      showToast("Archive emptied successfully", "warning");
      updateStats();
      renderArchive();
      emptyArchiveModal.style.display = "none";
    } catch (err) {
      console.error("Error emptying archive:", err);
      showToast("Error emptying archive", "error");
    }
  });

  // Close modals when clicking outside
  window.addEventListener("click", (e) => {
    if (e.target === restoreModal) {
      restoreModal.style.display = "none";
      currentOrgId = null;
    }
    if (e.target === permanentDeleteModal) {
      permanentDeleteModal.style.display = "none";
      currentOrgId = null;
    }
    if (e.target === emptyArchiveModal) {
      emptyArchiveModal.style.display = "none";
    }
  });

  // ============================
  // TOAST NOTIFICATION
  // ============================
  function showToast(message, type = "success") {
    toast.textContent = message;
    toast.className = "toast";
    
    if (type === "error") {
      toast.classList.add("error");
    } else if (type === "warning") {
      toast.classList.add("warning");
    }
    
    toast.style.display = "block";
    
    setTimeout(() => {
      toast.style.display = "none";
    }, 3000);
  }

  // ============================
  // INITIAL LOAD
  // ============================
  loadArchivedOrgs();
});