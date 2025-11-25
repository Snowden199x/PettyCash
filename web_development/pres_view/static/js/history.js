document.addEventListener("DOMContentLoaded", () => {
  let currentMonth = new Date();
  let currentFilter = 'all';

  // Sample transaction data
  const allTransactions = [
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
    },
    {
      event: "FEB FAIR",
      description: "(1 roll) Kawad",
      amount: -100,
      date: "February 1, 2025",
      type: "expense"
    },
    {
      event: "FEB FAIR",
      description: "(N/A) Print Documents",
      amount: -65,
      date: "February 10, 2025",
      type: "expense"
    }
  ];

  // Initialize
  updateMonthDisplay();
  renderTransactions();

  // Month navigation
  document.getElementById('prev-month').addEventListener('click', () => {
    currentMonth.setMonth(currentMonth.getMonth() - 1);
    updateMonthDisplay();
    renderTransactions();
  });

  document.getElementById('next-month').addEventListener('click', () => {
    currentMonth.setMonth(currentMonth.getMonth() + 1);
    updateMonthDisplay();
    renderTransactions();
  });

  // Filter tabs
  document.querySelectorAll('.filter-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
      e.target.classList.add('active');
      currentFilter = e.target.dataset.filter;
      renderTransactions();
    });
  });

  function updateMonthDisplay() {
    const months = ['January', 'February', 'March', 'April', 'May', 'June', 
                    'July', 'August', 'September', 'October', 'November', 'December'];
    const monthDisplay = `${months[currentMonth.getMonth()]} ${currentMonth.getFullYear()}`;
    document.getElementById('current-month').textContent = monthDisplay;
  }

  function renderTransactions() {
    const container = document.getElementById('transactions-list');
    
    // Filter transactions
    let filteredTransactions = allTransactions;
    if (currentFilter !== 'all') {
      filteredTransactions = allTransactions.filter(tx => tx.type === currentFilter);
    }

    // Check if there are transactions
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

    // Render Income section
    if (incomeTransactions.length > 0 && (currentFilter === 'all' || currentFilter === 'income')) {
      html += '<h4 class="section-title" style="margin: 20px 0 15px; font-weight: 600; color: #2E7D32;">Income</h4>';
      incomeTransactions.forEach(tx => {
        html += createTransactionCard(tx);
      });
    }

    // Render Expense section
    if (expenseTransactions.length > 0 && (currentFilter === 'all' || currentFilter === 'expense')) {
      html += '<h4 class="section-title" style="margin: 20px 0 15px; font-weight: 600; color: #C62828;">Expenses</h4>';
      expenseTransactions.forEach(tx => {
        html += createTransactionCard(tx);
      });
    }

    container.innerHTML = html;
  }

  function createTransactionCard(tx) {
    const amountPrefix = tx.amount < 0 ? '' : '';
    const amountDisplay = tx.amount < 0 ? `-PHP ${Math.abs(tx.amount)}` : `PHP ${tx.amount}`;
    
    return `
      <div class="transaction-card">
        <div class="transaction-left">
          <h5 class="transaction-event">${tx.event}</h5>
          <p class="transaction-description">${tx.description}</p>
          <span class="transaction-date">${tx.date}</span>
        </div>
        <div class="transaction-right">
          <div class="transaction-amount ${tx.type}">
            ${amountDisplay}
          </div>
        </div>
      </div>
    `;
  }

  // Sidebar navigation handling
  const navItems = document.querySelectorAll('.nav-item');
  navItems.forEach(item => {
    item.addEventListener('click', () => {
      navItems.forEach(i => i.classList.remove('active'));
      item.classList.add('active');
    });
  });
});