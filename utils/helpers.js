/**
 * LibraSphere - Utility Engine & Business Logic Helpers
 * Cloud Computing - Project 7
 */

const DAILY_FINE_RATE = 1.50; // $1.50 per day overdue
const DEFAULT_LOAN_DAYS = 14;

/**
 * Standard API response envelope
 */
function successResponse(data, message = "Operation successful", extra = {}) {
  return {
    success: true,
    message,
    data,
    ...extra,
    timestamp: new Date().toISOString()
  };
}

function errorResponse(message = "An error occurred", status = 400, details = null) {
  return {
    success: false,
    error: message,
    status,
    details,
    timestamp: new Date().toISOString()
  };
}

/**
 * Log an audit/activity event to the store
 */
function logActivity(store, type, message) {
  if (!store || !store.activities) return;
  const newActivity = {
    id: `ACT-${Date.now().toString().slice(-6)}`,
    type,
    message,
    timestamp: new Date().toISOString()
  };
  store.activities.unshift(newActivity);
  // Keep history capped at 100 for memory efficiency
  if (store.activities.length > 100) {
    store.activities = store.activities.slice(0, 100);
  }
  return newActivity;
}

/**
 * Calculate due date given a borrow date string and duration
 */
function calculateDueDate(borrowDateStr, days = DEFAULT_LOAN_DAYS) {
  const d = borrowDateStr ? new Date(borrowDateStr) : new Date();
  d.setDate(d.getDate() + Number(days));
  return d.toISOString().split("T")[0];
}

/**
 * Dynamically evaluate loan status, days remaining/overdue, and fine
 */
function enrichLoan(loan, storeBooks = [], storeMembers = []) {
  const now = new Date();
  const dueDate = new Date(loan.dueDate + "T23:59:59Z");
  const borrowDate = new Date(loan.borrowDate + "T00:00:00Z");

  const book = storeBooks.find(b => b.id === loan.bookId) || {
    id: loan.bookId,
    title: loan.bookTitle || "Unknown Book",
    category: "General",
    coverGradient: "linear-gradient(135deg, #334155, #64748b)"
  };

  const member = storeMembers.find(m => m.id === loan.memberId) || {
    id: loan.memberId,
    name: loan.memberName || "Unknown Member",
    tier: "Standard"
  };
  const memberTier = member.tier || member.membershipTier || "Standard";

  const loanId = loan.id || loan.loanId;
  const borrowDateStr = loan.borrowDate || loan.borrowedAt || new Date().toISOString().split("T")[0];
  const returnDateStr = loan.returnDate !== undefined ? loan.returnDate : (loan.returnedAt || null);

  let status = loan.status;
  let overdueDays = 0;
  let fineAmount = Number(loan.fineAmount !== undefined ? loan.fineAmount : (loan.fine || 0));

  if (loan.status === "Returned") {
    status = "Returned";
  } else {
    const diffMs = now.getTime() - dueDate.getTime();
    if (diffMs > 0) {
      // Overdue
      status = "Overdue";
      overdueDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
      fineAmount = Number((overdueDays * DAILY_FINE_RATE).toFixed(2));
    } else {
      const daysLeft = Math.ceil(Math.abs(diffMs) / (1000 * 60 * 60 * 24));
      if (daysLeft <= 3) {
        status = "Due Soon";
      } else {
        status = "Active";
      }
    }
  }

  return {
    ...loan,
    id: loanId,
    loanId,
    borrowDate: borrowDateStr,
    borrowedAt: borrowDateStr,
    returnDate: returnDateStr,
    returnedAt: returnDateStr,
    bookTitle: book.title,
    bookAuthor: book.author,
    bookCategory: book.category,
    coverGradient: book.coverGradient,
    memberName: member.name,
    memberTier,
    memberEmail: member.email,
    status,
    overdueDays,
    fineAmount
  };
}

/**
 * Recommendation Engine (Transparent Rule-Based)
 * Computes match score based on Category, Author, Tags, Rating, and Stock.
 */
