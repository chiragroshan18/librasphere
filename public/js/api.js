/**
 * LibraSphere - Core Client API, UI Modals, Toast Center & Vector SVG Charts
 * Cloud Computing - Project 7
 */

// ==========================================================================
// 1. Centralized REST Fetch Client
// ==========================================================================

const API = {
  async request(endpoint, options = {}) {
    const config = {
      method: options.method || "GET",
      headers: {
        "Content-Type": "application/json",
        ...(options.headers || {})
      }
    };

    if (options.body) {
      config.body = JSON.stringify(options.body);
    }

    try {
      const response = await fetch(endpoint, config);
      const resData = await response.json().catch(() => ({
        success: false,
        error: "Non-JSON response from server"
      }));

      if (!response.ok) {
        const errorMsg = resData.error || resData.message || `Request failed with status ${response.status}`;
        throw new Error(errorMsg);
      }

      return resData;
    } catch (err) {
      console.error(`API Error [${endpoint}]:`, err);
      throw err;
    }
  },

  get(endpoint) {
    return this.request(endpoint, { method: "GET" });
  },

  post(endpoint, body) {
    return this.request(endpoint, { method: "POST", body });
  },

  put(endpoint, body) {
    return this.request(endpoint, { method: "PUT", body });
  },

  delete(endpoint) {
    return this.request(endpoint, { method: "DELETE" });
  }
};

// ==========================================================================
// 2. Toast Notification Center
// ==========================================================================

const Toast = {
  getContainer() {
    let container = document.getElementById("toast-container");
    if (!container) {
      container = document.createElement("div");
      container.id = "toast-container";
      document.body.appendChild(container);
    }
    return container;
  },

  show(message, type = "info", duration = 4000) {
    const container = this.getContainer();
    const toast = document.createElement("div");
    toast.className = `toast toast-${type}`;

    const icons = {
      success: "✅",
      error: "❌",
      warning: "⚠️",
      info: "ℹ️"
    };

    toast.innerHTML = `
      <span class="toast-icon">${icons[type] || "ℹ️"}</span>
      <div class="toast-message">${message}</div>
      <button class="toast-close" aria-label="Close">&times;</button>
    `;

    const closeBtn = toast.querySelector(".toast-close");
    const removeToast = () => {
      toast.style.opacity = "0";
      toast.style.transform = "translateY(10px)";
      setTimeout(() => toast.remove(), 250);
    };

    closeBtn.addEventListener("click", removeToast);
    setTimeout(removeToast, duration);

    container.appendChild(toast);
  },

  success(msg) { this.show(msg, "success"); },
  error(msg) { this.show(msg, "error", 5000); },
  warning(msg) { this.show(msg, "warning"); },
  info(msg) { this.show(msg, "info"); }
};

// ==========================================================================
// 3. Modal Manager (With Strict Flexbox Scroll Support)
// ==========================================================================

const Modal = {
  open(modalId) {
    const modal = document.getElementById(modalId);
    if (!modal) return;
    modal.classList.add("show");
    document.body.style.overflow = "hidden";

    // Auto-focus first input if exists
    const firstInput = modal.querySelector("input, select, textarea");
    if (firstInput) {
      setTimeout(() => firstInput.focus(), 150);
    }
  },

  close(modalId) {
    const modal = typeof modalId === "string" ? document.getElementById(modalId) : modalId;
    if (!modal) return;
    modal.classList.remove("show");
    document.body.style.overflow = "";
  },

  initGlobalListeners() {
    document.addEventListener("click", (e) => {
      // Backdrop click closes modal
      if (e.target.classList.contains("modal-backdrop")) {
        Modal.close(e.target);
      }
      // Explicit data-close-modal button
      const closeBtn = e.target.closest("[data-close-modal]");
      if (closeBtn) {
        const modal = closeBtn.closest(".modal-backdrop");
        if (modal) Modal.close(modal);
      }
    });

    // Escape key closes open modal
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape") {
        const openModal = document.querySelector(".modal-backdrop.show");
        if (openModal) Modal.close(openModal);
      }
    });
  }
};

// ==========================================================================
// 4. Pure Vector SVG Charting Engine (Donut & Bar)
// ==========================================================================

