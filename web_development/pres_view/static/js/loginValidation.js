document.addEventListener("DOMContentLoaded", function () {
  const form = document.getElementById("loginForm");
  const usernameInput = document.getElementById("username");
  const passwordInput = document.getElementById("password");
  const usernameError = document.getElementById("usernameError");
  const passwordError = document.getElementById("passwordError");

  form.addEventListener("submit", function (e) {
    e.preventDefault();

    let valid = true;

    // Reset previous errors and animations
    usernameError.style.display = "none";
    passwordError.style.display = "none";
    usernameInput.classList.remove("shake");
    passwordInput.classList.remove("shake");

    const username = usernameInput.value.trim();
    const password = passwordInput.value.trim();

    // Username validation
    if (username === "") {
      usernameError.textContent =
        "We couldn’t find an account with that username. Please check OSAS to continue.";
      usernameError.style.display = "block";
      usernameInput.classList.add("shake");
      valid = false;
    }

    // Password validation
    if (password === "") {
      passwordError.textContent = "Incorrect password. Please try again.";
      passwordError.style.display = "block";
      passwordInput.classList.add("shake");
      valid = false;
    }

    // Remove the shake after animation ends (so it can replay next time)
    setTimeout(() => {
      usernameInput.classList.remove("shake");
      passwordInput.classList.remove("shake");
    }, 500);

    if (valid) {
      form.submit(); // Let Flask handle the login
    }
  });
});
