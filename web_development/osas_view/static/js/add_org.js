document.addEventListener("DOMContentLoaded", () => {
  const addBtn = document.getElementById("addOrganization");
  const addOrgModal = document.getElementById("addOrgModal");
  const deleteModal = document.getElementById("deleteModal");
  const closeModal = document.getElementById("closeModal");
  const cancelModal = document.getElementById("cancelModal");
  const form = document.getElementById("addOrgForm");
  const saveBtn = document.getElementById("saveOrgBtn");
  const actionMenu = document.getElementById("actionMenu");
  const orgTableBody = document.getElementById("orgTableBody");
  const cancelDelete = document.getElementById("cancelDelete");
  const confirmDelete = document.getElementById("confirmDelete");
  const editBtn = document.getElementById("editOrgBtn");
  const deleteBtn = document.getElementById("deleteOrgBtn");
  const totalOrganizations = document.getElementById("totalOrganizations");

  let orgs = [
    { name: "Information Technology Unity Hub", code: "0124-1111", password: "HbS485eR!", date: "October 2, 2025", status: "Approved" },
    { name: "Business Administration Society", code: "0125-2222", password: "BsA123qT!", date: "October 4, 2025", status: "Approved" },
  ];

  let currentIndex = null;

  // --- Generate random code ---
  function generateCode() {
    return `${Math.floor(1000 + Math.random() * 9000)}-${Math.floor(1000 + Math.random() * 9000)}`;
  }

  // --- Generate random password ---
  function generatePassword() {
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$";
    return Array.from({ length: 8 }, () => chars[Math.floor(Math.random() * chars.length)]).join("");
  }

  function updateStats() {
    totalOrganizations.textContent = orgs.length;
  }

  function renderTable() {
    orgTableBody.innerHTML = "";
    orgs.forEach((org, index) => {
      const row = document.createElement("tr");
      row.innerHTML = `
        <td>${org.name}</td>
        <td>${org.code}</td>
        <td>${org.password}</td>
        <td>${org.date}</td>
        <td>${org.status}</td>
        <td><button class="edit-btn"><img src="../static/images/edit_button.png" data-index="${index}" /></button></td>
      `;
      orgTableBody.appendChild(row);
    });
    updateStats();
  }

  function showModal(modal) {
    modal.style.display = "flex";
  }

  function hideModals() {
    addOrgModal.style.display = "none";
    deleteModal.style.display = "none";
  }

  addBtn.onclick = () => {
    form.reset();
    document.getElementById("modalTitle").textContent = "Add New Organization";
    document.getElementById("modalSubtitle").textContent = "Create a new accredited organization account";
    saveBtn.textContent = "Create";
    showModal(addOrgModal);
  };

  closeModal.onclick = hideModals;
  cancelModal.onclick = hideModals;
  cancelDelete.onclick = hideModals;

  form.onsubmit = (e) => {
    e.preventDefault();
    const name = document.getElementById("orgName").value;
    const code = document.getElementById("orgCode").value;
    const password = document.getElementById("orgPassword").value;
    const date = new Date(document.getElementById("accreditationDate").value).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" });
    const status = document.getElementById("orgStatus").value;

    if (saveBtn.textContent === "Create") {
      orgs.push({ name, code, password, date, status });
    } else {
      orgs[currentIndex] = { ...orgs[currentIndex], name, code, password, date, status };
    }

    renderTable();
    hideModals();
  };

  document.addEventListener("click", (e) => {
    if (e.target.tagName === "IMG" && e.target.dataset.index) {
      const rect = e.target.getBoundingClientRect();
      actionMenu.style.display = "flex";
      actionMenu.style.top = `${rect.bottom + window.scrollY + 5}px`;
      actionMenu.style.left = `${rect.left - 30}px`;
      currentIndex = e.target.dataset.index;
    } else if (!actionMenu.contains(e.target)) {
      actionMenu.style.display = "none";
    }
  });

  editBtn.onclick = () => {
    const org = orgs[currentIndex];
    document.getElementById("orgName").value = org.name;
    document.getElementById("orgCode").value = org.code;
    document.getElementById("orgPassword").value = org.password;
    document.getElementById("accreditationDate").value = new Date(org.date).toISOString().split("T")[0];
    document.getElementById("orgStatus").value = org.status;
    document.getElementById("modalTitle").textContent = "Edit Organization";
    document.getElementById("modalSubtitle").textContent = "Modify the details of this organization";
    saveBtn.textContent = "Save Changes";
    showModal(addOrgModal);
    actionMenu.style.display = "none";
  };

  deleteBtn.onclick = () => {
    showModal(deleteModal);
    actionMenu.style.display = "none";
  };

  confirmDelete.onclick = () => {
    orgs.splice(currentIndex, 1);
    renderTable();
    hideModals();
  };

  // --- Generate buttons events ---
  document.addEventListener("click", (e) => {
    if (e.target.id === "genCode") document.getElementById("orgCode").value = generateCode();
    if (e.target.id === "genPass") document.getElementById("orgPassword").value = generatePassword();
  });

  renderTable();
});
