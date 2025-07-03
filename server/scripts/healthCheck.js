const mongoose = require('mongoose');
require('dotenv').config();

async function healthCheck() {
  console.log('🏥 === VÉRIFICATION SANTÉ LINEUP ===\n');

  // 1. Variables d'environnement
  console.log('📋 Variables d\'environnement:');
  const envChecks = {
    'NODE_ENV': process.env.NODE_ENV || 'non défini',
    'PORT': process.env.PORT || '5000 (défaut)',
    'MONGODB_URI': process.env.MONGODB_URI ? '✅ Configuré' : '❌ Manquant',
    'JWT_SECRET': process.env.JWT_SECRET ? '✅ Configuré' : '❌ Manquant'
  };

  Object.entries(envChecks).forEach(([key, value]) => {
    console.log(`   ${key}: ${value}`);
  });

  // 2. Connexion MongoDB
  console.log('\n🗄️ Base de données:');
  try {
    if (!process.env.MONGODB_URI) {
      console.log('   ❌ MONGODB_URI non configuré');
      return;
    }

    await mongoose.connect(process.env.MONGODB_URI);
    console.log('   ✅ Connexion MongoDB réussie');

    // 3. Vérification des collections
    const collections = await mongoose.connection.db.listCollections().toArray();
    console.log(`   📊 Collections trouvées: ${collections.length}`);
    collections.forEach(col => {
      console.log(`      - ${col.name}`);
    });

    // 4. Statistiques des données
    const stats = await Promise.all([
      mongoose.connection.db.collection('users').countDocuments(),
      mongoose.connection.db.collection('tickets').countDocuments(),
      mongoose.connection.db.collection('roles').countDocuments()
    ]);

    console.log('\n📈 Statistiques:');
    console.log(`   👥 Utilisateurs: ${stats[0]}`);
    console.log(`   🎫 Tickets: ${stats[1]}`);
    console.log(`   🔐 Rôles: ${stats[2]}`);

    // 5. Vérification des index
    const ticketIndexes = await mongoose.connection.db.collection('tickets').indexes();
    console.log(`\n🗂️ Index tickets: ${ticketIndexes.length}`);

  } catch (error) {
    console.log(`   ❌ Erreur MongoDB: ${error.message}`);
  } finally {
    await mongoose.disconnect();
  }

  // 6. Recommandations
  console.log('\n💡 Recommandations:');
  if (!process.env.JWT_SECRET) {
    console.log('   ⚠️ Configurez JWT_SECRET pour la sécurité');
  }
  if (!process.env.MONGODB_URI) {
    console.log('   ⚠️ Configurez MONGODB_URI pour la base de données');
  }
  if (process.env.NODE_ENV !== 'production') {
    console.log('   ℹ️ En mode développement');
  }

  console.log('\n✅ Vérification terminée');
}

// Exécuter si appelé directement
if (require.main === module) {
  healthCheck().catch(console.error);
}

module.exports = healthCheck; 