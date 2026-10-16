const express = require("express");
const router = express.Router();
const Token = require("../models/Token");
const { requireAuth, allowRoles } = require("../middleware/auth");
const { generateToken, generateBulkTokens, getToken, markPaid, getReport, regenerateToken, getBatchTokens } = require("../controllers/tokenController");

router.use(requireAuth);
// Admin-only management actions
router.post("/generate", allowRoles("Admin"), generateToken);
router.post("/bulk-generate", allowRoles("Admin"), generateBulkTokens);
router.get("/report", allowRoles("Admin"), getReport);
router.post("/regenerate/:id", allowRoles("Admin"), regenerateToken);
// Token verification access is available to Admin and Verifier
router.get("/", allowRoles("Admin", "Verifier"), async (req, res) => {
  try { const tokens = await Token.find().sort({ createdAt: -1 }); res.json(tokens); }
  catch (err) { res.status(500).json({ error: err.message }); }
});
router.get("/batch/:batchNumber", allowRoles("Admin"), getBatchTokens);
router.put("/pay/:id", allowRoles("Admin", "Verifier"), markPaid);
router.get("/:id", allowRoles("Admin", "Verifier"), getToken);
module.exports = router;
