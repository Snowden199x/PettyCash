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

  const addOrgHomepageBtn = document.getElementById("addOrgHomepageBtn");

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

  // Add Org button on homepage -> redirect to orgs with open_add=1
  if (addOrgHomepageBtn) {
    addOrgHomepageBtn.addEventListener("click", () => {
      window.location.href = "/osas/orgs?open_add=1";
    });
  }

  // --- Dashboard Data Load ---
  async function loadDashboardData() {
    try {
      // Show loaders IMMEDIATELY (better UX)
      showDeptLoading();
      showStatusLoading();

      // ✅ 1: Admin profile + COMBINED orgs+reports in PARALLEL
      const [adminRes, comboRes] = await Promise.all([
        loadAdminProfile(),
        fetch("/osas/api/organizations_with_reports")
          .then((r) => (r.ok ? r.json() : { organizations: [], reports: [] }))
          .catch((err) => {
            console.error("Org+reports fetch failed:", err);
            return { organizations: [], reports: [] };
          }),
      ]);

      // ✅ 2: Set organizations + reports
      organizations = comboRes.organizations || [];
      const rawReports = comboRes.reports || [];

      // ✅ 3: Attach orgName / department to each report
      reports = rawReports.map((rep) => {
        const org =
          organizations.find((o) => o.id === rep.organization_id) || {};
        return {
          ...rep,
          orgName: org.name,
          department: org.department,
        };
      });

      // ✅ 4: Start activity feed in parallel
      const activityPromise = updateActivityFeed();

      // ✅ 5: Update UI (same as before)
      hideDeptLoading();
      hideStatusLoading();
      updateSummaryCards();
      updateCharts();

      // ✅ 6: Wait for activity feed
      await activityPromise;
    } catch (err) {
      console.error("Error loading dashboard data:", err);
      hideDeptLoading();
      hideStatusLoading();
      showToast("Failed to load some dashboard data", "error");
    }
  }

  async function loadAdminProfile() {
    try {
      // Add 5-second timeout to prevent hanging
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 5000);

      const res = await fetch("/osas/api/admin/profile", {
        signal: controller.signal,
      });
      clearTimeout(timeout);

      if (!res.ok) throw new Error("Profile request failed");
      const data = await res.json();
      if (data.full_name && adminNameEl) {
        adminNameEl.textContent = data.full_name.split(" ")[0];
      }
    } catch (err) {
      console.warn("Admin profile load failed, using fallback:", err);
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
    // Skip if already loaded (prevent duplicate API call)
    if (organizations.length > 0) {
      showDeptLoading();
      hideDeptLoading();
      drawDepartmentChart();
      return;
    }

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
  let deptSlices = [];

  function drawDepartmentChart() {
    const canvas = document.getElementById("departmentChart");
    if (!canvas) return;
    const ctx = canvas.getContext("2d");

    let orgList = organizations;
    const selectedDept = departmentFilter ? departmentFilter.value : "";

    const deptNamesAll = departments.map((d) => d.name);
    const colorsAll = [
      "#471C6E",
      "#6E3402",
      "#DF196E",
      "#FBD004",
      "#000000ff",
      "#48469B",
      "#2F6519",
      "#FE8D00",
      "#6A0200",
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

    const width = canvas.width || 300;
    const height = canvas.height || 300;
    const centerX = width / 2;
    const centerY = height / 2;
    const radius = Math.min(width, height) / 2.1;

    ctx.clearRect(0, 0, width, height);
    deptSlices = [];

    if (total === 0) {
      drawEmptyPie(ctx);
      const legend = document.getElementById("deptLegend");
      if (legend) legend.innerHTML = "";
      return;
    }

    let currentAngle = -Math.PI / 2;

    deptCounts.forEach((value, index) => {
      const sliceAngle = (value / total) * 2 * Math.PI;
      const startAngle = currentAngle;
      const endAngle = currentAngle + sliceAngle;

      // draw slice
      ctx.beginPath();
      ctx.arc(centerX, centerY, radius, startAngle, endAngle);
      ctx.lineTo(centerX, centerY);
      ctx.fillStyle = colors[index % colors.length];
      ctx.fill();

      // store slice data for hover
      deptSlices.push({
        label: deptNames[index],
        value,
        startAngle,
        endAngle,
        centerX,
        centerY,
        radius,
      });

      currentAngle = endAngle;
    });

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
  "Completed": "completed",
};
    labels.forEach((label, index) => {
      const key = statusMap[label];
      if (!key) return;

      const count = data[index] ?? 0;
      const percentage = Math.round((count / total) * 100);

      // update count text
      const row = breakdown.querySelector(`.status-row[data-status="${key}"]`);
      if (!row) return;

      const countEl = row.querySelector(".status-count");
      if (countEl) countEl.textContent = count;

      // update bar width
      const fill = row.querySelector(`.status-bar-fill[data-status="${key}"]`);
      if (fill) {
        fill.style.width = `${percentage}%`;
      }
    });
  }

  // --- Activity Feed ---
  async function updateActivityFeed() {
    if (!activityFeed) {
      return Promise.resolve();
    }
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

  // helper for notif time display
  function formatNotifTime(iso) {
    return new Date(iso).toLocaleString("en-PH", {
      timeZone: "Asia/Manila",
      year: "numeric",
      month: "numeric",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
      second: "2-digit",
    });
  }

  // --- Load notifications from OSAS API ---
  // Track notification IDs in localStorage to persist across page navigations
  let previousNotifIds = new Set();

  // Load from localStorage on startup
  function loadPreviousNotifIds() {
    try {
      const stored = localStorage.getItem("osasNotificationIds");
      if (stored) {
        previousNotifIds = new Set(JSON.parse(stored));
      }
    } catch (err) {
      console.log("Could not load notification IDs from storage", err);
    }
  }

  // Save to localStorage when updated
  function savePreviousNotifIds() {
    try {
      localStorage.setItem(
        "osasNotificationIds",
        JSON.stringify(Array.from(previousNotifIds))
      );
    } catch (err) {
      console.log("Could not save notification IDs to storage", err);
    }
  }

  loadPreviousNotifIds();

  // Play notification sound
  function playNotificationSound() {
    try {
      // Create a simple beep sound using Web Audio API
      const audioContext = new (window.AudioContext ||
        window.webkitAudioContext)();
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);

      oscillator.frequency.value = 800; // Frequency in Hz
      oscillator.type = "sine";

      gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(
        0.01,
        audioContext.currentTime + 0.1
      );

      oscillator.start(audioContext.currentTime);
      oscillator.stop(audioContext.currentTime + 0.1);
    } catch (err) {
      console.log("Notification sound not available:", err);
    }
  }

  async function loadNotifications() {
    if (!notifList) return;

    try {
      const res = await fetch(`${API_BASE}/admin/notifications`);
      if (!res.ok) throw new Error("Failed to load notifications");
      const data = await res.json();
      const items = data.notifications || [];
      const hasUnread = data.has_unread;

      /// Count unread FIRST
      // Count unread FIRST
      const unreadCount = items.filter((n) => !n.is_read).length;

      // 🔔 PLAY SOUND ONLY if a NEW notification arrived (not just count change)
      const currentNotifIds = new Set(items.map((n) => n.id));
      const hasNewNotif = Array.from(currentNotifIds).some(
        (id) => !previousNotifIds.has(id)
      );
      if (hasNewNotif && unreadCount > 0) {
        playNotificationSound();
      }
      previousNotifIds = currentNotifIds;
      savePreviousNotifIds();

      // Update count badge on bell
      if (notifBtn) {
        const countBadge = notifBtn.querySelector(".notif-count");
        if (countBadge) {
          countBadge.textContent = unreadCount;
          countBadge.style.display = unreadCount > 0 ? "inline-flex" : "none";
        }
      }

      if (!items.length) {
        notifList.innerHTML = '<p class="notif-empty">Nothing here yet</p>';
        return;
      }

      // ✅ Build notification header with "Mark all as Read" button
      // ✅ Build notification items WITHOUT duplicate header (header is in HTML already)
      // Notifications header is already in homepage.html, don't add it again
      const itemsHtml = items
        .map(
          (n) => `
    <div class="notif-item ${n.is_read ? "read" : "unread"}"
        data-id="${n.id}"
        data-org-id="${n.org_id}"
        data-report-id="${n.report_id}">
      ${!n.is_read ? '<div class="notif-unread-indicator"></div>' : ""}
      <div class="notif-item-content">
        <div class="notif-item-icon">📄</div>
        <div class="notif-item-text">
          <div class="notif-item-title">${n.org_name}</div>
          <div class="notif-item-message">${n.message}</div>
          <div class="notif-item-time">${formatNotifTime(n.created_at)}</div>
        </div>
      </div>
    </div>
  `
        )
        .join("");

      // Set items ONLY (header is already in HTML)
      notifList.innerHTML = itemsHtml;

      // Update bell badge with unread count
      if (notifBtn) {
        const countBadge = notifBtn.querySelector(".notif-count");
        if (countBadge) {
          countBadge.textContent = unreadCount;
          countBadge.style.display = unreadCount > 0 ? "inline-flex" : "none";
        }
      }

      // Add event listener for "Mark all as Read" button
      // Add event listener for "Mark all as Read" button (use the header button, not from notifList)
      const markAllBtn = document.getElementById("markAllReadBtn");
      if (markAllBtn) {
        // Remove old listeners by cloning
        const newMarkAllBtn = markAllBtn.cloneNode(true);
        markAllBtn.parentNode.replaceChild(newMarkAllBtn, markAllBtn);

        // Add fresh listener
        newMarkAllBtn.addEventListener("click", async (e) => {
          e.stopPropagation();

          // Mark all unread as read
          for (const item of items.filter((n) => !n.is_read)) {
            try {
              await fetch(`${API_BASE}/admin/notifications/${item.id}/read`, {
                method: "POST",
              });
            } catch (err) {
              console.error("Failed to mark notification read", err);
            }
          }

          // Update state
          previousNotifIds.clear();
          savePreviousNotifIds();
          if (notifDot) notifDot.style.display = "none";
          loadNotifications();
        });
      }

      // Attach click handlers to notification items
      notifList.querySelectorAll(".notif-item").forEach((el) => {
        el.addEventListener("click", async () => {
          const notifId = el.dataset.id;
          const orgId = el.dataset.orgId;
          const reportId = el.dataset.reportId;

          // Visually mark as read
          el.classList.remove("unread");
          el.classList.add("read");

          // Mark read in backend
          try {
            await fetch(`${API_BASE}/admin/notifications/${notifId}/read`, {
              method: "POST",
            });
          } catch (e) {
            console.error("Failed to mark notification read", e);
          }

          // Check if all read
          const stillUnread = notifList.querySelector(".notif-item.unread");
          if (!stillUnread && notifDot) {
            notifDot.style.display = "none";
            previousNotifCount = 0;
          }

          // Navigate to reports
          const url = `/osas/reports?org_id=${encodeURIComponent(
            orgId
          )}&report_id=${encodeURIComponent(reportId)}`;
          window.location.href = url;
        });
      });
    } catch (err) {
      notifList.innerHTML =
        '<p class="notif-empty">There\'s nothing here yet</p>';
      if (notifDot) notifDot.style.display = "none";
    }
  }

    const deptCanvas = document.getElementById("departmentChart");
    const deptTooltip = document.getElementById("deptTooltip");


    if (deptCanvas && deptTooltip) {
      deptCanvas.addEventListener("mousemove", (e) => {
        const rect = deptCanvas.getBoundingClientRect();
        
        // ✅ Scale mouse coordinates to canvas internal dimensions
        const scaleX = deptCanvas.width / rect.width;
        const scaleY = deptCanvas.height / rect.height;
        const x = (e.clientX - rect.left) * scaleX;
        const y = (e.clientY - rect.top) * scaleY;


        let found = null;


        for (const slice of deptSlices) {
          const dx = x - slice.centerX;
          const dy = y - slice.centerY;
          const dist = Math.sqrt(dx * dx + dy * dy);


          if (dist > slice.radius) continue;


          let angle = Math.atan2(dy, dx);
          if (angle < -Math.PI / 2) angle += 2 * Math.PI;


          if (angle >= slice.startAngle && angle <= slice.endAngle) {
            found = slice;
            break;
          }
        }


        if (found) {
          deptTooltip.style.display = "block";
          deptTooltip.textContent = `${found.label}: ${found.value}`;
          // position relative to card
          deptTooltip.style.left = `${e.clientX - rect.left}px`;
          deptTooltip.style.top = `${e.clientY - rect.top}px`;
        } else {
          deptTooltip.style.display = "none";
        }
      });


      deptCanvas.addEventListener("mouseleave", () => {
        deptTooltip.style.display = "none";
      });
    }

  
  // INITIAL LOAD
  loadDashboardDepartments().then(loadDashboardOrganizations);
  loadDashboardData();
  loadNotifications();

  // Smart polling: only when window focused, increased intervals
  let notifPollInterval = null;
  let dashPollInterval = null;

  function startPolling() {
    if (!notifPollInterval) {
      notifPollInterval = setInterval(loadNotifications, 5000); // 30 seconds
      loadNotifications();
    }
    if (!dashPollInterval) {
      dashPollInterval = setInterval(loadDashboardData, 600000); // 10 minutes
    }
  }

  function stopPolling() {
    if (notifPollInterval) {
      clearInterval(notifPollInterval);
      notifPollInterval = null;
    }
    if (dashPollInterval) {
      clearInterval(dashPollInterval);
      dashPollInterval = null;
    }
  }
const flash = document.querySelector(".flash-container");
  if (flash) {
    setTimeout(() => {
      flash.style.opacity = "0";
      flash.style.transition = "opacity 0.3s ease";
      setTimeout(() => flash.remove(), 300);
    }, 3000);
  }
  // Start polling on window focus, stop on blur
  window.addEventListener("focus", startPolling);
  window.addEventListener("blur", stopPolling);
  startPolling(); // Start immediately
});
