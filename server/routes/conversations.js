const express = require("express");
const router = express.Router();
const Conversation = require("../models/Conversation");
const ChatbotAI = require("../services/ChatbotAI");
const { authenticateRequired, authenticateToken } = require("../middlewares/auth");
const logger = require("../utils/logger");

const chatbot = new ChatbotAI();

/**
 * POST /api/conversations/start
 * Démarre une nouvelle conversation avec le chatbot IA
 */
router.post("/start", authenticateRequired, async (req, res) => {
  try {
    const { ticketId } = req.body;
    const patientId = req.user._id;

    // Vérifier s'il existe déjà une conversation active
    const existingConversation = await Conversation.findActiveByPatient(
      patientId
    );
    if (existingConversation) {
      return res.json({
        success: true,
        conversation: existingConversation,
        message: "Vous avez déjà une conversation en cours.",
      });
    }

    // Démarrer la conversation avec le chatbot
    const chatbotResponse = await chatbot.startConversation(patientId);

    // Créer la nouvelle conversation
    const conversation = new Conversation({
      patientId,
      ticketId,
      status: "en_attente",
      urgencyLevel: 5, // Score initial neutre
      messages: [
        {
          sender: "ia",
          content: chatbotResponse.message,
          metadata: {
            type: chatbotResponse.type,
            options: chatbotResponse.options,
            conversationState: chatbotResponse.conversationState,
          },
        },
      ],
    });

    await conversation.save();

    logger.info(
      {
        patientId,
        conversationId: conversation._id,
      },
      "Nouvelle conversation démarrée"
    );

    res.status(201).json({
      success: true,
      conversation: {
        _id: conversation._id,
        status: conversation.status,
        urgencyLevel: conversation.urgencyLevel,
        messages: conversation.messages,
        createdAt: conversation.createdAt,
      },
      chatbotResponse,
    });
  } catch (error) {
    logger.error(
      { error, patientId: req.user._id },
      "Erreur lors du démarrage de conversation"
    );
    res.status(500).json({
      success: false,
      message: "Erreur lors du démarrage de la conversation",
    });
  }
});

/**
 * GET /api/conversations/:id
 * Récupère une conversation spécifique
 */
router.get("/:id", authenticateRequired, async (req, res) => {
  try {
    const conversationId = req.params.id;
    const patientId = req.user._id;

    const conversation = await Conversation.findOne({
      _id: conversationId,
      patientId,
    }).populate("patientId", "name email");

    if (!conversation) {
      return res.status(404).json({
        success: false,
        message: "Conversation non trouvée",
      });
    }

    res.json({
      success: true,
      conversation,
    });
  } catch (error) {
    logger.error(
      { error, conversationId: req.params.id },
      "Erreur lors de la récupération de conversation"
    );
    res.status(500).json({
      success: false,
      message: "Erreur lors de la récupération de la conversation",
    });
  }
});

/**
 * POST /api/conversations/:id/messages
 * Envoie un message dans une conversation
 */
router.post("/:id/messages", authenticateRequired, async (req, res) => {
  try {
    const conversationId = req.params.id;
    const patientId = req.user._id;
    const { content, metadata = {} } = req.body;

    // Validation
    if (!content || content.trim().length === 0) {
      return res.status(400).json({
        success: false,
        message: "Le contenu du message est requis",
      });
    }

    // Récupérer la conversation
    const conversation = await Conversation.findOne({
      _id: conversationId,
      patientId,
    });

    if (!conversation) {
      return res.status(404).json({
        success: false,
        message: "Conversation non trouvée",
      });
    }

    if (conversation.status === "termine") {
      return res.status(400).json({
        success: false,
        message: "Cette conversation est terminée",
      });
    }

    // Ajouter le message du patient
    await conversation.addMessage("patient", content, metadata);

    // Traiter la réponse avec le chatbot si la conversation est avec l'IA
    let chatbotResponse = null;
    if (conversation.status === "en_attente") {
      const lastIAMessage = conversation.messages
        .filter((m) => m.sender === "ia")
        .pop();

      const conversationState =
        lastIAMessage?.metadata?.conversationState || "unknown";

      // Construire l'historique de conversation pour l'IA
      const conversationHistory = conversation.messages
        .filter((m) => m.sender === "patient")
        .map((m) => ({
          content: m.content,
          metadata: m.metadata,
          timestamp: m.timestamp,
        }));

      chatbotResponse = await chatbot.processResponse(
        conversationState,
        content,
        conversationHistory
      );

      // Ajouter la réponse du chatbot
      if (chatbotResponse) {
        await conversation.addMessage("ia", chatbotResponse.message, {
          type: chatbotResponse.type,
          options: chatbotResponse.options,
          conversationState: chatbotResponse.conversationState,
        });

        // Mettre à jour l'évaluation d'urgence si disponible
        if (chatbotResponse.urgencyAssessment) {
          conversation.urgencyLevel =
            chatbotResponse.urgencyAssessment.urgencyScore;
          conversation.aiAssessment = chatbotResponse.urgencyAssessment;

          // Marquer comme terminé si l'évaluation est complète
          if (chatbotResponse.conversationState === "completed") {
            conversation.status = "termine";
          }

          await conversation.save();
        }
      }
    }

    // Recharger la conversation pour avoir les derniers messages
    const updatedConversation = await Conversation.findById(conversationId);

    logger.info(
      {
        conversationId,
        patientId,
        messageLength: content.length,
      },
      "Message ajouté à la conversation"
    );

    res.json({
      success: true,
      conversation: updatedConversation,
      chatbotResponse,
    });
  } catch (error) {
    logger.error(
      {
        error,
        conversationId: req.params.id,
        patientId: req.user._id,
      },
      "Erreur lors de l'envoi de message"
    );

    res.status(500).json({
      success: false,
      message: "Erreur lors de l'envoi du message",
    });
  }
});

