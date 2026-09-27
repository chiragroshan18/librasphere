const INITIAL_CATEGORIES = [
  { id: "CAT-1", name: "Computer Science", icon: "💻", description: "Algorithms, distributed architectures, software engineering & operating systems" },
  { id: "CAT-2", name: "Cloud Computing", icon: "☁️", description: "Microservices, serverless patterns, cloud infrastructure & DevOps" },
  { id: "CAT-3", name: "Artificial Intelligence", icon: "🧠", description: "Machine learning, neural networks, deep learning & LLMs" },
  { id: "CAT-4", name: "Science & Physics", icon: "🔬", description: "Quantum mechanics, cosmology, astrophysics & evolutionary biology" },
  { id: "CAT-5", name: "Philosophy & Psychology", icon: "🏛️", description: "Behavioral psychology, stoicism, decision-making & epistemology" },
  { id: "CAT-6", name: "History & Civilization", icon: "📜", description: "World history, ancient empires, political philosophy & anthropological studies" },
  { id: "CAT-7", name: "Science Fiction", icon: "🚀", description: "Hard sci-fi, space opera, cyberpunk & speculative futures" },
  { id: "CAT-8", name: "Business & Leadership", icon: "📈", description: "High-growth startups, product strategy, organizational leadership & finance" }
];

