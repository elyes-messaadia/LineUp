const mongoose = require("mongoose");

const ticketSchema = new mongoose.Schema({
  number: { 
    type: Number, 
    required: true,
    unique: true  // Assurer l'unicité des numéros
  },
  status: {
    type: String,
    enum: ["en_attente", "en_consultation", "desiste", "termine"],
    default: "en_attente"
  },
  docteur: {
    type: String,
    required: true,
    enum: ['dr-husni-said-habibi', 'dr-helios-blasco', 'dr-jean-eric-panacciulli']
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  sessionId: {
    type: String,
    default: null
  },
  createdAt: { 
    type: Date, 
    default: Date.now 
  },
  updatedAt: {
    type: Date,
    default: Date.now
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
