const mongoose = require("mongoose");

const ticketSchema = new mongoose.Schema({
  number: { 
    type: Number, 
    required: true,
    unique: true  // Assurer l'unicité des numéros
  },
  userId: {
    type: String,
    required: false  // Optionnel pour la compatibilité
  },
  sessionId: {
    type: String,
    required: false  // ID de session pour identifier l'utilisateur anonyme
  },
  createdAt: { 
    type: Date, 
    default: Date.now 
  },
  updatedAt: {
    type: Date,
    default: Date.now
  },
  status: {
    type: String,
    enum: ["en_attente", "en_consultation", "desiste", "termine"],
    default: "en_attente"
  },
  metadata: {
    ipAddress: String,
    userAgent: String,
    device: String
  }
}, {
  timestamps: true  // Ajoute automatiquement createdAt et updatedAt
});

// Index pour optimiser les requêtes
ticketSchema.index({ status: 1, createdAt: 1 });
ticketSchema.index({ sessionId: 1 });

module.exports = mongoose.model("Ticket", ticketSchema);