const INITIAL_BOOKS = [
  {
    id: "BK-101",
    title: "Designing Data-Intensive Applications",
    author: "Martin Kleppmann",
    category: "Cloud Computing",
    description: "The definitive guide to distributed data systems, exploring consistency models, consensus algorithms, partition tolerance, and event-driven architectures at massive scale.",
    isbn: "978-1449373320",
    publishedYear: 2017,
    totalCopies: 6,
    availableCopies: 3,
    rating: 4.9,
    tags: ["Distributed Systems", "Database Internals", "Reliability", "Consensus", "Scalability"],
    coverGradient: "linear-gradient(135deg, #1e3a8a, #0284c7)"
  },
  {
    id: "BK-102",
    title: "Clean Architecture: A Craftsman's Guide",
    author: "Robert C. Martin",
    category: "Computer Science",
    description: "Universal rules of software structure and dependency decoupling. Covers the SOLID principles, component boundaries, and testing architectures.",
    isbn: "978-0134494166",
    publishedYear: 2018,
    totalCopies: 5,
    availableCopies: 2,
    rating: 4.7,
    tags: ["Architecture", "SOLID", "Clean Code", "Design Patterns", "Software Engineering"],
    coverGradient: "linear-gradient(135deg, #065f46, #10b981)"
  },
  {
    id: "BK-103",
    title: "Cloud Native Patterns: Designing Change-tolerant Software",
    author: "Cornelia Davis",
    category: "Cloud Computing",
    description: "Practical recipes for resilient cloud-native microservices, continuous deployability, circuit breakers, dynamic request routing, and autoscaling.",
    isbn: "978-1617294297",
    publishedYear: 2019,
    totalCopies: 4,
    availableCopies: 2,
    rating: 4.6,
    tags: ["Cloud Native", "Microservices", "DevOps", "Containers", "Resilience"],
    coverGradient: "linear-gradient(135deg, #4338ca, #6366f1)"
  },
  {
    id: "BK-104",
    title: "Deep Learning",
    author: "Ian Goodfellow & Yoshua Bengio",
    category: "Artificial Intelligence",
    description: "The gold-standard academic textbook covering mathematical foundations of neural networks, backpropagation, convolutional networks, and generative modeling.",
    isbn: "978-0262035613",
    publishedYear: 2016,
    totalCopies: 5,
    availableCopies: 1,
    rating: 4.8,
    tags: ["Deep Learning", "Neural Networks", "Mathematics", "Machine Learning", "Backprop"],
    coverGradient: "linear-gradient(135deg, #701a75, #ec4899)"
  },
  {
    id: "BK-105",
    title: "Building Microservices: Designing Fine-Grained Systems",
    author: "Sam Newman",
    category: "Cloud Computing",
    description: "Comprehensive guidance on modeling, integrating, testing, and securing microservices architectures, addressing service meshes and database decomposition.",
    isbn: "978-1492034025",
    publishedYear: 2021,
    totalCopies: 6,
    availableCopies: 4,
    rating: 4.8,
    tags: ["Microservices", "API Gateways", "Distributed Systems", "Cloud", "Domain Driven Design"],
    coverGradient: "linear-gradient(135deg, #1e293b, #3b82f6)"
  },
  {
    id: "BK-106",
    title: "Sapiens: A Brief History of Humankind",
    author: "Yuval Noah Harari",
    category: "History & Civilization",
    description: "An exhilarating exploration of how cognitive, agricultural, and scientific revolutions shaped the human species and contemporary global institutions.",
    isbn: "978-0062316097",
    publishedYear: 2015,
    totalCopies: 8,
    availableCopies: 5,
    rating: 4.7,
    tags: ["History", "Anthropology", "Civilization", "Evolution", "Humanity"],
    coverGradient: "linear-gradient(135deg, #854d0e, #eab308)"
  },
  {
    id: "BK-107",
    title: "Thinking, Fast and Slow",
    author: "Daniel Kahneman",
    category: "Philosophy & Psychology",
    description: "Nobel laureate Daniel Kahneman takes us on an intellectual tour of the dual-system mind, cognitive biases, loss aversion, and behavioral economics.",
    isbn: "978-0374533557",
    publishedYear: 2011,
    totalCopies: 7,
    availableCopies: 4,
    rating: 4.6,
    tags: ["Psychology", "Cognitive Biases", "Behavioral Economics", "Decision Making"],
    coverGradient: "linear-gradient(135deg, #991b1b, #f87171)"
  },
  {
    id: "BK-108",
    title: "Dune",
    author: "Frank Herbert",
    category: "Science Fiction",
    description: "The legendary science fiction masterpiece set on the desert planet Arrakis, intertwining interstellar feudal politics, ecology, and messianic destiny.",
    isbn: "978-0441172719",
    publishedYear: 1965,
    totalCopies: 8,
    availableCopies: 5,
    rating: 4.9,
    tags: ["Sci-Fi", "Space Opera", "Ecology", "Politics", "Classic"],
    coverGradient: "linear-gradient(135deg, #b45309, #f59e0b)"
  },
  {
    id: "BK-109",
    title: "Project Hail Mary",
    author: "Andy Weir",
    category: "Science Fiction",
    description: "A lone surviving astronaut must unlock alien biology and quantum astrophysics to avert interstellar planetary extinction in deep space.",
    isbn: "978-0593135204",
    publishedYear: 2021,
    totalCopies: 6,
    availableCopies: 3,
    rating: 4.9,
    tags: ["Hard Sci-Fi", "Astrophysics", "First Contact", "Space Travel", "Humor"],
    coverGradient: "linear-gradient(135deg, #0f766e, #14b8a6)"
  },
  {
    id: "BK-110",
    title: "Atomic Habits: Proven Framework for Daily Improvement",
    author: "James Clear",
    category: "Philosophy & Psychology",
    description: "A framework based on biology, psychology, and neuroscience to establish positive incremental routines, eliminate negative patterns, and master tiny changes.",
    isbn: "978-0735211292",
    publishedYear: 2018,
    totalCopies: 9,
    availableCopies: 6,
    rating: 4.8,
    tags: ["Habits", "Self-Improvement", "Psychology", "Productivity", "Behavior"],
    coverGradient: "linear-gradient(135deg, #374151, #9ca3af)"
  },
  {
    id: "BK-111",
    title: "Zero to One: Notes on Startups, or How to Build the Future",
    author: "Peter Thiel & Blake Masters",
    category: "Business & Leadership",
    description: "Provocative philosophies on creating proprietary monopolies through technological innovation and breakthrough vertical progress.",
    isbn: "978-0804139298",
    publishedYear: 2014,
    totalCopies: 5,
    availableCopies: 3,
    rating: 4.5,
    tags: ["Startups", "Venture Capital", "Innovation", "Monopoly", "Strategy"],
    coverGradient: "linear-gradient(135deg, #1e1b4b, #4f46e5)"
  },
  {
    id: "BK-112",
    title: "The Pragmatic Programmer: Your Journey to Mastery",
    author: "David Thomas & Andrew Hunt",
    category: "Computer Science",
    description: "Timeless wisdom on software craftsmanship, decoupling, domain idioms, debugging psychology, and career development.",
    isbn: "978-0135957059",
    publishedYear: 2019,
    totalCopies: 6,
    availableCopies: 2,
    rating: 4.9,
    tags: ["Best Practices", "Coding", "Craftsmanship", "Software Engineering"],
    coverGradient: "linear-gradient(135deg, #047857, #34d399)"
  },
  {
    id: "BK-113",
    title: "Structure and Interpretation of Computer Programs (SICP)",
    author: "Harold Abelson & Gerald Jay Sussman",
    category: "Computer Science",
    description: "The legendary MIT foundation text on procedural abstraction, data modeling, functional meta-interpreters, and computational linguistics.",
    isbn: "978-0262510875",
    publishedYear: 1996,
    totalCopies: 4,
    availableCopies: 2,
    rating: 4.9,
    tags: ["MIT", "Functional Programming", "Scheme", "Lisp", "Computer Science"],
    coverGradient: "linear-gradient(135deg, #4c1d95, #8b5cf6)"
  },
  {
    id: "BK-114",
    title: "Cosmos",
    author: "Carl Sagan",
    category: "Science & Physics",
    description: "Carl Sagan's poetic voyage across fifteen billion years of cosmic evolution, tracking the origin of stars, planetary science, and the human search for meaning.",
    isbn: "978-0345539434",
    publishedYear: 1980,
    totalCopies: 6,
    availableCopies: 4,
    rating: 4.9,
    tags: ["Astronomy", "Cosmology", "Science", "Evolution", "Poetic Science"],
    coverGradient: "linear-gradient(135deg, #0369a1, #38bdf8)"
  },
  {
    id: "BK-115",
    title: "Deep Work: Rules for Focused Success in a Distracted World",
    author: "Cal Newport",
    category: "Philosophy & Psychology",
    description: "A cultural and cognitive critique of digital distraction with rigorous frameworks for developing profound, uninterrupted intellectual focus.",
    isbn: "978-1455586691",
    publishedYear: 2016,
    totalCopies: 5,
    availableCopies: 3,
    rating: 4.6,
    tags: ["Focus", "Productivity", "Attention Economy", "Work Ethic"],
    coverGradient: "linear-gradient(135deg, #831843, #f43f5e)"
  },
  {
    id: "BK-116",
    title: "Kubernetes: Up and Running",
    author: "Brendan Burns, Joe Beda & Kelsey Hightower",
    category: "Cloud Computing",
    description: "Written by the co-founders of Kubernetes, this book unpacks container orchestration, declarative APIs, multi-node scheduling, and service discovery.",
    isbn: "978-1492046530",
    publishedYear: 2022,
    totalCopies: 5,
    availableCopies: 3,
    rating: 4.7,
    tags: ["Kubernetes", "Containers", "DevOps", "Cloud", "Orchestration"],
    coverGradient: "linear-gradient(135deg, #2563eb, #60a5fa)"
  },
  {
    id: "BK-117",
    title: "Algorithms to Live By: The Computer Science of Human Decisions",
    author: "Brian Christian & Tom Griffiths",
    category: "Computer Science",
    description: "Fascinating bridge between algorithm design (optimal stopping, caching algorithms, sorting, and game theory) and everyday human dilemma resolution.",
    isbn: "978-1627790369",
    publishedYear: 2016,
    totalCopies: 5,
    availableCopies: 4,
    rating: 4.7,
    tags: ["Algorithms", "Decision Theory", "Game Theory", "Optimization"],
    coverGradient: "linear-gradient(135deg, #115e59, #2dd4bf)"
  },
  {
    id: "BK-118",
    title: "Guns, Germs, and Steel: The Fates of Human Societies",
    author: "Jared Diamond",
    category: "History & Civilization",
    description: "Pulitzer Prize-winning analysis demonstrating how geographic and environmental contingencies, rather than biological differences, shaped human civilizations.",
    isbn: "978-0393354324",
    publishedYear: 1997,
    totalCopies: 5,
    availableCopies: 3,
    rating: 4.5,
    tags: ["History", "Geography", "Civilization", "Anthropology"],
    coverGradient: "linear-gradient(135deg, #713f12, #ca8a04)"
  },
  {
    id: "BK-119",
    title: "Reinforcement Learning: An Introduction",
    author: "Richard S. Sutton & Andrew G. Barto",
    category: "Artificial Intelligence",
    description: "The seminal foundational textbook on Markov decision processes, temporal-difference learning, Q-learning, and policy gradients in artificial agents.",
    isbn: "978-0262039246",
    publishedYear: 2018,
    totalCopies: 4,
    availableCopies: 2,
    rating: 4.8,
    tags: ["Reinforcement Learning", "MDP", "Policy Gradient", "AI Research"],
    coverGradient: "linear-gradient(135deg, #581c87, #a855f7)"
  },
  {
    id: "BK-120",
    title: "Neuromancer",
    author: "William Gibson",
    category: "Science Fiction",
    description: "The seminal Hugo and Nebula-winning cyberpunk classic that popularized the concept of cyberspace, rogue AIs, and neural-interfaced hackers.",
    isbn: "978-0441569595",
    publishedYear: 1984,
    totalCopies: 6,
    availableCopies: 3,
    rating: 4.6,
    tags: ["Cyberpunk", "AI", "Cyberspace", "Sci-Fi Classic", "Noir"],
    coverGradient: "linear-gradient(135deg, #09090b, #06b6d4)"
  }
];

