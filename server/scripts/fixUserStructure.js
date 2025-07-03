/* eslint-env node */
const mongoose = require('mongoose');
require('dotenv').config();

const User = require('../models/User');

async function fixUserStructure() {
  try {
    console.log('🔧 Correction de la structure des utilisateurs...\n');

    // Connecter à MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/lineup');
    console.log('✅ Connecté à MongoDB');

    // Trouver tous les utilisateurs
    const users = await User.find({});
    console.log(`📊 ${users.length} utilisateurs trouvés\n`);

    let corrected = 0;
    let alreadyCorrect = 0;

    for (const user of users) {
      // Vérifier si l'utilisateur a des données à la racine qui devraient être dans profile
      const needsCorrection = (user.firstName || user.lastName || user.phone) && 
                              (!user.profile || !user.profile.firstName);

      if (needsCorrection) {
        console.log(`🔧 Correction de: ${user.email}`);
        
        // Créer ou mettre à jour le profile
        if (!user.profile) {
          user.profile = {};
        }

        // Migrer les données si elles existent à la racine
        if (user.firstName && !user.profile.firstName) {
          user.profile.firstName = user.firstName;
          user.firstName = undefined; // Supprimer de la racine
        }

        if (user.lastName && !user.profile.lastName) {
          user.profile.lastName = user.lastName;
          user.lastName = undefined; // Supprimer de la racine
        }

        if (user.phone && !user.profile.phone) {
          user.profile.phone = user.phone;
          user.phone = undefined; // Supprimer de la racine
        }

        // Nettoyer les propriétés non définies
        user.markModified('profile');
        
        await user.save();
        console.log(`   ✅ ${user.profile.firstName} ${user.profile.lastName}`);
        corrected++;
        
      } else if (user.profile?.firstName || user.profile?.lastName) {
        console.log(`✅ Déjà correct: ${user.email} (${user.profile.firstName} ${user.profile.lastName})`);
        alreadyCorrect++;
      } else {
        console.log(`⚠️ Pas de nom: ${user.email}`);
        alreadyCorrect++;
      }
    }

    console.log(`\n📊 Résumé:`);
    console.log(`   ✅ Utilisateurs corrigés: ${corrected}`);
    console.log(`   ✅ Déjà corrects: ${alreadyCorrect}`);
    console.log(`   📊 Total traité: ${corrected + alreadyCorrect}`);

    // Vérification finale
    console.log('\n🔍 Vérification finale...');
    const updatedUsers = await User.find({});
    for (const user of updatedUsers) {
      await user.populate('role');
      console.log(`   ${user.email}: ${user.fullName} (${user.role?.name || 'no role'})`);
    }

  } catch (error) {
    console.error('❌ Erreur:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\n👋 Déconnecté de MongoDB');
  }
}

// Exécuter le script
fixUserStructure().then(() => {
  console.log('✅ Script terminé');
  process.exit(0);
}).catch(error => {
  console.error('❌ Erreur fatale:', error);
  process.exit(1);
}); 