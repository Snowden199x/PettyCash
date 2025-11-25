document.addEventListener("DOMContentLoaded", () => {
  let currentWallet = null;
  let currentFilter = 'all';

  // Sample wallets data
  const wallets = [
    {
      id: 1,
      name: "FEB FAIR",
      month: "February 2025",
      activity: "Feb Fair",
      beginningCash: 700,
      totalIncome: 1830,
      totalExpenses: 1500,
      endingCash: 5000
    },
    {
      id: 2,
      name: "IT DAYS",
      month: "March 2025",
      activity: "IT Days",
      beginningCash: 500,
      totalIncome: 2000,
      totalExpenses: 1200,
      endingCash: 3500
    },
    {
      id: 3,
      name: "CCS WEEK",
      month: "April 2025",
      activity: "CCS Week",
      beginningCash: 800,
      totalIncome: 2500,
      totalExpenses: 1800,
      endingCash: 4200
    },
    {
      id: 4,
      name: "MARCH",
      month: "March 2025",
      activity: "March",
      beginningCash: 600,
      totalIncome: 1500,
      totalExpenses: 1000,
      endingCash: 2800
    },
    {
      id: 5,
      name: "TEACHER'S DAY",
      month: "October 2024",
      activity: "Teacher's Day",
      beginningCash: 400,
      totalIncome: 1200,
      totalExpenses: 800,
      endingCash: 2100
    },
    {
      id: 6,
      name: "SEMINAR",
      month: "November 2024",
      activity: "Seminar",
      beginningCash: 900,
      totalIncome: 3000,
      totalExpenses: 2200,
      endingCash: 5500
    },
    {
      id: 7,
      name: "TEACHER'S DAY",
      month: "October 2025",
      activity: "Teacher's Day",
      beginningCash: 450,
      totalIncome: 1100,
      totalExpenses: 700,
      endingCash: 1900
    },
    {
      id: 8,
      name: "SEMINAR",
      month: "December 2024",
      activity: "Seminar",
      beginningCash: 1000,
      totalIncome: 3500,
      totalExpenses: 2500,
      endingCash: 6000
    },
    {
      id: 9,
      name: "FEBRUARY",
      month: "February 2025",
      activity: "February",
      beginningCash: 750,
      totalIncome: 2200,
      totalExpenses: 1600,
      endingCash: 4500
    }
  ];

  // Sample transactions for wallet details
  const walletTransactions = {
    1: [
      {
        event: "FEB FAIR",
        description: "(24) Number of Customers",
        amount: 852,
        date: "February 14, 2025",
        type: "income"
      },
      {
        event: "FEB FAIR",
        description: "(24) Number of Customers",
        amount: 515,
        date: "February 13, 2025",
        type: "income"
      },
      {
        event: "FEB FAIR",
        description: "(1 set) Bracelet Locks",
        amount: -73,
        date: "February 9, 2025",
        type: "expense"
      }
    ]
  };

  // Sample receipts
  const walletReceipts = [
    { name: "Materials", date: "Feb 11, 2025" },
    { name: "Materials", date: "Feb 11, 2025" },
    { name: "Materials", date: "Feb 11, 2025" },
    { name: "Materials", date: "Feb 11, 2025" }
  ];

  // Initialize
  renderWalletsList();

  // Event Listeners
  document.getElementById('back-to-wallets').addEventListener('click', showWalletsList);

  document.querySelectorAll('.tab-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      switchTab(e.target.dataset.tab);
    });
  });

  document.querySelectorAll('.filter-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
      e.target.classList.add('active');
      currentFilter = e.target.dataset.filter;
      renderWalletTransactions();
    });
  });

  // Functions
  function renderWalletsList() {
    // Render overview table
    const overviewTable = document.getElementById('overview-table');
    overviewTable.innerHTML = `
      <table>
        <thead>
          <tr>
            <th>Month&Activity</th>
            <th>Beginning Cash</th>
            <th>Total Income</th>
            <th>Total Expenses</th>
            <th>Ending cash</th>
          </tr>
        </thead>
        <tbody>
          ${wallets.slice(0, 1).map(wallet => `
            <tr>
              <td>${wallet.month}<br/>${wallet.activity}</td>
              <td>PHP ${wallet.beginningCash}</td>
              <td>PHP ${wallet.totalIncome}</td>
              <td>PHP ${wallet.totalExpenses}</td>
              <td>PHP ${wallet.endingCash}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    `;

    // Render wallets grid
    const walletsGrid = document.getElementById('wallets-grid');
    if (wallets.length === 0) {
      walletsGrid.innerHTML = `
        <div class="empty-state" style="grid-column: 1 / -1;">
          <img src="/static/images/nav_wallet.png" alt="No wallets" />
          <h4>No wallets yet</h4>
          <p>Create your first wallet to start tracking your finances</p>
        </div>
      `;
    } else {
      walletsGrid.innerHTML = wallets.map(wallet => `
        <div class="wallet-card-item" onclick="window.walletManager.showWalletDetail(${wallet.id})">
          <h5>${wallet.name}</h5>
        </div>
      `).join('');
    }
  }

  function showWalletDetail(walletId) {
    currentWallet = wallets.find(w => w.id === walletId);
    if (!currentWallet) return;

    document.getElementById('wallet-name').textContent = currentWallet.name;
    document.getElementById('wallets-view').classList.remove('active');
    document.getElementById('wallet-detail-view').classList.add('active');

    // Reset to transactions tab
    switchTab('transactions');
    renderWalletTransactions();
    renderReceipts();
  }

  function showWalletsList() {
    document.getElementById('wallet-detail-view').classList.remove('active');
    document.getElementById('wallets-view').classList.add('active');
    currentWallet = null;
  }

  function switchTab(tabName) {
    // Update tab buttons
    document.querySelectorAll('.tab-btn').forEach(btn => {
      btn.classList.remove('active');
      if (btn.dataset.tab === tabName) {
        btn.classList.add('active');
      }
    });

    // Update tab content
    document.querySelectorAll('.tab-content').forEach(content => {
      content.classList.remove('active');
    });
    document.getElementById(`${tabName}-tab`).classList.add('active');
  }

  function renderWalletTransactions() {
    if (!currentWallet) return;

    const container = document.getElementById('transactions-container');
    const transactions = walletTransactions[currentWallet.id] || [];

    // Filter transactions
    let filteredTransactions = transactions;
    if (currentFilter !== 'all') {
      filteredTransactions = transactions.filter(tx => tx.type === currentFilter);
    }

    if (filteredTransactions.length === 0) {
      container.innerHTML = `
        <div class="empty-state">
          <img src="/static/images/nav_history.png" alt="No transactions" />
          <h4>No transactions found</h4>
          <p>There are no transactions for the selected filter</p>
        </div>
      `;
      return;
    }

    // Separate income and expenses
    const incomeTransactions = filteredTransactions.filter(tx => tx.type === 'income');
    const expenseTransactions = filteredTransactions.filter(tx => tx.type === 'expense');

    let html = '';

    if (incomeTransactions.length > 0 && (currentFilter === 'all' || currentFilter === 'income')) {
      incomeTransactions.forEach(tx => {
        html += createTransactionItem(tx);
      });
    }

    if (expenseTransactions.length > 0 && (currentFilter === 'all' || currentFilter === 'expense')) {
      expenseTransactions.forEach(tx => {
        html += createTransactionItem(tx);
      });
    }

    container.innerHTML = html;
  }

  function createTransactionItem(tx) {
    const amountDisplay = tx.amount < 0 ? `-PHP ${Math.abs(tx.amount)}` : `PHP ${tx.amount}`;
    
    return `
      <div class="transaction-item">
        <div class="transaction-left">
          <h5>${tx.event}</h5>
          <p>${tx.description}</p>
          <span class="transaction-date">${tx.date}</span>
        </div>
        <div class="transaction-amount ${tx.type}">
          ${amountDisplay}
        </div>
      </div>
    `;
  }

  function renderReceipts() {
    const container = document.getElementById('receipts-container');
    
    if (walletReceipts.length === 0) {
      container.innerHTML = `
        <div class="empty-state" style="grid-column: 1 / -1;">
          <img src="/static/images/folder_icon.png" alt="No receipts" />
          <h4>No receipts yet</h4>
          <p>Upload receipts to keep track of your expenses</p>
        </div>
      `;
      return;
    }

    container.innerHTML = walletReceipts.map(receipt => `
      <div class="receipt-card">
        <div class="receipt-icon">
          <img src="/static/images/file_icon.png" alt="Receipt" />
        </div>
        <h5>${receipt.name}</h5>
        <p>${receipt.date}</p>
        <div class="receipt-actions">
          <button class="receipt-action-btn view">
            👁 View
          </button>
          <button class="receipt-action-btn download">
            ⬇ Download
          </button>
        </div>
      </div>
    `).join('');
  }

  // Expose functions globally for onclick handlers
  window.walletManager = {
    showWalletDetail,
    showWalletsList
  };

  // Sidebar navigation handling
  const navItems = document.querySelectorAll('.nav-item');
  navItems.forEach(item => {
    item.addEventListener('click', () => {
      navItems.forEach(i => i.classList.remove('active'));
      item.classList.add('active');
    });
  });
});