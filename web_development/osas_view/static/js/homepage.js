document.addEventListener("DOMContentLoaded", () => {
  // --- ELEMENTS ---
  const tableBody = document.getElementById("orgTableBody");
  const tableContainer = document.getElementById("tableContainer");
  const emptyState = document.getElementById("emptyState");

  const addOrgModal = document.getElementById("addOrgModal");
  const addOrgBtn = document.getElementById("addOrganization");
  const closeModalBtn = document.getElementById("closeModal");
  const cancelModalBtn = document.getElementById("cancelModal");
  const form = document.getElementById("addOrgForm");
  const usernameField = document.getElementById("orgCode");
  const passwordField = document.getElementById("orgPassword");
  const genCodeBtn = document.getElementById("genCode");
  const genPassBtn = document.getElementById("genPass");
  const saveBtn = document.getElementById("saveOrgBtn");

  const totalOrganizations = document.getElementById("totalOrganizations");
  const pendingReports = document.getElementById("pendingReports");
  const approvedReports = document.getElementById("approvedReports");

  const toast = document.getElementById("toast");

  // DELETE MODAL ELEMENTS
  const deleteModal = document.getElementById("deleteModal");
  const closeDeleteModal = document.getElementById("closeDeleteModal");
  const cancelDeleteBtn = document.getElementById("cancelDeleteBtn");
  const confirmDeleteBtn = document.getElementById("confirmDeleteBtn");

  let orgs = [];
  let editingOrgId = null;
  let orgIdToDelete = null;

  // ============================
  // MENU TOGGLE
  // ============================
  const menuIcon = document.querySelector(".menu-icon img");
  const sideMenu = document.getElementById("sideMenu");
  menuIcon.addEventListener("click", () => sideMenu.classList.toggle("active"));
  window.addEventListener("click", (e) => {
    if (!sideMenu.contains(e.target) && !menuIcon.contains(e.target)) sideMenu.classList.remove("active");
  });

  // ============================
  // GENERATE USERNAME / PASSWORD
  // ============================
  genCodeBtn.addEventListener("click", () => (usernameField.value = generateUsername()));
  genPassBtn.addEventListener("click", () => (passwordField.value = generatePassword()));

  function generateUsername() {
    return `0125-${Math.floor(1000 + Math.random() * 9000)}`;
  }

  function generatePassword() {
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$";
    let pass = "";
    for (let i = 0; i < 8; i++) pass += chars[Math.floor(Math.random() * chars.length)];
    return pass;
  }

  // ============================
  // LOAD ORGANIZATIONS
  // ============================
  async function loadOrganizations() {
    try {
      const res = await fetch("/osas/api/organizations");
      const data = await res.json();
      if (data.organizations) {
        orgs = data.organizations;
        renderTable();
        updateDashboardStats();
      }
    } catch (err) {
      console.error("Error loading organizations:", err);
    }
  }

  function updateDashboardStats() {
    totalOrganizations.textContent = orgs.length;
    pendingReports.textContent = orgs.filter(o => o.status === "Pending").length;
    approvedReports.textContent = orgs.filter(o => o.status === "Approved").length;
  }

  // ============================
  // RENDER TABLE
  // ============================
  function renderTable() {
    tableBody.innerHTML = "";
    orgs.forEach(org => {
      const row = document.createElement("tr");
      row.innerHTML = `
        <td>${org.name}</td>
        <td>${org.username}</td>
        <td>••••••••</td>
        <td>${org.date || "-"}</td>
        <td>${org.status || "-"}</td>
        <td>
          <div class="dropdown">
            <button class="dropdown-btn">
              <img src="./static/images/edit_button.png" alt="Edit Options" />
            </button>
            <div class="dropdown-menu">
              <button class="edit-btn" data-id="${org.id}">Edit</button>
              <button class="delete-btn" data-id="${org.id}">Delete</button>
            </div>
          </div>
        </td>
      `;
      tableBody.appendChild(row);
    });

    tableContainer.style.display = orgs.length > 0 ? "block" : "none";
    emptyState.style.display = orgs.length === 0 ? "flex" : "none";
  }

  // ============================
  // DROPDOWN + EDIT/DELETE EVENTS
  // ============================
  tableBody.addEventListener("click", (e) => {
    const target = e.target;

    // DROPDOWN BUTTON
    if (target.closest(".dropdown-btn")) {
      e.stopPropagation();
      const btn = target.closest(".dropdown-btn");
      const menu = btn.nextElementSibling;
      menu.style.display = menu.style.display === "flex" ? "none" : "flex";
    }

    // EDIT BUTTON
    if (target.classList.contains("edit-btn")) {
      e.stopPropagation();
      openEditModal(target.dataset.id);
    }

    // DELETE BUTTON
    if (target.classList.contains("delete-btn")) {
      e.stopPropagation();
      orgIdToDelete = target.dataset.id;
      deleteModal.style.display = "flex";
    }
  });

  // Close dropdown if clicked outside
  window.addEventListener("click", (e) => {
    document.querySelectorAll(".dropdown-menu").forEach(menu => {
      if (!menu.parentElement.contains(e.target)) {
        menu.style.display = "none";
      }
    });
  });

  // ============================
  // TOAST MESSAGE
  // ============================
  function showToast(message, type = "success") {
    toast.textContent = message;
    toast.style.backgroundColor = type === "success" ? "#2d8a47" : "#e74c3c";
    toast.style.display = "block";
    setTimeout(() => (toast.style.display = "none"), 2500);
  }

  // ============================
  // ADD / EDIT MODAL
  // ============================
  addOrgBtn.addEventListener("click", openAddModal);
  closeModalBtn.addEventListener("click", () => (addOrgModal.style.display = "none"));
  cancelModalBtn.addEventListener("click", () => (addOrgModal.style.display = "none"));
  window.addEventListener("click", (e) => {
    if (e.target === addOrgModal) addOrgModal.style.display = "none";
  });

  function openAddModal() {
    form.reset();
    editingOrgId = null;
    addOrgModal.style.display = "flex";
    document.getElementById("modalTitle").textContent = "Add New Organization";
    document.getElementById("modalSubtitle").textContent = "Create a new accredited organization account";
    saveBtn.textContent = "Create";
    usernameField.value = generateUsername();
    passwordField.value = generatePassword();
  }

  function openEditModal(id) {
    const org = orgs.find(o => o.id == id);
    if (!org) return;

    editingOrgId = id;
    addOrgModal.style.display = "flex";
    document.getElementById("modalTitle").textContent = "Edit Organization";
    document.getElementById("modalSubtitle").textContent = "Update accredited organization details";
    saveBtn.textContent = "Save";

    document.getElementById("orgName").value = org.name;
    usernameField.value = org.username;
    passwordField.value = "";
    document.getElementById("accreditationDate").value = org.date;
    document.getElementById("orgStatus").value = org.status;
  }

  // ============================
  // FORM SUBMIT
  // ============================
  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    const orgData = {
      orgName: document.getElementById("orgName").value,
      username: usernameField.value,
      password: passwordField.value,
      accreditationDate: document.getElementById("accreditationDate").value,
      orgStatus: document.getElementById("orgStatus").value,
    };

    try {
      if (editingOrgId) {
        const res = await fetch(`/osas/api/organizations/${editingOrgId}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(orgData),
        });
        if (!res.ok) throw new Error("Failed to update organization");
        showToast("Organization updated successfully!");
      } else {
        const res = await fetch("/osas/add_organization", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(orgData),
        });
        if (!res.ok) throw new Error("Failed to add organization");
        showToast("Organization added successfully!");
      }

      form.reset();
      addOrgModal.style.display = "none";
      await loadOrganizations();
    } catch (err) {
      console.error(err);
      showToast("Error saving organization.", "error");
    }
  });

  // ============================
  // DELETE MODAL FUNCTIONALITY
  // ============================
  closeDeleteModal.addEventListener("click", () => {
    deleteModal.style.display = "none";
    orgIdToDelete = null;
  });

  cancelDeleteBtn.addEventListener("click", () => {
    deleteModal.style.display = "none";
    orgIdToDelete = null;
  });

  confirmDeleteBtn.addEventListener("click", async () => {
    if (!orgIdToDelete) return;

    try {
      const res = await fetch(`/osas/api/organizations/${orgIdToDelete}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete organization");
      showToast("Organization deleted successfully!");
      await loadOrganizations();
    } catch (err) {
      console.error(err);
      showToast("Error deleting organization.", "error");
    } finally {
      deleteModal.style.display = "none";
      orgIdToDelete = null;
    }
  });

  // Close delete modal if clicked outside
  window.addEventListener("click", (e) => {
    if (e.target === deleteModal) {
      deleteModal.style.display = "none";
      orgIdToDelete = null;
    }
  });

  // ============================
  // INITIAL LOAD
  // ============================
  loadOrganizations();
});
