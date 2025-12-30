const mongoose = require("mongoose");
require("dotenv").config();

async function connectDB() {
  try {
    const mongoUri = process.env.MONGO_URI || process.env.MONGODB_URI;
    await mongoose.connect(mongoUri);
    console.log("✅ Connexion MongoDB réussie");
  } catch (err) {
    console.error("❌ Erreur MongoDB :", err.message);
  }
}

module.exports = connectDB;
