/**
 * LibraSphere - Book Management Routes
 */
const express = require("express");
const router = express.Router();
const store = require("../data/store");
const {
  successResponse,
  errorResponse,
  logActivity,
  validateBook
} = require("../utils/helpers");

// Preset curated gradients for newly added books
const COVER_GRADIENTS = [
  "linear-gradient(135deg, #1e3a8a, #0284c7)",
  "linear-gradient(135deg, #065f46, #10b981)",
  "linear-gradient(135deg, #4338ca, #6366f1)",
  "linear-gradient(135deg, #701a75, #ec4899)",
  "linear-gradient(135deg, #854d0e, #eab308)",
  "linear-gradient(135deg, #1e293b, #3b82f6)",
  "linear-gradient(135deg, #374151, #9ca3af)",
  "linear-gradient(135deg, #0f766e, #14b8a6)",
  "linear-gradient(135deg, #991b1b, #ef4444)"
];

/**
 * GET /api/books
 * Supports search, category filter, availability filter, tag filter, and sorting
 */
router.get("/", (req, res) => {
  try {
    let result = [...store.books];
    const { search, category, availableOnly, tag, sortBy, sortOrder } = req.query;

    if (search) {
      const q = search.trim().toLowerCase();
      result = result.filter(b =>
        b.title.toLowerCase().includes(q) ||
        b.author.toLowerCase().includes(q) ||
        b.category.toLowerCase().includes(q) ||
        (b.isbn && b.isbn.toLowerCase().includes(q)) ||
        (Array.isArray(b.tags) && b.tags.some(t => t.toLowerCase().includes(q)))
      );
    }

    if (category && category !== "All") {
      result = result.filter(b => b.category.toLowerCase() === category.toLowerCase());
    }

    if (availableOnly === "true") {
      result = result.filter(b => b.availableCopies > 0);
    }

    if (tag) {
      result = result.filter(b => Array.isArray(b.tags) && b.tags.includes(tag));
    }

    if (sortBy) {
      const order = sortOrder === "desc" ? -1 : 1;
      result.sort((a, b) => {
        if (sortBy === "title" || sortBy === "author") {
          return a[sortBy].localeCompare(b[sortBy]) * order;
        }
        if (sortBy === "rating" || sortBy === "publishedYear" || sortBy === "availableCopies") {
          return ((a[sortBy] || 0) - (b[sortBy] || 0)) * order;
        }
        return 0;
      });
    }

    return res.json(successResponse(result, `Retrieved ${result.length} book(s)`, { totalCount: result.length }));
  } catch (err) {
    return res.status(500).json(errorResponse("Failed to fetch books", 500, err.message));
  }
});

/**
 * GET /api/books/categories
 * Returns all active categories with counts
 */
router.get("/categories", (req, res) => {
  try {
    const categoryCounts = {};
    store.books.forEach(b => {
      categoryCounts[b.category] = (categoryCounts[b.category] || 0) + 1;
    });

    const categoriesWithCount = store.categories.map(c => ({
      ...c,
      bookCount: categoryCounts[c.name] || 0
    }));

    return res.json(successResponse(categoriesWithCount, "Categories retrieved successfully"));
  } catch (err) {
    return res.status(500).json(errorResponse("Failed to fetch categories", 500, err.message));
  }
});

/**
 * GET /api/books/:id
 */
router.get("/:id", (req, res) => {
  try {
    const book = store.books.find(b => b.id === req.params.id);
    if (!book) {
      return res.status(404).json(errorResponse(`Book with ID '${req.params.id}' not found`, 404));
    }

    const activeLoans = store.loans.filter(l => l.bookId === book.id && l.status !== "Returned");
    const isAvailable = book.availableCopies > 0;

    return res.json(successResponse({
      ...book,
      activeLoansCount: activeLoans.length,
      isAvailable
    }, "Book details retrieved"));
  } catch (err) {
    return res.status(500).json(errorResponse("Failed to fetch book", 500, err.message));
  }
});

/**
 * POST /api/books
 * Add a new book to the library catalog
 */
