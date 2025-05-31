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

async function createTestUsers() {
  try {
    console.log('🔧 Création des utilisateurs de test...\n');

    // Récupérer tous les rôles
    const roles = await Role.find({});
    if (roles.length === 0) {
      console.log('❌ Aucun rôle trouvé. Veuillez d\'abord exécuter le script de création des rôles.');
      return;
    }

    console.log(`📋 ${roles.length} rôles trouvés :`);
    roles.forEach(role => {
      console.log(`   - ${role.name} (${role.permissions.join(', ')})`);
    });
    console.log('');

    // Utilisateurs de test à créer
    const testUsers = [
      {
        firstName: 'Dr. Marie',
        lastName: 'Dupont',
        email: 'medecin@lineup.com',
        password: 'medecin123',
        phone: '01 23 45 67 89',
        roleName: 'medecin'
      },
      {
        firstName: 'Sophie',
        lastName: 'Martin',
        email: 'secretaire@lineup.com',
        password: 'secretaire123',
        phone: '01 23 45 67 88',
        roleName: 'secretaire'
      },
      {
        firstName: 'Jean',
        lastName: 'Patient',
        email: 'patient@lineup.com',
        password: 'patient123',
        phone: '06 12 34 56 78',
        roleName: 'patient'
      },
      {
        firstName: 'Pierre',
        lastName: 'Visiteur',
        email: 'visiteur@lineup.com',
        password: 'visiteur123',
        phone: '06 98 76 54 32',
        roleName: 'visiteur'
      }
    ];

    let created = 0;
    let updated = 0;

    for (const userData of testUsers) {
      const role = roles.find(r => r.name === userData.roleName);
      if (!role) {
        console.log(`❌ Rôle "${userData.roleName}" non trouvé pour ${userData.email}`);
        continue;
      }

      // Vérifier si l'utilisateur existe déjà
      const existingUser = await User.findOne({ email: userData.email });
      
      if (existingUser) {
        console.log(`⚠️ Utilisateur ${userData.email} existe déjà - mise à jour...`);
        
        // Mettre à jour le mot de passe et les infos
        const hashedPassword = await bcrypt.hash(userData.password, 12);
        existingUser.firstName = userData.firstName;
        existingUser.lastName = userData.lastName;
        existingUser.password = hashedPassword;
        existingUser.phone = userData.phone;
        existingUser.role = role._id;
        existingUser.isActive = true;
        
        await existingUser.save();
        console.log(`   ✅ Utilisateur ${userData.email} mis à jour`);
        updated++;
      } else {
        // Créer un nouvel utilisateur
        const hashedPassword = await bcrypt.hash(userData.password, 12);
        
        const newUser = new User({
          firstName: userData.firstName,
          lastName: userData.lastName,
          email: userData.email,
          password: hashedPassword,
          phone: userData.phone,
          role: role._id,
          isActive: true
        });

        await newUser.save();
        console.log(`   ✅ Utilisateur ${userData.email} créé`);
        created++;
      }
    }

    console.log(`\n🎉 Résumé :`);
    console.log(`   ${created} utilisateurs créés`);
    console.log(`   ${updated} utilisateurs mis à jour`);
    console.log(`   ${created + updated} utilisateurs au total`);

    // Afficher les informations de connexion
    console.log(`\n🧪 Informations de connexion :`);
    console.log('┌─────────────────────────────────────────────────────┐');
    console.log('│                 COMPTES DE TEST                     │');
    console.log('├─────────────────────────────────────────────────────┤');
    testUsers.forEach(user => {
      const roleDisplay = {
        'medecin': '🩺 Médecin',
        'secretaire': '👩‍💼 Secrétaire', 
        'patient': '👤 Patient',
        'visiteur': '👁️ Visiteur'
      };
      console.log(`│ ${roleDisplay[user.roleName].padEnd(15)} │ ${user.email.padEnd(25)} │ ${user.password.padEnd(10)} │`);
    });
    console.log('└─────────────────────────────────────────────────────┘');

  } catch (error) {
    console.error('❌ Erreur lors de la création des utilisateurs de test:', error);
  }
}

async function main() {
  try {
    console.log('🚀 Démarrage de la création des utilisateurs de test...\n');
    
    await connectDB();
    await createTestUsers();
    
    console.log('\n🎉 Création terminée avec succès !');
    console.log('💡 Vous pouvez maintenant vous connecter avec ces comptes sur /login');
    
  } catch (error) {
    console.error('❌ Erreur générale :', error);
  } finally {
    mongoose.connection.close();
    console.log('🔚 Connexion fermée');
  }
}

// Exécuter le script
main(); 