// ../static/js/forgot_password.js

document.addEventListener("DOMContentLoaded", () => {
  console.log("✅ forgot_password.js connected!");

  const form = document.getElementById("forgotForm");
  const usernameInput = document.getElementById("username");
  const errorMessage = document.getElementById("error-message");
  const card = document.querySelector(".card");

  function showError(message) {
    console.log("⚠️ Showing error:", message);
    errorMessage.textContent = message;
    errorMessage.classList.add("show");
    card.classList.add("shake");
    usernameInput.classList.add("error");

    setTimeout(() => card.classList.remove("shake"), 400);
  }

  usernameInput.addEventListener("input", () => {
    errorMessage.textContent = "";
    errorMessage.classList.remove("show");
    usernameInput.classList.remove("error");
  });

  form.addEventListener("submit", (e) => {
    e.preventDefault();
    console.log("🧾 Form submitted!");

    const username = usernameInput.value.trim();

    if (username === "") {
      showError("Please enter your username before continuing.");
      return;
    }

    const existingUsers = ["admin", "user123", "pocki"];
    if (!existingUsers.includes(username)) {
      showError("Username not found.");
      return;
    }

    alert("Password reset instructions have been sent to your registered email!");
    form.reset();
  });
});
