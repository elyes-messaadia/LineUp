const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const User = require('../models/User');
const Role = require('../models/Role');

async function fixTestAccount() {
  try {
    console.log('🔧 Correction du compte de test...\n');

    // Connexion à MongoDB
    await mongoose.connect('mongodb://localhost:27017/lineup', {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
    console.log('✅ Connecté à MongoDB\n');

    // Chercher l'utilisateur de test
    let testUser = await User.findOne({ email: 'test@lineup.com' }).populate('role');
    
    if (!testUser) {
      console.log('❌ Compte de test non trouvé, création...');
      
      // Vérifier que le rôle patient existe
      let patientRole = await Role.findOne({ name: 'patient' });
      if (!patientRole) {
        console.log('🔧 Création du rôle patient...');
        patientRole = new Role({
          name: 'patient',
          displayName: 'Patient',
          permissions: ['create_ticket', 'view_queue'],
          description: 'Rôle Patient',
          isActive: true
        });
        await patientRole.save();
      }

      // Créer l'utilisateur de test
      const saltRounds = 12;
      const hashedPassword = await bcrypt.hash('test123', saltRounds);
      
      testUser = new User({
        email: 'test@lineup.com',
        password: hashedPassword,
        role: patientRole._id,
        profile: {
          firstName: 'Jean',
          lastName: 'Dupont',
          phone: '0123456789'
        },
        isActive: true
      });
      
      await testUser.save();
      console.log('✅ Compte de test créé');
    } else {
      console.log('📋 Compte de test trouvé, vérification du mot de passe...');
      
      // Tester le mot de passe actuel
      const isPasswordValid = await bcrypt.compare('test123', testUser.password);
      
      if (!isPasswordValid) {
        console.log('🔧 Mot de passe incorrect, correction...');
        const saltRounds = 12;
        const hashedPassword = await bcrypt.hash('test123', saltRounds);
        testUser.password = hashedPassword;
        await testUser.save();
        console.log('✅ Mot de passe corrigé');
      } else {
        console.log('✅ Mot de passe correct');
      }
    }

    // Recharger l'utilisateur avec populate
    testUser = await User.findOne({ email: 'test@lineup.com' }).populate('role');
    
    console.log('\n📊 Détails du compte de test:');
    console.log(`   Email: ${testUser.email}`);
    console.log(`   Mot de passe: test123`);
    console.log(`   Rôle: ${testUser.role?.name}`);
    console.log(`   Nom: ${testUser.profile?.firstName} ${testUser.profile?.lastName}`);
    console.log(`   fullName (virtual): ${testUser.fullName}`);
    console.log(`   Actif: ${testUser.isActive}`);

    // Test de validation du mot de passe
    console.log('\n🧪 Test de validation du mot de passe...');
    const passwordTest = await bcrypt.compare('test123', testUser.password);
    console.log(`   Validation "test123": ${passwordTest ? '✅ Valide' : '❌ Invalide'}`);

    // Simuler la réponse de connexion
    console.log('\n📋 Réponse qui devrait être retournée par /auth/login:');
    const loginResponse = {
      _id: testUser._id,
      firstName: testUser.profile?.firstName,
      lastName: testUser.profile?.lastName,
      fullName: testUser.fullName,
      email: testUser.email,
      phone: testUser.profile?.phone,
      role: {
        name: testUser.role?.name,
        permissions: testUser.role?.permissions
      }
    };
    console.log(JSON.stringify(loginResponse, null, 2));

    // Test de création d'un second utilisateur avec des données complètes
    console.log('\n🔧 Création d\'un compte médecin de test...');
    
    let medecinRole = await Role.findOne({ name: 'medecin' });
    if (!medecinRole) {
      medecinRole = new Role({
        name: 'medecin',
        displayName: 'Médecin',
        permissions: ['view_queue', 'call_next', 'finish_consultation'],
        description: 'Rôle Médecin',
        isActive: true
      });
      await medecinRole.save();
    }

    let medecinUser = await User.findOne({ email: 'medecin@test.com' });
    if (!medecinUser) {
      const saltRounds = 12;
      const hashedPassword = await bcrypt.hash('test123', saltRounds);
      
      medecinUser = new User({
        email: 'medecin@test.com',
        password: hashedPassword,
        role: medecinRole._id,
        profile: {
          firstName: 'Dr Marie',
          lastName: 'Martin',
          phone: '0123456790'
        },
        isActive: true
      });
      
      await medecinUser.save();
      console.log('✅ Compte médecin créé: medecin@test.com / test123');
    } else {
      console.log('✅ Compte médecin existe déjà');
    }

  } catch (error) {
    console.error('❌ Erreur:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\n👋 Déconnecté de MongoDB');
    console.log('\n🎯 Comptes de test disponibles:');
    console.log('   👤 Patient: test@lineup.com / test123');
    console.log('   👨‍⚕️ Médecin: medecin@test.com / test123');
  }
}

fixTestAccount(); 