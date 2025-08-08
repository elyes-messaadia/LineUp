const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
require('dotenv').config();

const User = require('../models/User');
const Role = require('../models/Role');

// Configuration des docteurs (synchronisée avec le frontend)
const DOCTEURS = [
  { 
    firstName: 'Dr. Husni',
    lastName: 'SAID HABIBI',
    email: 'husni.said.habibi@lineup.medical',
    password: 'husni123',
    phone: '01 23 45 67 01',
    specialite: 'Médecin généraliste'
  },
  { 
    firstName: 'Dr. Helios',
    lastName: 'BLASCO',
    email: 'helios.blasco@lineup.medical',
    password: 'helios123',
    phone: '01 23 45 67 02',
    specialite: 'Médecin généraliste'
  },
  { 
    firstName: 'Dr. Jean-Eric',
    lastName: 'PANACCIULLI',
    email: 'jean.eric.panacciulli@lineup.medical',
    password: 'jeaneric123',
    phone: '01 23 45 67 03',
    specialite: 'Médecin généraliste'
  }
];

async function connectDB() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ Connexion MongoDB réussie');
  } catch (err) {
    console.error('❌ Erreur MongoDB :', err.message);
    process.exit(1);
  }
}

async function createDoctors() {
  try {
    console.log('👨‍⚕️ Création des comptes docteurs...\n');

    // Récupérer le rôle médecin
    const medecinRole = await Role.findOne({ name: 'medecin' });
    if (!medecinRole) {
      console.log('❌ Rôle "medecin" non trouvé. Veuillez d\'abord exécuter le script de création des rôles.');
      return;
    }

    console.log(`📋 Rôle médecin trouvé : ${medecinRole.name} (${medecinRole.permissions.join(', ')})\n`);

    let created = 0;
    let updated = 0;

    for (const doctorData of DOCTEURS) {
      // Vérifier si l'utilisateur existe déjà
      const existingUser = await User.findOne({ email: doctorData.email });
      
      if (existingUser) {
        console.log(`⚠️ Docteur ${doctorData.email} existe déjà - mise à jour...`);

        // Mettre à jour le mot de passe et les infos (respect du schéma User)
        const hashedPassword = await bcrypt.hash(doctorData.password, 12);
        existingUser.password = hashedPassword;
        existingUser.role = medecinRole._id;
        existingUser.isActive = true;

        // Assurer la structure profile
        existingUser.profile = existingUser.profile || {};
        existingUser.profile.firstName = doctorData.firstName;
        existingUser.profile.lastName = doctorData.lastName;
        existingUser.profile.phone = doctorData.phone;
        
        await existingUser.save();
        console.log(`   ✅ Docteur ${doctorData.firstName} ${doctorData.lastName} mis à jour`);
        updated++;
      } else {
        // Créer un nouvel utilisateur
        const hashedPassword = await bcrypt.hash(doctorData.password, 12);
        
        const newUser = new User({
          email: doctorData.email,
          password: hashedPassword,
          role: medecinRole._id,
          isActive: true,
          profile: {
            firstName: doctorData.firstName,
            lastName: doctorData.lastName,
            phone: doctorData.phone
          }
        });

        await newUser.save();
        console.log(`   ✅ Docteur ${doctorData.firstName} ${doctorData.lastName} créé`);
        created++;
      }
    }

    console.log(`\n🎉 Résumé :`);
    console.log(`   ${created} docteurs créés`);
    console.log(`   ${updated} docteurs mis à jour`);
    console.log(`   ${created + updated} docteurs au total`);

    // Afficher les informations de connexion
    console.log(`\n🩺 Informations de connexion des docteurs :`);
    console.log('┌──────────────────────────────────────────────────────────────────────────────┐');
    console.log('│                                  COMPTES DOCTEURS                              │');
    console.log('├──────────────────────────────────────────────────────────────────────────────┤');
    console.log('│ Nom                      │ Email                              │ Mot de passe │');
    console.log('├──────────────────────────────────────────────────────────────────────────────┤');
    DOCTEURS.forEach(doctor => {
      const name = `${doctor.firstName} ${doctor.lastName}`;
      console.log(`│ ${name.padEnd(24)} │ ${doctor.email.padEnd(34)} │ ${doctor.password.padEnd(12)} │`);
    });
    console.log('└──────────────────────────────────────────────────────────────────────────────┘');

    console.log('\n💡 Ces comptes peuvent maintenant être utilisés pour :');
    console.log('   - Connexion rapide depuis la page d\'accueil');
    console.log('   - Connexion rapide depuis la page de login');
    console.log('   - Connexion manuelle avec email/mot de passe');

  } catch (error) {
    console.error('❌ Erreur lors de la création des docteurs:', error);
  }
}

async function main() {
  try {
    console.log('🚀 Démarrage de la création des comptes docteurs...\n');
    
    await connectDB();
    await createDoctors();
    
    console.log('\n🎉 Création terminée avec succès !');
    console.log('👨‍⚕️ Les docteurs peuvent maintenant utiliser les Quick Logins !');
    
  } catch (error) {
    console.error('❌ Erreur générale :', error);
  } finally {
    mongoose.connection.close();
    console.log('🔚 Connexion fermée');
  }
}

// Exécuter le script
main(); 