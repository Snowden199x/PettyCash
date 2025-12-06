document.addEventListener("DOMContentLoaded", () => {
  console.log("✅ forgot_password.js connected!");

  const form = document.getElementById("forgotForm");
  const input = document.getElementById("username"); // Username or Email field
  const errorMessage = document.getElementById("error-message");
  const successMessage = document.getElementById("success-message");
  const card = document.querySelector(".card");

  function showError(message) {
    if (!message) {
      errorMessage.textContent = "";
      errorMessage.classList.remove("show");
      input.classList.remove("error");
      return;
    }
    // hide success when showing error
    successMessage.textContent = "";
    successMessage.classList.remove("show");

    errorMessage.textContent = message;
    errorMessage.classList.add("show");
    input.classList.add("error");
    card.classList.add("shake");
    setTimeout(() => {
      card.classList.remove("shake");
    }, 400);
  }

  function showSuccess(message) {
    // clear error styles
    errorMessage.textContent = "";
    errorMessage.classList.remove("show");
    input.classList.remove("error");

    successMessage.textContent = message;
    successMessage.classList.add("show");

    // optional auto-hide
    setTimeout(() => {
      successMessage.classList.remove("show");
    }, 4000);
  }

  function clearError() {
    showError("");
  }

  input.addEventListener("input", clearError);

  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    const identifier = input.value.trim(); // username or email

    if (!identifier) {
      showError("Please enter your username or email before continuing.");
      return;
    }

    try {
      const resp = await fetch("/pres/forgot-password", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify({ email: identifier }),
      });

      const data = await resp.json();

      if (!resp.ok || data.success === false) {
        showError(data.error || "Something went wrong. Please try again.");
        return;
      }

      form.reset();
      showSuccess("See the reset details in your email.");
    } catch (err) {
      console.error(err);
      showError("Network error. Please try again.");
    }
  });
});
