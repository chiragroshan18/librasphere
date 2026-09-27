/**
 * LibraSphere - Circulation & Loan Operations Controller
 * Handles circulation records, real-time fine calculation, status filters, and book returns
 */

document.addEventListener("DOMContentLoaded", () => {
  initLoans();
});

let currentStatusFilter = "all";

function initLoans() {
  setupEventListeners();
  loadLoans();
}

function setupEventListeners() {
  // Search with debounce
  const searchInput = document.getElementById("loans-search-input");
  let debounceTimer;
  searchInput.addEventListener("input", () => {
    clearTimeout(debounceTimer);
    debounceTimer = setTimeout(() => loadLoans(), 250);
  });

  // Sort dropdown
  document.getElementById("loans-sort-select").addEventListener("change", () => loadLoans());

  // Status Tabs
  const statusTabs = document.querySelectorAll("#loan-status-tabs .filter-tab");
  statusTabs.forEach(tab => {
    tab.addEventListener("click", () => {
      statusTabs.forEach(t => t.classList.remove("active"));
      tab.classList.add("active");
      currentStatusFilter = tab.dataset.status;
      loadLoans();
    });
  });

  // Refresh
  document.getElementById("btn-refresh-loans").addEventListener("click", () => {
    loadLoans();
    Toast.success("Circulation records refreshed");
  });

  // Issue modal triggers
  const btnIssue = document.getElementById("btn-open-issue-loan");
  const btnIssueHeader = document.getElementById("btn-open-issue-loan-header");
  if (btnIssue) btnIssue.addEventListener("click", () => openIssueModal());
  if (btnIssueHeader) btnIssueHeader.addEventListener("click", () => openIssueModal());

  document.getElementById("issue-loan-days").addEventListener("input", updateDueDatePreview);
  document.getElementById("form-issue-book").addEventListener("submit", handleIssueSubmit);
}

/**
 * Load and render loans
 */
async function loadLoans() {
  const tbody = document.getElementById("loans-table-body");
  const countLabel = document.getElementById("loans-count-label");
  tbody.innerHTML = `<tr><td colspan="8" style="text-align: center; padding: 2rem; color: var(--text-dim);">Loading circulation records...</td></tr>`;

  const search = document.getElementById("loans-search-input").value.trim();
  const sortBy = document.getElementById("loans-sort-select").value;

  const params = new URLSearchParams();
  if (currentStatusFilter && currentStatusFilter !== "all") params.append("status", currentStatusFilter);
  if (search) params.append("search", search);
  if (sortBy) params.append("sortBy", sortBy);

  try {
    // Also fetch all loans unfiltered to keep top KPI mini-grid accurate
    const [filteredRes, allRes] = await Promise.all([
      API.get(`/api/loans?${params.toString()}`),
      API.get("/api/loans")
    ]);

    if (!filteredRes.success) throw new Error(filteredRes.error || "Failed to load circulation records");

    const loans = filteredRes.data;
    const allLoans = allRes.data || [];

    updateKPIs(allLoans);
    countLabel.textContent = `Showing ${loans.length} circulation record(s)`;

    if (loans.length === 0) {
      tbody.innerHTML = `
        <tr>
          <td colspan="8" style="text-align: center; padding: 3rem; color: var(--text-muted);">
            No circulation records found matching the active filters.
          </td>
        </tr>
      `;
      return;
    }

    tbody.innerHTML = loans.map((l, idx) => {
      const statusClass = `badge-${l.status.toLowerCase().replace(' ', '-')}`;
      const isReturned = l.status === "Returned";

      let fineText = "-";
      if (l.status === "Overdue") {
        fineText = `<span style="color: var(--danger); font-weight: 700;">⚠️ +${l.overdueDays}d ($${l.fineAmount.toFixed(2)})</span>`;
      } else if (l.status === "Due Soon") {
        fineText = `<span style="color: var(--warning-text); font-weight: 600;">Due in &le; 3 days</span>`;
      } else if (isReturned && l.fineAmount > 0) {
        fineText = `<span style="color: var(--text-muted);">Fine Paid: $${l.fineAmount.toFixed(2)}</span>`;
      } else if (!isReturned) {
        fineText = `<span style="color: var(--success-text); font-size: 0.8rem;">On Schedule</span>`;
      }

      return `
        <tr class="stagger-${(idx % 6) + 1}">
          <td style="font-family: monospace; font-weight: 700; color: var(--primary);">
            ${l.id || l.loanId}
          </td>
          <td>
            <div style="font-weight: 700; color: var(--text-main); line-height: 1.25;">
              ${l.bookTitle}
            </div>
            <div style="font-size: 0.75rem; color: var(--text-muted); margin-top: 2px;">
              ${l.bookCategory} • ${l.bookAuthor}
            </div>
          </td>
          <td>
            <div style="font-weight: 600; color: var(--text-main);">${l.memberName}</div>
            <div style="font-size: 0.72rem; color: var(--text-dim);">${l.memberEmail || ''}</div>
          </td>
          <td style="color: var(--text-muted); font-size: 0.825rem;">
            ${l.borrowDate || l.borrowedAt}
          </td>
          <td style="font-weight: 600; font-size: 0.825rem; color: ${l.status === 'Overdue' ? 'var(--danger)' : l.status === 'Due Soon' ? 'var(--warning-text)' : 'inherit'};">
            ${l.dueDate}
          </td>
          <td>
            <span class="badge ${statusClass}">${l.status}</span>
          </td>
          <td>
            ${fineText}
          </td>
          <td style="text-align: right;">
            ${!isReturned ? `
              <button class="btn btn-primary btn-sm" onclick="returnLoan('${l.id || l.loanId}', '${(l.bookTitle || '').replace(/'/g, "\\'")}', ${l.fineAmount || 0})">
                <span>📥</span> Return Book
              </button>
            ` : `
              <span style="font-size: 0.75rem; color: var(--text-dim); font-style: italic;">
                Returned on ${l.returnDate || l.returnedAt || 'N/A'}
              </span>
            `}
          </td>
        </tr>
      `;
    }).join("");
  } catch (err) {
    tbody.innerHTML = `<tr><td colspan="8" style="color: var(--danger); text-align: center; padding: 2rem;">Error: ${err.message}</td></tr>`;
  }
}