const INITIAL_MEMBERS = [
  {
    id: "MBR-101",
    name: "Roshan Sharma",
    email: "roshan.sharma@librasphere.org",
    phone: "+91 98450 12345",
    membershipTier: "Scholar",
    joinedDate: "2025-06-15",
    status: "Active",
    maxBorrowLimit: 5,
    favouriteCategories: ["Cloud Computing", "Computer Science", "Artificial Intelligence"]
  },
  {
    id: "MBR-102",
    name: "Dr. Priya Venkat",
    email: "priya.venkat@research.ac.in",
    phone: "+91 98201 54321",
    membershipTier: "Premium",
    joinedDate: "2025-08-20",
    status: "Active",
    maxBorrowLimit: 5,
    favouriteCategories: ["Artificial Intelligence", "Science & Physics"]
  },
  {
    id: "MBR-103",
    name: "Aarav Mehta",
    email: "aarav.mehta@techscale.io",
    phone: "+91 98765 43210",
    membershipTier: "Standard",
    joinedDate: "2026-01-10",
    status: "Active",
    maxBorrowLimit: 3,
    favouriteCategories: ["Computer Science", "Cloud Computing"]
  },
  {
    id: "MBR-104",
    name: "Tanya Sen",
    email: "tanya.sen@humanities.org",
    phone: "+91 97112 88990",
    membershipTier: "Scholar",
    joinedDate: "2025-09-04",
    status: "Active",
    maxBorrowLimit: 5,
    favouriteCategories: ["History & Civilization", "Philosophy & Psychology"]
  },
  {
    id: "MBR-105",
    name: "Vikramaditya Rao",
    email: "vikram.rao@fintechventures.com",
    phone: "+91 98888 23456",
    membershipTier: "Premium",
    joinedDate: "2025-11-12",
    status: "Active",
    maxBorrowLimit: 5,
    favouriteCategories: ["Business & Leadership", "Philosophy & Psychology"]
  },
  {
    id: "MBR-106",
    name: "Sneha Kulkarni",
    email: "sneha.k@fictionhub.net",
    phone: "+91 99401 77654",
    membershipTier: "Standard",
    joinedDate: "2026-02-01",
    status: "Active",
    maxBorrowLimit: 3,
    favouriteCategories: ["Science Fiction", "Science & Physics"]
  },
  {
    id: "MBR-107",
    name: "Devansh Patel",
    email: "devansh.patel@enggcollege.edu",
    phone: "+91 98111 65432",
    membershipTier: "Standard",
    joinedDate: "2026-03-15",
    status: "Active",
    maxBorrowLimit: 3,
    favouriteCategories: ["Computer Science", "Science Fiction"]
  },
  {
    id: "MBR-108",
    name: "Ananya Deshmukh",
    email: "ananya.d@modernarts.org",
    phone: "+91 99222 34567",
    membershipTier: "Scholar",
    joinedDate: "2025-07-22",
    status: "Active",
    maxBorrowLimit: 5,
    favouriteCategories: ["Philosophy & Psychology", "History & Civilization"]
  }
];

