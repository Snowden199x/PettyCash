document.addEventListener("DOMContentLoaded", () => {
  let isEditing = false;
  let originalValues = {};

  // Elements
  const editBtn = document.getElementById('edit-btn');
  const saveBtn = document.getElementById('save-btn');
  const cancelBtn = document.getElementById('cancel-btn');
  const changePhotoBtn = document.querySelector('.change-photo-btn');
  const photoUpload = document.getElementById('photo-upload');
  const profileImg = document.getElementById('profile-img');

  const inputs = {
    orgName: document.getElementById('org-name'),
    orgShortName: document.getElementById('org-short-name'),
    department: document.getElementById('department'),
    school: document.getElementById('school')
  };

  // Event Listeners
  editBtn.addEventListener('click', enableEditing);
  saveBtn.addEventListener('click', saveChanges);
  cancelBtn.addEventListener('click', cancelEditing);
  changePhotoBtn.addEventListener('click', () => photoUpload.click());
  photoUpload.addEventListener('change', handlePhotoUpload);

  // Functions
  function enableEditing() {
    isEditing = true;
    
    // Save original values
    Object.keys(inputs).forEach(key => {
      originalValues[key] = inputs[key].value;
      inputs[key].removeAttribute('readonly');
      inputs[key].classList.add('editable');
    });

    // Toggle buttons
    editBtn.style.display = 'none';
    saveBtn.style.display = 'inline-block';
    cancelBtn.style.display = 'inline-block';
  }

  function saveChanges() {
    // Here you would normally send the data to your backend
    // For now, we'll just simulate a save
    
    // Get new values
    const newValues = {
      orgName: inputs.orgName.value,
      orgShortName: inputs.orgShortName.value,
      department: inputs.department.value,
      school: inputs.school.value
    };

    // Simulate API call
    console.log('Saving changes:', newValues);

    // Show success message (you can implement a toast notification here)
    alert('Profile updated successfully!');

    // Disable editing
    disableEditing();
  }

  function cancelEditing() {
    // Restore original values
    Object.keys(inputs).forEach(key => {
      inputs[key].value = originalValues[key];
    });

    // Disable editing
    disableEditing();
  }

  function disableEditing() {
    isEditing = false;

    // Make inputs readonly again
    Object.keys(inputs).forEach(key => {
      inputs[key].setAttribute('readonly', true);
      inputs[key].classList.remove('editable');
    });

    // Toggle buttons
    editBtn.style.display = 'inline-block';
    saveBtn.style.display = 'none';
    cancelBtn.style.display = 'none';

    // Clear saved values
    originalValues = {};
  }

  function handlePhotoUpload(e) {
    const file = e.target.files[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      alert('Please select a valid image file');
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      alert('Image size should be less than 5MB');
      return;
    }

    // Preview the image
    const reader = new FileReader();
    reader.onload = (event) => {
      profileImg.src = event.target.result;
      
      // Here you would normally upload the image to your backend
      console.log('New photo selected:', file.name);
      
      // You can implement actual upload here
      // uploadProfilePhoto(file);
    };
    reader.readAsDataURL(file);
  }

  function uploadProfilePhoto(file) {
    // Implement your photo upload logic here
    // Example:
    /*
    const formData = new FormData();
    formData.append('photo', file);
    
    fetch('/api/upload-profile-photo', {
      method: 'POST',
      body: formData
    })
    .then(response => response.json())
    .then(data => {
      console.log('Photo uploaded:', data);
      alert('Profile photo updated successfully!');
    })
    .catch(error => {
      console.error('Error uploading photo:', error);
      alert('Failed to upload photo. Please try again.');
    });
    */
  }

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