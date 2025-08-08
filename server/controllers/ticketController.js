const Ticket = require('../models/Ticket');
const { notifyNewTicket } = require('./notificationController');

// Générer un nouveau numéro de ticket
const generateTicketNumber = async (docteur) => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const lastTicket = await Ticket.findOne({
    docteur,
    createdAt: { $gte: today }
  }).sort({ number: -1 });
  
  return lastTicket ? lastTicket.number + 1 : 1;
};

// Créer un nouveau ticket
exports.createTicket = async (req, res) => {
  try {
    const { docteur } = req.body;
    
    if (!docteur) {
      return res.status(400).json({ message: "Le docteur est requis" });
    }

    const number = await generateTicketNumber(docteur);
    
    const ticket = new Ticket({
      number,
      docteur,
      status: 'en_attente',
      metadata: {
        ipAddress: req.ip,
        userAgent: req.headers['user-agent'],
        device: req.headers['user-agent']
      }
    });

    if (req.user) {
      ticket.userId = req.user._id;
    } else {
      ticket.sessionId = req.sessionID;
    }

    await ticket.save();
    res.status(201).json(ticket);
  } catch (error) {
    console.error('Erreur création ticket:', error);
    res.status(500).json({ message: "Erreur lors de la création du ticket" });
  }
};

// Obtenir tous les tickets
exports.getTickets = async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const tickets = await Ticket.find({
      createdAt: { $gte: today }
    }).sort({ createdAt: 1 });

    res.json(tickets);
  } catch (error) {
    console.error('Erreur récupération tickets:', error);
    res.status(500).json({ message: "Erreur lors de la récupération des tickets" });
  }
};

// Mettre à jour le statut d'un ticket
exports.updateTicketStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!['en_attente', 'en_consultation', 'termine', 'desiste'].includes(status)) {
      return res.status(400).json({ message: "Statut invalide" });
    }

    const ticket = await Ticket.findByIdAndUpdate(
      id,
      { status },
      { new: true }
    );

    if (!ticket) {
      return res.status(404).json({ message: "Ticket non trouvé" });
    }

    res.json(ticket);
  } catch (error) {
    console.error('Erreur mise à jour ticket:', error);
    res.status(500).json({ message: "Erreur lors de la mise à jour du ticket" });
  }
};

// Supprimer un ticket
exports.deleteTicket = async (req, res) => {
  try {
    const { id } = req.params;
    const ticket = await Ticket.findByIdAndDelete(id);

    if (!ticket) {
      return res.status(404).json({ message: "Ticket non trouvé" });
    }

    res.json({ message: "Ticket supprimé avec succès" });
  } catch (error) {
    console.error('Erreur suppression ticket:', error);
    res.status(500).json({ message: "Erreur lors de la suppression du ticket" });
  }
};

// Obtenir les statistiques des tickets
exports.getTicketStats = async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const stats = await Ticket.aggregate([
      {
        $match: {
          createdAt: { $gte: today }
        }
      },
      {
        $group: {
          _id: '$docteur',
          total: { $sum: 1 },
          enAttente: {
            $sum: { $cond: [{ $eq: ['$status', 'en_attente'] }, 1, 0] }
          },
          enConsultation: {
            $sum: { $cond: [{ $eq: ['$status', 'en_consultation'] }, 1, 0] }
          },
          termine: {
            $sum: { $cond: [{ $eq: ['$status', 'termine'] }, 1, 0] }
          },
          desiste: {
            $sum: { $cond: [{ $eq: ['$status', 'desiste'] }, 1, 0] }
          },
          tempsAttenteMoyen: { $avg: '$tempsAttente' }
        }
      }
    ]);

    res.json(stats);
  } catch (error) {
    console.error('Erreur statistiques tickets:', error);
    res.status(500).json({ message: "Erreur lors de la récupération des statistiques" });
  }
}; 

// ====== Logique historique extraite de server/index.js ======