const SVGCharts = {
  PALETTE: [
    "#c28822", "#1e3a8a", "#15803d", "#d97706",
    "#0891b2", "#7e22ce", "#b91c1c", "#0f766e"
  ],

  /**
   * Render vector SVG Donut Chart
   */
  renderDonutChart(containerId, items = [], options = {}) {
    const container = document.getElementById(containerId);
    if (!container) return;

    if (!items || items.length === 0) {
      container.innerHTML = `<p style="color: var(--text-dim); text-align: center; padding: 2rem;">No data available for chart</p>`;
      return;
    }

    const total = items.reduce((sum, item) => sum + (Number(item.value) || 0), 0);
    if (total === 0) {
      container.innerHTML = `<p style="color: var(--text-dim); text-align: center; padding: 2rem;">Total sum is zero</p>`;
      return;
    }

    const size = options.size || 220;
    const strokeWidth = options.strokeWidth || 32;
    const radius = (size - strokeWidth) / 2;
    const circumference = 2 * Math.PI * radius;
    const center = size / 2;

    let accumulatedOffset = 0;
    const segments = items.map((item, index) => {
      const value = Number(item.value) || 0;
      const percent = (value / total) * 100;
      const strokeLength = (value / total) * circumference;
      const strokeGap = circumference - strokeLength;
      const offset = circumference - accumulatedOffset;
      accumulatedOffset += strokeLength;
      const color = item.color || this.PALETTE[index % this.PALETTE.length];

      return `
        <circle
          cx="${center}"
          cy="${center}"
          r="${radius}"
          fill="none"
          stroke="${color}"
          stroke-width="${strokeWidth}"
          stroke-dasharray="${strokeLength.toFixed(2)} ${strokeGap.toFixed(2)}"
          stroke-dashoffset="${offset.toFixed(2)}"
          transform="rotate(-90 ${center} ${center})"
          class="chart-segment"
          data-label="${item.label}"
          data-value="${value}"
          data-percent="${percent.toFixed(1)}%"
          style="transition: stroke-width 0.2s ease; cursor: pointer;"
        >
          <title>${item.label}: ${value} (${percent.toFixed(1)}%)</title>
        </circle>
      `;
    }).join("");

    const centerLabel = options.centerLabel || "Total";

    const svg = `
      <div style="display: flex; flex-direction: column; align-items: center; width: 100%;">
        <div style="position: relative; width: ${size}px; height: ${size}px;">
          <svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
            ${segments}
          </svg>
          <div style="position: absolute; inset: 0; display: flex; flex-direction: column; align-items: center; justify-content: center; pointer-events: none;">
            <span style="font-size: 1.5rem; font-weight: 800; color: var(--text-main); line-height: 1;">${total}</span>
            <span style="font-size: 0.75rem; color: var(--text-muted); text-transform: uppercase; margin-top: 4px;">${centerLabel}</span>
          </div>
        </div>
        <div class="chart-legend">
          ${items.map((item, index) => {
            const color = item.color || this.PALETTE[index % this.PALETTE.length];
            const percent = ((Number(item.value) || 0) / total * 100).toFixed(1);
            return `
              <div class="legend-item" title="${item.label}">
                <span class="legend-color" style="background: ${color};"></span>
                <span>${item.label}</span>
                <strong style="color: var(--text-main); font-size: 0.75rem;">(${percent}%)</strong>
              </div>
            `;
          }).join("")}
        </div>
      </div>
    `;

    container.innerHTML = svg;
  },

  /**
   * Render vector SVG Bar Chart
   */
  renderBarChart(containerId, items = [], options = {}) {
    const container = document.getElementById(containerId);
    if (!container) return;

    if (!items || items.length === 0) {
      container.innerHTML = `<p style="color: var(--text-dim); text-align: center; padding: 2rem;">No trend data available</p>`;
      return;
    }

    const width = options.width || 540;
    const height = options.height || 220;
    const paddingLeft = 40;
    const paddingRight = 20;
    const paddingTop = 25;
    const paddingBottom = 35;

    const chartWidth = width - paddingLeft - paddingRight;
    const chartHeight = height - paddingTop - paddingBottom;

    const maxValue = Math.max(...items.map(i => Number(i.value) || 0), 10);
    const roundedMax = Math.ceil(maxValue / 5) * 5;

    const barWidth = Math.min(chartWidth / (items.length * 1.6), 46);
    const barSpacing = chartWidth / items.length;

    // Y-Axis grid lines
    const yLines = [0, 0.25, 0.5, 0.75, 1.0].map(ratio => {
      const val = Math.round(roundedMax * ratio);
      const y = paddingTop + chartHeight - (ratio * chartHeight);
      return `
        <line x1="${paddingLeft}" y1="${y}" x2="${width - paddingRight}" y2="${y}" stroke="var(--border-color)" stroke-dasharray="3,3" />
        <text x="${paddingLeft - 8}" y="${y + 3}" text-anchor="end" font-size="10" fill="var(--text-dim)">${val}</text>
      `;
    }).join("");

    // Bars & X-Axis labels
    const bars = items.map((item, index) => {
      const val = Number(item.value) || 0;
      const barHeight = (val / roundedMax) * chartHeight;
      const x = paddingLeft + (index * barSpacing) + (barSpacing - barWidth) / 2;
      const y = paddingTop + chartHeight - barHeight;

      return `
        <g class="bar-group">
          <rect
            class="bar-rect"
            x="${x}"
            y="${y}"
            width="${barWidth}"
            height="${barHeight}"
            rx="5"
            fill="url(#barGradient)"
          >
            <title>${item.label}: ${val} borrows</title>
          </rect>
          <text
            x="${x + barWidth / 2}"
            y="${y - 6}"
            text-anchor="middle"
            font-size="11"
            font-weight="700"
            fill="var(--text-main)"
          >${val}</text>
          <text
            x="${x + barWidth / 2}"
            y="${height - 12}"
            text-anchor="middle"
            font-size="11"
            fill="var(--text-muted)"
          >${item.label}</text>
        </g>
      `;
    }).join("");

    const svg = `
      <svg width="100%" height="${height}" viewBox="0 0 ${width} ${height}" style="overflow: visible;">
        <defs>
          <linearGradient id="barGradient" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stop-color="#c28822" />
            <stop offset="100%" stop-color="#d97706" />
          </linearGradient>
        </defs>
        ${yLines}
        ${bars}
      </svg>
    `;

    container.innerHTML = svg;
  }
};

