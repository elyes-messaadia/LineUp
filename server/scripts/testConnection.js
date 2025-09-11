const mongoose = require('mongoose');
require('dotenv').config();

async function testConnection() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ Connexion MongoDB réussie');
    await mongoose.connection.close();
    console.log('Connection fermée');
  } catch (err) {
    console.error('❌ Erreur MongoDB:', err.message);
  }
}

testConnection();