/**
 * LibraSphere - Member Management & Reading Profile Controller
 * Handles member directory, full reading profiles, recommendations, and print dossiers
 */

document.addEventListener("DOMContentLoaded", () => {
  initMembers();
});

let currentProfileData = null;

function initMembers() {
  setupEventListeners();
  loadMembers();
}

function setupEventListeners() {
  const searchInput = document.getElementById("member-search-input");
  let debounceTimer;
  searchInput.addEventListener("input", () => {
    clearTimeout(debounceTimer);
    debounceTimer = setTimeout(() => loadMembers(), 250);
  });

  document.getElementById("member-tier-filter").addEventListener("change", () => loadMembers());
  document.getElementById("member-status-filter").addEventListener("change", () => loadMembers());

  document.getElementById("btn-refresh-members").addEventListener("click", () => {
    loadMembers();
    Toast.success("Member directory refreshed");
  });

  const openAddBtn = document.getElementById("btn-open-add-member");
  const openAddBtnHeader = document.getElementById("btn-open-add-member-header");
  if (openAddBtn) openAddBtn.addEventListener("click", () => Modal.open("modal-add-member"));
  if (openAddBtnHeader) openAddBtnHeader.addEventListener("click", () => Modal.open("modal-add-member"));

  document.getElementById("form-add-member").addEventListener("submit", handleAddMemberSubmit);

  // Print dossier button
  document.getElementById("btn-print-dossier").addEventListener("click", () => {
    if (currentProfileData) {
      PrintEngine.printMemberDossier(currentProfileData);
    }
  });
}

/**
 * Load & Render Members Directory
 */