/**
 * Update circulation KPI cards
 */
function updateKPIs(allLoans) {
  const active = allLoans.filter(l => l.status === "Active" || l.status === "Due Soon");
  const dueSoon = allLoans.filter(l => l.status === "Due Soon");
  const overdue = allLoans.filter(l => l.status === "Overdue");
  const returned = allLoans.filter(l => l.status === "Returned");

  const totalFines = overdue.reduce((sum, l) => sum + (l.fineAmount || 0), 0);

  document.getElementById("kpi-active-loans").textContent = active.length;
  document.getElementById("kpi-due-soon").textContent = dueSoon.length;
  document.getElementById("kpi-overdue-loans").textContent = overdue.length;
  document.getElementById("kpi-fines-total").textContent = `Active Fines: $${totalFines.toFixed(2)}`;
  document.getElementById("kpi-returned-loans").textContent = returned.length;
}

/**
 * Return a loaned book
 */
window.returnLoan = async function(loanId, bookTitle, fineAmount) {
  let confirmMessage = `Confirm returning '${bookTitle}' back to library inventory?`;
  if (fineAmount > 0) {
    confirmMessage = `⚠️ This volume is OVERDUE.\n\nAssessed fine: $${fineAmount.toFixed(2)}.\n\nConfirm payment and mark volume as returned?`;
  }

  if (!confirm(confirmMessage)) return;

  try {
    const res = await API.post(`/api/loans/${loanId}/return`);
    if (res.success) {
      Toast.success(res.message || "Book successfully returned!");
      await loadLoans();
    }
  } catch (err) {
    Toast.error(err.message);
  }
};

/**
 * Issue Book Modal Setup
 */
async function openIssueModal() {
  try {
    const [booksRes, membersRes] = await Promise.all([
      API.get("/api/books?availableOnly=true"),
      API.get("/api/members")
    ]);

    const books = booksRes.data || [];
    const members = membersRes.data || [];

    const bookSelect = document.getElementById("issue-book-id");
    bookSelect.innerHTML = `<option value="">-- Choose Book in Stock (${books.length} available) --</option>` +
      books.map(b => `<option value="${b.id}">${b.title} (${b.availableCopies} available)</option>`).join("");

    const memberSelect = document.getElementById("issue-member-id");
    memberSelect.innerHTML = `<option value="">-- Choose Member (${members.length}) --</option>` +
      members.map(m => `<option value="${m.id}">${m.name} (${m.tier || m.membershipTier || "Standard"})</option>`).join("");

    updateDueDatePreview();
    Modal.open("modal-issue-book");
  } catch (err) {
    Toast.error("Failed to load checkout options: " + err.message);
  }
}

function updateDueDatePreview() {
  const days = parseInt(document.getElementById("issue-loan-days").value, 10) || 14;
  const d = new Date();
  d.setDate(d.getDate() + days);
  document.getElementById("issue-due-date-preview").textContent = `${d.toDateString()} (${days} days duration)`;
}

async function handleIssueSubmit(e) {
  e.preventDefault();
  const bookId = document.getElementById("issue-book-id").value;
  const memberId = document.getElementById("issue-member-id").value;
  const loanDays = document.getElementById("issue-loan-days").value;

  if (!bookId || !memberId) {
    Toast.warning("Please choose both a book and a member.");
    return;
  }

  const submitBtn = document.getElementById("btn-submit-issue");
  submitBtn.disabled = true;
  submitBtn.innerHTML = "<span>⏳</span> Issuing...";

  try {
    const res = await API.post("/api/loans/borrow", {
      bookId,
      memberId,
      loanDays
    });

    if (res.success) {
      Toast.success(res.message || "Book successfully issued!");
      Modal.close("modal-issue-book");
      await loadLoans();
    }
  } catch (err) {
    Toast.error(err.message);
  } finally {
    submitBtn.disabled = false;
    submitBtn.innerHTML = "<span>✅</span> Confirm & Issue";
  }
}
