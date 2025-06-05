const mongoose = require('mongoose');
const User = require('../models/User');
const Role = require('../models/Role');

async function debugUserData() {
  try {
    console.log('🔍 Debug des données utilisateur...\n');

    // Connexion à MongoDB
    await mongoose.connect('mongodb://localhost:27017/lineup', {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
    console.log('✅ Connecté à MongoDB\n');

    // 1. Vérifier la connexion
    const collections = await mongoose.connection.db.listCollections().toArray();
    console.log('📊 Collections disponibles:');
    collections.forEach(col => console.log(`   - ${col.name}`));
    console.log('');

    // 2. Compter les utilisateurs
    const userCount = await User.countDocuments();
    console.log(`👥 Nombre d'utilisateurs: ${userCount}\n`);

    // 3. Lister tous les utilisateurs avec détails
    const users = await User.find({}).populate('role').limit(10);
    console.log('👤 Utilisateurs trouvés:');
    
    if (users.length === 0) {
      console.log('   ❌ Aucun utilisateur trouvé!');
      console.log('   🔧 Création d\'un utilisateur de test...\n');
      
      // Vérifier/créer les rôles
      const roles = ['patient', 'medecin', 'secretaire', 'visiteur'];
      for (const roleName of roles) {
        let role = await Role.findOne({ name: roleName });
        if (!role) {
          const roleConfig = {
            patient: { displayName: 'Patient', permissions: ['create_ticket', 'view_queue'] },
            medecin: { displayName: 'Médecin', permissions: ['view_queue', 'call_next', 'finish_consultation'] },
            secretaire: { displayName: 'Secrétaire', permissions: ['view_queue', 'call_next', 'cancel_ticket'] },
            visiteur: { displayName: 'Visiteur', permissions: ['view_queue'] }
          };
          
          role = new Role({
            name: roleName,
            displayName: roleConfig[roleName].displayName,
            permissions: roleConfig[roleName].permissions,
            description: `Rôle ${roleConfig[roleName].displayName}`,
            isActive: true
          });
          await role.save();
          console.log(`   ✅ Rôle créé: ${roleName}`);
        }
      }

      // Créer un utilisateur de test
      const patientRole = await Role.findOne({ name: 'patient' });
      const testUser = new User({
        email: 'test@lineup.com',
        password: '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhgdw2wl/MEZTwhQjQFqhG', // password: test123
        role: patientRole._id,
        profile: {
          firstName: 'Jean',
          lastName: 'Dupont',
          phone: '0123456789'
        },
        isActive: true
      });
      
      await testUser.save();
      console.log('   ✅ Utilisateur de test créé: test@lineup.com / test123');
      
      // Recharger les utilisateurs
      const newUsers = await User.find({}).populate('role');
      users.push(...newUsers);
    }

    // Afficher les détails de chaque utilisateur
    for (const user of users) {
      console.log(`\n👤 ${user.email}:`);
      console.log(`   Role: ${user.role?.name || 'N/A'}`);
      console.log(`   firstName: ${user.firstName || 'undefined'}`);
      console.log(`   lastName: ${user.lastName || 'undefined'}`);
      console.log(`   profile.firstName: ${user.profile?.firstName || 'undefined'}`);
      console.log(`   profile.lastName: ${user.profile?.lastName || 'undefined'}`);
      console.log(`   fullName (virtual): ${user.fullName}`);
      
      // Correction si nécessaire
      let needsUpdate = false;
      
      // Si les données sont dans firstName/lastName au lieu de profile
      if ((user.firstName || user.lastName) && (!user.profile?.firstName || !user.profile?.lastName)) {
        console.log('   🔧 Migration nécessaire...');
        
        if (!user.profile) user.profile = {};
        if (user.firstName && !user.profile.firstName) {
          user.profile.firstName = user.firstName;
          user.firstName = undefined;
          needsUpdate = true;
        }
        if (user.lastName && !user.profile.lastName) {
          user.profile.lastName = user.lastName;
          user.lastName = undefined;
          needsUpdate = true;
        }
      }
      
      if (needsUpdate) {
        await user.save();
        console.log('   ✅ Utilisateur migré');
      } else {
        console.log('   ✅ Utilisateur correct');
      }
    }

    console.log('\n🎯 Test final de connexion...');
    
    // Test de connexion avec l'utilisateur de test
    const testLogin = await User.findOne({ email: 'test@lineup.com' }).populate('role');
    if (testLogin) {
      console.log('\n📋 Données qui seraient retournées par /auth/login:');
      const loginResponse = {
        _id: testLogin._id,
        firstName: testLogin.profile?.firstName,
        lastName: testLogin.profile?.lastName,
        fullName: testLogin.fullName,
        email: testLogin.email,
        phone: testLogin.profile?.phone,
        role: {
          name: testLogin.role?.name,
          permissions: testLogin.role?.permissions
        }
      };
      console.log(JSON.stringify(loginResponse, null, 2));
    }

  } catch (error) {
    console.error('❌ Erreur:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\n👋 Déconnecté de MongoDB');
  }
}

debugUserData(); 