/**
 * LibraSphere - Dashboard Controller
 * Powers live metrics, recommendation highlights, recent acquisitions, and activity stream
 */

document.addEventListener("DOMContentLoaded", () => {
  initDashboard();
  setupIssueModal();
});

let allMembers = [];
let availableBooks = [];

async function initDashboard() {
  await Promise.all([
    loadDashboardMetrics(),
    loadMembersDropdown()
  ]);
}

/**
 * Load dashboard data from /api/dashboard
 */
async function loadDashboardMetrics() {
  try {
    const res = await API.get("/api/dashboard");
    if (!res.success) throw new Error(res.error || "Failed to load dashboard data");

    const data = res.data;
    renderMetrics(data.metrics);
    renderRecentBooks(data.recentlyAdded);
    renderDueSoon(data.dueSoonLoans);
    renderActivityStream(data.recentActivities);
  } catch (err) {
    Toast.error(err.message);
  }
}

/**
 * Update top KPI numbers
 */
function renderMetrics(m) {
  document.getElementById("stat-total-titles").textContent = m.totalTitles;
  document.getElementById("stat-categories-count").textContent = `Across ${m.categoriesCount} categories`;

  document.getElementById("stat-total-copies").textContent = m.totalCopies;

  document.getElementById("stat-available-copies").textContent = m.availableCopies;
  const availPct = m.totalCopies > 0 ? Math.round((m.availableCopies / m.totalCopies) * 100) : 0;
  document.getElementById("stat-available-percent").textContent = `${availPct}% of total inventory`;

  document.getElementById("stat-active-loans").textContent = m.activeLoansCount;
  document.getElementById("stat-returned-loans").textContent = `${m.returnedLoansCount} returned lifetime`;

  document.getElementById("stat-overdue-loans").textContent = m.overdueLoansCount;
  document.getElementById("stat-fines-accrued").textContent = `$${m.totalFinesAccrued.toFixed(2)} active fines`;

  document.getElementById("stat-active-members").textContent = m.activeMembersCount;
  document.getElementById("stat-total-members").textContent = `${m.totalMembersCount} total members`;
}

/**
 * Load members for recommendation spotlight dropdown
 */
async function loadMembersDropdown() {
  try {
    const res = await API.get("/api/members");
    if (!res.success) return;

    allMembers = res.data;
    const select = document.getElementById("select-rec-member");
    select.innerHTML = allMembers.map(m => `
      <option value="${m.id}">${m.name} (${m.tier || m.membershipTier || "Standard"})</option>
    `).join("");

    if (allMembers.length > 0) {
      loadRecommendations(allMembers[0].id);
    }

    select.addEventListener("change", (e) => {
      loadRecommendations(e.target.value);
    });
  } catch (err) {
    console.error("Failed to load members for recs:", err);
  }
}

/**
 * Load and render recommendations for selected member
 */
async function loadRecommendations(memberId) {
  const container = document.getElementById("recommendations-container");
  container.innerHTML = `<div style="padding: 1.5rem; text-align: center; color: var(--text-dim); grid-column: 1 / -1;">Computing recommendation scores...</div>`;

  try {
    const res = await API.get(`/api/recommendations/${memberId}?limit=4`);
    if (!res.success || !res.data || res.data.length === 0) {
      container.innerHTML = `<div style="padding: 1.5rem; text-align: center; color: var(--text-dim); grid-column: 1 / -1;">No recommendations generated yet.</div>`;
      return;
    }

    container.innerHTML = res.data.map(item => {
      const b = item.book;
      return `
        <div class="rec-card animate-fadeInUp">
          <div class="rec-score-badge">Match: ${item.recommendationScore} pts</div>
          <div style="font-size: 0.72rem; font-weight: 700; color: var(--primary); text-transform: uppercase;">
            ${b.category}
          </div>
          <h3 style="font-size: 0.95rem; font-weight: 700; color: var(--text-main); margin-bottom: 0.15rem; line-height: 1.3;">
            ${b.title}
          </h3>
          <div style="font-size: 0.8rem; color: var(--text-muted); margin-bottom: 0.5rem;">
            by ${b.author} (${b.publishedYear})
          </div>

          <div class="rec-reasons">
            <div class="rec-reasons-title">Why recommended:</div>
            <ul class="rec-reasons-list">
              ${item.reasons.map(r => `<li><span>✦</span> <span>${r}</span></li>`).join("")}
            </ul>
          </div>

          <div style="display: flex; align-items: center; justify-content: space-between; margin-top: auto; padding-top: 0.5rem;">
            <span class="stock-indicator ${b.availableCopies > 0 ? 'stock-available' : 'stock-out'}">
              ${b.availableCopies > 0 ? `🟢 ${b.availableCopies} available` : '🔴 Checked out'}
            </span>
            ${b.availableCopies > 0 ? `
              <button class="btn btn-secondary btn-sm" onclick="openIssueModalForBook('${b.id}')">
                Issue Book
              </button>
            ` : `
              <button class="btn btn-secondary btn-sm" disabled style="opacity: 0.5;">
                Waitlist
              </button>
            `}
          </div>
        </div>
      `;
    }).join("");
  } catch (err) {
    container.innerHTML = `<div style="padding: 1.5rem; text-align: center; color: var(--danger); grid-column: 1 / -1;">Failed to load recommendations: ${err.message}</div>`;
  }
}

