document.addEventListener("DOMContentLoaded", () => {
const walletImageUrl = document.body.dataset.walletImg;
const historyIconUrl = document.body.dataset.historyIcon;
const receiptsIconUrl = document.body.dataset.receiptsIcon;

  let currentWallet = null;
  let currentFilter = "all";
  let walletsFiltered = [];
  let currentTxType = "income";
  let reportGeneratedForWalletId = null;

  // Fixed wallets August–May (use ISO month for filtering)
  const wallets = [
    { id: 1,  name: "AUGUST",    month: "2024-08", beginningCash: 0, totalIncome: 0, totalExpenses: 0, endingCash: 0 },
    { id: 2,  name: "SEPTEMBER", month: "2024-09", beginningCash: 0, totalIncome: 0, totalExpenses: 0, endingCash: 0 },
    { id: 3,  name: "OCTOBER",   month: "2024-10", beginningCash: 0, totalIncome: 0, totalExpenses: 0, endingCash: 0 },
    { id: 4,  name: "NOVEMBER",  month: "2024-11", beginningCash: 0, totalIncome: 0, totalExpenses: 0, endingCash: 0 },
    { id: 5,  name: "DECEMBER",  month: "2024-12", beginningCash: 0, totalIncome: 0, totalExpenses: 0, endingCash: 0 },
    { id: 6,  name: "JANUARY",   month: "2025-01", beginningCash: 0, totalIncome: 0, totalExpenses: 0, endingCash: 0 },
    { id: 7,  name: "FEBRUARY",  month: "2025-02", beginningCash: 0, totalIncome: 0, totalExpenses: 0, endingCash: 0 },
    { id: 8,  name: "MARCH",     month: "2025-03", beginningCash: 0, totalIncome: 0, totalExpenses: 0, endingCash: 0 },
    { id: 9,  name: "APRIL",     month: "2025-04", beginningCash: 0, totalIncome: 0, totalExpenses: 0, endingCash: 0 },
    { id: 10, name: "MAY",       month: "2025-05", beginningCash: 0, totalIncome: 0, totalExpenses: 0, endingCash: 0 }
  ];

  // Sample transactions (per wallet)
  const walletTransactions = {
    7: [
      {
        event: "FEBRUARY",
        description: "(24) Number of Customers",
        amount: 852,
        date: "2025-02-14",
        type: "income"
      },
      {
        event: "FEBRUARY",
        description: "(24) Number of Customers",
        amount: 515,
        date: "2025-02-13",
        type: "income"
      },
      {
        event: "FEBRUARY",
        description: "(1 set) Bracelet Locks",
        amount: -73,
        date: "2025-02-09",
        type: "expense"
      }
    ]
  };

  // Sample receipts
  const walletReceipts = [
    { name: "Materials", date: "2025-02-11" },
    { name: "Materials", date: "2025-02-11" }
  ];

  walletsFiltered = [...wallets];

  // DOM elements

  const backBtn = document.getElementById("back-to-wallets");
  const tabButtons = document.querySelectorAll(".tab-btn");
  const filterButtons = document.querySelectorAll(".filter-btn");

  const walletSearchInput = document.getElementById("wallet-search");
  const walletMonthFilter = document.getElementById("wallet-month-filter");

  const walletActionsBtn = document.getElementById("wallet-actions-btn");
  const walletBudgetBtn = document.getElementById("wallet-budget-btn");
  const walletActionsMenu = document.getElementById("wallet-actions-menu");

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
  const txParticularsWrapper = document.getElementById("tx-particulars-wrapper");
  const txParticulars = document.getElementById("tx-particulars");
  const txDesc = document.getElementById("tx-desc");
  const txPrice = document.getElementById("tx-price");

  const receiptModalOverlay = document.getElementById("receipt-modal-overlay");
  const closeReceiptModal = document.getElementById("close-receipt-modal");
  const cancelReceiptBtn = document.getElementById("cancel-receipt-btn");
  const receiptForm = document.getElementById("receipt-form");
  const receiptFile = document.getElementById("receipt-file");
  const receiptDesc = document.getElementById("receipt-desc");
  const receiptDate = document.getElementById("receipt-date");

  const budgetModalOverlay = document.getElementById("budget-modal-overlay");
  const closeBudgetModal = document.getElementById("close-budget-modal");
  const cancelBudgetBtn = document.getElementById("cancel-budget-btn");
  const budgetForm = document.getElementById("budget-form");
  const budgetAmountInput = document.getElementById("budget-amount");

  const confirmGenerateOverlay = document.getElementById("confirm-generate-overlay");
  const closeGenerateModal = document.getElementById("close-generate-modal");
  const cancelGenerateBtn = document.getElementById("cancel-generate-btn");
  const confirmGenerateBtn = document.getElementById("confirm-generate-btn");

  const confirmSubmitOverlay = document.getElementById("confirm-submit-overlay");
  const closeSubmitModal = document.getElementById("close-submit-modal");
  const cancelSubmitBtn = document.getElementById("cancel-submit-btn");
  const confirmSubmitBtn = document.getElementById("confirm-submit-btn");

  const generateReportBtn = document.getElementById("generate-report-btn");
  const previewReportBtn = document.getElementById("preview-report-btn");
  const printReportBtn = document.getElementById("print-report-btn");
  const submitReportBtn = document.getElementById("submit-report-btn");

  const toastContainer = document.getElementById("toast-container");

  // Toast helper (top-right, slide in)
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
          <p>Adjust your search or date filter.</p>
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

  // Search + month filter
  function applyWalletFilters() {
    const q = walletSearchInput.value.toLowerCase();
    const monthVal = walletMonthFilter.value; // yyyy-mm or ""

    walletsFiltered = wallets.filter((w) => {
      const matchesText =
        w.name.toLowerCase().includes(q) ||
        w.month.toLowerCase().includes(q);
      const matchesMonth = monthVal ? w.month === monthVal : true;
      return matchesText && matchesMonth;
    });

    renderWalletsList();
  }

  walletSearchInput.addEventListener("input", applyWalletFilters);
  walletMonthFilter.addEventListener("input", applyWalletFilters);

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

  // Budget modal
  walletBudgetBtn.addEventListener("click", () => {
    if (!currentWallet) {
      showToast("Select a wallet first.", true);
      return;
    }
    budgetForm.reset();
    clearFieldError(budgetAmountInput);
    budgetAmountInput.value = currentWallet.beginningCash || "";
    budgetModalOverlay.classList.add("active");
  });

  function hideBudgetModal() {
    budgetModalOverlay.classList.remove("active");
  }

  closeBudgetModal.addEventListener("click", hideBudgetModal);
  cancelBudgetBtn.addEventListener("click", hideBudgetModal);
  budgetModalOverlay.addEventListener("click", (e) => {
    if (e.target === budgetModalOverlay) hideBudgetModal();
  });

  budgetForm.addEventListener("submit", (e) => {
    e.preventDefault();
    if (!currentWallet) {
      showToast("No wallet selected.", true);
      return;
    }

    const amount = budgetAmountInput.value.trim();
    let valid = true;

    if (!amount) {
      showFieldError(budgetAmountInput, "Budget is required.");
      valid = false;
    } else if (Number(amount) < 0) {
      showFieldError(budgetAmountInput, "Budget must be zero or more.");
      valid = false;
    } else {
      clearFieldError(budgetAmountInput);
    }

    if (!valid) {
      showToast("Please fix the errors before saving the budget.", true);
      return;
    }

    const num = Number(amount);
    currentWallet.beginningCash = num;
    currentWallet.endingCash = num + (currentWallet.totalIncome || 0) - (currentWallet.totalExpenses || 0);

    document.getElementById("stat-budget").textContent = `Php ${currentWallet.beginningCash.toFixed(2)}`;
    document.getElementById("stat-ending").textContent = `Php ${currentWallet.endingCash.toFixed(2)}`;

    hideBudgetModal();
    showToast("Budget saved successfully.");
  });

  // Transaction modal
  function openTxModal(type) {
    currentTxType = type;
    txForm.reset();
    [txDate, txQty, txIncomeType, txParticulars, txDesc, txPrice].forEach(clearFieldError);

    if (type === "income") {
      txModalTitle.textContent = "Add Income Transaction";
      txModalSubtitle.textContent = "Record an income transaction for this wallet.";
      txTypeWrapper.style.display = "block";
      txIncomeType.required = true;
      txParticularsWrapper.style.display = "none";
      txParticulars.required = false;
    } else {
      txModalTitle.textContent = "Add Expense Transaction";
      txModalSubtitle.textContent = "Record an expense transaction for this wallet.";
      txTypeWrapper.style.display = "none";
      txIncomeType.required = false;
      txParticularsWrapper.style.display = "block";
      txParticulars.required = true;
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
    } else {
      fields.splice(2, 0, [txParticulars, "Particulars are required."]);
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
      descriptionText =
        `${txQty.value} x ${txParticulars.value} - ${txDesc.value}`;
    }

    const tx = {
      event: currentWallet.name,
      description: descriptionText,
      amount: currentTxType === "expense" ? -amount : amount,
      date: txDate.value,
      type: currentTxType
    };

    if (!walletTransactions[currentWallet.id]) {
      walletTransactions[currentWallet.id] = [];
    }
    walletTransactions[currentWallet.id].push(tx);

    // Update wallet totals
    if (currentTxType === "income") {
      currentWallet.totalIncome = (currentWallet.totalIncome || 0) + amount;
    } else {
      currentWallet.totalExpenses = (currentWallet.totalExpenses || 0) + amount;
    }
    currentWallet.endingCash =
      (currentWallet.beginningCash || 0) +
      (currentWallet.totalIncome || 0) -
      (currentWallet.totalExpenses || 0);

    document.getElementById("stat-income").textContent =
      `Php ${ (currentWallet.totalIncome || 0).toFixed(2) }`;
    document.getElementById("stat-expense").textContent =
      `Php ${ (currentWallet.totalExpenses || 0).toFixed(2) }`;
    document.getElementById("stat-ending").textContent =
      `Php ${ (currentWallet.endingCash || 0).toFixed(2) }`;

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

  // Generate / Preview / Print / Submit logic
  function showReportButtons() {
    previewReportBtn.style.display = "inline-flex";
    printReportBtn.style.display = "inline-flex";
    submitReportBtn.style.display = "inline-flex";
  }

  function hideReportButtons() {
    previewReportBtn.style.display = "none";
    printReportBtn.style.display = "none";
    submitReportBtn.style.display = "none";
  }

  generateReportBtn.addEventListener("click", () => {
    if (!currentWallet) {
      showToast("Select a wallet first.", true);
      return;
    }
    confirmGenerateOverlay.classList.add("active");
  });

  function hideGenerateModal() {
    confirmGenerateOverlay.classList.remove("active");
  }

  closeGenerateModal.addEventListener("click", hideGenerateModal);
  cancelGenerateBtn.addEventListener("click", hideGenerateModal);
  confirmGenerateOverlay.addEventListener("click", (e) => {
    if (e.target === confirmGenerateOverlay) hideGenerateModal();
  });

  confirmGenerateBtn.addEventListener("click", () => {
    hideGenerateModal();
    showToast("Generating report...", false);

    // Simulate backend generation delay
    setTimeout(() => {
      if (!currentWallet) {
        showToast("Failed to generate report. No wallet selected.", true);
        return;
      }
      reportGeneratedForWalletId = currentWallet.id;
      showReportButtons();
      showToast("Report generated successfully.");
    }, 1000);
  });

  previewReportBtn.addEventListener("click", () => {
    if (!currentWallet || reportGeneratedForWalletId !== currentWallet.id) {
      showToast("Generate the report first.", true);
      return;
    }
    showToast("Previewing report (placeholder).");
    // Here you would open a preview modal or window with the generated PDF/DOC.
  });

  printReportBtn.addEventListener("click", () => {
    if (!currentWallet || reportGeneratedForWalletId !== currentWallet.id) {
      showToast("Generate the report first.", true);
      return;
    }
    showToast("Print is handled by backend.", false);
  });

  submitReportBtn.addEventListener("click", () => {
    if (!currentWallet || reportGeneratedForWalletId !== currentWallet.id) {
      showToast("Generate the report first.", true);
      return;
    }
    confirmSubmitOverlay.classList.add("active");
  });

  function hideSubmitModal() {
    confirmSubmitOverlay.classList.remove("active");
  }

  closeSubmitModal.addEventListener("click", hideSubmitModal);
  cancelSubmitBtn.addEventListener("click", hideSubmitModal);
  confirmSubmitOverlay.addEventListener("click", (e) => {
    if (e.target === confirmSubmitOverlay) hideSubmitModal();
  });

  confirmSubmitBtn.addEventListener("click", () => {
    hideSubmitModal();
    showToast("Submitting report to OSAS...", false);

    setTimeout(() => {
      showToast("Report submitted successfully.");
      // Optionally disable buttons after submission
      hideReportButtons();
    }, 1000);
  });

  // Detail view functions
  function showWalletDetail(walletId) {
    currentWallet = wallets.find((w) => w.id === walletId);
    if (!currentWallet) return;

    document.getElementById("wallet-name").textContent = currentWallet.name;
    document.getElementById("wallets-view").classList.remove("active");
    document.getElementById("wallet-detail-view").classList.add("active");

    document.getElementById("stat-budget").textContent =
      `Php ${(currentWallet.beginningCash || 0).toFixed(2)}`;
    document.getElementById("stat-expense").textContent =
      `Php ${(currentWallet.totalExpenses || 0).toFixed(2)}`;
    document.getElementById("stat-income").textContent =
      `Php ${(currentWallet.totalIncome || 0).toFixed(2)}`;
    document.getElementById("stat-ending").textContent =
      `Php ${(currentWallet.endingCash || 0).toFixed(2)}`;

    // When switching wallets, only show report buttons if already generated for this wallet
    if (reportGeneratedForWalletId === currentWallet.id) {
      showReportButtons();
    } else {
      hideReportButtons();
    }

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
    <img src="${historyIconUrl}" alt="No transactions" />
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
<img src="${receiptsIconUrl}" alt="No receipts" />
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
          <img src="${receiptsIconUrl}" alt="Receipt" />
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
