const mongoose = require('mongoose');
const Ticket = require('../models/Ticket');
const User = require('../models/User');
require('dotenv').config();

// 🔍 Script de vérification de la cohérence des données
async function checkDataConsistency() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('🔗 Connexion à MongoDB établie');

    console.log('\n📊 === VÉRIFICATION DE LA COHÉRENCE DES DONNÉES ===\n');

    // 1. Vérifier les tickets orphelins (userId invalide)
    console.log('1. 🔍 Recherche de tickets orphelins...');
    const orphanTickets = await Ticket.find({ userId: { $ne: null } });
    let orphanCount = 0;
    
    for (const ticket of orphanTickets) {
      const user = await User.findById(ticket.userId);
      if (!user) {
        orphanCount++;
        console.log(`   ❌ Ticket orphelin: #${ticket.number} (ID: ${ticket._id})`);
      }
    }
    
    if (orphanCount === 0) {
      console.log('   ✅ Aucun ticket orphelin trouvé');
    } else {
      console.log(`   ⚠️  ${orphanCount} ticket(s) orphelin(s) détecté(s)`);
    }

    // 2. Vérifier les patients avec plusieurs tickets actifs
    console.log('\n2. 🔍 Recherche de patients avec plusieurs tickets actifs...');
    const activeTickets = await Ticket.find({ 
      status: { $in: ['en_attente', 'en_consultation'] },
      userId: { $ne: null }
    });
    
    const userTicketCounts = {};
    activeTickets.forEach(ticket => {
      const userId = ticket.userId.toString();
      userTicketCounts[userId] = (userTicketCounts[userId] || 0) + 1;
    });
    
    let duplicateCount = 0;
    for (const [userId, count] of Object.entries(userTicketCounts)) {
      if (count > 1) {
        duplicateCount++;
        const user = await User.findById(userId);
        console.log(`   ❌ Patient ${user?.email || userId} a ${count} tickets actifs`);
      }
    }
    
    if (duplicateCount === 0) {
      console.log('   ✅ Aucun patient avec plusieurs tickets actifs');
    } else {
      console.log(`   ⚠️  ${duplicateCount} patient(s) avec tickets multiples`);
    }

    // 3. Vérifier les consultations multiples par docteur
    console.log('\n3. 🔍 Recherche de consultations multiples par docteur...');
    const consultations = await Ticket.find({ status: 'en_consultation' });
    const doctorConsultations = {};
    
    consultations.forEach(ticket => {
      const doctor = ticket.docteur;
      doctorConsultations[doctor] = (doctorConsultations[doctor] || 0) + 1;
    });
    
    let multiConsultCount = 0;
    for (const [doctor, count] of Object.entries(doctorConsultations)) {
      if (count > 1) {
        multiConsultCount++;
        console.log(`   ❌ ${doctor} a ${count} consultations simultanées`);
      }
    }
    
    if (multiConsultCount === 0) {
      console.log('   ✅ Aucune consultation multiple par docteur');
    } else {
      console.log(`   ⚠️  ${multiConsultCount} docteur(s) avec consultations multiples`);
    }

    // 4. Statistiques générales
    console.log('\n4. 📈 Statistiques générales:');
    const totalTickets = await Ticket.countDocuments();
    const activeTicketsCount = await Ticket.countDocuments({ 
      status: { $in: ['en_attente', 'en_consultation'] }
    });
    const authenticatedTickets = await Ticket.countDocuments({ userId: { $ne: null } });
    const anonymousTickets = await Ticket.countDocuments({ userId: null });
    
    console.log(`   📊 Total tickets: ${totalTickets}`);
    console.log(`   🎫 Tickets actifs: ${activeTicketsCount}`);
    console.log(`   👤 Tickets authentifiés: ${authenticatedTickets}`);
    console.log(`   🔒 Tickets anonymes: ${anonymousTickets}`);

    // 5. Recommandations de nettoyage
    console.log('\n5. 🧹 Recommandations de nettoyage:');
    if (orphanCount > 0) {
      console.log(`   🔧 Nettoyer ${orphanCount} ticket(s) orphelin(s)`);
    }
    if (duplicateCount > 0) {
      console.log(`   🔧 Résoudre ${duplicateCount} conflit(s) de tickets multiples`);
    }
    if (multiConsultCount > 0) {
      console.log(`   🔧 Résoudre ${multiConsultCount} conflit(s) de consultations multiples`);
    }
    if (orphanCount === 0 && duplicateCount === 0 && multiConsultCount === 0) {
      console.log('   ✨ Base de données cohérente - aucune action nécessaire');
    }

  } catch (error) {
    console.error('❌ Erreur lors de la vérification:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\n🔌 Connexion fermée');
  }
}

// Exécuter le script si appelé directement
if (require.main === module) {
  checkDataConsistency();
}

module.exports = checkDataConsistency; 