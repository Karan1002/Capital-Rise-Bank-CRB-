// server.js - SMART LOAN TYPE HANDLING (carBrand NULL for Business Loan)

const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const bcrypt = require("bcryptjs");
require("dotenv").config();

const app = express();

// =====================================================
// CORS - ALL HTML FILES COMPATIBLE
// =====================================================
app.use(cors({
  origin: [
    "http://localhost:3000",
    "http://127.0.0.1:5500",
    "http://localhost:5500",
    "http://localhost:5501",
    "https://lndb-frontend.vercel.app",
    "http://localhost:5502",
    "http://127.0.0.1:5502"
  ],
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"]
}));

app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ extended: true, limit: "50mb" }));

// =====================================================
// UNIVERSAL HELPERS
// =====================================================
const sanitizeStatus = (statusValue) => {
  if (!statusValue) return "pending";
  const cleanStatus = statusValue.toString().toLowerCase().trim();
  return ["pending", "approved", "rejected"].includes(cleanStatus) ? cleanStatus : "pending";
};

const getPhoneNumber = (phoneNumber, phone, mobile, contactMobile) => {
  return phoneNumber || phone || mobile || contactMobile || "N/A";
};

const getLoanType = (type, loanType, loan_type) => {
  return loanType || loan_type || type || "Personal Loan";
};

const getAccountType = (type, accountType, account_type) => {
  return accountType || account_type || type || "Savings";
};

// 🔥 NEW HELPER - SMART FIELD CLEANING
const cleanLoanFields = (loanType, data) => {
  const typeLower = loanType.toLowerCase();

  // Business/Personal/Home/Education → Clear Car fields
  if (['business', 'personal', 'home', 'education'].some(t => typeLower.includes(t))) {
    data.carBrand = null;
    data.carModel = null;
    data.carPrice = null;
    data.carDetails = null;
  }

  // Gold Loan → Clear Car fields
  if (typeLower.includes('gold')) {
    data.carBrand = null;
    data.carModel = null;
    data.carPrice = null;
  }

  // Car Loan → Clear Gold/Education fields
  if (typeLower.includes('car')) {
    data.goldWeight = null;
    data.goldPurity = null;
    data.course = null;
  }

  return data;
};

// =====================================================
// ULTRA FLEXIBLE SCHEMAS (Unchanged)
const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true, lowercase: true },
  password: { type: String, required: true },
  createdAt: { type: Date, default: Date.now }
});

const accountSchema = new mongoose.Schema({
  name: { type: String, required: true },
  fullName: String,
  fatherName: String,
  motherName: String,
  email: String,
  phone: String,
  dob: Date,
  gender: String,
  maritalStatus: String,
  type: { type: String, default: "Savings" },
  accountType: String,
  status: { type: String, default: "pending", enum: ["pending", "approved", "rejected"] },
  ref: String, refNo: String, referenceNo: String,
  appliedAt: { type: Date, default: Date.now },
  accountNumber: String,
  address: String,
  city: String,
  state: String,
  district: String,
  pinCode: String,
  branchName: String,
  nomineeName: String,
  nomineeRelation: String,
  nomineeDob: Date,
  income: Number,
  annualLimit: String,
  pan: String,
  aadhaar: String,
  gstNumber: String,
  businessName: String,
  businessType: String,
  businessRegistration: String,
  natureOfBusiness: String,
  companyPan: String
}, { strict: false });

const loanSchema = new mongoose.Schema({
  applicantName: { type: String, required: true },
  name: String,
  fullName: String,
  fatherName: String,
  email: String,
  phone: String,
  type: { type: String, default: "Personal Loan" },
  carBrand: String,
  amount: { type: Number, default: 50000 },
  status: { type: String, default: "pending", enum: ["pending", "approved", "rejected"] },
  ref: String, refNo: String, referenceNo: String,
  appliedAt: { type: Date, default: Date.now },
  carModel: String,
  carPrice: String,
  carDetails: mongoose.Schema.Types.Mixed,
  goldWeight: Number,
  goldPurity: String,
  course: String,
  propertyValue: Number,
  businessTurnover: Number,
  loanPurpose: String,
  loan_type: String,
  loanType: String
}, { strict: false });

const cardSchema = new mongoose.Schema({
  name: { type: String, required: true },
  fullName: String,
  email: String,
  phone: String,
  type: { type: String, default: "Debit" },
  status: { type: String, default: "pending", enum: ["pending", "approved", "rejected"] },
  ref: String, refNo: String, referenceNo: String,
  appliedAt: { type: Date, default: Date.now },
  accountNumber: String,
  address: String,
  income: Number,
  annualLimit: String,
  pan: String,
  aadhaar: String,
  cardType: String
}, { strict: false });

