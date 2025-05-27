// config/db.js
const mongoose = require("mongoose");

async function connectDB() {
  try {
    const uri = process.env.MONGO_URI;
    if (!uri) throw new Error("❌ MONGO_URI non défini");

    await mongoose.connect(uri);
    console.log("✅ Connexion MongoDB réussie");
  } catch (err) {
    console.error("❌ Erreur MongoDB :", err.message);
  }
}

module.exports = connectDB;