// ==========================================================================
// 5. Isolated Print Engine (Member Dossier)
// ==========================================================================

const PrintEngine = {
  printMemberDossier(profileData) {
    if (!profileData || !profileData.member) {
      Toast.error("No member profile data to print");
      return;
    }

    const { member, stats, activeLoans, loanHistory } = profileData;
    const printWindow = window.open("", "_blank", "width=850,height=900");

    if (!printWindow) {
      Toast.error("Pop-up blocked. Please allow pop-ups to print member dossier.");
      return;
    }

    const html = `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <title>Reading Dossier — ${member.name} (${member.id})</title>
        <style>
          * { box-sizing: border-box; margin: 0; padding: 0; }
          body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Arial, sans-serif; color: #0f172a; padding: 2.5rem; background: #fff; line-height: 1.5; }
          .header { display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 2px solid #0f172a; padding-bottom: 1.25rem; margin-bottom: 2rem; }
          .brand { font-size: 1.5rem; font-weight: 800; color: #4f46e5; }
          .sub { color: #64748b; font-size: 0.85rem; }
          .profile-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 1.5rem; background: #f8fafc; padding: 1.25rem; border-radius: 8px; border: 1px solid #e2e8f0; margin-bottom: 2rem; }
          .profile-item label { display: block; font-size: 0.72rem; text-transform: uppercase; color: #64748b; font-weight: 700; margin-bottom: 0.2rem; }
          .profile-item span { font-size: 1rem; font-weight: 600; color: #0f172a; }
          h2 { font-size: 1.15rem; font-weight: 700; margin-bottom: 0.75rem; border-left: 4px solid #4f46e5; padding-left: 0.5rem; }
          table { width: 100%; border-collapse: collapse; margin-bottom: 2rem; font-size: 0.875rem; }
          th { background: #f1f5f9; text-align: left; padding: 0.65rem 0.75rem; font-size: 0.75rem; text-transform: uppercase; color: #475569; border-bottom: 1px solid #cbd5e1; }
          td { padding: 0.65rem 0.75rem; border-bottom: 1px solid #e2e8f0; }
          .badge { display: inline-block; padding: 0.2rem 0.5rem; border-radius: 4px; font-size: 0.72rem; font-weight: 700; }
          .badge-active { background: #ecfdf5; color: #047857; }
          .badge-due-soon { background: #fffbeb; color: #b45309; }
          .badge-overdue { background: #fef2f2; color: #b91c1c; }
          .badge-returned { background: #f1f5f9; color: #475569; }
          .footer-sign { display: flex; justify-content: space-between; margin-top: 3.5rem; padding-top: 1.5rem; border-top: 1px dashed #cbd5e1; }
          .sign-box { width: 220px; text-align: center; border-top: 1px solid #0f172a; padding-top: 0.5rem; font-size: 0.8rem; color: #64748b; }
          @media print {
            body { padding: 1.5rem; }
            .no-print { display: none; }
          }
        </style>
      </head>
      <body>
        <div class="header">
          <div>
            <div class="brand">📚 LibraSphere</div>
            <div class="sub">Official Library Member Dossier & Circulation Record</div>
          </div>
          <div style="text-align: right;">
            <div style="font-weight: 700; font-size: 0.9rem;">Document Ref: ${member.id}-${Date.now().toString().slice(-4)}</div>
            <div class="sub">Generated: ${new Date().toLocaleDateString()}</div>
          </div>
        </div>

        <div class="profile-grid">
          <div class="profile-item"><label>Member Name</label><span>${member.name}</span></div>
          <div class="profile-item"><label>Member ID</label><span>${member.id}</span></div>
          <div class="profile-item"><label>Membership Tier</label><span>${member.tier || member.membershipTier || "Standard"}</span></div>
          <div class="profile-item"><label>Email Address</label><span>${member.email}</span></div>
          <div class="profile-item"><label>Enrolled Since</label><span>${member.joinDate || member.joinedDate || "N/A"}</span></div>
          <div class="profile-item"><label>Pending Fines</label><span style="color: ${stats.totalFinesPending > 0 ? '#b91c1c' : '#047857'}; font-weight: 700;">$${stats.totalFinesPending.toFixed(2)}</span></div>
        </div>

        <h2>Active Checked-Out Volumes (${activeLoans.length})</h2>
        <table>
          <thead>
            <tr>
              <th>Loan ID</th>
              <th>Book Title</th>
              <th>Category</th>
              <th>Borrow Date</th>
              <th>Due Date</th>
              <th>Status</th>
              <th>Fine</th>
            </tr>
          </thead>
          <tbody>
            ${activeLoans.length === 0 ? `<tr><td colspan="7" style="text-align: center; color: #94a3b8; padding: 1.5rem;">No volumes currently checked out</td></tr>` : activeLoans.map(l => `
              <tr>
                <td style="font-family: monospace; font-weight: 600;">${l.id}</td>
                <td><strong>${l.bookTitle}</strong></td>
                <td>${l.bookCategory}</td>
                <td>${l.borrowDate}</td>
                <td>${l.dueDate}</td>
                <td><span class="badge badge-${l.status.toLowerCase().replace(' ', '-')}">${l.status}</span></td>
                <td>${l.fineAmount > 0 ? '$' + l.fineAmount.toFixed(2) : '-'}</td>
              </tr>
            `).join("")}
          </tbody>
        </table>

        <h2>Historical Reading Record (Latest 10)</h2>
        <table>
          <thead>
            <tr>
              <th>Loan ID</th>
              <th>Book Title</th>
              <th>Category</th>
              <th>Borrow Date</th>
              <th>Return Date</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            ${loanHistory.length === 0 ? `<tr><td colspan="6" style="text-align: center; color: #94a3b8; padding: 1.5rem;">No prior reading history</td></tr>` : loanHistory.slice(0, 10).map(l => `
              <tr>
                <td style="font-family: monospace;">${l.id}</td>
                <td>${l.bookTitle}</td>
                <td>${l.bookCategory}</td>
                <td>${l.borrowDate}</td>
                <td>${l.returnDate || "-"}</td>
                <td><span class="badge badge-returned">Returned</span></td>
              </tr>
            `).join("")}
          </tbody>
        </table>

        <div class="footer-sign">
          <div class="sign-box">Member Signature</div>
          <div class="sign-box">Authorized Librarian Stamp</div>
        </div>

        <script>
          window.onload = function() {
            window.print();
          };
        </script>
      </body>
      </html>
    `;

    printWindow.document.open();
    printWindow.document.write(html);
    printWindow.document.close();
  }
};

