document.addEventListener("DOMContentLoaded", () => {
  // --- ELEMENTS ---
  const tableBody = document.getElementById("orgTableBody");
  const tableContainer = document.getElementById("tableContainer");
  const emptyState = document.getElementById("emptyState");
  const searchInput = document.getElementById("searchOrgs");
  const departmentFilter = document.getElementById("departmentFilter");

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

  const toast = document.getElementById("toast");

  const deleteModal = document.getElementById("deleteModal");
  const closeDeleteModal = document.getElementById("closeDeleteModal");
  const cancelDeleteBtn = document.getElementById("cancelDeleteBtn");
  const confirmDeleteBtn = document.getElementById("confirmDeleteBtn");

  const logoLink = document.getElementById("logoLink");

  const departmentSelect = document.getElementById("orgDepartment");
  let departments = [];
  let orgs = [];
  let editingOrgId = null;
  let orgIdToDelete = null;

  // LOGO CLICK
  if (logoLink) {
    logoLink.addEventListener("click", () => {
      window.location.href = "/osas/dashboard";
    });
  }

  // POPULATE DEPARTMENT FILTER
  async function loadDepartmentFilter() {
    try {
      const res = await fetch("/osas/api/departments");
      const data = await res.json();
      departments = data.departments || [];
      departmentFilter.innerHTML = `<option value="">All Departments</option>`;
      departments.forEach((dep) => {
        departmentFilter.innerHTML += `<option value="${dep.name}">${dep.name}</option>`;
      });
    } catch (err) {
      departmentFilter.innerHTML = `<option value="">All Departments</option>`;
    }
  }

  // POPULATE DEPARTMENT SELECT (modal)
  async function loadDepartmentsSelect(selectedId = "") {
    try {
      if (!departments.length) {
        const res = await fetch("/osas/api/departments");
        const data = await res.json();
        departments = data.departments || [];
      }
      departmentSelect.innerHTML = `<option value="">Select Department</option>`;
      departments.forEach((dep) => {
        departmentSelect.innerHTML += `<option value="${dep.id}" ${
          String(dep.id) === String(selectedId) ? "selected" : ""
        }>${dep.name}</option>`;
      });
    } catch (err) {
      departmentSelect.innerHTML = `<option value="">No Departments Found</option>`;
    }
  }

  // TABLE RENDERING
  function renderTable() {
    tableBody.innerHTML = "";
    orgs.forEach((org) => {
      const row = document.createElement("tr");
      row.innerHTML = `
        <td>${org.name}</td>
        <td>${org.department || "-"}</td>
        <td>${org.username}</td>
        <td>••••••••</td>
        <td>${org.date || "-"}</td>
        <td class="${
          org.status === "Approved" ? "status-approved" : "status-pending"
        }">${org.status || "-"}</td>
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

  // LOAD ORGANIZATIONS
  async function loadOrganizations() {
    showLoading();
    try {
      const res = await fetch("/osas/api/organizations");
      const data = await res.json();
      orgs = data.organizations || [];
      // kung may initial search or dept filter, gamitin agad
      applyFilters();
    } catch (err) {
      console.error("Error loading organizations:", err);
      showToast("Failed to load organizations", "error");
      tableContainer.style.display = "none";
      emptyState.style.display = "flex";
    }
  }

  function showLoading() {
    tableBody.innerHTML =
      '<tr><td colspan="7" style="text-align:center; padding: 40px;">Loading organizations...</td></tr>';
    tableContainer.style.display = "block";
    emptyState.style.display = "none";
  }

  // FILTERS AND SEARCH
  searchInput.addEventListener("input", applyFilters);
  departmentFilter.addEventListener("change", applyFilters);

  function applyFilters() {
    const searchTerm = searchInput.value.trim().toLowerCase();
    const selectedDept = departmentFilter.value;
    let filtered = orgs;
    if (selectedDept)
      filtered = filtered.filter((org) => org.department === selectedDept);
    if (searchTerm) {
      filtered = filtered.filter(
        (org) =>
          org.name.toLowerCase().includes(searchTerm) ||
          org.username.toLowerCase().includes(searchTerm) ||
          (org.department && org.department.toLowerCase().includes(searchTerm))
      );
    }
    renderFilteredTable(filtered);
  }

  function renderFilteredTable(filtered) {
    tableBody.innerHTML = "";
    if (filtered.length === 0) {
      tableBody.innerHTML =
        '<tr><td colspan="7" style="text-align:center; padding: 40px; color: #828282;">No organizations found matching your filters</td></tr>';
      tableContainer.style.display = "block";
      emptyState.style.display = "none";
      return;
    }
    filtered.forEach((org) => {
      const row = document.createElement("tr");
      row.innerHTML = `
        <td>${org.name}</td>
        <td>${org.department || "-"}</td>
        <td>${org.username}</td>
        <td>••••••••</td>
        <td>${org.date || "-"}</td>
        <td class="${
          org.status === "Approved" ? "status-approved" : "status-pending"
        }">${org.status || "-"}</td>
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
    tableContainer.style.display = "block";
    emptyState.style.display = "none";
  }

  // MODALS & BUTTONS
  addOrgBtn.addEventListener("click", openAddModal);
  closeModalBtn.addEventListener(
    "click",
    () => (addOrgModal.style.display = "none")
  );
  cancelModalBtn.addEventListener(
    "click",
    () => (addOrgModal.style.display = "none")
  );
  window.addEventListener("click", (e) => {
    if (e.target === addOrgModal) addOrgModal.style.display = "none";
  });

  function openAddModal() {
    form.reset();
    editingOrgId = null;
    addOrgModal.style.display = "flex";
    document.getElementById("modalTitle").textContent = "Add New Organization";
    document.getElementById("modalSubtitle").textContent =
      "Create a new accredited organization account";
    saveBtn.textContent = "Create";
    usernameField.value = generateUsername();
    passwordField.value = generatePassword();
    loadDepartmentsSelect();
  }

  async function openEditModal(id) {
    const org = orgs.find((o) => o.id == id);
    if (!org) return;
    editingOrgId = id;
    addOrgModal.style.display = "flex";
    document.getElementById("modalTitle").textContent = "Edit Organization";
    document.getElementById("modalSubtitle").textContent =
      "Update accredited organization details";
    saveBtn.textContent = "Save";
    document.getElementById("orgName").value = org.name;
    usernameField.value = org.username;
    passwordField.value = "";
    document.getElementById("accreditationDate").value = org.date || "";

    let deptId = "";
    const dep = departments.find((d) => d.name === org.department);
    if (dep) deptId = dep.id;
    await loadDepartmentsSelect(deptId);
  }

  // FORM SUBMISSION
  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    const department_id = parseInt(departmentSelect.value, 10) || null;
    const orgName = document.getElementById("orgName").value;
    const username = usernameField.value;
    const password = passwordField.value;
    const accreditationDate =
      document.getElementById("accreditationDate").value;

    if (!orgName || !username || !accreditationDate || !department_id) {
      alert("All fields except password are required!");
      return;
    }

    const orgData = {
      department_id,
      orgName,
      username,
      accreditationDate,
    };
    if (password) orgData.password = password;

    try {
      if (editingOrgId) {
        // UPDATE
        const res = await fetch(`/osas/api/organizations/${editingOrgId}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(orgData),
        });
        if (!res.ok) throw new Error("Failed to update organization");
        showToast("Organization updated successfully!");
      } else {
        // CREATE
        if (!password) {
          alert("Password is required when creating an organization!");
          return;
        }
        orgData.password = password;

        const res = await fetch("/osas/add_organization", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(orgData),
        });

        if (!res.ok) {
          let msg = "Failed to add organization";
          try {
            const err = await res.json();
            if (err && err.error) msg = err.error;
          } catch {}
          showToast(msg, "error");
          return;
        }
        const data = await res.json();

        if (!res.ok) {
          throw new Error(data.error || "Failed to add organization");
        }

        showToast("Organization added successfully!");
      }

      form.reset();
      addOrgModal.style.display = "none";
      await loadOrganizations();
    } catch (err) {
      console.error("Error saving organization:", err);
      showToast(err.message || "Error saving organization.", "error");
    }
  });

  // DELETE FUNCTIONALITY
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
      const res = await fetch(`/osas/api/organizations/${orgIdToDelete}`, {
        method: "DELETE",
      });
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

  window.addEventListener("click", (e) => {
    if (e.target === deleteModal) {
      deleteModal.style.display = "none";
      orgIdToDelete = null;
    }
  });

  // GEN BUTTONS
  genCodeBtn.addEventListener(
    "click",
    () => (usernameField.value = generateUsername())
  );
  genPassBtn.addEventListener(
    "click",
    () => (passwordField.value = generatePassword())
  );

  function generateUsername() {
    return `0125-${Math.floor(1000 + Math.random() * 9000)}`;
  }

  function generatePassword() {
    const chars =
      "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$";
    let pass = "";
    for (let i = 0; i < 8; i++)
      pass += chars[Math.floor(Math.random() * chars.length)];
    return pass;
  }

  // TABLE EVENTS (Edit/Delete)
  tableBody.addEventListener("click", (e) => {
    const target = e.target;
    if (target.closest(".dropdown-btn")) {
      e.stopPropagation();
      const btn = target.closest(".dropdown-btn");
      const menu = btn.nextElementSibling;
      menu.style.display = menu.style.display === "flex" ? "none" : "flex";
    }
    if (target.classList.contains("edit-btn")) {
      e.stopPropagation();
      openEditModal(target.dataset.id);
    }
    if (target.classList.contains("delete-btn")) {
      e.stopPropagation();
      orgIdToDelete = target.dataset.id;
      deleteModal.style.display = "flex";
    }
  });

  // Global dropdown close
  window.addEventListener("click", (e) => {
    document.querySelectorAll(".dropdown-menu").forEach((menu) => {
      if (!menu.parentElement.contains(e.target)) {
        menu.style.display = "none";
      }
    });
  });

  // TOAST
  function showToast(message, type = "success") {
    toast.textContent = message;
    toast.style.backgroundColor = type === "success" ? "#2d8a47" : "#e74c3c";
    toast.style.display = "block";
    setTimeout(() => (toast.style.display = "none"), 2500);
  }

  // Scroll to top on logo click
  logoLink.addEventListener("click", () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  });

  // read search query from URL (?search=...)
  const params = new URLSearchParams(window.location.search);
  const initialSearch = params.get("search") || "";
  if (initialSearch) {
    searchInput.value = initialSearch;
  }

  // INITIAL LOAD
  loadDepartmentFilter();
  loadDepartmentsSelect();
  loadOrganizations();
});
