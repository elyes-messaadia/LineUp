const request = require("supertest");
const express = require("express");
const { setupSecurity } = require("../middlewares/security");

// Mock du logger pour ce test spécifiquement
jest.mock("../utils/logger", () => ({
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
  debug: jest.fn(),
  child: jest.fn().mockReturnValue({
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
  }),
}));

describe("Security Middleware Tests", () => {
  let app;

  beforeEach(() => {
    app = express();
    setupSecurity(app);

    // Route de test simple
    app.get("/test", (req, res) => {
      res.json({ success: true, message: "Test endpoint" });
    });

    app.post("/test", (req, res) => {
      res.json({ success: true, data: req.body });
    });
  });

  describe("Rate Limiting", () => {
    it("devrait accepter les requêtes normales", async () => {
      const response = await request(app).get("/test").expect(200);

      expect(response.body.success).toBe(true);
    });

    it("devrait bloquer après trop de requêtes", async () => {
      // Faire 101 requêtes rapidement pour déclencher le rate limit (max: 100)
      const requests = Array(101)
        .fill()
        .map(() => request(app).get("/test"));

      const responses = await Promise.all(requests);

      // La dernière requête devrait être bloquée
      const lastResponse = responses[responses.length - 1];
      expect(lastResponse.status).toBe(429);
      expect(lastResponse.body.message).toContain("Trop de requêtes");
    });
  });

  describe("Helmet Security Headers", () => {
    it("devrait définir les headers de sécurité Helmet", async () => {
      const response = await request(app).get("/test").expect(200);

      // Vérifier la présence des headers de sécurité
      expect(response.headers).toHaveProperty(
        "x-content-type-options",
        "nosniff"
      );
      expect(response.headers).toHaveProperty("x-frame-options", "DENY");
      expect(response.headers).toHaveProperty("x-xss-protection");
    });

    it("devrait définir la politique CSP", async () => {
      const response = await request(app).get("/test").expect(200);

      expect(response.headers).toHaveProperty("content-security-policy");
      const csp = response.headers["content-security-policy"];
      expect(csp).toContain("default-src 'self'");
    });

    it("devrait définir HSTS en production", async () => {
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = "production";

      const prodApp = express();
      setupSecurity(prodApp);
      prodApp.get("/test", (req, res) => res.json({}));

      const response = await request(prodApp).get("/test").expect(200);

      expect(response.headers).toHaveProperty("strict-transport-security");

      process.env.NODE_ENV = originalEnv;
    });
  });

  describe("XSS Protection", () => {
    it("devrait nettoyer les scripts malveillants", async () => {
      const maliciousPayload = {
        name: '<script>alert("XSS")</script>',
        description: "Test normal",
      };

      const response = await request(app)
        .post("/test")
        .send(maliciousPayload)
        .expect(200);

      // Le script devrait être nettoyé ou échappé
      expect(response.body.data.name).not.toContain("<script>");
    });

    it("devrait préserver le contenu légitime", async () => {
      const legitimatePayload = {
        name: "John Doe",
        description: "Patient normal avec des données légitimes",
      };

      const response = await request(app)
        .post("/test")
        .send(legitimatePayload)
        .expect(200);

      expect(response.body.data.name).toBe("John Doe");
      expect(response.body.data.description).toContain("Patient normal");
    });
  });

  describe("NoSQL Injection Protection", () => {
    it("devrait bloquer les tentatives d'injection NoSQL", async () => {
      const injectionPayload = {
        username: { $ne: null },
        password: { $regex: ".*" },
      };

      const response = await request(app)
        .post("/test")
        .send(injectionPayload)
        .expect(200);

      // Les opérateurs MongoDB devraient être supprimés/remplacés
      expect(response.body.data.username).not.toHaveProperty("$ne");
      expect(response.body.data.password).not.toHaveProperty("$regex");
    });

    it("devrait permettre les données normales avec des points", async () => {
      const normalPayload = {
        email: "user@domain.com",
        "user.preferences": "dark_mode",
      };

      const response = await request(app)
        .post("/test")
        .send(normalPayload)
        .expect(200);

      expect(response.body.data.email).toBe("user@domain.com");
    });
  });

  describe("Limite de taille des payloads", () => {
    it("devrait accepter les payloads de taille normale", async () => {
      const normalPayload = {
        data: "A".repeat(1000), // 1KB
      };

      const response = await request(app)
        .post("/test")
        .send(normalPayload)
        .expect(200);

      expect(response.body.success).toBe(true);
    });

    it("devrait rejeter les payloads trop volumineux", async () => {
      const oversizedPayload = {
        data: "A".repeat(15000), // 15KB > limite de 10KB
      };

      await request(app).post("/test").send(oversizedPayload).expect(413); // Payload Too Large
    });
  });

  describe("Logging de sécurité", () => {
    let consoleSpy;

    beforeEach(() => {
      consoleSpy = jest.spyOn(console, "log").mockImplementation();
    });

    afterEach(() => {
      consoleSpy.mockRestore();
    });

    it("devrait logger les requêtes POST sensibles", async () => {
      await request(app).post("/test").send({ data: "test" }).expect(200);

      // Vérifier que le logging a eu lieu
      // Note: adapter selon l'implémentation réelle du logger
      expect(consoleSpy).toHaveBeenCalled();
    });

    it("ne devrait pas logger les données sensibles en production", async () => {
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = "production";

      await request(app)
        .post("/test")
        .set("Authorization", "Bearer secret-token")
        .send({ password: "secret123" })
        .expect(200);

      // Vérifier qu'aucune donnée sensible n'est loggée
      const logCalls = consoleSpy.mock.calls.flat();
      const logString = JSON.stringify(logCalls);

      expect(logString).not.toContain("secret-token");
      expect(logString).not.toContain("secret123");

      process.env.NODE_ENV = originalEnv;
    });
  });
});
