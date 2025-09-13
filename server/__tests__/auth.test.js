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
}));

describe("Auth API Tests", () => {
  beforeAll(async () => {
    // Connexion à la base de données de test
    await mongoose.connect(
      process.env.MONGODB_URI || "mongodb://localhost:27017/lineup-test"
    );
  });

  afterAll(async () => {
    await mongoose.connection.close();
  });

  beforeEach(async () => {
    // Nettoyer la base de données avant chaque test
    await User.deleteMany({});
    await Role.deleteMany({});
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
