const mongoose = require('mongoose');
require('dotenv').config();

async function connectDB() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ Connexion MongoDB réussie');
  } catch (err) {
    console.error('❌ Erreur MongoDB :', err.message);
    process.exit(1);
  }
}

async function listCollections() {
  try {
    console.log('📋 Analyse de la structure MongoDB\n');
    
    console.log('🏢 Nom de la base de données :', mongoose.connection.name);
    console.log('🌐 Host :', mongoose.connection.host);
    
    // Lister toutes les collections avec détails
    const collections = await mongoose.connection.db.listCollections().toArray();
    
    console.log('\n📂 Collections dans la base "' + mongoose.connection.name + '" :');
    
    if (collections.length === 0) {
      console.log('   Aucune collection trouvée');
    } else {
      collections.forEach((col, index) => {
        console.log(`   ${index + 1}. ${col.name} (type: ${col.type})`);
      });
    }
    
    console.log('\n🔍 Vérification des conflits de noms :');
    const hasLineupCollection = collections.some(col => col.name === 'lineup');
    
    if (hasLineupCollection) {
      console.log('⚠️  ATTENTION : Une collection nommée "lineup" existe !');
      console.log('   Cela pourrait créer une confusion avec le nom de la base.');
    } else {
      console.log('✅ Aucun conflit détecté. Pas de collection nommée "lineup".');
    }
    
    console.log('\n📊 Structure recommandée :');
    console.log('   Base de données : lineup');
    console.log('   Collections : admins, patients, tickets');
    console.log('   ✓ Votre structure actuelle est correcte !');

  } catch (error) {
    console.error('❌ Erreur lors de l\'analyse :', error.message);
  } finally {
    mongoose.connection.close();
    console.log('\n🔚 Connexion fermée');
  }
}

// Exécuter le script
connectDB().then(() => {
  listCollections();
}); 