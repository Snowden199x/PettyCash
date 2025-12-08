document.addEventListener("DOMContentLoaded", () => {
  // -----------------------
  // State
  // -----------------------
  let isEditing = false;
  let originalValues = {};
  let officers = [];
  let currentOfficerId = null;
  let officerIdToDelete = null;

  const API_BASE = "/pres/api";

  // -----------------------
  // Elements - Org info
  // -----------------------
  const editBtn = document.getElementById("edit-btn");
  const saveBtn = document.getElementById("save-btn");
  const cancelBtn = document.getElementById("cancel-btn");
  const photoUpload = document.getElementById("photo-upload");
  const profileImg = document.getElementById("profile-img");
  const orgPhotoBtn = document.getElementById("org-photo-btn");

  const inputs = {
    orgName: document.getElementById("org-name"),
    orgShortName: document.getElementById("org-short-name"),
    department: document.getElementById("department"),
    school: document.getElementById("school"),
    email: document.getElementById("email"),
  };

  const overviewOrgName = document.getElementById("overview-org-name");
  const overviewShortName = document.getElementById("overview-short-name");
  const overviewDepartment = document.getElementById("overview-department");
  const overviewSchool = document.getElementById("overview-school");
  const overviewEmail = document.getElementById("overview-email");


  // -----------------------
  // Tabs
  // -----------------------
  const tabBtns = document.querySelectorAll(".tab-btn");
  const tabPanes = document.querySelectorAll(".tab-pane");

  // -----------------------
  // Officers
  // -----------------------
  const addOfficerBtn = document.getElementById("add-officer-btn");
  const officersTbody = document.getElementById("officers-tbody");

  const modal = document.getElementById("officer-modal");
  const modalTitle = document.getElementById("modal-title");
  const modalClose = document.getElementById("modal-close");
  const modalCancel = document.getElementById("modal-cancel");
  const modalSave = document.getElementById("modal-save");
  const officerNameInput = document.getElementById("officer-name");
  const officerPositionInput = document.getElementById("officer-position");
  const officerTermStartInput = document.getElementById("officer-term-start");
  const officerTermEndInput = document.getElementById("officer-term-end");
  const officerStatusInput = document.getElementById("officer-status");

  const deleteConfirmModal = document.getElementById("delete-confirm-modal");
  const deleteConfirmText = document.getElementById("delete-confirm-text");
  const deleteConfirmClose = document.getElementById("delete-confirm-close");
  const deleteConfirmCancel = document.getElementById("delete-confirm-cancel");
  const deleteConfirmConfirm = document.getElementById(
    "delete-confirm-confirm"
  );

  // -----------------------
  // Helpers
  // -----------------------
  function showToast(message, type = "success") {
    let container = document.querySelector(".toast-container");
    if (!container) {
      container = document.createElement("div");
      container.className = "toast-container";
      document.body.appendChild(container);
    }

    const toast = document.createElement("div");
    toast.className = `toast ${type}`;
    toast.textContent = message;
    container.appendChild(toast);

    requestAnimationFrame(() => toast.classList.add("show"));

    setTimeout(() => {
      toast.classList.remove("show");
      setTimeout(() => toast.remove(), 300);
    }, 2500);
  }

  async function apiGet(url) {
    const res = await fetch(url, {
      headers: { Accept: "application/json" },
      credentials: "include",
    });
    if (!res.ok) throw new Error(await res.text());
    return res.json();
  }

  async function apiJson(url, method, bodyObj) {
    const res = await fetch(url, {
      method,
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      credentials: "include",
      body: JSON.stringify(bodyObj),
    });
    if (!res.ok) throw new Error(await res.text());
    return res.json();
  }

  async function apiForm(url, formData) {
    const res = await fetch(url, {
      method: "POST",
      credentials: "include",
      body: formData,
    });
    if (!res.ok) throw new Error(await res.text());
    return res.json();
  }

  function validateRequiredField(inputEl) {
    const group = inputEl.closest(".form-group");
    if (!group) return true;

    const value = inputEl.value.trim();
    const labelEl = group.querySelector("label");
    const fieldName = labelEl
      ? labelEl.textContent.replace(":", "")
      : "This field";

    group.classList.remove("error", "shake");
    const oldMsg = group.querySelector(".error-message");
    if (oldMsg) oldMsg.remove();

    if (!value) {
      group.classList.add("error", "shake");
      const msg = document.createElement("div");
      msg.className = "error-message";
      msg.textContent = `${fieldName} is required.`;
      group.appendChild(msg);
      setTimeout(() => group.classList.remove("shake"), 300);
      return false;
    }
    return true;
  }

  function formatMonthYear(dateStr) {
    if (!dateStr) return "";
    const d = new Date(dateStr);
    if (Number.isNaN(d.getTime())) return dateStr;
    return d.toLocaleDateString("en-US", { month: "long", year: "numeric" });
  }

  function capitalizeFirst(str) {
    if (!str) return "";
    return str.charAt(0).toUpperCase() + str.slice(1);
  }

  function validateEmailFormat(inputEl) {
  const value = inputEl.value.trim();
  const group = inputEl.closest(".form-group");
  if (!group) return true;

  // basic, common email format: text@text.tld
  const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/; // widely used pattern [web:23][web:26]

  // clear previous state
  group.classList.remove("error", "shake");
  const oldMsg = group.querySelector(".error-message");
  if (oldMsg) oldMsg.remove();

  if (!emailPattern.test(value)) {
    group.classList.add("error", "shake");
    const msg = document.createElement("div");
    msg.className = "error-message";
    msg.textContent = "Please enter a valid email address (e.g., name@example.com).";
    group.appendChild(msg);
    setTimeout(() => group.classList.remove("shake"), 300);
    return false;
  }
  return true;
}


  // -----------------------
  // Tabs
  // -----------------------
  tabBtns.forEach((btn) => {
    btn.addEventListener("click", () => {
      const targetTab = btn.dataset.tab;

      tabBtns.forEach((b) => b.classList.remove("active"));
      tabPanes.forEach((p) => p.classList.remove("active"));

      btn.classList.add("active");
      document.getElementById(`${targetTab}-tab`).classList.add("active");
    });
  });

  // -----------------------
  // Org info edit
  // -----------------------
  editBtn.addEventListener("click", enableEditing);
  saveBtn.addEventListener("click", saveChanges);
  cancelBtn.addEventListener("click", cancelEditing);
  orgPhotoBtn.addEventListener("click", () => photoUpload.click());
  photoUpload.addEventListener("change", handlePhotoUpload);

  function enableEditing() {
    isEditing = true;

    // orgShortName lang ang editable
    const editableKeys = ["orgShortName", "email"];
      editableKeys.forEach((key) => {
      const input = inputs[key];
      originalValues[key] = input.value;
      input.removeAttribute("readonly");
      input.classList.add("editable");
      const group = input.closest(".form-group");
      if (group) {
        group.classList.remove("error", "shake");
        const msg = group.querySelector(".error-message");
        if (msg) msg.remove();
      }
    });

    orgPhotoBtn.disabled = false;
    editBtn.style.display = "none";
    saveBtn.style.display = "inline-block";
    cancelBtn.style.display = "inline-block";
  }

  async function saveChanges() {
    const fieldsToCheck = [inputs.orgShortName, inputs.email];

    let allValid = true;
    fieldsToCheck.forEach((input) => {
      if (!validateRequiredField(input)) {
        allValid = false;
      }
    });

    // extra email format check if email not empty
    if (inputs.email.value.trim() && !validateEmailFormat(inputs.email)) {
      allValid = false;
    }

    if (!allValid) {
      showToast("Please fill in all required fields.", "error");
      return;
    }

    const payload = {
      org_short_name: inputs.orgShortName.value,
      email: inputs.email.value,
    };

    try {
      await apiJson(`${API_BASE}/profile`, "PUT", payload);

      overviewOrgName.textContent = inputs.orgName.value;
      overviewShortName.textContent = inputs.orgShortName.value;
      overviewDepartment.textContent = inputs.department.options
        ? inputs.department.options[inputs.department.selectedIndex].text
        : inputs.department.value;
      overviewSchool.textContent = inputs.school.value;

      showToast("Organization information updated successfully!", "success");
      disableEditing();
    } catch (err) {
      console.error(err);
          // ---- new block: inspect server error and highlight fields ----
      let serverMsg = "Failed to update profile.";
        if (err.data && (err.data.error || err.data.message)) {
          serverMsg = err.data.error || err.data.message;
        } else if (typeof err.message === "string") {
          serverMsg = err.message;
        }

        console.log("raw serverMsg:", serverMsg);

        // If backend sent a JSON string, parse and extract .error
        if (typeof serverMsg === "string" && serverMsg.trim().startsWith("{")) {
          try {
            const parsed = JSON.parse(serverMsg);
            if (parsed && typeof parsed.error === "string") {
              serverMsg = parsed.error;
            }
          } catch (e) {
            // ignore parse failure, keep original serverMsg
          }
        }

        const msgLower = serverMsg.toLowerCase();

      // clear old error states
      [inputs.email, inputs.orgShortName].forEach((input) => {
        const group = input.closest(".form-group");
        if (!group) return;
        group.classList.remove("error", "shake");
        const oldMsg = group.querySelector(".error-message");
        if (oldMsg) oldMsg.remove();
      });

      // If message mentions shortened name, highlight orgShortName
      if (msgLower.includes("shortened name") || msgLower.includes("org_short_name")) {
        const group = inputs.orgShortName.closest(".form-group");
        if (group) {
          group.classList.add("error", "shake");
          const em = document.createElement("div");
          em.className = "error-message";
          em.textContent = serverMsg;
          group.appendChild(em);
          setTimeout(() => group.classList.remove("shake"), 300);
        }
        showToast("Shortened name is already used by another organization", "error");
        return;
      }

      // If message mentions email, highlight email
      if (msgLower.includes("email")) {
        const group = inputs.email.closest(".form-group");
        if (group) {
          group.classList.add("error", "shake");
          const em = document.createElement("div");
          em.className = "error-message";
          em.textContent = serverMsg;
          group.appendChild(em);
          setTimeout(() => group.classList.remove("shake"), 300);
        }
        showToast("Email is already used by another organization", "error");
        return;
      }
      showToast("Failed to update profile.", "error");
    }
  }

  function cancelEditing() {
    const editableKeys = ["orgShortName", "email"];

    editableKeys.forEach((key) => {
      if (Object.prototype.hasOwnProperty.call(originalValues, key)) {
        inputs[key].value = originalValues[key];
      }
    });

    disableEditing();
  }

  function disableEditing() {
    isEditing = false;

    Object.keys(inputs).forEach((key) => {
      const input = inputs[key];
      input.setAttribute("readonly", true);
      input.classList.remove("editable");

      const group = input.closest(".form-group");
      if (group) {
        group.classList.remove("error", "shake");
        const msg = group.querySelector(".error-message");
        if (msg) msg.remove();
      }
    });

    orgPhotoBtn.disabled = true;

    editBtn.style.display = "inline-block";
    saveBtn.style.display = "none";
    cancelBtn.style.display = "none";

    originalValues = {};
  }

  async function handlePhotoUpload(e) {
    const file = e.target.files[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      showToast("Please select a valid image file.", "error");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      showToast("Image size should be less than 5MB.", "error");
      return;
    }

    const formData = new FormData();
    formData.append("photo", file);

    try {
      const res = await apiForm(`${API_BASE}/profile/picture`, formData);
      if (res.url) {
        profileImg.src = res.url;
      } else {
        const reader = new FileReader();
        reader.onload = (event) => {
          profileImg.src = event.target.result;
        };
        reader.readAsDataURL(file);
      }
      showToast("Organization photo updated successfully!", "success");
    } catch (err) {
      console.error(err);
      showToast("Failed to upload profile photo.", "error");
    }
  }

  // -----------------------
  // Officers (CRUD via API)
  // -----------------------
  async function loadOfficers() {
    try {
      const data = await apiGet(`${API_BASE}/officers`);
      officers = data.officers || [];
      renderOfficers();
    } catch (err) {
      console.error(err);
      showToast("Failed to load officers.", "error");
    }
  }

  function renderOfficers() {
    officersTbody.innerHTML = "";

    officers.forEach((officer) => {
      const row = document.createElement("tr");
      const termStart = formatMonthYear(officer.term_start);
      const termEnd = formatMonthYear(officer.term_end);

      row.innerHTML = `
        <td>${officer.name}</td>
        <td>${officer.position}</td>
        <td>${termStart}</td>
        <td>${termEnd}</td>
        <td>
          <span class="status-badge ${officer.status.toLowerCase()}">
            ${capitalizeFirst(officer.status)}
          </span>
        </td>
        <td>
          <button class="action-btn edit-officer-btn" data-id="${
            officer.id
          }">Edit</button>
          <button class="action-btn delete-officer-btn" data-id="${
            officer.id
          }">Delete</button>
        </td>
      `;
      officersTbody.appendChild(row);
    });

    document.querySelectorAll(".edit-officer-btn").forEach((btn) => {
      btn.addEventListener("click", () =>
        editOfficer(parseInt(btn.dataset.id, 10))
      );
    });

    document.querySelectorAll(".delete-officer-btn").forEach((btn) => {
      btn.addEventListener("click", () =>
        deleteOfficer(parseInt(btn.dataset.id, 10))
      );
    });
  }

  addOfficerBtn.addEventListener("click", () => {
    currentOfficerId = null;
    modalTitle.textContent = "Add Officer";
    officerNameInput.value = "";
    officerPositionInput.value = "";
    officerTermStartInput.value = "";
    officerTermEndInput.value = "";
    officerStatusInput.value = "Active";

    [
      officerNameInput,
      officerPositionInput,
      officerTermStartInput,
      officerTermEndInput,
    ].forEach((input) => {
      const group = input.closest(".form-group");
      if (group) {
        group.classList.remove("error", "shake");
        const msg = group.querySelector(".error-message");
        if (msg) msg.remove();
      }
    });

    openModal();
  });

  function editOfficer(id) {
    const officer = officers.find((o) => o.id === id);
    if (!officer) return;

    currentOfficerId = id;
    modalTitle.textContent = "Edit Officer";
    officerNameInput.value = officer.name;
    officerPositionInput.value = officer.position;
    officerTermStartInput.value = officer.term_start || "";
    officerTermEndInput.value = officer.term_end || "";
    officerStatusInput.value = officer.status;

    [
      officerNameInput,
      officerPositionInput,
      officerTermStartInput,
      officerTermEndInput,
    ].forEach((input) => {
      const group = input.closest(".form-group");
      if (group) {
        group.classList.remove("error", "shake");
        const msg = group.querySelector(".error-message");
        if (msg) msg.remove();
      }
    });

    openModal();
  }

  function deleteOfficer(id) {
    const officer = officers.find((o) => o.id === id);
    if (!officer) return;
    officerIdToDelete = id;
    deleteConfirmText.textContent = `Are you sure you want to delete ${officer.name} from the officers list?`;
    deleteConfirmModal.classList.add("active");
  }

  function openModal() {
    modal.classList.add("active");
  }

  function closeModal() {
    modal.classList.remove("active");
    currentOfficerId = null;
  }

  modalClose.addEventListener("click", closeModal);
  modalCancel.addEventListener("click", closeModal);
  modal.addEventListener("click", (e) => {
    if (e.target === modal) closeModal();
  });

  modalSave.addEventListener("click", async () => {
    const name = officerNameInput.value.trim();
    const position = officerPositionInput.value.trim();
    const termStartMonth = officerTermStartInput.value;
    const termEndMonth = officerTermEndInput.value;
    const status = officerStatusInput.value;

    function monthToDate(value) {
      if (!value) return null;
      return value + "-01"; // "2025-12" -> "2025-12-01"
    }

    const termStart = monthToDate(termStartMonth);
    const termEnd = monthToDate(termEndMonth);

    let allValid = true;
    [
      officerNameInput,
      officerPositionInput,
      officerTermStartInput,
      officerTermEndInput,
    ].forEach((input) => {
      if (!validateRequiredField(input)) allValid = false;
    });

    if (!allValid) {
      showToast("Please fill in all required fields.", "error");
      return;
    }

    if (new Date(termStart) >= new Date(termEnd)) {
      showToast("Term start date must be before term end date.", "error");
      return;
    }

    const payload = {
      name,
      position,
      term_start: termStart,
      term_end: termEnd,
      status,
    };

    try {
      if (currentOfficerId === null) {
        const res = await apiJson(`${API_BASE}/officers`, "POST", payload);
        officers.push(res.officer);
        showToast("Officer added successfully!", "success");
      } else {
        const res = await apiJson(
          `${API_BASE}/officers/${currentOfficerId}`,
          "PUT",
          payload
        );
        const idx = officers.findIndex((o) => o.id === currentOfficerId);
        if (idx !== -1) officers[idx] = res.officer;
        showToast("Officer updated successfully!", "success");
      }
      renderOfficers();
      closeModal();
    } catch (err) {
      console.error(err);
      showToast("Failed to save officer.", "error");
    }
  });

  function closeDeleteConfirmModal() {
    deleteConfirmModal.classList.remove("active");
    officerIdToDelete = null;
  }

  deleteConfirmClose.addEventListener("click", closeDeleteConfirmModal);
  deleteConfirmCancel.addEventListener("click", closeDeleteConfirmModal);

  deleteConfirmConfirm.addEventListener("click", async () => {
    if (officerIdToDelete == null) return;
    try {
      await apiJson(`${API_BASE}/officers/${officerIdToDelete}`, "DELETE", {});
      officers = officers.filter((o) => o.id !== officerIdToDelete);
      renderOfficers();
      showToast("Officer deleted successfully!", "success");
    } catch (err) {
      console.error(err);
      showToast("Failed to delete officer.", "error");
    } finally {
      closeDeleteConfirmModal();
    }
  });

  deleteConfirmModal.addEventListener("click", (e) => {
    if (e.target === deleteConfirmModal) {
      closeDeleteConfirmModal();
    }
  });

  // -----------------------
  // Sidebar nav
  // -----------------------
  const navItems = document.querySelectorAll(".nav-item");
  navItems.forEach((item) => {
    item.addEventListener("click", () => {
      navItems.forEach((i) => i.classList.remove("active"));
      item.classList.add("active");
    });
  });

  // Warn on unsaved changes
  window.addEventListener("beforeunload", (e) => {
    if (isEditing) {
      e.preventDefault();
      e.returnValue =
        "You have unsaved changes. Are you sure you want to leave?";
      return e.returnValue;
    }
  });

  // -----------------------
  // Initial load
  // -----------------------
  async function init() {
    const loadingEl = document.getElementById("profile-loading");
    const contentEl = document.getElementById("profile-content");

    if (loadingEl) loadingEl.style.display = "flex";
    if (contentEl) contentEl.style.display = "none";

    try {
      const profile = await apiGet(`${API_BASE}/profile`);

      // Inputs
      inputs.orgName.value = profile.org_name || "";
      inputs.orgShortName.value = profile.org_short_name || "";
      inputs.school.value = profile.school || "";
      inputs.email.value = profile.email || "";

      // Department display: use name, not ID
      if (inputs.department) {
        inputs.department.value = profile.department || "";
      }

      // Overview texts
      overviewOrgName.textContent = profile.org_name || "";
      overviewShortName.textContent = profile.org_short_name || "";
      overviewDepartment.textContent = profile.department || "";
      overviewSchool.textContent = profile.school || "";
      overviewEmail.textContent = profile.email || "";

      // Accreditation details
      const accDateEl = document.getElementById("acc-date");
      const accStatusEl = document.getElementById("acc-status");

      if (profile.accreditation) {
        accDateEl.textContent =
          profile.accreditation.date_of_accreditation || "";
        accStatusEl.textContent = profile.accreditation.current_status || "";
      } else {
        accDateEl.textContent = "";
        accStatusEl.textContent = "";
      }

      // Profile photo
      if (profile.profile_photo_url && profile.profile_photo_url !== null) {
        profileImg.src = profile.profile_photo_url;
      }

      await loadOfficers();
    } catch (err) {
      console.error(err);
      showToast("Failed to load profile.", "error");
    } finally {
    if (loadingEl) loadingEl.style.display = "none";
    if (contentEl) contentEl.style.display = "block";
    }
  }

  init();
});
