// Sample data to simulate backend
const organizations = [
  {
    name: "Information Technology Unity Hub",
    code: "0124-1111",
    password: "HbS485eR!",
    date: "October 2, 2025",
    status: "Approved"
  },
  {
    name: "Business Administration Society",
    code: "0125-2222",
    password: "BsA123qT!",
    date: "October 4, 2025",
    status: "Approved"
  }
];

// Load table data
function loadOrganizations() {
  const tableBody = document.querySelector("#organizationTable tbody");
  tableBody.innerHTML = "";

  organizations.forEach((org, index) => {
    const row = document.createElement("tr");
    row.innerHTML = `
      <td>${org.name}</td>
      <td>${org.code}</td>
      <td>${org.password}</td>
      <td>${org.date}</td>
      <td>${org.status}</td>
      <td class="action-cell">
        <button class="edit-btn" data-index="${index}">
          <img src="../static/images/edit_button.png" alt="Edit">
        </button>
      </td>
    `;
    tableBody.appendChild(row);
  });

  // Update total org count
  document.getElementById("totalOrganizations").textContent = organizations.length;
}

// Simulate add org
document.getElementById("addOrganization").addEventListener("click", () => {
  const newOrg = {
    name: "New Student Organization",
    code: `0126-${Math.floor(Math.random() * 9000 + 1000)}`,
    password: "Temp123!",
    date: new Date().toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" }),
    status: "Approved"
  };
  organizations.push(newOrg);
  loadOrganizations();
});

// Handle edit click
document.addEventListener("click", (e) => {
  if (e.target.closest(".edit-btn")) {
    const index = e.target.closest(".edit-btn").dataset.index;
    const org = organizations[index];
    alert(`Edit ${org.name}'s details`);
  }
});

// Initialize
window.onload = loadOrganizations;
