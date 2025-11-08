document.addEventListener("DOMContentLoaded", () => {
  console.log("✅ forgot_password.js connected!");

  const form = document.getElementById("forgotForm");
  const usernameInput = document.getElementById("username");
  const errorMessage = document.getElementById("error-message");
  const card = document.querySelector(".card");

  // Function to show error and shake animation
  function showError(message) {
    errorMessage.textContent = message;
    errorMessage.classList.add("show");
    usernameInput.classList.add("error");
    card.classList.add("shake");

    setTimeout(() => {
      card.classList.remove("shake");
    }, 400);
  }

  // Clear error when user types
  usernameInput.addEventListener("input", () => {
    errorMessage.textContent = "";
    errorMessage.classList.remove("show");
    usernameInput.classList.remove("error");
  });

  // Form submission handler
  form.addEventListener("submit", (e) => {
    e.preventDefault();

    const username = usernameInput.value.trim();

    if (username === "") {
      showError("Please enter your username before continuing.");
      return;
    }

    // Example demo users - replace with your DB logic
    const existingUsers = ["demo", "admin", "user123", "pocki"];
    if (!existingUsers.includes(username)) {
      showError("Username not found.");
      return;
    }

    // Success - you can replace this with your actual password reset logic
    alert("Password reset instructions have been sent to your registered email!");
    form.reset();
  });
});