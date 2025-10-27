document.addEventListener("DOMContentLoaded", () => {
  const tableBody = document.getElementById("orgTableBody");
  const tableContainer = document.getElementById("tableContainer");
  const emptyState = document.getElementById("emptyState");

  const addOrgModal = document.getElementById("addOrgModal");
  const addOrgBtn = document.getElementById("addOrganization");
  const closeModalBtn = document.getElementById("closeModal");
  const cancelModalBtn = document.getElementById("cancelModal");
  const form = document.getElementById("addOrgForm");

  // ============================
  //  FETCH ORGANIZATION DATA
  // ============================
  fetch("/api/organizations") // ← backend endpoint
    .then(res => res.json())
    .then(data => updateDashboard(data))
    .catch(err => console.error("Failed to load organizations:", err));

  function updateDashboard(orgs) {
    const total = orgs.length;
    document.getElementById("totalOrganizations").textContent = total;
    document.getElementById("pendingReports").textContent =
      orgs.filter(o => o.status === "Pending").length;
    document.getElementById("approvedReports").textContent =
      orgs.filter(o => o.status === "Approved").length;

    if (total === 0) {
      emptyState.style.display = "flex";
      tableContainer.style.display = "none";
    } else {
      emptyState.style.display = "none";
      tableContainer.style.display = "block";
      renderTable(orgs);
    }
  }

  function renderTable(orgs) {
    tableBody.innerHTML = "";
    orgs.forEach(org => {
      const row = document.createElement("tr");
      row.innerHTML = `
        <td>${org.name}</td>
        <td>${org.code}</td>
        <td>${org.password}</td>
        <td>${org.date}</td>
        <td>${org.status}</td>
        <td>
          <button class="edit-btn" data-id="${org.id}">
            <img src="../static/images/edit_button.png" alt="Edit">
          </button>
        </td>
      `;
      tableBody.appendChild(row);
    });
  }

  // ============================
  //  ADD ORGANIZATION MODAL
  // ============================
  addOrgBtn.addEventListener("click", () => {
    addOrgModal.style.display = "flex";
  });

  closeModalBtn.addEventListener("click", () => {
    addOrgModal.style.display = "none";
  });

  cancelModalBtn.addEventListener("click", () => {
    addOrgModal.style.display = "none";
  });

  window.addEventListener("click", (e) => {
    if (e.target === addOrgModal) {
      addOrgModal.style.display = "none";
    }
  });

  // ============================
  //  SUBMIT FORM (BACKEND READY)
  // ============================
  form.addEventListener("submit", (e) => {
    e.preventDefault();

    const newOrg = {
      name: document.getElementById("orgName").value,
      code: document.getElementById("orgCode").value,
      password: document.getElementById("orgPassword").value,
      date: document.getElementById("accreditationDate").value,
      status: document.getElementById("orgStatus").value
    };

    // send to backend (POST)
    fetch("/api/organizations", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(newOrg)
    })
      .then(res => res.json())
      .then(() => {
        addOrgModal.style.display = "none";
        form.reset();
        return fetch("/api/organizations").then(r => r.json());
      })
      .then(data => updateDashboard(data))
      .catch(err => console.error("Error saving organization:", err));
  });
});
