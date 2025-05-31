const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
require('dotenv').config();

// Import des anciens modèles
const Admin = require('../models/Admin');
const Patient = require('../models/Patient');

// Import des nouveaux modèles
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

async function createRoles() {
  console.log('\n🎭 Création des rôles...');
  
  const roles = [
    {
      name: 'patient',
      displayName: 'Patient',
      permissions: ['create_ticket', 'view_queue', 'cancel_ticket'],
      description: 'Patient pouvant prendre et gérer ses tickets'
    },
    {
      name: 'docteur',
      displayName: 'Docteur',
      permissions: ['view_queue', 'call_next', 'finish_consultation', 'reset_queue', 'view_stats'],
      description: 'Médecin pouvant gérer les consultations'
    },
    {
      name: 'secretaire',
      displayName: 'Secrétaire',
      permissions: ['view_queue', 'call_next', 'manage_users', 'view_stats', 'create_ticket'],
      description: 'Secrétaire pouvant gérer la file et les utilisateurs'
    }
  ];

  // Supprimer les rôles existants
  await Role.deleteMany({});
  
  const createdRoles = {};
  for (const roleData of roles) {
    const role = new Role(roleData);
    await role.save();
    createdRoles[roleData.name] = role;
    console.log(`   ✅ Rôle "${roleData.displayName}" créé`);
  }
  
  return createdRoles;
}

async function migrateUsers(roles) {
  console.log('\n👥 Migration des utilisateurs...');
  
  // Supprimer les utilisateurs existants dans la nouvelle collection
  await User.deleteMany({});
  
  let migratedCount = 0;
  
  // Migrer les admins
  const admins = await Admin.find({});
  console.log(`   📋 ${admins.length} admins à migrer...`);
  
  for (const admin of admins) {
    const userData = {
      email: admin.email,
      password: admin.password, // Déjà hashé
      role: roles.docteur._id, // Par défaut, les admins deviennent docteurs
      profile: {
        firstName: 'Dr.',
        lastName: admin.email.split('@')[0]
      },
      isActive: true,
      createdAt: admin.createdAt || new Date(),
      updatedAt: admin.updatedAt || new Date()
    };
    
    const user = new User(userData);
    await user.save();
    migratedCount++;
    console.log(`   ✅ Admin ${admin.email} → Docteur`);
  }
  
  // Migrer les patients
  const patients = await Patient.find({});
  console.log(`   📋 ${patients.length} patients à migrer...`);
  
  for (const patient of patients) {
    const userData = {
      email: patient.email,
      password: patient.password, // Déjà hashé
      role: roles.patient._id,
      profile: {
        firstName: patient.email.split('@')[0],
        lastName: 'Patient'
      },
      isActive: true,
      createdAt: patient.createdAt || new Date(),
      updatedAt: patient.updatedAt || new Date()
    };
    
    const user = new User(userData);
    await user.save();
    migratedCount++;
    console.log(`   ✅ Patient ${patient.email} → Patient`);
  }
  
  return migratedCount;
}

async function createDefaultUsers(roles) {
  console.log('\n👤 Création des utilisateurs par défaut...');
  
  const defaultUsers = [
    {
      email: 'admin@lineup.com',
      password: 'admin123',
      role: roles.docteur._id,
      profile: {
        firstName: 'Dr. Admin',
        lastName: 'Principal'
      }
    },
    {
      email: 'secretaire@lineup.com',
      password: 'secretaire123',
      role: roles.secretaire._id,
      profile: {
        firstName: 'Secrétaire',
        lastName: 'Médicale'
      }
    },
    {
      email: 'patient.test@lineup.com',
      password: 'patient123',
      role: roles.patient._id,
      profile: {
        firstName: 'Patient',
        lastName: 'Test'
      }
    }
  ];
  
  for (const userData of defaultUsers) {
    // Vérifier si l'utilisateur existe déjà
    const existingUser = await User.findOne({ email: userData.email });
    if (!existingUser) {
      userData.password = await bcrypt.hash(userData.password, 10);
      const user = new User(userData);
      await user.save();
      console.log(`   ✅ Utilisateur ${userData.email} créé (${userData.profile.firstName})`);
    } else {
      console.log(`   ⚠️ Utilisateur ${userData.email} existe déjà`);
    }
  }
}

async function cleanupOldCollections() {
  console.log('\n🧹 Nettoyage des anciennes collections...');
  
  const collections = await mongoose.connection.db.listCollections().toArray();
  const collectionNames = collections.map(c => c.name);
  
  if (collectionNames.includes('admins')) {
    await mongoose.connection.db.collection('admins').drop();
    console.log('   ✅ Collection "admins" supprimée');
  }
  
  if (collectionNames.includes('patients')) {
    await mongoose.connection.db.collection('patients').drop();
    console.log('   ✅ Collection "patients" supprimée');
  }
}

async function displayResults() {
  console.log('\n📊 Résultats de la migration :');
  
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
  console.log('   👨‍⚕️ Docteur : admin@lineup.com / admin123');
  console.log('   👩‍💼 Secrétaire : secretaire@lineup.com / secretaire123');
  console.log('   👤 Patient : patient.test@lineup.com / patient123');
}

async function migrate() {
  try {
    console.log('🚀 Début de la migration vers la nouvelle structure...\n');
    
    // 1. Créer les rôles
    const roles = await createRoles();
    
    // 2. Migrer les utilisateurs existants
    const migratedCount = await migrateUsers(roles);
    
    // 3. Créer des utilisateurs par défaut
    await createDefaultUsers(roles);
    
    // 4. Nettoyer les anciennes collections
    await cleanupOldCollections();
    
    // 5. Afficher les résultats
    await displayResults();
    
    console.log('\n🎉 Migration terminée avec succès !');
    console.log(`📈 ${migratedCount} utilisateurs migrés`);
    
  } catch (error) {
    console.error('❌ Erreur lors de la migration :', error);
  } finally {
    mongoose.connection.close();
    console.log('🔚 Connexion fermée');
  }
}

// Exécuter la migration
connectDB().then(() => {
  migrate();
}); 