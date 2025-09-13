const express = require("express");
const bcrypt = require("bcrypt");
const User = require("../models/User");
const Role = require("../models/Role");
const Ticket = require("../models/Ticket");
const { authenticateRequired: authenticate } = require("../middlewares/auth");
const { generateToken, verifyToken } = require("../utils/jwtUtils");
const webpush = require("web-push");

const router = express.Router();

// Configuration Web Push
webpush.setVapidDetails(
  "mailto:contact@lineup.app",
  process.env.VAPID_PUBLIC_KEY ||
    "BE6TTcnzxhHpEBQTomuclPw9snOauTKkweaL4HnnnatHhUjy_xk8xtMqDHVYhm9PolO19WIuE_M41U7yofhAPA0",
  process.env.VAPID_PRIVATE_KEY || "TmybpfdcI33NeNluDq7JWiiLfeu4Q7PZWDR-hqIfn7s"
);

/**
 * POST /auth/register
 * ➤ Inscription pour les visiteurs et patients
 */
router.post("/register", async (req, res) => {
  try {
    const { firstName, lastName, email, password, phone, roleName } = req.body;

    // Validation des champs obligatoires
    if (!firstName || !lastName || !email || !password || !roleName) {
      return res.status(400).json({
        message: "Tous les champs obligatoires doivent être renseignés",
      });
    }

    // Vérifier que l'email n'existe pas déjà
    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return res.status(400).json({
        message: "Un compte avec cet email existe déjà",
      });
    }

    // Vérifier que le rôle demandé est autorisé pour l'inscription
    if (!["patient", "visiteur"].includes(roleName)) {
      return res.status(400).json({
        message:
          "Seuls les comptes Patient et Visiteur peuvent être créés via l'inscription",
      });
    }

    // Récupérer le rôle depuis la base de données
    const role = await Role.findOne({ name: roleName });
    if (!role) {
      return res.status(400).json({
        message: "Rôle non trouvé",
      });
    }

    // Hacher le mot de passe
    const saltRounds = 12;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    // Créer l'utilisateur
    const newUser = new User({
      email: email.toLowerCase().trim(),
      password: hashedPassword,
      role: role._id,
      profile: {
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        phone: phone ? phone.trim() : undefined,
      },
      isActive: true,
    });

    await newUser.save();

    console.log(`✅ Nouvel utilisateur créé: ${email} (${roleName})`);

    res.status(201).json({
      message: "Compte créé avec succès",
      user: {
        id: newUser._id,
        firstName: newUser.profile.firstName,
        lastName: newUser.profile.lastName,
        fullName: `${newUser.profile.firstName} ${newUser.profile.lastName}`,
        email: newUser.email,
        role: {
          name: role.name,
          permissions: role.permissions,
        },
      },
    });
  } catch (error) {
    console.error("❌ Erreur lors de l'inscription:", error);
    res.status(500).json({
      message: "Erreur serveur lors de la création du compte",
    });
  }
});

/**
 * POST /auth/login
 * ➤ Connexion pour tous les rôles
 */
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validation des champs
    if (!email || !password) {
      return res.status(400).json({
        message: "Email et mot de passe requis",
      });
    }

    // Trouver l'utilisateur avec son rôle
    const user = await User.findOne({
      email: email.toLowerCase(),
      isActive: true,
    }).populate("role");

    if (!user) {
      return res.status(401).json({
        message: "Email ou mot de passe incorrect",
      });
    }

    // Vérifier le mot de passe
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({
        message: "Email ou mot de passe incorrect",
      });
    }

    // Générer le JWT avec notre utilitaire robuste
    const jwtSecret =
      process.env.JWT_SECRET || "fallback_secret_change_in_production";
    const token = generateToken(
      {
        userId: user._id,
        email: user.email,
        role: user.role.name,
        permissions: user.role.permissions,
      },
      jwtSecret,
      { expiresIn: "24h" }
    );

    // Mettre à jour la dernière connexion
    user.lastLogin = new Date();
    await user.save();

    console.log(`✅ Connexion réussie: ${email} (${user.role.name})`);

    res.json({
      message: "Connexion réussie",
      token,
      user: {
        _id: user._id,
        firstName: user.profile?.firstName,
        lastName: user.profile?.lastName,
        fullName: user.fullName, // Utilise le virtual défini dans le modèle
        email: user.email,
        phone: user.profile?.phone,
        role: {
          name: user.role.name,
          permissions: user.role.permissions,
        },
        lastLogin: user.lastLogin,
      },
    });
  } catch (error) {
    console.error("❌ Erreur lors de la connexion:", error);
    res.status(500).json({
      message: "Erreur serveur lors de la connexion",
    });
  }
});

/**
 * POST /auth/verify
 * ➤ Vérifier la validité d'un token JWT
 */
