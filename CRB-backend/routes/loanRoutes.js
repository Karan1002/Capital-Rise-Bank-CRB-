const express = require("express");
const Loan = require("../models/Loan");
const router = express.Router();


router.post('/car-apply', async (req, res) => {
    try {
        console.log("📥 RAW DATA:", req.body);

        const loanType = req.body.loanType;
        const typeMapping = {
            "Business Loan": "businessLoan",
            "Car Loan": "carLoan",
            "Education Loan": "educationLoan",
            "Gold Loan": "goldLoan",
            "Home Loan": "homeLoan"
        };

        if (!loanType || !typeMapping[loanType]) {
            return res.status(400).json({
                success: false,
                error: "Invalid loan type"
            });
        }

        const applicationType = typeMapping[loanType];

        /* 🔥 CRITICAL FIX: applicantName always required! */
        let nameField = req.body.applicantName || req.body.ownerName || req.body.name || "Customer";

        /* ---------- Common Fields ---------- */
        let loanData = {
            refNo: req.body.refNo || `LN${Date.now()}${Math.floor(Math.random() * 1000)}`,
            applicantName: nameField,  // ✅ ALWAYS SET
            email: req.body.email,
            phone: req.body.phone,
            loanAmount: Number(req.body.amount || req.body.loanAmount),
            loanType,
            applicationType,
            status: "pending",
            submittedOn: new Date()
        };

        /* ---------- Loan Specific Fields ---------- */
        if (applicationType === "businessLoan") {
            loanData.ownerName = req.body.ownerName || nameField;
            loanData.businessName = req.body.businessName;
            loanData.businessType = req.body.businessType;
        }

        if (applicationType === "carLoan") {
            loanData.carBrand = req.body.carBrand;
            loanData.carModel = req.body.carModel;
            loanData.carPrice = Number(req.body.carPrice);
        }

        if (applicationType === "educationLoan") {
            loanData.studentName = req.body.studentName || nameField;
            loanData.course = req.body.course;
            loanData.institution = req.body.institution;
        }

        if (applicationType === "goldLoan") {
            loanData.goldWeight = Number(req.body.goldWeight);
            loanData.goldPurity = req.body.goldPurity;
        }

        if (applicationType === "homeLoan") {
            loanData.propertyType = req.body.propertyType;
            loanData.propertyValue = Number(req.body.propertyValue);
            loanData.loanPurpose = req.body.loanPurpose;
        }

        console.log("📤 SAVING:", loanData);

        // ✅ Use new Loan() + save() instead of create()
        const loan = new Loan(loanData);
        await loan.save();

        console.log(`✅ ${loanType} saved | Ref: ${loan.refNo}`);

        res.status(201).json({
            success: true,
            refNo: loan.refNo,
            loanId: loan._id,
            message: `${loanType} submitted successfully`
        });

    } catch (error) {
        console.error("❌ FULL ERROR:", error);

        if (error.code === 11000) {
            return res.status(409).json({
                success: false,
                error: "Reference number already exists"
            });
        }

        if (error.name === "ValidationError") {
            const errors = Object.values(error.errors).map(e => e.message);
            return res.status(400).json({
                success: false,
                error: errors.join(", ")
            });
        }

        res.status(500).json({
            success: false,
            error: "Failed to process loan application"
        });
    }
});

/* =====================================================
   ✅ GET ALL LOANS - Admin Panel
===================================================== */
router.get("/", async (req, res) => {
    try {
        const { status, loanType, limit = 50, page = 1 } = req.query;
        const skip = (page - 1) * limit;

        let query = {};
        if (status) query.status = status;
        if (loanType) {
            const typeMap = {
                "Business Loan": "businessLoan",
                "Car Loan": "carLoan",
                "Education Loan": "educationLoan",
                "Gold Loan": "goldLoan",
                "Home Loan": "homeLoan"
            };
            query.applicationType = typeMap[loanType];
        }

        const loans = await Loan.find(query)
            .sort({ submittedOn: -1 })
            .skip(Number(skip))
            .limit(Number(limit))
            .select("-__v");

        const total = await Loan.countDocuments(query);

        res.json({
            success: true,
            total,
            page: Number(page),
            count: loans.length,
            data: loans
        });

    } catch (error) {
        console.error("❌ Fetch Loans Error:", error);
        res.status(500).json({
            success: false,
            error: "Failed to fetch loans"
        });
    }
});

/* =====================================================
   ✅ ADMIN STATUS UPDATE - /:id/approved & /:id/rejected
===================================================== */
router.put("/:id/:status(approved|rejected)", async (req, res) => {
    try {
        const { id, status } = req.params;

        const loan = await Loan.findByIdAndUpdate(
            id,
            {
                status,
                ...(status === "approved" && { approvedAt: new Date() }),
                ...(status === "rejected" && { rejectedAt: new Date() }),
                updatedAt: new Date()
            },
            { new: true, runValidators: true }
        ).select("-__v");

        if (!loan) {
            return res.status(404).json({
                success: false,
                error: "Loan not found"
            });
        }

        res.json({
            success: true,
            message: `${loan.loanType} ${status} successfully!`,
            data: loan
        });

    } catch (error) {
        console.error("❌ Status Update Error:", error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

module.exports = router;
