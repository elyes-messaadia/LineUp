const Ticket = require('../models/Ticket');
const Conversation = require('../models/Conversation');
const logger = require('../utils/logger');

class PrioritizationService {
  constructor() {
    this.priorityWeights = {
      urgencyScore: 0.4,        // Score d'urgence IA (40%)
      waitingTime: 0.25,        // Temps d'attente (25%)
      patientType: 0.15,        // Type de patient (15%)
      conversationActivity: 0.10, // Activité de conversation (10%)
      medicalHistory: 0.10      // Historique médical (10%)
    };

    this.patientTypeMultipliers = {
      'emergency': 2.0,         // Urgences
      'priority': 1.5,          // Prioritaires (personnes âgées, handicapés)
      'regular': 1.0,           // Patients réguliers
      'followup': 0.8           // Suivi médical
    };
  }

  /**
   * Calcule le score de priorité pour un ticket donné
   */
  async calculatePriorityScore(ticketId) {
    try {
      const ticket = await Ticket.findById(ticketId).populate('userId');
      if (!ticket) {
        throw new Error('Ticket non trouvé');
      }

      let priorityScore = 0;
      const factors = {};

      // 1. Score d'urgence IA basé sur la conversation
      const urgencyFactor = await this.getUrgencyFactor(ticket);
      factors.urgency = urgencyFactor;
      priorityScore += urgencyFactor * this.priorityWeights.urgencyScore;

      // 2. Facteur temps d'attente
      const waitingFactor = this.getWaitingTimeFactor(ticket);
      factors.waitingTime = waitingFactor;
      priorityScore += waitingFactor * this.priorityWeights.waitingTime;

      // 3. Type de patient
      const patientTypeFactor = this.getPatientTypeFactor(ticket);
      factors.patientType = patientTypeFactor;
      priorityScore += patientTypeFactor * this.priorityWeights.patientType;

      // 4. Activité de conversation (messages récents, stress exprimé)
      const conversationFactor = await this.getConversationActivityFactor(ticket);
      factors.conversation = conversationFactor;
      priorityScore += conversationFactor * this.priorityWeights.conversationActivity;

      // 5. Historique médical (antécédents, traitements)
      const medicalHistoryFactor = await this.getMedicalHistoryFactor(ticket);
      factors.medicalHistory = medicalHistoryFactor;
      priorityScore += medicalHistoryFactor * this.priorityWeights.medicalHistory;

      // Normaliser le score final (0-10)
      const finalScore = Math.min(Math.max(priorityScore, 0), 10);

      logger.info({
        ticketId,
        finalScore,
        factors
      }, 'Score de priorité calculé');

      return {
        ticketId,
        priorityScore: Math.round(finalScore * 100) / 100,
        factors,
        calculatedAt: new Date()
      };

    } catch (error) {
      logger.error({ error, ticketId }, 'Erreur lors du calcul de priorité');
      return {
        ticketId,
        priorityScore: 5.0, // Score neutre par défaut
        factors: {},
        calculatedAt: new Date(),
        error: error.message
      };
    }
  }

  /**
   * Récupère le facteur d'urgence basé sur l'évaluation IA
   */
  async getUrgencyFactor(ticket) {
    try {
      const conversation = await Conversation.findOne({
        $or: [
          { patientId: ticket.userId },
          { ticketId: ticket._id }
        ]
      }).sort({ createdAt: -1 });

      if (!conversation || !conversation.aiAssessment) {
        return 5.0; // Score neutre si pas d'évaluation IA
      }

      const assessment = conversation.aiAssessment;
      
      // Convertir le score d'urgence IA (1-10) en facteur de priorité
      let urgencyFactor = assessment.urgencyScore || 5.0;

      // Bonus basé sur la recommandation
      switch (assessment.recommendedAction) {
        case 'consultation_immediate':
          urgencyFactor = Math.min(urgencyFactor * 1.3, 10);
          break;
        case 'teleconsultation':
          urgencyFactor = Math.min(urgencyFactor * 1.1, 10);
          break;
        case 'attendre':
          urgencyFactor = Math.max(urgencyFactor * 0.9, 1);
          break;
      }

      // Ajustement basé sur la confiance de l'IA
      const confidenceMultiplier = 0.7 + (assessment.confidenceScore * 0.3);
      urgencyFactor *= confidenceMultiplier;

      return Math.min(Math.max(urgencyFactor, 1), 10);

    } catch (error) {
      logger.error({ error, ticketId: ticket._id }, 'Erreur lors du calcul du facteur d\'urgence');
      return 5.0;
    }
  }

  /**
   * Calcule le facteur basé sur le temps d'attente
   */
  getWaitingTimeFactor(ticket) {
    const now = new Date();
    const createdAt = new Date(ticket.createdAt);
    const waitingMinutes = (now - createdAt) / (1000 * 60);

    // Facteur croissant avec le temps d'attente
    // 0-30 min: facteur 3-5
    // 30-60 min: facteur 5-7
    // 60+ min: facteur 7-10
    
    if (waitingMinutes <= 30) {
      return 3 + (waitingMinutes / 30) * 2; // 3-5
    } else if (waitingMinutes <= 60) {
      return 5 + ((waitingMinutes - 30) / 30) * 2; // 5-7
    } else {
      return Math.min(7 + ((waitingMinutes - 60) / 60) * 3, 10); // 7-10
    }
  }

