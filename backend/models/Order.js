const mongoose = require("mongoose");

const orderSchema = new mongoose.Schema(
  {
    propertyId: { type: mongoose.Schema.Types.ObjectId, ref: "Property", required: true, index: true },
    clientUserId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    clientName: { type: String, required: true, trim: true, maxlength: 120 },
    clientEmail: { type: String, required: true, trim: true, lowercase: true, maxlength: 200 },
    clientPhone: { type: String, required: true, trim: true, maxlength: 40 },
    message: { type: String, trim: true, maxlength: 1000 },
    orderDate: { type: Date, default: Date.now, index: true },
    status: {
      type: String,
      enum: ["pending", "confirmed", "completed", "cancelled"],
      default: "pending",
      index: true
    },
    totalAmount: { type: Number, required: true, min: 0 }
  },
  { timestamps: true }
);

module.exports = mongoose.model("Order", orderSchema);

