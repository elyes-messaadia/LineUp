const logger = require('../utils/logger');

class ChatbotAI {
  constructor() {
    this.questions = {
      welcome: {
        text: "Bonjour ! Je suis l'assistant virtuel de LineUp. Pour mieux vous aider et évaluer votre situation, j'aimerais vous poser quelques questions. Sur une échelle de 1 à 10, comment évalueriez-vous votre niveau de douleur actuel ?",
        type: 'pain_level',
        options: Array.from({length: 10}, (_, i) => ({
          value: i + 1,
          label: `${i + 1}${i === 0 ? ' (aucune douleur)' : i === 9 ? ' (douleur extrême)' : ''}`
        }))
      },
      
      symptoms_urgent: {
        text: "Je comprends que vous ressentez une douleur importante. Pouvez-vous me dire quels symptômes vous ressentez actuellement ?",
        type: 'symptoms',
        options: [
          { value: 'chest_pain', label: 'Douleur thoracique', severity: 'urgent' },
          { value: 'breathing_difficulty', label: 'Difficulté à respirer', severity: 'urgent' },
          { value: 'severe_headache', label: 'Maux de tête sévères', severity: 'urgent' },
          { value: 'abdominal_pain', label: 'Douleur abdominale intense', severity: 'high' },
          { value: 'fever_high', label: 'Fièvre élevée (>39°C)', severity: 'high' },
          { value: 'other', label: 'Autre symptôme', severity: 'medium' }
        ]
      },

      symptoms_moderate: {
        text: "Merci pour cette information. Depuis combien de temps ressentez-vous ces symptômes ?",
        type: 'duration',
        options: [
          { value: 'less_1h', label: 'Moins d\'1 heure', multiplier: 1.5 },
          { value: '1_6h', label: '1 à 6 heures', multiplier: 1.3 },
          { value: '6_24h', label: '6 à 24 heures', multiplier: 1.1 },
          { value: '1_3days', label: '1 à 3 jours', multiplier: 1.0 },
          { value: 'more_3days', label: 'Plus de 3 jours', multiplier: 0.8 }
        ]
      },

      stress_assessment: {
        text: "Je comprends que cela puisse être préoccupant. Sur une échelle de 1 à 10, comment évalueriez-vous votre niveau de stress ou d'anxiété concernant votre état ?",
        type: 'stress_level',
        options: Array.from({length: 10}, (_, i) => ({
          value: i + 1,
          label: `${i + 1}${i === 0 ? ' (très calme)' : i === 9 ? ' (très anxieux)' : ''}`
        }))
      },

      context_questions: {
        text: "Avez-vous des antécédents médicaux ou prenez-vous des médicaments que je devrais connaître ?",
        type: 'medical_context',
        options: [
          { value: 'chronic_condition', label: 'Maladie chronique connue', factor: 1.2 },
          { value: 'medications', label: 'Prise de médicaments réguliers', factor: 1.1 },
          { value: 'allergies', label: 'Allergies importantes', factor: 1.1 },
          { value: 'recent_surgery', label: 'Chirurgie récente', factor: 1.3 },
          { value: 'none', label: 'Aucun antécédent particulier', factor: 1.0 }
        ]
      }
    };

    this.urgencyThresholds = {
      immediate: 8.5,    // Consultation immédiate nécessaire
      high: 6.5,         // Priorité élevée
      medium: 4.0,       // Priorité normale
      low: 2.0           // Peut attendre
    };
  }

  /**
   * Point d'entrée principal pour démarrer une conversation
   */
  async startConversation(patientId) {
    try {
      const welcomeMessage = this.questions.welcome;
      
      logger.info({ patientId }, 'Nouvelle conversation IA démarrée');
      
      return {
        message: welcomeMessage.text,
        type: welcomeMessage.type,
        options: welcomeMessage.options,
        conversationState: 'pain_assessment'
      };
    } catch (error) {
      logger.error({ error, patientId }, 'Erreur lors du démarrage de conversation');
      return this.getErrorResponse();
    }
  }

