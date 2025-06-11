const express = require("express");
const cors = require("cors");
const connectDB = require("./config/db");
const patientRoutes = require("./routes/patient");
const authRoutes = require("./routes/auth");
const { authenticateOptional } = require("./middlewares/auth");
const errorHandler = require("./middlewares/errorHandler");
const Ticket = require("./models/Ticket");
const { notifyNewTicket } = require("./controllers/notificationController");
require("dotenv").config();

// 🔍 Validation des variables d'environnement critiques
const requiredEnvVars = ['MONGODB_URI'];
const missingEnvVars = requiredEnvVars.filter(envVar => !process.env[envVar]);

if (missingEnvVars.length > 0) {
  console.error('❌ Variables d\'environnement manquantes:', missingEnvVars);
  console.log('💡 Créez un fichier .env avec:');
  missingEnvVars.forEach(envVar => {
    console.log(`   ${envVar}=your_value_here`);
  });
}

if (!process.env.JWT_SECRET) {
  console.warn('⚠️ JWT_SECRET non défini - Utilisation d\'un secret temporaire');
}

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

// 🔗 Configuration proxy pour détecter les vraies IPs client
// Nécessaire pour Netlify, Cloudflare, et autres CDN/proxies
app.set('trust proxy', true);

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

// 🐛 Route de debug IP (à supprimer en production)
app.get('/debug-ip', (req, res) => {
  const getRealClientIP = (req) => {
    const ip = req.headers['x-nf-client-connection-ip'] ||
               req.headers['cf-connecting-ip'] ||
               req.headers['x-real-ip'] ||
               req.headers['x-forwarded-for']?.split(',')[0]?.trim() ||
               req.headers['x-client-ip'] ||
               req.connection?.remoteAddress ||
               req.socket?.remoteAddress ||
               req.ip ||
               'unknown';
    return ip;
  };

  res.json({
    message: '🔍 Debug Information IP',
    detectedIP: getRealClientIP(req),
    allHeaders: {
      'x-nf-client-connection-ip': req.headers['x-nf-client-connection-ip'],
      'cf-connecting-ip': req.headers['cf-connecting-ip'],
      'x-real-ip': req.headers['x-real-ip'],
      'x-forwarded-for': req.headers['x-forwarded-for'],
      'x-client-ip': req.headers['x-client-ip'],
      'user-agent': req.headers['user-agent'],
      'origin': req.headers.origin
    },
    expressIP: req.ip,
    connectionIP: req.connection?.remoteAddress,
    socketIP: req.socket?.remoteAddress,
    trustProxy: app.get('trust proxy'),
    timestamp: new Date().toISOString()
  });
});

// 🐛 Route de debug authentification (à supprimer en production)
app.get('/debug-auth', authenticateOptional, (req, res) => {
  const token = req.headers.authorization?.replace('Bearer ', '');
  
  res.json({
    message: '🔍 Debug Information Auth',
    hasToken: !!token,
    tokenPreview: token ? `${token.substring(0, 20)}...` : null,
    isAuthenticated: !!req.user,
    user: req.user ? {
      id: req.user._id,
      email: req.user.email,
      role: req.user.role?.name,
      isActive: req.user.isActive
    } : null,
    jwtSecret: process.env.JWT_SECRET ? 'CONFIGURÉ' : 'MANQUANT',
    timestamp: new Date().toISOString()
  });
});

connectDB();

// 🔐 Routes d'authentification centralisées
app.use("/auth", authRoutes);