// ==========================================================================
// 6. Theme Engine
// ==========================================================================

const Theme = {
  init() {
    const savedTheme = localStorage.getItem("libra_theme") || (window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light");
    this.apply(savedTheme);

    const toggleBtn = document.querySelector(".theme-toggle-btn");
    if (toggleBtn) {
      toggleBtn.addEventListener("click", () => {
        const current = document.documentElement.getAttribute("data-theme") || "light";
        const next = current === "dark" ? "light" : "dark";
        this.apply(next);
      });
    }
  },

  apply(theme) {
    document.documentElement.setAttribute("data-theme", theme);
    localStorage.setItem("libra_theme", theme);

    const toggleBtn = document.querySelector(".theme-toggle-btn");
    if (toggleBtn) {
      toggleBtn.innerHTML = theme === "dark" ? "☀️" : "🌙";
      toggleBtn.setAttribute("title", `Switch to ${theme === "dark" ? "Light" : "Dark"} mode`);
    }
  }
};

// ==========================================================================
// 7. Interactive Mouse Experience Engine
// Follows cursor with magic ring, trailing sparkles, and 3D card open/close physics
// ==========================================================================

const MouseExperience = {
  glowEl: null,
  cursorRing: null,
  cursorDot: null,
  mouseX: -500,
  mouseY: -500,
  ringX: -500,
  ringY: -500,
  lastSparkleTime: 0,

  init() {
    this.createAmbientGlow();
    this.createMagicCursor();
    this.bindMouseMove();
    this.bindBookCardOpenClose();
    this.bindButtonRipple();
    this.animate();
  },

  createAmbientGlow() {
    this.glowEl = document.createElement("div");
    this.glowEl.id = "ambient-glow";
    document.body.appendChild(this.glowEl);
  },

  createMagicCursor() {
    this.cursorRing = document.createElement("div");
    this.cursorRing.id = "magic-cursor-ring";
    document.body.appendChild(this.cursorRing);

    this.cursorDot = document.createElement("div");
    this.cursorDot.id = "magic-cursor-dot";
    document.body.appendChild(this.cursorDot);

    // Expand ring on interactive element hovers
    const interactiveSelectors = "a, button, .btn, .book-card, .stat-card, .rec-card, .chart-card, .filter-tab, input, select, textarea, .data-table tr, .badge, .theme-toggle-btn";
    
    document.addEventListener("mouseover", (e) => {
      const target = e.target.closest(interactiveSelectors);
      if (target) {
        this.cursorRing.classList.add("cursor-active");
      }

      // Sparkle burst when entering cards
      const card = e.target.closest(".book-card, .stat-card, .rec-card");
      if (card && (!e.relatedTarget || !card.contains(e.relatedTarget))) {
        this.burstSparkles(e.clientX, e.clientY, 6);
      }
    });

    document.addEventListener("mouseout", (e) => {
      if (e.target.closest(interactiveSelectors)) {
        this.cursorRing.classList.remove("cursor-active");
      }
    });
  },

  bindMouseMove() {
    window.addEventListener("mousemove", (e) => {
      this.mouseX = e.clientX;
      this.mouseY = e.clientY;

      if (this.cursorDot) {
        this.cursorDot.style.left = `${e.clientX}px`;
        this.cursorDot.style.top = `${e.clientY}px`;
      }

      // Spawn trailing gold stardust when mouse moves
      const now = Date.now();
      if (now - this.lastSparkleTime > 38) {
        this.spawnSparkle(e.clientX, e.clientY);
        this.lastSparkleTime = now;
      }
    });

    document.addEventListener("mouseleave", () => {
      if (this.glowEl) this.glowEl.style.opacity = "0";
      if (this.cursorRing) this.cursorRing.style.opacity = "0";
      if (this.cursorDot) this.cursorDot.style.opacity = "0";
    });

    document.addEventListener("mouseenter", () => {
      if (this.glowEl) this.glowEl.style.opacity = "1";
      if (this.cursorRing) this.cursorRing.style.opacity = "1";
      if (this.cursorDot) this.cursorDot.style.opacity = "1";
    });
  },

  spawnSparkle(x, y) {
    const symbols = ["✦", "★", "✧", "⋆", "•"];
    const symbol = symbols[Math.floor(Math.random() * symbols.length)];
    const sparkle = document.createElement("div");
    sparkle.className = "cursor-sparkle";
    sparkle.textContent = symbol;
    
    const offsetX = (Math.random() - 0.5) * 20;
    const offsetY = (Math.random() - 0.5) * 20;
    const driftX = (Math.random() - 0.5) * 36;
    
    sparkle.style.setProperty("--dx", `${driftX}px`);
    sparkle.style.fontSize = `${Math.floor(Math.random() * 8) + 11}px`;
    sparkle.style.left = `${x + offsetX}px`;
    sparkle.style.top = `${y + offsetY}px`;
    
    document.body.appendChild(sparkle);
    setTimeout(() => sparkle.remove(), 650);
  },

  burstSparkles(x, y, count = 6) {
    for (let i = 0; i < count; i++) {
      setTimeout(() => {
        this.spawnSparkle(x + (Math.random() - 0.5) * 40, y + (Math.random() - 0.5) * 40);
      }, i * 35);
    }
  },

  animate() {
    const lerp = (start, end, factor) => start + (end - start) * factor;

    const step = () => {
      this.ringX = lerp(this.ringX, this.mouseX, 0.16);
      this.ringY = lerp(this.ringY, this.mouseY, 0.16);

      if (this.cursorRing) {
        this.cursorRing.style.left = `${this.ringX}px`;
        this.cursorRing.style.top = `${this.ringY}px`;
      }

      if (this.glowEl) {
        this.glowEl.style.left = `${this.ringX}px`;
        this.glowEl.style.top = `${this.ringY}px`;
      }

      requestAnimationFrame(step);
    };

    requestAnimationFrame(step);
  },

  bindBookCardOpenClose() {
    // Dynamic 3D Book Open and Close when mouse enters and hovers across book cards
    document.addEventListener("mousemove", (e) => {
      const bookCard = e.target.closest(".book-card");
      if (bookCard) {
        const rect = bookCard.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        const centerY = rect.height / 2;

        // Dynamic open angle: -45deg to -75deg depending on cursor position
        // Moving mouse leftwards swings the cover open even wider!
        const normX = Math.max(0, Math.min(1, x / rect.width));
        const openAngle = -42 - ((1 - normX) * 32); // -42deg at right edge, -74deg at left edge
        const tiltX = ((y - centerY) / centerY) * -5;

        const cover = bookCard.querySelector(".book-cover");
        if (cover) {
          cover.style.transform = `perspective(1200px) rotateY(${openAngle.toFixed(1)}deg) rotateX(${tiltX.toFixed(1)}deg) translateY(-4px) translateZ(14px)`;
        }
        return;
      }

      // Smooth 3D tilt on Stat, Recommendation, and Chart Cards
      const otherCard = e.target.closest(".stat-card, .rec-card, .chart-card");
      if (otherCard) {
        const rect = otherCard.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        const centerX = rect.width / 2;
        const centerY = rect.height / 2;

        const rotateX = ((y - centerY) / centerY) * -6;
        const rotateY = ((x - centerX) / centerX) * 6;

        otherCard.style.transform = `perspective(1000px) rotateX(${rotateX.toFixed(2)}deg) rotateY(${rotateY.toFixed(2)}deg) translateY(-8px) scale(1.025)`;
      }
    });

    document.addEventListener("mouseout", (e) => {
      const bookCard = e.target.closest(".book-card");
      if (bookCard && (!e.relatedTarget || !bookCard.contains(e.relatedTarget))) {
        const cover = bookCard.querySelector(".book-cover");
        if (cover) {
          cover.style.transform = ""; // Closes the book cover with smooth CSS physics!
        }
      }

      const otherCard = e.target.closest(".stat-card, .rec-card, .chart-card");
      if (otherCard && (!e.relatedTarget || !otherCard.contains(e.relatedTarget))) {
        otherCard.style.transform = ""; // Closes card tilt smoothly!
      }
    });
  },

  bindButtonRipple() {
    document.addEventListener("click", (e) => {
      const btn = e.target.closest(".btn, button");
      const clickX = e.clientX;
      const clickY = e.clientY;

      // Burst of sparkles on click
      this.burstSparkles(clickX, clickY, 4);

      if (!btn) return;

      const rect = btn.getBoundingClientRect();
      const ripple = document.createElement("span");
      ripple.style.position = "absolute";
      ripple.style.borderRadius = "50%";
      ripple.style.background = "rgba(255, 255, 255, 0.4)";
      ripple.style.transform = "scale(0)";
      ripple.style.animation = "rippleAnim 0.6s ease-out";
      ripple.style.pointerEvents = "none";

      const size = Math.max(rect.width, rect.height) * 2.2;
      ripple.style.width = `${size}px`;
      ripple.style.height = `${size}px`;
      ripple.style.left = `${clickX - rect.left - size / 2}px`;
      ripple.style.top = `${clickY - rect.top - size / 2}px`;

      btn.appendChild(ripple);
      setTimeout(() => ripple.remove(), 600);
    });
  }
};

// ==========================================================================
// 8. Global Setup
// ==========================================================================

document.addEventListener("DOMContentLoaded", () => {
  Theme.init();
  Modal.initGlobalListeners();
  MouseExperience.init();
});
