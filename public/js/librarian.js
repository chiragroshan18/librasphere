/**
 * LibraSphere - Librarian Operations & Administration Controller
 * Manages full CRUD operations for books and members, and system dataset restore/clear controls
 */

document.addEventListener("DOMContentLoaded", () => {
  initLibrarianDesk();
});

let allBooks = [];
let allMembers = [];

function initLibrarianDesk() {
  setupEventListeners();
  loadAllData();
}

function setupEventListeners() {
  // Sync
  document.getElementById("btn-refresh-all").addEventListener("click", () => {
    loadAllData();
    Toast.success("All administrative rosters synced with in-memory store");
  });

  // System State Operations
  document.getElementById("btn-restore-dataset").addEventListener("click", handleRestoreDataset);
  document.getElementById("btn-clear-dataset").addEventListener("click", handleClearDataset);

  // Add Book
  document.getElementById("btn-open-add-book").addEventListener("click", () => Modal.open("modal-add-book"));
  document.getElementById("form-add-book").addEventListener("submit", handleAddBookSubmit);

  // Edit Book
  document.getElementById("form-edit-book").addEventListener("submit", handleEditBookSubmit);

  // Add Member
  document.getElementById("btn-open-add-member").addEventListener("click", () => Modal.open("modal-add-member"));
  document.getElementById("form-add-member").addEventListener("submit", handleAddMemberSubmit);

  // Edit Member
  document.getElementById("form-edit-member").addEventListener("submit", handleEditMemberSubmit);
}

async function loadAllData() {
  await Promise.all([
    loadAdminBooks(),
    loadAdminMembers()
  ]);
}

/**
 * Load & Render Books Table
 */
async function loadAdminBooks() {
  const tbody = document.getElementById("admin-books-body");
  tbody.innerHTML = `<tr><td colspan="8" style="text-align: center; padding: 2rem; color: var(--text-dim);">Loading catalog...</td></tr>`;

  try {
    const res = await API.get("/api/books?sortBy=title&sortOrder=asc");
    if (!res.success) throw new Error(res.error || "Failed to load books");

    allBooks = res.data;
    if (allBooks.length === 0) {
      tbody.innerHTML = `<tr><td colspan="8" style="text-align: center; padding: 2rem; color: var(--text-muted);">Catalog is empty. Use 'Restore Sample Dataset' or catalog a volume.</td></tr>`;
      return;
    }

    tbody.innerHTML = allBooks.map((b, idx) => `
      <tr class="stagger-${(idx % 6) + 1}">
        <td style="font-family: monospace; font-weight: 700; color: var(--primary);">
          ${b.id}
        </td>
        <td>
          <strong style="color: var(--text-main); font-size: 0.9rem;">${b.title}</strong>
          <div style="font-size: 0.75rem; color: var(--text-muted);">by ${b.author}</div>
        </td>
        <td>
          <span class="tag-pill">${b.category}</span>
        </td>
        <td>${b.publishedYear}</td>
        <td style="font-weight: 700;">${b.totalCopies}</td>
        <td>
          <span style="font-weight: 700; color: ${b.availableCopies > 0 ? 'var(--success-text)' : 'var(--danger-text)'};">
            ${b.availableCopies}
          </span>
        </td>
        <td style="color: #f59e0b; font-weight: 700;">★ ${b.rating}</td>
        <td style="text-align: right; white-space: nowrap;">
          <button class="btn btn-secondary btn-sm" onclick="openEditBookModal('${b.id}')">
            Edit
          </button>
          <button class="btn btn-danger btn-sm" onclick="deleteBookPrompt('${b.id}', '${b.title.replace(/'/g, "\\'")}')">
            Delete
          </button>
        </td>
      </tr>
    `).join("");
  } catch (err) {
    tbody.innerHTML = `<tr><td colspan="8" style="color: var(--danger); text-align: center; padding: 2rem;">Error: ${err.message}</td></tr>`;
  }
}

/**
 * Load & Render Members Table
 */
