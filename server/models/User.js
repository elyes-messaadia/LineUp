const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true
  },
  password: {
    type: String,
    required: true
  },
  role: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Role',
    required: true
  },
  profile: {
    firstName: String,
    lastName: String,
    phone: String,
    dateOfBirth: Date,
    address: {
      street: String,
      city: String,
      postalCode: String,
      country: { type: String, default: 'France' }
    }
  },
  preferences: {
    notifications: {
      email: { type: Boolean, default: true },
      sms: { type: Boolean, default: false }
    },
    language: { type: String, default: 'fr' }
  },
  isActive: {
    type: Boolean,
    default: true
  },
  lastLogin: Date,
  loginCount: {
    type: Number,
    default: 0
  }
}, {
  timestamps: true
});

// Index pour optimiser les recherches
userSchema.index({ email: 1 });
userSchema.index({ role: 1 });
userSchema.index({ 'profile.lastName': 1 });

// Méthode pour vérifier les permissions
userSchema.methods.hasPermission = async function(permission) {
  await this.populate('role');
  return this.role && this.role.permissions.includes(permission);
};

// Méthode pour obtenir le nom complet
userSchema.virtual('fullName').get(function() {
  if (this.profile && this.profile.firstName && this.profile.lastName) {
    return `${this.profile.firstName} ${this.profile.lastName}`;
  }
  return this.email;
});

// Inclure les virtuals dans JSON
userSchema.set('toJSON', { virtuals: true });

module.exports = mongoose.model('User', userSchema); 