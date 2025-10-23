document.addEventListener("DOMContentLoaded", () => {
  // Set username if available
  const username = localStorage.getItem("username");
  if (username) {
    document.getElementById("username").textContent = username;
  }

  // Set current date dynamically
  const dateElement = document.querySelector(".header p");
  const today = new Date();
  const options = { weekday: "long", month: "long", day: "numeric" };
  const formattedDate = today.toLocaleDateString("en-US", options);
  dateElement.textContent = formattedDate;

  // + New button example action
  document.querySelector(".new-btn").addEventListener("click", () => {
    alert("Redirecting to Add Wallet page...");
    // window.location.href = '/add_wallet';
  });
});
