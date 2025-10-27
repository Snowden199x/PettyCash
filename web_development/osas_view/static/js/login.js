document.addEventListener("DOMContentLoaded", function () {
  const form = document.getElementById("adminLoginForm");
  const usernameInput = document.getElementById("username");
  const passwordInput = document.getElementById("password");
  const usernameError = document.getElementById("usernameError");
  const passwordError = document.getElementById("passwordError");

  form.addEventListener("submit", function (e) {
    let valid = true;

    // Reset errors
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

    // Remove shake class after animation ends
    setTimeout(() => {
      usernameInput.classList.remove("shake");
      passwordInput.classList.remove("shake");
    }, 500);

    if (!valid) {
      e.preventDefault(); // ❌ Prevent submit kung may error
    }
    // Kung valid, auto-submit na sa Flask
  });
});
