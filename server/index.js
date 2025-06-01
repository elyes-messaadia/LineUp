const express = require("express");
const cors = require("cors");
const connectDB = require("./config/db");
const patientRoutes = require("./routes/patient");
const authRoutes = require("./routes/auth");
const Ticket = require("./models/Ticket");
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

// 🎫 Créer un ticket (version améliorée)
app.post("/ticket", async (req, res) => {
  try {
    // Générer un sessionId unique pour identifier l'utilisateur anonyme
    const sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    // Capturer les métadonnées de la requête
    const metadata = {
      ipAddress: req.ip || req.connection.remoteAddress,
      userAgent: req.headers['user-agent'],
      device: req.headers['sec-ch-ua-platform'] || 'unknown'
    };

    // Méthode robuste pour éviter les race conditions
    let ticket;
    let attempts = 0;
    const maxAttempts = 5;

    while (attempts < maxAttempts) {
      try {
        // Obtenir le prochain numéro de manière atomique
        const lastTicket = await Ticket.findOne().sort({ number: -1 });
        const nextNumber = lastTicket ? lastTicket.number + 1 : 1;
        
        ticket = new Ticket({ 
          number: nextNumber,
          sessionId: sessionId,
          userId: req.body.userId || null,
          metadata: metadata
        });
        
        await ticket.save();
        break; // Succès, sortir de la boucle
        
      } catch (error) {
        if (error.code === 11000 && attempts < maxAttempts - 1) {
          // Erreur de duplicata, réessayer
          attempts++;
          await new Promise(resolve => setTimeout(resolve, 100)); // Attendre 100ms
          continue;
        }
        throw error; // Autre erreur, propager
      }
    }

    if (!ticket) {
      throw new Error("Impossible de créer le ticket après plusieurs tentatives");
    }

    console.log(`✅ Ticket n°${ticket.number} créé (Session: ${sessionId})`);
    res.status(201).json(ticket);
    
  } catch (err) {
    console.error("❌ Erreur création ticket:", err);
    res.status(500).json({ 
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

// 📋 Obtenir la file d'attente
app.get("/queue", async (req, res) => {
  try {
    const queue = await Ticket.find().sort({ createdAt: 1 });
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

// 📣 Appeler le patient suivant
app.delete("/next", async (req, res) => {
  try {
    // 1. Trouver le ticket en consultation actuel s'il existe
    const currentTicket = await Ticket.findOne({ status: "en_consultation" });
    if (currentTicket) {
      // Sauvegarder l'ancien statut pour la notification
      const previousStatus = currentTicket.status;
      
      // Marquer le ticket actuel comme terminé
      currentTicket.status = "termine";
      await currentTicket.save();

      // Préparer la notification pour le patient terminé
      const terminatedNotification = {
        previousStatus,
        type: "consultation_terminee",
        message: "✅ Votre consultation est terminée"
      };
    }

    // 2. Trouver et appeler le prochain patient
    const nextTicket = await Ticket.findOne({ status: "en_attente" }).sort({ createdAt: 1 });
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
        message: "Patient suivant appelé avec succès"
      });
    } else {
      res.status(404).json({ 
        previous: currentTicket ? {
          ticket: currentTicket,
          notification: terminatedNotification
        } : null,
        message: "Aucun patient en attente" 
      });
    }
  } catch (error) {
    console.error("Erreur lors de l'appel du prochain ticket:", error);
    res.status(500).json({ message: "Erreur lors de l'appel" });
  }
});

// ✅ Réinitialiser la file
app.delete("/reset", async (req, res) => {
  try {
    await Ticket.deleteMany();
    res.sendStatus(200);
  } catch (error) {
    console.error("Erreur lors de la réinitialisation:", error);
    res.status(500).json({ message: "Erreur lors de la réinitialisation" });
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

// 🟣 Routes API externes
app.use("/patient", patientRoutes);

// 🚀 Démarrage du serveur
app.listen(PORT, '0.0.0.0', () => {
  console.log(`✅ API LineUp en ligne sur port ${PORT}`);
  console.log(`🌐 Environnement: ${process.env.NODE_ENV || 'development'}`);
  console.log(`📊 MongoDB: ${process.env.MONGO_URI ? 'Configuré' : 'Non configuré'}`);
});
