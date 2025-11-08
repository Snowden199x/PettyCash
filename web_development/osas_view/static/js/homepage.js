document.addEventListener("DOMContentLoaded", () => {
  const tableBody = document.getElementById("orgTableBody");
  const tableContainer = document.getElementById("tableContainer");
  const emptyState = document.getElementById("emptyState");

  // ============================
  //  SLIDE MENU TOGGLE
  // ============================
  const menuIcon = document.querySelector(".menu-icon img");
  const sideMenu = document.getElementById("sideMenu");

  menuIcon.addEventListener("click", () => {
    sideMenu.classList.toggle("active");
  });

  window.addEventListener("click", (e) => {
    if (e.target === sideMenu) return;
    if (!sideMenu.contains(e.target) && !menuIcon.contains(e.target)) {
      sideMenu.classList.remove("active");
    }
  });

  // ============================
  //  FETCH AND RENDER ORGANIZATIONS
  // ============================
  async function loadOrganizations() {
    try {
      const res = await fetch("/osas/api/organizations");
      const data = await res.json();
      if (data.organizations) {
        renderTable(data.organizations);
        updateDashboardStats(data.organizations);
      }
    } catch (err) {
      console.error("Failed to load organizations:", err);
    }
  }

  function renderTable(orgs) {
    tableBody.innerHTML = "";
    orgs.forEach(org => {
      const row = document.createElement("tr");
      row.innerHTML = `
        <td>${org.name}</td>
        <td>${org.username}</td>
        <td>••••••••</td> <!-- Masked password -->
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
    
    // Show/Hide table or empty state
    tableContainer.style.display = orgs.length > 0 ? "block" : "none";
    emptyState.style.display = orgs.length === 0 ? "flex" : "none";

    addTableListeners();
  }

  function updateDashboardStats(orgs) {
    document.getElementById("totalOrganizations").textContent = orgs.length;
    document.getElementById("pendingReports").textContent =
      orgs.filter(o => o.status === "Pending").length;
    document.getElementById("approvedReports").textContent =
      orgs.filter(o => o.status === "Approved").length;
  }

  // ============================
  //  TABLE BUTTON LISTENERS
  // ============================
  function addTableListeners() {
    document.querySelectorAll(".edit-btn").forEach(btn => {
      btn.addEventListener("click", () => {
        const id = btn.dataset.id;
        // The add_org.js will handle opening the edit modal
        const event = new CustomEvent("editOrg", { detail: id });
        document.dispatchEvent(event);
      });
    });

    document.querySelectorAll(".delete-btn").forEach(btn => {
      btn.addEventListener("click", async () => {
        const id = btn.dataset.id;
        if (!confirm("Are you sure you want to delete this organization?")) return;

        try {
          const res = await fetch(`/osas/api/organizations/${id}`, { method: "DELETE" });
          if (!res.ok) throw new Error("Failed to delete organization");
          await loadOrganizations();
        } catch (err) {
          console.error(err);
          alert("Error deleting organization.");
        }
      });
    });
  }

  // ============================
  // INITIAL LOAD
  // ============================
  loadOrganizations();
});