const investmentSchema = new mongoose.Schema({
  name: { type: String, required: true },
  fullName: String,
  email: String,
  phone: String,
  type: String,
  plan: String,
  amount: { type: Number, default: 10000 },
  status: { type: String, default: "pending", enum: ["pending", "approved", "rejected"] },
  ref: String, refNo: String, referenceNo: String,
  appliedAt: { type: Date, default: Date.now }
}, { strict: false });

// =====================================================
// MODELS
const User = mongoose.models.User || mongoose.model("User", userSchema);
const Account = mongoose.models.Account || mongoose.model("Account", accountSchema);
const Loan = mongoose.models.Loan || mongoose.model("Loan", loanSchema);
const Card = mongoose.models.Card || mongoose.model("Card", cardSchema);
const Investment = mongoose.models.Investment || mongoose.model("Investment", investmentSchema);

// =====================================================
// AUTH ENDPOINTS (Unchanged)
app.post("/api/auth/register", async (req, res) => {
  try {
    console.log("👤 REGISTER:", req.body);
    const { name, email, password } = req.body;

    if (!name || !email || !password || password.length < 6) {
      return res.status(400).json({ success: false, message: "Name, email aur 6+ password!" });
    }

    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return res.status(409).json({ success: false, message: "Email already exists!" });
    }

    const hashedPassword = await bcrypt.hash(password, 12);
    const user = new User({ name: name.trim(), email: email.toLowerCase().trim(), password: hashedPassword });
    await user.save();

    console.log("✅ REGISTERED:", user.email);
    res.json({ success: true, message: "Registered successfully!", user: { id: user._id, name: user.name, email: user.email } });
  } catch (error) {
    console.error("❌ Register error:", error);
    res.status(500).json({ success: false, message: "Server error!" });
  }
});

app.post("/api/auth/login", async (req, res) => {
  try {
    console.log("🔐 LOGIN:", req.body.email);
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ success: false, message: "Email & password required!" });
    }

    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user || !await bcrypt.compare(password, user.password)) {
      return res.status(401).json({ success: false, message: "Invalid credentials!" });
    }

    console.log("✅ LOGIN SUCCESS:", user.email);
    res.json({ success: true, message: "Login successful!", user: { id: user._id, name: user.name, email: user.email } });
  } catch (error) {
    console.error("❌ Login error:", error);
    res.status(500).json({ success: false, message: "Server error!" });
  }
});

// =====================================================
// 🔥 SMART LOAN ENDPOINT (carBrand NULL for Business Loan)
app.post("/api/loans/car-apply", async (req, res) => {
  try {
    console.log("🚗 LOAN FORM (Smart Type Handling):", req.body);
    const {
      applicantName, name, fullName, email, phoneNumber, phone, mobile,
      type, loanType, loan_type, carBrand, amount, status, businessName, businessType,
      course, goldWeight, ...extra
    } = req.body;
    const refNo = "LN" + Date.now().toString().slice(-6);

    // 🔥 LOAN TYPE DETECTION
    const loanTypeFinal = getLoanType(type, loanType, loan_type);
    console.log("📋 Detected Loan Type:", loanTypeFinal);

    // 🔥 SMART FIELD CLEANING
    let cleanedExtra = cleanLoanFields(loanTypeFinal, { ...extra, carBrand });

    // Business Loan me carBrand ko explicitly NULL karo
    if (loanTypeFinal.toLowerCase().includes('business')) {
      cleanedExtra.carBrand = null;
      console.log("🧹 Business Loan → carBrand set to NULL");
    }

    const loan = new Loan({
      applicantName: applicantName || name || fullName || "N/A",
      name: name || applicantName || fullName || "N/A",
      email: email || "",
      phone: getPhoneNumber(phoneNumber, phone, mobile),
      type: loanTypeFinal,
      carBrand: cleanedExtra.carBrand || null,  // 🔥 Smart handling
      amount: parseInt(amount) || 50000,
      status: sanitizeStatus(status),
      ref: refNo, refNo: refNo, referenceNo: refNo,
      ...cleanedExtra
    });

    await loan.save();
    console.log("✅ LOAN SAVED:", refNo);
    console.log("📊 Final Data → carBrand:", loan.carBrand, "businessName:", loan.businessName);

    res.json({
      success: true,
      message: `${loanTypeFinal} submitted successfully! 🎉`,
      refNo,
      loanType: loanTypeFinal,
      carBrand: loan.carBrand,  // Show what got saved
      loan
    });
  } catch (error) {
    console.error("Loan error:", error);
    res.status(500).json({ success: false, message: "Server error!" });
  }
});

