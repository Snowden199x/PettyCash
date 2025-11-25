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
});

async function loadDashboardData() {
  try {
    // Fetch summary data
    const summaryResponse = await fetch('/api/dashboard/summary');
    if (summaryResponse.ok) {
      const summary = await summaryResponse.json();
      updateSummaryCards(summary);
    }

    // Fetch wallets
    const walletsResponse = await fetch('/api/wallets');
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

    // Fetch recent transactions
    const transactionsResponse = await fetch('/api/transactions');
    if (transactionsResponse.ok) {
      const transactions = await transactionsResponse.json();
      if (transactions.length > 0) {
        loadTransactions(transactions.slice(0, 5)); // Show only 5 recent
      } else {
        showEmptyTransactions();
      }
    } else {
      showEmptyTransactions();
    }
  } catch (error) {
    console.error('Error loading dashboard data:', error);
    showEmptyState();
  }
}

function updateSummaryCards(summary) {
  document.getElementById("total-balance").textContent = `Php ${summary.total_balance.toLocaleString('en-PH', { minimumFractionDigits: 2 })}`;
  document.getElementById("total-events").textContent = summary.total_events;
  document.getElementById("income-month").textContent = `Php ${summary.income_month.toLocaleString('en-PH', { minimumFractionDigits: 2 })}`;
  document.getElementById("expenses-month").textContent = `Php ${summary.expenses_month.toLocaleString('en-PH', { minimumFractionDigits: 2 })}`;
}

function loadWallets(wallets) {
  const walletsContainer = document.getElementById("wallets-container");
  
  walletsContainer.innerHTML = wallets.slice(0, 2).map(wallet => {
    const progress = wallet.total_expenses / (wallet.beginning_cash + wallet.total_income) * 100;
    
    return `
      <div class="wallet-card">
        <div class="wallet-icon">
          <img src="/static/images/wallet_card.png" alt="Wallet" onerror="this.style.display='none'" />
        </div>
        <div class="wallet-details">
          <h5>${wallet.name}</h5>
          <p class="budget-text">Budget Used</p>
          <p class="budget-amount">Php ${wallet.total_expenses.toLocaleString()}/Php ${(wallet.beginning_cash + wallet.total_income).toLocaleString()}</p>
          <div class="progress-bar">
            <div class="progress-fill" style="width: ${progress}%"></div>
          </div>
          <div class="wallet-stats">
            <span class="income-stat">Income: Php ${wallet.total_income.toLocaleString()}</span>
            <span class="expense-stat">Expenses: Php ${wallet.total_expenses.toLocaleString()}</span>
          </div>
        </div>
      </div>
    `;
  }).join('');
}

function loadTransactions(transactions) {
  const transactionsContainer = document.getElementById("transactions-container");
  
  transactionsContainer.innerHTML = transactions.map(tx => {
    const date = new Date(tx.date);
    const formattedDate = date.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
    const amountDisplay = tx.amount < 0 ? `-PHP ${Math.abs(tx.amount)}` : `PHP ${tx.amount}`;
    
    return `
      <div class="transaction-item ${tx.type}">
        <div class="transaction-info">
          <h5>${tx.event}</h5>
          <p>${tx.description}</p>
          <span class="transaction-date">${formattedDate}</span>
        </div>
        <div class="transaction-amount ${tx.type}">
          ${amountDisplay}
        </div>
      </div>
    `;
  }).join('');
}

function showEmptyWallets() {
  const walletsContainer = document.getElementById("wallets-container");
  walletsContainer.innerHTML = `
    <div class="empty-card">
      <img src="/static/images/nav_wallet.png" alt="Wallet Icon" />
      <p>No wallets yet</p>
      <small>Create your first wallet to start tracking your finances</small>
    </div>
  `;
}

function showEmptyTransactions() {
  const transactionsContainer = document.getElementById("transactions-container");
  transactionsContainer.innerHTML = `
    <div class="empty-card">
      <img src="/static/images/nav_history.png" alt="History Icon" />
      <p>No transactions yet</p>
      <small>Your transaction history will appear here once you add entries</small>
    </div>
  `;
}

function showEmptyState() {
  showEmptyWallets();
  showEmptyTransactions();
}