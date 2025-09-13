const request = require("supertest");
const mongoose = require("mongoose");
const jwt = require("jsonwebtoken");
const app = require("../index");
const User = require("../models/User");
const Role = require("../models/Role");
const { generateToken } = require("../utils/jwtUtils");
const {
  authenticateRequired,
  authenticateOptional,
} = require("../middlewares/auth");

// Mock logger pour les tests
jest.mock("../utils/logger", () => ({
  warn: jest.fn(),
  error: jest.fn(),
  info: jest.fn(),
  child: jest.fn().mockReturnValue({
    warn: jest.fn(),
    error: jest.fn(),
    info: jest.fn(),
  }),
}));

describe("Auth API Tests", () => {
  let server;
  let mongoServer;

  beforeAll(async () => {
    try {
      const { connectDB } = require("../config/db");
      await connectDB(); // Utiliser notre configuration optimisée
      server = app.listen(0); // Port dynamique pour éviter les conflits
    } catch (err) {
      console.error("Erreur de connexion:", err);
      throw err;
    }
  });

  afterAll(async () => {
    try {
      const { disconnectDB } = require("../config/db");
      await new Promise((resolve) => server.close(resolve));
      await disconnectDB(); // Utiliser notre fonction de déconnexion
      // Attendre un peu pour s'assurer que tout est fermé
      await new Promise((resolve) => setTimeout(resolve, 500));
    } catch (err) {
      console.error("Erreur lors du nettoyage final:", err);
      throw err;
    }
  });

  beforeEach(async () => {
    try {
      await cleanupTestData(); // Utiliser la fonction globale de nettoyage
    } catch (err) {
      console.error("Erreur lors du nettoyage beforeEach:", err);
      throw err;
    }
  });

  afterEach(async () => {
    // Pas besoin de nettoyage après chaque test
    // Le beforeEach du prochain test s'en chargera
    jest.clearAllMocks(); // Nettoyer les mocks
  });

  describe("POST /auth/register", () => {
    it("devrait créer un nouveau patient", async () => {
      const rolePatient = await Role.create({
        name: "patient",
        displayName: "Patient",
        permissions: ["create_ticket"],
      });

      const response = await request(app).post("/auth/register").send({
        firstName: "John",
        lastName: "Doe",
        email: "john@example.com",
        password: "password123",
        phone: "0123456789",
        roleName: "patient",
      });

      expect(response.status).toBe(201);
      expect(response.body.user).toBeDefined();
      expect(response.body.user.email).toBe("john@example.com");
    });

    it("devrait refuser un email déjà utilisé", async () => {
      // Créer d'abord un utilisateur
      const rolePatient = await Role.create({
        name: "patient",
        displayName: "Patient",
        permissions: ["create_ticket"],
      });

      await User.create({
        email: "john@example.com",
        password: "hashedPassword",
        role: rolePatient._id,
        profile: {
          firstName: "John",
          lastName: "Doe",
        },
      });

      const response = await request(app).post("/auth/register").send({
        firstName: "John",
        lastName: "Doe",
        email: "john@example.com",
        password: "password123",
        phone: "0123456789",
        roleName: "patient",
      });

      expect(response.status).toBe(400);
      expect(response.body.message).toContain("existe déjà");
    });
  });

  describe("POST /auth/login", () => {
    it("devrait connecter un utilisateur avec des identifiants valides", async () => {
      // Créer un rôle et un utilisateur pour le test
      const rolePatient = await Role.create({
        name: "patient",
        displayName: "Patient",
        permissions: ["create_ticket"],
      });

      const hashedPassword = await bcrypt.hash("password123", 10);
      await User.create({
        email: "john@example.com",
        password: hashedPassword,
        role: rolePatient._id,
        profile: {
          firstName: "John",
          lastName: "Doe",
        },
      });

      const response = await request(app).post("/auth/login").send({
        email: "john@example.com",
        password: "password123",
      });

      expect(response.status).toBe(200);
      expect(response.body.token).toBeDefined();
      expect(response.body.user).toBeDefined();
    });

    it("devrait refuser des identifiants invalides", async () => {
      const response = await request(app).post("/auth/login").send({
        email: "wrong@example.com",
        password: "wrongpassword",
      });

      expect(response.status).toBe(401);
    });
  });

  describe("Middleware d'authentification", () => {
    it("devrait autoriser l'accès avec un token valide", async () => {
      const rolePatient = await Role.create({
        name: "patient",
        displayName: "Patient",
        permissions: ["create_ticket"],
      });

      const user = await User.create({
        email: "john@example.com",
        password: "hashedPassword",
        role: rolePatient._id,
        profile: {
          firstName: "John",
          lastName: "Doe",
        },
      });

      const token = generateToken(
        { userId: user._id, role: "patient" },
        process.env.JWT_SECRET || "test_secret",
        { expiresIn: "1h" }
      );

      const response = await request(app)
        .get("/auth/verify")
        .set("Authorization", `Bearer ${token}`);

      expect(response.status).toBe(200);
    });

    it("devrait refuser l'accès sans token", async () => {
      const response = await request(app).get("/auth/verify");

      expect(response.status).toBe(401);
    });
  });

  describe("Rate Limiting Tests", () => {
    it("devrait limiter les tentatives de connexion", async () => {
      // Faire 6 requêtes rapides
      const requests = [];
      for (let i = 0; i < 6; i++) {
        requests.push(
          request(app).post("/auth/login").send({
            email: "test@example.com",
            password: "wrong",
          })
        );
      }

      const responses = await Promise.all(requests);
      
      // La dernière requête devrait être limitée
      expect(responses[5].status).toBe(429);
      expect(responses[5].body.message).toMatch(/trop de tentatives/i);
    });
  });

  describe("Session et Token Tests", () => {
    it("devrait invalider un token expiré", async () => {
      const user = await User.create({
        email: "test@example.com",
        password: "password123",
        role: "patient",
      });

      // Créer un token qui expire dans 1 seconde
      const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, {
        expiresIn: "1s",
      });

      // Attendre 2 secondes
      await new Promise((resolve) => setTimeout(resolve, 2000));

      const response = await request(app)
        .get("/auth/verify")
        .set("Authorization", `Bearer ${token}`);

      expect(response.status).toBe(401);
      expect(response.body.message).toMatch(/token.*expiré/i);
    });

    it("devrait nettoyer les informations sensibles des réponses", async () => {
      const user = await User.create({
        email: "test@example.com",
        password: "password123",
        role: "patient",
      });

      const response = await request(app).post("/auth/login").send({
        email: "test@example.com",
        password: "password123",
      });

      expect(response.status).toBe(200);
      expect(response.body.user.password).toBeUndefined();
      expect(response.body.user.__v).toBeUndefined();
      expect(response.body.user.token).toBeUndefined();
    });
  });

  describe("Security-focused Authentication Tests", () => {
    let req, res, next;

    beforeEach(() => {
      req = {
        headers: {},
        user: null,
      };
      res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn().mockReturnThis(),
      };
      next = jest.fn();

      process.env.JWT_SECRET = "test-secret-key-for-security-tests";
    });

    describe("JWT Token Validation Security", () => {
      it("devrait accepter un token JWT valide", async () => {
        const user = await User.create({
          name: "Test User",
          email: "test@example.com",
          password: "hashedpassword",
          role: "patient",
        });

        const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET);
        req.headers.authorization = `Bearer ${token}`;

        await authenticateRequired(req, res, next);

        expect(req.user).toBeTruthy();
        expect(req.user._id.toString()).toBe(user._id.toString());
        expect(next).toHaveBeenCalled();
        expect(res.status).not.toHaveBeenCalled();
      });

      it("devrait rejeter un token manquant", async () => {
        await authenticateRequired(req, res, next);

        expect(res.status).toHaveBeenCalledWith(401);
        expect(res.json).toHaveBeenCalledWith({
          success: false,
          message: "Token manquant",
        });
        expect(next).not.toHaveBeenCalled();
      });

      it("devrait rejeter un token expiré", async () => {
        const user = await User.create({
          name: "Test User",
          email: "test@example.com",
          password: "hashedpassword",
          role: "patient",
        });

        const expiredToken = jwt.sign(
          { userId: user._id, exp: Math.floor(Date.now() / 1000) - 60 },
          process.env.JWT_SECRET
        );

        req.headers.authorization = `Bearer ${expiredToken}`;

        await authenticateRequired(req, res, next);

        expect(res.status).toHaveBeenCalledWith(401);
        expect(res.json).toHaveBeenCalledWith({
          success: false,
          message: "Token invalide",
        });
      });

      it("devrait rejeter un token avec signature invalide", async () => {
        const fakeToken = jwt.sign({ userId: "user123" }, "wrong-secret");
        req.headers.authorization = `Bearer ${fakeToken}`;

        await authenticateRequired(req, res, next);

        expect(res.status).toHaveBeenCalledWith(401);
        expect(res.json).toHaveBeenCalledWith({
          success: false,
          message: "Token invalide",
        });
      });

      it("devrait rejeter si utilisateur supprimé", async () => {
        const deletedUserId = new mongoose.Types.ObjectId();
        const token = jwt.sign(
          { userId: deletedUserId },
          process.env.JWT_SECRET
        );

        req.headers.authorization = `Bearer ${token}`;

        await authenticateRequired(req, res, next);

        expect(res.status).toHaveBeenCalledWith(401);
        expect(res.json).toHaveBeenCalledWith({
          success: false,
          message: "Utilisateur non trouvé",
        });
      });
    });

    describe("Protection contre les données sensibles", () => {
      it("ne devrait pas exposer le mot de passe dans req.user", async () => {
        const user = await User.create({
          name: "Test User",
          email: "test@example.com",
          password: "hashed-password-should-not-be-exposed",
          role: "patient",
        });

        const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET);
        req.headers.authorization = `Bearer ${token}`;

        await authenticateRequired(req, res, next);

        expect(req.user).toBeTruthy();
        expect(req.user.password).toBeUndefined();
        expect(req.user.__v).toBeUndefined();
      });
    });

    describe("Authentication optionnelle sécurisée", () => {
      it("devrait continuer sans erreur si pas de token", async () => {
        await authenticateOptional(req, res, next);

        expect(req.user).toBeNull();
        expect(next).toHaveBeenCalled();
        expect(res.status).not.toHaveBeenCalled();
      });

      it("devrait continuer même avec token invalide", async () => {
        req.headers.authorization = "Bearer invalid-token";

        await authenticateOptional(req, res, next);

        expect(req.user).toBeNull();
        expect(next).toHaveBeenCalled();
        expect(res.status).not.toHaveBeenCalled();
      });
    });
  });
});