async function loadAdminMembers() {
  const tbody = document.getElementById("admin-members-body");
  tbody.innerHTML = `<tr><td colspan="7" style="text-align: center; padding: 2rem; color: var(--text-dim);">Loading members...</td></tr>`;

  try {
    const res = await API.get("/api/members");
    if (!res.success) throw new Error(res.error || "Failed to load members");

    allMembers = res.data;
    if (allMembers.length === 0) {
      tbody.innerHTML = `<tr><td colspan="7" style="text-align: center; padding: 2rem; color: var(--text-muted);">No registered members.</td></tr>`;
      return;
    }

    tbody.innerHTML = allMembers.map((m, idx) => {
      const tierClass = `badge-${(m.tier || m.membershipTier || "standard").toLowerCase()}`;
      return `
        <tr class="stagger-${(idx % 6) + 1}">
          <td>
            <div style="display: flex; align-items: center; gap: 0.5rem;">
              <span style="font-size: 1.25rem;">${m.avatar || "👤"}</span>
              <div>
                <strong style="color: var(--text-main); font-size: 0.9rem;">${m.name}</strong>
                <div style="font-size: 0.72rem; color: var(--text-dim);">${m.email} • <code>${m.id}</code></div>
              </div>
            </div>
          </td>
          <td>
            <span class="badge ${tierClass}">${m.tier || m.membershipTier || "Standard"}</span>
          </td>
          <td>${m.department || "General"}</td>
          <td>
            <span style="font-weight: 700; color: ${m.activeLoansCount > 0 ? 'var(--primary)' : 'var(--text-muted)'};">
              ${m.activeLoansCount || 0} active
            </span>
          </td>
          <td style="color: var(--text-muted); font-size: 0.8rem;">${m.joinDate || m.joinedDate || "N/A"}</td>
          <td>
            <span class="badge ${m.status === 'Active' ? 'badge-active' : 'badge-returned'}">
              ${m.status}
            </span>
          </td>
          <td style="text-align: right; white-space: nowrap;">
            <button class="btn btn-secondary btn-sm" onclick="openEditMemberModal('${m.id}')">
              Edit
            </button>
            <button class="btn btn-danger btn-sm" onclick="deleteMemberPrompt('${m.id}', '${m.name.replace(/'/g, "\\'")}')">
              Remove
            </button>
          </td>
        </tr>
      `;
    }).join("");
  } catch (err) {
    tbody.innerHTML = `<tr><td colspan="7" style="color: var(--danger); text-align: center; padding: 2rem;">Error: ${err.message}</td></tr>`;
  }
}

/**
 * System Data Reset: Restore
 */
async function handleRestoreDataset() {
  if (!confirm("Restore system to default curated dataset (20 books, 8 members, active & overdue circulation)? Current modifications will be reset.")) return;

  const btn = document.getElementById("btn-restore-dataset");
  btn.disabled = true;
  btn.innerHTML = "<span>⏳</span> Restoring...";

  try {
    const res = await API.post("/api/data/restore");
    if (res.success) {
      Toast.success("Sample curated dataset restored successfully!");
      await loadAllData();
    }
  } catch (err) {
    Toast.error(err.message);
  } finally {
    btn.disabled = false;
    btn.innerHTML = "<span>🔄</span> Restore Sample Dataset";
  }
}

/**
 * System Data Reset: Clear
 */
async function handleClearDataset() {
  if (!confirm("⚠️ CAUTION: Are you sure you want to clear all in-memory library data? Books, members, and circulation logs will be wiped.")) return;

  const btn = document.getElementById("btn-clear-dataset");
  btn.disabled = true;
  btn.innerHTML = "<span>⏳</span> Clearing...";

  try {
    const res = await API.post("/api/data/clear");
    if (res.success) {
      Toast.warning("Application state cleared. Store is currently empty.");
      await loadAllData();
    }
  } catch (err) {
    Toast.error(err.message);
  } finally {
    btn.disabled = false;
    btn.innerHTML = "<span>🗑️</span> Clear In-Memory Data";
  }
}

/**
 * Edit Book Modal Setup
 */
window.openEditBookModal = function(bookId) {
  const book = allBooks.find(b => b.id === bookId);
  if (!book) return;

  document.getElementById("edit-book-id").value = book.id;
  document.getElementById("edit-book-title").value = book.title;
  document.getElementById("edit-book-author").value = book.author;
  document.getElementById("edit-book-category").value = book.category;
  document.getElementById("edit-book-year").value = book.publishedYear || "";
  document.getElementById("edit-book-total").value = book.totalCopies;
  document.getElementById("edit-book-isbn").value = book.isbn || "";
  document.getElementById("edit-book-rating").value = book.rating || 4.5;
  document.getElementById("edit-book-tags").value = Array.isArray(book.tags) ? book.tags.join(", ") : "";
  document.getElementById("edit-book-desc").value = book.description || "";

  Modal.open("modal-edit-book");
};

async function handleEditBookSubmit(e) {
  e.preventDefault();
  const id = document.getElementById("edit-book-id").value;
  const title = document.getElementById("edit-book-title").value.trim();
  const author = document.getElementById("edit-book-author").value.trim();
  const category = document.getElementById("edit-book-category").value;
  const publishedYear = document.getElementById("edit-book-year").value;
  const totalCopies = document.getElementById("edit-book-total").value;
  const isbn = document.getElementById("edit-book-isbn").value.trim();
  const rating = document.getElementById("edit-book-rating").value;
  const tags = document.getElementById("edit-book-tags").value;
  const description = document.getElementById("edit-book-desc").value.trim();

  const submitBtn = document.getElementById("btn-submit-edit-book");
  submitBtn.disabled = true;
  submitBtn.innerHTML = "<span>⏳</span> Updating...";

  try {
    const res = await API.put(`/api/books/${id}`, {
      title,
      author,
      category,
      publishedYear,
      totalCopies,
      isbn,
      rating,
      tags,
      description
    });

    if (res.success) {
      Toast.success(`'${res.data.title}' updated successfully!`);
      Modal.close("modal-edit-book");
      await loadAdminBooks();
    }
  } catch (err) {
    Toast.error(err.message);
  } finally {
    submitBtn.disabled = false;
    submitBtn.innerHTML = "<span>💾</span> Save Changes";
  }
}

