document.addEventListener("DOMContentLoaded", () => {
  // --- ELEMENTS ---
  const addOrgModal = document.getElementById("addOrgModal");
  const addOrgBtn = document.getElementById("addOrganization");
  const closeModalBtn = document.getElementById("closeModal");
  const cancelModalBtn = document.getElementById("cancelModal");
  const form = document.getElementById("addOrgForm");
  const usernameField = document.getElementById("orgCode");
  const passwordField = document.getElementById("orgPassword");
  const genCodeBtn = document.getElementById("genCode");
  const genPassBtn = document.getElementById("genPass");

  const tableBody = document.getElementById("orgTableBody");
  const tableContainer = document.getElementById("tableContainer");
  const emptyState = document.getElementById("emptyState");
  const totalOrganizations = document.getElementById("totalOrganizations");
  const pendingReports = document.getElementById("pendingReports");
  const approvedReports = document.getElementById("approvedReports");

  let orgs = []; // Array for organizations
  let editingOrgId = null;

  // ============================
  // MODAL EVENTS
  // ============================
  addOrgBtn.addEventListener("click", () => {
    form.reset();
    addOrgModal.style.display = "flex";
    usernameField.value = generateUsername();
    passwordField.value = generatePassword();
    editingOrgId = null;
  });

  closeModalBtn.addEventListener("click", () => (addOrgModal.style.display = "none"));
  cancelModalBtn.addEventListener("click", () => (addOrgModal.style.display = "none"));
  window.addEventListener("click", (e) => {
    if (e.target === addOrgModal) addOrgModal.style.display = "none";
  });

  // ============================
  // GENERATE BUTTONS
  // ============================
  genCodeBtn.addEventListener("click", () => {
    usernameField.value = generateUsername();
  });

  genPassBtn.addEventListener("click", () => {
    passwordField.value = generatePassword();
  });

  // ============================
  // GENERATOR FUNCTIONS
  // ============================
  function generateUsername() {
    const randomFour = Math.floor(1000 + Math.random() * 9000);
    return `0125-${randomFour}`;
  }

  function generatePassword() {
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$";
    let pass = "";
    for (let i = 0; i < 8; i++) {
      pass += chars[Math.floor(Math.random() * chars.length)];
    }
    return pass;
  }

  // ============================
  // FORM SUBMIT (ADD OR EDIT)
  // ============================
  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    const orgData = {
      orgName: document.getElementById("orgName").value,
      username: usernameField.value,
      password: passwordField.value || undefined, // If blank when editing, backend keeps existing password
      accreditationDate: document.getElementById("accreditationDate").value,
      orgStatus: document.getElementById("orgStatus").value
    };

    try {
      if (editingOrgId) {
        // EDIT organization
        const res = await fetch(`/osas/api/organizations/${editingOrgId}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(orgData)
        });
        if (!res.ok) throw new Error("Failed to update organization");
      } else {
        // ADD new organization
        const res = await fetch("/osas/add_organization", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(orgData)
        });
        if (!res.ok) throw new Error("Failed to add organization");
      }

      form.reset();
      addOrgModal.style.display = "none";
      await loadOrganizations();
    } catch (err) {
      console.error(err);
      alert("Error saving organization.");
    }
  });

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
      }
    } catch (err) {
      console.error("Error loading organizations:", err);
    }
  }

  // ============================
  // RENDER TABLE
  // ============================
  function renderTable() {
    tableBody.innerHTML = "";
    orgs.forEach((org) => {
      const row = document.createElement("tr");
      row.innerHTML = `
        <td>${org.name}</td>
        <td>${org.username}</td>
        <td>••••••••</td>
        <td>${org.date || "-"}</td>
        <td>${org.status || "-"}</td>
         <td>
        <button class="edit-btn" data-id="${org.id}" 
          style="padding: 5px 10px; border-radius: 6px; border: 1px solid #3498db; background-color: #3498db; color: white; cursor: pointer; margin-right: 5px;">
          Edit
        </button>
        <button class="delete-btn" data-id="${org.id}" 
          style="padding: 5px 10px; border-radius: 6px; border: 1px solid #e74c3c; background-color: #e74c3c; color: white; cursor: pointer;">
          Delete
        </button>
      </td>
      `;
      tableBody.appendChild(row);
    });

    updateDashboardStats();
    tableContainer.style.display = orgs.length > 0 ? "block" : "none";
    emptyState.style.display = orgs.length === 0 ? "flex" : "none";

    addTableListeners();
  }

  function updateDashboardStats() {
    totalOrganizations.textContent = orgs.length;
    pendingReports.textContent = orgs.filter(o => o.status === "Pending").length;
    approvedReports.textContent = orgs.filter(o => o.status === "Approved").length;
  }

  // ============================
  // TABLE BUTTON LISTENERS
  // ============================
  function addTableListeners() {
    document.querySelectorAll(".edit-btn").forEach(btn => {
      btn.addEventListener("click", () => openEditModal(btn.dataset.id));
    });

    document.querySelectorAll(".delete-btn").forEach(btn => {
      btn.addEventListener("click", () => deleteOrganization(btn.dataset.id));
    });
  }

  // ============================
  // EDIT ORGANIZATION
  // ============================
  function openEditModal(id) {
    const org = orgs.find(o => o.id == id);
    if (!org) return;

    editingOrgId = id;
    addOrgModal.style.display = "flex";

    document.getElementById("orgName").value = org.name;
    usernameField.value = org.username;
    passwordField.value = ""; // Leave blank if admin doesn’t want to change password
    document.getElementById("accreditationDate").value = org.date;
    document.getElementById("orgStatus").value = org.status;
  }

  // ============================
  // DELETE ORGANIZATION
  // ============================
  async function deleteOrganization(id) {
    if (!confirm("Are you sure you want to delete this organization?")) return;

    try {
      const res = await fetch(`/osas/api/organizations/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete organization");
      await loadOrganizations();
    } catch (err) {
      console.error(err);
      alert("Error deleting organization.");
    }
  }

  // ============================
  // INITIAL LOAD
  // ============================
  loadOrganizations();
});