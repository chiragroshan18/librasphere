/**
 * LibraSphere - Loan Operations & Circulation Routes
 */
const express = require("express");
const router = express.Router();
const store = require("../data/store");
const {
  successResponse,
  errorResponse,
  logActivity,
  calculateDueDate,
  enrichLoan,
  validateBorrow,
  DEFAULT_LOAN_DAYS
} = require("../utils/helpers");

// Maximum allowed concurrent active loans by membership tier
const TIER_LIMITS = {
  Standard: 3,
  Premium: 6,
  Scholar: 10
};

/**
 * GET /api/loans
 * Query options: status (all | active | due-soon | overdue | returned), memberId, bookId, search
 */
router.get("/", (req, res) => {
  try {
    const { status, memberId, bookId, search, sortBy } = req.query;

    let loans = store.loans.map(l => enrichLoan(l, store.books, store.members));

    if (memberId) {
      loans = loans.filter(l => l.memberId === memberId);
    }

    if (bookId) {
      loans = loans.filter(l => l.bookId === bookId);
    }

    if (status && status !== "all") {
      if (status === "active") {
        loans = loans.filter(l => l.status === "Active" || l.status === "Due Soon");
      } else if (status === "due-soon") {
        loans = loans.filter(l => l.status === "Due Soon");
      } else if (status === "overdue") {
        loans = loans.filter(l => l.status === "Overdue");
      } else if (status === "returned") {
        loans = loans.filter(l => l.status === "Returned");
      }
    }

    if (search) {
      const q = search.trim().toLowerCase();
      loans = loans.filter(l =>
        l.id.toLowerCase().includes(q) ||
        l.bookTitle.toLowerCase().includes(q) ||
        l.memberName.toLowerCase().includes(q)
      );
    }

    // Default sort: Overdue first, then Due Soon, then Active, then Returned
    const priority = { Overdue: 1, "Due Soon": 2, Active: 3, Returned: 4 };
    loans.sort((a, b) => {
      if (sortBy === "dueDate") {
        return new Date(a.dueDate) - new Date(b.dueDate);
      }
      if (sortBy === "fine") {
        return (b.fineAmount || 0) - (a.fineAmount || 0);
      }
      return (priority[a.status] || 5) - (priority[b.status] || 5);
    });

    return res.json(successResponse(loans, `Retrieved ${loans.length} loan record(s)`));
  } catch (err) {
    return res.status(500).json(errorResponse("Failed to fetch loans", 500, err.message));
  }
});

/**
 * GET /api/loans/:id
 */
router.get("/:id", (req, res) => {
  try {
    const rawLoan = store.loans.find(l => (l.id === req.params.id || l.loanId === req.params.id));
    if (!rawLoan) {
      return res.status(404).json(errorResponse(`Loan with ID '${req.params.id}' not found`, 404));
    }

    const loan = enrichLoan(rawLoan, store.books, store.members);
    return res.json(successResponse(loan, "Loan details retrieved"));
  } catch (err) {
    return res.status(500).json(errorResponse("Failed to fetch loan", 500, err.message));
  }
});

/**
 * POST /api/loans/borrow
 * Issue a book copy to a member
 */