function calculateRecommendations(memberId, store, limit = 6) {
  const member = store.members.find(m => m.id === memberId);
  if (!member) return [];

  // Loans belonging to member
  const memberLoans = store.loans.filter(l => l.memberId === memberId);
  const currentlyBorrowedBookIds = new Set(
    memberLoans.filter(l => l.status !== "Returned").map(l => l.bookId)
  );
  const allBorrowedBookIds = new Set(memberLoans.map(l => l.bookId));

  // Determine preferences from profile and previous borrowings
  const prefCategories = new Set(member.favoriteCategories || member.favouriteCategories || []);
  const readAuthors = new Set();
  const readTags = new Set();

  memberLoans.forEach(l => {
    const b = store.books.find(bk => bk.id === l.bookId);
    if (b) {
      if (b.category) prefCategories.add(b.category);
      if (b.author) readAuthors.add(b.author);
      if (Array.isArray(b.tags)) b.tags.forEach(t => readTags.add(t));
    }
  });

  // Score candidate books that are not currently checked out by this member
  const candidates = store.books.filter(b => !currentlyBorrowedBookIds.has(b.id));

  const scored = candidates.map(book => {
    let score = 0;
    const reasons = [];

    // Category match (+5 pts)
    if (prefCategories.has(book.category)) {
      score += 5;
      reasons.push(`Aligned with interest in ${book.category}`);
    }

    // Author match (+4 pts)
    if (readAuthors.has(book.author)) {
      score += 4;
      reasons.push(`You have read works by ${book.author}`);
    }

    // Tag matches (+2 pts per tag, max 6 pts)
    let tagMatches = 0;
    if (Array.isArray(book.tags)) {
      book.tags.forEach(t => {
        if (readTags.has(t)) tagMatches++;
      });
    }
    if (tagMatches > 0) {
      const tagBonus = Math.min(tagMatches * 2, 6);
      score += tagBonus;
      reasons.push(`Shares ${tagMatches} topics from your reading history`);
    }

    // High rating bonus (+1.5 * rating)
    const ratingScore = (book.rating || 4.0) * 1.5;
    score += ratingScore;
    if (book.rating >= 4.7) {
      reasons.push(`Critically acclaimed (${book.rating}★ rating)`);
    }

    // Immediate availability bonus (+3 pts)
    if (book.availableCopies > 0) {
      score += 3;
      reasons.push("Available for immediate pickup");
    }

    // Novelty bonus for books not read yet
    if (!allBorrowedBookIds.has(book.id)) {
      score += 2;
    }

    return {
      book,
      recommendationScore: Math.round(score * 10) / 10,
      reasons: reasons.slice(0, 3)
    };
  });

  scored.sort((a, b) => b.recommendationScore - a.recommendationScore);
  return scored.slice(0, limit);
}

/**
 * Compute System Dashboard Statistics
 */
function calculateDashboard(store) {
  const books = store.books || [];
  const members = store.members || [];
  const loans = (store.loans || []).map(l => enrichLoan(l, books, members));

  const totalTitles = books.length;
  const totalCopies = books.reduce((sum, b) => sum + (Number(b.totalCopies) || 0), 0);
  const availableCopies = books.reduce((sum, b) => sum + (Number(b.availableCopies) || 0), 0);
  const borrowedCopies = Math.max(0, totalCopies - availableCopies);

  const activeLoans = loans.filter(l => l.status === "Active" || l.status === "Due Soon");
  const overdueLoans = loans.filter(l => l.status === "Overdue");
  const returnedLoans = loans.filter(l => l.status === "Returned");

  const totalFinesAccrued = overdueLoans.reduce((sum, l) => sum + (l.fineAmount || 0), 0);

  // Popular books calculated by borrow count
  const borrowCounts = {};
  loans.forEach(l => {
    borrowCounts[l.bookId] = (borrowCounts[l.bookId] || 0) + 1;
  });

  const popularBooks = [...books]
    .map(b => ({
      ...b,
      timesBorrowed: borrowCounts[b.id] || 0
    }))
    .sort((a, b) => b.timesBorrowed - a.timesBorrowed || b.rating - a.rating)
    .slice(0, 5);

  const recentlyAdded = [...books].slice(-4).reverse();
  const recentActivities = (store.activities || []).slice(0, 6);

  return {
    metrics: {
      totalTitles,
      totalCopies,
      availableCopies,
      borrowedCopies,
      activeLoansCount: activeLoans.length,
      overdueLoansCount: overdueLoans.length,
      returnedLoansCount: returnedLoans.length,
      activeMembersCount: members.filter(m => m.status === "Active").length,
      totalMembersCount: members.length,
      totalFinesAccrued: Number(totalFinesAccrued.toFixed(2)),
      categoriesCount: (store.categories || []).length
    },
    popularBooks,
    recentlyAdded,
    recentActivities,
    dueSoonLoans: loans.filter(l => l.status === "Due Soon")
  };
}

