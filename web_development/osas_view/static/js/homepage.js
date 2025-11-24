document.addEventListener("DOMContentLoaded", () => {
  const profileBtn = document.getElementById("profileBtn");
  const profileMenu = document.getElementById("profileMenu");
  const globalSearch = document.getElementById("globalSearch");
  const adminNameEl = document.getElementById("adminName");

  const totalOrgs = document.getElementById("totalOrgs");
  const pendingReports = document.getElementById("pendingReports");
  const approvedReports = document.getElementById("approvedReports");
  const inReviewReports = document.getElementById("inReviewReports");

  const avgProcessTime = document.getElementById("avgProcessTime");
  const submissionRate = document.getElementById("submissionRate");
  const overdueCount = document.getElementById("overdueCount");
  const complianceRate = document.getElementById("complianceRate");

  const activityFeed = document.getElementById("activityFeed");
  const topOrgsList = document.getElementById("topOrgsList");

  const toast = document.getElementById("toast");

  let organizations = [];
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
          window.location.href = `/osas/orgs?search=${encodeURIComponent(
            searchTerm
          )}`;
        }
      }
    });
  }

  async function loadDashboardData() {
    try {
      await loadAdminProfile();

      const orgRes = await fetch("/osas/api/organizations");
      if (!orgRes.ok) {
        throw new Error("Failed to load organizations");
      }
      const orgData = await orgRes.json();
      organizations = orgData.organizations || [];

      reports = generateReportsFromOrgs(organizations);

      updateSummaryCards();
      updateQuickStats();
      updateCharts();
      updateActivityFeed();
      updateTopOrganizations();
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

  function generateReportsFromOrgs(orgs) {
    const statuses = ["pending", "in-review", "completed"];
    return orgs.map((org) => ({
      id: org.id,
      orgId: org.id,
      orgName: org.name,
      status: statuses[Math.floor(Math.random() * statuses.length)],
      submissionDate: new Date(
        Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000
      ).toISOString(),
      department: assignDepartment(org.name),
      checklist: generateChecklist(),
      completionRate: Math.floor(Math.random() * 100),
    }));
  }

  function assignDepartment(orgName) {
    const name = (orgName || "").toLowerCase();
    if (name.includes("council") || name.includes("academic")) return "academic";
    if (name.includes("dance") || name.includes("music") || name.includes("art"))
      return "cultural";
    if (name.includes("sport") || name.includes("athletic")) return "sports";
    if (name.includes("community") || name.includes("service")) return "community";
    return "academic";
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

  function updateQuickStats() {
    const orgCount = organizations.length || 1;

    const avgTime = Math.floor(Math.random() * 5 + 3);
    if (avgProcessTime) avgProcessTime.textContent = `${avgTime} days`;

    const rate = Math.floor((reports.length / orgCount) * 100);
    if (submissionRate) submissionRate.textContent = `${rate}%`;

    const overdue = Math.floor(
      reports.filter((r) => r.status === "pending").length * 0.3
    );
    if (overdueCount) overdueCount.textContent = overdue;

    const compliance = Math.floor(Math.random() * 20 + 80);
    if (complianceRate) complianceRate.textContent = `${compliance}%`;
  }

  function updateCharts() {
    drawDepartmentChart();
    drawStatusChart();
    drawTrendChart();
  }

  function drawDepartmentChart() {
    const canvas = document.getElementById("departmentChart");
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    const deptCounts = {
      academic: reports.filter((r) => r.department === "academic").length,
      cultural: reports.filter((r) => r.department === "cultural").length,
      sports: reports.filter((r) => r.department === "sports").length,
      community: reports.filter((r) => r.department === "community").length,
    };

    const colors = ["#8B3B08", "#E59E2C", "#3498DB", "#2ECC71"];
    const labels = ["Academic", "Cultural", "Sports", "Community"];
    const data = Object.values(deptCounts);

    drawPieChart(ctx, data, colors);
    updateLegend("deptLegend", labels, colors, data);
  }

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

  function drawTrendChart() {
    const canvas = document.getElementById("trendChart");
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    const months = ["Jun", "Jul", "Aug", "Sep", "Oct", "Nov"];
    const data = [45, 52, 48, 61, 58, 65];
    drawLineChart(ctx, months, data);
  }

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
      ctx.fillStyle = colors[index];
      ctx.fill();

      currentAngle += sliceAngle;
    });
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
      ctx.fillStyle = colors[index];
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

  function drawLineChart(ctx, labels, data) {
    const canvas = ctx.canvas;
    const width = canvas.width || 400;
    const height = canvas.height || 250;
    const padding = 40;
    const chartWidth = width - padding * 2;
    const chartHeight = height - padding * 2;

    ctx.clearRect(0, 0, width, height);

    const maxValue = Math.max(...data);
    const minValue = Math.min(...data);
    const range = maxValue - minValue || 1;

    const xStep = chartWidth / (data.length - 1 || 1);

    ctx.strokeStyle = "#E0E0E0";
    ctx.lineWidth = 1;
    for (let i = 0; i <= 4; i++) {
      const y = padding + (chartHeight / 4) * i;
      ctx.beginPath();
      ctx.moveTo(padding, y);
      ctx.lineTo(width - padding, y);
      ctx.stroke();
    }

    ctx.strokeStyle = "#8B3B08";
    ctx.lineWidth = 3;
    ctx.beginPath();

    data.forEach((value, index) => {
      const x = padding + index * xStep;
      const y =
        padding + chartHeight - ((value - minValue) / range) * chartHeight;

      if (index === 0) {
        ctx.moveTo(x, y);
      } else {
        ctx.lineTo(x, y);
      }
    });

    ctx.stroke();

    data.forEach((value, index) => {
      const x = padding + index * xStep;
      const y =
        padding + chartHeight - ((value - minValue) / range) * chartHeight;

      ctx.beginPath();
      ctx.arc(x, y, 5, 0, 2 * Math.PI);
      ctx.fillStyle = "#8B3B08";
      ctx.fill();
      ctx.strokeStyle = "#FFFFFF";
      ctx.lineWidth = 2;
      ctx.stroke();
    });

    ctx.fillStyle = "#828282";
    ctx.font = "12px Poppins, sans-serif";
    ctx.textAlign = "center";
    labels.forEach((label, index) => {
      const x = padding + index * xStep;
      ctx.fillText(label, x, height - 10);
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
          colors[index]
        }"></div>
        <span>${label}: ${data[index]}</span>
      </div>
    `
      )
      .join("");
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
            <div class="status-fill" style="width: ${percentage}%; background-color: ${colors[index]}"></div>
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
        text: `Added organization "${
          organizations[0]?.name || "New Org"
        }"`,
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

  function updateTopOrganizations() {
    if (!topOrgsList) return;

    const topOrgs = [...reports]
      .sort((a, b) => b.completionRate - a.completionRate)
      .slice(0, 5);

    const badges = ["gold", "silver", "bronze", "default", "default"];

    topOrgsList.innerHTML = topOrgs
      .map(
        (org, index) => `
      <div class="top-org-item">
        <div class="rank-badge ${badges[index]}">${index + 1}</div>
        <div class="org-info">
          <p class="org-name">${org.orgName}</p>
          <p class="org-stat">${org.completionRate}% completion</p>
        </div>
        <div class="org-score">${org.completionRate}</div>
      </div>
    `
      )
      .join("");
  }

  const tabBtns = document.querySelectorAll(".tab-btn");
  tabBtns.forEach((btn) => {
    btn.addEventListener("click", () => {
      tabBtns.forEach((b) => b.classList.remove("active"));
      btn.classList.add("active");
      drawTrendChart();
    });
  });

  function showToast(message, type = "success") {
    if (!toast) return;
    toast.textContent = message;
    toast.style.backgroundColor = type === "error" ? "#e74c3c" : "#2d8a47";
    toast.style.display = "block";

    setTimeout(() => {
      toast.style.display = "none";
    }, 3000);
  }

  loadDashboardData();
  setInterval(loadDashboardData, 300000);
});
