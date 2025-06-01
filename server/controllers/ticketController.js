const Ticket = require('../models/Ticket');

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