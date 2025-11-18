document.addEventListener('DOMContentLoaded', function () {
    // ==========================
    // ELEMENTS
    // ==========================
    const menuIcon = document.querySelector('.menu-icon img');
    const sideMenu = document.getElementById('sideMenu');
    const profileForm = document.getElementById('profileForm');
    const passwordForm = document.getElementById('passwordForm');
    const preferencesForm = document.getElementById('preferencesForm');
    const toast = document.getElementById('toast');

    // ==========================
    // SIDE MENU TOGGLE
    // ==========================
    menuIcon.addEventListener('click', () => {
        sideMenu.classList.toggle('active');
    });

    // Close side menu on outside click
    window.addEventListener('click', (e) => {
        if (!sideMenu.contains(e.target) && !menuIcon.contains(e.target)) {
            sideMenu.classList.remove('active');
        }
    });

    // ==========================
    // TOAST UTILITY
    // ==========================
    function showToast(message, isError = false) {
        toast.textContent = message;
        toast.classList.toggle('error', isError);
        toast.classList.add('show');

        // Hide after 3 seconds
        setTimeout(() => {
            toast.classList.remove('show');
            toast.classList.remove('error');
        }, 3000);
    }

    // ==========================
    // FORM SUBMISSION HANDLERS
    // ==========================

    // --- Profile Form ---
    profileForm.addEventListener('submit', function (e) {
        e.preventDefault();
        const name = profileForm.adminName.value.trim();
        const email = profileForm.adminEmail.value.trim();

        // Simple validation
        if (!name || !email) {
            showToast('Please fill in all fields.', true);
            return;
        }

        // TODO: Replace with AJAX / fetch to backend
        console.log('Profile saved:', { name, email });
        showToast('Profile updated successfully!');
    });

    // --- Password Form ---
    passwordForm.addEventListener('submit', function (e) {
        e.preventDefault();
        const current = passwordForm.currentPassword.value;
        const newPass = passwordForm.newPassword.value;
        const confirm = passwordForm.confirmPassword.value;

        if (!current || !newPass || !confirm) {
            showToast('Please fill in all fields.', true);
            return;
        }

        if (newPass !== confirm) {
            showToast('New password and confirmation do not match.', true);
            return;
        }

        // TODO: Replace with AJAX / fetch to backend
        console.log('Password changed:', { current, newPass });
        showToast('Password changed successfully!');
        passwordForm.reset();
    });

    // --- Preferences Form ---
    preferencesForm.addEventListener('submit', function (e) {
        e.preventDefault();
        const timezone = preferencesForm.timezone.value;
        const notifications = preferencesForm.notifications.checked;

        // TODO: Replace with AJAX / fetch to backend
        console.log('Preferences saved:', { timezone, notifications });
        showToast('Preferences saved successfully!');
    });
});
