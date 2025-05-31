const mongoose = require('mongoose');

const roleSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    unique: true,
    enum: ['visiteur', 'patient', 'secretaire', 'medecin']
  },
  displayName: {
    type: String,
    required: true
  },
  permissions: [{
    type: String,
    enum: [
      'create_ticket',      // Créer un ticket
      'view_queue',         // Voir la file d'attente
      'call_next',          // Appeler le suivant
      'finish_consultation', // Terminer consultation
      'reset_queue',        // Réinitialiser la file
      'manage_users',       // Gérer les utilisateurs
      'view_stats',         // Voir les statistiques
      'cancel_ticket'       // Annuler un ticket
    ]
  }],
  description: String,
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Role', roleSchema); 