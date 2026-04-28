const mongoose = require("mongoose");

const leadSchema = new mongoose.Schema(
  {
    customerName: { type: String, required: true, trim: true, maxlength: 120 },
    customerEmail: { type: String, required: true, trim: true, lowercase: true, maxlength: 200 },
    customerPhone: { type: String, required: true, trim: true, maxlength: 40 },
    propertyType: { type: String, required: true, trim: true, maxlength: 80 },
    description: { type: String, trim: true, maxlength: 4000 },
    status: {
      type: String,
      enum: ["new", "contacted", "qualified", "closed"],
      default: "new",
      index: true
    },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", index: true }
  },
  { timestamps: true }
);

module.exports = mongoose.model("Lead", leadSchema);

