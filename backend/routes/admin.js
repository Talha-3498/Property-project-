const express = require("express");
const { body, param, validationResult } = require("express-validator");

const { requireAuth, requireAdmin } = require("../middleware/auth");
const { propertyImageUpload } = require("../middleware/upload");
const Order = require("../models/Order");
const Property = require("../models/Property");
const User = require("../models/User");
const SellLead = require("../models/SellLead");
const Lead = require("../models/Lead");
const ContactMessage = require("../models/ContactMessage");

const router = express.Router();

router.get("/users", requireAuth, requireAdmin, async (req, res, next) => {
  try {
    const users = await User.find({})
      .select("_id name email role createdAt")
      .sort({ createdAt: -1 })
      .lean();
    res.json(users);
  } catch (e) {
    next(e);
  }
});

router.put(
  "/users/:id/promote",
  requireAuth,
  requireAdmin,
  [param("id").isMongoId()],
  async (req, res, next) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty())
        return res.status(400).json({ error: "Invalid id" });
      const user = await User.findByIdAndUpdate(
        req.params.id,
        { role: "admin" },
        { new: true },
      ).select("_id name email role");
      if (!user) return res.status(404).json({ error: "User not found" });
      res.json(user);
    } catch (e) {
      next(e);
    }
  },
);

router.get("/sell-leads", requireAuth, requireAdmin, async (req, res, next) => {
  try {
    const leads = await SellLead.find({}).sort({ createdAt: -1 }).lean();
    res.json(leads);
  } catch (e) {
    next(e);
  }
});

router.put(
  "/sell-leads/:id/status",
  requireAuth,
  requireAdmin,
  [
    param("id").isMongoId(),
    body("status").isIn(["new", "contacted", "qualified", "closed"]),
  ],
  async (req, res, next) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty())
        return res
          .status(400)
          .json({ error: "Invalid input", details: errors.array() });
      const updated = await SellLead.findByIdAndUpdate(
        req.params.id,
        { status: req.body.status },
        { new: true },
      );
      if (!updated) return res.status(404).json({ error: "Lead not found" });
      res.json(updated);
    } catch (e) {
      next(e);
    }
  },
);

router.get("/leads", requireAuth, requireAdmin, async (req, res, next) => {
  try {
    const leads = await Lead.find({}).sort({ createdAt: -1 }).lean();
    res.json(leads);
  } catch (e) {
    next(e);
  }
});

router.get(
  "/contact-messages",
  requireAuth,
  requireAdmin,
  async (req, res, next) => {
    try {
      const items = await ContactMessage.find({})
        .sort({ createdAt: -1 })
        .lean();
      res.json(items);
    } catch (e) {
      next(e);
    }
  },
);

router.put(
  "/contact-messages/:id/status",
  requireAuth,
  requireAdmin,
  [param("id").isMongoId(), body("status").isIn(["new", "read", "archived"])],
  async (req, res, next) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty())
        return res
          .status(400)
          .json({ error: "Invalid input", details: errors.array() });
      const updated = await ContactMessage.findByIdAndUpdate(
        req.params.id,
        { status: req.body.status },
        { new: true },
      ).lean();
      if (!updated) return res.status(404).json({ error: "Not found" });
      res.json(updated);
    } catch (e) {
      next(e);
    }
  },
);

router.put(
  "/leads/:id/status",
  requireAuth,
  requireAdmin,
  [
    param("id").isMongoId(),
    body("status").isIn(["new", "contacted", "qualified", "closed"]),
  ],
  async (req, res, next) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty())
        return res
          .status(400)
          .json({ error: "Invalid input", details: errors.array() });
      const updated = await Lead.findByIdAndUpdate(
        req.params.id,
        { status: req.body.status },
        { new: true },
      );
      if (!updated) return res.status(404).json({ error: "Lead not found" });
      res.json(updated);
    } catch (e) {
      next(e);
    }
  },
);

// Orders
router.get("/orders", requireAuth, requireAdmin, async (req, res, next) => {
  try {
    const orders = await Order.find({})
      .populate("propertyId")
      .populate("clientUserId", "name email role")
      .sort({ createdAt: -1 })
      .lean();
    res.json(orders);
  } catch (e) {
    next(e);
  }
});

router.put(
  "/orders/:id/status",
  requireAuth,
  requireAdmin,
  [
    param("id").isMongoId(),
    body("status").isIn(["pending", "confirmed", "completed", "cancelled"]),
  ],
  async (req, res, next) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty())
        return res
          .status(400)
          .json({ error: "Invalid input", details: errors.array() });

      const updated = await Order.findByIdAndUpdate(
        req.params.id,
        { status: req.body.status },
        { new: true },
      )
        .populate("propertyId")
        .populate("clientUserId", "name email role");

      if (!updated) return res.status(404).json({ error: "Order not found" });
      res.json(updated);
    } catch (e) {
      next(e);
    }
  },
);

// Properties
router.get("/properties", requireAuth, requireAdmin, async (req, res, next) => {
  try {
    const properties = await Property.find({})
      .populate("submittedBy", "name email role")
      .populate("approvedBy", "name email role")
      .sort({ createdAt: -1 })
      .lean();
    res.json(properties);
  } catch (e) {
    next(e);
  }
});

