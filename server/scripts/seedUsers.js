const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
require('dotenv').config();

// Import des modèles
const Admin = require('../models/Admin');
const Patient = require('../models/Patient');

async function connectDB() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ Connexion MongoDB réussie');
  } catch (err) {
    console.error('❌ Erreur MongoDB :', err.message);
    process.exit(1);
  }
}

async function seedUsers() {
  try {
    console.log('🌱 Démarrage du peuplement des utilisateurs...');

    // Supprimer les utilisateurs existants (optionnel)
    await Admin.deleteMany({});
    await Patient.deleteMany({});
    console.log('🗑️ Utilisateurs existants supprimés');

    // Créer des admins de test
    const adminUsers = [
      {
        email: 'admin@lineup.com',
        password: 'admin123'
      },
      {
        email: 'docteur@lineup.com',
        password: 'docteur123'
      }
    ];

    for (let adminData of adminUsers) {
      const hashedPassword = await bcrypt.hash(adminData.password, 10);
      const admin = new Admin({
        email: adminData.email,
        password: hashedPassword
      });
      await admin.save();
      console.log(`👨‍⚕️ Admin créé: ${adminData.email}`);
    }

    // Créer des patients de test
    const patientUsers = [
      {
        email: 'patient1@test.com',
        password: 'patient123'
      },
      {
        email: 'patient2@test.com',
        password: 'patient123'
      },
      {
        email: 'marie.dupont@email.com',
        password: 'password123'
      }
    ];

    for (let patientData of patientUsers) {
      const hashedPassword = await bcrypt.hash(patientData.password, 10);
      const patient = new Patient({
        email: patientData.email,
        password: hashedPassword
      });
      await patient.save();
      console.log(`👤 Patient créé: ${patientData.email}`);
    }

    console.log('🎉 Peuplement terminé avec succès !');
    console.log('\n📋 Comptes créés :');
    console.log('\n👨‍⚕️ ADMINS :');
    console.log('Email: admin@lineup.com | Mot de passe: admin123');
    console.log('Email: docteur@lineup.com | Mot de passe: docteur123');
    console.log('\n👤 PATIENTS :');
    console.log('Email: patient1@test.com | Mot de passe: patient123');
    console.log('Email: patient2@test.com | Mot de passe: patient123');
    console.log('Email: marie.dupont@email.com | Mot de passe: password123');

  } catch (error) {
    console.error('❌ Erreur lors du peuplement :', error.message);
  } finally {
    mongoose.connection.close();
    console.log('🔚 Connexion fermée');
  }
}

// Exécuter le script
connectDB().then(() => {
  seedUsers();
}); 