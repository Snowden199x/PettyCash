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
    // 1) Get all wallet folders (same endpoint used by wallets.js)
    const walletsRes = await fetch("/pres/api/wallets");
    if (!walletsRes.ok) throw new Error("Failed to load wallets");
    const walletsData = await walletsRes.json();
    allWalletsMeta = walletsData || [];
    // walletsData: [{ id (folderId), walletid, name, month, beginningcash }]

    const folderIds = (walletsData || []).map((w) => w.id);

    if (!folderIds.length) {
      allTransactions = [];
      loaded = true;
      renderTransactions();
      return;
    }

    // 2) For each folder, get its transactions
    const txPromises = folderIds.map((folderId) =>
      fetch(`/pres/api/wallets/${folderId}/transactions`).then((res) => {
        if (!res.ok) return [];
        return res.json();
      }).catch(() => [])
    );

    const allByFolder = await Promise.all(txPromises);

    // 3) Flatten + map to common shape
    // Endpoint returns: id, quantity, price, incometype, particulars,
    // description, totalamount, dateissued, kind. [file:2]
    const flat = [];

    allByFolder.forEach((folderTxs, idx) => {
      const folderId = folderIds[idx];
      const walletMeta = walletsData.find((w) => w.id === folderId);
      const walletName = walletMeta ? walletMeta.name : `Wallet ${folderId}`;

      (folderTxs || []).forEach((tx) => {
        const qty = Number(tx.quantity || 0);
        const price = Number(tx.price || 0);
        const total = Number(tx.total_amount || qty * price);
        const kind = tx.kind; // "income" or "expense"
        const amount =
          kind === "expense" ? -Number(total || 0) : Number(total || 0);

        const dateStr = tx.date_issued; // ISO string
        const txDate = dateStr ? new Date(dateStr) : null;

        flat.push({
          id: tx.id,
          folderId,
          walletId: walletMeta ? walletMeta.walletid : null,
          walletName,
          quantity: qty,
          price: price,
          incometype: tx.incometype || "",
          particulars: tx.particulars || "",
          rawdescription: tx.description || "",
          type: kind,
          amount,
          date: dateStr,
          _dateObj: txDate,
        });
      });
    });

    // Sort newest first
    flat.sort((a, b) => {
      if (!a._dateObj || !b._dateObj) return 0;
      return b._dateObj - a._dateObj;
    });

    allTransactions = flat;
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

// find folderIds whose wallet_budgets.month matches target year+month
const targetFolderIds = (allWalletsMeta || [])
  .filter((w) => {
    const m = w.month || "";        // "yyyy-mm"
    const y = Number(m.slice(0, 4));
    const mm = Number(m.slice(5, 7)); // 1-12
    return y === targetYear && mm === targetMonthIndex + 1;
  })
  .map((w) => w.id);

let filtered = allTransactions.filter((tx) =>
  targetFolderIds.includes(tx.folderId)
);

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
