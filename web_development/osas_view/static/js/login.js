document.addEventListener("DOMContentLoaded", function () {
  const form = document.getElementById("adminLoginForm");
  const usernameInput = document.getElementById("username");
  const passwordInput = document.getElementById("password");
  const usernameError = document.getElementById("usernameError");
  const passwordError = document.getElementById("passwordError");
  const togglePassword = document.getElementById("togglePassword");

  // existing validation...
  form.addEventListener("submit", function (e) {
    let valid = true;

    usernameError.style.display = "none";
    passwordError.style.display = "none";
    usernameInput.classList.remove("shake");
    passwordInput.classList.remove("shake");

    const username = usernameInput.value.trim();
    const password = passwordInput.value.trim();

    if (username === "") {
      usernameError.textContent = "Please enter your username.";
      usernameError.style.display = "block";
      usernameInput.classList.add("shake");
      valid = false;
    }

    if (password === "") {
      passwordError.textContent = "Please enter your password.";
      passwordError.style.display = "block";
      passwordInput.classList.add("shake");
      valid = false;
    }

    setTimeout(() => {
      usernameInput.classList.remove("shake");
      passwordInput.classList.remove("shake");
    }, 500);

    if (!valid) {
      e.preventDefault();
    }
  });

  // toggle show/hide password with image
  if (togglePassword) {
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
