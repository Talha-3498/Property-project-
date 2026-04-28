const express = require("express");
const { body, validationResult } = require("express-validator");

const SellLead = require("../models/SellLead");

const router = express.Router();

router.post(
  "/",
  [
    body("name").trim().isLength({ min: 2, max: 120 }),
    body("email").isEmail().normalizeEmail(),
    body("phone").trim().isLength({ min: 5, max: 40 }),
    body("city").trim().isLength({ min: 2, max: 120 }),
    body("propertyDetails").optional().trim().isLength({ max: 4000 })
  ],
  async (req, res, next) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ error: "Invalid input", details: errors.array() });
      }

      const lead = await SellLead.create({
        name: req.body.name,
        email: req.body.email,
        phone: req.body.phone,
        city: req.body.city,
        propertyDetails: req.body.propertyDetails || ""
      });

      res.status(201).json(lead);
    } catch (e) {
      next(e);
    }
  }
);

module.exports = router;

