/**
 * LibraSphere - Catalog Controller
 * Powers book discovery, instant search, multi-category filtering, detail modal, and new acquisitions
 */

document.addEventListener("DOMContentLoaded", () => {
  initCatalog();
});

let currentCategory = "All";
let allCategories = [];
let allMembers = [];
let currentViewingBook = null;

async function initCatalog() {
  setupEventListeners();
  await Promise.all([
    loadCategories(),
    loadMembers(),
    loadBooks()
  ]);
}

function setupEventListeners() {
  // Search with debounce
  const searchInput = document.getElementById("catalog-search-input");
  let debounceTimer;
  searchInput.addEventListener("input", () => {
    clearTimeout(debounceTimer);
    debounceTimer = setTimeout(() => {
      loadBooks();
    }, 250);
  });

  // Sort & Availability
  document.getElementById("catalog-sort-select").addEventListener("change", () => loadBooks());
  document.getElementById("catalog-available-only").addEventListener("change", () => loadBooks());

  // Reset Filters
  document.getElementById("btn-reset-filters").addEventListener("click", () => {
    searchInput.value = "";
    document.getElementById("catalog-sort-select").value = "rating-desc";
    document.getElementById("catalog-available-only").checked = false;
    currentCategory = "All";
    document.querySelectorAll(".filter-tab").forEach(tab => {
      tab.classList.toggle("active", tab.dataset.category === "All");
    });
    loadBooks();
  });

  // Add Book Modal
  const openAddBtn = document.getElementById("btn-open-add-book");
  const openAddBtnHeader = document.getElementById("btn-open-add-book-header");
  if (openAddBtn) openAddBtn.addEventListener("click", () => Modal.open("modal-add-book"));
  if (openAddBtnHeader) openAddBtnHeader.addEventListener("click", () => Modal.open("modal-add-book"));

  document.getElementById("form-add-book").addEventListener("submit", handleAddBookSubmit);

  // Issue Book Modal
  document.getElementById("issue-loan-days").addEventListener("input", updateDueDatePreview);
  document.getElementById("form-issue-book").addEventListener("submit", handleIssueSubmit);

  document.getElementById("btn-details-issue-book").addEventListener("click", () => {
    if (currentViewingBook) {
      Modal.close("modal-book-details");
      openIssueModal(currentViewingBook);
    }
  });
}

/**
 * Load Categories for Filter Chips
 */
async function loadCategories() {
  try {
    const res = await API.get("/api/books/categories");
    if (!res.success) return;

    allCategories = res.data;
    const tabsContainer = document.getElementById("category-tabs");

    tabsContainer.innerHTML = `
      <button class="filter-tab ${currentCategory === 'All' ? 'active' : ''}" data-category="All">
        📚 All Volumes
      </button>
      ${allCategories.map(c => `
        <button class="filter-tab ${currentCategory === c.name ? 'active' : ''}" data-category="${c.name}">
          <span>${c.icon}</span> ${c.name} (${c.bookCount})
        </button>
      `).join("")}
    `;

    tabsContainer.querySelectorAll(".filter-tab").forEach(tab => {
      tab.addEventListener("click", () => {
        tabsContainer.querySelectorAll(".filter-tab").forEach(t => t.classList.remove("active"));
        tab.classList.add("active");
        currentCategory = tab.dataset.category;
        loadBooks();
      });
    });
  } catch (err) {
    console.error("Failed to load categories:", err);
  }
}

/**
 * Load Members for Issue Dropdown
 */
async function loadMembers() {
  try {
    const res = await API.get("/api/members");
    if (res.success) {
      allMembers = res.data;
      const select = document.getElementById("issue-member-id");
      select.innerHTML = `<option value="">-- Choose Registered Member --</option>` +
        allMembers.map(m => `
          <option value="${m.id}">${m.name} (${m.tier || m.membershipTier || "Standard"})</option>
        `).join("");
    }
  } catch (err) {
    console.error("Failed to load members:", err);
  }
}

/**
 * Load & Render Books with Applied Filters
 */
