document.addEventListener("DOMContentLoaded", () => {
  // State management
  let isEditing = false;
  let originalValues = {};
  let officers = [
    {
      id: 1,
      name: "John Doe",
      position: "President",
      termStart: "2024-08",
      termEnd: "2025-05",
      status: "active"
    },
    {
      id: 2,
      name: "Jane Smith",
      position: "Vice President",
      termStart: "2024-08",
      termEnd: "2025-05",
      status: "active"
    }
  ];
  let currentOfficerId = null;
  let nextOfficerId = 3;
  let officerIdToDelete = null;

  // Elements - Organization Info
  const editBtn = document.getElementById('edit-btn');
  const saveBtn = document.getElementById('save-btn');
  const cancelBtn = document.getElementById('cancel-btn');
  const photoUpload = document.getElementById('photo-upload');
  const profileImg = document.getElementById('profile-img');
  const orgPhotoBtn = document.getElementById('org-photo-btn');

  const inputs = {
    orgName: document.getElementById('org-name'),
    orgShortName: document.getElementById('org-short-name'),
    department: document.getElementById('department'),
    school: document.getElementById('school')
  };

  // Elements - Tabs
  const tabBtns = document.querySelectorAll('.tab-btn');
  const tabPanes = document.querySelectorAll('.tab-pane');

  // Elements - Officers
  const addOfficerBtn = document.getElementById('add-officer-btn');
  const officersTbody = document.getElementById('officers-tbody');

  // Elements - Officer Modal
  const modal = document.getElementById('officer-modal');
  const modalTitle = document.getElementById('modal-title');
  const modalClose = document.getElementById('modal-close');
  const modalCancel = document.getElementById('modal-cancel');
  const modalSave = document.getElementById('modal-save');
  const officerNameInput = document.getElementById('officer-name');
  const officerPositionInput = document.getElementById('officer-position');
  const officerTermStartInput = document.getElementById('officer-term-start');
  const officerTermEndInput = document.getElementById('officer-term-end');
  const officerStatusInput = document.getElementById('officer-status');

  // Elements - Delete Confirmation Modal
  const deleteConfirmModal = document.getElementById('delete-confirm-modal');
  const deleteConfirmText = document.getElementById('delete-confirm-text');
  const deleteConfirmClose = document.getElementById('delete-confirm-close');
  const deleteConfirmCancel = document.getElementById('delete-confirm-cancel');
  const deleteConfirmConfirm = document.getElementById('delete-confirm-confirm');

  // Toast helper
  function showToast(message, type = 'success') {
    let container = document.querySelector('.toast-container');
    if (!container) {
      container = document.createElement('div');
      container.className = 'toast-container';
      document.body.appendChild(container);
    }

    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.textContent = message;
    container.appendChild(toast);

    requestAnimationFrame(() => toast.classList.add('show'));

    setTimeout(() => {
      toast.classList.remove('show');
      setTimeout(() => toast.remove(), 300);
    }, 2500);
  }

  // Field validation helper
  function validateRequiredField(inputEl) {
    const group = inputEl.closest('.form-group');
    if (!group) return true;

    const value = inputEl.value.trim();
    const labelEl = group.querySelector('label');
    const fieldName = labelEl ? labelEl.textContent.replace(':', '') : 'This field';

    group.classList.remove('error', 'shake');
    const oldMsg = group.querySelector('.error-message');
    if (oldMsg) oldMsg.remove();

    if (!value) {
      group.classList.add('error', 'shake');
      const msg = document.createElement('div');
      msg.className = 'error-message';
      msg.textContent = `${fieldName} is required.`;
      group.appendChild(msg);

      setTimeout(() => group.classList.remove('shake'), 300);
      return false;
    }
    return true;
  }

  // Tab Switching
  tabBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      const targetTab = btn.dataset.tab;

      tabBtns.forEach(b => b.classList.remove('active'));
      tabPanes.forEach(p => p.classList.remove('active'));

      btn.classList.add('active');
      document.getElementById(`${targetTab}-tab`).classList.add('active');
    });
  });

  // Organization Information Edit Functions
  editBtn.addEventListener('click', enableEditing);
  saveBtn.addEventListener('click', saveChanges);
  cancelBtn.addEventListener('click', cancelEditing);
  orgPhotoBtn.addEventListener('click', () => photoUpload.click());
  photoUpload.addEventListener('change', handlePhotoUpload);

  function enableEditing() {
    isEditing = true;

    Object.keys(inputs).forEach(key => {
      const input = inputs[key];
      originalValues[key] = input.value;
      input.removeAttribute('readonly');
      input.classList.add('editable');

      const group = input.closest('.form-group');
      if (group) {
        group.classList.remove('error', 'shake');
        const msg = group.querySelector('.error-message');
        if (msg) msg.remove();
      }
    });

    orgPhotoBtn.disabled = false;

    editBtn.style.display = 'none';
    saveBtn.style.display = 'inline-block';
    cancelBtn.style.display = 'inline-block';
  }

  function saveChanges() {
    const fieldsToCheck = [
      inputs.orgName,
      inputs.orgShortName,
      inputs.department,
      inputs.school
    ];

    let allValid = true;
    fieldsToCheck.forEach(input => {
      if (!validateRequiredField(input)) {
        allValid = false;
      }
    });

    if (!allValid) {
      showToast('Please fill in all required fields.', 'error');
      return;
    }

    const newValues = {
      orgName: inputs.orgName.value,
      orgShortName: inputs.orgShortName.value,
      department: inputs.department.value,
      school: inputs.school.value
    };

    document.getElementById('overview-org-name').textContent = newValues.orgName;
    document.getElementById('overview-short-name').textContent = newValues.orgShortName;
    document.getElementById('overview-department').textContent = newValues.department;
    document.getElementById('overview-school').textContent = newValues.school;

    console.log('Saving organization changes:', newValues);
    showToast('Organization information updated successfully!', 'success');
    disableEditing();
  }

  function cancelEditing() {
    Object.keys(inputs).forEach(key => {
      inputs[key].value = originalValues[key];
    });
    disableEditing();
  }

  function disableEditing() {
    isEditing = false;

    Object.keys(inputs).forEach(key => {
      const input = inputs[key];
      input.setAttribute('readonly', true);
      input.classList.remove('editable');

      const group = input.closest('.form-group');
      if (group) {
        group.classList.remove('error', 'shake');
        const msg = group.querySelector('.error-message');
        if (msg) msg.remove();
      }
    });

    orgPhotoBtn.disabled = true;

    editBtn.style.display = 'inline-block';
    saveBtn.style.display = 'none';
    cancelBtn.style.display = 'none';

    originalValues = {};
  }

  function handlePhotoUpload(e) {
    const file = e.target.files[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      showToast('Please select a valid image file.', 'error');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      showToast('Image size should be less than 5MB.', 'error');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      profileImg.src = event.target.result;
      console.log('New photo selected:', file.name);
      showToast('Organization photo updated successfully!', 'success');
    };
    reader.readAsDataURL(file);
  }

  // Officers Management
  function renderOfficers() {
    officersTbody.innerHTML = '';

    officers.forEach(officer => {
      const row = document.createElement('tr');
      const termStart = formatMonthYear(officer.termStart);
      const termEnd = formatMonthYear(officer.termEnd);

      row.innerHTML = `
        <td>${officer.name}</td>
        <td>${officer.position}</td>
        <td>${termStart}</td>
        <td>${termEnd}</td>
        <td><span class="status-badge ${officer.status}">${capitalizeFirst(officer.status)}</span></td>
        <td>
          <button class="action-btn edit-officer-btn" data-id="${officer.id}">Edit</button>
          <button class="action-btn delete-officer-btn" data-id="${officer.id}">Delete</button>
        </td>
      `;

      officersTbody.appendChild(row);
    });

    document.querySelectorAll('.edit-officer-btn').forEach(btn => {
      btn.addEventListener('click', () => editOfficer(parseInt(btn.dataset.id)));
    });

    document.querySelectorAll('.delete-officer-btn').forEach(btn => {
      btn.addEventListener('click', () => deleteOfficer(parseInt(btn.dataset.id)));
    });
  }

  function formatMonthYear(monthString) {
    const [year, month] = monthString.split('-');
    const date = new Date(year, month - 1);
    return date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  }

  function capitalizeFirst(str) {
    return str.charAt(0).toUpperCase() + str.slice(1);
  }

  // Add Officer
  addOfficerBtn.addEventListener('click', () => {
    currentOfficerId = null;
    modalTitle.textContent = 'Add Officer';
    officerNameInput.value = '';
    officerPositionInput.value = '';
    officerTermStartInput.value = '';
    officerTermEndInput.value = '';
    officerStatusInput.value = 'active';

    [officerNameInput, officerPositionInput, officerTermStartInput, officerTermEndInput].forEach(input => {
      const group = input.closest('.form-group');
      if (group) {
        group.classList.remove('error', 'shake');
        const msg = group.querySelector('.error-message');
        if (msg) msg.remove();
      }
    });

    openModal();
  });

  // Edit Officer
  function editOfficer(id) {
    const officer = officers.find(o => o.id === id);
    if (!officer) return;

    currentOfficerId = id;
    modalTitle.textContent = 'Edit Officer';
    officerNameInput.value = officer.name;
    officerPositionInput.value = officer.position;
    officerTermStartInput.value = officer.termStart;
    officerTermEndInput.value = officer.termEnd;
    officerStatusInput.value = officer.status;

    [officerNameInput, officerPositionInput, officerTermStartInput, officerTermEndInput].forEach(input => {
      const group = input.closest('.form-group');
      if (group) {
        group.classList.remove('error', 'shake');
        const msg = group.querySelector('.error-message');
        if (msg) msg.remove();
      }
    });

    openModal();
  }

  // Delete Officer (opens confirm modal)
  function deleteOfficer(id) {
    const officer = officers.find(o => o.id === id);
    if (!officer) return;
    openDeleteConfirmModal(officer);
  }

  // Officer Modal Functions
  function openModal() {
    modal.classList.add('active');
  }

  function closeModal() {
    modal.classList.remove('active');
    currentOfficerId = null;
  }

  modalClose.addEventListener('click', closeModal);
  modalCancel.addEventListener('click', closeModal);

  modal.addEventListener('click', (e) => {
    if (e.target === modal) {
      closeModal();
    }
  });

  // Save Officer
  modalSave.addEventListener('click', () => {
    const name = officerNameInput.value.trim();
    const position = officerPositionInput.value.trim();
    const termStart = officerTermStartInput.value;
    const termEnd = officerTermEndInput.value;
    const status = officerStatusInput.value;

    let allValid = true;
    [officerNameInput, officerPositionInput, officerTermStartInput, officerTermEndInput]
      .forEach(input => {
        if (!validateRequiredField(input)) {
          allValid = false;
        }
      });

    if (!allValid) {
      showToast('Please fill in all required fields.', 'error');
      return;
    }

    if (new Date(termStart) >= new Date(termEnd)) {
      showToast('Term start date must be before term end date.', 'error');
      validateRequiredField(officerTermStartInput);
      validateRequiredField(officerTermEndInput);
      return;
    }

    if (currentOfficerId === null) {
      const newOfficer = {
        id: nextOfficerId++,
        name,
        position,
        termStart,
        termEnd,
        status
      };
      officers.push(newOfficer);
      console.log('New officer added:', newOfficer);
      showToast('Officer added successfully!', 'success');
    } else {
      const officer = officers.find(o => o.id === currentOfficerId);
      if (officer) {
        officer.name = name;
        officer.position = position;
        officer.termStart = termStart;
        officer.termEnd = termEnd;
        officer.status = status;
        console.log('Officer updated:', officer);
        showToast('Officer updated successfully!', 'success');
      }
    }

    renderOfficers();
    closeModal();
  });

  // Delete Confirmation Modal functions
  function openDeleteConfirmModal(officer) {
    officerIdToDelete = officer.id;
    deleteConfirmText.textContent =
      `Are you sure you want to delete ${officer.name} from the officers list?`;
    deleteConfirmModal.classList.add('active');
  }

  function closeDeleteConfirmModal() {
    deleteConfirmModal.classList.remove('active');
    officerIdToDelete = null;
  }

  deleteConfirmClose.addEventListener('click', closeDeleteConfirmModal);
  deleteConfirmCancel.addEventListener('click', closeDeleteConfirmModal);

  deleteConfirmConfirm.addEventListener('click', () => {
    if (officerIdToDelete === null) return;
    officers = officers.filter(o => o.id !== officerIdToDelete);
    renderOfficers();
    console.log('Officer deleted:', officerIdToDelete);
    showToast('Officer deleted successfully!', 'success');
    closeDeleteConfirmModal();
  });

  deleteConfirmModal.addEventListener('click', (e) => {
    if (e.target === deleteConfirmModal) {
      closeDeleteConfirmModal();
    }
  });

  // Initialize
  renderOfficers();

  // Sidebar navigation handling
  const navItems = document.querySelectorAll('.nav-item');
  navItems.forEach(item => {
    item.addEventListener('click', () => {
      navItems.forEach(i => i.classList.remove('active'));
      item.classList.add('active');
    });
  });

  // Prevent navigation away if editing
  window.addEventListener('beforeunload', (e) => {
    if (isEditing) {
      e.preventDefault();
      e.returnValue = 'You have unsaved changes. Are you sure you want to leave?';
      return e.returnValue;
    }
  });
});
