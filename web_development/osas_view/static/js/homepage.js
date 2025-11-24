document.addEventListener("DOMContentLoaded", () => {
  const profileBtn = document.getElementById("profileBtn");
  const profileMenu = document.getElementById("profileMenu");
  const globalSearch = document.getElementById("globalSearch");
  const adminNameEl = document.getElementById("adminName");

  const totalOrgs = document.getElementById("totalOrgs");
  const pendingReports = document.getElementById("pendingReports");
  const approvedReports = document.getElementById("approvedReports");
  const inReviewReports = document.getElementById("inReviewReports");

  // Updated for dynamic department filter
  const departmentFilter = document.getElementById("dashboardDeptFilter");
  const activityFeed = document.getElementById("activityFeed");

  const toast = document.getElementById("toast");

  let organizations = [];
  let departments = [];
  let reports = [];

  if (profileBtn && profileMenu) {
    profileBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      profileMenu.classList.toggle("active");
    });
    window.addEventListener("click", (e) => {
      if (!profileBtn.contains(e.target) && !profileMenu.contains(e.target)) {
        profileMenu.classList.remove("active");
      }
    });
  }

  if (globalSearch) {
    globalSearch.addEventListener("input", (e) => {
      const searchTerm = e.target.value.toLowerCase().trim();
      if (searchTerm.length > 2) {
        console.log("Searching for:", searchTerm);
      }
    });
    globalSearch.addEventListener("keypress", (e) => {
      if (e.key === "Enter") {
        const searchTerm = e.target.value.toLowerCase().trim();
        if (searchTerm) {
          window.location.href = `/osas/orgs?search=${encodeURIComponent(searchTerm)}`;
        }
      }
    });
  }

  async function loadDashboardData() {
    try {
      await loadAdminProfile();

      const orgRes = await fetch("/osas/api/organizations");
      if (!orgRes.ok) throw new Error("Failed to load organizations");
      const orgData = await orgRes.json();
      organizations = orgData.organizations || [];

      reports = generateReportsFromOrgs(organizations);

      updateSummaryCards();
      updateCharts();
      updateActivityFeed();
    } catch (err) {
      console.error("Error loading dashboard data:", err);
      showToast("Failed to load some dashboard data", "error");
    }
  }

  async function loadAdminProfile() {
    try {
      const res = await fetch("/osas/api/admin/profile");
      if (!res.ok) throw new Error("Profile request failed");
      const data = await res.json();
      if (data.full_name && adminNameEl) {
        adminNameEl.textContent = data.full_name.split(" ")[0];
      }
    } catch (err) {
      if (adminNameEl) adminNameEl.textContent = "Admin";
    }
  }

  // NEW DYNAMIC DEPARTMENT FILTER BLOCK
  async function loadDashboardDepartments() {
    try {
      const res = await fetch("/osas/api/departments");
      const data = await res.json();
      departments = data.departments || [];
      departmentFilter.innerHTML = '<option value="">All Departments</option>';
      departments.forEach(dep => {
        departmentFilter.innerHTML += `<option value="${dep.name}">${dep.name}</option>`;
      });
    } catch {
      departmentFilter.innerHTML = '<option value="">All Departments</option>';
    }
  }

  // Pie will use orgs filtered by department filter (matches the orgs page)
  departmentFilter.addEventListener("change", drawDepartmentChart);

  async function loadDashboardOrganizations() {
    try {
      const res = await fetch("/osas/api/organizations");
      const data = await res.json();
      organizations = data.organizations || [];
      drawDepartmentChart();
    } catch {
      organizations = [];
      drawDepartmentChart();
    }
  }

  function generateReportsFromOrgs(orgs) {
    const statuses = ["pending", "in-review", "completed"];
    return orgs.map((org) => ({
      id: org.id,
      orgId: org.id,
      orgName: org.name,
      status: statuses[Math.floor(Math.random() * statuses.length)],
      submissionDate: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString(),
      department: org.department,
      checklist: generateChecklist(),
      completionRate: Math.floor(Math.random() * 100),
    }));
  }

  function generateChecklist() {
    const items = [
      "balance-sheet",
      "income-statement",
      "cash-flow",
      "budget-proposal",
      "receipts",
      "audit-report",
    ];
    const checklist = {};
    items.forEach((item) => {
      checklist[item] = Math.random() > 0.5;
    });
    return checklist;
  }

  function updateSummaryCards() {
    if (totalOrgs) totalOrgs.textContent = organizations.length;

    const pending = reports.filter((r) => r.status === "pending").length;
    const approved = reports.filter((r) => r.status === "completed").length;
    const inReview = reports.filter((r) => r.status === "in-review").length;

    if (pendingReports) pendingReports.textContent = pending;
    if (approvedReports) approvedReports.textContent = approved;
    if (inReviewReports) inReviewReports.textContent = inReview;
  }

  function updateCharts() {
    drawDepartmentChart();
    drawStatusChart();
  }

  // -- PIE CHART: ORGANIZATIONS BY DEPARTMENT --
  function drawDepartmentChart() {
    const canvas = document.getElementById("departmentChart");
    if (!canvas) return;
    const ctx = canvas.getContext("2d");

    let orgList = organizations;

    const selectedDept = departmentFilter.value;
    if (selectedDept) {
      orgList = orgList.filter(org => org.department === selectedDept);
    }

    let deptNames = departments.map(d => d.name);
    let deptCounts = deptNames.map(
      name => orgList.filter(org => org.department === name).length
    );

    if (selectedDept) {
      deptNames = [selectedDept];
      deptCounts = [orgList.length];
    }

    const colors = [
      "#8B3B08", "#E59E2C", "#3498DB", "#2ECC71", "#A569BD", "#2f3640", "#FF7675",
      "#00b894", "#fdcb6e", "#636e72", "#0097e6", "#b2bec3"
    ];
    drawPieChart(ctx, deptCounts, colors);
    updateLegend("deptLegend", deptNames, colors, deptCounts);
  }

  // PIE CHART HELPER
  function drawPieChart(ctx, data, colors) {
    const canvas = ctx.canvas;
    const width = canvas.width || 300;
    const height = canvas.height || 300;
    const centerX = width / 2;
    const centerY = height / 2;
    const radius = Math.min(width, height) / 2.5;

    const total = data.reduce((sum, val) => sum + val, 0) || 1;
    let currentAngle = -Math.PI / 2;

    ctx.clearRect(0, 0, width, height);

    data.forEach((value, index) => {
      const sliceAngle = (value / total) * 2 * Math.PI;
      ctx.beginPath();
      ctx.arc(centerX, centerY, radius, currentAngle, currentAngle + sliceAngle);
      ctx.lineTo(centerX, centerY);
      ctx.fillStyle = colors[index % colors.length];
      ctx.fill();
      currentAngle += sliceAngle;
    });
  }

  function updateLegend(elementId, labels, colors, data) {
    const legend = document.getElementById(elementId);
    if (!legend) return;

    legend.innerHTML = labels
      .map(
        (label, index) => `
      <div class="legend-item">
        <div class="legend-color" style="background-color: ${colors[index % colors.length]}"></div>
        <span>${label}: ${data[index]}</span>
      </div>
    `
      )
      .join("");
  }

  // -- STATUS CHART: REPORT STATUS OVERVIEW (unchanged) --
  function drawStatusChart() {
    const canvas = document.getElementById("statusChart");
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    const statusCounts = {
      pending: reports.filter((r) => r.status === "pending").length,
      inReview: reports.filter((r) => r.status === "in-review").length,
      completed: reports.filter((r) => r.status === "completed").length,
    };

    const colors = ["#F39C12", "#3498DB", "#2ECC71"];
    const labels = ["Pending", "In Review", "Completed"];
    const data = Object.values(statusCounts);

    drawDonutChart(ctx, data, colors);
    updateStatusBreakdown(labels, colors, data);
  }

  function drawDonutChart(ctx, data, colors) {
    const canvas = ctx.canvas;
    const width = canvas.width || 300;
    const height = canvas.height || 300;
    const centerX = width / 2;
    const centerY = height / 2;
    const outerRadius = Math.min(width, height) / 2.5;
    const innerRadius = outerRadius * 0.6;

    const total = data.reduce((sum, val) => sum + val, 0) || 1;
    let currentAngle = -Math.PI / 2;

    ctx.clearRect(0, 0, width, height);

    data.forEach((value, index) => {
      const sliceAngle = (value / total) * 2 * Math.PI;

      ctx.beginPath();
      ctx.arc(centerX, centerY, outerRadius, currentAngle, currentAngle + sliceAngle);
      ctx.arc(centerX, centerY, innerRadius, currentAngle + sliceAngle, currentAngle, true);
      ctx.closePath();
      ctx.fillStyle = colors[index % colors.length];
      ctx.fill();

      currentAngle += sliceAngle;
    });

    ctx.beginPath();
    ctx.arc(centerX, centerY, innerRadius, 0, 2 * Math.PI);
    ctx.fillStyle = "#FFFFFF";
    ctx.fill();

    ctx.fillStyle = "#333";
    ctx.font = "bold 24px Poppins, sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(total, centerX, centerY);
  }

  function updateStatusBreakdown(labels, colors, data) {
    const breakdown = document.getElementById("statusBreakdown");
    if (!breakdown) return;

    const total = data.reduce((sum, val) => sum + val, 0) || 1;

    breakdown.innerHTML = labels
      .map((label, index) => {
        const percentage = Math.round((data[index] / total) * 100);
        return `
        <div class="status-bar">
          <span class="status-label">${label}</span>
          <div class="status-progress">
            <div class="status-fill" style="width: ${percentage}%; background-color: ${colors[index % colors.length]}"></div>
          </div>
          <span class="status-count">${data[index]}</span>
        </div>
      `;
      })
      .join("");
  }

  function updateActivityFeed() {
    if (!activityFeed) return;

    const activities = [
      { icon: "🔑", text: "Admin logged in", time: "Just now" },
      {
        icon: "➕",
        text: `Added organization "${organizations[0]?.name || "New Org"}"`,
        time: "2 hours ago",
      },
      { icon: "✏️", text: "Updated report status", time: "5 hours ago" },
      { icon: "✅", text: "Approved financial report", time: "Yesterday" },
      { icon: "📊", text: "Generated monthly report", time: "2 days ago" },
    ];

    activityFeed.innerHTML = activities
      .map(
        (activity) => `
      <div class="activity-item">
        <div class="activity-icon">${activity.icon}</div>
        <div class="activity-details">
          <p class="activity-text">${activity.text}</p>
          <p class="activity-time">${activity.time}</p>
        </div>
      </div>
    `
      )
      .join("");
  }

  function showToast(message, type = "success") {
    if (!toast) return;
    toast.textContent = message;
    toast.style.backgroundColor = type === "error" ? "#e74c3c" : "#2d8a47";
    toast.style.display = "block";

    setTimeout(() => {
      toast.style.display = "none";
    }, 3000);
  }

  // -- INITIAL LOAD for dynamic departments/orgs pie --
  loadDashboardDepartments().then(loadDashboardOrganizations);

  // -- Other Dashboard Data (summary/report/activity) --
  loadDashboardData();
  setInterval(loadDashboardData, 300000);
});
