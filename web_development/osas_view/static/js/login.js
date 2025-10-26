document.addEventListener("DOMContentLoaded", function() {
  const form = document.getElementById("adminLoginForm");
  const usernameInput = document.getElementById("username");
  const passwordInput = document.getElementById("password");
  const usernameError = document.getElementById("usernameError");
  const passwordError = document.getElementById("passwordError");

  form.addEventListener("submit", function(e) {
    e.preventDefault();

    let valid = true;

    // Reset errors
    usernameError.style.display = "none";
    passwordError.style.display = "none";
    usernameInput.classList.remove("shake");
    passwordInput.classList.remove("shake");

    const username = usernameInput.value.trim();
    const password = passwordInput.value.trim();

    if (username === "") {
      usernameError.textContent = "Incorrect username. Please try again.";
      usernameError.style.display = "block";
      usernameInput.classList.add("shake");
      valid = false;
    }

    if (password === "") {
      passwordError.textContent = "Incorrect password. Please try again.";
      passwordError.style.display = "block";
      passwordInput.classList.add("shake");
      valid = false;
    }

    setTimeout(() => {
      usernameInput.classList.remove("shake");
      passwordInput.classList.remove("shake");
    }, 500);

    if (valid) {
      // Temporarily redirect to homepage with data
      window.location.href = "homepage_data.html";
    }
  });
});