router.post("/borrow", (req, res) => {
  try {
    const validationErrors = validateBorrow(req.body);
    if (validationErrors.length > 0) {
      return res.status(400).json(errorResponse("Validation failed", 400, validationErrors));
    }

    const { bookId, memberId, loanDays } = req.body;

    // Verify Book
    const book = store.books.find(b => b.id === bookId);
    if (!book) {
      return res.status(404).json(errorResponse(`Book with ID '${bookId}' not found`, 404));
    }

    if (book.availableCopies <= 0) {
      return res.status(400).json(errorResponse(
        `All copies of '${book.title}' are currently on loan. Please check back later or reserve.`,
        400
      ));
    }

    // Verify Member
    const member = store.members.find(m => m.id === memberId);
    if (!member) {
      return res.status(404).json(errorResponse(`Member with ID '${memberId}' not found`, 404));
    }

    if (member.status !== "Active") {
      return res.status(400).json(errorResponse(
        `Member '${member.name}' is currently flagged as '${member.status}'. Only Active members can borrow books.`,
        400
      ));
    }

    // Check if member already has an active loan of this book
    const existingActiveLoan = store.loans.find(
      l => l.bookId === bookId && l.memberId === memberId && l.status !== "Returned"
    );
    if (existingActiveLoan) {
      const existingId = existingActiveLoan.id || existingActiveLoan.loanId;
      return res.status(400).json(errorResponse(
        `Member '${member.name}' currently has this book on loan (Loan ID: ${existingId}). Return it before borrowing again.`,
        400
      ));
    }

    // Check tier limits
    const memberActiveLoansCount = store.loans.filter(
      l => l.memberId === memberId && l.status !== "Returned"
    ).length;
    const maxAllowed = TIER_LIMITS[member.tier] || 3;
    if (memberActiveLoansCount >= maxAllowed) {
      return res.status(400).json(errorResponse(
        `Member '${member.name}' has reached their quota of ${maxAllowed} active loans (${member.tier} Tier).`,
        400
      ));
    }

    // Decrement inventory
    book.availableCopies -= 1;

    // Create loan record
    const todayStr = new Date().toISOString().split("T")[0];
    const duration = parseInt(loanDays, 10) || DEFAULT_LOAN_DAYS;
    const dueDateStr = calculateDueDate(todayStr, duration);
    const newLoanId = `LN-${(store.loans.length + 101).toString()}`;

    const newLoan = {
      id: newLoanId,
      loanId: newLoanId,
      bookId,
      memberId,
      borrowDate: todayStr,
      borrowedAt: todayStr,
      dueDate: dueDateStr,
      returnDate: null,
      returnedAt: null,
      status: "Active",
      fineAmount: 0,
      fine: 0
    };

    store.loans.unshift(newLoan);

    logActivity(
      store,
      "BORROW",
      `${member.name} borrowed '${book.title}' (Due: ${dueDateStr}, Loan: ${newLoanId})`
    );

    const enriched = enrichLoan(newLoan, store.books, store.members);

    return res.status(201).json(successResponse(enriched, `Successfully checked out '${book.title}' for ${member.name}`, {
      remainingCopies: book.availableCopies
    }));
  } catch (err) {
    return res.status(500).json(errorResponse("Failed to issue loan", 500, err.message));
  }
});

/**
 * POST /api/loans/:id/return
 * Return a borrowed book, update inventory and calculate any fine
 */
router.post("/:id/return", (req, res) => {
  try {
    const loanIndex = store.loans.findIndex(l => (l.id === req.params.id || l.loanId === req.params.id));
    if (loanIndex === -1) {
      return res.status(404).json(errorResponse(`Loan with ID '${req.params.id}' not found`, 404));
    }

    const currentLoan = store.loans[loanIndex];
    if (currentLoan.status === "Returned") {
      const retDate = currentLoan.returnDate || currentLoan.returnedAt;
      return res.status(400).json(errorResponse(
        `Loan '${currentLoan.id || currentLoan.loanId}' was already returned on ${retDate}.`,
        400
      ));
    }

    // Enrich before return to get dynamic overdue fine
    const enriched = enrichLoan(currentLoan, store.books, store.members);
    const assessedFine = enriched.fineAmount;
    const todayStr = new Date().toISOString().split("T")[0];

    // Increment inventory
    const book = store.books.find(b => b.id === currentLoan.bookId);
    if (book) {
      book.availableCopies = Math.min(book.totalCopies, book.availableCopies + 1);
    }

    // Update loan
    currentLoan.status = "Returned";
    currentLoan.returnDate = todayStr;
    currentLoan.returnedAt = todayStr;
    currentLoan.fineAmount = assessedFine;
    currentLoan.fine = assessedFine;

    const fineMsg = assessedFine > 0 ? ` with overdue fine of $${assessedFine.toFixed(2)}` : "";
    logActivity(
      store,
      "RETURN",
      `${enriched.memberName} returned '${enriched.bookTitle}'${fineMsg} (Loan: ${currentLoan.id || currentLoan.loanId})`
    );

    const returnedEnriched = enrichLoan(currentLoan, store.books, store.members);

    return res.json(successResponse(
      returnedEnriched,
      `'${enriched.bookTitle}' successfully returned${fineMsg}`,
      {
        fineAssessed: assessedFine,
        newAvailableCopies: book ? book.availableCopies : null
      }
    ));
  } catch (err) {
    return res.status(500).json(errorResponse("Failed to process book return", 500, err.message));
  }
});

module.exports = router;
