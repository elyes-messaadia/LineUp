const mongoose = require('mongoose');
require('dotenv').config();

async function checkDeployment() {
  console.log('\n🚀 Vérification du déploiement\n');
  
  // Vérification des variables d'environnement
  console.log('📋 Variables d\'environnement :');
  console.log('   NODE_ENV:', process.env.NODE_ENV);
  console.log('   PORT:', process.env.PORT);
  console.log('   MONGO_URI:', process.env.MONGO_URI ? '✅ Configuré' : '❌ Non configuré');

  // Vérification de la connexion MongoDB
  try {
    console.log('\n🔌 Test de connexion MongoDB...');
    await mongoose.connect(process.env.MONGO_URI);
    console.log('   ✅ Connexion réussie');
    console.log('   📊 Base:', mongoose.connection.name);
    console.log('   🌐 Host:', mongoose.connection.host);
  } catch (err) {
    console.error('   ❌ Erreur de connexion:', err.message);
  }

  // Vérification du serveur Express
  try {
    console.log('\n🌐 Test du serveur Express...');
    const response = await fetch('http://localhost:' + (process.env.PORT || 5000) + '/health');
    if (response.ok) {
      console.log('   ✅ Serveur en ligne');
    } else {
      console.log('   ❌ Serveur hors ligne');
    }
  } catch (err) {
    console.error('   ❌ Erreur serveur:', err.message);
  }

  // Fermeture de la connexion
  await mongoose.connection.close();
  process.exit();
}

checkDeployment(); 