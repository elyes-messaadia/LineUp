/**
 * Script de test pour le système de chat intelligent
 * Teste l'intégration complète entre le frontend et le backend
 */

const API_BASE = "http://localhost:5000";

// Simulation d'un token JWT valide (remplacez par un vrai token pour les tests)
const TEST_TOKEN = "your-jwt-token-here";

class ChatSystemTester {
  constructor() {
    this.conversationId = null;
    this.testResults = [];
  }

  async log(test, success, details = "") {
    const result = {
      test,
      success,
      details,
      timestamp: new Date().toISOString(),
    };
    this.testResults.push(result);

    const status = success ? "✅" : "❌";
    console.log(`${status} ${test}${details ? ` - ${details}` : ""}`);
  }

  async makeRequest(url, options = {}) {
    try {
      const response = await fetch(`${API_BASE}${url}`, {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${TEST_TOKEN}`,
          ...options.headers,
        },
        ...options,
      });

      const data = await response.json();
      return { success: response.ok, data, status: response.status };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  async testCreateConversation() {
    console.log("\n🔄 Test: Création d'une nouvelle conversation...");

    const result = await this.makeRequest("/conversations", {
      method: "POST",
      body: JSON.stringify({
        ticketId: "test-ticket-123",
      }),
    });

    if (result.success && result.data.conversationId) {
      this.conversationId = result.data.conversationId;
      await this.log(
        "Création de conversation",
        true,
        `ID: ${this.conversationId}`
      );
      return true;
    } else {
      await this.log(
        "Création de conversation",
        false,
        result.error || "Échec de création"
      );
      return false;
    }
  }

  async testSendMessage(message) {
    if (!this.conversationId) {
      await this.log("Envoi de message", false, "Pas de conversation active");
      return false;
    }

    console.log(`\n🔄 Test: Envoi du message "${message}"...`);

    const result = await this.makeRequest(
      `/conversations/${this.conversationId}/message`,
      {
        method: "POST",
        body: JSON.stringify({ message }),
      }
    );

    if (result.success) {
      const response = result.data;
      await this.log(
        "Envoi de message",
        true,
        `Réponse reçue: ${response.botResponse?.substring(0, 50)}...`
      );

      // Vérifier la structure de la réponse
      if (response.urgencyAssessment) {
        await this.log(
          "Évaluation d'urgence",
          true,
          `Score: ${response.urgencyAssessment.urgencyLevel}/10`
        );
      }

      return response;
    } else {
      await this.log(
        "Envoi de message",
        false,
        result.error || "Échec d'envoi"
      );
      return false;
    }
  }

  async testUrgencyEvaluation() {
    console.log("\n🔄 Test: Évaluation complète d'urgence...");

    // Séquence de messages pour tester l'évaluation d'urgence
    const testSequence = [
      "J'ai très mal à la poitrine",
      "La douleur est très intense, je dirais 9 sur 10",
      "Ça a commencé il y a 30 minutes",
      "J'ai aussi du mal à respirer",
    ];

    let finalAssessment = null;

    for (const message of testSequence) {
      const response = await this.testSendMessage(message);
      if (response && response.urgencyAssessment) {
        finalAssessment = response.urgencyAssessment;
      }
      // Attendre un peu entre les messages
      await new Promise((resolve) => setTimeout(resolve, 1000));
    }

    if (finalAssessment && finalAssessment.urgencyLevel >= 8) {
      await this.log(
        "Détection urgence élevée",
        true,
        `Score final: ${finalAssessment.urgencyLevel}/10`
      );
      return true;
    } else {
      await this.log(
        "Détection urgence élevée",
        false,
        "Score d'urgence trop bas ou non détecté"
      );
      return false;
    }
  }

  async testGetConversationHistory() {
    if (!this.conversationId) {
      await this.log(
        "Récupération historique",
        false,
        "Pas de conversation active"
      );
      return false;
    }

    console.log("\n🔄 Test: Récupération de l'historique...");

    const result = await this.makeRequest(
      `/conversations/${this.conversationId}`
    );

    if (
      result.success &&
      result.data.messages &&
      result.data.messages.length > 0
    ) {
      await this.log(
        "Récupération historique",
        true,
        `${result.data.messages.length} messages trouvés`
      );
      return true;
    } else {
      await this.log("Récupération historique", false, "Aucun message trouvé");
      return false;
    }
  }

  async testPrioritizationService() {
    console.log("\n🔄 Test: Service de priorisation...");

    const result = await this.makeRequest("/tickets/priority-update", {
      method: "POST",
    });

    if (result.success) {
      await this.log("Service de priorisation", true, "Mise à jour effectuée");
      return true;
    } else {
      await this.log(
        "Service de priorisation",
        false,
        result.error || "Échec de mise à jour"
      );
      return false;
    }
  }

  async runAllTests() {
    console.log("🚀 Démarrage des tests du système de chat intelligent\n");
    console.log("============================================");

    const tests = [
      () => this.testCreateConversation(),
      () => this.testSendMessage("Bonjour, j'ai besoin d'aide"),
      () => this.testUrgencyEvaluation(),
      () => this.testGetConversationHistory(),
      () => this.testPrioritizationService(),
    ];

    let passedTests = 0;

    for (const test of tests) {
      try {
        const success = await test();
        if (success) passedTests++;
      } catch (error) {
        console.error("❌ Erreur lors du test:", error.message);
      }
    }

    // Résultats finaux
    console.log("\n============================================");
    console.log("📊 RÉSULTATS DES TESTS");
    console.log("============================================");
    console.log(`Tests réussis: ${passedTests}/${tests.length}`);
    console.log(
      `Taux de réussite: ${Math.round((passedTests / tests.length) * 100)}%`
    );

    if (passedTests === tests.length) {
      console.log(
        "🎉 Tous les tests ont réussi! Le système de chat est opérationnel."
      );
    } else {
      console.log(
        "⚠️  Certains tests ont échoué. Vérifiez la configuration du serveur."
      );
    }

    // Détails des résultats
    console.log("\n📝 DÉTAILS DES TESTS:");
    this.testResults.forEach((result) => {
      const status = result.success ? "✅" : "❌";
      console.log(`${status} ${result.test} - ${result.details}`);
    });

    return passedTests === tests.length;
  }
}

// Fonction utilitaire pour tester depuis la console du navigateur
window.testChatSystem = async function () {
  const tester = new ChatSystemTester();
  return await tester.runAllTests();
};

// Auto-exécution si ce script est chargé directement
if (typeof window !== "undefined") {
  console.log("💬 Script de test du système de chat chargé.");
  console.log("Utilisez testChatSystem() pour lancer tous les tests.");
  console.log("Assurez-vous d'avoir un token JWT valide dans TEST_TOKEN.");
} else {
  // Exécution en Node.js
  const tester = new ChatSystemTester();
  tester.runAllTests().then((success) => {
    process.exit(success ? 0 : 1);
  });
}

export { ChatSystemTester };
