const express = require("express");
const { query, param, body, validationResult } = require("express-validator");

const Property = require("../models/Property");
const { requireAuth } = require("../middleware/auth");
const { propertyImageUpload } = require("../middleware/upload");

const router = express.Router();

router.get(
  "/",
  [
    query("purpose").optional().isIn(["sale", "rent"]),
    query("type").optional().isString().trim().isLength({ min: 1, max: 50 }),
    query("location")
      .optional()
      .isString()
      .trim()
      .isLength({ min: 1, max: 200 }),
    query("minPrice").optional().isFloat({ min: 0 }),
    query("maxPrice").optional().isFloat({ min: 0 }),
    query("bedrooms").optional().isInt({ min: 0, max: 50 }),
    query("bathrooms").optional().isInt({ min: 0, max: 50 }),
    query("minArea").optional().isFloat({ min: 0 }),
    query("maxArea").optional().isFloat({ min: 0 }),
    query("feature").optional().isString().trim().isLength({ min: 1, max: 60 }),
    query("isFeatured").optional().isBoolean().toBoolean(),
  ],
  async (req, res, next) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res
          .status(400)
          .json({ error: "Invalid query", details: errors.array() });
      }

      const filter = { status: "approved" };
      const {
        purpose,
        type,
        location,
        minPrice,
        maxPrice,
        bedrooms,
        bathrooms,
        minArea,
        maxArea,
        feature,
        isFeatured,
      } = req.query;
      if (purpose) filter.purpose = purpose;
      if (type) filter.type = new RegExp(`^${escapeRegExp(type)}$`, "i");
      if (location) filter.location = new RegExp(escapeRegExp(location), "i");
      if (typeof isFeatured !== "undefined")
        filter.isFeatured = isFeatured === true || isFeatured === "true";
      if (bedrooms) filter.bedrooms = Number(bedrooms);
      if (bathrooms) filter.bathrooms = Number(bathrooms);
      if (feature)
        filter.features = {
          $in: [new RegExp(`^${escapeRegExp(feature)}$`, "i")],
        };

      if (minPrice || maxPrice) {
        filter.price = {};
        if (minPrice) filter.price.$gte = Number(minPrice);
        if (maxPrice) filter.price.$lte = Number(maxPrice);
      }
      if (minArea || maxArea) {
        filter.area = {};
        if (minArea) filter.area.$gte = Number(minArea);
        if (maxArea) filter.area.$lte = Number(maxArea);
      }

      const properties = await Property.find(filter)
        .sort({ isFeatured: -1, createdAt: -1 })
        .lean();
      res.json(properties);
    } catch (e) {
      next(e);
    }
  },
);

router.get("/my/submissions", requireAuth, async (req, res, next) => {
  try {
    const items = await Property.find({ submittedBy: req.user._id })
      .sort({ createdAt: -1 })
      .lean();
    res.json(items);
  } catch (e) {
    next(e);
  }
});

router.post(
  "/submit",
  requireAuth,
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
        isFeatured: false,
        status: "pending",
        submittedBy: req.user._id,
      });

      res.status(201).json({
        message: "Property submitted for admin review.",
        property: created,
      });
    } catch (e) {
      next(e);
    }
  },
);

router.get("/:id", [param("id").isMongoId()], async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ error: "Invalid id" });

    const prop = await Property.findOne({
      _id: req.params.id,
      status: "approved",
    }).lean();
    if (!prop) return res.status(404).json({ error: "Not found" });
    res.json(prop);
  } catch (e) {
    next(e);
  }
});

function escapeRegExp(s) {
  return String(s).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

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