// 🎫 Créer un ticket (version améliorée avec support tickets physiques)
app.post("/ticket", authenticateOptional, async (req, res) => {
  try {
    const { docteur, userId, patientName, ticketType, notes } = req.body;
    
    // Logs détaillés pour debug
    console.log(`\n🎫 === CRÉATION TICKET ===`);
    console.log(`- Docteur demandé: ${docteur}`);
    console.log(`- Utilisateur authentifié: ${req.user ? req.user._id : 'AUCUN'}`);
    console.log(`- Rôle utilisateur: ${req.user ? req.user.role.name : 'ANONYME'}`);
    console.log(`- Token présent: ${req.headers.authorization ? 'OUI' : 'NON'}`);
    console.log(`- IP: ${req.ip}`);
    
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

    // Capturer les métadonnées d'abord pour les vérifications - AMÉLIORATION IP
    const getRealClientIP = (req) => {
      // Priority order pour détecter la vraie IP du client
      const ip = req.headers['x-nf-client-connection-ip'] ||  // Netlify header
                 req.headers['cf-connecting-ip'] ||           // Cloudflare header  
                 req.headers['x-real-ip'] ||                  // Nginx proxy
                 req.headers['x-forwarded-for']?.split(',')[0]?.trim() || // Premier IP dans la chaîne
                 req.headers['x-client-ip'] ||                // Alternative header
                 req.connection?.remoteAddress ||             // Connection directe
                 req.socket?.remoteAddress ||                 // Socket alternatif
                 req.ip ||                                    // Express default
                 'unknown';
      
      console.log(`🔍 IP Detection:`, {
        'x-nf-client-connection-ip': req.headers['x-nf-client-connection-ip'],
        'x-forwarded-for': req.headers['x-forwarded-for'],
        'x-real-ip': req.headers['x-real-ip'],
        'req.ip': req.ip,
        'final': ip
      });
      
      return ip;
    };
    
    const ipAddress = getRealClientIP(req);
    const userAgent = req.headers['user-agent'];
    const device = req.headers['sec-ch-ua-platform'] || 'unknown';
    
    // Vérifier si l'utilisateur authentifié a déjà un ticket en cours
    // (sauf pour les secrétaires qui peuvent créer sans limite)
    if (req.user && req.user.role.name !== 'secretaire') {
      const existingTicket = await Ticket.findOne({
        userId: req.user._id,
        status: { $in: ['en_attente', 'en_consultation'] }
      });
      
      if (existingTicket) {
        console.log(`🚫 LIMITATION: Utilisateur ${req.user._id} a déjà le ticket n°${existingTicket.number} chez ${existingTicket.docteur}`);
        return res.status(400).json({
          success: false,
          message: "Vous avez déjà un ticket en cours",
          limitation: "user_has_ticket",
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

    // Si un utilisateur est connecté mais n'est pas secrétaire, il DOIT être patient
    if (req.user && req.user.role.name !== 'secretaire' && req.user.role.name !== 'patient') {
      console.log(`🚫 LIMITATION: Utilisateur ${req.user._id} avec rôle ${req.user.role.name} ne peut pas créer de ticket`);
      return res.status(403).json({
        success: false,
        message: "Seuls les patients et secrétaires peuvent créer des tickets"
      });
    }

    // NOUVELLE VÉRIFICATION : Si un token est envoyé, l'utilisateur DOIT être authentifié
    const token = req.headers.authorization?.replace('Bearer ', '');
    // TEMPORAIREMENT DÉSACTIVÉ POUR DEBUG
    /*
    if (token && !req.user) {
      console.log(`🚫 LIMITATION: Token présent mais utilisateur non authentifié - Token invalide ou expiré`);
      return res.status(401).json({
        success: false,
        message: "Token d'authentification invalide ou expiré. Veuillez vous reconnecter."
      });
    }
    */
    if (token && !req.user) {
      console.log(`⚠️ DEBUG: Token présent mais utilisateur non authentifié - INVESTIGATION EN COURS`);
      console.log(`Token: ${token.substring(0, 20)}...`);
      // Continuer pour le moment sans bloquer
    }

    // **NOUVELLE LIMITATION** : Vérifier les abus par IP/appareil pour tous les utilisateurs
    // (sauf pour les secrétaires qui peuvent créer sans limite)
    if (!req.user || req.user.role.name !== 'secretaire') {
      console.log(`🔍 VÉRIFICATION LIMITATIONS IP pour ${req.user ? 'utilisateur connecté' : 'ANONYME'}:`);
      
      // Créer une empreinte unique de l'appareil/navigateur comme fallback
      const deviceFingerprint = `${ipAddress}_${userAgent}_${device}`;
      const isIPUnknown = ipAddress === 'unknown';
      
      if (isIPUnknown) {
        console.log(`⚠️ IP inconnue, utilisation d'empreinte appareil: ${deviceFingerprint}`);
      }
      
      // Limite par adresse IP : maximum 1 ticket actif par IP (un seul ticket par appareil)
      const query = isIPUnknown ? 
        { 'metadata.deviceFingerprint': deviceFingerprint, status: { $in: ['en_attente', 'en_consultation'] } } :
        { 'metadata.ipAddress': ipAddress, status: { $in: ['en_attente', 'en_consultation'] } };
        
      const ticketsByIP = await Ticket.countDocuments(query);

      console.log(`- Tickets actifs par ${isIPUnknown ? 'empreinte' : 'IP'}: ${ticketsByIP}/1`);
      if (ticketsByIP >= 1) {
        console.log(`🚫 LIMITATION ${isIPUnknown ? 'EMPREINTE' : 'IP'}: ${ticketsByIP} ticket actif >= 1 maximum par appareil`);
        return res.status(429).json({
          success: false,
          message: "Limite atteinte : maximum 1 ticket actif par appareil",
          limitation: "ip_limit"
        });
      }

      // Limite temporelle : maximum 3 tickets par heure par IP
      const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
      const timeQuery = isIPUnknown ?
        { 'metadata.deviceFingerprint': deviceFingerprint, createdAt: { $gte: oneHourAgo } } :
        { 'metadata.ipAddress': ipAddress, createdAt: { $gte: oneHourAgo } };
        
      const recentTicketsByIP = await Ticket.countDocuments(timeQuery);

      console.log(`- Tickets dernière heure: ${recentTicketsByIP}/3`);
      if (recentTicketsByIP >= 3) {
        console.log(`🚫 LIMITATION TEMPORELLE: ${recentTicketsByIP} tickets/heure >= 3 maximum`);
        return res.status(429).json({
          success: false,
          message: "Limite atteinte : maximum 3 tickets par heure par appareil",
          limitation: "time_limit",
          retryAfter: "1 heure"
        });
      }

      console.log(`✅ LIMITATIONS OK - Création autorisée`);
    }

    // Générer un sessionId unique
    const sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    // Capturer les métadonnées (déjà définies plus haut)
    const metadata = {
      ipAddress,
      userAgent,
      device,
      deviceFingerprint: `${ipAddress}_${userAgent}_${device}`, // Fallback pour la détection d'appareil
      timestamp: new Date(),
      sessionId
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

// 📊 Statistiques d'abus (pour administration)
app.get("/admin/abuse-stats", authenticateOptional, async (req, res) => {
  try {
    // Vérifier les permissions (médecins et secrétaires seulement)
    if (!req.user || !['medecin', 'secretaire'].includes(req.user.role.name)) {
      return res.status(403).json({ 
        success: false,
        message: "Accès non autorisé" 
      });
    }

    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);

    // Statistiques par IP
    const ipStats = await Ticket.aggregate([
      {
        $match: {
          createdAt: { $gte: oneDayAgo },
          'metadata.ipAddress': { $exists: true }
        }
      },
      {
        $group: {
          _id: '$metadata.ipAddress',
          totalTickets: { $sum: 1 },
          activeTickets: {
            $sum: {
              $cond: [
                { $in: ['$status', ['en_attente', 'en_consultation']] },
                1,
                0
              ]
            }
          },
          recentTickets: {
            $sum: {
              $cond: [
                { $gte: ['$createdAt', oneHourAgo] },
                1,
                0
              ]
            }
          },
          doctors: { $addToSet: '$docteur' }
        }
      },
      {
        $project: {
          ipAddress: '$_id',
          totalTickets: 1,
          activeTickets: 1,
          recentTickets: 1,
          doctorCount: { $size: '$doctors' },
          flagged: {
            $or: [
              { $gte: ['$activeTickets', 2] },
              { $gte: ['$recentTickets', 3] }
            ]
          }
        }
      },
      { $sort: { totalTickets: -1 } },
      { $limit: 50 }
    ]);

    // Tickets potentiellement abusifs
    const suspiciousTickets = await Ticket.find({
      createdAt: { $gte: oneHourAgo },
      'metadata.ipAddress': { $exists: true }
    }).sort({ createdAt: -1 });

    // Grouper par IP pour détecter les patterns
    const suspiciousIPs = suspiciousTickets.reduce((acc, ticket) => {
      const ip = ticket.metadata.ipAddress;
      if (!acc[ip]) acc[ip] = [];
      acc[ip].push(ticket);
      return acc;
    }, {});

    // Filtrer les IPs avec plus de 2 tickets récents
    const flaggedIPs = Object.entries(suspiciousIPs)
      .filter(([ip, tickets]) => tickets.length >= 2)
      .map(([ip, tickets]) => ({
        ip,
        ticketCount: tickets.length,
        tickets: tickets.slice(0, 5) // Limiter à 5 tickets récents
      }));

    res.json({
      success: true,
      data: {
        overview: {
          totalIPs: ipStats.length,
          flaggedIPs: ipStats.filter(stat => stat.flagged).length,
          suspiciousActivity: flaggedIPs.length
        },
        ipStatistics: ipStats,
        flaggedActivity: flaggedIPs,
        generatedAt: new Date()
      }
    });

  } catch (error) {
    console.error("Erreur stats abus:", error);
    res.status(500).json({ 
      success: false,
      message: "Erreur lors de la récupération des statistiques" 
    });
  }
});

// 🗑️ Désister un ticket
app.delete("/ticket/:id", authenticateOptional, async (req, res) => {
  try {
    let ticket;
    
    // Si un sessionId est fourni (ticket anonyme), vérifier qu'il correspond
    if (req.query.sessionId) {
      ticket = await Ticket.findOne({
        $or: [
          { _id: req.params.id, sessionId: req.query.sessionId },
          { sessionId: req.query.sessionId }
        ]
      });
    } else {
      // Ticket authentifié : chercher par ID
      ticket = await Ticket.findById(req.params.id);
    }

    if (!ticket) {
      return res.status(404).json({ 
        success: false,
        message: "Ticket non trouvé" 
      });
    }

    // SÉCURITÉ : Vérifier que l'utilisateur peut annuler ce ticket
    if (req.user) {
      // Utilisateur authentifié : doit être propriétaire du ticket OU secrétaire
      if (req.user.role.name === 'secretaire') {
        // Les secrétaires peuvent annuler n'importe quel ticket
        console.log(`✅ Secrétaire ${req.user._id} annule le ticket n°${ticket.number}`);
      } else if (ticket.userId && ticket.userId.toString() === req.user._id.toString()) {
        // Le patient propriétaire peut annuler son ticket
        console.log(`✅ Patient ${req.user._id} annule son ticket n°${ticket.number}`);
      } else {
        // Utilisateur connecté mais pas propriétaire
        console.log(`🚫 SÉCURITÉ: Utilisateur ${req.user._id} tente d'annuler ticket ${ticket.number} qui ne lui appartient pas`);
        return res.status(403).json({ 
          success: false,
          message: "Vous ne pouvez annuler que vos propres tickets" 
        });
      }
    } else {
      // Ticket anonyme : vérification par sessionId déjà faite plus haut
      if (!req.query.sessionId) {
        return res.status(401).json({ 
          success: false,
          message: "Authentification requise pour annuler ce ticket" 
        });
      }
      console.log(`✅ Annulation ticket anonyme n°${ticket.number} via sessionId`);
    }

    // Vérifier que le ticket peut être annulé
    if (ticket.status === "termine") {
      return res.status(400).json({ 
        success: false,
        message: "Impossible d'annuler un ticket déjà terminé" 
      });
    }

    if (ticket.status === "desiste") {
      return res.status(400).json({ 
        success: false,
        message: "Ce ticket est déjà annulé" 
      });
    }

    // Annuler le ticket
    ticket.status = "desiste";
    await ticket.save();
    
    console.log(`🎫 Ticket n°${ticket.number} annulé avec succès`);
    
    res.json({ 
      success: true,
      updated: ticket,
      message: "Ticket annulé avec succès"
    });
  } catch (error) {
    console.error("❌ Erreur lors de l'annulation:", error);
    res.status(500).json({ 
      success: false,
      message: "Erreur lors de l'annulation" 
    });
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

// 🆘 Route temporaire pour créer une secrétaire (à supprimer après usage)
app.post("/create-secretary-temp", async (req, res) => {
  try {
    const bcrypt = require('bcrypt');
    const User = require('./models/User');
    const Role = require('./models/Role');
    
    console.log('🚨 CRÉATION SECRÉTAIRE TEMPORAIRE');
    
    // Vérifier si la secrétaire existe déjà
    const existingSecretary = await User.findOne({ email: 'secretaire@lineup.com' });
    if (existingSecretary) {
      return res.json({
        success: true,
        message: 'Secrétaire existe déjà',
        user: {
          email: existingSecretary.email,
          fullName: existingSecretary.fullName,
          role: existingSecretary.role
        }
      });
    }
    
    // Trouver le rôle secrétaire
    let secretaryRole = await Role.findOne({ name: 'secretaire' });
    if (!secretaryRole) {
      // Créer le rôle s'il n'existe pas
      secretaryRole = new Role({
        name: 'secretaire',
        permissions: ['create_ticket', 'view_queue', 'call_patient', 'manage_queue']
      });
      await secretaryRole.save();
      console.log('✅ Rôle secrétaire créé');
    }
    
    // Créer la secrétaire
    const hashedPassword = await bcrypt.hash('password123', 12);
    const secretary = new User({
      email: 'secretaire@lineup.com',
      password: hashedPassword,
      role: secretaryRole._id,
      profile: {
        firstName: 'Marie',
        lastName: 'Martin'
      },
      isActive: true
    });
    
    await secretary.save();
    console.log('✅ Secrétaire créée avec succès');
    
    res.json({
      success: true,
      message: 'Secrétaire créée avec succès',
      user: {
        email: secretary.email,
        fullName: secretary.fullName,
        role: 'secretaire'
      },
      credentials: {
        email: 'secretaire@lineup.com',
        password: 'password123'
      }
    });
    
  } catch (error) {
    console.error('❌ Erreur création secrétaire:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur création secrétaire',
      error: error.message
    });
  }
});

// 🛡️ Middleware de gestion d'erreurs (doit être en dernier)
app.use(errorHandler);

// 🚀 Démarrage du serveur
app.listen(PORT, '0.0.0.0', () => {
  console.log(`✅ API LineUp en ligne sur port ${PORT}`);
  console.log(`🌐 Environnement: ${process.env.NODE_ENV || 'development'}`);
  console.log(`📊 MongoDB: ${process.env.MONGO_URI ? 'Configuré' : 'Non configuré'}`);
});
