document.addEventListener("DOMContentLoaded", () => {
  const walletImageUrl = document.body.dataset.walletImg;

  let currentWallet = null;
  let currentFilter = "all";
  let walletsFiltered = [];
  let currentTxType = "income";

  // Sample wallets data
  const wallets = [
    { id: 1, name: "FEBRUARY", month: "February 2025", activity: "Feb Fair", beginningCash: 700, totalIncome: 1830, totalExpenses: 1500, endingCash: 5000 },
    { id: 2, name: "MARCH", month: "March 2025", activity: "IT Days", beginningCash: 500, totalIncome: 2000, totalExpenses: 1200, endingCash: 3500 },
    { id: 3, name: "APRIL", month: "April 2025", activity: "CCS Week", beginningCash: 800, totalIncome: 2500, totalExpenses: 1800, endingCash: 4200 },
    { id: 4, name: "MAY", month: "March 2025", activity: "March", beginningCash: 600, totalIncome: 1500, totalExpenses: 1000, endingCash: 2800 },
    { id: 5, name: "JUNE", month: "October 2024", activity: "Teacher's Day", beginningCash: 400, totalIncome: 1200, totalExpenses: 800, endingCash: 2100 },
    { id: 6, name: "JULY", month: "November 2024", activity: "Seminar", beginningCash: 900, totalIncome: 3000, totalExpenses: 2200, endingCash: 5500 },
    { id: 7, name: "AUGUST", month: "October 2025", activity: "Teacher's Day", beginningCash: 450, totalIncome: 1100, totalExpenses: 700, endingCash: 1900 },
    { id: 8, name: "SEPTEMBER", month: "December 2024", activity: "Seminar", beginningCash: 1000, totalIncome: 3500, totalExpenses: 2500, endingCash: 6000 },
    { id: 9, name: "NOVEMBER", month: "February 2025", activity: "February", beginningCash: 750, totalIncome: 2200, totalExpenses: 1600, endingCash: 4500 }
  ];

  // Transactions per wallet (sample)
  const walletTransactions = {
    1: [
      { event: "FERBUARY", description: "(24) Number of Customers", amount: 852, date: "February 14, 2025", type: "income" },
      { event: "FEBRUARY", description: "(24) Number of Customers", amount: 515, date: "February 13, 2025", type: "income" },
      { event: "FEBRUARY", description: "(1 set) Bracelet Locks", amount: -73, date: "February 9, 2025", type: "expense" }
    ]
  };

  // Sample receipts
  const walletReceipts = [
    { name: "Materials", date: "Feb 11, 2025" },
    { name: "Materials", date: "Feb 11, 2025" },
    { name: "Materials", date: "Feb 11, 2025" },
    { name: "Materials", date: "Feb 11, 2025" }
  ];

  walletsFiltered = [...wallets];

  // DOM elements
  const backBtn = document.getElementById("back-to-wallets");
  const tabButtons = document.querySelectorAll(".tab-btn");
  const filterButtons = document.querySelectorAll(".filter-btn");

  const addWalletBtn = document.getElementById("add-wallet-btn");
  const walletModalOverlay = document.getElementById("wallet-modal-overlay");
  const closeWalletModal = document.getElementById("close-wallet-modal");
  const cancelWalletBtn = document.getElementById("cancel-wallet-btn");
  const addWalletForm = document.getElementById("add-wallet-form");
  const walletMonthSelect = document.getElementById("wallet-month");
  const walletSearchInput = document.getElementById("wallet-search");

  const walletActionsBtn = document.getElementById("wallet-actions-btn");
  const walletActionsMenu = document.getElementById("wallet-actions-menu");
  const walletBudgetInput = document.getElementById("wallet-budget");


  const txModalOverlay = document.getElementById("tx-modal-overlay");
  const closeTxModal = document.getElementById("close-tx-modal");
  const cancelTxBtn = document.getElementById("cancel-tx-btn");
  const txForm = document.getElementById("tx-form");
  const txModalTitle = document.getElementById("tx-modal-title");
  const txModalSubtitle = document.getElementById("tx-modal-subtitle");
  const txDate = document.getElementById("tx-date");
  const txQty = document.getElementById("tx-qty");
  const txIncomeType = document.getElementById("tx-income-type");
  const txTypeWrapper = document.getElementById("tx-type-wrapper");
  const txDesc = document.getElementById("tx-desc");
  const txPrice = document.getElementById("tx-price");

  const receiptModalOverlay = document.getElementById("receipt-modal-overlay");
  const closeReceiptModal = document.getElementById("close-receipt-modal");
  const cancelReceiptBtn = document.getElementById("cancel-receipt-btn");
  const receiptForm = document.getElementById("receipt-form");
  const receiptFile = document.getElementById("receipt-file");
  const receiptDesc = document.getElementById("receipt-desc");
  const receiptDate = document.getElementById("receipt-date");

  const toastContainer = document.getElementById("toast-container");

  // Toast helper
  function showToast(message, isError = false) {
    const toast = document.createElement("div");
    toast.className = "toast" + (isError ? " error" : "");
    toast.textContent = message;
    toastContainer.appendChild(toast);

    requestAnimationFrame(() => {
      toast.classList.add("show");
    });

    setTimeout(() => {
      toast.classList.remove("show");
      setTimeout(() => toast.remove(), 200);
    }, 2500);
  }

  // Validation helpers
  function showFieldError(field, message) {
    field.classList.add("input-error", "shake");
    const msgSpan = field.parentElement.querySelector(".error-msg");
    if (msgSpan) msgSpan.textContent = message;
    setTimeout(() => field.classList.remove("shake"), 400);
  }

  function clearFieldError(field) {
    field.classList.remove("input-error");
    const msgSpan = field.parentElement.querySelector(".error-msg");
    if (msgSpan) msgSpan.textContent = "";
  }

  // Render wallets list
  function renderWalletsList() {
    const walletsGrid = document.getElementById("wallets-grid");
    if (walletsFiltered.length === 0) {
      walletsGrid.innerHTML = `
        <div class="empty-state" style="grid-column: 1 / -1;">
          <img src="/static/images/nav_wallet.png" alt="No wallets" />
          <h4>No wallets found</h4>
          <p>Create a wallet or change your search.</p>
        </div>
      `;
    } else {
      walletsGrid.innerHTML = walletsFiltered
        .map(
          (wallet) => `
        <div class="wallet-card-item"
             style="background:url('${walletImageUrl}') center/cover no-repeat;"
             onclick="window.walletManager.showWalletDetail(${wallet.id})">
          <h5>${wallet.name}</h5>
        </div>
      `
        )
        .join("");
    }
  }

  renderWalletsList();

  // Add Wallet modal
 addWalletBtn.addEventListener("click", () => {
  walletMonthSelect.value = "";
  walletBudgetInput.value = "";
  clearFieldError(walletMonthSelect);
  clearFieldError(walletBudgetInput);
  walletModalOverlay.classList.add("active");
});


  const hideWalletModal = () => {
    walletModalOverlay.classList.remove("active");
  };

  closeWalletModal.addEventListener("click", hideWalletModal);
  cancelWalletBtn.addEventListener("click", hideWalletModal);

  walletModalOverlay.addEventListener("click", (e) => {
    if (e.target === walletModalOverlay) hideWalletModal();
  });

  addWalletForm.addEventListener("submit", (e) => {
  e.preventDefault();

  const month = walletMonthSelect.value.trim();
  const budget = walletBudgetInput.value.trim();
  let valid = true;

  if (!month) {
    showFieldError(walletMonthSelect, "Month is required.");
    valid = false;
  } else {
    clearFieldError(walletMonthSelect);
  }

  if (!budget) {
    showFieldError(walletBudgetInput, "Budget is required.");
    valid = false;
  } else if (Number(budget) < 0) {
    showFieldError(walletBudgetInput, "Budget must be zero or more.");
    valid = false;
  } else {
    clearFieldError(walletBudgetInput);
  }

  if (!valid) {
    showToast("Please fix the errors before creating the wallet.", true);
    return;
  }

  const newId = wallets.length ? wallets[wallets.length - 1].id + 1 : 1;
  const monthName = month.split(" ")[0].toUpperCase();

  const budgetNum = Number(budget);

  const newWallet = {
    id: newId,
    name: monthName,
    month: month,
    activity: monthName,
    beginningCash: budgetNum,
    totalIncome: 0,
    totalExpenses: 0,
    endingCash: budgetNum
  };

  wallets.push(newWallet);
  walletsFiltered = [...wallets];
  renderWalletsList();
  hideWalletModal();
  showToast("Wallet added successfully.");
});


  // Search
  walletSearchInput.addEventListener("input", () => {
    const q = walletSearchInput.value.toLowerCase();
    walletsFiltered = wallets.filter(
      (w) =>
        w.name.toLowerCase().includes(q) ||
        w.month.toLowerCase().includes(q) ||
        w.activity.toLowerCase().includes(q)
    );
    renderWalletsList();
  });

  // Detail navigation
  backBtn.addEventListener("click", showWalletsList);

  tabButtons.forEach((btn) => {
    btn.addEventListener("click", (e) => {
      switchTab(e.target.dataset.tab);
    });
  });

  filterButtons.forEach((btn) => {
    btn.addEventListener("click", (e) => {
      filterButtons.forEach((b) => b.classList.remove("active"));
      e.target.classList.add("active");
      currentFilter = e.target.dataset.filter;
      renderWalletTransactions();
    });
  });

  // Actions dropdown
  walletActionsBtn.addEventListener("click", () => {
    walletActionsMenu.classList.toggle("open");
  });

  walletActionsMenu.addEventListener("click", (e) => {
    const action = e.target.dataset.action;
    if (!action) return;
    walletActionsMenu.classList.remove("open");

    if (action === "income" || action === "expense") {
      openTxModal(action);
    } else if (action === "receipt") {
      openReceiptModal();
    }
  });

  document.addEventListener("click", (e) => {
    if (
      !walletActionsBtn.contains(e.target) &&
      !walletActionsMenu.contains(e.target)
    ) {
      walletActionsMenu.classList.remove("open");
    }
  });

  // Transaction modal
  function openTxModal(type) {
    currentTxType = type;
    txForm.reset();
    [txDate, txQty, txIncomeType, txDesc, txPrice].forEach(clearFieldError);

    if (type === "income") {
      txModalTitle.textContent = "Add Income Transaction";
      txModalSubtitle.textContent = "Record an income transaction for this wallet.";
      txTypeWrapper.style.display = "block";
      txIncomeType.required = true;
    } else {
      txModalTitle.textContent = "Add Expense Transaction";
      txModalSubtitle.textContent = "Record an expense transaction for this wallet.";
      txTypeWrapper.style.display = "none";
      txIncomeType.required = false;
    }

    txModalOverlay.classList.add("active");
  }

  function hideTxModal() {
    txModalOverlay.classList.remove("active");
  }

  closeTxModal.addEventListener("click", hideTxModal);
  cancelTxBtn.addEventListener("click", hideTxModal);
  txModalOverlay.addEventListener("click", (e) => {
    if (e.target === txModalOverlay) hideTxModal();
  });

  txForm.addEventListener("submit", (e) => {
    e.preventDefault();

    let valid = true;

    let fields = [
      [txDate, "Date is required."],
      [txQty, "Quantity is required."],
      [txDesc, "Description is required."],
      [txPrice, "Price is required."]
    ];

    if (currentTxType === "income") {
      fields.splice(2, 0, [txIncomeType, "Type of income is required."]);
    }

    fields.forEach(([field, msg]) => {
      if (!field.value.trim()) {
        showFieldError(field, msg);
        valid = false;
      } else {
        clearFieldError(field);
      }
    });

    if (!valid) {
      showToast("Please fill in all required fields.", true);
      return;
    }

    if (!currentWallet) {
      showToast("No wallet selected.", true);
      return;
    }

    const amount = Number(txPrice.value) * Number(txQty.value);

    let descriptionText;
    if (currentTxType === "income") {
      descriptionText =
        `${txQty.value} x ${txIncomeType.value} - ${txDesc.value}`;
    } else {
      descriptionText = `${txQty.value} x ${txDesc.value}`;
    }

    const tx = {
      event: currentWallet.activity,
      description: descriptionText,
      amount: currentTxType === "expense" ? -amount : amount,
      date: txDate.value,
      type: currentTxType
    };

    if (!walletTransactions[currentWallet.id]) {
      walletTransactions[currentWallet.id] = [];
    }
    walletTransactions[currentWallet.id].push(tx);

    renderWalletTransactions();
    hideTxModal();
    showToast(
      currentTxType === "income"
        ? "Income transaction added."
        : "Expense transaction added."
    );
  });

  // Receipt modal
  function openReceiptModal() {
    receiptForm.reset();
    [receiptFile, receiptDesc, receiptDate].forEach(clearFieldError);
    receiptModalOverlay.classList.add("active");
  }

  function hideReceiptModal() {
    receiptModalOverlay.classList.remove("active");
  }

  closeReceiptModal.addEventListener("click", hideReceiptModal);
  cancelReceiptBtn.addEventListener("click", hideReceiptModal);
  receiptModalOverlay.addEventListener("click", (e) => {
    if (e.target === receiptModalOverlay) hideReceiptModal();
  });

  receiptForm.addEventListener("submit", (e) => {
    e.preventDefault();

    let valid = true;

    if (!receiptFile.files.length) {
      showFieldError(receiptFile, "Image is required.");
      valid = false;
    } else {
      clearFieldError(receiptFile);
    }

    if (!receiptDesc.value.trim()) {
      showFieldError(receiptDesc, "Description is required.");
      valid = false;
    } else {
      clearFieldError(receiptDesc);
    }

    if (!receiptDate.value.trim()) {
      showFieldError(receiptDate, "Date is required.");
      valid = false;
    } else {
      clearFieldError(receiptDate);
    }

    if (!valid) {
      showToast("Please fill in all required fields.", true);
      return;
    }

    walletReceipts.push({
      name: receiptDesc.value,
      date: receiptDate.value
    });

    renderReceipts();
    hideReceiptModal();
    showToast("Receipt added successfully.");
  });

  // Detail view functions
  function showWalletDetail(walletId) {
    currentWallet = wallets.find((w) => w.id === walletId);
    if (!currentWallet) return;

    document.getElementById("wallet-name").textContent = currentWallet.name;
    document.getElementById("wallets-view").classList.remove("active");
    document.getElementById("wallet-detail-view").classList.add("active");

    document.getElementById("stat-budget").textContent =
      `Php ${currentWallet.beginningCash.toFixed(2)}`;
    document.getElementById("stat-expense").textContent =
      `Php ${currentWallet.totalExpenses.toFixed(2)}`;
    document.getElementById("stat-income").textContent =
      `Php ${currentWallet.totalIncome.toFixed(2)}`;
    document.getElementById("stat-ending").textContent =
      `Php ${currentWallet.endingCash.toFixed(2)}`;

    switchTab("transactions");
    renderWalletTransactions();
    renderReceipts();
  }

  function showWalletsList() {
    document.getElementById("wallet-detail-view").classList.remove("active");
    document.getElementById("wallets-view").classList.add("active");
    currentWallet = null;
  }

  function switchTab(tabName) {
    document.querySelectorAll(".tab-btn").forEach((btn) => {
      btn.classList.remove("active");
      if (btn.dataset.tab === tabName) btn.classList.add("active");
    });

    document.querySelectorAll(".tab-content").forEach((content) => {
      content.classList.remove("active");
    });
    document.getElementById(`${tabName}-tab`).classList.add("active");
  }

  function renderWalletTransactions() {
    if (!currentWallet) return;

    const container = document.getElementById("transactions-container");
    const transactions = walletTransactions[currentWallet.id] || [];

    let filteredTransactions = transactions;
    if (currentFilter !== "all") {
      filteredTransactions = transactions.filter(
        (tx) => tx.type === currentFilter
      );
    }

    if (filteredTransactions.length === 0) {
      container.innerHTML = `
        <div class="empty-state">
          <img src="/static/images/nav_history.png" alt="No transactions" />
          <h4>No transactions found</h4>
          <p>There are no transactions for the selected filter.</p>
        </div>
      `;
      return;
    }

    const incomeTransactions = filteredTransactions.filter(
      (tx) => tx.type === "income"
    );
    const expenseTransactions = filteredTransactions.filter(
      (tx) => tx.type === "expense"
    );

    let html = "";
    incomeTransactions.forEach((tx) => (html += createTransactionItem(tx)));
    expenseTransactions.forEach((tx) => (html += createTransactionItem(tx)));
    container.innerHTML = html;
  }

  function createTransactionItem(tx) {
    const amountDisplay =
      tx.amount < 0 ? `-PHP ${Math.abs(tx.amount)}` : `PHP ${tx.amount}`;
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
    const container = document.getElementById("receipts-container");
    if (walletReceipts.length === 0) {
      container.innerHTML = `
        <div class="empty-state" style="grid-column: 1 / -1;">
          <img src="/static/images/folder_icon.png" alt="No receipts" />
          <h4>No receipts yet</h4>
          <p>Upload receipts to keep track of your expenses.</p>
        </div>
      `;
      return;
    }

    container.innerHTML = walletReceipts
      .map(
        (receipt) => `
      <div class="receipt-card">
        <div class="receipt-icon">
          <img src="/static/images/file_icon.png" alt="Receipt" />
        </div>
        <h5>${receipt.name}</h5>
        <p>${receipt.date}</p>
        <div class="receipt-actions">
          <button class="receipt-action-btn view">👁 View</button>
          <button class="receipt-action-btn download">⬇ Download</button>
        </div>
      </div>
    `
      )
      .join("");
  }

  window.walletManager = {
    showWalletDetail,
    showWalletsList
  };

  const navItems = document.querySelectorAll(".nav-item");
  navItems.forEach((item) => {
    item.addEventListener("click", () => {
      navItems.forEach((i) => i.classList.remove("active"));
      item.classList.add("active");
    });
  });
});