  /**
   * Traite la réponse du patient et détermine la prochaine question
   */
  async processResponse(conversationState, userResponse, conversationHistory = []) {
    try {
      const response = {
        message: '',
        type: '',
        options: [],
        conversationState: '',
        urgencyAssessment: null
      };

      switch (conversationState) {
        case 'pain_assessment':
          return this.handlePainAssessment(userResponse, conversationHistory);
          
        case 'symptoms_urgent':
          return this.handleSymptomsUrgent(userResponse, conversationHistory);
          
        case 'symptoms_moderate':
          return this.handleSymptomsModerate(userResponse, conversationHistory);
          
        case 'duration_assessment':
          return this.handleDurationAssessment(userResponse, conversationHistory);
          
        case 'stress_assessment':
          return this.handleStressAssessment(userResponse, conversationHistory);
          
        case 'context_assessment':
          return this.handleContextAssessment(userResponse, conversationHistory);
          
        default:
          return this.getFinalAssessment(conversationHistory);
      }
    } catch (error) {
      logger.error({ error, conversationState }, 'Erreur lors du traitement de réponse');
      return this.getErrorResponse();
    }
  }

  /**
   * Gère l'évaluation initiale de la douleur
   */
  handlePainAssessment(painLevel, history) {
    const level = parseInt(painLevel);
    
    if (level >= 8) {
      // Douleur sévère - questions urgentes
      const response = this.questions.symptoms_urgent;
      return {
        message: response.text,
        type: response.type,
        options: response.options,
        conversationState: 'symptoms_urgent',
        urgencyAssessment: null
      };
    } else if (level >= 5) {
      // Douleur modérée - questions sur la durée
      const response = this.questions.symptoms_moderate;
      return {
        message: response.text,
        type: response.type,
        options: response.options,
        conversationState: 'duration_assessment',
        urgencyAssessment: null
      };
    } else {
      // Douleur faible - évaluation du stress
      const response = this.questions.stress_assessment;
      return {
        message: response.text,
        type: response.type,
        options: response.options,
        conversationState: 'stress_assessment',
        urgencyAssessment: null
      };
    }
  }

  /**
   * Gère les symptômes urgents (douleur élevée)
   */
  handleSymptomsUrgent(symptoms, history) {
    const urgentSymptoms = ['chest_pain', 'breathing_difficulty', 'severe_headache'];
    const hasUrgentSymptom = symptoms.some(s => urgentSymptoms.includes(s));
    
    if (hasUrgentSymptom) {
      // Évaluation immédiate requise
      const assessment = this.calculateUrgency(history.concat([{ symptoms }]));
      return {
        message: "Basé sur vos symptômes, je recommande fortement une consultation médicale immédiate. Votre situation nécessite une attention urgente.",
        type: 'final_assessment',
        options: [],
        conversationState: 'completed',
        urgencyAssessment: {
          ...assessment,
          recommendedAction: 'consultation_immediate',
          reasoning: 'Symptômes critiques détectés nécessitant une évaluation médicale urgente'
        }
      };
    } else {
      // Continuer avec l'évaluation du contexte
      const response = this.questions.context_questions;
      return {
        message: response.text,
        type: response.type,
        options: response.options,
        conversationState: 'context_assessment',
        urgencyAssessment: null
      };
    }
  }

  /**
   * Gère l'évaluation de la durée (douleur modérée)
   */
  handleDurationAssessment(duration, history) {
    const response = this.questions.context_questions;
    return {
      message: response.text,
      type: response.type,
      options: response.options,
      conversationState: 'context_assessment',
      urgencyAssessment: null
    };
  }

  /**
   * Gère l'évaluation du stress (douleur faible)
   */
  handleStressAssessment(stressLevel, history) {
    const level = parseInt(stressLevel);
    
    if (level >= 7) {
      return {
        message: "Je comprends que vous êtes anxieux concernant votre état. Même si vos symptômes semblent moins urgents, votre niveau d'inquiétude est important. Une consultation peut vous rassurer.",
        type: 'stress_response',
        options: [],
        conversationState: 'context_assessment',
        urgencyAssessment: null
      };
    } else {
      const response = this.questions.context_questions;
      return {
        message: response.text,
        type: response.type,
        options: response.options,
        conversationState: 'context_assessment',
        urgencyAssessment: null
      };
    }
  }

  /**
   * Gère l'évaluation du contexte médical
   */
  handleContextAssessment(context, history) {
    const assessment = this.calculateUrgency(history.concat([{ context }]));
    return this.generateFinalResponse(assessment, history);
  }

