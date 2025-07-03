const mongoose = require('mongoose');
const Ticket = require('../models/Ticket');

// Configuration de connexion MongoDB
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb+srv://elyesmessaadia:Elyes1998@lineup.ybf8q.mongodb.net/lineup?retryWrites=true&w=majority';

// Mapping des anciens noms vers les nouveaux IDs
const DOCTOR_MAPPING = {
  'Docteur 1': 'dr-husni-said-habibi',
  'Docteur 2': 'dr-helios-blasco', 
  'Docteur 3': 'dr-jean-eric-panacciulli',
  'docteur1': 'dr-husni-said-habibi',
  'docteur2': 'dr-helios-blasco',
  'docteur3': 'dr-jean-eric-panacciulli',
  'Dr. Husni': 'dr-husni-said-habibi',
  'Dr. Helios': 'dr-helios-blasco',
  'Dr. Jean-Eric': 'dr-jean-eric-panacciulli',
  'husni': 'dr-husni-said-habibi',
  'helios': 'dr-helios-blasco',
  'jean-eric': 'dr-jean-eric-panacciulli',
  'panacciulli': 'dr-jean-eric-panacciulli'
};

async function fixDoctorNames() {
  try {
    console.log('🔧 Connexion à MongoDB...');
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connecté à MongoDB');

    // Récupérer tous les tickets avec des noms de docteurs incorrects
    console.log('🔍 Recherche des tickets avec des noms de docteurs incorrects...');
    
    // Chercher les tickets qui n'ont pas les bons IDs
    const validDoctorIds = ['dr-husni-said-habibi', 'dr-helios-blasco', 'dr-jean-eric-panacciulli'];
    const incorrectTickets = await Ticket.find({
      docteur: { $nin: validDoctorIds }
    });

    console.log(`📊 Trouvé ${incorrectTickets.length} tickets avec des noms incorrects`);

    if (incorrectTickets.length === 0) {
      console.log('✅ Aucun ticket à corriger !');
      return;
    }

    // Afficher quelques exemples
    console.log('📝 Exemples de noms incorrects trouvés:');
    const uniqueIncorrectNames = [...new Set(incorrectTickets.map(t => t.docteur))];
    uniqueIncorrectNames.forEach(name => {
      const mapped = DOCTOR_MAPPING[name] || 'NON MAPPÉ';
      console.log(`   "${name}" → "${mapped}"`);
    });

    // Corriger chaque ticket
    let correctedCount = 0;
    let skippedCount = 0;

    for (const ticket of incorrectTickets) {
      const oldDocteur = ticket.docteur;
      const newDocteur = DOCTOR_MAPPING[oldDocteur];

      if (newDocteur) {
        try {
          await Ticket.findByIdAndUpdate(ticket._id, {
            docteur: newDocteur,
            updatedAt: new Date()
          });
          correctedCount++;
          console.log(`✅ Ticket #${ticket.number}: "${oldDocteur}" → "${newDocteur}"`);
        } catch (error) {
          console.error(`❌ Erreur correction ticket #${ticket.number}:`, error.message);
          skippedCount++;
        }
      } else {
        console.warn(`⚠️  Ticket #${ticket.number}: Nom "${oldDocteur}" non reconnu, ignoré`);
        skippedCount++;
      }
    }

    console.log('\n📊 Résumé de la migration:');
    console.log(`✅ Tickets corrigés: ${correctedCount}`);
    console.log(`⚠️  Tickets ignorés: ${skippedCount}`);
    console.log(`📝 Total traités: ${correctedCount + skippedCount}`);

    // Vérification finale
    console.log('\n🔍 Vérification finale...');
    const remainingIncorrect = await Ticket.find({
      docteur: { $nin: validDoctorIds }
    });

    if (remainingIncorrect.length === 0) {
      console.log('🎉 Tous les tickets ont maintenant des noms de docteurs corrects !');
    } else {
      console.log(`⚠️  Il reste ${remainingIncorrect.length} tickets avec des noms incorrects:`);
      remainingIncorrect.forEach(ticket => {
        console.log(`   Ticket #${ticket.number}: "${ticket.docteur}"`);
      });
    }

  } catch (error) {
    console.error('❌ Erreur lors de la migration:', error);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Déconnecté de MongoDB');
  }
}

// Exécuter le script
if (require.main === module) {
  fixDoctorNames()
    .then(() => {
      console.log('✅ Migration terminée');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Erreur fatale:', error);
      process.exit(1);
    });
}

module.exports = { fixDoctorNames, DOCTOR_MAPPING }; 