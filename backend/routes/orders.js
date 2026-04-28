const express = require("express");
const { body, validationResult } = require("express-validator");

const { requireAuth } = require("../middleware/auth");
const Order = require("../models/Order");
const Property = require("../models/Property");

const router = express.Router();

router.post(
  "/",
  requireAuth,
  [
    body("propertyId").isMongoId(),
    body("clientName").trim().isLength({ min: 2, max: 120 }),
    body("clientEmail").isEmail().normalizeEmail(),
    body("clientPhone").trim().isLength({ min: 5, max: 40 }),
    body("message").optional().trim().isLength({ max: 1000 })
  ],
  async (req, res, next) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ error: "Invalid input", details: errors.array() });
      }

      const { propertyId, clientName, clientEmail, clientPhone, message } = req.body;
      const prop = await Property.findById(propertyId).select("_id price title");
      if (!prop) return res.status(404).json({ error: "Property not found" });

      const order = await Order.create({
        propertyId: prop._id,
        clientUserId: req.user._id,
        clientName,
        clientEmail,
        clientPhone,
        message: message || "",
        totalAmount: prop.price,
        status: "pending"
      });

      res.status(201).json(order);
    } catch (e) {
      next(e);
    }
  }
);

router.get("/", requireAuth, async (req, res, next) => {
  try {
    const orders = await Order.find({ clientUserId: req.user._id })
      .populate("propertyId")
      .sort({ createdAt: -1 })
      .lean();
    res.json(orders);
  } catch (e) {
    next(e);
  }
});

module.exports = router;

