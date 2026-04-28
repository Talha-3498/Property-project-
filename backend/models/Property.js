const mongoose = require("mongoose");

const propertySchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true, maxlength: 140 },
    description: { type: String, trim: true, maxlength: 4000 },
    price: { type: Number, required: true, min: 0 },
    location: { type: String, required: true, trim: true, maxlength: 200 },
    type: { type: String, required: true, trim: true, maxlength: 50 },
    purpose: {
      type: String,
      enum: ["sale", "rent"],
      required: true,
      index: true,
    },
    bedrooms: { type: Number, min: 0, max: 50, default: 0 },
    bathrooms: { type: Number, min: 0, max: 50, default: 0 },
    area: { type: Number, min: 0, default: 0 },
    images: [{ type: String, trim: true }],
    features: [{ type: String, trim: true, maxlength: 60 }],
    isFeatured: { type: Boolean, default: false, index: true },
    status: {
      type: String,
      enum: ["pending", "approved", "rejected"],
      default: "approved",
      index: true,
    },
    submittedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      index: true,
    },
    approvedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    approvedAt: { type: Date },
  },
  { timestamps: true },
);

module.exports = mongoose.model("Property", propertySchema);