async function loadMembers() {
  const tbody = document.getElementById("members-table-body");
  const countLabel = document.getElementById("member-count-label");
  tbody.innerHTML = `<tr><td colspan="7" style="text-align: center; padding: 2rem; color: var(--text-dim);">Loading members...</td></tr>`;

  const search = document.getElementById("member-search-input").value.trim();
  const tier = document.getElementById("member-tier-filter").value;
  const status = document.getElementById("member-status-filter").value;

  const params = new URLSearchParams();
  if (search) params.append("search", search);
  if (tier && tier !== "All") params.append("tier", tier);
  if (status && status !== "All") params.append("status", status);

  try {
    const res = await API.get(`/api/members?${params.toString()}`);
    if (!res.success) throw new Error(res.error || "Failed to load members");

    const members = res.data;
    countLabel.textContent = `Displaying ${members.length} registered member(s)`;

    if (members.length === 0) {
      tbody.innerHTML = `
        <tr>
          <td colspan="7" style="text-align: center; padding: 3rem; color: var(--text-muted);">
            No members matched the specified search criteria.
          </td>
        </tr>
      `;
      return;
    }

    tbody.innerHTML = members.map((m, idx) => {
      const tierClass = `badge-${(m.tier || m.membershipTier || "standard").toLowerCase()}`;
      return `
        <tr class="stagger-${(idx % 6) + 1}">
          <td>
            <div style="display: flex; align-items: center; gap: 0.65rem;">
              <span style="font-size: 1.5rem;">${m.avatar || "👤"}</span>
              <div>
                <strong style="color: var(--text-main); font-size: 0.9rem;">${m.name}</strong>
                <div style="font-size: 0.75rem; color: var(--text-dim);">${m.email} • <code>${m.id}</code></div>
              </div>
            </div>
          </td>
          <td>
            <span class="badge ${tierClass}">${m.tier || m.membershipTier || "Standard"}</span>
          </td>
          <td>${m.department || "General Reader"}</td>
          <td>
            <span style="font-weight: 700; color: ${m.activeLoansCount > 0 ? 'var(--primary)' : 'var(--text-muted)'};">
              ${m.activeLoansCount || 0} active
            </span>
          </td>
          <td style="color: var(--text-muted); font-size: 0.8rem;">
            ${m.joinDate || m.joinedDate || "N/A"}
          </td>
          <td>
            <span class="badge ${m.status === 'Active' ? 'badge-active' : 'badge-returned'}">
              ${m.status}
            </span>
          </td>
          <td style="text-align: right;">
            <button class="btn btn-secondary btn-sm" onclick="openMemberProfile('${m.id}')">
              <span>👤</span> View Profile
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
 * Open Full Reading Profile Modal
 */
window.openMemberProfile = async function(memberId) {
  try {
    const res = await API.get(`/api/members/${memberId}`);
    if (!res.success) throw new Error(res.error || "Failed to load member profile");

    currentProfileData = res.data;
    const { member, stats, activeLoans, loanHistory, recommendations } = currentProfileData;

    document.getElementById("profile-avatar").textContent = member.avatar || "👤";
    document.getElementById("profile-name").textContent = member.name;
    document.getElementById("profile-meta").textContent =
      `ID: ${member.id} • Tier: ${member.tier || member.membershipTier || "Standard"} • Joined: ${member.joinDate || member.joinedDate || "N/A"}`;

    const content = document.getElementById("profile-content");
    content.innerHTML = `
      <!-- Stats Row -->
      <div style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 1rem; margin-bottom: 1.5rem;">
        <div style="background: var(--bg-tertiary); padding: 0.85rem; border-radius: var(--radius-md); text-align: center;">
          <div style="font-size: 0.72rem; color: var(--text-muted); text-transform: uppercase; font-weight: 700;">Total Loans</div>
          <div style="font-size: 1.4rem; font-weight: 800; color: var(--text-main);">${stats.totalBorrowed}</div>
        </div>
        <div style="background: var(--bg-tertiary); padding: 0.85rem; border-radius: var(--radius-md); text-align: center;">
          <div style="font-size: 0.72rem; color: var(--text-muted); text-transform: uppercase; font-weight: 700;">Active Checkouts</div>
          <div style="font-size: 1.4rem; font-weight: 800; color: var(--primary);">${stats.activeCount}</div>
        </div>
        <div style="background: var(--bg-tertiary); padding: 0.85rem; border-radius: var(--radius-md); text-align: center;">
          <div style="font-size: 0.72rem; color: var(--text-muted); text-transform: uppercase; font-weight: 700;">Returned Books</div>
          <div style="font-size: 1.4rem; font-weight: 800; color: var(--success);">${stats.returnedCount}</div>
        </div>
        <div style="background: var(--bg-tertiary); padding: 0.85rem; border-radius: var(--radius-md); text-align: center;">
          <div style="font-size: 0.72rem; color: var(--text-muted); text-transform: uppercase; font-weight: 700;">Pending Fines</div>
          <div style="font-size: 1.4rem; font-weight: 800; color: ${stats.totalFinesPending > 0 ? 'var(--danger)' : 'var(--text-main)'};">$${stats.totalFinesPending.toFixed(2)}</div>
        </div>
      </div>

      <!-- Active Checkouts Section -->
      <div style="margin-bottom: 1.5rem;">
        <h4 style="font-size: 0.95rem; font-weight: 700; color: var(--text-main); margin-bottom: 0.75rem; display: flex; align-items: center; justify-content: space-between;">
          <span>📖 Active Checked-Out Books (${activeLoans.length})</span>
        </h4>
        ${activeLoans.length === 0 ? `
          <p style="color: var(--text-dim); font-size: 0.85rem; font-style: italic;">No books currently borrowed by this member.</p>
        ` : `
          <div class="table-responsive">
            <table class="data-table" style="font-size: 0.825rem;">
              <thead>
                <tr>
                  <th>Title</th>
                  <th>Category</th>
                  <th>Borrow Date</th>
                  <th>Due Date</th>
                  <th>Status</th>
                  <th>Fine</th>
                  <th style="text-align: right;">Action</th>
                </tr>
              </thead>
              <tbody>
                ${activeLoans.map(l => `
                  <tr>
                    <td><strong>${l.bookTitle}</strong></td>
                    <td>${l.bookCategory}</td>
                    <td>${l.borrowDate}</td>
                    <td>${l.dueDate}</td>
                    <td><span class="badge badge-${l.status.toLowerCase().replace(' ', '-')}">${l.status}</span></td>
                    <td style="color: ${l.fineAmount > 0 ? 'var(--danger)' : 'inherit'}; font-weight: 600;">
                      ${l.fineAmount > 0 ? `$${l.fineAmount.toFixed(2)}` : '-'}
                    </td>
                    <td style="text-align: right;">
                      <button class="btn btn-secondary btn-sm" onclick="returnFromProfile('${l.id || l.loanId}', '${member.id}', '${(l.bookTitle || '').replace(/'/g, "\\'")}')">
                        Return
                      </button>
                    </td>
                  </tr>
                `).join("")}
              </tbody>
            </table>
          </div>
        `}
      </div>

      <!-- Algorithmic Recommendation Spotlight for this Member -->
      <div style="margin-bottom: 1.5rem;">
        <h4 style="font-size: 0.95rem; font-weight: 700; color: var(--text-main); margin-bottom: 0.75rem;">
          <span>🎯 Tailored Algorithmic Recommendations for ${member.name}</span>
        </h4>
        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 0.75rem;">
          ${recommendations.map(rec => `
            <div style="background: var(--bg-tertiary); padding: 0.85rem; border-radius: var(--radius-md); border: 1px solid var(--border-color); display: flex; flex-direction: column; justify-content: space-between;">
              <div>
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.25rem;">
                  <span style="font-size: 0.7rem; font-weight: 700; color: var(--primary); text-transform: uppercase;">${rec.book.category}</span>
                  <span style="font-size: 0.7rem; font-weight: 800; background: var(--primary-light); color: var(--primary-text); padding: 0.15rem 0.4rem; border-radius: 4px;">Score: ${rec.recommendationScore}</span>
                </div>
                <div style="font-size: 0.85rem; font-weight: 700; color: var(--text-main); line-height: 1.25; margin-bottom: 0.25rem;">${rec.book.title}</div>
                <div style="font-size: 0.75rem; color: var(--text-muted); margin-bottom: 0.4rem;">by ${rec.book.author}</div>
                <div style="font-size: 0.72rem; color: var(--text-dim); border-left: 2px solid var(--primary); padding-left: 0.4rem; margin-bottom: 0.5rem;">
                  ${rec.reasons[0] || 'Matches member profile'}
                </div>
              </div>
              <div style="font-size: 0.75rem; color: ${rec.book.availableCopies > 0 ? 'var(--success-text)' : 'var(--danger-text)'}; font-weight: 600;">
                ${rec.book.availableCopies > 0 ? `🟢 ${rec.book.availableCopies} available` : '🔴 Checked out'}
              </div>
            </div>
          `).join("")}
        </div>
      </div>

      <!-- Historical Loans Section -->
      <div>
        <h4 style="font-size: 0.95rem; font-weight: 700; color: var(--text-main); margin-bottom: 0.75rem;">
          <span>📜 Completed Reading History (${loanHistory.length})</span>
        </h4>
        ${loanHistory.length === 0 ? `
          <p style="color: var(--text-dim); font-size: 0.85rem; font-style: italic;">No prior returned books recorded.</p>
        ` : `
          <div class="table-responsive">
            <table class="data-table" style="font-size: 0.825rem;">
              <thead>
                <tr>
                  <th>Title</th>
                  <th>Category</th>
                  <th>Borrowed</th>
                  <th>Returned On</th>
                  <th>Fine Paid</th>
                </tr>
              </thead>
              <tbody>
                ${loanHistory.map(l => `
                  <tr>
                    <td>${l.bookTitle}</td>
                    <td>${l.bookCategory}</td>
                    <td>${l.borrowDate}</td>
                    <td>${l.returnDate || "-"}</td>
                    <td>${l.fineAmount > 0 ? '$' + l.fineAmount.toFixed(2) : '-'}</td>
                  </tr>
                `).join("")}
              </tbody>
            </table>
          </div>
        `}
      </div>
    `;

    Modal.open("modal-member-profile");
  } catch (err) {
    Toast.error(err.message);
  }
};

/**
 * Return Book directly from Member Profile Modal
 */
window.returnFromProfile = async function(loanId, memberId, bookTitle) {
  if (!confirm(`Confirm returning volume '${bookTitle}'?`)) return;

  try {
    const res = await API.post(`/api/loans/${loanId}/return`);
    if (res.success) {
      Toast.success(res.message || "Book successfully returned!");
      await openMemberProfile(memberId);
      await loadMembers();
    }
  } catch (err) {
    Toast.error(err.message);
  }
};

/**
 * Register Member Form Handler
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
      Toast.success(`Member ${res.data.name} enrolled successfully!`);
      document.getElementById("form-add-member").reset();
      Modal.close("modal-add-member");
      await loadMembers();
    }
  } catch (err) {
    Toast.error(err.message);
  } finally {
    submitBtn.disabled = false;
    submitBtn.innerHTML = "<span>💾</span> Enroll Member";
  }
}
