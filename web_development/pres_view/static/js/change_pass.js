document.addEventListener("DOMContentLoaded", () => {
  const passwordInput = document.getElementById("password");
  const confirmPasswordInput = document.getElementById("confirm-password");
  const checklist = document.getElementById("password-checklist");
  const popup = document.getElementById("popup");
  const submitBtn = document.getElementById("submit-btn");

  const togglePassword = document.getElementById("togglePassword");
  const toggleConfirmPassword = document.getElementById("toggleConfirmPassword");

  // ---- SHOW / HIDE PASSWORD HELPERS ----
  function setupToggle(iconEl, inputEl) {
    if (!iconEl || !inputEl) return;
    const showSrc = iconEl.getAttribute("data-show-src");
    const hideSrc = iconEl.getAttribute("data-hide-src");

    iconEl.addEventListener("click", function () {
      const isHidden = inputEl.type === "password";
      inputEl.type = isHidden ? "text" : "password";
      this.src = isHidden ? hideSrc : showSrc;
      this.alt = isHidden ? "Hide password" : "Show password";
    });
  }

  setupToggle(togglePassword, passwordInput);
  setupToggle(toggleConfirmPassword, confirmPasswordInput);

  // ---- existing code below (unchanged) ----
  const params = new URLSearchParams(window.location.search);
  const emailFromUrl = params.get("email");
  const codeFromUrl = params.get("code");
  const isFirstTimeSetup = !emailFromUrl && !codeFromUrl;

  let hasStartedTyping = false;

  function showPopup(message, success = false) {
    popup.textContent = message;
    popup.style.backgroundColor = success ? "#4CAF50" : "#d93025";
    popup.classList.add("show");
    setTimeout(() => popup.classList.remove("show"), 2500);
  }

  passwordInput.addEventListener("input", () => {
    const value = passwordInput.value;

    if (!hasStartedTyping && value.length > 0) {
      checklist.style.display = "block";
      hasStartedTyping = true;
    }

    const hasLowercase = /[a-z]/.test(value);
    const hasUppercase = /[A-Z]/.test(value);
    const hasNumber = /\d/.test(value);
    const hasSpecial = /[!@#$%^&*(),.?":{}|<>]/.test(value);
    const hasLength = value.length >= 8;

    document.querySelector(".lowercase").classList.toggle("checked", hasLowercase);
    document.querySelector(".uppercase").classList.toggle("checked", hasUppercase);
    document.querySelector(".number").classList.toggle("checked", hasNumber);
    document.querySelector(".special").classList.toggle("checked", hasSpecial);
    document.querySelector(".length").classList.toggle("checked", hasLength);

    if (value.trim() === "") {
      checklist.style.display = "none";
      hasStartedTyping = false;
    }
  });

  submitBtn.addEventListener("click", async (e) => {
    e.preventDefault();

    const password = passwordInput.value.trim();
    const confirm = confirmPasswordInput.value.trim();

    const valid =
      /[a-z]/.test(password) &&
      /[A-Z]/.test(password) &&
      /\d/.test(password) &&
      /[!@#$%^&*(),.?":{}|<>]/.test(password) &&
      password.length >= 8;

    if (password === "" || confirm === "") {
      showPopup("Please fill in all password fields.");
      return;
    }

    if (!valid) {
      showPopup("Password does not meet all requirements.");
      return;
    }

    if (password !== confirm) {
      showPopup("Passwords do not match.");
      return;
    }

    if (isFirstTimeSetup) {
      document.getElementById("changePassForm").submit();
      return;
    }

    if (!emailFromUrl || !codeFromUrl) {
      showPopup("Invalid or expired reset link.");
      return;
    }

    try {
      const resp = await fetch("/pres/reset-password", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify({
          email: emailFromUrl,
          code: codeFromUrl,
          new_password: password,
          confirm_password: confirm,
        }),
      });

      const data = await resp.json();

      if (!resp.ok || data.success === false) {
        showPopup(data.error || "Failed to reset password.");
        return;
      }

      showPopup("Password reset successfully.", true);
      setTimeout(() => {
        window.location.href = "/pres";
      }, 2000);
    } catch (err) {
      showPopup("Network error. Please try again.");
    }
  });
});
