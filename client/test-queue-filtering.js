// Script de test pour vérifier le filtrage des files par docteur
const BACKEND_URL = 'https://lineup-backend-xxak.onrender.com';

async function createTestTickets() {
  console.log('🧪 Création de tickets de test...');
  
  const doctors = [
    'dr-husni-said-habibi',
    'dr-helios-blasco',
    'dr-jean-eric-panacciulli'
  ];
  
  try {
    // Créer 2 tickets pour chaque docteur
    for (let i = 0; i < doctors.length; i++) {
      for (let j = 1; j <= 2; j++) {
        const response = await fetch(`${BACKEND_URL}/ticket`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            docteur: doctors[i]
          })
        });
        
        if (response.ok) {
          const ticket = await response.json();
          console.log(`✅ Ticket créé: #${ticket.number} pour ${doctors[i]}`);
        } else {
          console.error(`❌ Erreur création ticket pour ${doctors[i]}`);
        }
      }
    }
    
    console.log('\n📋 Test du filtrage...');
    
    // Tester le filtrage pour chaque docteur
    for (const doctor of doctors) {
      const response = await fetch(`${BACKEND_URL}/queue?docteur=${doctor}`);
      if (response.ok) {
        const queue = await response.json();
        console.log(`🩺 ${doctor}: ${queue.length} tickets`);
        queue.forEach(ticket => {
          console.log(`   - Ticket #${ticket.number} (docteur: ${ticket.docteur})`);
          if (ticket.docteur !== doctor) {
            console.error(`   ❌ ERREUR: Ticket #${ticket.number} appartient à ${ticket.docteur} mais apparaît dans la file de ${doctor}!`);
          }
        });
      }
    }
    
    // Afficher la file globale
    const globalResponse = await fetch(`${BACKEND_URL}/queue`);
    if (globalResponse.ok) {
      const globalQueue = await globalResponse.json();
      console.log(`\n🏥 File globale: ${globalQueue.length} tickets total`);
      globalQueue.forEach(ticket => {
        console.log(`   - Ticket #${ticket.number} pour ${ticket.docteur}`);
      });
    }
    
  } catch (error) {
    console.error('❌ Erreur:', error);
  }
}

// Si exécuté directement avec Node.js
if (typeof module !== 'undefined' && module.exports) {
  createTestTickets();
}

// Si exécuté dans le navigateur
if (typeof window !== 'undefined') {
  window.testQueueFiltering = createTestTickets;
} 