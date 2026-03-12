// server.js - REAL DATABASE ONLY ✅ PRODUCTION READY
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const bcrypt = require("bcryptjs");
require("dotenv").config();

const app = express();

// ✅ CORS Configuration - FIRST
app.use(cors({
  origin: [
    "http://localhost:3000",
    "http://127.0.0.1:5500",
    "http://localhost:5500",
    "http://localhost:5501",
    "https://lndb-frontend.vercel.app"
  ],
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"],
  allowedHeaders: ["Content-Type", "Authorization"]
}));

app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

// ============================================================================
// ✅ PROPER MODELS - Define ONCE globally (NO OVERWRITE ERROR)
// ============================================================================
const accountSchema = new mongoose.Schema({
  name: { type: String, required: true },
  fullName: String,        // ✅ Frontend compatibility
  email: String,
  phone: String,
  mobile: String,          // ✅ Frontend compatibility  
  type: { type: String, default: 'Savings' },
  accountType: String,     // ✅ Frontend compatibility
  status: { type: String, default: 'pending', enum: ['pending', 'approved', 'rejected'] },
  ref: String,
  refNo: String,           // ✅ Frontend compatibility
  referenceNo: String,
  appliedAt: { type: Date, default: Date.now }
});

const loanSchema = new mongoose.Schema({
  applicantName: { type: String, required: true },
  name: String,            // ✅ Frontend compatibility
  email: String,
  phoneNumber: String,
  phone: String,
  mobile: String,
  carBrand: String,
  amount: { type: Number, default: 50000 },
  status: { type: String, default: 'pending', enum: ['pending', 'approved', 'rejected'] },
  ref: String,
  refNo: String,
  referenceNo: String,
  appliedAt: { type: Date, default: Date.now }
});

const cardSchema = new mongoose.Schema({
  name: { type: String, required: true },
  fullName: String,
  email: String,
  phone: { type: String, required: true },
  mobile: String,
  type: { type: String, default: 'Debit' },
  status: { type: String, default: 'pending', enum: ['pending', 'approved', 'rejected'] },
  ref: String,
  refNo: String,
  referenceNo: String,
  appliedAt: { type: Date, default: Date.now }
});

const investmentSchema = new mongoose.Schema({
  name: { type: String, required: true },
  fullName: String,
  email: String,
  phone: String,
  mobile: String,
  plan: { type: String, default: 'SIP' },
  amount: { type: Number, default: 10000 },
  status: { type: String, default: 'pending', enum: ['pending', 'approved', 'rejected'] },
  ref: String,
  refNo: String,
  referenceNo: String,
  appliedAt: { type: Date, default: Date.now }
});

const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  createdAt: { type: Date, default: Date.now }
});

// ✅ Create models ONCE - NO OVERWRITE
const Account = mongoose.models.Account || mongoose.model('Account', accountSchema);
const Loan = mongoose.models.Loan || mongoose.model('Loan', loanSchema);
const Card = mongoose.models.Card || mongoose.model('Card', cardSchema);
const Investment = mongoose.models.Investment || mongoose.model('Investment', investmentSchema);
const User = mongoose.models.User || mongoose.model('User', userSchema);

// ============================================================================
// ✅ HEALTH CHECK - FIRST ROUTE
// ============================================================================
app.get("/", (req, res) => {
  res.json({
    message: "🚀 LNDB Backend LIVE ✅",
    models: {
      Account: !!mongoose.models.Account,
      Loan: !!mongoose.models.Loan,
      Card: !!mongoose.models.Card,
      Investment: !!mongoose.models.Investment
    },
    timestamp: new Date().toISOString()
  });
});