const INITIAL_LOANS = [
  {
    loanId: "LN-101",
    memberId: "MBR-101",
    bookId: "BK-101",
    borrowedAt: "2026-09-18",
    dueDate: "2026-10-02",
    returnedAt: null,
    status: "Active",
    fine: 0
  },
  {
    loanId: "LN-102",
    memberId: "MBR-101",
    bookId: "BK-103",
    borrowedAt: "2026-09-22",
    dueDate: "2026-10-06",
    returnedAt: null,
    status: "Active",
    fine: 0
  },
  {
    loanId: "LN-103",
    memberId: "MBR-102",
    bookId: "BK-104",
    borrowedAt: "2026-09-10",
    dueDate: "2026-09-24",
    returnedAt: null,
    status: "Overdue",
    fine: 15
  },
  {
    loanId: "LN-104",
    memberId: "MBR-103",
    bookId: "BK-102",
    borrowedAt: "2026-09-16",
    dueDate: "2026-09-30",
    returnedAt: null,
    status: "Due Soon",
    fine: 0
  },
  {
    loanId: "LN-105",
    memberId: "MBR-104",
    bookId: "BK-106",
    borrowedAt: "2026-09-14",
    dueDate: "2026-09-28",
    returnedAt: null,
    status: "Due Soon",
    fine: 0
  },
  {
    loanId: "LN-106",
    memberId: "MBR-105",
    bookId: "BK-111",
    borrowedAt: "2026-09-08",
    dueDate: "2026-09-22",
    returnedAt: null,
    status: "Overdue",
    fine: 25
  },
  {
    loanId: "LN-107",
    memberId: "MBR-106",
    bookId: "BK-108",
    borrowedAt: "2026-09-20",
    dueDate: "2026-10-04",
    returnedAt: null,
    status: "Active",
    fine: 0
  },
  {
    loanId: "LN-108",
    memberId: "MBR-107",
    bookId: "BK-112",
    borrowedAt: "2026-09-21",
    dueDate: "2026-10-05",
    returnedAt: null,
    status: "Active",
    fine: 0
  },
  {
    loanId: "LN-109",
    memberId: "MBR-101",
    bookId: "BK-102",
    borrowedAt: "2026-08-01",
    dueDate: "2026-08-15",
    returnedAt: "2026-08-14",
    status: "Returned",
    fine: 0
  },
  {
    loanId: "LN-110",
    memberId: "MBR-101",
    bookId: "BK-116",
    borrowedAt: "2026-08-20",
    dueDate: "2026-09-03",
    returnedAt: "2026-09-02",
    status: "Returned",
    fine: 0
  },
  {
    loanId: "LN-111",
    memberId: "MBR-102",
    bookId: "BK-119",
    borrowedAt: "2026-08-15",
    dueDate: "2026-08-29",
    returnedAt: "2026-08-28",
    status: "Returned",
    fine: 0
  },
  {
    loanId: "LN-112",
    memberId: "MBR-104",
    bookId: "BK-107",
    borrowedAt: "2026-07-10",
    dueDate: "2026-07-24",
    returnedAt: "2026-07-22",
    status: "Returned",
    fine: 0
  },
  {
    loanId: "LN-113",
    memberId: "MBR-105",
    bookId: "BK-115",
    borrowedAt: "2026-08-05",
    dueDate: "2026-08-19",
    returnedAt: "2026-08-18",
    status: "Returned",
    fine: 0
  },
  {
    loanId: "LN-114",
    memberId: "MBR-106",
    bookId: "BK-109",
    borrowedAt: "2026-08-12",
    dueDate: "2026-08-26",
    returnedAt: "2026-08-25",
    status: "Returned",
    fine: 0
  }
];