async function loadBooks() {
  const grid = document.getElementById("catalog-books-grid");
  const countLabel = document.getElementById("results-count");
  grid.innerHTML = `<div style="grid-column: 1 / -1; text-align: center; padding: 3rem; color: var(--text-dim);"><span>🔍</span> Filtering catalog...</div>`;

  const search = document.getElementById("catalog-search-input").value.trim();
  const availableOnly = document.getElementById("catalog-available-only").checked;
  const sortVal = document.getElementById("catalog-sort-select").value;

  let sortBy = "rating";
  let sortOrder = "desc";
  if (sortVal === "rating-desc") { sortBy = "rating"; sortOrder = "desc"; }
  else if (sortVal === "year-desc") { sortBy = "publishedYear"; sortOrder = "desc"; }
  else if (sortVal === "title-asc") { sortBy = "title"; sortOrder = "asc"; }
  else if (sortVal === "available-desc") { sortBy = "availableCopies"; sortOrder = "desc"; }

  const params = new URLSearchParams();
  if (search) params.append("search", search);
  if (currentCategory && currentCategory !== "All") params.append("category", currentCategory);
  if (availableOnly) params.append("availableOnly", "true");
  params.append("sortBy", sortBy);
  params.append("sortOrder", sortOrder);

  try {
    const res = await API.get(`/api/books?${params.toString()}`);
    if (!res.success) throw new Error(res.error || "Failed to load catalog");

    const books = res.data;
    countLabel.textContent = `Showing ${books.length} title(s) in catalog`;

    if (books.length === 0) {
      grid.innerHTML = `
        <div style="grid-column: 1 / -1; text-align: center; padding: 4rem 1rem; color: var(--text-muted); background: var(--bg-card); border-radius: var(--radius-lg); border: 1px dashed var(--border-color);">
          <div style="font-size: 2.5rem; margin-bottom: 0.5rem;">🔍</div>
          <h3 style="color: var(--text-main); font-weight: 700; margin-bottom: 0.5rem;">No matching volumes found</h3>
          <p style="font-size: 0.9rem;">Try adjusting your search criteria, clearing category filters, or add this book to the catalog.</p>
        </div>
      `;
      return;
    }

    grid.innerHTML = books.map((b, idx) => {
      const excerpt = (b.description || '').replace(/"/g, '&quot;').slice(0, 110);
      return `
      <div class="book-card animate-fadeInUp stagger-${(idx % 6) + 1}" data-book-id="${b.id}">
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

          <div class="book-tags">
            ${(b.tags || []).slice(0, 3).map(t => `<span class="tag-pill">${t}</span>`).join("")}
          </div>

          <div class="book-footer">
            <span class="stock-indicator ${b.availableCopies > 0 ? 'stock-available' : 'stock-out'}">
              ${b.availableCopies > 0 ? `🟢 ${b.availableCopies}/${b.totalCopies} Available` : '🔴 Checked Out'}
            </span>
            <div style="display: flex; gap: 0.4rem;">
              <button class="btn btn-secondary btn-sm" onclick="viewBookDetails('${b.id}')">
                Details
              </button>
              <button class="btn btn-primary btn-sm" onclick="quickIssueBook('${b.id}')" ${b.availableCopies <= 0 ? 'disabled style="opacity: 0.5;"' : ''}>
                Issue
              </button>
            </div>
          </div>
        </div>
      </div>
    `;
    }).join("");
  } catch (err) {
    grid.innerHTML = `<div style="grid-column: 1 / -1; color: var(--danger); text-align: center; padding: 2rem;">Error: ${err.message}</div>`;
  }
}

/**
 * View Detailed Book Information Modal
 */
window.viewBookDetails = async function(bookId) {
  try {
    const res = await API.get(`/api/books/${bookId}`);
    if (!res.success) throw new Error(res.error || "Failed to load book details");

    const b = res.data;
    currentViewingBook = b;

    const content = document.getElementById("book-details-content");
    content.innerHTML = `
      <div style="display: flex; gap: 1.5rem; flex-wrap: wrap;">
        <div style="flex: 1; min-width: 240px; height: 200px; border-radius: var(--radius-md); background: ${b.coverGradient}; padding: 1.5rem; display: flex; flex-direction: column; justify-content: space-between; color: white; position: relative;">
          <div>
            <span class="cover-category">${b.category}</span>
          </div>
          <div>
            <h2 style="font-size: 1.25rem; font-weight: 800; color: white;">${b.title}</h2>
            <div style="font-size: 0.9rem; opacity: 0.9; margin-top: 0.25rem;">by ${b.author}</div>
          </div>
        </div>

        <div style="flex: 1.5; min-width: 280px; display: flex; flex-direction: column; gap: 0.75rem;">
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 0.75rem; background: var(--bg-tertiary); padding: 1rem; border-radius: var(--radius-md); font-size: 0.85rem;">
            <div><strong style="color: var(--text-muted); display: block; font-size: 0.72rem; text-transform: uppercase;">Identifier</strong> <code style="color: var(--primary); font-weight: 700;">${b.id}</code></div>
            <div><strong style="color: var(--text-muted); display: block; font-size: 0.72rem; text-transform: uppercase;">ISBN</strong> ${b.isbn || "N/A"}</div>
            <div><strong style="color: var(--text-muted); display: block; font-size: 0.72rem; text-transform: uppercase;">Published Year</strong> ${b.publishedYear}</div>
            <div><strong style="color: var(--text-muted); display: block; font-size: 0.72rem; text-transform: uppercase;">Rating</strong> ★ ${b.rating} / 5.0</div>
            <div><strong style="color: var(--text-muted); display: block; font-size: 0.72rem; text-transform: uppercase;">Total Copies</strong> ${b.totalCopies}</div>
            <div><strong style="color: var(--text-muted); display: block; font-size: 0.72rem; text-transform: uppercase;">Available Now</strong> <span style="font-weight: 700; color: ${b.availableCopies > 0 ? 'var(--success-text)' : 'var(--danger-text)'};">${b.availableCopies}</span></div>
          </div>

          <div>
            <h4 style="font-size: 0.85rem; font-weight: 700; color: var(--text-muted); text-transform: uppercase; margin-bottom: 0.35rem;">Synopsis & Abstract</h4>
            <p style="font-size: 0.875rem; line-height: 1.55; color: var(--text-main);">${b.description}</p>
          </div>

          <div>
            <h4 style="font-size: 0.85rem; font-weight: 700; color: var(--text-muted); text-transform: uppercase; margin-bottom: 0.35rem;">Subject Tags</h4>
            <div style="display: flex; flex-wrap: wrap; gap: 0.4rem;">
              ${(b.tags || []).map(t => `<span class="tag-pill" style="font-size: 0.8rem; padding: 0.25rem 0.65rem;">🏷️ ${t}</span>`).join("")}
            </div>
          </div>
        </div>
      </div>
    `;

    const issueBtn = document.getElementById("btn-details-issue-book");
    if (b.availableCopies <= 0) {
      issueBtn.disabled = true;
      issueBtn.textContent = "Out of Stock";
      issueBtn.style.opacity = "0.5";
    } else {
      issueBtn.disabled = false;
      issueBtn.innerHTML = "<span>📖</span> Issue This Book";
      issueBtn.style.opacity = "1";
    }

    Modal.open("modal-book-details");
  } catch (err) {
    Toast.error(err.message);
  }
};

/**
 * Open Issue Book Modal
 */
window.quickIssueBook = function(bookId) {
  const book = currentViewingBook && currentViewingBook.id === bookId
    ? currentViewingBook
    : { id: bookId, title: "Selected Volume" };

  openIssueModal(book);
};

function openIssueModal(book) {
  document.getElementById("issue-book-id").value = book.id;
  document.getElementById("issue-book-title-display").textContent = `${book.title} (ID: ${book.id})`;
  updateDueDatePreview();
  Modal.open("modal-issue-book");
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

  if (!memberId) {
    Toast.warning("Please select a registered member.");
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
      await loadBooks();
      await loadCategories();
    }
  } catch (err) {
    Toast.error(err.message);
  } finally {
    submitBtn.disabled = false;
    submitBtn.innerHTML = "<span>✅</span> Confirm Checkout";
  }
}