/**
 * Compute Member Full Reading Profile
 */
function calculateMemberProfile(memberId, store) {
  const member = store.members.find(m => m.id === memberId);
  if (!member) return null;

  const enrichedLoans = (store.loans || [])
    .filter(l => l.memberId === memberId)
    .map(l => enrichLoan(l, store.books, store.members));

  const activeLoans = enrichedLoans.filter(l => l.status !== "Returned");
  const returnedLoans = enrichedLoans.filter(l => l.status === "Returned");

  // Category distribution for this member
  const categoryReads = {};
  enrichedLoans.forEach(l => {
    categoryReads[l.bookCategory] = (categoryReads[l.bookCategory] || 0) + 1;
  });

  const totalFinesPending = activeLoans
    .filter(l => l.status === "Overdue")
    .reduce((sum, l) => sum + (l.fineAmount || 0), 0);

  const recommendations = calculateRecommendations(memberId, store, 4);

  return {
    member,
    stats: {
      totalBorrowed: enrichedLoans.length,
      activeCount: activeLoans.length,
      returnedCount: returnedLoans.length,
      overdueCount: activeLoans.filter(l => l.status === "Overdue").length,
      totalFinesPending: Number(totalFinesPending.toFixed(2)),
      categoryBreakdown: categoryReads
    },
    activeLoans,
    loanHistory: returnedLoans,
    recommendations
  };
}

/**
 * Compute Analytics Engine Metrics (Charts & Distributions)
 */
function calculateAnalytics(store) {
  const books = store.books || [];
  const members = store.members || [];
  const loans = (store.loans || []).map(l => enrichLoan(l, books, members));

  // Category distribution
  const categoryStats = {};
  (store.categories || []).forEach(c => {
    categoryStats[c.name] = {
      name: c.name,
      icon: c.icon,
      bookCount: 0,
      totalCopies: 0,
      borrowCount: 0
    };
  });

  books.forEach(b => {
    if (!categoryStats[b.category]) {
      categoryStats[b.category] = { name: b.category, icon: "📚", bookCount: 0, totalCopies: 0, borrowCount: 0 };
    }
    categoryStats[b.category].bookCount += 1;
    categoryStats[b.category].totalCopies += Number(b.totalCopies) || 0;
  });

  loans.forEach(l => {
    if (categoryStats[l.bookCategory]) {
      categoryStats[l.bookCategory].borrowCount += 1;
    }
  });

  const categoryDistribution = Object.values(categoryStats);

  // Status distribution
  const statusCounts = {
    Active: loans.filter(l => l.status === "Active").length,
    DueSoon: loans.filter(l => l.status === "Due Soon").length,
    Overdue: loans.filter(l => l.status === "Overdue").length,
    Returned: loans.filter(l => l.status === "Returned").length
  };

  // Top Borrowed Books
  const borrowCounts = {};
  loans.forEach(l => {
    borrowCounts[l.bookId] = (borrowCounts[l.bookId] || 0) + 1;
  });

  const topBooks = [...books]
    .map(b => ({
      id: b.id,
      title: b.title,
      author: b.author,
      category: b.category,
      rating: b.rating,
      coverGradient: b.coverGradient,
      borrowCount: borrowCounts[b.id] || 0
    }))
    .sort((a, b) => b.borrowCount - a.borrowCount)
    .slice(0, 5);

  // Top Active Readers
  const memberBorrowCounts = {};
  loans.forEach(l => {
    memberBorrowCounts[l.memberId] = (memberBorrowCounts[l.memberId] || 0) + 1;
  });

  const topMembers = members
    .map(m => ({
      id: m.id,
      name: m.name,
      tier: m.tier,
      department: m.department,
      avatar: m.avatar,
      borrowCount: memberBorrowCounts[m.id] || 0
    }))
    .sort((a, b) => b.borrowCount - a.borrowCount)
    .slice(0, 5);

  // Monthly trends (Synthesized from existing loans borrow dates)
  const monthMap = {
    "2026-06": 12,
    "2026-07": 18,
    "2026-08": 24,
    "2026-09": 31
  };
  loans.forEach(l => {
    const ym = l.borrowDate ? l.borrowDate.slice(0, 7) : "2026-09";
    monthMap[ym] = (monthMap[ym] || 0) + 1;
  });

  const monthlyTrends = Object.keys(monthMap).sort().map(m => ({
    month: m,
    borrows: monthMap[m]
  }));

  const totalFines = loans
    .filter(l => l.status === "Overdue")
    .reduce((sum, l) => sum + l.fineAmount, 0);

  return {
    categoryDistribution,
    statusCounts,
    topBooks,
    topMembers,
    monthlyTrends,
    totalFines: Number(totalFines.toFixed(2)),
    dailyFineRate: DAILY_FINE_RATE
  };
}

