document.addEventListener("DOMContentLoaded", () => {
  const passwordInput = document.getElementById("password");
  const confirmPasswordInput = document.getElementById("confirm-password");
  const checklist = document.getElementById("password-checklist");
  const popup = document.getElementById("popup");
  const submitBtn = document.getElementById("submit-btn");

  let hasStartedTyping = false;

  // 🔔 Show popup (center-top)
  function showPopup(message, success = false) {
    popup.textContent = message;
    popup.style.backgroundColor = success ? "#4CAF50" : "#d93025";
    popup.classList.add("show");
    setTimeout(() => popup.classList.remove("show"), 2500);
  }

  // ✅ Password input typing logic
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

    // Hide checklist if cleared
    if (value.trim() === "") {
      checklist.style.display = "none";
      hasStartedTyping = false;
    }
  });

  // ✅ Validation when pressing Submit
  submitBtn.addEventListener("click", () => {
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

    // ✅ Success message
    showPopup("Password successfully set!", true);
    passwordInput.value = "";
    confirmPasswordInput.value = "";
    checklist.style.display = "none";
    hasStartedTyping = false;
    document.querySelectorAll(".checklist li").forEach(li => li.classList.remove("checked"));
  });
});
