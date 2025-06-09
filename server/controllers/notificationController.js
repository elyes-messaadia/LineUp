const webpush = require('web-push');
const User = require('../models/User');
const Ticket = require('../models/Ticket');

// Configuration Web Push (récupérée depuis auth.js)
webpush.setVapidDetails(
  'mailto:contact@lineup.app',
  process.env.VAPID_PUBLIC_KEY || 'BK8VJuX8z0P_6G4j6V_OP7Qp1M_1F5t6H5RQP_T6v4I3G5C2c9m1M8tQ4L5F6n7K8J9O0I1U2Y3T4R5E6W7Q8A9',
  process.env.VAPID_PRIVATE_KEY || 'u5J4I3O2Y1T8R7E6W5Q4A3S2D1F0G9H8J7K6L5M4N3B2V1C0X9Z8Y7T6R5E4W3Q2'
);

// 📤 Envoyer une notification push à un utilisateur spécifique
const sendNotificationToUser = async (userId, notificationData) => {
  try {
    const user = await User.findById(userId);
    
    if (!user || !user.pushSubscription) {
      console.log(`⚠️ Utilisateur ${userId} non trouvé ou non abonné aux notifications`);
      return { success: false, message: 'Utilisateur non abonné' };
    }

    const payload = JSON.stringify({
      title: notificationData.title || 'LineUp',
      body: notificationData.body || 'Vous avez une nouvelle notification',
      icon: '/icon-192x192.png',
      badge: '/icon-192x192.png',
      tag: notificationData.tag || 'lineup-notification',
      data: notificationData.data || {}
    });

    await webpush.sendNotification(user.pushSubscription, payload);
    console.log(`✅ Notification envoyée à ${user.firstName} ${user.lastName}`);
    
    return { success: true, message: 'Notification envoyée' };
  } catch (error) {
    console.error('❌ Erreur lors de l\'envoi de la notification:', error);
    
    // Si l'abonnement est invalide, le supprimer
    if (error.statusCode === 410) {
      await User.findByIdAndUpdate(userId, {
        $unset: { pushSubscription: 1 }
      });
      console.log(`🗑️ Abonnement push supprimé pour l'utilisateur ${userId} (endpoint expiré)`);
    }
    
    return { success: false, message: error.message };
  }
};

// 🎫 Notification pour nouveau ticket
const notifyNewTicket = async (ticketId) => {
  try {
    const ticket = await Ticket.findById(ticketId).populate('userId');
    
    if (!ticket || !ticket.userId) {
      return { success: false, message: 'Ticket ou utilisateur non trouvé' };
    }

    const notificationData = {
      title: '🎫 Ticket créé avec succès',
      body: `Votre ticket n°${ticket.number} a été créé. Vous êtes en file d'attente.`,
      tag: 'ticket-created',
      data: {
        ticketId: ticket._id,
        ticketNumber: ticket.number,
        url: `/dashboard/patient`
      }
    };

    return await sendNotificationToUser(ticket.userId._id, notificationData);
  } catch (error) {
    console.error('❌ Erreur notification nouveau ticket:', error);
    return { success: false, message: error.message };
  }
};

// 🩺 Notification pour appel en consultation
const notifyTicketCalled = async (ticketId) => {
  try {
    const ticket = await Ticket.findById(ticketId).populate('userId');
    
    if (!ticket || !ticket.userId) {
      return { success: false, message: 'Ticket ou utilisateur non trouvé' };
    }

    const notificationData = {
      title: '🩺 C\'est votre tour !',
      body: `Ticket n°${ticket.number} - Veuillez vous présenter chez le médecin`,
      tag: 'ticket-called',
      data: {
        ticketId: ticket._id,
        ticketNumber: ticket.number,
        url: `/dashboard/patient`,
        requireInteraction: true
      }
    };

    return await sendNotificationToUser(ticket.userId._id, notificationData);
  } catch (error) {
    console.error('❌ Erreur notification appel ticket:', error);
    return { success: false, message: error.message };
  }
};

// ⏰ Notification de rappel position dans la file
const notifyQueuePosition = async (userId, position, ticketNumber) => {
  try {
    let message;
    if (position === 1) {
      message = 'Vous passez dans quelques minutes !';
    } else if (position <= 3) {
      message = `Plus que ${position} personnes avant vous`;
    } else {
      message = `Vous êtes ${position}e dans la file d'attente`;
    }

    const notificationData = {
      title: '📋 Mise à jour file d\'attente',
      body: `Ticket n°${ticketNumber} - ${message}`,
      tag: 'queue-position',
      data: {
        position,
        ticketNumber,
        url: `/queue`
      }
    };

    return await sendNotificationToUser(userId, notificationData);
  } catch (error) {
    console.error('❌ Erreur notification position:', error);
    return { success: false, message: error.message };
  }
};

// 📢 Notification broadcast à tous les utilisateurs abonnés
const broadcastNotification = async (notificationData, roleFilter = null) => {
  try {
    let query = { pushSubscription: { $exists: true } };
    
    if (roleFilter) {
      const roles = await Role.find({ name: { $in: roleFilter } });
      const roleIds = roles.map(role => role._id);
      query.role = { $in: roleIds };
    }

    const users = await User.find(query);
    
    const notifications = users.map(user => 
      sendNotificationToUser(user._id, notificationData)
    );
    
    const results = await Promise.allSettled(notifications);
    const successful = results.filter(result => result.status === 'fulfilled' && result.value.success).length;
    
    console.log(`📢 Broadcast: ${successful}/${users.length} notifications envoyées`);
    
    return { success: true, sent: successful, total: users.length };
  } catch (error) {
    console.error('❌ Erreur broadcast notification:', error);
    return { success: false, message: error.message };
  }
};

module.exports = {
  sendNotificationToUser,
  notifyNewTicket,
  notifyTicketCalled,
  notifyQueuePosition,
  broadcastNotification
}; 