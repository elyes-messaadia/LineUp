const express = require("express");
const cors = require("cors");
const connectDB = require("./config/db");
const adminRoutes = require("./routes/admin");
const patientRoutes = require("./routes/patient");
const authRoutes = require("./routes/auth");
const Ticket = require("./models/Ticket");
require("dotenv").config();

const app = express();
const PORT = process.env.PORT || 5000;

// 🌐 Configuration CORS robuste pour production
const allowedOrigins = [
  "https://ligneup.netlify.app",
  "https://lineup.netlify.app", 
  "http://localhost:5173",
  "http://localhost:5174",
  "http://localhost:3000"
];

// Configuration CORS complète
app.use(cors({
  origin: function (origin, callback) {
    // Autoriser les requêtes sans origin (mobile apps, curl, etc.)
    if (!origin) return callback(null, true);
    
    // Autoriser les domaines dans la liste
    if (allowedOrigins.includes(origin)) {
      return callback(null, true);
    }
    
    // En production, autoriser aussi les subdomaines netlify
    if (origin && origin.includes('.netlify.app')) {
      return callback(null, true);
    }
    
    console.log('❌ CORS blocked origin:', origin);
      return callback(new Error("Not allowed by CORS"));
  },
  credentials: true,
  methods: ["GET", "POST", "PATCH", "DELETE", "OPTIONS", "PUT"],
  allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With"],
  optionsSuccessStatus: 200 // Pour les anciens navigateurs
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
    const ticket = await Ticket.findById(req.params.id);
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
  } catch (err) {
    res.status(500).json({ message: "Erreur de récupération" });
  }
});

// 🗑️ Désister un ticket
app.delete("/ticket/:id", async (req, res) => {
  try {
    const ticket = await Ticket.findById(req.params.id);
    if (!ticket) return res.status(404).json({ message: "Ticket non trouvé" });
    ticket.status = "desiste";
    await ticket.save();
    res.json({ updated: ticket });
  } catch (err) {
    res.status(500).json({ message: "Erreur lors de l'annulation" });
  }
});

// 🔄 Reprendre un ticket désisté
app.patch("/ticket/:id/resume", async (req, res) => {
  try {
    const ticket = await Ticket.findById(req.params.id);
    if (!ticket) {
      return res.status(404).json({ message: "Ticket non trouvé" });
    }
    if (ticket.status !== "desiste") {
      return res.status(400).json({ message: "Le ticket n'est pas désisté" });
    }
    ticket.status = "en_attente";
    await ticket.save();
    res.json({ updated: ticket });
  } catch (err) {
    res.status(500).json({ message: "Erreur lors de la reprise du ticket" });
  }
});

// 📣 Appeler le patient suivant
app.delete("/next", async (req, res) => {
  try {
    const next = await Ticket.findOne({ status: "en_attente" }).sort({ createdAt: 1 });
    if (next) {
      next.status = "en_consultation";
      await next.save();
      res.json({ called: next });
    } else {
      res.status(404).json({ message: "Aucun ticket à appeler" });
    }
  } catch (err) {
    res.status(500).json({ message: "Erreur lors de l'appel" });
  }
});

// ✅ Réinitialiser la file
app.delete("/reset", async (req, res) => {
  try {
    await Ticket.deleteMany();
    res.sendStatus(200);
  } catch (err) {
    res.status(500).json({ message: "Erreur lors de la réinitialisation" });
  }
});

// 🟣 Marquer un ticket comme terminé
app.patch("/ticket/:id/finish", async (req, res) => {
  try {
    const ticket = await Ticket.findById(req.params.id);
    if (ticket && ticket.status === "en_consultation") {
      ticket.status = "termine";
      await ticket.save();
      res.json({ updated: ticket });
    } else {
      res.status(404).json({ message: "Ticket non trouvé ou statut invalide" });
    }
  } catch (err) {
    res.status(500).json({ message: "Erreur serveur" });
  }
});

// 🟣 Routes API externes
app.use("/admin", adminRoutes);
app.use("/patient", patientRoutes);

// 🚀 Démarrage du serveur
app.listen(PORT, '0.0.0.0', () => {
  console.log(`✅ API LineUp en ligne sur port ${PORT}`);
  console.log(`🌐 Environnement: ${process.env.NODE_ENV || 'development'}`);
  console.log(`📊 MongoDB: ${process.env.MONGO_URI ? 'Configuré' : 'Non configuré'}`);
});
