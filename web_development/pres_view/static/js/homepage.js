document.addEventListener("DOMContentLoaded", async () => {
  // Live date display
  const dateElement = document.querySelector(".date-text");
  const today = new Date();
  const options = { weekday: "long", month: "long", day: "numeric" };
  if (dateElement) {
    dateElement.textContent = today.toLocaleDateString("en-US", options);
  }
  const monthName = today.toLocaleDateString("en-US", { month: "long" });
  const incomeLabelEl = document.getElementById("income-month-label");
  const expensesLabelEl = document.getElementById("expenses-month-label");
  if (incomeLabelEl) {
    incomeLabelEl.textContent = `Income this ${monthName}`;
  }
  if (expensesLabelEl) {
    expensesLabelEl.textContent = `Expenses this ${monthName}`;
  }

  // Sidebar active nav handling
  const navItems = document.querySelectorAll(".nav-item");
  navItems.forEach((item) => {
    item.addEventListener("click", () => {
      navItems.forEach((i) => i.classList.remove("active"));
      item.classList.add("active");
    });
  });

  // Load org profile for top-right avatar
  try {
    const res = await fetch("/pres/api/profile");
    if (res.ok) {
      const profile = await res.json();
      const avatarImg = document.querySelector(".profile-avatar");
      const nameSpan = document.querySelector(".profile-name");

      // default avatar na galing sa HTML, papalitan lang kung may na-save na photo
      if (avatarImg && profile.profile_photo_url) {
        avatarImg.src = profile.profile_photo_url;
      }
      if (nameSpan && profile.org_name) {
        nameSpan.textContent = profile.org_name;
      }
    }
  } catch (err) {
    console.error("Failed to load header profile:", err);
  }

  // Load dashboard data
  loadDashboardData();

  setupProfileDropdown();
  setupHeaderSearch();
});

async function loadDashboardData() {
  const loader = document.getElementById("dashboard-loader");
  const content = document.getElementById("dashboard-content");

  // show loader, hide dashboard
  if (loader) loader.style.display = "flex";
  if (content) content.style.display = "none";

  try {
    // Get summary data
    const summaryRes = await fetch("/pres/api/dashboard/summary");
    if (!summaryRes.ok) {
      throw new Error("Failed to load dashboard summary");
    }
    const summary = await summaryRes.json();

    // Get wallets from /pres/api/wallets/overview
    // This returns wallets with transactions, sorted by most recent activity
    const walletsRes = await fetch("/pres/api/wallets/overview");
    if (!walletsRes.ok) {
      throw new Error("Failed to load wallets overview");
    }
    const wallets = await walletsRes.json() || [];

    // Get recent transactions
    const txRes = await fetch("/pres/api/transactions/recent");
    if (!txRes.ok) {
      throw new Error("Failed to load recent transactions");
    }
    const recent = await txRes.json() || [];

    // Summary cards
    updateSummaryCards(summary);

    // Wallets (now from /wallets/overview, only those with transactions)
    if (wallets.length > 0) {
      loadWallets(wallets);
    } else {
      showEmptyWallets();
    }

    // Recent transactions
    if (recent.length > 0) {
      loadTransactions(recent);
    } else {
      showEmptyTransactions();
    }
  } catch (err) {
    console.error("Error loading dashboard data:", err);
    showEmptyWallets();
    showEmptyTransactions();
  } finally {
    // hide loader, show dashboard
    if (loader) loader.style.display = "none";
    if (content) content.style.display = "block";
  }
}

function updateSummaryCards(summary) {
  const totalBalanceEl = document.getElementById("total-balance");
  const reportsEl = document.getElementById("reports-submitted");
  const incomeEl = document.getElementById("income-month");
  const expensesEl = document.getElementById("expenses-month");

  if (totalBalanceEl) {
    totalBalanceEl.textContent = `Php ${summary.total_balance.toLocaleString(
      "en-PH",
      { minimumFractionDigits: 2 }
    )}`;
  }
  if (reportsEl) {
    reportsEl.textContent = summary.reports_submitted;
  }
  if (incomeEl) {
    incomeEl.textContent = `Php ${summary.income_month.toLocaleString("en-PH", {
      minimumFractionDigits: 2,
    })}`;
  }
  if (expensesEl) {
    expensesEl.textContent = `Php ${summary.expenses_month.toLocaleString(
      "en-PH",
      { minimumFractionDigits: 2 }
    )}`;
  }
}

function loadWallets(wallets) {
  const walletsContainer = document.getElementById("wallets-container");
  if (!walletsContainer) return;

  walletsContainer.innerHTML = wallets
    .map((folder) => {
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
    })
    .join("");
}

function loadTransactions(transactions) {
  const container = document.getElementById("transactions-container");
  if (!container) return;

  container.innerHTML = transactions
    .map((tx) => {
      const dateObj = new Date(tx.date);
      const formattedDate = dateObj.toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
      });

      const parts = [];
      parts.push(
        `Php ${Number(tx.price || 0).toLocaleString()} x ${Number(
          tx.quantity || 0
        )}`
      );

      if (tx.type === "income" && tx.income_type) {
        parts.push(tx.income_type);
      } else if (tx.type === "expense" && tx.particulars) {
        parts.push(tx.particulars);
      }

      if (tx.description) parts.push(tx.description);

      const middleLine = parts.join(" - ");
      const totalDisplay = `Php ${Number(
        tx.total_amount || 0
      ).toLocaleString()}`;

      return `
        <div class="transaction-item ${tx.type}">
          <div class="transaction-info">
            <h5>${tx.wallet_name || ""}</h5>
            <p>${middleLine}</p>
            <span class="transaction-date">${formattedDate}</span>
          </div>
          <div class="transaction-amount ${tx.type}">
            ${totalDisplay}
          </div>
        </div>
      `;
    })
    .join("");
}

function showEmptyWallets() {
  const walletsContainer = document.getElementById("wallets-container");
  if (!walletsContainer) return;

  walletsContainer.innerHTML = `
    <div class="empty-card">
      <img src="/pres/static/images/nav_wallet.png" alt="Wallet Icon" />
      <p>No wallets yet</p>
      <small>Create your first wallet to start tracking your finances</small>
    </div>
  `;
}

function showEmptyTransactions() {
  const transactionsContainer = document.getElementById(
    "transactions-container"
  );
  if (!transactionsContainer) return;

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

// Header search: live filter + Enter → wallets page
function setupHeaderSearch() {
  const input = document.getElementById("header-search");
  const walletsContainer = document.getElementById("wallets-container");
  const transactionsContainer = document.getElementById(
    "transactions-container"
  );
  if (!input || !walletsContainer || !transactionsContainer) return;

  // live filter sa homepage
  input.addEventListener("input", () => {
    const term = input.value.toLowerCase().trim();

    walletsContainer.querySelectorAll(".wallet-card").forEach((card) => {
      const text = card.textContent.toLowerCase();
      card.style.display = text.includes(term) ? "" : "none";
    });

    transactionsContainer
      .querySelectorAll(".transaction-item")
      .forEach((item) => {
        const text = item.textContent.toLowerCase();
        item.style.display = text.includes(term) ? "" : "none";
      });
  });

  // Enter → redirect to wallets page with query
  input.addEventListener("keydown", (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      const term = input.value.trim();
      if (!term) return;
      window.location.href = `/pres/wallets?search=${encodeURIComponent(term)}`;
    }
  });
}