// Création avancée de ticket avec limitations IP/appareil, métadonnées et notifications
exports.createTicketAdvanced = async (req, res) => {
  try {
    const { docteur, userId, patientName, ticketType, notes } = req.body;

    // Utilisateur/auth context
    let finalUserId = null;
    let finalDocteur = docteur;

    if (req.user) {
      finalUserId = req.user._id;
      if (req.user.role.name === 'patient' && !docteur) {
        finalDocteur = 'dr-husni-said-habibi';
      }
    } else {
      if (!docteur) {
        return res.status(400).json({
          success: false,
          message: "Le champ 'docteur' est requis pour les tickets anonymes"
        });
      }
      finalUserId = userId || null;
    }

    if (!['dr-husni-said-habibi', 'dr-helios-blasco', 'dr-jean-eric-panacciulli'].includes(finalDocteur)) {
      return res.status(400).json({
        success: false,
        message: "Le docteur doit être l'un des suivants : Dr. Husni SAID HABIBI, Dr. Helios BLASCO, Dr. Jean-Eric PANACCIULLI"
      });
    }

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

    const ipAddress = getRealClientIP(req);
    const userAgent = req.headers['user-agent'];
    const device = req.headers['sec-ch-ua-platform'] || 'unknown';

    // Un seul ticket actif par utilisateur (hors secrétaire)
    if (req.user && req.user.role.name !== 'secretaire') {
      const existingTicket = await Ticket.findOne({
        userId: req.user._id,
        status: { $in: ['en_attente', 'en_consultation'] }
      });
      if (existingTicket) {
        return res.status(400).json({
          success: false,
          message: 'Vous avez déjà un ticket en cours',
          limitation: 'user_has_ticket',
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

    if (req.user && req.user.role.name !== 'secretaire' && req.user.role.name !== 'patient') {
      return res.status(403).json({ success: false, message: 'Seuls les patients et secrétaires peuvent créer des tickets' });
    }

    const token = req.headers.authorization?.replace('Bearer ', '');
    if (token && !req.user) {
      // Debug: token présent mais pas d'utilisateur; on ne bloque pas ici
    }

    // Limitations IP/appareil (sauf secrétaire)
    if (!req.user || req.user.role.name !== 'secretaire') {
      const deviceFingerprint = `${ipAddress}_${userAgent}_${device}`;
      const isIPUnknown = ipAddress === 'unknown';

      const activeQuery = isIPUnknown ?
        { 'metadata.deviceFingerprint': deviceFingerprint, status: { $in: ['en_attente', 'en_consultation'] } } :
        { 'metadata.ipAddress': ipAddress, status: { $in: ['en_attente', 'en_consultation'] } };
      const activeCount = await Ticket.countDocuments(activeQuery);
      if (activeCount >= 1) {
        return res.status(429).json({
          success: false,
          message: 'Limite atteinte : maximum 1 ticket actif par appareil',
          limitation: 'ip_limit'
        });
      }

      const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
      const timeQuery = isIPUnknown ?
        { 'metadata.deviceFingerprint': deviceFingerprint, createdAt: { $gte: oneHourAgo } } :
        { 'metadata.ipAddress': ipAddress, createdAt: { $gte: oneHourAgo } };
      const recentCount = await Ticket.countDocuments(timeQuery);
      if (recentCount >= 3) {
        return res.status(429).json({
          success: false,
          message: 'Limite atteinte : maximum 3 tickets par heure par appareil',
          limitation: 'time_limit',
          retryAfter: '1 heure'
        });
      }
    }

    const sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const metadata = {
      ipAddress,
      userAgent,
      device,
      deviceFingerprint: `${ipAddress}_${userAgent}_${device}`,
      timestamp: new Date(),
      sessionId
    };

    const lastTicket = await Ticket.findOne().sort({ number: -1 });
    const nextNumber = lastTicket ? lastTicket.number + 1 : 1;

    let finalTicketType = ticketType || 'numerique';
    let finalCreatedBy = 'patient';
    if (req.user && req.user.role.name === 'secretaire') {
      finalCreatedBy = 'secretary';
    }
    if (finalTicketType === 'physique' && !patientName) {
      return res.status(400).json({ success: false, message: 'Le nom du patient est requis pour les tickets physiques' });
    }

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

    await ticket.save();

    if (req.user && req.user._id) {
      try {
        await notifyNewTicket(ticket._id);
      } catch (_) {
        // Ignorer erreur de notification
      }
    }

    return res.status(201).json({ success: true, ticket, message: 'Ticket créé avec succès' });
  } catch (err) {
    if (err.name === 'ValidationError') {
      return res.status(400).json({ success: false, message: 'Erreur de validation', errors: Object.values(err.errors).map(e => e.message) });
    }
    if (err.code === 11000) {
      return res.status(409).json({ success: false, message: 'Un ticket avec ce numéro existe déjà' });
    }
    return res.status(500).json({ success: false, message: 'Erreur lors de la création du ticket' });
  }
};

// GET /ticket/:id (avec support sessionId)
exports.getTicketById = async (req, res) => {
  try {
    let ticket;
    if (req.query.sessionId) {
      ticket = await Ticket.findOne({
        $or: [ { _id: req.params.id }, { sessionId: req.query.sessionId } ]
      });
    } else {
      ticket = await Ticket.findById(req.params.id);
    }
    if (!ticket) {
      return res.status(404).json({ message: 'Ticket non trouvé' });
    }
    return res.json(ticket);
  } catch (err) {
    return res.status(500).json({ message: 'Erreur serveur' });
  }
};

// GET /queue
exports.getQueue = async (req, res) => {
  try {
    const { docteur } = req.query;
    const query = {};
    if (docteur) {
      if (!['dr-husni-said-habibi', 'dr-helios-blasco', 'dr-jean-eric-panacciulli'].includes(docteur)) {
        return res.status(400).json({ success: false, message: 'Docteur non valide' });
      }
      query.docteur = docteur;
    }
    const queue = await Ticket.find(query).sort({ createdAt: 1 });
    return res.json(queue);
  } catch (err) {
    return res.status(500).json({ message: 'Erreur de récupération' });
  }
};

// GET /admin/abuse-stats
exports.getAbuseStats = async (req, res) => {
  try {
    if (!req.user || !['medecin', 'secretaire'].includes(req.user.role.name)) {
      return res.status(403).json({ success: false, message: 'Accès non autorisé' });
    }

    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);

    const ipStats = await Ticket.aggregate([
      { $match: { createdAt: { $gte: oneDayAgo }, 'metadata.ipAddress': { $exists: true } } },
      { $group: { _id: '$metadata.ipAddress', totalTickets: { $sum: 1 }, activeTickets: { $sum: { $cond: [ { $in: ['$status', ['en_attente', 'en_consultation']] }, 1, 0 ] } }, recentTickets: { $sum: { $cond: [ { $gte: ['$createdAt', oneHourAgo] }, 1, 0 ] } }, doctors: { $addToSet: '$docteur' } } },
      { $project: { ipAddress: '$_id', totalTickets: 1, activeTickets: 1, recentTickets: 1, doctorCount: { $size: '$doctors' }, flagged: { $or: [ { $gte: ['$activeTickets', 2] }, { $gte: ['$recentTickets', 3] } ] } } },
      { $sort: { totalTickets: -1 } },
      { $limit: 50 }
    ]);

    const suspiciousTickets = await Ticket.find({ createdAt: { $gte: oneHourAgo }, 'metadata.ipAddress': { $exists: true } }).sort({ createdAt: -1 });
    const suspiciousIPs = suspiciousTickets.reduce((acc, t) => { const ip = t.metadata.ipAddress; if (!acc[ip]) acc[ip] = []; acc[ip].push(t); return acc; }, {});
    const flaggedIPs = Object.entries(suspiciousIPs).filter(([_, arr]) => arr.length >= 2).map(([ip, arr]) => ({ ip, ticketCount: arr.length, tickets: arr.slice(0,5) }));

    return res.json({ success: true, data: { overview: { totalIPs: ipStats.length, flaggedIPs: ipStats.filter(s => s.flagged).length, suspiciousActivity: flaggedIPs.length }, ipStatistics: ipStats, flaggedActivity: flaggedIPs, generatedAt: new Date() } });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Erreur lors de la récupération des statistiques' });
  }
};

// DELETE /ticket/:id (avec contrôles de sécurité)
exports.deleteTicketSecure = async (req, res) => {
  try {
    let ticket;
    if (req.query.sessionId) {
      ticket = await Ticket.findOne({ $or: [ { _id: req.params.id, sessionId: req.query.sessionId }, { sessionId: req.query.sessionId } ] });
    } else {
      ticket = await Ticket.findById(req.params.id);
    }
    if (!ticket) {
      return res.status(404).json({ success: false, message: 'Ticket non trouvé' });
    }

    if (req.user) {
      if (req.user.role.name === 'secretaire') {
        // ok
      } else if (ticket.userId && ticket.userId.toString() === req.user._id.toString()) {
        // ok
      } else {
        return res.status(403).json({ success: false, message: 'Vous ne pouvez annuler que vos propres tickets' });
      }
    } else {
      if (!req.query.sessionId) {
        return res.status(401).json({ success: false, message: 'Authentification requise pour annuler ce ticket' });
      }
    }

    if (ticket.status === 'termine') {
      return res.status(400).json({ success: false, message: "Impossible d'annuler un ticket déjà terminé" });
    }
    if (ticket.status === 'desiste') {
      return res.status(400).json({ success: false, message: 'Ce ticket est déjà annulé' });
    }

    ticket.status = 'desiste';
    await ticket.save();
    return res.json({ success: true, updated: ticket, message: 'Ticket annulé avec succès' });
  } catch (err) {
    return res.status(500).json({ success: false, message: "Erreur lors de l'annulation" });
  }
};

// PATCH /ticket/:id/resume
exports.resumeTicket = async (req, res) => {
  try {
    let ticket;
    if (req.query.sessionId) {
      ticket = await Ticket.findOne({ $or: [ { _id: req.params.id, sessionId: req.query.sessionId }, { sessionId: req.query.sessionId } ] });
    } else {
      ticket = await Ticket.findById(req.params.id);
    }
    if (!ticket) return res.status(404).json({ message: 'Ticket non trouvé' });
    if (ticket.status !== 'desiste') return res.status(400).json({ message: "Le ticket n'est pas désisté" });
    ticket.status = 'en_attente';
    await ticket.save();
    return res.json({ updated: ticket });
  } catch (err) {
    return res.status(500).json({ message: 'Erreur lors de la reprise du ticket' });
  }
};

// DELETE /next (appeler le prochain patient pour un docteur)
exports.callNextForDoctor = async (req, res) => {
  try {
    const { docteur } = req.query;
    if (!docteur) return res.status(400).json({ success: false, message: "Le paramètre 'docteur' est requis" });
    if (!['dr-husni-said-habibi', 'dr-helios-blasco', 'dr-jean-eric-panacciulli'].includes(docteur)) {
      return res.status(400).json({ success: false, message: 'Docteur non valide' });
    }

    let terminatedNotification = null;
    const currentTicket = await Ticket.findOne({ status: 'en_consultation', docteur });
    if (currentTicket) {
      const previousStatus = currentTicket.status;
      currentTicket.status = 'termine';
      await currentTicket.save();
      terminatedNotification = { previousStatus, type: 'consultation_terminee', message: '✅ Votre consultation est terminée' };
    }

    const nextTicket = await Ticket.findOne({ status: 'en_attente', docteur }).sort({ createdAt: 1 });
    if (nextTicket) {
      const previousStatus = nextTicket.status;
      nextTicket.status = 'en_consultation';
      await nextTicket.save();
      const calledNotification = { previousStatus, type: 'patient_appele', message: "🏥 C'est votre tour ! Veuillez vous présenter au cabinet" };
      return res.json({ previous: currentTicket ? { ticket: currentTicket, notification: terminatedNotification } : null, called: { ticket: nextTicket, notification: calledNotification } });
    }

    return res.json({ previous: currentTicket ? { ticket: currentTicket, notification: terminatedNotification } : null, called: null });
  } catch (err) {
    return res.status(500).json({ message: 'Erreur lors de l\'appel du prochain patient' });
  }
};

// PATCH /ticket/:id/call
exports.callTicket = async (req, res) => {
  try {
    const ticket = await Ticket.findById(req.params.id);
    if (!ticket) return res.status(404).json({ message: 'Ticket non trouvé' });
    if (ticket.status !== 'en_attente') return res.status(400).json({ message: "Le ticket n'est pas en attente" });

    const currentConsultation = await Ticket.findOne({ status: 'en_consultation', docteur: ticket.docteur });
    if (currentConsultation) {
      return res.status(400).json({ message: `Un patient est déjà en consultation avec ${ticket.docteur}`, currentPatient: currentConsultation });
    }

    const previousStatus = ticket.status;
    ticket.status = 'en_consultation';
    await ticket.save();
    return res.json({ updated: ticket, notification: { previousStatus, type: 'patient_appele', message: "🏥 C'est votre tour ! Veuillez vous présenter au cabinet" } });
  } catch (err) {
    return res.status(500).json({ message: "Erreur lors de l'appel du ticket" });
  }
};

// PATCH /ticket/:id/finish
exports.finishTicket = async (req, res) => {
  try {
    const ticket = await Ticket.findById(req.params.id);
    if (ticket && ticket.status === 'en_consultation') {
      const previousStatus = ticket.status;
      ticket.status = 'termine';
      await ticket.save();
      return res.json({ updated: ticket, notification: { previousStatus, type: 'consultation_terminee', message: '✅ Votre consultation est terminée' } });
    }
    return res.status(404).json({ message: 'Ticket non trouvé ou statut invalide' });
  } catch (err) {
    return res.status(500).json({ message: 'Erreur serveur' });
  }
};

// GET /stats (global ou par docteur)
exports.getStats = async (req, res) => {
  try {
    const { docteur } = req.query;
    if (docteur) {
      if (!['dr-husni-said-habibi', 'dr-helios-blasco', 'dr-jean-eric-panacciulli'].includes(docteur)) {
        return res.status(400).json({ success: false, message: 'Docteur non valide' });
      }
      const stats = await Ticket.aggregate([
        { $match: { docteur } },
        { $group: { _id: '$status', count: { $sum: 1 } } }
      ]);
      const formatted = { docteur, en_attente: 0, en_consultation: 0, termine: 0, desiste: 0, total: 0 };
      stats.forEach(s => { formatted[s._id] = s.count; formatted.total += s.count; });
      return res.json(formatted);
    }

    const statsByDoctor = await Ticket.aggregate([
      { $group: { _id: { docteur: '$docteur', status: '$status' }, count: { $sum: 1 } } },
      { $group: { _id: '$_id.docteur', stats: { $push: { status: '$_id.status', count: '$count' } }, total: { $sum: '$count' } } }
    ]);
    return res.json(statsByDoctor);
  } catch (err) {
    return res.status(500).json({ message: 'Erreur de récupération des statistiques' });
  }
};