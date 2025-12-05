document.addEventListener("DOMContentLoaded", () => {
  const walletImageUrl = document.body.dataset.walletImg;
  const historyIconUrl = document.body.dataset.historyIcon;
  const receiptsIconUrl = document.body.dataset.receiptsIcon;
  const optionsIconUrl = document.body.dataset.optionsIcon;

  // ===== Report details modal =====
  const reportDetailsOverlay = document.getElementById(
    "report-details-overlay"
  );
  const closeReportDetails = document.getElementById("close-report-details");
  const cancelReportDetails = document.getElementById("cancel-report-details");
  const reportDetailsForm = document.getElementById("report-details-form");
  const repEventName = document.getElementById("rep-event-name");
  const repDatePrepared = document.getElementById("rep-date-prepared");
  const repNumber = document.getElementById("rep-number");
  const repBudget = document.getElementById("rep-budget");
  const repTotalExpense = document.getElementById("rep-total-expense");
  const repReimb = document.getElementById("rep-reimb");
  const repPrevFund = document.getElementById("rep-prev-fund");

  // ===== State =====
  // currentWallet = wallet_budgets row (folder) for current org + wallet + month
  // { id: folder_id, walletId, name, month, beginningCash, totalIncome, totalExpenses, endingCash }
  let currentWallet = null;
  let currentFilter = "all";
  let wallets = [];
  let walletsFiltered = [];
  let walletTransactions = {}; // key: folder_id
  let walletReceipts = {}; // key: folder_id
  let walletArchives = {}; // key: folder_id
  let currentTxType = "income";

  let currentOrgId = null; // para sa per-org report draft keys

  // per-folder flag ng generated report
  let reportGeneratedForFolderId = null;
  let nextReportNumber = 1;
  let currentReportDetails = null;

  // DOM elements
  const backBtn = document.getElementById("back-to-wallets");
  const tabButtons = document.querySelectorAll(".tab-btn");
  const filterButtons = document.querySelectorAll(".filter-btn");

  const walletSearchInput = document.getElementById("wallet-search");
  const walletYearFilter = document.getElementById("wallet-year-filter");

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
  const txParticularsWrapper = document.getElementById(
    "tx-particulars-wrapper"
  );
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

  const confirmGenerateOverlay = document.getElementById(
    "confirm-generate-overlay"
  );
  const closeGenerateModal = document.getElementById("close-generate-modal");
  const cancelGenerateBtn = document.getElementById("cancel-generate-btn");
  const confirmGenerateBtn = document.getElementById("confirm-generate-btn");

  const confirmSubmitOverlay = document.getElementById(
    "confirm-submit-overlay"
  );
  const closeSubmitModal = document.getElementById("close-submit-modal");
  const cancelSubmitBtn = document.getElementById("cancel-submit-btn");
  const confirmSubmitBtn = document.getElementById("confirm-submit-btn");

  const generateReportBtn = document.getElementById("generate-report-btn");
  const previewReportBtn = document.getElementById("preview-report-btn");
  const printReportBtn = document.getElementById("print-report-btn");
  const submitReportBtn = document.getElementById("submit-report-btn");

  const repTotalIncome = document.getElementById("rep-total-income");
  const repBudgetBank = document.getElementById("rep-budget-bank");

  const confirmDeleteOverlay = document.getElementById(
    "confirm-delete-overlay"
  );
  const closeDeleteModal = document.getElementById("close-delete-modal");
  const cancelDeleteBtn = document.getElementById("cancel-delete-btn");
  const confirmDeleteBtn = document.getElementById("confirm-delete-btn");
  const confirmDeleteTitle = document.getElementById("confirm-delete-title");
  const confirmDeleteMessage = document.getElementById(
    "confirm-delete-message"
  );

  let deleteAction = null; // function to run on confirm

  const toastContainer = document.getElementById("toast-container");

  // ===== Helpers =====

  function showToast(message, isError = false) {
    const toast = document.createElement("div");
    toast.className = "toast" + (isError ? " error" : "");
    toast.textContent = message;
    toastContainer.appendChild(toast);
    requestAnimationFrame(() => toast.classList.add("show"));
    setTimeout(() => {
      toast.classList.remove("show");
      setTimeout(() => toast.remove(), 200);
    }, 2500);
  }

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

  async function apiGet(url) {
    const res = await fetch(url, { credentials: "include" });
    if (!res.ok) throw new Error("Request failed");
    return res.json();
  }
  // helper na nadagdag na kanina
  async function checkSubmissionStatus() {
    if (!currentWallet) return false;

    try {
      const res = await apiGet(
        `/pres/api/wallets/${currentWallet.walletId}/budgets/${currentWallet.id}/submit`
      );
      return res.submitted || false;
    } catch (err) {
      console.error(err);
      return false;
    }
  }

  function showDeleteModal({ title, message, onConfirm }) {
    confirmDeleteTitle.textContent = title || "Delete";
    confirmDeleteMessage.textContent =
      message || "Are you sure you want to delete this item?";
    deleteAction = typeof onConfirm === "function" ? onConfirm : null;
    confirmDeleteOverlay.classList.add("active");
  }

  function hideDeleteModal() {
    confirmDeleteOverlay.classList.remove("active");
    deleteAction = null;
  }

  closeDeleteModal.addEventListener("click", hideDeleteModal);
  cancelDeleteBtn.addEventListener("click", hideDeleteModal);
  confirmDeleteOverlay.addEventListener("click", (e) => {
    if (e.target === confirmDeleteOverlay) hideDeleteModal();
  });

  confirmDeleteBtn.addEventListener("click", async () => {
    if (deleteAction) {
      await deleteAction();
    }
    hideDeleteModal();
  });

  async function apiPost(url, body) {
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify(body),
    });
    if (!res.ok) throw new Error("Request failed");
    return res.json();
  }

  // localStorage view state
  function getViewState() {
    try {
      const raw = localStorage.getItem("walletViewState");
      return raw ? JSON.parse(raw) : {};
    } catch {
      return {};
    }
  }

  function setViewState(patch) {
    const prev = getViewState();
    localStorage.setItem(
      "walletViewState",
      JSON.stringify({ ...prev, ...patch })
    );
  }

  // ===== Auth (for per-org draft keys) =====

  async function loadAuth() {
    try {
      const auth = await apiGet("/pres/api/auth_status");
      if (auth.logged_in) currentOrgId = auth.org_id;
    } catch {
      currentOrgId = null;
    }
  }

  function draftKeyFor(wallet) {
    return `reportDraft:${currentOrgId || "org"}:${wallet.walletId}`;
  }

  // ===== Helpers for academic year (Aug–May) =====
  function getAcademicYears(list) {
    const yearsSet = new Set();
    list.forEach((w) => {
      if (!w.month) return;
      const year = w.month.slice(0, 4);
      const month = Number(w.month.slice(5, 7));
      if (month >= 8 && month <= 12) {
        yearsSet.add(`${year}-${Number(year) + 1}`); // Aug–Dec
      } else if (month >= 1 && month <= 5) {
        yearsSet.add(`${Number(year) - 1}-${year}`); // Jan–May
      }
    });
    return Array.from(yearsSet).sort();
  }

  // ===== Load wallets (folders) =====

  async function loadWallets() {
    try {
      await loadAuth();

      const data = await apiGet("/pres/api/wallets");
      wallets = data.map((w) => ({
        id: w.id,
        walletId: w.wallet_id,
        name: w.name,
        month: w.month, // e.g. "2025-08"
        beginningCash: w.beginning_cash,
        totalIncome: 0,
        totalExpenses: 0,
        endingCash: 0,
      }));

      // build year options
      // build years, newest first
      // build academic year options – e.g. 2024-2025
      function getAcademicYears(list) {
        const yearsSet = new Set();
        list.forEach((w) => {
          if (!w.month) return;
          const year = w.month.slice(0, 4);
          const month = Number(w.month.slice(5, 7));
          if (month >= 8 && month <= 12) {
            // Aug–Dec belong to year-(year+1)
            yearsSet.add(`${year}-${Number(year) + 1}`);
          } else if (month >= 1 && month <= 5) {
            // Jan–May belong to (year-1)-year
            yearsSet.add(`${Number(year) - 1}-${year}`);
          }
        });
        return Array.from(yearsSet).sort();
      }

      // build academic year options – e.g. 2024-2025
      const yearSelect = document.getElementById("wallet-year-filter");
      const academicYears = getAcademicYears(wallets);

      if (yearSelect && academicYears.length) {
        // compute current academic year from today's date
        const now = new Date();
        const y = now.getFullYear();
        const m = now.getMonth() + 1; // 1–12

        let currentAy;
        if (m >= 8 && m <= 12) {
          currentAy = `${y}-${y + 1}`; // Aug–Dec
        } else if (m >= 1 && m <= 5) {
          currentAy = `${y - 1}-${y}`; // Jan–May
        } else {
          // Jun–Jul: fallback to last academic year in data
          currentAy = academicYears[academicYears.length - 1];
        }

        if (!academicYears.includes(currentAy)) {
          currentAy = academicYears[academicYears.length - 1];
        }

        const latestAy = currentAy;

        yearSelect.innerHTML = academicYears
          .map((ay) => `<option value="${ay}">${ay}</option>`)
          .join("");

        yearSelect.value = latestAy;

        const monthOrder = [
          "08",
          "09",
          "10",
          "11",
          "12",
          "01",
          "02",
          "03",
          "04",
          "05",
        ];

        let result = wallets.filter((w) => {
          if (!w.month) return false;
          const walletYear = w.month.slice(0, 4);
          const walletMonth = w.month.slice(5, 7);
          const mNum = Number(walletMonth);

          let walletAcademicYear = "";
          if (mNum >= 8 && mNum <= 12) {
            walletAcademicYear = `${walletYear}-${Number(walletYear) + 1}`;
          } else if (mNum >= 1 && mNum <= 5) {
            walletAcademicYear = `${Number(walletYear) - 1}-${walletYear}`;
          }

          const matchesYear = walletAcademicYear === latestAy;
          const matchesAcademicMonth = monthOrder.includes(walletMonth);
          return matchesYear && matchesAcademicMonth;
        });

        result.sort((a, b) => {
          const ma = (a.month || "").slice(5, 7);
          const mb = (b.month || "").slice(5, 7);
          return monthOrder.indexOf(ma) - monthOrder.indexOf(mb);
        });

        walletsFiltered = result;
      } else {
        walletsFiltered = [...wallets];
      }

      renderWalletsList();

      const state = getViewState();
      if (state.view === "detail" && state.folderId) {
        await showWalletDetail(state.folderId);
        if (state.filter) {
          currentFilter = state.filter;
          filterButtons.forEach((b) => {
            b.classList.toggle("active", b.dataset.filter === currentFilter);
          });
          renderWalletTransactions();
        }
        if (state.tab) {
          switchTab(state.tab);
        }
      }
    } catch (err) {
      console.error(err);
      showToast("Failed to load wallets.", true);
    }
  }

  // ===== Wallet list & filters =====

  function renderWalletsList() {
    const walletsGrid = document.getElementById("wallets-grid");
    if (!walletsFiltered.length) {
      walletsGrid.innerHTML = `
        <div class="empty-state" style="grid-column: 1 / -1;">
          <img src="${walletImageUrl}" alt="No wallets" />
          <h4>No wallets found</h4>
          <p>Adjust your search or date filter.</p>
        </div>
      `;
      return;
    }

    walletsGrid.innerHTML = walletsFiltered
      .map(
        (wallet) => `
      <div class="wallet-card-item"
           style="background:url('${walletImageUrl}') center/cover no-repeat;"
           data-wallet-id="${wallet.id}">
        <h5>${wallet.name}</h5>
      </div>
    `
      )
      .join("");

    document.querySelectorAll(".wallet-card-item").forEach((card) => {
      card.addEventListener("click", () => {
        const id = Number(card.dataset.walletId);
        showWalletDetail(id);
      });
    });
  }

  function applyWalletFilters() {
    const q = walletSearchInput.value.toLowerCase();
    const yearVal = walletYearFilter.value; // e.g. "2024-2025"

    const monthOrder = [
      "08",
      "09",
      "10",
      "11",
      "12",
      "01",
      "02",
      "03",
      "04",
      "05",
    ];

    let result = wallets.filter((w) => {
      const matchesText =
        w.name.toLowerCase().includes(q) ||
        (w.month || "").toLowerCase().includes(q);

      const walletYear = (w.month || "").slice(0, 4);
      const walletMonth = (w.month || "").slice(5, 7);
      const mNum = Number(walletMonth);

      let walletAcademicYear = "";
      if (mNum >= 8 && mNum <= 12) {
        walletAcademicYear = `${walletYear}-${Number(walletYear) + 1}`;
      } else if (mNum >= 1 && mNum <= 5) {
        walletAcademicYear = `${Number(walletYear) - 1}-${walletYear}`;
      }

      const matchesYear = yearVal ? walletAcademicYear === yearVal : true;
      const matchesAcademicMonth = monthOrder.includes(walletMonth);

      return matchesText && matchesYear && matchesAcademicMonth;
    });

    result.sort((a, b) => {
      const ma = (a.month || "").slice(5, 7);
      const mb = (b.month || "").slice(5, 7);
      return monthOrder.indexOf(ma) - monthOrder.indexOf(mb);
    });

    walletsFiltered = result;
    renderWalletsList();
  }

  walletSearchInput.addEventListener("input", applyWalletFilters);
  walletYearFilter.addEventListener("change", applyWalletFilters);

  // ===== Navigation / tabs / filters =====

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
      setViewState({ filter: currentFilter });
    });
  });

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

  // ===== Budget modal =====

  walletBudgetBtn.addEventListener("click", async () => {
    if (!currentWallet) {
      showToast("Select a wallet first.", true);
      return;
    }
    budgetForm.reset();
    clearFieldError(budgetAmountInput);

    try {
      const data = await apiGet(
        `/pres/api/wallets/${currentWallet.id}/budget/current-month`
      );
      if (data && data.amount != null) {
        budgetAmountInput.value = data.amount;
      } else {
        budgetAmountInput.value = currentWallet.beginningCash || "";
      }
    } catch {
      budgetAmountInput.value = currentWallet.beginningCash || "";
    }

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

  budgetForm.addEventListener("submit", async (e) => {
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

    try {
      const payload = { amount: Number(amount) };
      await apiPost(`/pres/api/wallets/${currentWallet.id}/budget`, payload);

      const num = Number(amount);
      currentWallet.beginningCash = num;
      currentWallet.endingCash =
        (currentWallet.totalIncome || 0) -
        (currentWallet.totalExpenses || 0) +
        currentWallet.beginningCash;

      document.getElementById(
        "stat-budget"
      ).textContent = `Php ${currentWallet.beginningCash.toFixed(2)}`;
      document.getElementById(
        "stat-ending"
      ).textContent = `Php ${currentWallet.endingCash.toFixed(2)}`;

      // change button text to show the budget instead of "Add budget..."
      walletBudgetBtn.textContent = `Budget: Php ${currentWallet.beginningCash.toFixed(
        2
      )}`;

      hideBudgetModal();
      showToast("Budget saved successfully.");
    } catch (err) {
      console.error(err);
      showToast("Failed to save budget.", true);
    }
  });

  // ===== Transaction modal =====

  function openTxModal(type) {
    currentTxType = type;
    txForm.reset();
    [txDate, txQty, txIncomeType, txParticulars, txDesc, txPrice].forEach(
      clearFieldError
    );

    if (type === "income") {
      txModalTitle.textContent = "Add Income Transaction";
      txModalSubtitle.textContent =
        "Record an income transaction for this wallet.";
      txTypeWrapper.style.display = "block";
      txIncomeType.required = true;
      txParticularsWrapper.style.display = "none";
      txParticulars.required = false;
    } else {
      txModalTitle.textContent = "Add Expense Transaction";
      txModalSubtitle.textContent =
        "Record an expense transaction for this wallet.";
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

  txForm.addEventListener("submit", async (e) => {
    e.preventDefault();

    let valid = true;
    let fields = [
      [txDate, "Date is required."],
      [txQty, "Quantity is required."],
      [txDesc, "Description is required."],
      [txPrice, "Price is required."],
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

    const qty = Number(txQty.value);
    const price = Number(txPrice.value);

    const payload = {
      kind: currentTxType,
      date_issued: txDate.value,
      quantity: qty,
      income_type: currentTxType === "income" ? txIncomeType.value : null,
      particulars: currentTxType === "expense" ? txParticulars.value : null,
      description: txDesc.value,
      price: price,
    };

    const editingId = txForm.dataset.editingId || null;

    try {
      let res;
      if (editingId) {
        // update existing
        res = await apiPost(
          `/pres/api/wallets/${currentWallet.id}/transactions/${editingId}`,
          payload
        );
      } else {
        // create new (existing code)
        res = await apiPost(
          `/pres/api/wallets/${currentWallet.id}/transactions`,
          payload
        );
      }
      const saved = res.transaction;

      const tx = {
        id: saved.id,
        event: currentWallet.name,
        quantity: qty,
        price: price,
        income_type: saved.income_type,
        particulars: saved.particulars,
        raw_description: saved.description,
        amount:
          saved.kind === "expense" ? -saved.total_amount : saved.total_amount,
        date: saved.date_issued,
        type: saved.kind,
      };

      if (!walletTransactions[currentWallet.id]) {
        walletTransactions[currentWallet.id] = [];
      }

      if (editingId) {
        walletTransactions[currentWallet.id] = walletTransactions[
          currentWallet.id
        ].map((t) => (String(t.id) === String(editingId) ? tx : t));
      } else {
        walletTransactions[currentWallet.id].push(tx);
      }

      recomputeTotalsForFolder(currentWallet.id);
      updateStatsUI();
      renderWalletTransactions();
      hideTxModal();
      delete txForm.dataset.editingId;

      showToast(
        editingId
          ? "Transaction updated."
          : currentTxType === "income"
          ? "Income transaction added."
          : "Expense transaction added."
      );
    } catch (err) {
      console.error(err);
      showToast("Failed to save transaction.", true);
    }
  });

  function recomputeTotalsForFolder(folderId) {
    const txs = walletTransactions[folderId] || [];
    let income = 0;
    let expenses = 0;
    txs.forEach((tx) => {
      if (tx.type === "income") income += tx.amount;
      else if (tx.type === "expense") expenses += Math.abs(tx.amount);
    });

    const w = wallets.find((w) => w.id === folderId);
    if (w) {
      w.totalIncome = income;
      w.totalExpenses = expenses;
      w.endingCash =
        (w.beginningCash || 0) + (w.totalIncome || 0) - (w.totalExpenses || 0);
    }
    if (currentWallet && currentWallet.id === folderId) {
      currentWallet.totalIncome = income;
      currentWallet.totalExpenses = expenses;
      currentWallet.endingCash =
        (currentWallet.beginningCash || 0) +
        (currentWallet.totalIncome || 0) -
        (currentWallet.totalExpenses || 0);
    }
  }

  function updateStatsUI() {
    if (!currentWallet) return;
    document.getElementById("stat-budget").textContent = `Php ${(
      currentWallet.beginningCash || 0
    ).toFixed(2)}`;
    document.getElementById("stat-income").textContent = `Php ${(
      currentWallet.totalIncome || 0
    ).toFixed(2)}`;
    document.getElementById("stat-expense").textContent = `Php ${(
      currentWallet.totalExpenses || 0
    ).toFixed(2)}`;
    document.getElementById("stat-ending").textContent = `Php ${(
      currentWallet.endingCash || 0
    ).toFixed(2)}`;
    // stat-budget-bank can be set from currentReportDetails if you want
  }

  // ===== Receipts =====

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

  const MAX_RECEIPT_BYTES = 5 * 1024 * 1024; // 5 MB

  receiptForm.addEventListener("submit", async (e) => {
    e.preventDefault();

    let valid = true;

    if (!receiptFile.files.length) {
      showFieldError(receiptFile, "Image is required.");
      valid = false;
    } else {
      const file = receiptFile.files[0];
      if (file.size > MAX_RECEIPT_BYTES) {
        showFieldError(receiptFile, "File is too large. Maximum size is 5 MB.");
        showToast("Receipt must be 5 MB or smaller.", true);
        valid = false;
      } else {
        clearFieldError(receiptFile);
      }
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

    if (!currentWallet) {
      showToast("No wallet selected.", true);
      return;
    }

    try {
      const formData = new FormData();
      formData.append("receipt-file", receiptFile.files[0]);
      formData.append("receipt-desc", receiptDesc.value);
      formData.append("receipt-date", receiptDate.value);

      const res = await fetch(
        `/pres/api/wallets/${currentWallet.id}/receipts`,
        {
          method: "POST",
          body: formData,
          credentials: "include",
        }
      );
      if (!res.ok) throw new Error("Upload failed");
      const data = await res.json();

      if (!walletReceipts[currentWallet.id]) {
        walletReceipts[currentWallet.id] = [];
      }
      walletReceipts[currentWallet.id].push({
        id: data.id,
        name: data.name,
        date: data.date,
      });

      renderReceipts();
      hideReceiptModal();
      showToast("Receipt added successfully.");
    } catch (err) {
      console.error(err);
      showToast("Failed to upload receipt.", true);
    }
  });

  const imageViewerOverlay = document.getElementById("image-viewer-overlay");
  const imageViewerImg = document.getElementById("image-viewer-img");
  const closeImageViewer = document.getElementById("close-image-viewer");

  closeImageViewer.addEventListener("click", () => {
    imageViewerOverlay.classList.remove("active");
  });

  imageViewerOverlay.addEventListener("click", (e) => {
    if (e.target === imageViewerOverlay) {
      imageViewerOverlay.classList.remove("active");
    }
  });

  function renderReceipts() {
    const container = document.getElementById("receipts-container");
    const receipts = walletReceipts[currentWallet?.id] || [];

    if (!receipts.length) {
      container.innerHTML = `
      <div class="empty-state" style="grid-column: 1 / -1;">
        <img src="${receiptsIconUrl}" alt="No receipts" />
        <h4>No receipts yet</h4>
        <p>Upload receipts to keep track of your expenses.</p>
      </div>
    `;
      return;
    }

    container.innerHTML = receipts
      .map(
        (receipt) => `
        <div class="receipt-card" data-receipt-id="${receipt.id}">
          <div class="receipt-icon">
            <img src="${receiptsIconUrl}" alt="Receipt" />
          </div>
          <h5>${receipt.name}</h5>
          <p>${receipt.date}</p>
          <div class="receipt-actions">
            <button class="receipt-action-btn view">View</button>
            <button class="receipt-action-btn download">Download</button>
            <button class="receipt-action-btn delete">Delete</button>
          </div>
        </div>
      `
      )
      .join("");

    container.querySelectorAll(".receipt-card").forEach((card) => {
      const id = card.dataset.receiptId;
      const viewBtn = card.querySelector(".view");
      const downloadBtn = card.querySelector(".download");
      const deleteBtn = card.querySelector(".delete");

      viewBtn.addEventListener("click", async () => {
        try {
          const res = await apiGet(`/pres/api/receipts/${id}/url`);
          if (!res.url) throw new Error("No URL");
          imageViewerImg.src = res.url;
          imageViewerOverlay.classList.add("active");
        } catch (err) {
          console.error(err);
          showToast("Failed to load receipt.", true);
        }
      });

      downloadBtn.addEventListener("click", async () => {
        try {
          const res = await apiGet(`/pres/api/receipts/${id}/download-url`);
          if (!res.url) throw new Error("No URL");
          window.open(res.url, "_blank");
        } catch (err) {
          console.error(err);
          showToast("Failed to download receipt.", true);
        }
      });

      deleteBtn.addEventListener("click", () => {
        showDeleteModal({
          title: "Delete receipt",
          message: "Are you sure you want to delete this receipt?",
          onConfirm: async () => {
            try {
              await fetch(`/pres/api/receipts/${id}`, {
                method: "DELETE",
                credentials: "include",
              });
              walletReceipts[currentWallet.id] = (
                walletReceipts[currentWallet.id] || []
              ).filter((r) => String(r.id) !== String(id));
              renderReceipts();
              showToast("Receipt deleted.");
            } catch (err) {
              console.error(err);
              showToast("Failed to delete receipt.", true);
            }
          },
        });
      });
    });
  }

  // ===== Reports (financial_reports) =====

  function reportMonthKey(dateStr) {
    // assume YYYY-MM-DD sa datePrepared
    const [y, m] = dateStr.split("-");
    return `${y}-${m}`;
  }

  // gumawa ng monthKey mula sa currentReportDetails (or datePrepared)
  function monthKeyForReport(details) {
    return reportMonthKey(details.datePrepared);
  }

  function generatedKeyFor(wallet, monthKey) {
    // per wallet + per month
    return `report_generated_${wallet.walletId}_${wallet.id}_${monthKey}`;
  }

  function draftKeyFor(wallet) {
    // draft key pa rin per wallet+month, gamit datePrepared kung meron
    const date = repDatePrepared.value || new Date().toISOString().slice(0, 10);
    const month = reportMonthKey(date);
    return `report_draft_${wallet.walletId}_${wallet.id}_${month}`;
  }

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

  generateReportBtn.addEventListener("click", async () => {
    if (generateReportBtn.disabled) {
      return;
    }

    if (!currentWallet) {
      showToast("Select a wallet first.", true);
      return;
    }

    const today = new Date().toISOString().slice(0, 10);
    const currentMonthKey = reportMonthKey(today);
    const genKey = generatedKeyFor(currentWallet, currentMonthKey);

    try {
      const draftRaw = localStorage.getItem(draftKeyFor(currentWallet));
      if (draftRaw) {
        currentReportDetails = JSON.parse(draftRaw);
      }
    } catch {
      currentReportDetails = null;
    }

    // kunin next report number sa backend
    try {
      const data = await apiGet(
        `/pres/api/wallets/${currentWallet.walletId}/budgets/${currentWallet.id}/reports/next-number`
      );
      nextReportNumber = data && data.next_number ? data.next_number : 1;
    } catch {
      nextReportNumber = 1;
    }

    // prefill fields (pangalan dapat tugma sa doc)
    repEventName.value =
      currentReportDetails?.eventName || currentWallet.name || "";
    repDatePrepared.value = currentReportDetails?.datePrepared || today;
    repNumber.value =
      currentReportDetails?.number ||
      `FR-${String(nextReportNumber).padStart(3, "0")}`;
    repBudget.value = (
      currentReportDetails?.budget ??
      currentWallet.beginningCash ??
      0
    ).toFixed(2);
    repTotalExpense.value = (
      currentReportDetails?.totalExpense ??
      currentWallet.totalExpenses ??
      0
    ).toFixed(2);
    repTotalIncome.value = (
      currentReportDetails?.totalIncome ??
      currentWallet.totalIncome ??
      0
    ).toFixed(2);
    repBudgetBank.value = (currentReportDetails?.budgetBank ?? 0).toFixed(2);

    repReimb.value = currentReportDetails?.reimb ?? "";
    repPrevFund.value = currentReportDetails?.prevFund ?? "";

    [
      repEventName,
      repDatePrepared,
      repBudget,
      repTotalExpense,
      repReimb,
      repPrevFund,
    ].forEach(clearFieldError);

    reportDetailsOverlay.classList.add("active");
    await prefillReportFields(currentWallet);
  });

  function hideReportDetailsModal() {
    reportDetailsOverlay.classList.remove("active");
  }

  closeReportDetails.addEventListener("click", hideReportDetailsModal);
  cancelReportDetails.addEventListener("click", hideReportDetailsModal);
  reportDetailsOverlay.addEventListener("click", (e) => {
    if (e.target === reportDetailsOverlay) hideReportDetailsModal();
  });

  reportDetailsForm.addEventListener("submit", (e) => {
    e.preventDefault();

    let valid = true;
    const fields = [
      [repEventName, "Name of the event is required."],
      [repDatePrepared, "Date prepared is required."],
      [repBudget, "Budget is required."],
      [repTotalIncome, "Total income is required."],
      [repTotalExpense, "Total expenses is required."],
      [repReimb, "Reimbursement is required."],
      [repPrevFund, "Previous remaining fund is required."],
      [repBudgetBank, "Budget in bank is required."],
    ];

    fields.forEach(([field, msg]) => {
      if (!field.value.trim()) {
        showFieldError(field, msg);
        valid = false;
      } else if (
        [
          "rep-budget",
          "rep-total-expense",
          "rep-reimb",
          "rep-prev-fund",
        ].includes(field.id) &&
        Number(field.value) < 0
      ) {
        showFieldError(field, "Value must be zero or more.");
        valid = false;
      } else {
        clearFieldError(field);
      }
    });

    if (!valid) {
      showToast("Please complete all report details.", true);
      return;
    }

    // names aligned sa placeholders sa doc
    currentReportDetails = {
      eventName: repEventName.value.trim(), // {{EVENT_NAME}}
      datePrepared: repDatePrepared.value, // {{DATE_PREPARED}}
      number: repNumber.value, // {{REPORT_NO}}
      budget: Number(repBudget.value), // {{BUDGET}}
      totalIncome: Number(repTotalIncome.value), // {{TOTAL_INCOME}}
      totalExpense: Number(repTotalExpense.value), // {{TOTAL_EXPENSE}}
      reimb: Number(repReimb.value), // {{REIMBURSEMENT}}
      prevFund: Number(repPrevFund.value), // {{PREVIOUS_FUND}}
      budgetBank: Number(repBudgetBank.value), // {{BUDGET_IN_THE_BANK}}
    };

    if (currentWallet) {
      localStorage.setItem(
        draftKeyFor(currentWallet),
        JSON.stringify(currentReportDetails)
      );
    }

    hideReportDetailsModal();
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

  confirmGenerateBtn.addEventListener("click", async () => {
    hideGenerateModal();
    if (!currentWallet || !currentReportDetails) {
      showToast("No wallet selected or report details missing.", true);
      return;
    }

    const monthKey = reportMonthKey(currentReportDetails.datePrepared);
    const genKey = `report_generated_${currentWallet.walletId}_${currentWallet.id}_${monthKey}`;

    showToast("Generating report...", false);
    try {
      const payload = {
        wallet_id: currentWallet.walletId,
        budget_id: currentWallet.id,
        event_name: currentReportDetails.eventName,
        date_prepared: currentReportDetails.datePrepared,
        report_no: currentReportDetails.number,
        budget: currentReportDetails.budget,
        total_income: currentReportDetails.totalIncome,
        total_expense: currentReportDetails.totalExpense,
        reimbursement: currentReportDetails.reimb,
        previous_fund: currentReportDetails.prevFund,
        budget_in_the_bank: currentReportDetails.budgetBank,
      };

      await apiPost(`/pres/api/reports/generate`, payload);

      // mark as generated for this wallet+month
      localStorage.setItem(genKey, "1");
      reportGeneratedForFolderId = currentWallet.id;
      reportGeneratedForMonthKey = monthKey;

      showReportButtons();
      generateReportBtn.textContent = "Edit report";
      showToast("Report generated successfully.");
      nextReportNumber += 1;
    } catch (err) {
      console.error(err);
      showToast("Failed to generate report.", true);
    }
  });

  previewReportBtn.addEventListener("click", () => {
    if (!currentWallet || reportGeneratedForFolderId !== currentWallet.id) {
      showToast("Generate the report first for this month.", true);
      return;
    }
    window.open(
      `/pres/reports/${currentWallet.walletId}/budgets/${currentWallet.id}/preview`,
      "_blank"
    );
  });

  printReportBtn.addEventListener("click", () => {
    if (!currentWallet || reportGeneratedForFolderId !== currentWallet.id) {
      showToast("Generate the report first for this month.", true);
      return;
    }
    window.open(
      `/pres/reports/${currentWallet.walletId}/budgets/${currentWallet.id}/print`,
      "_blank"
    );
  });

  function hideSubmitModal() {
    confirmSubmitOverlay.classList.remove("active");
  }
  submitReportBtn.addEventListener("click", async () => {
    if (!currentWallet || reportGeneratedForFolderId !== currentWallet.id) {
      showToast("Generate the report first for this month.", true);
      return;
    }

    const alreadySubmitted = await checkSubmissionStatus();
    if (alreadySubmitted) {
      showToast("You already submitted this month.", true);
      return;
    }

    confirmSubmitOverlay.classList.add("active");
  });

  closeSubmitModal.addEventListener("click", hideSubmitModal);
  cancelSubmitBtn.addEventListener("click", hideSubmitModal);
  confirmSubmitOverlay.addEventListener("click", (e) => {
    if (e.target === confirmSubmitOverlay) hideSubmitModal();
  });

  confirmSubmitBtn.addEventListener("click", async () => {
    hideSubmitModal();
    if (!currentWallet || !currentReportDetails) return;

    const monthKey = reportMonthKey(currentReportDetails.datePrepared);
    const genKey = `report_generated_${currentWallet.walletId}_${currentWallet.id}_${monthKey}`;
    const draftKey = draftKeyFor(currentWallet);

    showToast("Submitting report to OSAS...", false);
    try {
      await apiPost(`/pres/reports/${currentWallet.walletId}/submit`, {});

      // tanggalin draft at mark ng generated para malinis na yung month na yun
      localStorage.removeItem(draftKey);
      localStorage.removeItem(genKey);

      showToast("Report submitted successfully.");
      hideReportButtons();
      generateReportBtn.textContent = "Generate report"; // dagdag
      // optional pero recommended: linisin in-memory state
      currentReportDetails = null;
      reportGeneratedForFolderId = null;
      reportGeneratedForMonthKey = null;

      // clear report detail fields
      repEventName.value = "";
      repDatePrepared.value = "";
      repNumber.value = "";
      repBudget.value = "";
      repTotalIncome.value = "";
      repTotalExpense.value = "";
      repReimb.value = "";
      repPrevFund.value = "";
      repBudgetBank.value = "";

      currentReportDetails = null;
      reportGeneratedForFolderId = null;
      reportGeneratedForMonthKey = null;

      // reset local state for this folder
      currentWallet.beginningCash = 0;
      currentWallet.totalIncome = 0;
      currentWallet.totalExpenses = 0;
      currentWallet.endingCash = 0;
      walletTransactions[currentWallet.id] = [];
      walletReceipts[currentWallet.id] = [];

      updateStatsUI();
      renderWalletTransactions();
      renderReceipts();

      // reload archives
      await loadWalletArchives(currentWallet.id);
      if (getViewState().tab === "archives") {
        renderArchives();
      }
    } catch (err) {
      console.error(err);
      showToast("Failed to submit report.", true);
    }
  });

  // ===== Detail view functions =====

  async function showWalletDetail(folderId) {
    currentWallet = wallets.find((w) => w.id === folderId);
    if (!currentWallet) return;

    const monthKey = currentWallet.month; // DAPAT ito ang ginagamit sa status API

    try {
      const res = await apiGet(
        `/pres/api/wallets/reports/status?month=${encodeURIComponent(monthKey)}`
      );

      if (res.submitted) {
        generateReportBtn.disabled = true;
        generateReportBtn.classList.add("disabled");
        generateReportBtn.title =
          "You already submitted a report for this month.";
      } else {
        generateReportBtn.disabled = false;
        generateReportBtn.classList.remove("disabled");
        generateReportBtn.title = "";
      }
    } catch (e) {
      console.error("Failed to load report status", e);
    }

    document.getElementById("wallet-name").textContent = currentWallet.name;
    document.getElementById("wallets-view").classList.remove("active");
    document.getElementById("wallet-detail-view").classList.add("active");

    // update budget button label based on currentWallet.beginningCash
    if (
      currentWallet &&
      typeof currentWallet.beginningCash === "number" &&
      currentWallet.beginningCash > 0
    ) {
      walletBudgetBtn.textContent = `Budget: Php ${currentWallet.beginningCash.toFixed(
        2
      )}`;
    } else {
      walletBudgetBtn.textContent = "Add budget for this month";
    }

    if (reportGeneratedForFolderId === folderId) {
      showReportButtons();
    } else {
      hideReportButtons();
    }

    setViewState({
      view: "detail",
      folderId: currentWallet.id,
    });

    await Promise.all([
      loadWalletTransactions(folderId),
      loadWalletReceipts(folderId),
      loadWalletArchives(folderId),
    ]);

    recomputeTotalsForFolder(folderId);
    updateStatsUI();

    const state = getViewState();
    const tabToShow = state.tab || "transactions";
    switchTab(tabToShow);
  }

  function showWalletsList() {
    document.getElementById("wallet-detail-view").classList.remove("active");
    document.getElementById("wallets-view").classList.add("active");
    currentWallet = null;
    setViewState({ view: "list", folderId: null });
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

    setViewState({ tab: tabName });

    if (tabName === "transactions") {
      renderWalletTransactions();
    } else if (tabName === "receipts") {
      renderReceipts();
    } else if (tabName === "archives") {
      renderArchives();
    }
  }

  // ===== Load transactions / receipts / archives from backend =====

  async function loadWalletTransactions(folderId) {
    try {
      const data = await apiGet(`/pres/api/wallets/${folderId}/transactions`);
      walletTransactions[folderId] = data.map((tx) => ({
        id: tx.id,
        event: currentWallet?.name || "",
        quantity: Number(tx.quantity),
        price: Number(tx.price),
        income_type: tx.income_type,
        particulars: tx.particulars,
        raw_description: tx.description,
        amount:
          tx.kind === "expense"
            ? -Number(tx.total_amount)
            : Number(tx.total_amount),
        date: tx.date_issued,
        type: tx.kind,
      }));

      recomputeTotalsForFolder(folderId);
    } catch (err) {
      console.error(err);
      walletTransactions[folderId] = [];
      recomputeTotalsForFolder(folderId);
    }
  }

  async function loadWalletReceipts(folderId) {
    try {
      const data = await apiGet(`/pres/api/wallets/${folderId}/receipts`);
      walletReceipts[folderId] = data.map((r) => ({
        id: r.id,
        name: r.description,
        date: r.receipt_date,
        file_url: r.file_url,
      }));
    } catch (err) {
      console.error(err);
      walletReceipts[folderId] = [];
    }
  }

  async function loadWalletArchives(folderId) {
    try {
      const data = await apiGet(`/pres/api/wallets/${folderId}/archives`);
      walletArchives[folderId] = (data || []).map((a) => ({
        id: a.id,
        report_id: a.report_id,
        report_no: a.report_no,
        event_name: a.event_name,
        date_prepared: a.date_prepared,
        budget: a.budget,
        total_expense: a.total_expense,
        reimbursement: a.reimbursement,
        previous_fund: a.previous_fund,
        remaining: a.remaining,
        file_url: a.file_url,
      }));
    } catch (err) {
      console.error(err);
      walletArchives[folderId] = [];
    }
  }

  // ===== Render transactions =====

  function renderWalletTransactions() {
    if (!currentWallet) return;

    const container = document.getElementById("transactions-container");
    const transactions = walletTransactions[currentWallet.id] || [];

    // sort by date descending
    const sorted = [...transactions].sort((a, b) => {
      // a.date and b.date are "yyyy-mm-dd"
      if (a.date < b.date) return 1;
      if (a.date > b.date) return -1;
      return 0;
    });

    let filteredTransactions = sorted;
    if (currentFilter !== "all") {
      filteredTransactions = sorted.filter((tx) => tx.type === currentFilter);
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
    filteredTransactions.forEach((tx) => (html += createTransactionItem(tx)));
    container.innerHTML = html;

    container.querySelectorAll(".transaction-item").forEach((item) => {
      const txId = item.dataset.txId;
      const toggle = item.querySelector(".tx-menu-toggle");
      const menu = item.querySelector(".tx-menu");
      const editBtn = item.querySelector(".tx-menu-item.edit");
      const deleteBtn = item.querySelector(".tx-menu-item.delete");

      toggle.addEventListener("click", (e) => {
        e.stopPropagation();
        document
          .querySelectorAll(".tx-menu.open")
          .forEach((m) => m !== menu && m.classList.remove("open"));
        menu.classList.toggle("open");
      });

      editBtn.addEventListener("click", (e) => {
        e.stopPropagation();
        menu.classList.remove("open");
        openEditTx(txId);
      });

      deleteBtn.addEventListener("click", (e) => {
        e.stopPropagation();
        menu.classList.remove("open");
        deleteTx(txId);
      });
    });

    document.addEventListener("click", () => {
      document
        .querySelectorAll(".tx-menu.open")
        .forEach((m) => m.classList.remove("open"));
    });
  }

  function createTransactionItem(tx) {
    const qty = Number(tx.quantity || 0);
    const price = Number(tx.price || 0);
    const total = qty * price;

    let labelCore;
    if (tx.type === "income") {
      labelCore = `${price} x ${qty} (${total}) - ${tx.income_type || ""}`;
    } else {
      labelCore = `${price} x ${qty} (${total}) - ${tx.particulars || ""}`;
    }

    const mainLabel = `${labelCore} - ${tx.raw_description || ""}`;
    const amountDisplay =
      tx.amount < 0 ? `-PHP ${Math.abs(tx.amount)}` : `PHP ${tx.amount}`;

    return `
    <div class="transaction-item" data-tx-id="${tx.id}">
      <div class="transaction-left">
        <h5>${tx.event}</h5>
        <p>${mainLabel}</p>
        <span class="transaction-date">${tx.date}</span>
      </div>
      <div class="transaction-right">
        <div class="transaction-amount ${tx.type}">
          ${amountDisplay}
        </div>
        <div class="tx-menu-wrapper">
          <button class="tx-menu-toggle" type="button">
            <img src="${optionsIconUrl}" alt="Options" />
          </button>
          <div class="tx-menu">
            <button class="tx-menu-item edit" type="button">Edit</button>
            <button class="tx-menu-item delete" type="button">Delete</button>
          </div>
        </div>
      </div>
    </div>
  `;
  }

  function findTxById(id) {
    const list = walletTransactions[currentWallet.id] || [];
    return list.find((tx) => String(tx.id) === String(id));
  }

  function openEditTx(txId) {
    const tx = findTxById(txId);
    if (!tx) return;

    currentTxType = tx.type;
    txForm.reset();
    [txDate, txQty, txIncomeType, txParticulars, txDesc, txPrice].forEach(
      clearFieldError
    );

    if (tx.type === "income") {
      txModalTitle.textContent = "Edit Income Transaction";
      txModalSubtitle.textContent =
        "Update this income transaction for this wallet.";
      txTypeWrapper.style.display = "block";
      txIncomeType.required = true;
      txParticularsWrapper.style.display = "none";
      txParticulars.required = false;
      txIncomeType.value = tx.income_type || "";
    } else {
      txModalTitle.textContent = "Edit Expense Transaction";
      txModalSubtitle.textContent =
        "Update this expense transaction for this wallet.";
      txTypeWrapper.style.display = "none";
      txIncomeType.required = false;
      txParticularsWrapper.style.display = "block";
      txParticulars.required = true;
      txParticulars.value = tx.particulars || "";
    }

    txDate.value = tx.date;
    txQty.value = tx.quantity;
    txDesc.value = tx.raw_description;
    txPrice.value = tx.price;

    txForm.dataset.editingId = txId;
    txModalOverlay.classList.add("active");
  }

  async function deleteTx(txId) {
    if (!currentWallet) return;

    showDeleteModal({
      title: "Delete transaction",
      message: "Are you sure you want to delete this transaction?",
      onConfirm: async () => {
        try {
          await fetch(
            `/pres/api/wallets/${currentWallet.id}/transactions/${txId}`,
            {
              method: "DELETE",
              credentials: "include",
            }
          );
          walletTransactions[currentWallet.id] = (
            walletTransactions[currentWallet.id] || []
          ).filter((t) => String(t.id) !== String(txId));
          recomputeTotalsForFolder(currentWallet.id);
          updateStatsUI();
          renderWalletTransactions();
          showToast("Transaction deleted.");
        } catch (err) {
          console.error(err);
          showToast("Failed to delete transaction.", true);
        }
      },
    });
  }

  // ===== Archives tab =====

  function renderArchives() {
    const container = document.getElementById("archives-container");
    const archives = walletArchives[currentWallet?.id] || [];

    if (!archives.length) {
      container.innerHTML = `
      <div class="empty-state" style="grid-column: 1 / -1;">
        <img src="${historyIconUrl}" alt="No archives" />
        <h4>No archives found</h4>
        <p>There are no archived reports for this month.</p>
      </div>
    `;
      return;
    }

    container.innerHTML = archives
      .map((a) => {
        const remaining = Number(a.remaining || 0);
        const remainingFormatted = remaining.toLocaleString("en-PH", {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
        });

        return `
        <div class="archive-card" data-archive-id="${a.id}">
          <h5>${a.report_no || "FR-XXX"}</h5>
          <p><strong>Event:</strong> ${a.event_name || "Untitled"}</p>
          <p><strong>Date:</strong> ${a.date_prepared || ""}</p>
          <p class="archive-remaining">
            <span class="archive-remaining-label">Remaining Balance:</span>
            <span class="archive-remaining-value">Php ${remainingFormatted}</span>
          </p>
          <div class="archive-actions">
            <button class="archive-btn download">Download</button>
          </div>
        </div>
      `;
      })
      .join("");

    container.querySelectorAll(".archive-card").forEach((card) => {
      const id = card.dataset.archiveId;
      const downloadBtn = card.querySelector(".download");

      downloadBtn.addEventListener("click", () => {
        window.open(`/pres/api/archives/${id}/download`, "_blank");
      });
    });
  }

  // ===== Expose helpers for inline onclick if needed =====

  window.walletManager = {
    showWalletDetail,
    showWalletsList,
  };

  const navItems = document.querySelectorAll(".nav-item");
  navItems.forEach((item) => {
    item.addEventListener("click", () => {
      navItems.forEach((i) => i.classList.remove("active"));
      item.classList.add("active");
    });
  });

  // initial load
  loadWallets();
});
