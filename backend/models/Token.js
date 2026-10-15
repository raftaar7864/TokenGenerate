// models/Token.js
const mongoose = require("mongoose");
const tokenSchema = new mongoose.Schema({
  // Unique readable token number
  tokenNumber: {
    type: String,
    required: true,
    unique: true
  },
  // Batch identification
  batchNumber:{
      type:String,
      default:"OLD",
      index:true
  },
  category: {
    type: String,
    enum: [
      "Food",
      "Car",
      "Toto",
      "Bike",
      "Durgapuja 2026",
      "বস্ত্র বিতরণ",
      "Others"
    ],
    required: true
  },
  // QR image data
  qrCode: {
    type: String
  },
  paymentStatus: {
    type: String,
    default: "Unpaid"
  },
  validUpto: {
    type: String
  },
  paidAt: {
    type: Date
  },
  // Optional: track regenerated token
  regenerated: {
    type: Boolean,
    default: false
  },
  regeneratedAt: {
    type: Date
  }
}, 
{ 
  timestamps: true 
});
module.exports = mongoose.model("Token", tokenSchema);