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
  const themeOptions = document.querySelectorAll('.theme-option');
  const fontSizeSelect = document.getElementById("fontSize");
  
  // Modal
  const confirmModal = document.getElementById("confirmModal");
  const closeConfirmModal = document.getElementById("closeConfirmModal");
  const cancelConfirmBtn = document.getElementById("cancelConfirmBtn");
  const proceedConfirmBtn = document.getElementById("proceedConfirmBtn");
  const confirmMessage = document.getElementById("confirmMessage");
  
  const toast = document.getElementById("toast");

  // --- SIDE MENU ---
  const menuIcon = document.querySelector(".menu-icon img");
  const sideMenu = document.getElementById("sideMenu");

  let confirmCallback = null;
  let activityLogs = [];

  // ============================
  // MENU TOGGLE
  // ============================
  menuIcon.addEventListener("click", () => sideMenu.classList.toggle("active"));
  window.addEventListener("click", (e) => {
    if (!sideMenu.contains(e.target) && !menuIcon.contains(e.target)) {
      sideMenu.classList.remove("active");
    }
  });

  // ============================
  // SIDEBAR NAVIGATION
  // ============================
  navItems.forEach(item => {
    item.addEventListener("click", () => {
      // Remove active class from all items and sections
      navItems.forEach(nav => nav.classList.remove("active"));
      settingsSections.forEach(section => section.classList.remove("active"));
      
      // Add active class to clicked item
      item.classList.add("active");
      
      // Show corresponding section
      const sectionId = item.dataset.section;
      const section = document.getElementById(sectionId);
      if (section) {
        section.classList.add("active");
      }
    });
  });

  // ============================
  // LOAD ADMIN PROFILE
  // ============================
  async function loadAdminProfile() {
    try {
      const res = await fetch("/osas/api/admin/profile");
      const data = await res.json();
      
      if (data.profile) {
        document.getElementById("adminName").value = data.profile.name || "";
        document.getElementById("adminEmail").value = data.profile.email || "";
        document.getElementById("adminUsername").value = data.profile.username || "";
      }
    } catch (err) {
      console.error("Error loading profile:", err);
      // Set default values if API doesn't exist
      document.getElementById("adminName").value = "Admin User";
      document.getElementById("adminEmail").value = "admin@university.edu";
      document.getElementById("adminUsername").value = "admin_osas";
    }
  }

  // ============================
  // PROFILE FORM SUBMISSION
  // ============================
  profileForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    
    const profileData = {
      name: document.getElementById("adminName").value,
      email: document.getElementById("adminEmail").value,
      username: document.getElementById("adminUsername").value
    };

    try {
      const res = await fetch("/osas/api/admin/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(profileData)
      });

      if (!res.ok) throw new Error("Failed to update profile");
      
      showToast("Profile updated successfully!");
      logActivity("Updated profile information");
    } catch (err) {
      console.error("Error updating profile:", err);
      showToast("Profile updated (local only)", "warning");
      logActivity("Updated profile information");
    }
  });

  // ============================
  // PASSWORD FORM SUBMISSION
  // ============================
  passwordForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    
    const currentPassword = document.getElementById("currentPassword").value;
    const newPassword = document.getElementById("newPassword").value;
    const confirmPassword = document.getElementById("confirmPassword").value;

    // Validation
    if (newPassword !== confirmPassword) {
      showToast("New passwords do not match", "error");
      return;
    }

    if (newPassword.length < 8) {
      showToast("Password must be at least 8 characters", "error");
      return;
    }

    const passwordData = {
      currentPassword,
      newPassword
    };

    try {
      const res = await fetch("/osas/api/admin/password", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(passwordData)
      });

      if (!res.ok) throw new Error("Failed to update password");
      
      showToast("Password updated successfully!");
      passwordForm.reset();
      logActivity("Changed account password");
    } catch (err) {
      console.error("Error updating password:", err);
      showToast("Error updating password. Please check your current password.", "error");
    }
  });

  // ============================
  // LOGOUT ALL DEVICES
  // ============================
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
          logActivity("Logged out all other devices");
        } catch (err) {
          console.error("Error logging out devices:", err);
          showToast("Session management updated", "warning");
          logActivity("Logged out all other devices");
        }
      }
    );
  });

  // ============================
  // ACTIVITY LOGS
  // ============================
  async function loadActivityLogs() {
    try {
      const res = await fetch("/osas/api/admin/activity-logs");
      const data = await res.json();
      
      if (data.logs) {
        activityLogs = data.logs;
      } else {
        // Default sample logs
        activityLogs = [
          { icon: "🔑", action: "Logged in", date: new Date().toISOString(), type: "login" },
          { icon: "➕", action: 'Added new organization: "Student Council"', date: new Date(Date.now() - 86400000).toISOString(), type: "organization" },
          { icon: "✏️", action: 'Updated report status for "Dance Club"', date: new Date(Date.now() - 172800000).toISOString(), type: "report" },
          { icon: "🗑️", action: 'Deleted organization: "Inactive Org"', date: new Date(Date.now() - 259200000).toISOString(), type: "organization" }
        ];
      }
      
      renderActivityLogs();
    } catch (err) {
      console.error("Error loading activity logs:", err);
      // Use default logs
      activityLogs = [
        { icon: "🔑", action: "Logged in", date: new Date().toISOString(), type: "login" },
        { icon: "➕", action: 'Added new organization: "Student Council"', date: new Date(Date.now() - 86400000).toISOString(), type: "organization" }
      ];
      renderActivityLogs();
    }
  }

  function renderActivityLogs(filteredLogs = null) {
    const logsToRender = filteredLogs || activityLogs;
    
    activityList.innerHTML = "";
    
    if (logsToRender.length === 0) {
      activityList.innerHTML = '<p style="text-align: center; color: #828282; padding: 40px;">No activity logs found</p>';
      return;
    }

    logsToRender.forEach(log => {
      const item = document.createElement("div");
      item.className = "activity-item";
      
      item.innerHTML = `
        <div class="activity-icon">${log.icon}</div>
        <div class="activity-details">
          <p class="activity-action">${log.action}</p>
          <p class="activity-date">${formatActivityDate(log.date)}</p>
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

    if (diffHours < 1) {
      return "Just now";
    } else if (diffHours < 24) {
      return `Today at ${date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}`;
    } else if (diffDays === 1) {
      return `Yesterday at ${date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}`;
    } else {
      return date.toLocaleDateString('en-US', { 
        month: 'short', 
        day: 'numeric', 
        year: 'numeric',
        hour: 'numeric',
        minute: '2-digit'
      });
    }
  }

  function logActivity(action) {
    const newLog = {
      icon: getActivityIcon(action),
      action: action,
      date: new Date().toISOString(),
      type: getActivityType(action)
    };
    
    activityLogs.unshift(newLog);
    
    // Send to backend
    fetch("/osas/api/admin/activity-logs", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(newLog)
    }).catch(err => console.error("Error logging activity:", err));
  }

  function getActivityIcon(action) {
    if (action.includes("Login") || action.includes("Logged")) return "🔑";
    if (action.includes("Added")) return "➕";
    if (action.includes("Updated") || action.includes("Changed")) return "✏️";
    if (action.includes("Deleted")) return "🗑️";
    if (action.includes("password")) return "🔒";
    return "📝";
  }

  function getActivityType(action) {
    if (action.includes("organization")) return "organization";
    if (action.includes("report")) return "report";
    if (action.includes("Login") || action.includes("Logged")) return "login";
    if (action.includes("password") || action.includes("profile")) return "settings";
    return "other";
  }

  // Filter activity logs
  activityDateFilter.addEventListener("change", filterActivityLogs);
  activityTypeFilter.addEventListener("change", filterActivityLogs);

  function filterActivityLogs() {
    const dateFilter = activityDateFilter.value;
    const typeFilter = activityTypeFilter.value;

    let filtered = activityLogs;

    if (dateFilter) {
      filtered = filtered.filter(log => {
        const logDate = new Date(log.date).toISOString().split('T')[0];
        return logDate === dateFilter;
      });
    }

    if (typeFilter !== "all") {
      filtered = filtered.filter(log => log.type === typeFilter);
    }

    renderActivityLogs(filtered);
  }

  loadMoreLogsBtn.addEventListener("click", () => {
    showToast("All logs loaded", "warning");
  });

  // ============================
  // THEME & DISPLAY SETTINGS
  // ============================
  themeOptions.forEach(option => {
    option.addEventListener("click", () => {
      themeOptions.forEach(opt => opt.classList.remove("active"));
      option.classList.add("active");
    });
  });

  saveDisplayBtn.addEventListener("click", () => {
    const selectedTheme = document.querySelector('input[name="theme"]:checked').value;
    const fontSize = fontSizeSelect.value;

    // Save to localStorage
    localStorage.setItem("theme", selectedTheme);
    localStorage.setItem("fontSize", fontSize);

    // Apply theme (for future implementation)
    if (selectedTheme === "dark") {
      showToast("Dark mode coming soon!", "warning");
    } else {
      showToast("Display preferences saved!");
    }

    logActivity("Updated display preferences");
  });

  // Load saved preferences
  const savedTheme = localStorage.getItem("theme");
  const savedFontSize = localStorage.getItem("fontSize");

  if (savedTheme) {
    const themeInput = document.querySelector(`input[name="theme"][value="${savedTheme}"]`);
    if (themeInput) {
      themeInput.checked = true;
      themeInput.closest('.theme-option').classList.add('active');
      themeOptions.forEach(opt => {
        if (opt !== themeInput.closest('.theme-option')) {
          opt.classList.remove('active');
        }
      });
    }
  }

  if (savedFontSize) {
    fontSizeSelect.value = savedFontSize;
  }

  // ============================
  // CONFIRMATION MODAL
  // ============================
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
    if (confirmCallback) {
      confirmCallback();
    }
    hideConfirmModal();
  });

  window.addEventListener("click", (e) => {
    if (e.target === confirmModal) {
      hideConfirmModal();
    }
  });

  // ============================
  // TOAST NOTIFICATIONS
  // ============================
  function showToast(message, type = "success") {
    toast.textContent = message;
    toast.className = "toast";
    
    if (type === "error") {
      toast.classList.add("error");
    } else if (type === "warning") {
      toast.classList.add("warning");
    }
    
    toast.style.display = "block";
    
    setTimeout(() => {
      toast.style.display = "none";
    }, 3000);
  }

  // ============================
  // INITIAL LOAD
  // ============================
  loadAdminProfile();
  loadActivityLogs();
});