// =====================================================
// OTHER ENDPOINTS (Unchanged)
app.post("/api/accounts/apply", async (req, res) => {
  try {
    console.log("🏦 ACCOUNT FORM:", req.body);
    const { name, fullName, email, phone, mobile, contactMobile, accountType, type, status, ...extra } = req.body;
    const refNo = "ACC" + Date.now().toString().slice(-6);

    const account = new Account({
      name: name || fullName,
      fullName: fullName || name,
      email: email || "",
      phone: getPhoneNumber(null, phone, mobile, contactMobile),
      type: getAccountType(type, accountType),
      status: sanitizeStatus(status),
      ref: refNo, refNo, referenceNo: refNo,
      ...extra
    });

    await account.save();
    console.log("✅ ACCOUNT SAVED:", refNo);
    res.json({ success: true, message: "Account application submitted!", refNo, account });
  } catch (error) {
    console.error("Account error:", error);
    res.status(500).json({ success: false, message: "Server error!" });
  }
});

app.post("/api/cards/apply", async (req, res) => {
  try {
    console.log("💳 CARD FORM:", req.body);
    const { name, fullName, email, phone, mobile, cardType, type, status, ...extra } = req.body;
    const refNo = "CRD" + Date.now().toString().slice(-6);

    const card = new Card({
      name: name || fullName,
      fullName: fullName || name,
      email: email || "",
      phone: getPhoneNumber(null, phone, mobile),
      type: type || cardType || "Debit",
      status: sanitizeStatus(status),
      ref: refNo, refNo, referenceNo: refNo,
      ...extra
    });

    await card.save();
    console.log("✅ CARD SAVED:", refNo);
    res.json({ success: true, message: "Card application submitted!", refNo, card });
  } catch (error) {
    console.error("Card error:", error);
    res.status(500).json({ success: false, message: "Server error!" });
  }
});

app.post("/api/investments/apply", async (req, res) => {
  try {
    console.log("📈 INVESTMENT FORM:", req.body);
    const { name, fullName, email, phone, mobile, type, plan, amount, status, ...extra } = req.body;
    const refNo = "INV" + Date.now().toString().slice(-6);

    const investment = new Investment({
      name: name || fullName,
      fullName: fullName || name,
      email: email || "",
      phone: getPhoneNumber(null, phone, mobile),
      type: type || plan || "SIP",
      plan: plan || type || "SIP",
      amount: parseInt(amount) || 10000,
      status: sanitizeStatus(status),
      ref: refNo, refNo, referenceNo: refNo,
      ...extra
    });

    await investment.save();
    console.log("✅ INVESTMENT SAVED:", refNo);
    res.json({ success: true, message: "Investment application submitted!", refNo, investment });
  } catch (error) {
    console.error("Investment error:", error);
    res.status(500).json({ success: false, message: "Server error!" });
  }
});

// =====================================================
// ADMIN DASHBOARD ENDPOINTS
app.get("/api/accounts", async (req, res) => {
  const accounts = await Account.find().sort({ appliedAt: -1 }).limit(100);
  res.json({ success: true, count: accounts.length, data: accounts });
});

app.get("/api/loans", async (req, res) => {
  const loans = await Loan.find().sort({ appliedAt: -1 }).limit(100);
  res.json({ success: true, count: loans.length, data: loans });
});

app.get("/api/cards", async (req, res) => {
  const cards = await Card.find().sort({ appliedAt: -1 }).limit(100);
  res.json({ success: true, count: cards.length, data: cards });
});

app.get("/api/investments", async (req, res) => {
  const investments = await Investment.find().sort({ appliedAt: -1 }).limit(100);
  res.json({ success: true, count: investments.length, data: investments });
});

// =====================================================
// DB CONNECTION
const connectDB = async () => {
  try {
    const MONGO_URI = process.env.MONGO_URI || "mongodb://localhost:27017/crb-bank";
    await mongoose.connect(MONGO_URI);
    console.log("✅ MongoDB Connected!");
  } catch (error) {
    console.error("❌ Mongo Error:", error.message);
    setTimeout(connectDB, 5000);
  }
};

const PORT = process.env.PORT || 5000;

connectDB().then(() => {
  app.listen(PORT, "0.0.0.0", () => {
    console.log(`🚀 Server: http://localhost:${PORT}`);
    console.log(`✅ SMART LOAN HANDLING - Business Loan me carBrand = NULL!`);
    console.log(`📱 All 11 HTML forms compatible!`);
  });
});
