const express = require("express");
const router = express.Router();
const Token = require("../models/Token");
const {
  generateToken,
  generateBulkTokens,
  getToken,
  markPaid,
  getReport,
  regenerateToken,
  getBatchTokens
} = require("../controllers/tokenController");
// ===============================
// Generate Single Token
// ===============================
router.post(
  "/generate",
  generateToken
);
// ===============================
// Generate Bulk Tokens
// ===============================
router.post(
  "/bulk-generate",
  generateBulkTokens
);
// ===============================
// Report
// MUST COME BEFORE /:id
// ===============================
router.get(
  "/report",
  getReport
);
// ===============================
// Get All Tokens
// ===============================
router.get(
  "/",
  async(req,res)=>{
    try{
      const tokens =
      await Token.find()
      .sort({
        createdAt:-1
      });
      res.json(tokens);
    }catch(err){
      res.status(500).json({
        error:err.message
      });
    }
  }
);
// ===============================
// Get Tokens By Batch
// Example:
// /api/tokens/batch/B202609171234
// ===============================
router.get(
  "/batch/:batchNumber",
  getBatchTokens
);
// ===============================
// Regenerate / Reprint Token
// Example:
// /api/tokens/regenerate/TKN123456
// ===============================
router.post(
  "/regenerate/:id",
  regenerateToken
);
// ===============================
// Mark Paid
// Example:
// /api/tokens/pay/TKN123456
// ===============================
router.put(
  "/pay/:id",
  markPaid
);
// ===============================
// Get Single Token
// MUST BE LAST
// ===============================
router.get(
  "/:id",
  getToken
);
module.exports = router;