/**
 * Input Validations
 */
function validateBook(data, isUpdate = false) {
  const errors = [];
  if (!isUpdate || data.title !== undefined) {
    if (!data.title || typeof data.title !== "string" || !data.title.trim()) {
      errors.push("Title is required and must be a non-empty string.");
    }
  }
  if (!isUpdate || data.author !== undefined) {
    if (!data.author || typeof data.author !== "string" || !data.author.trim()) {
      errors.push("Author is required.");
    }
  }
  if (!isUpdate || data.category !== undefined) {
    if (!data.category || typeof data.category !== "string" || !data.category.trim()) {
      errors.push("Category is required.");
    }
  }
  if (data.publishedYear !== undefined) {
    const year = Number(data.publishedYear);
    if (isNaN(year) || year < 1800 || year > new Date().getFullYear() + 1) {
      errors.push("Published year must be between 1800 and next year.");
    }
  }
  if (data.totalCopies !== undefined) {
    const copies = Number(data.totalCopies);
    if (isNaN(copies) || copies < 1 || !Number.isInteger(copies)) {
      errors.push("Total copies must be a positive integer greater than or equal to 1.");
    }
  }
  return errors;
}

function validateMember(data, isUpdate = false) {
  const errors = [];
  if (!isUpdate || data.name !== undefined) {
    if (!data.name || typeof data.name !== "string" || !data.name.trim()) {
      errors.push("Name is required.");
    }
  }
  if (!isUpdate || data.email !== undefined) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!data.email || !emailRegex.test(data.email)) {
      errors.push("A valid email address is required.");
    }
  }
  if (data.tier !== undefined) {
    if (!["Scholar", "Premium", "Standard"].includes(data.tier)) {
      errors.push("Tier must be 'Scholar', 'Premium', or 'Standard'.");
    }
  }
  return errors;
}

function validateBorrow(data) {
  const errors = [];
  if (!data.bookId || typeof data.bookId !== "string") {
    errors.push("Book ID is required.");
  }
  if (!data.memberId || typeof data.memberId !== "string") {
    errors.push("Member ID is required.");
  }
  if (data.loanDays !== undefined) {
    const days = Number(data.loanDays);
    if (isNaN(days) || days < 1 || days > 60) {
      errors.push("Loan period must be between 1 and 60 days.");
    }
  }
  return errors;
}

module.exports = {
  DAILY_FINE_RATE,
  DEFAULT_LOAN_DAYS,
  successResponse,
  errorResponse,
  logActivity,
  calculateDueDate,
  enrichLoan,
  calculateRecommendations,
  calculateDashboard,
  calculateMemberProfile,
  calculateAnalytics,
  validateBook,
  validateMember,
  validateBorrow
};
