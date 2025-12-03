document.addEventListener("DOMContentLoaded", () => {
  let currentMonth = new Date();
  let currentFilter = "all";
  let allTransactions = [];
  let loaded = false;

  // Initialize
  updateMonthDisplay();
  loadTransactions();

  // Month navigation buttons
  document.getElementById("prev-month").addEventListener("click", () => {
    currentMonth.setMonth(currentMonth.getMonth() - 1);
    updateMonthDisplay();
    renderTransactions();
  });

  document.getElementById("next-month").addEventListener("click", () => {
    currentMonth.setMonth(currentMonth.getMonth() + 1);
    updateMonthDisplay();
    renderTransactions();
  });

  // Make month/year clickable via input[type="month"]
  const monthDisplayEl = document.getElementById("current-month");
  monthDisplayEl.style.cursor = "pointer";
  monthDisplayEl.title = "Click to change month";

  monthDisplayEl.addEventListener("click", () => {
    const picker = document.createElement("input");
    picker.type = "month";
    picker.style.position = "absolute";
    picker.style.opacity = "0";
    picker.style.pointerEvents = "none";

    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth() + 1;
    picker.value = `${year}-${String(month).padStart(2, "0")}`;

    document.body.appendChild(picker);
    picker.addEventListener("change", () => {
      if (picker.value) {
        const [yy, mm] = picker.value.split("-");
        currentMonth = new Date(parseInt(yy, 10), parseInt(mm, 10) - 1, 1);
        updateMonthDisplay();
        renderTransactions();
      }
      document.body.removeChild(picker);
    });

    picker.click();
  });

  // Filter tabs
  document.querySelectorAll(".filter-btn").forEach((btn) => {
    btn.addEventListener("click", (e) => {
      document
        .querySelectorAll(".filter-btn")
        .forEach((b) => b.classList.remove("active"));
      e.target.classList.add("active");
      currentFilter = e.target.dataset.filter;
      renderTransactions();
    });
  });

  // ---- Data loading from backend ----
  function loadTransactions() {
    fetch("/pres/api/transactions")
      .then((res) => {
        if (!res.ok) throw new Error("Failed to load transactions");
        return res.json();
      })
      .then((data) => {
        // data is an array of {id, walletid, type, date, description, amount}
        // Convert date string to Date object
        allTransactions = (data || []).map((tx) => {
          const txDate = tx.date ? new Date(tx.date) : null;
          return {
            ...tx,
            _dateObj: txDate,
          };
        });

        // Sort newest first (in case backend order changes)
        allTransactions.sort((a, b) => {
          if (!a._dateObj || !b._dateObj) return 0;
          return b._dateObj - a._dateObj;
        });

        loaded = true;
        renderTransactions();
      })
      .catch((err) => {
        console.error(err);
        const container = document.getElementById("transactions-list");
        container.innerHTML = `
          <div class="empty-state">
            <img src="/static/images/nav_history.png" alt="No transactions" />
            <h4>Error loading transactions</h4>
            <p>Please try again later.</p>
          </div>
        `;
      });
  }

  function updateMonthDisplay() {
    const months = [
      "January",
      "February",
      "March",
      "April",
      "May",
      "June",
      "July",
      "August",
      "September",
      "October",
      "November",
      "December",
    ];
    const monthDisplay = `${months[currentMonth.getMonth()]} ${currentMonth.getFullYear()}`;
    document.getElementById("current-month").textContent = monthDisplay;
  }

  function renderTransactions() {
    const container = document.getElementById("transactions-list");

    if (!loaded) {
      container.innerHTML = `
        <div class="empty-state">
          <img src="/static/images/nav_history.png" alt="Loading" />
          <h4>Loading transactions...</h4>
          <p>Please wait a moment.</p>
        </div>
      `;
      return;
    }

    // Filter by month/year first
    const targetMonth = currentMonth.getMonth();
    const targetYear = currentMonth.getFullYear();

    let filtered = allTransactions.filter((tx) => {
      if (!tx._dateObj) return false;
      return (
        tx._dateObj.getMonth() === targetMonth &&
        tx._dateObj.getFullYear() === targetYear
      );
    });

    // Filter by type
    if (currentFilter !== "all") {
      filtered = filtered.filter((tx) => tx.type === currentFilter);
    }

    // Sort newest first (by date)
    filtered.sort((a, b) => {
      if (!a._dateObj || !b._dateObj) return 0;
      return b._dateObj - a._dateObj;
    });

    // Show empty-state if nothing
    if (filtered.length === 0) {
      container.innerHTML = `
        <div class="empty-state">
          <img src="/static/images/nav_history.png" alt="No transactions" />
          <h4>No transactions found</h4>
          <p>There are no transactions for the selected month and filter.</p>
        </div>
      `;
      return;
    }

    // Single mixed list (no Income/Expense headings)
    let html = "";
    filtered.forEach((tx) => {
      html += createTransactionCard(tx);
    });

    container.innerHTML = html;
  }

  function createTransactionCard(tx) {
    const isIncome = tx.type === "income";
    const absAmount = Math.abs(Number(tx.amount || 0));
    const amountDisplay = `${isIncome ? "PHP" : "-PHP"} ${absAmount}`;

    let dateText = "";
    if (tx._dateObj && !isNaN(tx._dateObj)) {
      const opts = { year: "numeric", month: "long", day: "numeric" };
      dateText = tx._dateObj.toLocaleDateString(undefined, opts);
    } else if (tx.date) {
      dateText = tx.date;
    }

    return `
      <div class="transaction-card">
        <div class="transaction-left">
          <h5 class="transaction-event">Transaction #${tx.id}</h5>
          <p class="transaction-description">${tx.description || ""}</p>
          <span class="transaction-date">${dateText}</span>
        </div>
        <div class="transaction-right">
          <div class="transaction-amount ${isIncome ? "income" : "expense"}">
            ${amountDisplay}
          </div>
        </div>
      </div>
    `;
  }

  // Sidebar navigation handling
  const navItems = document.querySelectorAll(".nav-item");
  navItems.forEach((item) => {
    item.addEventListener("click", () => {
      navItems.forEach((i) => i.classList.remove("active"));
      item.classList.add("active");
    });
  });
});