// ============================================================================
// ✅ AUTH ROUTES
// ============================================================================
app.post("/api/register", async (req, res) => {
  try {
    const { name, email, password } = req.body;
    if (!name || !email || !password) {
      return res.status(400).json({ success: false, message: "All fields required" });
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ success: false, message: "User exists" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = new User({ name, email, password: hashedPassword });
    await user.save();

    res.json({ success: true, message: "Registered!", user: { name, email } });
  } catch (error) {
    console.error('Register error:', error);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

app.post("/api/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });

    if (!user || !await bcrypt.compare(password, user.password)) {
      return res.status(400).json({ success: false, message: "Invalid credentials" });
    }

    res.json({ success: true, user: { id: user._id, name: user.name, email: user.email } });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

// ============================================================================
// ✅ APPLICATION FORM ROUTES
// ============================================================================
app.post('/api/accounts/apply', async (req, res) => {
  try {
    const { name, fullName, email, phone, mobile, accountType, type } = req.body;
    const refNo = 'ACC' + Date.now().toString().slice(-6);

    const account = new Account({
      name: name || fullName,
      fullName: fullName || name,
      email,
      phone: phone || mobile,
      mobile: mobile || phone,
      type: type || accountType || 'Savings',
      accountType: accountType || type || 'Savings',
      status: 'pending',
      ref: refNo,
      refNo,
      referenceNo: refNo
    });

    await account.save();
    console.log('🏦 New Account SAVED:', refNo);
    res.json({ success: true, message: "Account submitted!", account });
  } catch (error) {
    console.error('Account apply error:', error);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

app.post('/api/loans/car-apply', async (req, res) => {
  try {
    const { applicantName, name, email, phoneNumber, phone, mobile, carBrand, amount } = req.body;
    const refNo = 'LN' + Date.now().toString().slice(-6);

    const loan = new Loan({
      applicantName: applicantName || name,
      name: name || applicantName,
      email,
      phoneNumber: phoneNumber || phone || mobile,
      phone: phone || mobile || phoneNumber,
      mobile: mobile || phone || phoneNumber,
      carBrand,
      amount: parseInt(amount) || 50000,
      status: 'pending',
      ref: refNo,
      refNo,
      referenceNo: refNo
    });

    await loan.save();
    console.log('🚗 New Loan SAVED:', refNo);
    res.json({ success: true, message: "Loan submitted!", loan });
  } catch (error) {
    console.error('Loan error:', error);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

app.post('/api/cards/apply', async (req, res) => {
  try {
    const { name, fullName, email, phone, mobile, cardType, type } = req.body;
    const refNo = 'CRD' + Date.now().toString().slice(-6);

    const card = new Card({
      name: name || fullName,
      fullName: fullName || name,
      email,
      phone: phone || mobile,
      mobile: mobile || phone,
      type: type || cardType || 'Debit',
      status: 'pending',
      ref: refNo,
      refNo,
      referenceNo: refNo
    });

    await card.save();
    console.log('💳 New Card SAVED:', refNo);
    res.json({ success: true, message: "Card submitted!", card });
  } catch (error) {
    console.error('Card error:', error);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

app.post('/api/investments/apply', async (req, res) => {
  try {
    const { name, fullName, email, phone, mobile, plan, amount } = req.body;
    const refNo = 'INV' + Date.now().toString().slice(-6);

    const investment = new Investment({
      name: name || fullName,
      fullName: fullName || name,
      email,
      phone: phone || mobile,
      mobile: mobile || phone,
      plan: plan || 'SIP',
      amount: parseInt(amount) || 10000,
      status: 'pending',
      ref: refNo,
      refNo,
      referenceNo: refNo
    });

    await investment.save();
    console.log('📈 New Investment SAVED:', refNo);
    res.json({ success: true, message: "Investment submitted!", investment });
  } catch (error) {
    console.error('Investment error:', error);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

// ============================================================================
// ✅ ADMIN PANEL ROUTES
// ============================================================================
app.get('/api/accounts', async (req, res) => {
  try {
    const accounts = await Account.find({}).sort({ appliedAt: -1 }).limit(50);
    res.json({ data: accounts });
  } catch (error) {
    console.error('Accounts fetch error:', error);
    res.json({ data: [] });
  }
});

app.get('/api/loans', async (req, res) => {
  try {
    const loans = await Loan.find({}).sort({ appliedAt: -1 }).limit(50);
    res.json({ data: loans });
  } catch (error) {
    console.error('Loans fetch error:', error);
    res.json({ data: [] });
  }
});

app.get('/api/cards', async (req, res) => {
  try {
    const cards = await Card.find({}).sort({ appliedAt: -1 }).limit(50);
    res.json({ data: cards });
  } catch (error) {
    console.error('Cards fetch error:', error);
    res.json({ data: [] });
  }
});

app.get('/api/investments', async (req, res) => {
  try {
    const investments = await Investment.find({}).sort({ appliedAt: -1 }).limit(50);
    res.json({ data: investments });
  } catch (error) {
    console.error('Investments fetch error:', error);
    res.json({ data: [] });
  }
});

// ============================================================================
// ✅ STATUS UPDATE ROUTES
// ============================================================================
app.put('/api/accounts/update/:id', async (req, res) => {
  try {
    await Account.findByIdAndUpdate(req.params.id, { status: req.body.status });
    console.log('✅ Account UPDATED:', req.params.id, '→', req.body.status);
    res.json({ success: true });
  } catch (error) {
    console.error('Account update error:', error);
    res.status(500).json({ success: false });
  }
});

app.put('/api/loans/update/:id', async (req, res) => {
  try {
    await Loan.findByIdAndUpdate(req.params.id, { status: req.body.status });
    console.log('✅ Loan UPDATED:', req.params.id, '→', req.body.status);
    res.json({ success: true });
  } catch (error) {
    console.error('Loan update error:', error);
    res.status(500).json({ success: false });
  }
});

app.put('/api/cards/update/:id', async (req, res) => {
  try {
    await Card.findByIdAndUpdate(req.params.id, { status: req.body.status });
    console.log('✅ Card UPDATED:', req.params.id, '→', req.body.status);
    res.json({ success: true });
  } catch (error) {
    console.error('Card update error:', error);
    res.status(500).json({ success: false });
  }
});

app.put('/api/investments/update/:id', async (req, res) => {
  try {
    await Investment.findByIdAndUpdate(req.params.id, { status: req.body.status });
    console.log('✅ Investment UPDATED:', req.params.id, '→', req.body.status);
    res.json({ success: true });
  } catch (error) {
    console.error('Investment update error:', error);
    res.status(500).json({ success: false });
  }
});

// ============================================================================
// ✅ ROUTES - AFTER ALL INLINE ROUTES (No conflicts)
// ============================================================================
try {
  const accountRoutes = require("./routes/accountRoutes");
  const loanRoutes = require("./routes/loanRoutes");
  const cardRoutes = require("./routes/cardRoutes");
  const investmentRoutes = require("./routes/investmentRoutes");
  const adminRoutes = require("./routes/adminRoutes");

  app.use("/api/accounts", accountRoutes);
  app.use("/api/loans", loanRoutes);
  app.use("/api/cards", cardRoutes);
  app.use("/api/investments", investmentRoutes);
  app.use("/api/admin", adminRoutes);
} catch (error) {
  console.log('⚠️ Route files not found - using inline routes only');
}

// ============================================================================
// ✅ MONGODB CONNECTION
// ============================================================================
const connectDB = async () => {
  try {
    const MONGO_URI = process.env.MONGO_URI;
    if (!MONGO_URI) {
      console.error("❌ MONGO_URI missing in .env file!");
      return;
    }

    await mongoose.connect(MONGO_URI, {
      serverSelectionTimeoutMS: 10000,
      socketTimeoutMS: 45000,
      maxPoolSize: process.env.NODE_ENV === 'production' ? 3 : 5,
      family: 4
    });
    console.log("✅ MongoDB Connected! MODELS READY");
  } catch (error) {
    console.error("❌ MongoDB Error:", error.message);
    setTimeout(connectDB, 5000);
  }
};

// ============================================================================
// ✅ ERROR HANDLERS - LAST
// ============================================================================
app.use((err, req, res, next) => {
  console.error("🚨 ERROR:", err.stack);
  res.status(500).json({ success: false, message: "Server error" });
});

app.use("*", (req, res) => {
  res.status(404).json({ success: false, message: "Route not found" });
});

// ============================================================================
// ✅ START SERVER
// ============================================================================
const PORT = process.env.PORT || 5000;
const HOST = process.env.NODE_ENV === 'production' ? "0.0.0.0" : "localhost";

connectDB();

app.listen(PORT, HOST, () => {
  console.log(`🚀 Server running: http://${HOST}:${PORT}`);
  console.log(`✅ All models loaded - NO overwrite errors!`);
  console.log(`✅ Admin panel: http://localhost:5501`);
  console.log(`✅ Health check: http://localhost:5000`);
});