  /**
   * Calcule le score d'urgence basé sur l'historique de conversation
   */
  calculateUrgency(conversationHistory) {
    let baseScore = 5.0; // Score de base
    let factors = {
      pain: 1.0,
      symptoms: 1.0,
      duration: 1.0,
      stress: 1.0,
      context: 1.0
    };

    // Analyser l'historique pour extraire les facteurs
    conversationHistory.forEach(entry => {
      if (entry.painLevel) {
        const pain = parseInt(entry.painLevel);
        baseScore = pain;
        factors.pain = pain / 10;
      }
      
      if (entry.symptoms) {
        const urgentSymptoms = entry.symptoms.filter(s => 
          ['chest_pain', 'breathing_difficulty', 'severe_headache'].includes(s)
        );
        if (urgentSymptoms.length > 0) {
          factors.symptoms = 1.5;
        }
      }
      
      if (entry.duration) {
        const durationOption = this.questions.symptoms_moderate.options
          .find(opt => opt.value === entry.duration);
        if (durationOption) {
          factors.duration = durationOption.multiplier;
        }
      }
      
      if (entry.stressLevel) {
        const stress = parseInt(entry.stressLevel);
        factors.stress = 1 + (stress / 20); // Ajustement léger basé sur le stress
      }
      
      if (entry.context) {
        const contextOption = this.questions.context_questions.options
          .find(opt => opt.value === entry.context);
        if (contextOption) {
          factors.context = contextOption.factor;
        }
      }
    });

    // Calcul du score final
    const finalScore = baseScore * factors.symptoms * factors.duration * factors.context * factors.stress;
    
    // Déterminer le niveau d'urgence
    let urgencyLevel = 'low';
    let recommendedAction = 'attendre';
    
    if (finalScore >= this.urgencyThresholds.immediate) {
      urgencyLevel = 'immediate';
      recommendedAction = 'consultation_immediate';
    } else if (finalScore >= this.urgencyThresholds.high) {
      urgencyLevel = 'high';
      recommendedAction = 'consultation_immediate';
    } else if (finalScore >= this.urgencyThresholds.medium) {
      urgencyLevel = 'medium';
      recommendedAction = 'teleconsultation';
    }

    return {
      urgencyScore: Math.round(finalScore * 10) / 10,
      urgencyLevel,
      recommendedAction,
      confidenceScore: this.calculateConfidence(conversationHistory),
      factors
    };
  }

  /**
   * Calcule le niveau de confiance de l'évaluation
   */
  calculateConfidence(conversationHistory) {
    let confidence = 0.7; // Confiance de base
    
    // Plus il y a d'informations, plus la confiance augmente
    if (conversationHistory.length >= 3) confidence += 0.2;
    if (conversationHistory.length >= 4) confidence += 0.1;
    
    return Math.min(confidence, 0.95); // Maximum 95% de confiance
  }

  /**
   * Génère la réponse finale avec recommandations
   */
  generateFinalResponse(assessment, history) {
    let message = '';
    
    switch (assessment.recommendedAction) {
      case 'consultation_immediate':
        message = `Basé sur votre évaluation, je recommande une consultation médicale ${assessment.urgencyLevel === 'immediate' ? 'immédiate' : 'prioritaire'}. Votre score d'urgence est de ${assessment.urgencyScore}/10.`;
        break;
      case 'teleconsultation':
        message = `Votre situation mérite attention. Je recommande une téléconsultation ou une consultation dans les prochaines heures. Score d'urgence: ${assessment.urgencyScore}/10.`;
        break;
      case 'attendre':
        message = `Votre situation semble stable pour le moment. Vous pouvez attendre votre tour normalement, mais n'hésitez pas à me recontacter si vos symptômes s'aggravent. Score: ${assessment.urgencyScore}/10.`;
        break;
    }

    message += ` Un membre de notre équipe médicale reviendra vers vous en conséquence de cette évaluation.`;

    return {
      message,
      type: 'final_assessment',
      options: [],
      conversationState: 'completed',
      urgencyAssessment: assessment
    };
  }

  /**
   * Réponse d'erreur par défaut
   */
  getErrorResponse() {
    return {
      message: "Je rencontre des difficultés techniques. Un membre de notre équipe va prendre le relais pour vous aider.",
      type: 'error',
      options: [],
      conversationState: 'error',
      urgencyAssessment: {
        urgencyScore: 5.0,
        urgencyLevel: 'medium',
        recommendedAction: 'teleconsultation',
        confidenceScore: 0.3,
        reasoning: 'Évaluation impossible due à une erreur technique'
      }
    };
  }
}

module.exports = ChatbotAI;