const mongoose = require("mongoose");

const connectDB = async () => {
  try {
    const uri = process.env.MONGO_URI;
    if (!uri) {
      throw new Error("⚠️ MONGO_URI est vide !");
    }

    await mongoose.connect(uri);
    console.log("✅ Connexion MongoDB réussie");
  } catch (err) {
    console.error("❌ Erreur MongoDB :", err.message);
  }
};

module.exports = connectDB;
