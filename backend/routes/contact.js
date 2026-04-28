const express = require("express");
const { body, validationResult } = require("express-validator");

const ContactMessage = require("../models/ContactMessage");

const router = express.Router();

router.post(
  "/",
  [
    body("firstName").trim().isLength({ min: 1, max: 80 }),
    body("lastName").trim().isLength({ min: 1, max: 80 }),
    body("email").isEmail().normalizeEmail(),
    body("phone").trim().isLength({ min: 5, max: 40 }),
    body("message").trim().isLength({ min: 1, max: 5000 })
  ],
  async (req, res, next) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ error: "Invalid input", details: errors.array() });
      }

      const doc = await ContactMessage.create({
        firstName: req.body.firstName,
        lastName: req.body.lastName,
        email: req.body.email,
        phone: req.body.phone,
        message: req.body.message
      });
      res.status(201).json({ ok: true, id: doc._id });
    } catch (e) {
      next(e);
    }
  }
);

module.exports = router;
