const mongoose = require('mongoose');
require('dotenv').config();

const Ticket = require('../models/Ticket');

async function connectDB() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ Connexion MongoDB réussie');
  } catch (err) {
    console.error('❌ Erreur MongoDB :', err.message);
    process.exit(1);
  }
}

async function fixExistingTickets() {
  try {
    console.log('🔧 Correction des tickets existants...\n');
    
    // Récupérer tous les tickets
    const tickets = await Ticket.find({});
    console.log(`📊 ${tickets.length} tickets trouvés`);
    
    if (tickets.length === 0) {
      console.log('✅ Aucun ticket à corriger');
      return;
    }
    
    let fixedCount = 0;
    
    for (const ticket of tickets) {
      let needsUpdate = false;
      const updates = {};
      
      // Ajouter sessionId si manquant
      if (!ticket.sessionId) {
        updates.sessionId = `legacy_session_${ticket._id.toString().slice(-8)}`;
        needsUpdate = true;
      }
      
      // Ajouter metadata si manquant
      if (!ticket.metadata) {
        updates.metadata = {
          ipAddress: 'unknown',
          userAgent: 'legacy',
          device: 'unknown'
        };
        needsUpdate = true;
      }
      
      // Ajouter updatedAt si manquant
      if (!ticket.updatedAt) {
        updates.updatedAt = ticket.createdAt || new Date();
        needsUpdate = true;
      }
      
      if (needsUpdate) {
        await Ticket.findByIdAndUpdate(ticket._id, updates);
        console.log(`   ✅ Ticket n°${ticket.number} corrigé`);
        fixedCount++;
      }
    }
    
    console.log(`\n🎉 ${fixedCount} tickets corrigés sur ${tickets.length}`);
    
  } catch (error) {
    console.error('❌ Erreur lors de la correction :', error);
  }
}

async function verifyTicketIntegrity() {
  try {
    console.log('\n🔍 Vérification de l\'intégrité des tickets...');
    
    // Vérifier les doublons de numéros
    const duplicates = await Ticket.aggregate([
      { $group: { _id: "$number", count: { $sum: 1 }, tickets: { $push: "$_id" } } },
      { $match: { count: { $gt: 1 } } }
    ]);
    
    if (duplicates.length > 0) {
      console.log(`⚠️ ${duplicates.length} numéros de tickets en doublon détectés :`);
      
      for (const dup of duplicates) {
        console.log(`   📋 Numéro ${dup._id} : ${dup.count} tickets`);
        
        // Garder le plus ancien, supprimer les autres
        const ticketsToDelete = dup.tickets.slice(1);
        await Ticket.deleteMany({ _id: { $in: ticketsToDelete } });
        console.log(`   🗑️ ${ticketsToDelete.length} doublons supprimés`);
      }
    } else {
      console.log('✅ Aucun doublon détecté');
    }
    
    // Vérifier la continuité des numéros
    const allTickets = await Ticket.find({}).sort({ number: 1 });
    const gaps = [];
    
    for (let i = 1; i < allTickets.length; i++) {
      const current = allTickets[i].number;
      const previous = allTickets[i-1].number;
      
      if (current - previous > 1) {
        gaps.push({ from: previous + 1, to: current - 1 });
      }
    }
    
    if (gaps.length > 0) {
      console.log(`⚠️ ${gaps.length} trous dans la numérotation détectés :`);
      gaps.forEach(gap => {
        console.log(`   📋 Manque les numéros ${gap.from} à ${gap.to}`);
      });
    } else {
      console.log('✅ Numérotation continue');
    }
    
    // Statistiques finales
    const stats = await Ticket.aggregate([
      { $group: { _id: "$status", count: { $sum: 1 } } }
    ]);
    
    console.log('\n📊 Statistiques des tickets :');
    stats.forEach(stat => {
      console.log(`   ${stat._id} : ${stat.count}`);
    });
    
  } catch (error) {
    console.error('❌ Erreur lors de la vérification :', error);
  }
}

async function createIndex() {
  try {
    console.log('\n📇 Création des index...');
    
    // Créer l'index unique sur le numéro (si pas déjà existant)
    await Ticket.collection.createIndex({ number: 1 }, { unique: true });
    console.log('✅ Index unique sur "number" créé');
    
    // Créer les autres index
    await Ticket.collection.createIndex({ status: 1, createdAt: 1 });
    console.log('✅ Index composé "status + createdAt" créé');
    
    await Ticket.collection.createIndex({ sessionId: 1 });
    console.log('✅ Index sur "sessionId" créé');
    
  } catch (error) {
    if (error.code === 11000) {
      console.log('⚠️ Index unique déjà existant ou conflit détecté');
    } else {
      console.error('❌ Erreur lors de la création des index :', error);
    }
  }
}

async function main() {
  try {
    console.log('🚀 Démarrage de la correction des tickets...\n');
    
    await connectDB();
    
    // 1. Corriger les tickets existants
    await fixExistingTickets();
    
    // 2. Vérifier l'intégrité
    await verifyTicketIntegrity();
    
    // 3. Créer les index
    await createIndex();
    
    console.log('\n🎉 Correction terminée avec succès !');
    
  } catch (error) {
    console.error('❌ Erreur générale :', error);
  } finally {
    mongoose.connection.close();
    console.log('🔚 Connexion fermée');
  }
}

// Exécuter le script
main(); 