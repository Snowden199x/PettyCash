document.addEventListener("DOMContentLoaded", () => {
  // --- ELEMENTS ---
  const navItems = document.querySelectorAll(".nav-item");
  const settingsSections = document.querySelectorAll(".settings-section");

  // Forms
  const profileForm = document.getElementById("profileForm");
  const passwordForm = document.getElementById("passwordForm");
  const saveDisplayBtn = document.getElementById("saveDisplayBtn");
  const logoutAllBtn = document.getElementById("logoutAllBtn");
  const loadMoreLogsBtn = document.getElementById("loadMoreLogs");

  // Activity Filters
  const activityDateFilter = document.getElementById("activityDateFilter");
  const activityTypeFilter = document.getElementById("activityTypeFilter");
  const activityList = document.getElementById("activityList");

  // Theme Options
  const themeOptions = document.querySelectorAll(".theme-option");
  const fontSizeSelect = document.getElementById("fontSize");

  // Modals/Toasts
  const confirmModal = document.getElementById("confirmModal");
  const closeConfirmModal = document.getElementById("closeConfirmModal");
  const cancelConfirmBtn = document.getElementById("cancelConfirmBtn");
  const proceedConfirmBtn = document.getElementById("proceedConfirmBtn");
  const confirmMessage = document.getElementById("confirmMessage");
  const toast = document.getElementById("toast");


  // ========== LOAD ADMIN PROFILE ==========
  async function loadAdminProfile() {
    try {
      const res = await fetch("/osas/api/admin/profile");
      const data = await res.json();
      if (!data.error) {
        document.getElementById("adminName").value = data.full_name || "";
        document.getElementById("adminEmail").value = data.email || "";
        document.getElementById("adminUsername").value = data.username || "";
      }
    } catch (err) {}
  }

  // ========== PROFILE FORM SUBMISSION ==========
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

  // ========== PASSWORD FORM SUBMISSION ==========
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

  // ========== LOGOUT ALL DEVICES (if endpoint available) ==========
  /*
  logoutAllBtn.addEventListener("click", () => {
    showConfirmModal(
      "Are you sure you want to log out all other devices? You will remain logged in on this device.",
      async () => {
        try {
          const res = await fetch("/osas/api/admin/logout-all", {
            method: "POST"
          });
          if (!res.ok) throw new Error("Failed to logout devices");
          showToast("All other devices logged out successfully!");
        } catch (err) {
          showToast("Session management updated", "warning");
        }
      }
    );
  });
  */
  // Remove or uncomment above if you add backend for session/logout-all.

  // ========== ACTIVITY LOGS ==========
  async function loadActivityLogs() {
    try {
      const params = new URLSearchParams();
      if (activityDateFilter.value)
        params.append("date", activityDateFilter.value);
      if (activityTypeFilter.value && activityTypeFilter.value !== "all")
        params.append("type", activityTypeFilter.value);
      const res = await fetch(`/osas/api/admin/activity?${params.toString()}`);
      const logs = await res.json();
      activityLogs = logs || [];
      renderActivityLogs();
    } catch (err) {
      activityLogs = [];
      renderActivityLogs();
    }
  }

  function renderActivityLogs(filteredLogs = null) {
    const logsToRender = filteredLogs || activityLogs;
    activityList.innerHTML = "";
    if (logsToRender.length === 0) {
      activityList.innerHTML =
        '<p style="text-align: center; color: #828282; padding: 40px;">No activity logs found</p>';
      return;
    }
    logsToRender.forEach((log) => {
      const icon = getActivityIcon(log.action_type || log.type);
      const desc = log.description || log.action;
      const time = log.created_at || log.date; // backend vs default
      const item = document.createElement("div");
      item.className = "activity-item";
      item.innerHTML = `
        <div class="activity-icon">${icon}</div>
        <div class="activity-details">
          <p class="activity-action">${desc}</p>
          <p class="activity-date">${formatActivityDate(time)}</p>
        </div>
      `;
      activityList.appendChild(item);
    });
  }

  function formatActivityDate(dateString) {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now - date;
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    if (diffHours < 1) return "Just now";
    if (diffHours < 24)
      return `Today at ${date.toLocaleTimeString("en-US", {
        hour: "numeric",
        minute: "2-digit",
      })}`;
    if (diffDays === 1)
      return `Yesterday at ${date.toLocaleTimeString("en-US", {
        hour: "numeric",
        minute: "2-digit",
      })}`;
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "numeric",
      minute: "2-digit",
    });
  }

  // No manual logActivity sending; backend logs actions for you

  function getActivityIcon(action_or_type) {
    if (!action_or_type) return "📝";
    if (action_or_type === "login" || action_or_type === "logout") return "🔑";
    if (action_or_type === "organization") return "➕";
    if (action_or_type === "report") return "✏️";
    if (action_or_type === "security") return "🔒";
    if (action_or_type === "settings") return "⚙️";
    return "📝";
  }

  // --- Activity log filter events
  activityDateFilter.addEventListener("change", filterActivityLogs);
  activityTypeFilter.addEventListener("change", filterActivityLogs);

  async function filterActivityLogs() {
    await loadActivityLogs();
  }

  // Load more logs - placeholder
  loadMoreLogsBtn.addEventListener("click", () => {
    showToast("All logs loaded", "warning");
  });

  // ========== THEME & DISPLAY ==========
  themeOptions.forEach((option) => {
    option.addEventListener("click", () => {
      themeOptions.forEach((opt) => opt.classList.remove("active"));
      option.classList.add("active");
    });
  });

  saveDisplayBtn.addEventListener("click", () => {
    const selectedTheme = document.querySelector(
      'input[name="theme"]:checked'
    ).value;
    const fontSize = fontSizeSelect.value;
    localStorage.setItem("theme", selectedTheme);
    localStorage.setItem("fontSize", fontSize);
    if (selectedTheme === "dark") {
      showToast("Dark mode coming soon!", "warning");
    } else {
      showToast("Display preferences saved!");
    }
  });

  // Load saved preferences
  const savedTheme = localStorage.getItem("theme");
  const savedFontSize = localStorage.getItem("fontSize");
  if (savedTheme) {
    const themeInput = document.querySelector(
      `input[name="theme"][value="${savedTheme}"]`
    );
    if (themeInput) {
      themeInput.checked = true;
      themeInput.closest(".theme-option").classList.add("active");
      themeOptions.forEach((opt) => {
        if (opt !== themeInput.closest(".theme-option"))
          opt.classList.remove("active");
      });
    }
  }
  if (savedFontSize) {
    fontSizeSelect.value = savedFontSize;
  }

  // ========== CONFIRMATION MODAL ==========
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

  // ========== TOAST NOTIFICATIONS ==========
  function showToast(message, type = "success") {
    toast.textContent = message;
    toast.className = "toast";
    if (type === "error") toast.classList.add("error");
    else if (type === "warning") toast.classList.add("warning");
    toast.style.display = "block";
    setTimeout(() => {
      toast.style.display = "none";
    }, 3000);
  }

  // ========== INITIAL LOAD ==========
  loadAdminProfile();
  loadActivityLogs();
});