router.post("/verify", async (req, res) => {
  try {
    const token = req.headers.authorization?.replace("Bearer ", "");

    if (!token) {
      return res.status(401).json({
        message: "Token manquant",
      });
    }

    const jwtSecret =
      process.env.JWT_SECRET || "fallback_secret_change_in_production";
    const decoded = verifyToken(token, jwtSecret);

    // Vérifier que l'utilisateur existe toujours
    const user = await User.findById(decoded.userId).populate("role");
    if (!user || !user.isActive) {
      return res.status(401).json({
        message: "Utilisateur non trouvé ou inactif",
      });
    }

    res.json({
      valid: true,
      user: {
        _id: user._id,
        firstName: user.profile?.firstName,
        lastName: user.profile?.lastName,
        fullName: user.fullName, // Utilise le virtual défini dans le modèle
        email: user.email,
        phone: user.profile?.phone,
        role: {
          name: user.role.name,
          permissions: user.role.permissions,
        },
      },
    });
  } catch (error) {
    console.error("❌ Erreur lors de la vérification du token:", error);
    res.status(401).json({
      message: "Token invalide",
    });
  }
});

/**
 * POST /auth/logout
 * ➤ Déconnexion (côté client surtout, mais peut servir pour logs)
 */
router.post("/logout", (req, res) => {
  // Dans un système JWT stateless, la déconnexion se fait côté client
  // Ici on peut juste logger l'événement
  console.log("👋 Déconnexion utilisateur");
  res.json({
    message: "Déconnexion réussie",
  });
});

// 🔔 S'abonner aux notifications push
router.post("/push/subscribe", authenticate, async (req, res) => {
  try {
    const { subscription } = req.body;

    if (!subscription || !subscription.endpoint) {
      return res.status(400).json({
        success: false,
        message: "Abonnement push invalide",
      });
    }

    // Mettre à jour l'utilisateur avec l'abonnement push
    await User.findByIdAndUpdate(req.user._id, {
      pushSubscription: subscription,
    });

    res.json({
      success: true,
      message: "Abonnement push enregistré avec succès",
    });
  } catch (error) {
    console.error("❌ Erreur lors de l'abonnement push:", error);
    res.status(500).json({
      success: false,
      message: "Erreur lors de l'abonnement aux notifications",
    });
  }
});

// 🔕 Se désabonner des notifications push
router.post("/push/unsubscribe", authenticate, async (req, res) => {
  try {
    await User.findByIdAndUpdate(req.user._id, {
      $unset: { pushSubscription: 1 },
    });

    res.json({
      success: true,
      message: "Désabonnement effectué avec succès",
    });
  } catch (error) {
    console.error("❌ Erreur lors du désabonnement push:", error);
    res.status(500).json({
      success: false,
      message: "Erreur lors du désabonnement",
    });
  }
});

// 📤 Envoyer une notification push (endpoint interne)
router.post("/push/send", authenticate, async (req, res) => {
  try {
    const { userId, title, body, data } = req.body;

    // Récupérer l'utilisateur avec son abonnement push
    const user = await User.findById(userId);

    if (!user || !user.pushSubscription) {
      return res.status(404).json({
        success: false,
        message: "Utilisateur non trouvé ou non abonné aux notifications",
      });
    }

    const payload = JSON.stringify({
      title: title || "LineUp",
      body: body || "Vous avez une nouvelle notification",
      icon: "/icon-192x192.png",
      badge: "/icon-192x192.png",
      data: data || {},
    });

    await webpush.sendNotification(user.pushSubscription, payload);

    res.json({
      success: true,
      message: "Notification envoyée avec succès",
    });
  } catch (error) {
    console.error("❌ Erreur lors de l'envoi de la notification:", error);
    res.status(500).json({
      success: false,
      message: "Erreur lors de l'envoi de la notification",
    });
  }
});

/**
 * GET /auth/my-ticket
 * ➤ Récupérer le ticket actuel du patient connecté
 */
router.get("/my-ticket", authenticate, async (req, res) => {
  try {
    if (req.user.role.name !== "patient") {
      return res.status(403).json({
        success: false,
        message: "Accès réservé aux patients",
      });
    }

    const ticket = await Ticket.findOne({
      userId: req.user._id,
      status: { $in: ["en_attente", "en_consultation"] },
    }).sort({ createdAt: -1 });

    if (!ticket) {
      return res.status(404).json({
        success: false,
        message: "Aucun ticket actif trouvé",
      });
    }

    res.json({
      success: true,
      ticket,
    });
  } catch (error) {
    console.error("❌ Erreur récupération ticket patient:", error);
    res.status(500).json({
      success: false,
      message: "Erreur serveur lors de la récupération du ticket",
    });
  }
});

module.exports = router;
