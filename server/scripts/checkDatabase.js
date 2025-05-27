const mongoose = require('mongoose');
require('dotenv').config();

// Import des modèles
const Admin = require('../models/Admin');
const Patient = require('../models/Patient');
const Ticket = require('../models/Ticket');

async function connectDB() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ Connexion MongoDB réussie');
    console.log('🔗 Base de données:', mongoose.connection.name);
    console.log('🌐 Host:', mongoose.connection.host);
    console.log('📊 État de connexion:', mongoose.connection.readyState);
  } catch (err) {
    console.error('❌ Erreur MongoDB :', err.message);
    process.exit(1);
  }
}

async function checkDatabase() {
  try {
    console.log('\n📋 Vérification complète de la base de données...\n');

    // Lister toutes les collections
    const collections = await mongoose.connection.db.listCollections().toArray();
    console.log('📂 Collections disponibles :');
    collections.forEach(col => {
      console.log(`   - ${col.name}`);
    });

    console.log('\n📊 Statistiques par collection :\n');

    // Vérifier les admins
    const adminCount = await Admin.countDocuments();
    console.log(`👨‍⚕️ ADMINS : ${adminCount} documents`);
    if (adminCount > 0) {
      const admins = await Admin.find({}, 'email _id').limit(5);
      admins.forEach((admin, index) => {
        console.log(`   ${index + 1}. ${admin.email} (${admin._id})`);
      });
    }

    // Vérifier les patients
    const patientCount = await Patient.countDocuments();
    console.log(`\n👤 PATIENTS : ${patientCount} documents`);
    if (patientCount > 0) {
      const patients = await Patient.find({}, 'email _id').limit(5);
      patients.forEach((patient, index) => {
        console.log(`   ${index + 1}. ${patient.email} (${patient._id})`);
      });
    }

    // Vérifier les tickets
    const ticketCount = await Ticket.countDocuments();
    console.log(`\n🎫 TICKETS : ${ticketCount} documents`);
    if (ticketCount > 0) {
      const tickets = await Ticket.find({}, 'number status createdAt _id').limit(5);
      tickets.forEach((ticket, index) => {
        console.log(`   ${index + 1}. Ticket #${ticket.number} - ${ticket.status} (${ticket._id})`);
      });
    }

    console.log('\n🔍 Informations pour MongoDB Compass :');
    console.log('   URI de connexion:', process.env.MONGO_URI);
    console.log('   Nom de la base:', mongoose.connection.name);
    
    console.log('\n✨ Instructions MongoDB Compass :');
    console.log('1. Ouvrez MongoDB Compass');
    console.log('2. Collez cette URI dans le champ de connexion :');
    console.log(`   ${process.env.MONGO_URI}`);
    console.log('3. Connectez-vous');
    console.log(`4. Cherchez la base de données "${mongoose.connection.name}"`);
    console.log('5. Vous devriez voir les collections : admins, patients, tickets');

  } catch (error) {
    console.error('❌ Erreur lors de la vérification :', error.message);
  } finally {
    mongoose.connection.close();
    console.log('\n🔚 Connexion fermée');
  }
}

// Exécuter le script
connectDB().then(() => {
  checkDatabase();
}); 