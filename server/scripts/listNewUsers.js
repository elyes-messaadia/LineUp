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

async function listUsers() {
  try {
    console.log('📋 Liste des utilisateurs (nouvelle structure)\n');
    
    // Récupérer tous les rôles
    const roles = await Role.find({});
    console.log('🎭 Rôles disponibles :');
    roles.forEach(role => {
      console.log(`   - ${role.displayName} (${role.name})`);
      console.log(`     Permissions : ${role.permissions.join(', ')}`);
    });
    
    console.log('\n👥 Utilisateurs par rôle :\n');
    
    // Lister les utilisateurs par rôle
    for (const role of roles) {
      const users = await User.find({ role: role._id }).populate('role');
      console.log(`${role.displayName.toUpperCase()} (${users.length}) :`);
      
      if (users.length === 0) {
        console.log('   Aucun utilisateur');
      } else {
        users.forEach((user, index) => {
          const fullName = user.fullName;
          const lastLogin = user.lastLogin ? 
            new Date(user.lastLogin).toLocaleDateString() : 
            'Jamais connecté';
          
          console.log(`   ${index + 1}. ${user.email}`);
          console.log(`      Nom : ${fullName}`);
          console.log(`      Dernière connexion : ${lastLogin}`);
          console.log(`      Actif : ${user.isActive ? 'Oui' : 'Non'}`);
          console.log(`      ID : ${user._id}`);
          console.log('');
        });
      }
    }
    
    // Statistiques globales
    const totalUsers = await User.countDocuments();
    const activeUsers = await User.countDocuments({ isActive: true });
    
    console.log('📊 Statistiques :');
    console.log(`   Total utilisateurs : ${totalUsers}`);
    console.log(`   Utilisateurs actifs : ${activeUsers}`);
    console.log(`   Utilisateurs inactifs : ${totalUsers - activeUsers}`);
    
    // Comptes de test
    console.log('\n🔑 Comptes de test disponibles :');
    const testAccounts = [
      { email: 'admin@lineup.com', password: 'admin123', role: 'Docteur' },
      { email: 'secretaire@lineup.com', password: 'secretaire123', role: 'Secrétaire' },
      { email: 'patient.test@lineup.com', password: 'patient123', role: 'Patient' }
    ];
    
    for (const account of testAccounts) {
      const user = await User.findOne({ email: account.email }).populate('role');
      if (user) {
        console.log(`   ${account.role} : ${account.email} / ${account.password} ✅`);
      } else {
        console.log(`   ${account.role} : ${account.email} / ${account.password} ❌ (non trouvé)`);
      }
    }
    
  } catch (error) {
    console.error('❌ Erreur lors de la récupération :', error.message);
  } finally {
    mongoose.connection.close();
    console.log('\n🔚 Connexion fermée');
  }
}

// Exécuter le script
connectDB().then(() => {
  listUsers();
}); 