router.post(
  "/properties",
  requireAuth,
  requireAdmin,
  propertyImageUpload.single("image"),
  [
    body("title").trim().isLength({ min: 2, max: 140 }),
    body("description").optional().trim().isLength({ max: 4000 }),
    body("price").isFloat({ min: 0 }),
    body("location").trim().isLength({ min: 2, max: 200 }),
    body("type").trim().isLength({ min: 2, max: 50 }),
    body("purpose").isIn(["sale", "rent"]),
    body("bedrooms").optional().isInt({ min: 0, max: 50 }),
    body("bathrooms").optional().isInt({ min: 0, max: 50 }),
    body("area").optional().isFloat({ min: 0 }),
    body("features").optional(),
    body("isFeatured").optional().isBoolean().toBoolean(),
  ],
  async (req, res, next) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res
          .status(400)
          .json({ error: "Invalid input", details: errors.array() });
      }

      const bedrooms = toNumberOrDefault(req.body.bedrooms, 0);
      const bathrooms = toNumberOrDefault(req.body.bathrooms, 0);
      const area = toNumberOrDefault(req.body.area, 0);
      const features = toStringList(req.body.features);
      const images = req.file
        ? [`/uploads/properties/${req.file.filename}`]
        : toStringList(req.body.images);

      const created = await Property.create({
        title: req.body.title,
        description: req.body.description || "",
        price: Number(req.body.price),
        location: req.body.location,
        type: req.body.type,
        purpose: req.body.purpose,
        bedrooms,
        bathrooms,
        area,
        images,
        features,
        isFeatured: Boolean(req.body.isFeatured),
        status: "approved",
        submittedBy: req.user._id,
        approvedBy: req.user._id,
        approvedAt: new Date(),
      });
      res.status(201).json(created);
    } catch (e) {
      next(e);
    }
  },
);

router.put(
  "/properties/:id",
  requireAuth,
  requireAdmin,
  [
    param("id").isMongoId(),
    body("title").optional().trim().isLength({ min: 2, max: 140 }),
    body("description").optional().trim().isLength({ max: 4000 }),
    body("price").optional().isFloat({ min: 0 }),
    body("location").optional().trim().isLength({ min: 2, max: 200 }),
    body("type").optional().trim().isLength({ min: 2, max: 50 }),
    body("purpose").optional().isIn(["sale", "rent"]),
    body("bedrooms").optional().isInt({ min: 0, max: 50 }),
    body("bathrooms").optional().isInt({ min: 0, max: 50 }),
    body("area").optional().isFloat({ min: 0 }),
    body("images").optional().isArray(),
    body("features").optional().isArray(),
    body("isFeatured").optional().isBoolean().toBoolean(),
    body("status").optional().isIn(["pending", "approved", "rejected"]),
  ],
  async (req, res, next) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res
          .status(400)
          .json({ error: "Invalid input", details: errors.array() });
      }

      const patch = {};
      for (const k of [
        "title",
        "description",
        "price",
        "location",
        "type",
        "purpose",
        "bedrooms",
        "bathrooms",
        "area",
        "images",
        "features",
        "isFeatured",
        "status",
      ]) {
        if (typeof req.body[k] !== "undefined") patch[k] = req.body[k];
      }
      if (typeof patch.price !== "undefined") patch.price = Number(patch.price);
      if (typeof patch.area !== "undefined") patch.area = Number(patch.area);
      if (typeof patch.status !== "undefined") {
        if (patch.status === "approved") {
          patch.approvedBy = req.user._id;
          patch.approvedAt = new Date();
        } else {
          patch.approvedBy = null;
          patch.approvedAt = null;
        }
      }

      const updated = await Property.findByIdAndUpdate(req.params.id, patch, {
        new: true,
      });
      if (!updated)
        return res.status(404).json({ error: "Property not found" });
      res.json(updated);
    } catch (e) {
      next(e);
    }
  },
);

router.put(
  "/properties/:id/status",
  requireAuth,
  requireAdmin,
  [
    param("id").isMongoId(),
    body("status").isIn(["pending", "approved", "rejected"]),
  ],
  async (req, res, next) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res
          .status(400)
          .json({ error: "Invalid input", details: errors.array() });
      }

      const patch = { status: req.body.status };
      if (req.body.status === "approved") {
        patch.approvedBy = req.user._id;
        patch.approvedAt = new Date();
      } else {
        patch.approvedBy = null;
        patch.approvedAt = null;
      }

      const updated = await Property.findByIdAndUpdate(req.params.id, patch, {
        new: true,
      })
        .populate("submittedBy", "name email role")
        .populate("approvedBy", "name email role");
      if (!updated)
        return res.status(404).json({ error: "Property not found" });
      res.json(updated);
    } catch (e) {
      next(e);
    }
  },
);

router.delete(
  "/properties/:id",
  requireAuth,
  requireAdmin,
  [param("id").isMongoId()],
  async (req, res, next) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty())
        return res.status(400).json({ error: "Invalid id" });

      const deleted = await Property.findByIdAndDelete(req.params.id);
      if (!deleted)
        return res.status(404).json({ error: "Property not found" });
      res.json({ ok: true });
    } catch (e) {
      next(e);
    }
  },
);

function toStringList(value) {
  if (Array.isArray(value)) {
    return value.map((v) => String(v || "").trim()).filter(Boolean);
  }
  return String(value || "")
    .split(",")
    .map((v) => v.trim())
    .filter(Boolean);
}

function toNumberOrDefault(value, fallback) {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
}

module.exports = router;
