const request = require("supertest");
const express = require("express");
const { setupSecurity } = require("../middlewares/security");

describe("Security Attack Scenarios Integration Tests", () => {
  let app;

  beforeEach(() => {
    app = express();
    setupSecurity(app);

    // Routes de test pour simuler l'application réelle
    app.post("/api/auth/login", (req, res) => {
      res.json({ success: true, message: "Login endpoint" });
    });

    app.post("/api/users", (req, res) => {
      res.json({ success: true, user: req.body });
    });

    app.get("/api/users/:id", (req, res) => {
      res.json({ success: true, userId: req.params.id });
    });
  });

  describe("Attaques par Force Brute", () => {
    it("devrait bloquer les tentatives de force brute sur login", async () => {
      const loginAttempts = Array(10)
        .fill()
        .map(() =>
          request(app)
            .post("/api/auth/login")
            .send({ username: "admin", password: "wrongpassword" })
        );

      const responses = await Promise.all(loginAttempts);

      // Après plusieurs tentatives, le rate limiting devrait s'activer
      const blockedRequests = responses.filter((res) => res.status === 429);
      expect(blockedRequests.length).toBeGreaterThan(0);
    });

    it("devrait permettre les tentatives légitimes après le délai", async () => {
      // Simuler le passage du temps avec un délai court pour les tests
      jest.useFakeTimers();

      // Faire plusieurs tentatives pour déclencher le rate limit
      for (let i = 0; i < 6; i++) {
        await request(app)
          .post("/api/auth/login")
          .send({ username: "admin", password: "wrong" });
      }

      // Avancer le temps simulé
      jest.advanceTimersByTime(60 * 60 * 1000); // 1 heure

      // Une nouvelle tentative devrait être acceptée
      const response = await request(app)
        .post("/api/auth/login")
        .send({ username: "admin", password: "correct" });

      expect(response.status).not.toBe(429);

      jest.useRealTimers();
    });
  });

  describe("Attaques XSS Complexes", () => {
    it("devrait bloquer XSS avec encodage multiples", async () => {
      const xssPayloads = [
        // XSS basique
        '<script>alert("XSS")</script>',
        // XSS avec encodage URL
        "%3Cscript%3Ealert%28%22XSS%22%29%3C%2Fscript%3E",
        // XSS avec encodage HTML
        "&lt;script&gt;alert(&quot;XSS&quot;)&lt;/script&gt;",
        // XSS avec événements
        '<img src="x" onerror="alert(1)">',
        // XSS via JavaScript URL
        '<a href="javascript:alert(1)">Click</a>',
        // XSS via SVG
        '<svg onload="alert(1)"></svg>',
      ];

      for (const payload of xssPayloads) {
        const response = await request(app)
          .post("/api/users")
          .send({
            name: payload,
            description: `Test with ${payload}`,
          });

        // Le payload XSS ne devrait pas être présent dans la réponse
        const responseText = JSON.stringify(response.body);
        expect(responseText).not.toContain("<script>");
        expect(responseText).not.toContain("javascript:");
        expect(responseText).not.toContain("onerror=");
      }
    });

    it("devrait préserver le contenu légitime", async () => {
      const legitimateContent = {
        name: "Dr. Jean Dupont",
        description: "Médecin généraliste expérimenté",
        speciality: "Médecine générale & urgences",
      };

      const response = await request(app)
        .post("/api/users")
        .send(legitimateContent);

      expect(response.status).toBe(200);
      expect(response.body.user.name).toContain("Dr. Jean Dupont");
    });
  });

  describe("Attaques d'Injection NoSQL", () => {
    it("devrait bloquer les injections MongoDB complexes", async () => {
      const mongoInjections = [
        // Injection basique
        { username: { $ne: null }, password: { $exists: true } },
        // Injection avec $where
        { username: "admin", password: { $where: "return true" } },
        // Injection avec $regex
        { password: { $regex: ".*" } },
        // Injection imbriquée
        {
          $or: [{ username: "admin" }, { role: "administrator" }],
        },
      ];

      for (const injection of mongoInjections) {
        const response = await request(app).post("/api/users").send(injection);

        // Les opérateurs MongoDB devraient être neutralisés
        const responseData = JSON.stringify(response.body);
        expect(responseData).not.toContain("$ne");
        expect(responseData).not.toContain("$exists");
        expect(responseData).not.toContain("$where");
        expect(responseData).not.toContain("$regex");
        expect(responseData).not.toContain("$or");
      }
    });
  });

  describe("Attaques par Header Injection", () => {
    it("devrait bloquer les tentatives d'injection de headers HTTP", async () => {
      const maliciousHeaders = {
        "X-Injected": "malicious\r\nSet-Cookie: admin=true",
        "User-Agent": "Mozilla\r\nX-Forwarded-For: attacker.com",
        Referer: "http://legitimate.com\r\nLocation: http://malicious.com",
      };

      const response = await request(app)
        .get("/api/users/123")
        .set(maliciousHeaders);

      // Les headers injectés ne devraient pas apparaître dans la réponse
      expect(response.headers).not.toHaveProperty("set-cookie");
      expect(response.headers).not.toHaveProperty("location");
    });
  });

  describe("Attaques par Upload de Fichiers", () => {
    beforeEach(() => {
      app.post("/api/upload", (req, res) => {
        // Simuler un endpoint d'upload
        const contentType = req.headers["content-type"] || "";
        const allowedTypes = ["image/jpeg", "image/png", "application/pdf"];

        if (!allowedTypes.some((type) => contentType.includes(type))) {
          return res
            .status(400)
            .json({ error: "Type de fichier non autorisé" });
        }

        res.json({ success: true });
      });
    });

    it("devrait rejeter les fichiers malveillants", async () => {
      const maliciousFiles = [
        { contentType: "application/x-executable", name: "malware.exe" },
        { contentType: "application/javascript", name: "script.js" },
        { contentType: "text/html", name: "phishing.html" },
        { contentType: "application/x-php", name: "backdoor.php" },
      ];

      for (const file of maliciousFiles) {
        const response = await request(app)
          .post("/api/upload")
          .set("Content-Type", file.contentType)
          .send("malicious content");

        expect(response.status).toBe(400);
        expect(response.body.error).toContain("non autorisé");
      }
    });

    it("devrait accepter les fichiers légitimes", async () => {
      const legitimateFiles = ["image/jpeg", "image/png", "application/pdf"];

      for (const contentType of legitimateFiles) {
        const response = await request(app)
          .post("/api/upload")
          .set("Content-Type", contentType)
          .send("legitimate file content");

        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
      }
    });
  });

  describe("Attaques CSRF (Cross-Site Request Forgery)", () => {
    it("devrait valider l'origine des requêtes", async () => {
      const maliciousOrigins = [
        "http://malicious-site.com",
        "https://phishing-lineup.com",
        "http://localhost:3000", // Même en local si non autorisé
      ];

      for (const origin of maliciousOrigins) {
        const response = await request(app)
          .post("/api/users")
          .set("Origin", origin)
          .send({ name: "Test User" });

        // En production, les origines non autorisées devraient être bloquées
        if (process.env.NODE_ENV === "production") {
          expect([403, 404, 500]).toContain(response.status);
        }
      }
    });
  });

  describe("Attaques par Déni de Service (DoS)", () => {
    it("devrait limiter les payloads volumineux", async () => {
      const oversizedPayload = {
        data: "A".repeat(50 * 1024), // 50KB > limite de 10KB
      };

      const response = await request(app)
        .post("/api/users")
        .send(oversizedPayload);

      expect(response.status).toBe(413); // Payload Too Large
    });

    it("devrait gérer les requêtes simultanées", async () => {
      // Créer 50 requêtes simultanées
      const simultaneousRequests = Array(50)
        .fill()
        .map(() => request(app).get("/api/users/123"));

      const responses = await Promise.all(simultaneousRequests);

      // Certaines requêtes pourraient être rate-limitées
      const successfulRequests = responses.filter((res) => res.status === 200);
      const rateLimitedRequests = responses.filter((res) => res.status === 429);

      expect(successfulRequests.length + rateLimitedRequests.length).toBe(50);
      expect(rateLimitedRequests.length).toBeGreaterThan(0);
    });
  });

  describe("Attaques par Traversée de Répertoires", () => {
    beforeEach(() => {
      app.get("/api/files/:filename", (req, res) => {
        const filename = req.params.filename;

        // Validation basique contre la traversée de répertoires
        if (
          filename.includes("..") ||
          filename.includes("/") ||
          filename.includes("\\")
        ) {
          return res.status(400).json({ error: "Nom de fichier invalide" });
        }

        res.json({ file: filename });
      });
    });

    it("devrait bloquer les tentatives de traversée", async () => {
      const traversalAttempts = [
        "../../../etc/passwd",
        "..\\..\\windows\\system32\\config\\sam",
        "./../../secret-files/passwords.txt",
        "%2e%2e%2f%2e%2e%2f%2e%2e%2fetc%2fpasswd", // Encodé URL
      ];

      for (const attempt of traversalAttempts) {
        const response = await request(app).get(
          `/api/files/${encodeURIComponent(attempt)}`
        );

        expect(response.status).toBe(400);
        expect(response.body.error).toContain("invalide");
      }
    });

    it("devrait accepter les noms de fichiers légitimes", async () => {
      const legitimateFiles = ["document.pdf", "image.jpg", "rapport-2024.doc"];

      for (const filename of legitimateFiles) {
        const response = await request(app).get(`/api/files/${filename}`);

        expect(response.status).toBe(200);
        expect(response.body.file).toBe(filename);
      }
    });
  });

  describe("Tests de Régression Sécurité", () => {
    it("devrait maintenir la sécurité après updates", async () => {
      // Test global qui vérifie que tous les middlewares de sécurité sont actifs
      const response = await request(app).get("/api/users/123");

      // Headers de sécurité obligatoires
      expect(response.headers).toHaveProperty("x-content-type-options");
      expect(response.headers).toHaveProperty("x-frame-options");
      expect(response.headers["x-frame-options"]).toBe("DENY");
    });

    it("devrait loguer les tentatives d'attaque", async () => {
      const consoleSpy = jest.spyOn(console, "log").mockImplementation();

      // Tentative d'attaque XSS
      await request(app)
        .post("/api/users")
        .send({ name: '<script>alert("attack")</script>' });

      // Une tentative d'attaque devrait être loggée
      expect(consoleSpy).toHaveBeenCalled();

      consoleSpy.mockRestore();
    });
  });
});
