const mongoose = require('mongoose');
require('dotenv').config();

const User = require('../models/User');
const Role = require('../models/Role');

async function connectDB() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ Connexion MongoDB réussie');
  } catch (err) {
    console.error('❌ Erreur MongoDB :', err.message);
    process.exit(1);
  }
}

async function cleanupUsers() {
  try {
    console.log('🧹 Nettoyage des anciens comptes...\n');
    
    // Lister les utilisateurs avant nettoyage
    const usersBefore = await User.find({}).populate('role');
    console.log(`📊 Utilisateurs avant nettoyage : ${usersBefore.length}`);
    
    // Comptes à GARDER (les nouveaux comptes propres)
    const accountsToKeep = [
      'admin@lineup.com',
      'secretaire@lineup.com', 
      'patient.test@lineup.com'
    ];
    
    console.log('\n🔒 Comptes à GARDER :');
    accountsToKeep.forEach(email => {
      console.log(`   ✅ ${email}`);
    });
    
    // Comptes à SUPPRIMER (tous les autres)
    const usersToDelete = await User.find({ 
      email: { $nin: accountsToKeep } 
    }).populate('role');
    
    console.log('\n🗑️ Comptes à SUPPRIMER :');
    if (usersToDelete.length === 0) {
      console.log('   Aucun compte à supprimer');
    } else {
      usersToDelete.forEach(user => {
        console.log(`   ❌ ${user.email} (${user.role.displayName})`);
      });
    }
    
    // Demander confirmation
    console.log(`\n⚠️ ATTENTION : ${usersToDelete.length} comptes vont être supprimés !`);
    console.log('Les comptes suivants seront CONSERVÉS :');
    
    const keptUsers = await User.find({ 
      email: { $in: accountsToKeep } 
    }).populate('role');
    
    keptUsers.forEach(user => {
      console.log(`   ✅ ${user.email} (${user.role.displayName})`);
    });
    
    // Supprimer les anciens comptes
    const deleteResult = await User.deleteMany({ 
      email: { $nin: accountsToKeep } 
    });
    
    console.log(`\n🎉 Nettoyage terminé !`);
    console.log(`   📈 ${deleteResult.deletedCount} comptes supprimés`);
    console.log(`   ✅ ${keptUsers.length} comptes conservés`);
    
    // Afficher le résultat final
    console.log('\n📋 Comptes finaux :');
    const finalUsers = await User.find({}).populate('role');
    finalUsers.forEach(user => {
      console.log(`   👤 ${user.email} (${user.role.displayName}) - ${user.fullName}`);
    });
    
    console.log('\n🔑 Identifiants de connexion :');
    console.log('   👨‍⚕️ Docteur : admin@lineup.com / admin123');
    console.log('   👩‍💼 Secrétaire : secretaire@lineup.com / secretaire123');
    console.log('   👤 Patient : patient.test@lineup.com / patient123');
    
  } catch (error) {
    console.error('❌ Erreur lors du nettoyage :', error.message);
  } finally {
    mongoose.connection.close();
    console.log('\n🔚 Connexion fermée');
  }
}

// Exécuter le nettoyage
connectDB().then(() => {
  cleanupUsers();
}); 