document.addEventListener("DOMContentLoaded", () => {
  let currentMonth = new Date();
  let currentFilter = "all";
  let allTransactions = [];
  let loaded = false;
  let allWalletsMeta = [];

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
async function loadTransactions() {
  loaded = false;
  const container = document.getElementById("transactions-list");
  container.innerHTML = `
    <div class="empty-state">
      <img src="/pres/static/images/nav_history.png" alt="Loading" />
      <h4>Loading transactions...</h4>
      <p>Please wait a moment.</p>
    </div>
  `;

  try {
    const res = await fetch("/pres/api/transactions/recent");
    if (!res.ok) throw new Error("Failed to load transactions");
    const data = await res.json();

    // Map to the shape renderTransactions/createTransactionCard expect
    allTransactions = (data || []).map(tx => {
      const qty = Number(tx.quantity || 0);
      const price = Number(tx.price || 0);
      const amount = Number(
        tx.total_amount != null ? tx.total_amount : qty * price
      );

      let d = null;
      if (tx.date) {
        const tmp = new Date(tx.date);
        d = isNaN(tmp) ? null : tmp;
      }

      return {
        id: tx.id,
        folderId: null,
        walletId: null,
        walletName: tx.wallet_name || "Wallet",
        quantity: qty,
        price: price,
        incometype: tx.income_type || "",
        particulars: tx.particulars || "",
        rawdescription: tx.description || "",
        type: tx.type, // "income"/"expense"
        amount: tx.type === "expense" ? -amount : amount,
        date: tx.date,
        _dateObj: d,
      };
    });

    // newest first
    allTransactions.sort((a, b) => {
      if (!a._dateObj || !b._dateObj) return 0;
      return b._dateObj - a._dateObj;
    });

    loaded = true;
    renderTransactions();
  } catch (err) {
    console.error(err);
    container.innerHTML = `
      <div class="empty-state">
        <img src="/pres/static/images/nav_history.png" alt="No transactions" />
        <h4>Error loading transactions</h4>
        <p>Please try again later.</p>
      </div>
    `;
  }
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
          <img src="/pres/static/images/nav_history.png" alt="Loading" />
          <h4>Loading transactions...</h4>
          <p>Please wait a moment.</p>
        </div>
      `;
      return;
    }

   // Filter by wallet month/year (folder) ONLY, ignore tx date
const targetMonthIndex = currentMonth.getMonth(); // 0-11
const targetYear = currentMonth.getFullYear();

let filtered = allTransactions.filter((tx) => {
  if (!tx._dateObj || isNaN(tx._dateObj)) return false;
  return (
    tx._dateObj.getFullYear() === targetYear &&
    tx._dateObj.getMonth() === targetMonthIndex
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
          <img src="/pres/static/images/nav_history.png" alt="No transactions" />
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

// make each date clickable to jump to that month/year
const dateEls = container.querySelectorAll(".transaction-date");
dateEls.forEach((el) => {
  el.style.cursor = "pointer";
  el.title = "Click to go to this month";

  // remove old listener if re-rendered
  el.onclick = null;

  el.addEventListener("click", () => {
    const dateStr = el.dataset.date;
    if (!dateStr) return;

    const d = new Date(dateStr);
    if (isNaN(d)) return;

    currentMonth = new Date(d.getFullYear(), d.getMonth(), 1);
    updateMonthDisplay();
    renderTransactions();
  });
});


  }

function createTransactionCard(tx) {
  const qty = Number(tx.quantity || 0);
  const price = Number(tx.price || 0);
  const total = qty * price;

  let labelCore;
  if (tx.type === "income") {
    // price x qty (total) - incometype
    labelCore = `${price} x ${qty} (${total}) - ${tx.incometype || ""}`;
  } else {
    // qty x price (total) - particulars
    labelCore = `${qty} x ${price} (${total}) - ${tx.particulars || ""}`;
  }

  const mainLabel = tx.rawdescription
    ? `${labelCore} - ${tx.rawdescription}`
    : labelCore;

  const amountNum = Number(tx.amount || 0);
  const isIncome = tx.type === "income";
  const amountDisplay =
    amountNum < 0 ? `-PHP ${Math.abs(amountNum)}` : `PHP ${amountNum}`;

  let dateText = "";
  if (tx._dateObj && !isNaN(tx._dateObj)) {
    dateText = tx._dateObj.toISOString().slice(0, 10); // yyyy-mm-dd
  } else if (tx.date) {
    dateText = tx.date;
  }

const title = (tx.walletName || "").toUpperCase();

  return `
    <div class="transaction-card">
      <div class="transaction-left">
        <h5>${title}</h5>
        <p>${mainLabel}</p>
        <span class="transaction-date"
          data-date="${dateText}">${dateText}</span>
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
