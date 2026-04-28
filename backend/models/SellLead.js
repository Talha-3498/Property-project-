const mongoose = require("mongoose");

const sellLeadSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true, maxlength: 120 },
    email: { type: String, required: true, trim: true, lowercase: true, maxlength: 200 },
    phone: { type: String, required: true, trim: true, maxlength: 40 },
    city: { type: String, required: true, trim: true, maxlength: 120 },
    propertyDetails: { type: String, trim: true, maxlength: 4000 },
    status: {
      type: String,
      enum: ["new", "contacted", "qualified", "closed"],
      default: "new",
      index: true
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model("SellLead", sellLeadSchema);

