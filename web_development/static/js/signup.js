document.addEventListener("DOMContentLoaded", () => {
    // ===============================
    // Toggle Password Visibility
    // ===============================
    const toggles = document.querySelectorAll(".toggle-password");

    toggles.forEach(toggle => {
        toggle.addEventListener("click", () => {
            const targetId = toggle.getAttribute("data-target");
            const input = document.getElementById(targetId);

            if (input.type === "password") {
                input.type = "text";
                toggle.src = "/static/images/eye-open.png";
            } else {
                input.type = "password";
                toggle.src = "/static/images/eye-close.png";
            }
        });
    });

    // ===============================
    // Flash Messages Auto-hide
    // ===============================
    setTimeout(() => {
        document.querySelectorAll('.flash-message').forEach(msg => {
            msg.style.transition = 'opacity 0.5s ease';
            msg.style.opacity = '0';
            setTimeout(() => msg.remove(), 500);
        });
    }, 3000);

    // ===============================
    // Password Strength Indicator
    // ===============================
    const passwordInput = document.getElementById("password");
    const strengthBar = document.getElementById("password-strength-bar");
    const strengthText = document.getElementById("password-strength-text");

    if (passwordInput && strengthBar && strengthText) {
        passwordInput.addEventListener("input", () => {
            const value = passwordInput.value;
            let strength = 0;

            if (value.length >= 8) strength++;
            if (/[A-Z]/.test(value)) strength++;
            if (/\d/.test(value)) strength++;
            if (/[!@#$%^&*]/.test(value)) strength++;

            let strengthValue = "Weak";
            let color = "#dc3545";
            let width = "25%";

            if (strength === 2) {
                strengthValue = "Medium";
                color = "#ffc107";
                width = "50%";
            } else if (strength === 3) {
                strengthValue = "Strong";
                color = "#17a2b8";
                width = "75%";
            } else if (strength === 4) {
                strengthValue = "Very Strong";
                color = "#28a745";
                width = "100%";
            }

            strengthBar.style.width = width;
            strengthBar.style.backgroundColor = color;
            strengthText.textContent = strengthValue;
            strengthText.style.color = color;
        });
    }
});