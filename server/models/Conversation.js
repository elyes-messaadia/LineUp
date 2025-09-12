const mongoose = require('mongoose');

// Sous-schéma pour les métadonnées des messages
const messageMetadataSchema = new mongoose.Schema({
  painLevel: {
    type: Number,
    min: 1,
    max: 10,
    required: false
  },
  symptoms: [{
    type: String,
    trim: true
  }],
  duration: {
    type: String,
    trim: true
  },
  stressLevel: {
    type: Number,
    min: 1,
    max: 10,
    required: false
  }
});

// Sous-schéma pour les messages
const messageSchema = new mongoose.Schema({
  sender: {
    type: String,
    enum: ['patient', 'ia', 'staff'],
    required: true
  },
  content: {
    type: String,
    required: true,
    trim: true
  },
  timestamp: {
    type: Date,
    default: Date.now
  },
  metadata: messageMetadataSchema
});

// Sous-schéma pour l'évaluation de l'IA
const aiAssessmentSchema = new mongoose.Schema({
  recommendedAction: {
    type: String,
    enum: ['consultation_immediate', 'attendre', 'teleconsultation'],
    required: true
  },
  reasoning: {
    type: String,
    required: true
  },
  confidenceScore: {
    type: Number,
    min: 0,
    max: 1,
    required: true
  },
  lastUpdated: {
    type: Date,
    default: Date.now
  }
});

// Schéma principal de conversation
const conversationSchema = new mongoose.Schema({
  patientId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Patient',
    required: true
  },
  ticketId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Ticket',
    required: false // Optionnel car le patient peut ne pas avoir de ticket
  },
  status: {
    type: String,
    enum: ['en_attente', 'en_cours', 'termine'],
    default: 'en_attente'
  },
  urgencyLevel: {
    type: Number,
    min: 1,
    max: 10,
    default: 5
  },
  messages: [messageSchema],
  aiAssessment: aiAssessmentSchema,
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  },
  lastMessageAt: {
    type: Date,
    default: Date.now
  },
  isArchived: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true // Active automatiquement createdAt et updatedAt
});

// Index pour améliorer les performances des requêtes
conversationSchema.index({ patientId: 1, createdAt: -1 });
conversationSchema.index({ status: 1, urgencyLevel: -1 });
conversationSchema.index({ lastMessageAt: -1 });

// Middleware pour mettre à jour lastMessageAt
conversationSchema.pre('save', function(next) {
  if (this.messages && this.messages.length > 0) {
    this.lastMessageAt = this.messages[this.messages.length - 1].timestamp;
  }
  next();
});

// Méthodes statiques
conversationSchema.statics.findActiveByPatient = function(patientId) {
  return this.findOne({
    patientId,
    status: { $ne: 'termine' },
    isArchived: false
  }).sort({ createdAt: -1 });
};

// Méthodes d'instance
conversationSchema.methods.addMessage = async function(sender, content, metadata = {}) {
  this.messages.push({
    sender,
    content,
    metadata,
    timestamp: new Date()
  });
  
  // Mettre à jour lastMessageAt
  this.lastMessageAt = new Date();
  
  return this.save();
};

// Virtuals
conversationSchema.virtual('messageCount').get(function() {
  return this.messages.length;
});

conversationSchema.virtual('duration').get(function() {
  if (this.status === 'termine') {
    return this.updatedAt - this.createdAt;
  }
  return new Date() - this.createdAt;
});

const Conversation = mongoose.model('Conversation', conversationSchema);

module.exports = Conversation;