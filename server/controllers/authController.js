const bcrypt = require('bcrypt');
const User = require('../models/User');
const Role = require('../models/Role');
const { generateToken, verifyToken } = require('../utils/jwtUtils');
const { sendNotificationToUser } = require('./notificationController');

// POST /auth/register
exports.register = async (req, res) => {
  const { firstName, lastName, email, password, phone, roleName } = req.body;

  if (!firstName || !lastName || !email || !password || !roleName) {
    return res.status(400).json({
      message: 'Tous les champs obligatoires doivent être renseignés'
    });
  }

  const existingUser = await User.findOne({ email: email.toLowerCase() });
  if (existingUser) {
    return res.status(400).json({
      message: 'Un compte avec cet email existe déjà'
    });
  }

  if (!['patient', 'visiteur'].includes(roleName)) {
    return res.status(400).json({
      message: 'Seuls les comptes Patient et Visiteur peuvent être créés via l\'inscription'
    });
  }

  const role = await Role.findOne({ name: roleName });
  if (!role) {
    return res.status(400).json({ message: 'Rôle non trouvé' });
  }

  const saltRounds = 12;
  const hashedPassword = await bcrypt.hash(password, saltRounds);

  const newUser = new User({
    email: email.toLowerCase().trim(),
    password: hashedPassword,
    role: role._id,
    profile: {
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      phone: phone ? phone.trim() : undefined
    },
    isActive: true
  });

  await newUser.save();

  return res.status(201).json({
    message: 'Compte créé avec succès',
    user: {
      id: newUser._id,
      firstName: newUser.profile.firstName,
      lastName: newUser.profile.lastName,
      fullName: `${newUser.profile.firstName} ${newUser.profile.lastName}`,
      email: newUser.email,
      role: {
        name: role.name,
        permissions: role.permissions
      }
    }
  });
};

// POST /auth/login
exports.login = async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ message: 'Email et mot de passe requis' });
  }

  const user = await User.findOne({
    email: email.toLowerCase(),
    isActive: true
  }).populate('role');

  if (!user) {
    return res.status(401).json({ message: 'Email ou mot de passe incorrect' });
  }

  const isPasswordValid = await bcrypt.compare(password, user.password);
  if (!isPasswordValid) {
    return res.status(401).json({ message: 'Email ou mot de passe incorrect' });
  }

  const jwtSecret = process.env.JWT_SECRET || 'fallback_secret_change_in_production';
  const token = generateToken(
    {
      userId: user._id,
      email: user.email,
      role: user.role.name,
      permissions: user.role.permissions
    },
    jwtSecret,
    { expiresIn: '24h' }
  );

  user.lastLogin = new Date();
  await user.save();

  return res.json({
    message: 'Connexion réussie',
    token,
    user: {
      _id: user._id,
      firstName: user.profile?.firstName,
      lastName: user.profile?.lastName,
      fullName: user.fullName,
      email: user.email,
      phone: user.profile?.phone,
      role: {
        name: user.role.name,
        permissions: user.role.permissions
      },
      lastLogin: user.lastLogin
    }
  });
};

// POST /auth/verify
exports.verify = async (req, res) => {
  const token = req.headers.authorization?.replace('Bearer ', '');
  if (!token) {
    return res.status(401).json({ message: 'Token manquant' });
  }

  const jwtSecret = process.env.JWT_SECRET || 'fallback_secret_change_in_production';
  const decoded = verifyToken(token, jwtSecret);

  const user = await User.findById(decoded.userId).populate('role');
  if (!user || !user.isActive) {
    return res.status(401).json({ message: 'Utilisateur non trouvé ou inactif' });
  }

  return res.json({
    valid: true,
    user: {
      _id: user._id,
      firstName: user.profile?.firstName,
      lastName: user.profile?.lastName,
      fullName: user.fullName,
      email: user.email,
      phone: user.profile?.phone,
      role: {
        name: user.role.name,
        permissions: user.role.permissions
      }
    }
  });
};

// POST /auth/logout (stateless)
exports.logout = async (req, res) => {
  return res.json({ message: 'Déconnexion réussie' });
};

// POST /auth/push/subscribe
exports.pushSubscribe = async (req, res) => {
  const { subscription } = req.body;
  if (!subscription || !subscription.endpoint) {
    return res.status(400).json({ success: false, message: 'Abonnement push invalide' });
  }

  await User.findByIdAndUpdate(req.user._id, { pushSubscription: subscription });
  return res.json({ success: true, message: 'Abonnement push enregistré avec succès' });
};

// POST /auth/push/unsubscribe
exports.pushUnsubscribe = async (req, res) => {
  await User.findByIdAndUpdate(req.user._id, { $unset: { pushSubscription: 1 } });
  return res.json({ success: true, message: 'Désabonnement effectué avec succès' });
};

// POST /auth/push/send
exports.pushSend = async (req, res) => {
  const { userId, title, body, data } = req.body;
  const result = await sendNotificationToUser(userId, { title, body, data });

  if (!result.success) {
    return res.status(400).json({ success: false, message: result.message || 'Envoi échoué' });
  }

  return res.json({ success: true, message: 'Notification envoyée avec succès' });
};