/**
 * Render recently catalogued books
 */
function renderRecentBooks(books) {
  const container = document.getElementById("recent-books-container");
  if (!books || books.length === 0) {
    container.innerHTML = `<p style="color: var(--text-dim); text-align: center; padding: 1.5rem;">No recently catalogued books</p>`;
    return;
  }

  container.innerHTML = books.map((b, idx) => {
    const excerpt = (b.description || '').replace(/"/g, '&quot;').slice(0, 110);
    return `
    <div class="book-card animate-fadeInUp stagger-${(idx % 4) + 1}" data-book-id="${b.id}">
      <!-- 3D Book Stage with Pages Stack, Ribbon, and Swinging Cover -->
      <div class="book-stage">
        <div class="book-pages-stack">
          <div class="book-inner-page">
            <div class="page-seal">✦ ATHENAEUM ARCHIVES ✦</div>
            <p class="page-excerpt">“${excerpt}...”</p>
            <div class="page-meta">
              <span>ISBN: <strong>${b.isbn}</strong></span>
              <span>Ed. <strong>${b.publishedYear}</strong></span>
            </div>
          </div>
        </div>

        <div class="book-ribbon"></div>

        <div class="book-cover" style="background: ${b.coverGradient || 'linear-gradient(135deg, #1e293b, #3b82f6)'}">
          <div class="cover-spine-ribs"></div>
          <div class="cover-header">
            <span class="cover-category">${b.category}</span>
            <span class="cover-rating">★ ${b.rating}</span>
          </div>
          <div class="cover-body">
            <div class="cover-title">${b.title}</div>
            <div class="cover-author">by ${b.author}</div>
          </div>
          <div class="cover-open-hint">
            <span>📖 Open Book</span>
          </div>
        </div>
      </div>

      <div class="book-content">
        <p class="book-desc">${b.description}</p>
        <div class="book-footer">
          <span class="stock-indicator ${b.availableCopies > 0 ? 'stock-available' : 'stock-out'}">
            ${b.availableCopies > 0 ? `🟢 ${b.availableCopies} copies ready` : '🔴 Checked out'}
          </span>
          <button class="btn btn-primary btn-sm" onclick="openIssueModalForBook('${b.id}')" ${b.availableCopies === 0 ? 'disabled style="opacity: 0.5;"' : ''}>
            Issue
          </button>
        </div>
      </div>
    </div>
  `;
  }).join("");
}

/**
 * Render due soon alerts
 */
function renderDueSoon(loans) {
  const container = document.getElementById("due-soon-container");
  if (!loans || loans.length === 0) {
    container.innerHTML = `
      <div style="text-align: center; padding: 1.5rem 0; color: var(--text-muted); font-size: 0.875rem;">
        <span>🎉</span> No urgent or due-soon books today!
      </div>
    `;
    return;
  }

  container.innerHTML = loans.map(l => `
    <div style="display: flex; align-items: center; justify-content: space-between; padding: 0.75rem 0; border-bottom: 1px solid var(--border-color); gap: 0.75rem;">
      <div style="min-width: 0;">
        <div style="font-weight: 700; font-size: 0.875rem; color: var(--text-main); white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">
          ${l.bookTitle}
        </div>
        <div style="font-size: 0.75rem; color: var(--text-muted);">
          Borrowed by <strong style="color: var(--text-main);">${l.memberName}</strong> • Due: <span style="color: var(--warning-text); font-weight: 600;">${l.dueDate}</span>
        </div>
      </div>
      <button class="btn btn-secondary btn-sm" onclick="returnLoanPrompt('${l.id || l.loanId}', '${(l.bookTitle || '').replace(/'/g, "\\'")}')">
        Return
      </button>
    </div>
  `).join("");
}

/**
 * Render live activity stream
 */
function renderActivityStream(activities) {
  const container = document.getElementById("activity-stream");
  if (!activities || activities.length === 0) {
    container.innerHTML = `<p style="color: var(--text-dim); font-size: 0.85rem;">No recent activities logged.</p>`;
    return;
  }

  const markerClass = (type) => {
    if (type === "BORROW") return "borrow";
    if (type === "RETURN") return "return";
    if (type === "OVERDUE_ALERT") return "alert";
    return "book";
  };

  container.innerHTML = activities.map(act => {
    const timeFormatted = new Date(act.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    return `
      <div class="timeline-item">
        <div class="timeline-marker ${markerClass(act.type)}"></div>
        <div class="timeline-content">
          <div class="timeline-text">${act.message}</div>
          <div class="timeline-meta">${timeFormatted} • System Audit Log</div>
        </div>
      </div>
    `;
  }).join("");
}

/**
 * Setup Issue Book Modal & Handlers
 */
async function setupIssueModal() {
  const btnQuickBorrow = document.getElementById("btn-quick-borrow");
  if (btnQuickBorrow) {
    btnQuickBorrow.addEventListener("click", () => openIssueModal());
  }

  const btnRefresh = document.getElementById("btn-refresh-dashboard");
  if (btnRefresh) {
    btnRefresh.addEventListener("click", async () => {
      btnRefresh.disabled = true;
      btnRefresh.innerHTML = "<span>⏳</span> Updating...";
      await loadDashboardMetrics();
      Toast.success("Dashboard metrics synced with live store");
      btnRefresh.disabled = false;
      btnRefresh.innerHTML = "<span>🔄</span> Refresh Stats";
    });
  }

  const loanDaysInput = document.getElementById("issue-loan-days");
  if (loanDaysInput) {
    loanDaysInput.addEventListener("input", updateDueDatePreview);
  }

  const form = document.getElementById("form-issue-book");
  if (form) {
    form.addEventListener("submit", handleIssueSubmit);
  }
}

function updateDueDatePreview() {
  const days = parseInt(document.getElementById("issue-loan-days").value, 10) || 14;
  const d = new Date();
  d.setDate(d.getDate() + days);
  document.getElementById("issue-due-date-preview").textContent = `${d.toDateString()} (${days} days)`;
}

async function openIssueModal(preselectedBookId = null) {
  try {
    // Load fresh books and members
    const [booksRes, membersRes] = await Promise.all([
      API.get("/api/books?availableOnly=true"),
      API.get("/api/members")
    ]);

    availableBooks = booksRes.data || [];
    allMembers = membersRes.data || [];

    const bookSelect = document.getElementById("issue-book-id");
    bookSelect.innerHTML = `<option value="">-- Choose Available Book (${availableBooks.length} available) --</option>` +
      availableBooks.map(b => `
        <option value="${b.id}" ${b.id === preselectedBookId ? "selected" : ""}>
          ${b.title} (${b.availableCopies} available)
        </option>
      `).join("");

    const memberSelect = document.getElementById("issue-member-id");
    memberSelect.innerHTML = `<option value="">-- Choose Registered Member (${allMembers.length}) --</option>` +
      allMembers.map(m => `
        <option value="${m.id}">
          ${m.name} — ${m.tier || m.membershipTier || "Standard"} (${m.activeLoansCount || 0} active loans)
        </option>
      `).join("");

    updateDueDatePreview();
    Modal.open("modal-issue-book");
  } catch (err) {
    Toast.error("Failed to load circulation options: " + err.message);
  }
}

window.openIssueModalForBook = function(bookId) {
  openIssueModal(bookId);
};

async function handleIssueSubmit(e) {
  e.preventDefault();
  const bookId = document.getElementById("issue-book-id").value;
  const memberId = document.getElementById("issue-member-id").value;
  const loanDays = document.getElementById("issue-loan-days").value;

  if (!bookId || !memberId) {
    Toast.warning("Please select both a book title and a member.");
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
      await loadDashboardMetrics();
      // Reload recommendations in case active member changed
      const currentRecMember = document.getElementById("select-rec-member").value;
      if (currentRecMember) loadRecommendations(currentRecMember);
    }
  } catch (err) {
    Toast.error(err.message);
  } finally {
    submitBtn.disabled = false;
    submitBtn.innerHTML = "<span>✅</span> Confirm & Issue";
  }
}

window.returnLoanPrompt = async function(loanId, bookTitle) {
  if (!confirm(`Confirm returning volume '${bookTitle}' to inventory?`)) return;

  try {
    const res = await API.post(`/api/loans/${loanId}/return`);
    if (res.success) {
      Toast.success(res.message || "Book successfully returned!");
      await loadDashboardMetrics();
      const currentRecMember = document.getElementById("select-rec-member").value;
      if (currentRecMember) loadRecommendations(currentRecMember);
    }
  } catch (err) {
    Toast.error(err.message);
  }
};
