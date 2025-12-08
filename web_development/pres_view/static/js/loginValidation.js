document.addEventListener("DOMContentLoaded", function () {
  const form = document.getElementById("loginForm");
  const usernameInput = document.getElementById("username");
  const passwordInput = document.getElementById("password");
  const usernameError = document.getElementById("usernameError");
  const passwordError = document.getElementById("passwordError");
  const togglePassword = document.getElementById("togglePassword");

  // reset shake after animation
  usernameInput.addEventListener("animationend", () => {
    usernameInput.classList.remove("shake");
  });
  passwordInput.addEventListener("animationend", () => {
    passwordInput.classList.remove("shake");
  });

  // ---- 1) CLIENT‑SIDE EMPTY‑FIELD VALIDATION ----
  form.addEventListener("submit", function (e) {
    e.preventDefault();

    let valid = true;
    usernameError.style.display = "none";
    passwordError.style.display = "none";

    const username = usernameInput.value.trim();
    const password = passwordInput.value.trim();

    if (username === "") {
      usernameError.textContent =
        "We couldn’t find an account with that username. Please check OSAS to continue.";
      usernameError.style.display = "block";

      usernameInput.classList.remove("shake");
      void usernameInput.offsetWidth;
      usernameInput.classList.add("shake");
      valid = false;
    }

    if (password === "") {
      passwordError.textContent = "Incorrect password. Please try again.";
      passwordError.style.display = "block";

      passwordInput.classList.remove("shake");
      void passwordInput.offsetWidth;
      passwordInput.classList.add("shake");
      valid = false;
    }

    if (valid) {
      form.submit(); // send to Flask
    }
  });

  // ---- 2) SHAKE ON BACKEND ERROR (FLASH) ----
  const flashError = document.querySelector(".flash-message.danger");
  if (flashError) {
    // backend said "incorrect password" or similar
    passwordInput.classList.remove("shake");
    void passwordInput.offsetWidth;
    passwordInput.classList.add("shake");
  }

  // ---- 3) SHOW / HIDE PASSWORD (unchanged) ----
  if (togglePassword && passwordInput) {
    const showSrc = togglePassword.getAttribute("data-show-src");
    const hideSrc = togglePassword.getAttribute("data-hide-src");

    togglePassword.addEventListener("click", function () {
      const isHidden = passwordInput.type === "password";
      passwordInput.type = isHidden ? "text" : "password";
      this.src = isHidden ? hideSrc : showSrc;
      this.alt = isHidden ? "Hide password" : "Show password";
    });
  }
});
