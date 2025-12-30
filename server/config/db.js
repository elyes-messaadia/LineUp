const mongoose = require("mongoose");
require("dotenv").config();

async function connectDB() {
  try {
    const mongoUri = process.env.MONGO_URI || process.env.MONGODB_URI;
    
    if (!mongoUri) {
      console.error("❌ Aucune URI MongoDB trouvée (MONGO_URI ou MONGODB_URI)");
      console.log("⚠️ Le serveur démarrera sans base de données");
      return false;
    }
    
    await mongoose.connect(mongoUri);
    console.log("✅ Connexion MongoDB réussie");
    return true;
  } catch (err) {
    console.error("❌ Erreur MongoDB :", err.message);
    console.log("⚠️ Le serveur continue sans base de données");
    return false;
  }
}

module.exports = connectDB;
