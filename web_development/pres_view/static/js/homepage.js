document.addEventListener("DOMContentLoaded", () => {
  // Username display
  const username = localStorage.getItem("username") || "User";
  document.getElementById("username").textContent = username;

  // Live date display
  const dateElement = document.querySelector(".date-text");
  const today = new Date();
  const options = { weekday: "long", month: "long", day: "numeric" };
  dateElement.textContent = today.toLocaleDateString("en-US", options);

  // Sidebar active nav handling
  const navItems = document.querySelectorAll(".nav-item");
  navItems.forEach(item => {
    item.addEventListener("click", () => {
      navItems.forEach(i => i.classList.remove("active"));
      item.classList.add("active");
    });
  });
});
