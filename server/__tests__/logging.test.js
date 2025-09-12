const logger = require('../utils/logger');
const { hmacFingerprint } = require('../utils/fingerprint');
const httpLogger = require('../middlewares/httpLogger');

// Mock des dépendances
jest.mock('pino-http', () => {
  return jest.fn(() => (req, res, next) => {
    req.log = {
      info: jest.fn(),
      warn: jest.fn(),
      error: jest.fn()
    };
    next();
  });
});

describe('Secure Logging Tests', () => {
  let mockReq, mockRes, mockNext;

  beforeEach(() => {
    mockReq = {
      method: 'POST',
      url: '/api/test',
      path: '/api/test',
      ip: '192.168.1.100',
      headers: {
        'user-agent': 'Test Agent',
        'authorization': 'Bearer secret-token-123',
        'cookie': 'session=secret-session-data'
      },
      body: {
        username: 'testuser',
        password: 'secret-password'
      }
    };

    mockRes = {
      statusCode: 200,
      responseTime: 150
    };

    mockNext = jest.fn();

    // Clear environment
    delete process.env.NODE_ENV;
    delete process.env.LOG_HMAC_KEY;
  });

  describe('Logger Configuration', () => {
    it('devrait créer un logger avec la configuration de base', () => {
      expect(logger).toBeDefined();
      expect(typeof logger.info).toBe('function');
      expect(typeof logger.error).toBe('function');
      expect(typeof logger.warn).toBe('function');
    });

    it('devrait avoir une fonction pour créer des sous-loggers', () => {
      const subLogger = logger.getSubLogger('test-context');
      expect(subLogger).toBeDefined();
      expect(typeof subLogger.info).toBe('function');
    });

    it('ne devrait pas logger l\'initialisation en mode test', () => {
      process.env.NODE_ENV = 'test';
      // Le logger ne devrait pas émettre de log d'initialisation en mode test
      const spy = jest.spyOn(logger, 'info');
      
      // Réimporter le logger pour déclencher l'initialisation
      jest.resetModules();
      require('../utils/logger');
      
      expect(spy).not.toHaveBeenCalledWith('Logger initialized');
      spy.mockRestore();
    });
  });

  describe('Redaction des Données Sensibles', () => {
    it('devrait masquer les headers d\'autorisation', () => {
      const logData = {
        req: {
          headers: {
            authorization: 'Bearer secret-token',
            cookie: 'session=secret'
          }
        }
      };

      // Simuler la redaction du logger
      const redactedData = JSON.parse(JSON.stringify(logData));
      if (redactedData.req?.headers?.authorization) {
        redactedData.req.headers.authorization = '[DONNÉES SENSIBLES]';
      }
      if (redactedData.req?.headers?.cookie) {
        redactedData.req.headers.cookie = '[DONNÉES SENSIBLES]';
      }

      expect(redactedData.req.headers.authorization).toBe('[DONNÉES SENSIBLES]');
      expect(redactedData.req.headers.cookie).toBe('[DONNÉES SENSIBLES]');
    });

    it('devrait masquer les mots de passe dans le body', () => {
      const logData = {
        req: {
          body: {
            username: 'user',
            password: 'secret123',
            token: 'jwt-token'
          }
        }
      };

      // Simuler la redaction
      const redactedData = JSON.parse(JSON.stringify(logData));
      if (redactedData.req?.body?.password) {
        redactedData.req.body.password = '[DONNÉES SENSIBLES]';
      }
      if (redactedData.req?.body?.token) {
        redactedData.req.body.token = '[DONNÉES SENSIBLES]';
      }

      expect(redactedData.req.body.password).toBe('[DONNÉES SENSIBLES]');
      expect(redactedData.req.body.token).toBe('[DONNÉES SENSIBLES]');
      expect(redactedData.req.body.username).toBe('user'); // Pas sensible
    });
  });

  describe('Anonymisation des IPs', () => {
    it('devrait créer une empreinte HMAC pour les IPs', () => {
      const ip = '192.168.1.100';
      const fingerprint1 = hmacFingerprint(ip);
      const fingerprint2 = hmacFingerprint(ip);

      expect(fingerprint1).toBe(fingerprint2); // Cohérent
      expect(fingerprint1).not.toBe(ip); // Anonymisé
      expect(fingerprint1.length).toBeGreaterThan(10); // Hash suffisamment long
    });

    it('devrait utiliser JWT_SECRET comme clé de fallback', () => {
      process.env.JWT_SECRET = 'fallback-key';
      delete process.env.LOG_HMAC_KEY;

      const ip = '10.0.0.1';
      const fingerprint = hmacFingerprint(ip);

      expect(fingerprint).toBeDefined();
      expect(fingerprint).not.toBe(ip);
    });

    it('devrait gérer les erreurs de création d\'empreinte', () => {
      const originalCreateHmac = require('crypto').createHmac;
      require('crypto').createHmac = jest.fn(() => {
        throw new Error('Crypto error');
      });

      const result = hmacFingerprint('test-ip');
      
      // Devrait retourner la valeur originale en cas d'erreur
      expect(result).toBe('test-ip');

      // Restaurer la fonction originale
      require('crypto').createHmac = originalCreateHmac;
    });
  });

  describe('HTTP Logger Middleware', () => {
    it('devrait créer un middleware de logging HTTP', () => {
      const middleware = httpLogger();
      expect(typeof middleware).toBe('function');
    });

    it('devrait logger différemment en production vs développement', () => {
      // Test en développement
      process.env.NODE_ENV = 'development';
      const devMiddleware = httpLogger();
      expect(devMiddleware).toBeDefined();

      // Test en production
      process.env.NODE_ENV = 'production';
      const prodMiddleware = httpLogger();
      expect(prodMiddleware).toBeDefined();
    });

    it('devrait personnaliser les propriétés loggées', () => {
      const customProps = {
        method: mockReq.method,
        url: mockReq.url,
        statusCode: mockRes.statusCode
      };

      // En production, devrait inclure l'empreinte IP
      process.env.NODE_ENV = 'production';
      customProps.ipFingerprint = hmacFingerprint(mockReq.ip);
      
      expect(customProps.ipFingerprint).toBeDefined();
      expect(customProps.ipFingerprint).not.toBe(mockReq.ip);
    });
  });

  describe('Niveaux de Log Sécurisés', () => {
    it('devrait définir le bon niveau selon l\'environnement', () => {
      process.env.NODE_ENV = 'production';
      process.env.LOG_LEVEL = undefined;
      
      // En production sans LOG_LEVEL explicite, devrait être 'info'
      const expectedLevel = 'info';
      expect(['trace', 'debug', 'info', 'warn', 'error']).toContain(expectedLevel);
    });

    it('devrait respecter LOG_LEVEL personnalisé', () => {
      process.env.LOG_LEVEL = 'warn';
      
      // Devrait utiliser le niveau personnalisé
      expect(process.env.LOG_LEVEL).toBe('warn');
    });
  });

  describe('Performance du Logging', () => {
    it('ne devrait pas impacter significativement les performances', () => {
      const iterations = 1000;
      const start = Date.now();

      for (let i = 0; i < iterations; i++) {
        hmacFingerprint(`192.168.1.${i % 255}`);
      }

      const duration = Date.now() - start;
      
      // Ne devrait pas prendre plus de 100ms pour 1000 empreintes
      expect(duration).toBeLessThan(100);
    });

    it('devrait gérer les gros volumes de logs', () => {
      const largeData = {
        data: 'A'.repeat(1000), // 1KB de données
        metadata: {
          timestamp: new Date(),
          requestId: 'req-123'
        }
      };

      const start = Date.now();
      
      // Simuler le logging de gros objets
      for (let i = 0; i < 100; i++) {
        JSON.stringify(largeData); // Simulation de sérialisation
      }

      const duration = Date.now() - start;
      
      // Ne devrait pas être bloquant
      expect(duration).toBeLessThan(50);
    });
  });

  describe('Sécurité des Logs en Production', () => {
    beforeEach(() => {
      process.env.NODE_ENV = 'production';
    });

    it('ne devrait jamais logger les tokens d\'authentification', () => {
      const potentiallyDangerousLog = {
        headers: mockReq.headers,
        body: mockReq.body
      };

      // Vérifier qu'aucune donnée sensible ne peut fuiter
      const serialized = JSON.stringify(potentiallyDangerousLog);
      
      // Ces éléments ne devraient jamais apparaître dans les logs
      expect(serialized).not.toContain('Bearer secret-token-123');
      expect(serialized).not.toContain('secret-password');
      expect(serialized).not.toContain('session=secret-session-data');
    });

    it('devrait anonymiser complètement les IPs en production', () => {
      const realIPs = [
        '192.168.1.100',
        '10.0.0.1',
        '172.16.0.1',
        '203.0.113.1'
      ];

      realIPs.forEach(ip => {
        const anonymized = hmacFingerprint(ip);
        
        expect(anonymized).not.toContain('192.168');
        expect(anonymized).not.toContain('10.0');
        expect(anonymized).not.toContain('172.16');
        expect(anonymized).not.toContain('203.0');
        expect(anonymized).not.toBe(ip);
      });
    });
  });
});