document.addEventListener("DOMContentLoaded", () => {
  const profileBtn = document.getElementById("profileBtn");
  const profileMenu = document.getElementById("profileMenu");
  const globalSearch = document.getElementById("globalSearch");
  const adminNameEl = document.getElementById("adminName");

  const totalOrgs = document.getElementById("totalOrgs");
  const pendingReports = document.getElementById("pendingReports");
  const approvedReports = document.getElementById("approvedReports");
  const inReviewReports = document.getElementById("inReviewReports");

  const departmentFilter = document.getElementById("dashboardDeptFilter");
  const activityFeed = document.getElementById("activityFeed");
  const toast = document.getElementById("toast");

  let organizations = [];
  let departments = [];
  let reports = [];

  function showDeptLoading() {
  const loader = document.getElementById("deptLoading");
  const chart = document.getElementById("departmentChart");
  const legend = document.getElementById("deptLegend");
  if (loader) loader.style.display = "flex";
  if (chart) chart.style.display = "none";
  if (legend) legend.style.display = "none";
}
function hideDeptLoading() {
  const loader = document.getElementById("deptLoading");
  const chart = document.getElementById("departmentChart");
  const legend = document.getElementById("deptLegend");
  if (loader) loader.style.display = "none";
  if (chart) chart.style.display = "";
  if (legend) legend.style.display = "";
}
function showStatusLoading() {
  const loader = document.getElementById("statusLoading");
  const chart = document.getElementById("statusChart");
  const breakdown = document.getElementById("statusBreakdown");
  if (loader) loader.style.display = "flex";
  if (chart) chart.style.display = "none";
  if (breakdown) breakdown.style.display = "none";
}
function hideStatusLoading() {
  const loader = document.getElementById("statusLoading");
  const chart = document.getElementById("statusChart");
  const breakdown = document.getElementById("statusBreakdown");
  if (loader) loader.style.display = "none";
  if (chart) chart.style.display = "";
  if (breakdown) breakdown.style.display = "";
}


  // --- Profile menu logic ---
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

  // --- Global Search ---
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
          window.location.href = `/osas/orgs?search=${encodeURIComponent(
            searchTerm
          )}`;
        }
      }
    });
  }

  // --- Dashboard Data Load ---
  async function loadDashboardData() {
    try {
      await loadAdminProfile();
      const orgRes = await fetch("/osas/api/organizations");
      if (!orgRes.ok) throw new Error("Failed to load organizations");
      const orgData = await orgRes.json();
      organizations = orgData.organizations || [];

      showStatusLoading();

      // Fetch all real reports (replace random generation)
      reports = [];
      for (let org of organizations) {
        const res = await fetch(
          `/osas/api/organizations/${org.id}/financial_reports`
        );
        if (res.ok) {
          const data = await res.json();
          if (data.reports && Array.isArray(data.reports)) {
            // Add orgName/department for display
            data.reports.forEach((report) => {
              report.orgName = org.name;
              report.department = org.department;
            });
            reports = reports.concat(data.reports);
          }
        }
      }
      hideStatusLoading();
      updateSummaryCards();
      updateCharts();
      updateActivityFeed();
    } catch (err) {
      console.error("Error loading dashboard data:", err);
      hideStatusLoading();
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

  // --- Department Filter ---
  async function loadDashboardDepartments() {
    try {
      const res = await fetch("/osas/api/departments");
      const data = await res.json();
      departments = data.departments || [];
      departmentFilter.innerHTML = '<option value="">All Departments</option>';
      departments.forEach((dep) => {
        departmentFilter.innerHTML += `<option value="${dep.name}">${dep.name}</option>`;
      });
    } catch {
      departmentFilter.innerHTML = '<option value="">All Departments</option>';
    }
  }
  departmentFilter.addEventListener("change", drawDepartmentChart);

  async function loadDashboardOrganizations() {
    showDeptLoading();
    try {
      const res = await fetch("/osas/api/organizations");
      const data = await res.json();
      organizations = data.organizations || [];
      hideDeptLoading();
      drawDepartmentChart();
    } catch {
      organizations = [];
      hideDeptLoading();
      drawDepartmentChart();
    }
  }

  // ** FIXED: STATUS HANDLING **
  const STATUS_VALUES = ["Pending Review", "In Review", "Completed"];
  function normalizeStatus(status) {
    if (!status) return "";
    status = status.toLowerCase().replace(/[\s\-]/g, "");
    if (status === "pendingreview") return "Pending Review";
    if (status === "inreview") return "In Review";
    if (status === "completed") return "Completed";
    return status;
  }

  function generateReportsFromOrgs(orgs) {
    return orgs.map((org) => ({
      id: org.id,
      orgId: org.id,
      orgName: org.name,
      // Random valid status, exact DB allowed!
      status: STATUS_VALUES[Math.floor(Math.random() * STATUS_VALUES.length)],
      submissionDate: new Date(
        Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000
      ).toISOString(),
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

  // ** CARD COUNTS (EXACT MATCH) **
  function updateSummaryCards() {
    if (totalOrgs) totalOrgs.textContent = organizations.length;
    const pending = reports.filter(
      (r) => normalizeStatus(r.status) === "Pending Review"
    ).length;
    const approved = reports.filter(
      (r) => normalizeStatus(r.status) === "Completed"
    ).length;
    const inReview = reports.filter(
      (r) => normalizeStatus(r.status) === "In Review"
    ).length;
    if (pendingReports) pendingReports.textContent = pending;
    if (approvedReports) approvedReports.textContent = approved;
    if (inReviewReports) inReviewReports.textContent = inReview;
  }

  // ** UPDATED CHART LOGIC **
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
      orgList = orgList.filter((org) => org.department === selectedDept);
    }

    let deptNames = departments.map((d) => d.name);
    let deptCounts = deptNames.map(
      (name) => orgList.filter((org) => org.department === name).length
    );
    if (selectedDept) {
      deptNames = [selectedDept];
      deptCounts = [orgList.length];
    }

    const colors = [
      "#8B3B08",
      "#E59E2C",
      "#3498DB",
      "#2ECC71",
      "#A569BD",
      "#2f3640",
      "#FF7675",
      "#00b894",
      "#fdcb6e",
      "#636e72",
      "#0097e6",
      "#b2bec3",
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
      ctx.arc(
        centerX,
        centerY,
        radius,
        currentAngle,
        currentAngle + sliceAngle
      );
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
          <div class="legend-color" style="background-color: ${
            colors[index % colors.length]
          }"></div>
          <span>${label}: ${data[index]}</span>
        </div>
      `
      )
      .join("");
  }

  // -- STATUS CHART --
  function drawStatusChart() {
    const canvas = document.getElementById("statusChart");
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    const statusCounts = {
      pending: reports.filter(
        (r) => normalizeStatus(r.status) === "Pending Review"
      ).length,
      inReview: reports.filter((r) => normalizeStatus(r.status) === "In Review")
        .length,
      completed: reports.filter(
        (r) => normalizeStatus(r.status) === "Completed"
      ).length,
    };
    const colors = ["#F39C12", "#3498DB", "#2ECC71"];
    const labels = ["Pending Review", "In Review", "Completed"];
    const data = [
      statusCounts.pending,
      statusCounts.inReview,
      statusCounts.completed,
    ];
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
      ctx.arc(
        centerX,
        centerY,
        outerRadius,
        currentAngle,
        currentAngle + sliceAngle
      );
      ctx.arc(
        centerX,
        centerY,
        innerRadius,
        currentAngle + sliceAngle,
        currentAngle,
        true
      );
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
        <div class="status-row">
          <span class="status-label">${label}</span>
          <div class="status-bar-horizontal">
            <div class="status-fill" style="width: ${percentage}%; background: ${colors[index % colors.length]}"></div>
          </div>
          <span class="status-count">${data[index]}</span>
        </div>
      `;
    })
    .join("");
}


  // --- Activity Feed ---
  async function updateActivityFeed() {
    if (!activityFeed) return;
    try {
      const res = await fetch("/osas/api/admin/activity");
      const data = await res.json();

      function getIcon(type) {
        switch (type) {
          case "login":
            return "🔑";
          case "logout":
            return "🔒";
          case "organization":
            return "➕";
          case "security":
            return "🛡️";
          case "settings":
            return "⚙️";
          case "report":
            return "📄";
          default:
            return "📢";
        }
      }
      function formatTime(iso) {
        const date = new Date(iso);
        return date.toLocaleString("en-US", {
          month: "short",
          day: "numeric",
          hour: "2-digit",
          minute: "2-digit",
        });
      }

      activityFeed.innerHTML =
        Array.isArray(data) && data.length > 0
          ? data
              .slice(0, 10)
              .map(
                (activity) =>
                  `<div class="activity-item">
          <div class="activity-icon">${getIcon(activity.action_type)}</div>
          <div class="activity-details">
            <p class="activity-text">${
              activity.description || activity.action_type
            }</p>
            <p class="activity-time">${formatTime(activity.created_at)}</p>
          </div>
        </div>`
              )
              .join("")
          : '<div class="activity-item"><div class="activity-details">No recent activity.</div></div>';
    } catch (err) {
      activityFeed.innerHTML =
        '<div class="activity-item"><div class="activity-details">Error loading activities.</div></div>';
    }
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

  // INITIAL LOAD
  loadDashboardDepartments().then(loadDashboardOrganizations);
  loadDashboardData();
  setInterval(loadDashboardData, 300000);
});
