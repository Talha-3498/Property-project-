const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
require("dotenv").config();

const Property = require("../models/Property");
const User = require("../models/User");

const dummyProperties = [
  {
    title: "High Floor | 4 Bed | Beach View",
    description: "Prime location apartment with sea-facing balcony and ready possession.",
    price: 1900000,
    location: "Dubai Marina",
    type: "Apartment",
    purpose: "sale",
    bedrooms: 4,
    bathrooms: 2,
    area: 1574,
    images: ["https://images.unsplash.com/photo-1560185007-c5ca9d2c014d"],
    features: ["AC", "Pool", "Parking"],
    isFeatured: true
  },
  {
    title: "Luxury Villa | Private Pool",
    description: "Spacious villa in a gated community with premium finishing.",
    price: 4200000,
    location: "Palm Jumeirah",
    type: "Villa",
    purpose: "sale",
    bedrooms: 5,
    bathrooms: 6,
    area: 4200,
    images: ["https://images.unsplash.com/photo-1600585154340-be6161a56a0c"],
    features: ["Pool", "Garden", "Parking"],
    isFeatured: true
  },
  {
    title: "Townhouse for Rent | Family Community",
    description: "Modern townhouse close to school, park and shopping.",
    price: 185000,
    location: "Dubai Hills",
    type: "Townhouse",
    purpose: "rent",
    bedrooms: 3,
    bathrooms: 3,
    area: 2100,
    images: ["https://images.unsplash.com/photo-1570129477492-45c003edd2be"],
    features: ["Parking", "Balcony", "Gym"],
    isFeatured: false
  }
];

async function run() {
  if (!process.env.MONGO_URI) throw new Error("MONGO_URI missing in .env");
  await mongoose.connect(process.env.MONGO_URI);

  const existing = await Property.countDocuments();
  if (existing === 0) {
    await Property.insertMany(dummyProperties);
    console.log("Dummy properties inserted.");
  } else {
    console.log("Properties already exist, skipping insert.");
  }

  const adminEmail = "admin@property.com";
  const admin = await User.findOne({ email: adminEmail });
  if (!admin) {
    const passwordHash = await bcrypt.hash("Admin@12345", 12);
    await User.create({
      name: "System Admin",
      email: adminEmail,
      passwordHash,
      role: "admin"
    });
    console.log("Admin created: admin@property.com / Admin@12345");
  } else {
    console.log("Admin already exists.");
  }

  await mongoose.disconnect();
}

run().catch(async (e) => {
  console.error(e);
  try {
    await mongoose.disconnect();
  } catch (_) {
  }
  process.exit(1);
});