/**
 * Delete Book Prompt
 */
window.deleteBookPrompt = async function(bookId, bookTitle) {
  if (!confirm(`Are you sure you want to remove '${bookTitle}' from the library catalog?`)) return;

  try {
    const res = await API.delete(`/api/books/${bookId}`);
    if (res.success) {
      Toast.success(res.message || "Book deleted from catalog.");
      await loadAdminBooks();
    }
  } catch (err) {
    Toast.error(err.message);
  }
};

/**
 * Edit Member Modal Setup
 */
window.openEditMemberModal = function(memberId) {
  const member = allMembers.find(m => m.id === memberId);
  if (!member) return;

  document.getElementById("edit-member-id").value = member.id;
  document.getElementById("edit-member-name").value = member.name;
  document.getElementById("edit-member-email").value = member.email;
  document.getElementById("edit-member-tier").value = member.tier || member.membershipTier || "Standard";
  document.getElementById("edit-member-dept").value = member.department || "";
  document.getElementById("edit-member-status").value = member.status || "Active";
  const cats = member.favoriteCategories || member.favouriteCategories || [];
  document.getElementById("edit-member-cats").value = Array.isArray(cats) ? cats.join(", ") : "";

  Modal.open("modal-edit-member");
};

async function handleEditMemberSubmit(e) {
  e.preventDefault();
  const id = document.getElementById("edit-member-id").value;
  const name = document.getElementById("edit-member-name").value.trim();
  const email = document.getElementById("edit-member-email").value.trim();
  const tier = document.getElementById("edit-member-tier").value;
  const department = document.getElementById("edit-member-dept").value.trim();
  const status = document.getElementById("edit-member-status").value;
  const favoriteCategories = document.getElementById("edit-member-cats").value;

  const submitBtn = document.getElementById("btn-submit-edit-member");
  submitBtn.disabled = true;
  submitBtn.innerHTML = "<span>⏳</span> Updating...";

  try {
    const res = await API.put(`/api/members/${id}`, {
      name,
      email,
      tier,
      department,
      status,
      favoriteCategories
    });

    if (res.success) {
      Toast.success(`Member ${res.data.name} updated successfully!`);
      Modal.close("modal-edit-member");
      await loadAdminMembers();
    }
  } catch (err) {
    Toast.error(err.message);
  } finally {
    submitBtn.disabled = false;
    submitBtn.innerHTML = "<span>💾</span> Update Member";
  }
}

/**
 * Delete Member Prompt
 */
window.deleteMemberPrompt = async function(memberId, memberName) {
  if (!confirm(`Are you sure you want to remove member record for '${memberName}'?`)) return;

  try {
    const res = await API.delete(`/api/members/${memberId}`);
    if (res.success) {
      Toast.success(res.message || "Member record removed.");
      await loadAdminMembers();
    }
  } catch (err) {
    Toast.error(err.message);
  }
};

/**
 * Add Book Submit
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
  submitBtn.innerHTML = "<span>⏳</span> Saving...";

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
      await loadAdminBooks();
    }
  } catch (err) {
    Toast.error(err.message);
  } finally {
    submitBtn.disabled = false;
    submitBtn.innerHTML = "<span>💾</span> Save & Catalog";
  }
}

/**
 * Add Member Submit
 */
async function handleAddMemberSubmit(e) {
  e.preventDefault();
  const name = document.getElementById("add-member-name").value.trim();
  const email = document.getElementById("add-member-email").value.trim();
  const tier = document.getElementById("add-member-tier").value;
  const department = document.getElementById("add-member-dept").value.trim();
  const avatar = document.getElementById("add-member-avatar").value;
  const favoriteCategories = document.getElementById("add-member-cats").value;

  const submitBtn = document.getElementById("btn-submit-add-member");
  submitBtn.disabled = true;
  submitBtn.innerHTML = "<span>⏳</span> Enrolling...";

  try {
    const res = await API.post("/api/members", {
      name,
      email,
      tier,
      department,
      avatar,
      favoriteCategories
    });

    if (res.success) {
      Toast.success(`Member ${res.data.name} enrolled!`);
      document.getElementById("form-add-member").reset();
      Modal.close("modal-add-member");
      await loadAdminMembers();
    }
  } catch (err) {
    Toast.error(err.message);
  } finally {
    submitBtn.disabled = false;
    submitBtn.innerHTML = "<span>💾</span> Enroll Member";
  }
}
