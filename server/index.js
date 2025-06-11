const express = require("express");
const cors = require("cors");
const connectDB = require("./config/db");
const patientRoutes = require("./routes/patient");
const authRoutes = require("./routes/auth");
const { authenticateOptional } = require("./middlewares/auth");
const Ticket = require("./models/Ticket");
const { notifyNewTicket } = require("./controllers/notificationController");
require("dotenv").config();

const app = express();
const PORT = process.env.PORT || 5000;

// Configuration CORS
const allowedOrigins = [
  'https://ligneup.netlify.app',
  'https://lineup.netlify.app',
  'https://lineup-app.netlify.app',
  'http://localhost:5173',
  'http://localhost:5174',
  'http://localhost:3000',
  'https://lineup-backend-xxak.onrender.com'
];

app.use(cors({
  origin: function(origin, callback) {
    // En développement, accepter toutes les origines
    if (process.env.NODE_ENV !== 'production') {
      return callback(null, true);
    }
    
    // En production, vérifier les origines
    if (!origin || allowedOrigins.includes(origin) || origin.endsWith('.netlify.app')) {
      callback(null, true);
    } else {
      console.log('❌ Origine refusée:', origin);
      callback(null, true); // Accepter quand même pour déboguer
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  exposedHeaders: ['Content-Range', 'X-Content-Range'],
  maxAge: 600 // Cache les résultats du pre-flight pendant 10 minutes
}));

app.use(express.json());

// 🏥 Route de santé pour Render
app.get('/', (req, res) => {
  res.json({ 
    message: '✅ API LineUp opérationnelle',
    status: 'healthy',
    timestamp: new Date().toISOString(),
    version: '2.0.0'
  });
});

// 🔍 Route de test CORS
app.get('/health', (req, res) => {
  res.json({ 
    status: 'OK',
    cors: 'enabled',
    origin: req.headers.origin || 'no-origin'
  });
});

connectDB();

// 🔐 Routes d'authentification centralisées
app.use("/auth", authRoutes);

// 🎫 Créer un ticket (version améliorée avec support tickets physiques)
app.post("/ticket", authenticateOptional, async (req, res) => {
  try {
    const { docteur, userId, patientName, ticketType, notes } = req.body;
    
    // Si l'utilisateur est authentifié, utiliser ses informations
    let finalUserId = null;
    let finalDocteur = docteur;
    
    if (req.user) {
      // Utilisateur authentifié : utiliser son ID
      finalUserId = req.user._id;
      
      // Pour les patients authentifiés, le docteur n'est pas obligatoire (sera assigné par défaut)
      if (req.user.role.name === 'patient' && !docteur) {
        finalDocteur = 'dr-husni-said-habibi'; // Docteur par défaut
      }
    } else {
      // Mode anonyme : vérifier que le docteur est spécifié
      if (!docteur) {
        return res.status(400).json({ 
          success: false,
          message: "Le champ 'docteur' est requis pour les tickets anonymes"
        });
      }
      finalUserId = userId || null;
    }

    // Validation du docteur
    if (!['dr-husni-said-habibi', 'dr-helios-blasco', 'dr-jean-eric-panacciulli'].includes(finalDocteur)) {
      return res.status(400).json({ 
        success: false,
        message: "Le docteur doit être l'un des suivants : Dr. Husni SAID HABIBI, Dr. Helios BLASCO, Dr. Jean-Eric PANACCIULLI"
      });
    }

    // Vérifier si l'utilisateur authentifié a déjà un ticket en cours
    // (sauf pour les secrétaires qui peuvent créer sans limite)
    if (req.user && req.user.role.name !== 'secretaire') {
      const existingTicket = await Ticket.findOne({
        userId: req.user._id,
        status: { $in: ['en_attente', 'en_consultation'] }
      });
      
      if (existingTicket) {
        return res.status(400).json({
          success: false,
          message: "Vous avez déjà un ticket en cours",
          existingTicket: {
            _id: existingTicket._id,
            number: existingTicket.number,
            status: existingTicket.status,
            docteur: existingTicket.docteur,
            createdAt: existingTicket.createdAt
          }
        });
      }
    }

    // Générer un sessionId unique
    const sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    // Capturer les métadonnées
    const metadata = {
      ipAddress: req.ip || req.connection.remoteAddress,
      userAgent: req.headers['user-agent'],
      device: req.headers['sec-ch-ua-platform'] || 'unknown'
    };

    // Obtenir le dernier numéro de ticket
    const lastTicket = await Ticket.findOne().sort({ number: -1 });
    const nextNumber = lastTicket ? lastTicket.number + 1 : 1;

    // Déterminer le type de ticket et qui l'a créé
    let finalTicketType = ticketType || "numerique";
    let finalCreatedBy = "patient";
    
    // Si c'est une secrétaire authentifiée qui crée le ticket
    if (req.user && req.user.role.name === 'secretaire') {
      finalCreatedBy = "secretary";
      // Pas de limite pour les secrétaires
    }
    
    // Validation du nom patient pour tickets physiques
    if (finalTicketType === "physique" && !patientName) {
      return res.status(400).json({
        success: false,
        message: "Le nom du patient est requis pour les tickets physiques"
      });
    }

    // Créer le nouveau ticket
    const ticket = new Ticket({ 
      number: nextNumber,
      docteur: finalDocteur,
      sessionId,
      userId: finalUserId,
      patientName: patientName || null,
      ticketType: finalTicketType,
      createdBy: finalCreatedBy,
      notes: notes || null,
      metadata
    });

    // Sauvegarder le ticket
    await ticket.save();

    // Envoyer notification push si utilisateur authentifié
    if (req.user && req.user._id) {
      try {
        await notifyNewTicket(ticket._id);
        console.log(`🔔 Notification push envoyée pour ticket n°${ticket.number}`);
      } catch (notificationError) {
        console.error('⚠️ Erreur notification push:', notificationError);
        // Ne pas faire échouer la création du ticket pour une erreur de notification
      }
    }

    // Réponse avec succès
    res.status(201).json({
      success: true,
      ticket,
      message: "Ticket créé avec succès"
    });
    
  } catch (err) {
    console.error("❌ Erreur création ticket:", err);
    
    // Gestion spécifique des erreurs de validation Mongoose
    if (err.name === 'ValidationError') {
      return res.status(400).json({
        success: false,
        message: "Erreur de validation",
        errors: Object.values(err.errors).map(e => e.message)
      });
    }
    
    // Gestion des erreurs de duplication
    if (err.code === 11000) {
      return res.status(409).json({
        success: false,
        message: "Un ticket avec ce numéro existe déjà"
      });
    }
    
    // Erreur générique
    res.status(500).json({ 
      success: false,
      message: "Erreur lors de la création du ticket",
      error: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
  }
});

// 🔍 Vérifier l'existence d'un ticket
app.get("/ticket/:id", async (req, res) => {
  try {
    let ticket;
    // Si un sessionId est fourni, chercher aussi par sessionId
    if (req.query.sessionId) {
      ticket = await Ticket.findOne({
        $or: [
          { _id: req.params.id },
          { sessionId: req.query.sessionId }
        ]
      });
    } else {
      ticket = await Ticket.findById(req.params.id);
    }
    
    if (!ticket) {
      return res.status(404).json({ message: "Ticket non trouvé" });
    }
    res.json(ticket);
  } catch (err) {
    console.error("❌ Erreur vérification ticket:", err);
    res.status(500).json({ message: "Erreur serveur" });
  }
});

// 📋 Obtenir la file d'attente (globale ou par docteur)
app.get("/queue", async (req, res) => {
  try {
    const { docteur } = req.query;
    let query = {};
    
    // Si un docteur est spécifié, filtrer par docteur
    if (docteur) {
      if (!['dr-husni-said-habibi', 'dr-helios-blasco', 'dr-jean-eric-panacciulli'].includes(docteur)) {
        return res.status(400).json({ 
          success: false,
          message: "Docteur non valide" 
        });
      }
      query.docteur = docteur;
    }
    
    const queue = await Ticket.find(query).sort({ createdAt: 1 });
    res.json(queue);
  } catch (error) {
    console.error("Erreur lors de la récupération de la file:", error);
    res.status(500).json({ message: "Erreur de récupération" });
  }
});

// 🗑️ Désister un ticket
app.delete("/ticket/:id", async (req, res) => {
  try {
    let ticket;
    // Si un sessionId est fourni, vérifier qu'il correspond
    if (req.query.sessionId) {
      ticket = await Ticket.findOne({
        $or: [
          { _id: req.params.id, sessionId: req.query.sessionId },
          { sessionId: req.query.sessionId }
        ]
      });
    } else {
      ticket = await Ticket.findById(req.params.id);
    }

    if (!ticket) {
      return res.status(404).json({ message: "Ticket non trouvé" });
    }

    ticket.status = "desiste";
    await ticket.save();
    res.json({ updated: ticket });
  } catch (error) {
    console.error("Erreur lors de l'annulation:", error);
    res.status(500).json({ message: "Erreur lors de l'annulation" });
  }
});

// 🔄 Reprendre un ticket désisté
app.patch("/ticket/:id/resume", async (req, res) => {
  try {
    let ticket;
    // Si un sessionId est fourni, vérifier qu'il correspond
    if (req.query.sessionId) {
      ticket = await Ticket.findOne({
        $or: [
          { _id: req.params.id, sessionId: req.query.sessionId },
          { sessionId: req.query.sessionId }
        ]
      });
    } else {
      ticket = await Ticket.findById(req.params.id);
    }

    if (!ticket) {
      return res.status(404).json({ message: "Ticket non trouvé" });
    }
    if (ticket.status !== "desiste") {
      return res.status(400).json({ message: "Le ticket n'est pas désisté" });
    }
    ticket.status = "en_attente";
    await ticket.save();
    res.json({ updated: ticket });
  } catch (error) {
    console.error("Erreur lors de la reprise:", error);
    res.status(500).json({ message: "Erreur lors de la reprise du ticket" });
  }
});

// 📣 Appeler le patient suivant (par docteur)
app.delete("/next", async (req, res) => {
  try {
    const { docteur } = req.query;
    
    // Validation du docteur requis
    if (!docteur) {
      return res.status(400).json({ 
        success: false,
        message: "Le paramètre 'docteur' est requis" 
      });
    }
    
    if (!['dr-husni-said-habibi', 'dr-helios-blasco', 'dr-jean-eric-panacciulli'].includes(docteur)) {
      return res.status(400).json({ 
        success: false,
        message: "Docteur non valide" 
      });
    }

    let terminatedNotification = null;

    // 1. Trouver le ticket en consultation actuel pour ce docteur
    const currentTicket = await Ticket.findOne({ 
      status: "en_consultation", 
      docteur: docteur 
    });
    
    if (currentTicket) {
      // Sauvegarder l'ancien statut pour la notification
      const previousStatus = currentTicket.status;
      
      // Marquer le ticket actuel comme terminé
      currentTicket.status = "termine";
      await currentTicket.save();

      // Préparer la notification pour le patient terminé
      terminatedNotification = {
        previousStatus,
        type: "consultation_terminee",
        message: "✅ Votre consultation est terminée"
      };
    }

    // 2. Trouver et appeler le prochain patient pour ce docteur
    const nextTicket = await Ticket.findOne({ 
      status: "en_attente", 
      docteur: docteur 
    }).sort({ createdAt: 1 });
    
    if (nextTicket) {
      // Sauvegarder l'ancien statut pour la notification
      const previousStatus = nextTicket.status;
      
      nextTicket.status = "en_consultation";
      await nextTicket.save();
      
      // Préparer la notification pour le patient appelé
      const calledNotification = {
        previousStatus,
        type: "patient_appele",
        message: "🏥 C'est votre tour ! Veuillez vous présenter au cabinet"
      };
      
      // Envoyer les deux tickets mis à jour avec leurs notifications
      res.json({ 
        previous: currentTicket ? {
          ticket: currentTicket,
          notification: terminatedNotification
        } : null,
        called: {
          ticket: nextTicket,
          notification: calledNotification
        },
        message: `Patient suivant appelé avec succès pour ${docteur}`,
        docteur: docteur
      });
    } else {
      res.status(404).json({ 
        previous: currentTicket ? {
          ticket: currentTicket,
          notification: terminatedNotification
        } : null,
        message: `Aucun patient en attente pour ${docteur}`,
        docteur: docteur
      });
    }
  } catch (error) {
    console.error("Erreur lors de l'appel du prochain ticket:", error);
    res.status(500).json({ message: "Erreur lors de l'appel" });
  }
});

// ✅ Réinitialiser la file (globale ou par docteur)
app.delete("/reset", async (req, res) => {
  try {
    const { docteur } = req.query;
    let query = {};
    let message = "File globale réinitialisée";
    
    // Si un docteur est spécifié, ne réinitialiser que sa file
    if (docteur) {
      if (!['dr-husni-said-habibi', 'dr-helios-blasco', 'dr-jean-eric-panacciulli'].includes(docteur)) {
        return res.status(400).json({ 
          success: false,
          message: "Docteur non valide" 
        });
      }
      query.docteur = docteur;
      message = `File de ${docteur} réinitialisée`;
    }
    
    const result = await Ticket.deleteMany(query);
    res.json({ 
      success: true,
      message: message,
      deletedCount: result.deletedCount,
      docteur: docteur || "tous"
    });
  } catch (error) {
    console.error("Erreur lors de la réinitialisation:", error);
    res.status(500).json({ message: "Erreur lors de la réinitialisation" });
  }
});

// 📣 Appeler un ticket spécifique en consultation
app.patch("/ticket/:id/call", async (req, res) => {
  try {
    const ticket = await Ticket.findById(req.params.id);
    if (!ticket) {
      return res.status(404).json({ message: "Ticket non trouvé" });
    }
    
    if (ticket.status !== "en_attente") {
      return res.status(400).json({ message: "Le ticket n'est pas en attente" });
    }

    // Vérifier qu'aucun autre patient n'est déjà en consultation avec ce docteur
    const currentConsultation = await Ticket.findOne({ 
      status: "en_consultation", 
      docteur: ticket.docteur 
    });
    
    if (currentConsultation) {
      return res.status(400).json({ 
        message: `Un patient est déjà en consultation avec ${ticket.docteur}`,
        currentPatient: currentConsultation
      });
    }

    // Sauvegarder l'ancien statut pour la notification
    const previousStatus = ticket.status;
    
    // Mettre le ticket en consultation
    ticket.status = "en_consultation";
    await ticket.save();

    res.json({ 
      updated: ticket,
      notification: {
        previousStatus,
        type: "patient_appele",
        message: "🏥 C'est votre tour ! Veuillez vous présenter au cabinet"
      }
    });
  } catch (error) {
    console.error("Erreur lors de l'appel du ticket:", error);
    res.status(500).json({ message: "Erreur serveur" });
  }
});

// 🟣 Marquer un ticket comme terminé
app.patch("/ticket/:id/finish", async (req, res) => {
  try {
    const ticket = await Ticket.findById(req.params.id);
    if (ticket && ticket.status === "en_consultation") {
      // Sauvegarder l'ancien statut pour la notification
      const previousStatus = ticket.status;
      
      // Mettre à jour le statut
      ticket.status = "termine";
      await ticket.save();

      // Envoyer les informations nécessaires pour la notification
      res.json({ 
        updated: ticket,
        notification: {
          previousStatus,
          type: "consultation_terminee",
          message: "✅ Votre consultation est terminée"
        }
      });
    } else {
      res.status(404).json({ message: "Ticket non trouvé ou statut invalide" });
    }
  } catch (error) {
    console.error("Erreur lors de la finalisation:", error);
    res.status(500).json({ message: "Erreur serveur" });
  }
});

// 📊 Statistiques par docteur
app.get("/stats", async (req, res) => {
  try {
    const { docteur } = req.query;
    
    if (docteur) {
      // Statistiques pour un docteur spécifique
      if (!['dr-husni-said-habibi', 'dr-helios-blasco', 'dr-jean-eric-panacciulli'].includes(docteur)) {
        return res.status(400).json({ 
          success: false,
          message: "Docteur non valide" 
        });
      }
      
      const stats = await Ticket.aggregate([
        { $match: { docteur: docteur } },
        {
          $group: {
            _id: "$status",
            count: { $sum: 1 }
          }
        }
      ]);
      
      // Formatage des statistiques
      const formattedStats = {
        docteur: docteur,
        en_attente: 0,
        en_consultation: 0,
        termine: 0,
        desiste: 0,
        total: 0
      };
      
      stats.forEach(stat => {
        formattedStats[stat._id] = stat.count;
        formattedStats.total += stat.count;
      });
      
      res.json(formattedStats);
    } else {
      // Statistiques globales par docteur
      const statsByDoctor = await Ticket.aggregate([
        {
          $group: {
            _id: {
              docteur: "$docteur",
              status: "$status"
            },
            count: { $sum: 1 }
          }
        },
        {
          $group: {
            _id: "$_id.docteur",
            stats: {
              $push: {
                status: "$_id.status",
                count: "$count"
              }
            },
            total: { $sum: "$count" }
          }
        }
      ]);
      
      res.json(statsByDoctor);
    }
  } catch (error) {
    console.error("Erreur lors de la récupération des statistiques:", error);
    res.status(500).json({ message: "Erreur de récupération des statistiques" });
  }
});

// 🟣 Routes API externes
app.use("/patient", patientRoutes);

// 🚀 Démarrage du serveur
app.listen(PORT, '0.0.0.0', () => {
  console.log(`✅ API LineUp en ligne sur port ${PORT}`);
  console.log(`🌐 Environnement: ${process.env.NODE_ENV || 'development'}`);
  console.log(`📊 MongoDB: ${process.env.MONGO_URI ? 'Configuré' : 'Non configuré'}`);
});
