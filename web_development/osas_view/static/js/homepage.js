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

  let orgs = [];
  let editingOrgId = null;

  // ============================
  // SLIDE MENU
  // ============================
  const menuIcon = document.querySelector(".menu-icon img");
  const sideMenu = document.getElementById("sideMenu");

  menuIcon.addEventListener("click", () => sideMenu.classList.toggle("active"));
  window.addEventListener("click", (e) => {
    if (!sideMenu.contains(e.target) && !menuIcon.contains(e.target)) {
      sideMenu.classList.remove("active");
    }
  });

  // ============================
  // GENERATE USERNAME / PASSWORD
  // ============================
  genCodeBtn.addEventListener("click", () => {
    usernameField.value = generateUsername();
  });
  genPassBtn.addEventListener("click", () => {
    passwordField.value = generatePassword();
  });

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
          <button class="edit-btn" data-id="${org.id}" style="padding:5px 10px; border-radius:6px; border:none; background:#3498db; color:#fff; cursor:pointer;">Edit</button>
          <button class="delete-btn" data-id="${org.id}" style="padding:5px 10px; border-radius:6px; border:none; background:#e74c3c; color:#fff; cursor:pointer; margin-left:5px;">Delete</button>
        </td>
      `;
      tableBody.appendChild(row);
    });

    document.querySelectorAll(".edit-btn").forEach(btn => {
      btn.addEventListener("click", () => openEditModal(btn.dataset.id));
    });
    document.querySelectorAll(".delete-btn").forEach(btn => {
      btn.addEventListener("click", () => deleteOrganization(btn.dataset.id));
    });

    tableContainer.style.display = orgs.length > 0 ? "block" : "none";
    emptyState.style.display = orgs.length === 0 ? "flex" : "none";
  }

  // ============================
  // ADD / EDIT MODAL
  // ============================
  addOrgBtn.addEventListener("click", () => openAddModal());
  closeModalBtn.addEventListener("click", () => addOrgModal.style.display = "none");
  cancelModalBtn.addEventListener("click", () => addOrgModal.style.display = "none");
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
    passwordField.value = ""; // optional on edit
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
      password: passwordField.value, // optional on edit
      accreditationDate: document.getElementById("accreditationDate").value,
      orgStatus: document.getElementById("orgStatus").value
    };

    try {
      if (editingOrgId) {
        // edit org
        const res = await fetch(`/osas/api/organizations/${editingOrgId}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(orgData)
        });
        if (!res.ok) throw new Error("Failed to update organization");
      } else {
        // add org
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
  // DELETE ORG
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