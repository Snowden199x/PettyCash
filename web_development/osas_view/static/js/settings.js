document.addEventListener("DOMContentLoaded", () => {
  // ===== NAVIGATION & TAB HANDLING =====
  const navItems = document.querySelectorAll(".settings-nav .nav-item");
  const settingsSections = document.querySelectorAll(".settings-content .settings-section");

  function activateTab(sectionId) {
    navItems.forEach((btn) => btn.classList.remove("active"));
    settingsSections.forEach((sec) => sec.classList.remove("active"));
    const navBtn = document.querySelector(`.settings-nav .nav-item[data-section="${sectionId}"]`);
    const section = document.getElementById(sectionId);
    if (navBtn) navBtn.classList.add("active");
    if (section) {
      section.classList.add("active");
    }
  }

  navItems.forEach((btn) => {
    btn.addEventListener("click", function () {
      const sectionId = btn.getAttribute("data-section");
      activateTab(sectionId);
    });
  });

  // ===== HASH ROUTING FOR ACTIVITY LOGS =====
  if (window.location.hash === "#activity") {
    activateTab("activity");
  }

  // ===== LOGO CLICK =====
  const logoLink = document.getElementById("logoLink");
  if (logoLink) {
    logoLink.addEventListener("click", () => {
      window.location.href = "/osas/dashboard";
    });
  }

  // ===== PROFILE FORM =====
  const profileForm = document.getElementById("profileForm");
  profileForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    const profileData = {
      full_name: document.getElementById("adminName").value,
      email: document.getElementById("adminEmail").value,
      username: document.getElementById("adminUsername").value,
    };
    try {
      const res = await fetch("/osas/api/admin/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(profileData),
      });
      const result = await res.json();
      if (!res.ok) {
        showToast(result.error || "Failed to update profile", "error");
        return;
      }
      showToast("Profile updated successfully!");
    } catch (err) {
      showToast("Error updating profile", "error");
    }
  });

  // ===== PASSWORD FORM =====
  const passwordForm = document.getElementById("passwordForm");
  passwordForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    const currentPassword = document.getElementById("currentPassword").value;
    const newPassword = document.getElementById("newPassword").value;
    const confirmPassword = document.getElementById("confirmPassword").value;
    if (newPassword !== confirmPassword) {
      showToast("New passwords do not match", "error");
      return;
    }
    if (newPassword.length < 8) {
      showToast("Password must be at least 8 characters", "error");
      return;
    }
    const passwordData = { currentPassword, newPassword };
    try {
      const res = await fetch("/osas/api/admin/password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(passwordData),
      });
      if (!res.ok) {
        const errRes = await res.json();
        showToast(errRes.error || "Error updating password", "error");
        return;
      }
      showToast("Password updated successfully!");
      passwordForm.reset();
    } catch (err) {
      showToast("Error updating password", "error");
    }
  });

  // ===== SESSION LOGOUT =====
  const logoutAllBtn = document.getElementById("logoutAllBtn");
  if (logoutAllBtn) {
    logoutAllBtn.addEventListener("click", () => {
      showConfirmModal("Log out of all other devices?", async () => {
        // Optional: Implement API call for session logout here!
        showToast("All other devices logged out!");
      });
    });
  }

  // ===== ACTIVITY LOGS REAL-TIME =====
  const activityDateFilter = document.getElementById("activityDateFilter");
  const activityTypeFilter = document.getElementById("activityTypeFilter");
  const activityList = document.getElementById("activityList");
  const loadMoreLogsBtn = document.getElementById("loadMoreLogs");

  async function loadActivityLogs() {
    if (!activityList) return;
    try {
      const params = new URLSearchParams();
      if (activityDateFilter && activityDateFilter.value)
        params.append("date", activityDateFilter.value);
      if (activityTypeFilter && activityTypeFilter.value && activityTypeFilter.value !== "all")
        params.append("type", activityTypeFilter.value);

      const res = await fetch(`/osas/api/admin/activity?${params.toString()}`);
      const data = await res.json();

      function getIcon(type) {
        switch (type) {
          case "login": return "🔑";
          case "logout": return "🔒";
          case "organization": return "➕";
          case "security": return "🛡️";
          case "settings": return "⚙️";
          case "report": return "📄";
          default: return "📢";
        }
      }
      function formatTime(iso) {
        const date = new Date(iso);
        if (isNaN(date)) return "--";
        return date.toLocaleString("en-US", {
          month: "short",
          day: "numeric",
          hour: "2-digit",
          minute: "2-digit",
        });
      }

      activityList.innerHTML =
        Array.isArray(data) && data.length > 0
          ? data
              .map(
                (activity) =>
                  `<div class="activity-item">
                    <div class="activity-icon">${getIcon(activity.action_type)}</div>
                    <div class="activity-details">
                      <p class="activity-text">${activity.description || activity.action_type || "No description"}</p>
                      <p class="activity-time">${formatTime(activity.created_at)}</p>
                    </div>
                  </div>`
              )
              .join("")
          : '<div class="activity-item"><div class="activity-details">No activity logs found.</div></div>';
    } catch (err) {
      activityList.innerHTML =
        '<div class="activity-item"><div class="activity-details">Error loading activities.</div></div>';
    }
  }

  // FILTER EVENTS
  if (activityDateFilter) activityDateFilter.addEventListener("change", loadActivityLogs);
  if (activityTypeFilter) activityTypeFilter.addEventListener("change", loadActivityLogs);

  // Load More Dummy (for future implementation)
  if (loadMoreLogsBtn) {
    loadMoreLogsBtn.addEventListener("click", () => {
      showToast("All logs loaded", "warning");
    });
  }

  // ===== MODAL HANDLING =====
  const confirmModal = document.getElementById("confirmModal");
  const closeConfirmModal = document.getElementById("closeConfirmModal");
  const cancelConfirmBtn = document.getElementById("cancelConfirmBtn");
  const proceedConfirmBtn = document.getElementById("proceedConfirmBtn");
  const confirmMessage = document.getElementById("confirmMessage");
  let confirmCallback = null;

  function showConfirmModal(message, callback) {
    confirmMessage.textContent = message;
    confirmCallback = callback;
    confirmModal.style.display = "flex";
  }
  function hideConfirmModal() {
    confirmModal.style.display = "none";
    confirmCallback = null;
  }
  closeConfirmModal.addEventListener("click", hideConfirmModal);
  cancelConfirmBtn.addEventListener("click", hideConfirmModal);
  proceedConfirmBtn.addEventListener("click", () => {
    if (confirmCallback) confirmCallback();
    hideConfirmModal();
  });
  window.addEventListener("click", (e) => {
    if (e.target === confirmModal) hideConfirmModal();
  });

  // ===== TOAST NOTIFICATIONS =====
  const toast = document.getElementById("toast");
  function showToast(message, type = "success") {
    toast.textContent = message;
    toast.className = "toast" + (type ? " " + type : "");
    toast.style.display = "block";
    setTimeout(() => {
      toast.style.display = "none";
    }, 3000);
  }

  // ===== LOAD ADMIN PROFILE =====
  async function loadAdminProfile() {
    try {
      const res = await fetch("/osas/api/admin/profile");
      const data = await res.json();
      if (!data.error) {
        document.getElementById("adminName").value = data.full_name || "";
        document.getElementById("adminEmail").value = data.email || "";
        document.getElementById("adminUsername").value = data.username || "";
      }
    } catch (err) { /* silent fail */ }
  }

  // ===== INITIAL LOAD =====
  async function initialLoad() {
    await loadAdminProfile();
    await loadActivityLogs();
  }
  initialLoad();
});