/**
 * LibraSphere - Analytics & Visual Intelligence Controller
 * Aggregates circulation metrics, renders pure vector SVG charts (Donut & Bar), and ranks leaderboards
 */

document.addEventListener("DOMContentLoaded", () => {
  initAnalytics();
});

function initAnalytics() {
  setupEventListeners();
  loadAnalyticsData();
}

function setupEventListeners() {
  document.getElementById("btn-refresh-analytics").addEventListener("click", async () => {
    await loadAnalyticsData();
    Toast.success("Analytics metrics recalculated from live store");
  });

  document.getElementById("btn-print-analytics").addEventListener("click", () => {
    window.print();
  });
}

/**
 * Fetch and render analytics data
 */
async function loadAnalyticsData() {
  try {
    const [analyticsRes, dashRes] = await Promise.all([
      API.get("/api/analytics"),
      API.get("/api/dashboard")
    ]);

    if (!analyticsRes.success) throw new Error(analyticsRes.error || "Failed to load analytics");

    const a = analyticsRes.data;
    const m = dashRes.data ? dashRes.data.metrics : null;

    renderKPIs(a, m);
    renderCategoryDonut(a.categoryDistribution);
    renderMonthlyBarChart(a.monthlyTrends);
    renderTopBooks(a.topBooks);
    renderTopMembers(a.topMembers);
  } catch (err) {
    Toast.error(err.message);
  }
}

/**
 * Render top analytical KPI tiles
 */
function renderKPIs(a, m) {
  if (m && m.totalCopies > 0) {
    const velocity = Math.round((m.borrowedCopies / m.totalCopies) * 100);
    document.getElementById("analytic-utilization").textContent = `${velocity}%`;
  }

  // Find top category by borrowCount or totalCopies
  let topCat = { name: "Computer Science", borrowCount: 0 };
  (a.categoryDistribution || []).forEach(c => {
    if (c.borrowCount > topCat.borrowCount) {
      topCat = c;
    }
  });
  document.getElementById("analytic-top-category").textContent = topCat.name;
  document.getElementById("analytic-top-category-count").textContent = `${topCat.borrowCount} checkouts recorded`;

  document.getElementById("analytic-active-fines").textContent = `$${(a.totalFines || 0).toFixed(2)}`;

  if (m && m.totalMembersCount > 0) {
    const retention = Math.round((m.activeMembersCount / m.totalMembersCount) * 100);
    document.getElementById("analytic-retention").textContent = `${retention}%`;
  }
}

/**
 * Render Vector SVG Donut Chart
 */
function renderCategoryDonut(categories) {
  if (!categories || categories.length === 0) return;

  const items = categories.map(c => ({
    label: c.name,
    value: c.totalCopies || c.bookCount || 1
  }));

  SVGCharts.renderDonutChart("chart-category-donut", items, {
    size: 240,
    strokeWidth: 34,
    centerLabel: "Physical Copies"
  });
}

/**
 * Render Vector SVG Bar Chart
 */
function renderMonthlyBarChart(trends) {
  if (!trends || trends.length === 0) return;

  const monthNames = {
    "2026-06": "Jun '26",
    "2026-07": "Jul '26",
    "2026-08": "Aug '26",
    "2026-09": "Sep '26",
    "2026-10": "Oct '26"
  };

  const items = trends.map(t => ({
    label: monthNames[t.month] || t.month,
    value: t.borrows
  }));

  SVGCharts.renderBarChart("chart-monthly-bars", items, {
    height: 240
  });
}

/**
 * Render Top Books Leaderboard
 */
function renderTopBooks(topBooks) {
  const tbody = document.getElementById("top-books-body");
  if (!topBooks || topBooks.length === 0) {
    tbody.innerHTML = `<tr><td colspan="5" style="text-align: center; padding: 2rem; color: var(--text-dim);">No borrow records recorded yet.</td></tr>`;
    return;
  }

  const medals = ["🥇", "🥈", "🥉", "4️⃣", "5️⃣"];

  tbody.innerHTML = topBooks.map((b, idx) => `
    <tr class="stagger-${idx + 1}">
      <td style="font-weight: 800; font-size: 1.1rem; width: 50px;">
        ${medals[idx] || (idx + 1)}
      </td>
      <td>
        <strong style="color: var(--text-main); font-size: 0.9rem;">${b.title}</strong>
        <div style="font-size: 0.75rem; color: var(--text-muted);">by ${b.author}</div>
      </td>
      <td>
        <span class="tag-pill">${b.category}</span>
      </td>
      <td style="font-weight: 700; color: #f59e0b;">
        ★ ${b.rating}
      </td>
      <td style="text-align: right; font-weight: 800; color: var(--primary); font-size: 1rem;">
        ${b.borrowCount} borrows
      </td>
    </tr>
  `).join("");
}

/**
 * Render Top Readers Leaderboard
 */
function renderTopMembers(topMembers) {
  const tbody = document.getElementById("top-members-body");
  if (!topMembers || topMembers.length === 0) {
    tbody.innerHTML = `<tr><td colspan="5" style="text-align: center; padding: 2rem; color: var(--text-dim);">No member checkouts recorded yet.</td></tr>`;
    return;
  }

  const medals = ["🥇", "🥈", "🥉", "4️⃣", "5️⃣"];

  tbody.innerHTML = topMembers.map((m, idx) => {
    const tierClass = `badge-${(m.tier || m.membershipTier || "standard").toLowerCase()}`;
    return `
      <tr class="stagger-${idx + 1}">
        <td style="font-weight: 800; font-size: 1.1rem; width: 50px;">
          ${medals[idx] || (idx + 1)}
        </td>
        <td>
          <div style="display: flex; align-items: center; gap: 0.5rem;">
            <span style="font-size: 1.25rem;">${m.avatar || "👤"}</span>
            <div>
              <strong style="color: var(--text-main); font-size: 0.9rem;">${m.name}</strong>
              <div style="font-size: 0.72rem; color: var(--text-dim);">${m.id}</div>
            </div>
          </div>
        </td>
        <td>
          <span class="badge ${tierClass}">${m.tier || m.membershipTier || "Standard"}</span>
        </td>
        <td style="color: var(--text-muted); font-size: 0.85rem;">
          ${m.department || "General"}
        </td>
        <td style="text-align: right; font-weight: 800; color: var(--success); font-size: 1rem;">
          ${m.borrowCount} volumes
        </td>
      </tr>
    `;
  }).join("");
}