/**
 * Add New Book Form Submission
 */
async function handleAddBookSubmit(e) {
  e.preventDefault();

  const title = document.getElementById("add-book-title").value.trim();
  const author = document.getElementById("add-book-author").value.trim();
  const category = document.getElementById("add-book-category").value;
  const publishedYear = document.getElementById("add-book-year").value;
  const totalCopies = document.getElementById("add-book-copies").value;
  const isbn = document.getElementById("add-book-isbn").value.trim();
  const rating = document.getElementById("add-book-rating").value;
  const tags = document.getElementById("add-book-tags").value;
  const description = document.getElementById("add-book-desc").value.trim();

  const submitBtn = document.getElementById("btn-submit-add-book");
  submitBtn.disabled = true;
  submitBtn.innerHTML = "<span>⏳</span> Cataloguing...";

  try {
    const res = await API.post("/api/books", {
      title,
      author,
      category,
      publishedYear,
      totalCopies,
      availableCopies: totalCopies,
      isbn,
      rating,
      tags,
      description
    });

    if (res.success) {
      Toast.success(`'${res.data.title}' catalogued successfully!`);
      document.getElementById("form-add-book").reset();
      Modal.close("modal-add-book");
      await loadCategories();
      await loadBooks();
    }
  } catch (err) {
    Toast.error(err.message);
  } finally {
    submitBtn.disabled = false;
    submitBtn.innerHTML = "<span>💾</span> Save & Catalog";
  }
}