  /**
   * Détermine le facteur basé sur le type de patient
   */
  getPatientTypeFactor(ticket) {
    // Analyser les informations du patient pour déterminer le type
    const patient = ticket.userId;
    
    if (!patient) {
      return 5.0; // Score neutre pour tickets sans utilisateur
    }

    let patientType = 'regular';
    let baseFactor = 5.0;

    // Déterminer le type basé sur les informations disponibles
    if (ticket.notes) {
      const notesLower = ticket.notes.toLowerCase();
      
      if (notesLower.includes('urgence') || notesLower.includes('douleur intense')) {
        patientType = 'emergency';
      } else if (notesLower.includes('prioritaire') || notesLower.includes('âgé')) {
        patientType = 'priority';
      } else if (notesLower.includes('suivi') || notesLower.includes('contrôle')) {
        patientType = 'followup';
      }
    }

    // Appliquer le multiplicateur
    const multiplier = this.patientTypeMultipliers[patientType] || 1.0;
    return Math.min(baseFactor * multiplier, 10);
  }

  /**
   * Évalue l'activité récente de conversation
   */
  async getConversationActivityFactor(ticket) {
    try {
      const conversation = await Conversation.findOne({
        $or: [
          { patientId: ticket.userId },
          { ticketId: ticket._id }
        ]
      }).sort({ createdAt: -1 });

      if (!conversation) {
        return 3.0; // Score faible sans conversation
      }

      let activityFactor = 5.0;

      // Analyser l'activité récente (dernières 30 minutes)
      const thirtyMinutesAgo = new Date(Date.now() - 30 * 60 * 1000);
      const recentMessages = conversation.messages.filter(
        msg => msg.timestamp > thirtyMinutesAgo && msg.sender === 'patient'
      );

      // Plus de messages récents = plus d'urgence perçue
      if (recentMessages.length > 3) {
        activityFactor += 2;
      } else if (recentMessages.length > 1) {
        activityFactor += 1;
      }

      // Analyser le contenu pour des mots d'urgence
      const urgencyKeywords = ['urgent', 'douleur', 'mal', 'inquiet', 'peur', 'aide'];
      const hasUrgencyKeywords = conversation.messages
        .filter(msg => msg.sender === 'patient')
        .some(msg => 
          urgencyKeywords.some(keyword => 
            msg.content.toLowerCase().includes(keyword)
          )
        );

      if (hasUrgencyKeywords) {
        activityFactor += 1;
      }

      // Bonus si la conversation est récente
      const conversationAge = (Date.now() - conversation.createdAt) / (1000 * 60);
      if (conversationAge < 15) {
        activityFactor += 1;
      }

      return Math.min(Math.max(activityFactor, 1), 10);

    } catch (error) {
      logger.error({ error, ticketId: ticket._id }, 'Erreur lors du calcul du facteur d\'activité');
      return 5.0;
    }
  }

  /**
   * Évalue l'historique médical (placeholder pour future intégration)
   */
  async getMedicalHistoryFactor(ticket) {
    // Pour l'instant, facteur neutre
    // Dans le futur, intégrer avec un système de dossiers médicaux
    let historyFactor = 5.0;

    // Analyser les notes du ticket pour des indices d'historique
    if (ticket.notes) {
      const notesLower = ticket.notes.toLowerCase();
      
      const riskKeywords = [
        'diabète', 'cardiaque', 'hypertension', 'allergie', 
        'chronique', 'traitement', 'médicament'
      ];

      const hasRiskFactors = riskKeywords.some(keyword => 
        notesLower.includes(keyword)
      );

      if (hasRiskFactors) {
        historyFactor += 1.5;
      }
    }

    return Math.min(historyFactor, 10);
  }

  /**
   * Met à jour les priorités de tous les tickets en attente
   */
  async updateAllPriorities(doctorId = null) {
    try {
      const filter = { 
        statut: { $in: ['en-attente', 'en-cours'] }
      };
      
      if (doctorId) {
        filter.docteur = doctorId;
      }

      const tickets = await Ticket.find(filter);
      const priorityUpdates = [];

      for (const ticket of tickets) {
        const priorityData = await this.calculatePriorityScore(ticket._id);
        
        // Mettre à jour le ticket avec le nouveau score
        await Ticket.findByIdAndUpdate(ticket._id, {
          priorityScore: priorityData.priorityScore,
          priorityFactors: priorityData.factors,
          lastPriorityUpdate: new Date()
        });

        priorityUpdates.push(priorityData);
      }

      logger.info({ 
        ticketsUpdated: priorityUpdates.length,
        doctorId 
      }, 'Priorités mises à jour');

      return priorityUpdates;

    } catch (error) {
      logger.error({ error, doctorId }, 'Erreur lors de la mise à jour des priorités');
      throw error;
    }
  }

  /**
   * Récupère les tickets triés par priorité
   */
  async getPrioritizedTickets(doctorId, limit = 50) {
    try {
      const tickets = await Ticket.find({
        docteur: doctorId,
        statut: { $in: ['en-attente', 'en-cours'] }
      })
      .populate('userId', 'name email')
      .sort({ 
        priorityScore: -1,  // Score le plus élevé en premier
        createdAt: 1        // Puis par ancienneté
      })
      .limit(limit);

      return tickets;

    } catch (error) {
      logger.error({ error, doctorId }, 'Erreur lors de la récupération des tickets priorisés');
      throw error;
    }
  }

  /**
   * Planifie la mise à jour automatique des priorités
   */
  startPriorityUpdateScheduler() {
    // Mettre à jour les priorités toutes les 5 minutes
    setInterval(async () => {
      try {
        await this.updateAllPriorities();
      } catch (error) {
        logger.error({ error }, 'Erreur lors de la mise à jour automatique des priorités');
      }
    }, 5 * 60 * 1000); // 5 minutes

    logger.info('Planificateur de mise à jour des priorités démarré');
  }
}

module.exports = PrioritizationService;