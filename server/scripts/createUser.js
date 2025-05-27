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

async function createUser() {
  try {
    // Récupérer les arguments de la ligne de commande
    const args = process.argv.slice(2);
    
    if (args.length !== 3) {
      console.log('❌ Usage: npm run create:user <type> <email> <password>');
      console.log('   Type: admin ou patient');
      console.log('   Exemple: npm run create:user admin nouveladmin@test.com motdepasse123');
      return;
    }

    const [type, email, password] = args;

    if (!['admin', 'patient'].includes(type.toLowerCase())) {
      console.log('❌ Type invalide. Utilisez "admin" ou "patient"');
      return;
    }

    // Valider l'email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      console.log('❌ Format d\'email invalide');
      return;
    }

    // Valider le mot de passe
    if (password.length < 6) {
      console.log('❌ Le mot de passe doit contenir au moins 6 caractères');
      return;
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    if (type.toLowerCase() === 'admin') {
      // Vérifier si l'admin existe déjà
      const existingAdmin = await Admin.findOne({ email });
      if (existingAdmin) {
        console.log('❌ Un admin avec cet email existe déjà');
        return;
      }

      const admin = new Admin({
        email,
        password: hashedPassword
      });
      await admin.save();
      console.log(`✅ Admin créé avec succès:`);
      console.log(`   Email: ${email}`);
      console.log(`   ID: ${admin._id}`);
    } else {
      // Vérifier si le patient existe déjà
      const existingPatient = await Patient.findOne({ email });
      if (existingPatient) {
        console.log('❌ Un patient avec cet email existe déjà');
        return;
      }

      const patient = new Patient({
        email,
        password: hashedPassword
      });
      await patient.save();
      console.log(`✅ Patient créé avec succès:`);
      console.log(`   Email: ${email}`);
      console.log(`   ID: ${patient._id}`);
    }

  } catch (error) {
    console.error('❌ Erreur lors de la création :', error.message);
  } finally {
    mongoose.connection.close();
    console.log('🔚 Connexion fermée');
  }
}

// Exécuter le script
connectDB().then(() => {
  createUser();
}); 