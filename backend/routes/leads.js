const express = require("express");
const jwt = require("jsonwebtoken");
const { body, validationResult } = require("express-validator");

const Lead = require("../models/Lead");
const { requireAuth } = require("../middleware/auth");

const router = express.Router();

function decodeOptionalUserId(req) {
  try {
    const header = req.headers.authorization || "";
    const [scheme, token] = header.split(" ");
    if (scheme !== "Bearer" || !token) return null;
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    return payload.sub || null;
  } catch (_) {
    return null;
  }
}

router.post(
  "/",
  [
    body("name").trim().isLength({ min: 2, max: 120 }),
    body("email").isEmail().normalizeEmail(),
    body("phone").trim().isLength({ min: 5, max: 40 }),
    body("property_type").trim().isLength({ min: 2, max: 80 }),
    body("description").optional().trim().isLength({ max: 4000 })
  ],
  async (req, res, next) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) return res.status(400).json({ error: "Invalid input", details: errors.array() });

      const userId = decodeOptionalUserId(req);
      const lead = await Lead.create({
        customerName: req.body.name,
        customerEmail: req.body.email,
        customerPhone: req.body.phone,
        propertyType: req.body.property_type,
        description: req.body.description || "",
        userId: userId || undefined
      });
      res.status(201).json(lead);
    } catch (e) {
      next(e);
    }
  }
);

router.get("/", requireAuth, async (req, res, next) => {
  try {
    const leads = await Lead.find({
      $or: [{ userId: req.user._id }, { customerEmail: req.user.email }]
    })
      .sort({ createdAt: -1 })
      .lean();
    res.json(leads);
  } catch (e) {
    next(e);
  }
});

module.exports = router;

