console.log("SERVER.JS STARTING UP...");
const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");
const morgan = require("morgan");
const mongoose = require("mongoose");
const path = require("path");

require("dotenv").config();

const authRoutes = require("./routes/auth");
const propertyRoutes = require("./routes/properties");
const orderRoutes = require("./routes/orders");
const adminRoutes = require("./routes/admin");
const sellRoutes = require("./routes/sell");
const leadsRoutes = require("./routes/leads");
const contactRoutes = require("./routes/contact");

const app = express();
console.log("Express app initialized");

app.use(cors());
app.options("*", cors());
console.log("CORS configured");

app.set("trust proxy", 1);

app.use(
  helmet({
    crossOriginResourcePolicy: false,
  }),
);

app.use(express.json({ limit: "1mb" }));
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

app.use(
  rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 300,
    standardHeaders: "draft-7",
    legacyHeaders: false,
  }),
);

if (process.env.NODE_ENV !== "production") {
  app.use(morgan("dev"));
}

app.get("/api/health", (req, res) => {
  res.json({ ok: true });
});

app.use("/api", authRoutes);
app.use("/api/properties", propertyRoutes);
app.use("/api/orders", orderRoutes);
app.use("/api/leads", leadsRoutes);
app.use("/api/contact", contactRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/sell-leads", sellRoutes);

// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
  const status = err.statusCode || 500;
  const message =
    process.env.NODE_ENV === "production"
      ? "Server error"
      : err.message || "Server error";
  res.status(status).json({ error: message });
});

async function start() {
  const port = Number(process.env.PORT || 5000);
  console.log(`Starting server on port ${port}...`);

  app.listen(port, () => {
    console.log(`Server successfully listening on port ${port}`);
  });

  const mongoUri = process.env.MONGO_URI;
  if (!mongoUri) {
    console.error("MONGO_URI is missing! DB features will not work.");
  }

  mongoose.set("strictQuery", true);

  if (mongoUri) {
    mongoose.connect(mongoUri)
      .then(() => console.log("Connected to MongoDB Atlas successfully"))
      .catch((err) => console.error("Failed to connect to MongoDB Atlas", err));
  }
}

start().catch((e) => {
  // eslint-disable-next-line no-console
  console.error(e);
  process.exit(1);
});
