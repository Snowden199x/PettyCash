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
  const addOrgHomepageBtn = document.getElementById("addOrgHomepageBtn");

  if (addOrgHomepageBtn) {
    addOrgHomepageBtn.addEventListener("click", () => {
      window.location.href = "/osas/orgs?open_add=1";
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

      // Fetch all real reports, one call per org
      reports = [];
      for (let org of organizations) {
        const res = await fetch(
          `/osas/api/organizations/${org.id}/financial_reports`
        );
        if (res.ok) {
          const data = await res.json();
          if (data.reports && Array.isArray(data.reports)) {
            data.reports.forEach((report) => {
              // Attach org info for display
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
  if (departmentFilter) {
    departmentFilter.addEventListener("change", drawDepartmentChart);
  }

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

  // ** STATUS HANDLING (UNIFIED) **
  const STATUS_VALUES = ["Pending Review", "In Review", "Completed"];
  function normalizeStatus(status) {
    if (!status) return "";
    const normalized = status.toLowerCase().replace(/[\s\-]/g, "");
    if (normalized === "pendingreview") return "Pending Review";
    if (normalized === "inreview") return "In Review";
    if (normalized === "completed") return "Completed";
    return status;
  }

  // Kept for reference; hindi na ginagamit for real data
  function generateReportsFromOrgs(orgs) {
    return orgs.map((org) => ({
      id: org.id,
      orgId: org.id,
      orgName: org.name,
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

  // ** CARD COUNTS **
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
    const selectedDept = departmentFilter ? departmentFilter.value : "";

    const deptNamesAll = departments.map((d) => d.name);
    const colorsAll = [
      "#3f2166ff",
      "#66b8eeff",
      "#f083d5ff",
      "#ddd258ff",
      "#5e5e5eff",
      "#12376aff",
      "#226c15ff",
      "#d98d14ff",
      "#a22d1fff",
      "#534a6eff",
      "#0097e6",
      "#b2bec3",
    ];

    let deptNames;
    let deptCounts;
    let colors;

    if (selectedDept) {
      orgList = orgList.filter((org) => org.department === selectedDept);
      const idx = deptNamesAll.indexOf(selectedDept);
      const colorForDept = colorsAll[idx >= 0 ? idx % colorsAll.length : 0];

      deptNames = [selectedDept];
      deptCounts = [orgList.length];
      colors = [colorForDept];
    } else {
      deptNames = deptNamesAll;
      deptCounts = deptNames.map(
        (name) => orgList.filter((org) => org.department === name).length
      );
      colors = colorsAll;
    }

    const total = deptCounts.reduce((s, v) => s + v, 0);

    if (total === 0) {
      drawEmptyPie(ctx);
      if (selectedDept) {
        updateLegend("deptLegend", [selectedDept], [colorsAll[0]], [0]);
      } else {
        const legend = document.getElementById("deptLegend");
        if (legend) legend.innerHTML = "";
      }
      return;
    }

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

  function drawEmptyPie(ctx) {
    const canvas = ctx.canvas;
    const width = canvas.width || 300;
    const height = canvas.height || 300;
    const centerX = width / 2;
    const centerY = height / 2;
    const radius = Math.min(width, height) / 2.5;

    ctx.clearRect(0, 0, width, height);
    ctx.beginPath();
    ctx.arc(centerX, centerY, radius, 0, 2 * Math.PI);
    ctx.fillStyle = "#ffffff";
    ctx.fill();
    ctx.strokeStyle = "#e0e0e0";
    ctx.lineWidth = 2;
    ctx.stroke();
  }

  // -- STATUS CHART (DONUT) --
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

    const total = data.reduce((sum, val) => sum + val, 0);
    const safeTotal = total === 0 ? 0 : total;
    const denom = total === 0 ? 1 : total;

    let currentAngle = -Math.PI / 2;
    ctx.clearRect(0, 0, width, height);

    if (total === 0) {
      ctx.beginPath();
      ctx.arc(centerX, centerY, outerRadius, 0, 2 * Math.PI);
      ctx.arc(centerX, centerY, innerRadius, 2 * Math.PI, 0, true);
      ctx.closePath();
      ctx.fillStyle = "#f4f4f4";
      ctx.fill();
    } else {
      data.forEach((value, index) => {
        const sliceAngle = (value / denom) * 2 * Math.PI;
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
    }

    // inner white circle
    ctx.beginPath();
    ctx.arc(centerX, centerY, innerRadius, 0, 2 * Math.PI);
    ctx.fillStyle = "#FFFFFF";
    ctx.fill();

    // center text (total reports)
    ctx.fillStyle = "#333";
    ctx.font = "bold 24px Poppins, sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(String(safeTotal), centerX, centerY);
  }

  // Status breakdown: update existing cards only
  function updateStatusBreakdown(labels, colors, data) {
    const breakdown = document.getElementById("statusBreakdown");
    if (!breakdown) return;

    const total = data.reduce((sum, val) => sum + val, 0) || 1;

    const statusMap = {
      "Pending Review": "pending",
      "In Review": "review",
      Completed: "completed",
    };

    labels.forEach((label, index) => {
      const key = statusMap[label];
      if (!key) return;

      const item = breakdown.querySelector(`[data-status="${key}"]`);
      if (!item) return;

      const count = data[index] ?? 0;
      const percentage = Math.round((count / total) * 100);

      const countEl = item.querySelector(".status-count");
      if (countEl) countEl.textContent = count;

      const percentEl = item.querySelector(".status-percent");
      if (percentEl) percentEl.textContent = `${percentage}%`;
    });
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

  const API_BASE = "/osas/api";

  // NOTIFICATION ELEMENTS
  const notifBtn = document.getElementById("notifBtn");
  const notifMenu = document.getElementById("notifMenu");
  const notifList = document.getElementById("notifList");
  const notifDot = document.getElementById("notifDot");

  // --- Notification toggle (clickable bell) ---
  if (notifBtn && notifMenu) {
    notifBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      notifMenu.style.display =
        notifMenu.style.display === "block" ? "none" : "block";
    });

    window.addEventListener("click", (e) => {
      if (!notifMenu.contains(e.target) && e.target !== notifBtn) {
        notifMenu.style.display = "none";
      }
    });
  }

  // --- Load notifications from OSAS API ---
  async function loadNotifications() {
    if (!notifList) return;

    try {
      const res = await fetch(`${API_BASE}/admin/notifications`);
      if (!res.ok) throw new Error("Failed to load notifications");
      const data = await res.json();
      const items = data.notifications || [];
      const hasUnread = data.has_unread;

      // toggle red dot
      if (notifDot) notifDot.style.display = hasUnread ? "block" : "none";

      if (!items.length) {
        notifList.innerHTML = '<p class="notif-empty">Nothing here yet</p>';
        return;
      }

      notifList.innerHTML = items
        .map(
          (n) => `
        <div class="notif-item" data-org-id="${n.org_id}" data-report-id="${
            n.report_id
          }">
          <p class="notif-text"><strong>${n.org_name}</strong> ${n.message}</p>
          <p class="notif-time">${new Date(n.created_at).toLocaleString()}</p>
        </div>`
        )
        .join("");
      // click → punta sa Reports page, open yung org
      notifList.querySelectorAll(".notif-item").forEach((el) => {
        el.addEventListener("click", () => {
          const orgId = el.dataset.orgId;
          const reportId = el.dataset.reportId;

          // hide red dot once user opens a notification
          if (notifDot) notifDot.style.display = "none";

          const url = `/osas/reports?org_id=${encodeURIComponent(
            orgId
          )}&report_id=${encodeURIComponent(reportId)}`;
          window.location.href = url;
        });
      });
    } catch (err) {
      notifList.innerHTML =
        '<p class="notif-empty">There`s nothing here yet</p>';
      if (notifDot) notifDot.style.display = "none";
    }
  }
  // INITIAL LOAD
  loadDashboardDepartments().then(loadDashboardOrganizations);
  loadDashboardData();
  loadNotifications();
  setInterval(loadNotifications, 60000);
  setInterval(loadDashboardData, 300000);
});