const INITIAL_ACTIVITIES = [
  {
    id: "ACT-101",
    type: "BORROW",
    message: "Roshan Sharma borrowed 'Cloud Native Patterns' (Due: Oct 06, 2026)",
    timestamp: "2026-09-22T11:45:00Z"
  },
  {
    id: "ACT-102",
    type: "BORROW",
    message: "Devansh Patel borrowed 'The Pragmatic Programmer' (Due: Oct 05, 2026)",
    timestamp: "2026-09-21T15:20:00Z"
  },
  {
    id: "ACT-103",
    type: "BORROW",
    message: "Sneha Kulkarni borrowed 'Dune' by Frank Herbert (Due: Oct 04, 2026)",
    timestamp: "2026-09-20T10:15:00Z"
  },
  {
    id: "ACT-104",
    type: "OVERDUE_ALERT",
    message: "Overdue alert flagged for 'Deep Learning' (Borrowed by Dr. Priya Venkat)",
    timestamp: "2026-09-25T00:01:00Z"
  },
  {
    id: "ACT-105",
    type: "RETURN",
    message: "Roshan Sharma returned 'Kubernetes: Up and Running' in pristine condition",
    timestamp: "2026-09-02T14:30:00Z"
  },
  {
    id: "ACT-106",
    type: "BOOK_ADDED",
    message: "New title catalogued: 'Project Hail Mary' by Andy Weir (6 copies acquired)",
    timestamp: "2026-08-28T09:00:00Z"
  },
  {
    id: "ACT-107",
    type: "MEMBER_REGISTERED",
    message: "New member enrolled: Devansh Patel (Tier: Standard, ID: MBR-107)",
    timestamp: "2026-03-15T11:00:00Z"
  }
];