router.post("/", (req, res) => {
  try {
    const validationErrors = validateBook(req.body);
    if (validationErrors.length > 0) {
      return res.status(400).json(errorResponse("Validation failed", 400, validationErrors));
    }

    const totalCopies = parseInt(req.body.totalCopies, 10) || 1;
    const availableCopies = req.body.availableCopies !== undefined
      ? Math.min(parseInt(req.body.availableCopies, 10), totalCopies)
      : totalCopies;

    const newId = `BK-${(store.books.length + 101).toString()}`;
    const randomGradient = COVER_GRADIENTS[Math.floor(Math.random() * COVER_GRADIENTS.length)];

    let tags = [];
    if (Array.isArray(req.body.tags)) {
      tags = req.body.tags;
    } else if (typeof req.body.tags === "string" && req.body.tags.trim()) {
      tags = req.body.tags.split(",").map(t => t.trim()).filter(Boolean);
    }

    const newBook = {
      id: newId,
      title: req.body.title.trim(),
      author: req.body.author.trim(),
      category: req.body.category.trim(),
      description: req.body.description ? req.body.description.trim() : "No synopsis provided.",
      isbn: req.body.isbn ? req.body.isbn.trim() : `978-${Math.floor(1000000000 + Math.random() * 9000000000)}`,
      publishedYear: parseInt(req.body.publishedYear, 10) || new Date().getFullYear(),
      totalCopies,
      availableCopies,
      rating: parseFloat(req.body.rating) || 4.5,
      tags,
      coverGradient: req.body.coverGradient || randomGradient
    };

    store.books.unshift(newBook);
    logActivity(store, "BOOK_ADDED", `New title catalogued: '${newBook.title}' by ${newBook.author} (${newBook.totalCopies} copies)`);

    return res.status(201).json(successResponse(newBook, "Book catalogued successfully"));
  } catch (err) {
    return res.status(500).json(errorResponse("Failed to create book", 500, err.message));
  }
});

/**
 * PUT /api/books/:id
 * Update book metadata or copy stock
 */
router.put("/:id", (req, res) => {
  try {
    const bookIndex = store.books.findIndex(b => b.id === req.params.id);
    if (bookIndex === -1) {
      return res.status(404).json(errorResponse(`Book with ID '${req.params.id}' not found`, 404));
    }

    const validationErrors = validateBook(req.body, true);
    if (validationErrors.length > 0) {
      return res.status(400).json(errorResponse("Validation failed", 400, validationErrors));
    }

    const currentBook = store.books[bookIndex];
    let newTotal = currentBook.totalCopies;
    let newAvailable = currentBook.availableCopies;

    if (req.body.totalCopies !== undefined) {
      const targetTotal = parseInt(req.body.totalCopies, 10);
      const currentlyBorrowed = currentBook.totalCopies - currentBook.availableCopies;
      if (targetTotal < currentlyBorrowed) {
        return res.status(400).json(errorResponse(
          `Cannot reduce total copies to ${targetTotal}. ${currentlyBorrowed} copy/copies are currently borrowed.`,
          400
        ));
      }
      newTotal = targetTotal;
      newAvailable = newTotal - currentlyBorrowed;
    }

    let tags = currentBook.tags;
    if (Array.isArray(req.body.tags)) {
      tags = req.body.tags;
    } else if (typeof req.body.tags === "string") {
      tags = req.body.tags.split(",").map(t => t.trim()).filter(Boolean);
    }

    const updatedBook = {
      ...currentBook,
      title: req.body.title !== undefined ? req.body.title.trim() : currentBook.title,
      author: req.body.author !== undefined ? req.body.author.trim() : currentBook.author,
      category: req.body.category !== undefined ? req.body.category.trim() : currentBook.category,
      description: req.body.description !== undefined ? req.body.description.trim() : currentBook.description,
      isbn: req.body.isbn !== undefined ? req.body.isbn.trim() : currentBook.isbn,
      publishedYear: req.body.publishedYear !== undefined ? parseInt(req.body.publishedYear, 10) : currentBook.publishedYear,
      rating: req.body.rating !== undefined ? parseFloat(req.body.rating) : currentBook.rating,
      totalCopies: newTotal,
      availableCopies: newAvailable,
      tags
    };

    store.books[bookIndex] = updatedBook;
    logActivity(store, "BOOK_UPDATED", `Metadata updated for '${updatedBook.title}' (ID: ${updatedBook.id})`);

    return res.json(successResponse(updatedBook, "Book updated successfully"));
  } catch (err) {
    return res.status(500).json(errorResponse("Failed to update book", 500, err.message));
  }
});

/**
 * DELETE /api/books/:id
 * Remove book if no active loans exist
 */
router.delete("/:id", (req, res) => {
  try {
    const bookIndex = store.books.findIndex(b => b.id === req.params.id);
    if (bookIndex === -1) {
      return res.status(404).json(errorResponse(`Book with ID '${req.params.id}' not found`, 404));
    }

    const activeLoans = store.loans.filter(l => l.bookId === req.params.id && l.status !== "Returned");
    if (activeLoans.length > 0) {
      return res.status(400).json(errorResponse(
        `Cannot remove '${store.books[bookIndex].title}' because ${activeLoans.length} active loan(s) exist.`,
        400
      ));
    }

    const removed = store.books.splice(bookIndex, 1)[0];
    logActivity(store, "BOOK_REMOVED", `Removed title '${removed.title}' from catalog`);

    return res.json(successResponse(removed, `Book '${removed.title}' successfully removed`));
  } catch (err) {
    return res.status(500).json(errorResponse("Failed to delete book", 500, err.message));
  }
});

module.exports = router;
