const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
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

async function updateRoles() {
  try {
    console.log('🎭 Mise à jour des rôles vers la nouvelle structure...\n');
    
    // Supprimer tous les anciens rôles
    await Role.deleteMany({});
    console.log('🧹 Anciens rôles supprimés');
    
    // Créer les nouveaux rôles
    const newRoles = [
      {
        name: 'visiteur',
        displayName: 'Visiteur',
        permissions: ['view_queue'],
        description: 'Visiteur pouvant seulement consulter la file d\'attente'
      },
      {
        name: 'patient',
        displayName: 'Patient',
        permissions: ['create_ticket', 'view_queue', 'cancel_ticket'],
        description: 'Patient pouvant prendre et gérer ses tickets'
      },
      {
        name: 'secretaire',
        displayName: 'Secrétaire',
        permissions: ['view_queue', 'call_next', 'manage_users', 'view_stats', 'create_ticket'],
        description: 'Secrétaire pouvant gérer la file et les utilisateurs'
      },
      {
        name: 'medecin',
        displayName: 'Médecin',
        permissions: ['view_queue', 'call_next', 'finish_consultation', 'reset_queue', 'view_stats'],
        description: 'Médecin pouvant gérer les consultations'
      }
    ];
    
    const createdRoles = {};
    for (const roleData of newRoles) {
      const role = new Role(roleData);
      await role.save();
      createdRoles[roleData.name] = role;
      console.log(`   ✅ Rôle "${roleData.displayName}" créé`);
    }
    
    return createdRoles;
  } catch (error) {
    console.error('❌ Erreur lors de la création des rôles :', error);
    throw error;
  }
}

async function updateUsers(roles) {
  try {
    console.log('\n👥 Mise à jour des utilisateurs existants...');
    
    // Récupérer les utilisateurs existants
    const existingUsers = await User.find({});
    console.log(`📋 ${existingUsers.length} utilisateurs à mettre à jour`);
    
    // Mapping des anciens rôles vers les nouveaux
    const roleMapping = {
      'admin@lineup.com': 'medecin',
      'secretaire@lineup.com': 'secretaire',
      'patient.test@lineup.com': 'patient'
    };
    
    for (const user of existingUsers) {
      const newRoleName = roleMapping[user.email];
      if (newRoleName && roles[newRoleName]) {
        user.role = roles[newRoleName]._id;
        await user.save();
        console.log(`   ✅ ${user.email} → ${roles[newRoleName].displayName}`);
      } else {
        console.log(`   ⚠️ ${user.email} → Rôle non défini, suppression...`);
        await User.findByIdAndDelete(user._id);
      }
    }
  } catch (error) {
    console.error('❌ Erreur lors de la mise à jour des utilisateurs :', error);
    throw error;
  }
}

async function createCleanUsers(roles) {
  try {
    console.log('\n👤 Création des utilisateurs propres...');
    
    // Supprimer tous les utilisateurs existants
    await User.deleteMany({});
    console.log('🧹 Anciens utilisateurs supprimés');
    
    const cleanUsers = [
      {
        email: 'medecin@lineup.com',
        password: 'medecin123',
        role: roles.medecin._id,
        profile: {
          firstName: 'Dr. Jean',
          lastName: 'Dupont'
        }
      },
      {
        email: 'secretaire@lineup.com',
        password: 'secretaire123',
        role: roles.secretaire._id,
        profile: {
          firstName: 'Marie',
          lastName: 'Martin'
        }
      },
      {
        email: 'patient@lineup.com',
        password: 'patient123',
        role: roles.patient._id,
        profile: {
          firstName: 'Pierre',
          lastName: 'Durand'
        }
      },
      {
        email: 'visiteur@lineup.com',
        password: 'visiteur123',
        role: roles.visiteur._id,
        profile: {
          firstName: 'Visiteur',
          lastName: 'Test'
        }
      }
    ];
    
    for (const userData of cleanUsers) {
      userData.password = await bcrypt.hash(userData.password, 10);
      const user = new User(userData);
      await user.save();
      console.log(`   ✅ ${userData.email} créé (${userData.profile.firstName} ${userData.profile.lastName})`);
    }
  } catch (error) {
    console.error('❌ Erreur lors de la création des utilisateurs :', error);
    throw error;
  }
}

async function displayResults() {
  try {
    console.log('\n📊 Résultats de la mise à jour :');
    
    const roles = await Role.find({});
    console.log(`   🎭 Rôles : ${roles.length}`);
    roles.forEach(role => {
      console.log(`      - ${role.displayName} (${role.permissions.length} permissions)`);
    });
    
    const users = await User.find({}).populate('role');
    console.log(`   👥 Utilisateurs : ${users.length}`);
    
    const usersByRole = {};
    users.forEach(user => {
      const roleName = user.role.displayName;
      usersByRole[roleName] = (usersByRole[roleName] || 0) + 1;
    });
    
    Object.entries(usersByRole).forEach(([role, count]) => {
      console.log(`      - ${role} : ${count}`);
    });
    
    console.log('\n🔑 Comptes de test disponibles :');
    console.log('   👨‍⚕️ Médecin : medecin@lineup.com / medecin123');
    console.log('   👩‍💼 Secrétaire : secretaire@lineup.com / secretaire123');
    console.log('   👤 Patient : patient@lineup.com / patient123');
    console.log('   👁️ Visiteur : visiteur@lineup.com / visiteur123');
    
    console.log('\n📋 Détail des utilisateurs :');
    users.forEach(user => {
      console.log(`   ${user.role.displayName} : ${user.email} - ${user.fullName}`);
    });
    
  } catch (error) {
    console.error('❌ Erreur lors de l\'affichage :', error);
  }
}

async function updateToNewStructure() {
  try {
    console.log('🚀 Mise à jour vers la nouvelle structure de rôles...\n');
    
    // 1. Créer les nouveaux rôles
    const roles = await updateRoles();
    
    // 2. Créer des utilisateurs propres
    await createCleanUsers(roles);
    
    // 3. Afficher les résultats
    await displayResults();
    
    console.log('\n🎉 Mise à jour terminée avec succès !');
    
  } catch (error) {
    console.error('❌ Erreur lors de la mise à jour :', error);
  } finally {
    mongoose.connection.close();
    console.log('🔚 Connexion fermée');
  }
}

// Exécuter la mise à jour
connectDB().then(() => {
  updateToNewStructure();
}); 