function cloneData(data) {
  return JSON.parse(JSON.stringify(data));
}

function normalizeLoans(loans) {
  return loans.map(l => {
    const id = l.id || l.loanId;
    const borrowDate = l.borrowDate || l.borrowedAt || "2026-09-01";
    const returnDate = l.returnDate !== undefined ? l.returnDate : (l.returnedAt || null);
    const fineAmount = Number(l.fineAmount !== undefined ? l.fineAmount : (l.fine || 0));
    return {
      ...l,
      id,
      loanId: id,
      borrowDate,
      borrowedAt: borrowDate,
      returnDate,
      returnedAt: returnDate,
      fineAmount,
      fine: fineAmount
    };
  });
}

const store = {
  categories: cloneData(INITIAL_CATEGORIES),
  books: cloneData(INITIAL_BOOKS),
  members: cloneData(INITIAL_MEMBERS),
  loans: normalizeLoans(cloneData(INITIAL_LOANS)),
  activities: cloneData(INITIAL_ACTIVITIES),

  clear() {
    this.books = [];
    this.members = [];
    this.loans = [];
    this.activities = [];
  },

  restore() {
    this.categories = cloneData(INITIAL_CATEGORIES);
    this.books = cloneData(INITIAL_BOOKS);
    this.members = cloneData(INITIAL_MEMBERS);
    this.loans = normalizeLoans(cloneData(INITIAL_LOANS));
    this.activities = cloneData(INITIAL_ACTIVITIES);
  }
};

module.exports = store;
