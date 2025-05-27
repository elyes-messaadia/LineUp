const mongoose = require('mongoose');
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

async function listUsers() {
  try {
    console.log('📋 Liste des utilisateurs dans la base de données\n');

    // Lister les admins
    const admins = await Admin.find({}, 'email createdAt').sort({ email: 1 });
    console.log('👨‍⚕️ ADMINS (' + admins.length + ') :');
    if (admins.length === 0) {
      console.log('   Aucun admin trouvé');
    } else {
      admins.forEach((admin, index) => {
        console.log(`   ${index + 1}. ${admin.email} (ID: ${admin._id})`);
      });
    }

    console.log('');

    // Lister les patients
    const patients = await Patient.find({}, 'email createdAt').sort({ email: 1 });
    console.log('👤 PATIENTS (' + patients.length + ') :');
    if (patients.length === 0) {
      console.log('   Aucun patient trouvé');
    } else {
      patients.forEach((patient, index) => {
        console.log(`   ${index + 1}. ${patient.email} (ID: ${patient._id})`);
      });
    }

    console.log('\n📊 Résumé :');
    console.log(`Total admins: ${admins.length}`);
    console.log(`Total patients: ${patients.length}`);
    console.log(`Total utilisateurs: ${admins.length + patients.length}`);

  } catch (error) {
    console.error('❌ Erreur lors de la consultation :', error.message);
  } finally {
    mongoose.connection.close();
    console.log('\n🔚 Connexion fermée');
  }
}

// Exécuter le script
connectDB().then(() => {
  listUsers();
}); 