/**
 * GET /api/conversations/:id/messages
 * Récupère l'historique des messages d'une conversation
 */
router.get("/:id/messages", authenticateRequired, async (req, res) => {
  try {
    const conversationId = req.params.id;
    const patientId = req.user._id;
    const { limit = 50, offset = 0 } = req.query;

    const conversation = await Conversation.findOne({
      _id: conversationId,
      patientId,
    });

    if (!conversation) {
      return res.status(404).json({
        success: false,
        message: "Conversation non trouvée",
      });
    }

    // Pagination des messages
    const messages = conversation.messages
      .slice(parseInt(offset), parseInt(offset) + parseInt(limit))
      .map((message) => ({
        _id: message._id,
        sender: message.sender,
        content: message.content,
        timestamp: message.timestamp,
        metadata: message.metadata,
      }));

    res.json({
      success: true,
      messages,
      total: conversation.messages.length,
      hasMore:
        parseInt(offset) + parseInt(limit) < conversation.messages.length,
    });
  } catch (error) {
    logger.error(
      { error, conversationId: req.params.id },
      "Erreur lors de la récupération des messages"
    );
    res.status(500).json({
      success: false,
      message: "Erreur lors de la récupération des messages",
    });
  }
});

/**
 * PUT /api/conversations/:id/status
 * Met à jour le statut d'une conversation
 */
router.put("/:id/status", authenticateRequired, async (req, res) => {
  try {
    const conversationId = req.params.id;
    const patientId = req.user._id;
    const { status } = req.body;

    // Validation du statut
    const validStatuses = ["en_attente", "en_cours", "termine"];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: "Statut invalide",
      });
    }

    const conversation = await Conversation.findOneAndUpdate(
      { _id: conversationId, patientId },
      { status, updatedAt: new Date() },
      { new: true }
    );

    if (!conversation) {
      return res.status(404).json({
        success: false,
        message: "Conversation non trouvée",
      });
    }

    logger.info(
      {
        conversationId,
        patientId,
        newStatus: status,
      },
      "Statut de conversation mis à jour"
    );

    res.json({
      success: true,
      conversation,
    });
  } catch (error) {
    logger.error(
      { error, conversationId: req.params.id },
      "Erreur lors de la mise à jour du statut"
    );
    res.status(500).json({
      success: false,
      message: "Erreur lors de la mise à jour du statut",
    });
  }
});

/**
 * GET /api/conversations
 * Liste les conversations du patient connecté
 */
router.get("/", authenticateRequired, async (req, res) => {
  try {
    const patientId = req.user._id;
    const { status, limit = 10, offset = 0 } = req.query;

    const filter = {
      patientId,
      isArchived: false,
    };

    if (status) {
      filter.status = status;
    }

    const conversations = await Conversation.find(filter)
      .sort({ lastMessageAt: -1 })
      .limit(parseInt(limit))
      .skip(parseInt(offset))
      .select(
        "status urgencyLevel createdAt lastMessageAt messageCount aiAssessment"
      );

    const total = await Conversation.countDocuments(filter);

    res.json({
      success: true,
      conversations,
      total,
      hasMore: parseInt(offset) + parseInt(limit) < total,
    });
  } catch (error) {
    logger.error(
      { error, patientId: req.user._id },
      "Erreur lors de la récupération des conversations"
    );
    res.status(500).json({
      success: false,
      message: "Erreur lors de la récupération des conversations",
    });
  }
});

/**
 * POST /api/conversations/:id/assess
 * Force une nouvelle évaluation d'urgence par l'IA
 */
router.post("/:id/assess", authenticateRequired, async (req, res) => {
  try {
    const conversationId = req.params.id;
    const patientId = req.user._id;

    const conversation = await Conversation.findOne({
      _id: conversationId,
      patientId,
    });

    if (!conversation) {
      return res.status(404).json({
        success: false,
        message: "Conversation non trouvée",
      });
    }

    // Extraire l'historique des messages du patient
    const conversationHistory = conversation.messages
      .filter((m) => m.sender === "patient")
      .map((m) => ({
        content: m.content,
        metadata: m.metadata,
        timestamp: m.timestamp,
      }));

    // Calculer une nouvelle évaluation
    const assessment = await chatbot.calculateUrgency(conversationHistory);

    // Mettre à jour la conversation
    conversation.urgencyLevel = assessment.urgencyScore;
    conversation.aiAssessment = assessment;
    await conversation.save();

    logger.info(
      {
        conversationId,
        patientId,
        newUrgencyLevel: assessment.urgencyScore,
      },
      "Évaluation d'urgence recalculée"
    );

    res.json({
      success: true,
      assessment,
      conversation: {
        _id: conversation._id,
        urgencyLevel: conversation.urgencyLevel,
        aiAssessment: conversation.aiAssessment,
      },
    });
  } catch (error) {
    logger.error(
      { error, conversationId: req.params.id },
      "Erreur lors de la réévaluation"
    );
    res.status(500).json({
      success: false,
      message: "Erreur lors de la réévaluation d'urgence",
    });
  }
});

module.exports = router;
