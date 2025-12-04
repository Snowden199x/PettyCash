document.addEventListener("DOMContentLoaded", () => {
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

  // Load dashboard data
  loadDashboardData();

  setupProfileDropdown();
  setupHeaderSearch();
});

async function loadDashboardData() {
  try {
    // 1) Summary
    const summaryResponse = await fetch("/pres/api/dashboard/summary");
    if (summaryResponse.ok) {
      const summary = await summaryResponse.json();
      updateSummaryCards(summary);
    }

    // 2) Wallet overview
    const walletsResponse = await fetch("/pres/api/wallets/overview");
    if (walletsResponse.ok) {
      const wallets = await walletsResponse.json();
      if (wallets.length > 0) {
        loadWallets(wallets);
      } else {
        showEmptyWallets();
      }
    } else {
      showEmptyWallets();
    }

    // 3) Recent transactions
    // inside loadDashboardData()
const transactionsResponse = await fetch("/pres/api/transactions");
if (transactionsResponse.ok) {
  const all = await transactionsResponse.json();
  const recent = Array.isArray(all) ? all.slice(0, 5) : [];
  if (recent.length > 0) {
    loadTransactions(recent);
  } else {
    showEmptyTransactions();
  }
} else {
  showEmptyTransactions();
}

  } catch (err) {
    console.error("Error loading dashboard data:", err);
    showEmptyWallets();
    showEmptyTransactions();
  }
}

function updateSummaryCards(summary) {
  document.getElementById("total-balance").textContent =
    `Php ${summary.total_balance.toLocaleString("en-PH", { minimumFractionDigits: 2 })}`;
  document.getElementById("reports-submitted").textContent =
    summary.reports_submitted;
  document.getElementById("income-month").textContent =
    `Php ${summary.income_month.toLocaleString("en-PH", { minimumFractionDigits: 2 })}`;
  document.getElementById("expenses-month").textContent =
    `Php ${summary.expenses_month.toLocaleString("en-PH", { minimumFractionDigits: 2 })}`;
}


function loadWallets(wallets) {
  const walletsContainer = document.getElementById("wallets-container");

  walletsContainer.innerHTML = wallets.map(folder => {
    const totalBudget = folder.budget || 0;
    const used = folder.total_expenses || 0;
    const progress = totalBudget > 0 ? (used / totalBudget) * 100 : 0;

    return `
      <div class="wallet-card">
        <div class="wallet-icon">
          <img src="/pres/static/images/wallet.png"
               alt="Wallet"
               onerror="this.style.display='none'" />
        </div>
        <div class="wallet-details">
          <h5>${folder.name}</h5>
          <p class="budget-text">Budget Used</p>
          <p class="budget-amount">
            Php ${used.toLocaleString()}/Php ${totalBudget.toLocaleString()}
          </p>
          <div class="progress-bar">
            <div class="progress-fill" style="width: ${progress}%"></div>
          </div>
          <div class="wallet-stats">
            <span class="income-stat">
              Income: Php ${(folder.total_income || 0).toLocaleString()}
            </span>
            <span class="expense-stat">
              Expenses: Php ${(folder.total_expenses || 0).toLocaleString()}
            </span>
          </div>
        </div>
      </div>
    `;
  }).join("");
}




function loadTransactions(transactions) {
  const transactionsContainer = document.getElementById("transactions-container");
  if (!transactionsContainer) return;

  transactionsContainer.innerHTML = transactions.map(tx => {
    const dateObj = new Date(tx.date);
    const formattedDate = dateObj.toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });

    // Build middle line:
    const parts = [];
    // price x quantity
    parts.push(`Php ${tx.price.toLocaleString()} x ${tx.quantity}`);

    if (tx.type === "income" && tx.income_type) {
      // income: price x qty - type of income - description
      parts.push(tx.income_type);
    } else if (tx.type === "expense" && tx.particulars) {
      // expense: price x qty - particulars - description
      parts.push(tx.particulars);
    }

    if (tx.description) {
      parts.push(tx.description);
    }

    const middleLine = parts.join(" - ");
    const totalDisplay = `Php ${tx.total_amount.toLocaleString()}`;
    const txYear = new Date(tx.date).getFullYear();

    return `
      <div class="transaction-item ${tx.type}">
        <div class="transaction-info">
          <h5>${tx.wallet_name} ${txYear}</h5>
          <p>${middleLine}</p>
          <span class="transaction-date">${formattedDate}</span>
        </div>
        <div class="transaction-amount ${tx.type}">
          ${totalDisplay}
        </div>
      </div>
    `;
  }).join("");
}


function showEmptyWallets() {
  const walletsContainer = document.getElementById("wallets-container");
  walletsContainer.innerHTML = `
    <div class="empty-card">
      <img src="/pres/static/images/nav_wallet.png" alt="Wallet Icon" />
      <p>No wallets yet</p>
      <small>Create your first wallet to start tracking your finances</small>
    </div>
  `;
}

function showEmptyTransactions() {
  const transactionsContainer = document.getElementById("transactions-container");
  transactionsContainer.innerHTML = `
    <div class="empty-card">
      <img src="/pres/static/images/nav_history.png" alt="History Icon" />
      <p>No transactions yet</p>
      <small>Your transaction history will appear here once you add entries</small>
    </div>
  `;
}

function showEmptyState() {
  showEmptyWallets();
  showEmptyTransactions();
}

function setupProfileDropdown() {
  const toggle = document.getElementById("profile-dropdown-toggle");
  const menu = document.getElementById("profile-menu");
  if (!toggle || !menu) return;

  toggle.addEventListener("click", (e) => {
    e.stopPropagation();
    const isVisible = menu.style.display === "block";
    menu.style.display = isVisible ? "none" : "block";
  });

  document.addEventListener("click", () => {
    if (menu.style.display === "block") {
      menu.style.display = "none";
    }
  });
}

function setupHeaderSearch() {
  const input = document.getElementById("header-search");
  const walletsContainer = document.getElementById("wallets-container");
  const transactionsContainer = document.getElementById("transactions-container");
  if (!input || !walletsContainer || !transactionsContainer) return;

  input.addEventListener("input", () => {
    const term = input.value.toLowerCase().trim();

    walletsContainer.querySelectorAll(".wallet-card").forEach(card => {
      const text = card.textContent.toLowerCase();
      card.style.display = text.includes(term) ? "" : "none";
    });

    transactionsContainer.querySelectorAll(".transaction-item").forEach(item => {
      const text = item.textContent.toLowerCase();
      item.style.display = text.includes(term) ? "" : "none";
    });
  });
}
