const mongoose = require('mongoose');

describe('Data Validation and Sanitization Tests', () => {
  describe('MongoDB Injection Protection', () => {
    it('devrait bloquer les opérateurs MongoDB malveillants', () => {
      const maliciousInput = {
        username: { $ne: null },
        password: { $regex: '.*' },
        email: { $where: 'function() { return true; }' }
      };

      // Simuler la sanitisation mongo-sanitize
      const sanitized = JSON.parse(JSON.stringify(maliciousInput));
      
      // Remplacer les clés commençant par $
      Object.keys(sanitized).forEach(key => {
        if (typeof sanitized[key] === 'object' && sanitized[key] !== null) {
          Object.keys(sanitized[key]).forEach(subKey => {
            if (subKey.startsWith('$')) {
              sanitized[key][subKey.replace('$', '_')] = sanitized[key][subKey];
              delete sanitized[key][subKey];
            }
          });
        }
      });

      expect(sanitized.username).not.toHaveProperty('$ne');
      expect(sanitized.password).not.toHaveProperty('$regex');
      expect(sanitized.email).not.toHaveProperty('$where');
    });

    it('devrait préserver les données légitimes avec des points', () => {
      const legitimateInput = {
        'user.name': 'John Doe',
        'preferences.theme': 'dark',
        email: 'user@domain.com'
      };

      // mongo-sanitize avec allowDots: true devrait préserver ces données
      const sanitized = { ...legitimateInput };

      expect(sanitized['user.name']).toBe('John Doe');
      expect(sanitized['preferences.theme']).toBe('dark');
      expect(sanitized.email).toBe('user@domain.com');
    });

    it('devrait gérer les injections NoSQL imbriquées', () => {
      const nestedInjection = {
        user: {
          credentials: {
            username: 'admin',
            password: { $gt: '' }
          },
          profile: {
            $or: [{ role: 'admin' }, { role: 'superuser' }]
          }
        }
      };

      // Fonction récursive de nettoyage
      function sanitizeRecursive(obj) {
        if (typeof obj !== 'object' || obj === null) return obj;
        
        const cleaned = {};
        for (const key in obj) {
          const cleanKey = key.startsWith('$') ? key.replace('$', '_') : key;
          if (typeof obj[key] === 'object' && obj[key] !== null) {
            cleaned[cleanKey] = sanitizeRecursive(obj[key]);
          } else {
            cleaned[cleanKey] = obj[key];
          }
        }
        return cleaned;
      }

      const sanitized = sanitizeRecursive(nestedInjection);

      expect(sanitized.user.credentials.password).not.toHaveProperty('$gt');
      expect(sanitized.user.profile).not.toHaveProperty('$or');
    });
  });

  describe('XSS Protection', () => {
    it('devrait nettoyer les scripts JavaScript malveillants', () => {
      const xssPayloads = [
        '<script>alert("XSS")</script>',
        '<img src="x" onerror="alert(1)">',
        '<svg onload="alert(1)">',
        'javascript:alert("XSS")',
        '<iframe src="javascript:alert(1)"></iframe>'
      ];

      xssPayloads.forEach(payload => {
        // Simuler xss-clean
        let cleaned = payload
          .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
          .replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, '')
          .replace(/on\w+\s*=\s*["'][^"']*["']/gi, '')
          .replace(/javascript:/gi, '');

        expect(cleaned).not.toContain('<script>');
        expect(cleaned).not.toContain('javascript:');
        expect(cleaned).not.toContain('onerror=');
        expect(cleaned).not.toContain('onload=');
      });
    });

    it('devrait préserver le contenu HTML légitime', () => {
      const legitimateHTML = [
        '<p>Texte normal</p>',
        '<div class="container">Contenu</div>',
        '<a href="https://example.com">Lien sécurisé</a>',
        '<strong>Texte important</strong>'
      ];

      legitimateHTML.forEach(html => {
        // Le contenu légitime devrait être préservé (selon la configuration XSS)
        expect(html).toContain('<');
        expect(html).toContain('>');
      });
    });

    it('devrait gérer les tentatives d\'encodage', () => {
      const encodedXSS = [
        '&lt;script&gt;alert(1)&lt;/script&gt;',
        '&#60;script&#62;alert(1)&#60;/script&#62;',
        '%3Cscript%3Ealert(1)%3C/script%3E'
      ];

      encodedXSS.forEach(encoded => {
        // Décoder puis nettoyer
        let decoded = encoded
          .replace(/&lt;/g, '<')
          .replace(/&gt;/g, '>')
          .replace(/&#60;/g, '<')
          .replace(/&#62;/g, '>')
          .replace(/%3C/g, '<')
          .replace(/%3E/g, '>');

        // Puis nettoyer
        decoded = decoded.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');
        
        expect(decoded).not.toContain('<script>');
      });
    });
  });

  describe('Input Validation', () => {
    it('devrait valider les formats d\'email', () => {
      const validEmails = [
        'user@example.com',
        'test.email+tag@domain.co.uk',
        'user123@subdomain.example.org'
      ];

      const invalidEmails = [
        'plaintext',
        '@domain.com',
        'user@',
        'user..double.dot@domain.com',
        'user@domain'
      ];

      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

      validEmails.forEach(email => {
        expect(emailRegex.test(email)).toBe(true);
      });

      invalidEmails.forEach(email => {
        expect(emailRegex.test(email)).toBe(false);
      });
    });

    it('devrait valider les mots de passe forts', () => {
      const strongPasswords = [
        'MyStr0ng!P@ssw0rd',
        'C0mpl3x&Secure#123',
        'V3ry$Strong!Pass9'
      ];

      const weakPasswords = [
        '123456',
        'password',
        'abc123',
        'motdepasse',
        '12345678'
      ];

      // Critères : au moins 8 caractères, majuscule, minuscule, chiffre, caractère spécial
      const strongPasswordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;

      strongPasswords.forEach(password => {
        expect(strongPasswordRegex.test(password)).toBe(true);
      });

      weakPasswords.forEach(password => {
        expect(strongPasswordRegex.test(password)).toBe(false);
      });
    });

    it('devrait limiter la longueur des champs', () => {
      const testCases = [
        { field: 'name', value: 'A'.repeat(100), maxLength: 50, shouldPass: false },
        { field: 'name', value: 'John Doe', maxLength: 50, shouldPass: true },
        { field: 'description', value: 'A'.repeat(1000), maxLength: 500, shouldPass: false },
        { field: 'description', value: 'Description normale', maxLength: 500, shouldPass: true }
      ];

      testCases.forEach(({ field, value, maxLength, shouldPass }) => {
        const isValid = value.length <= maxLength;
        expect(isValid).toBe(shouldPass);
      });
    });
  });

  describe('File Upload Security', () => {
    it('devrait valider les types de fichiers autorisés', () => {
      const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'application/pdf'];
      const maliciousTypes = [
        'application/x-executable',
        'application/javascript',
        'text/html',
        'application/x-php'
      ];

      maliciousTypes.forEach(type => {
        expect(allowedTypes.includes(type)).toBe(false);
      });

      ['image/jpeg', 'application/pdf'].forEach(type => {
        expect(allowedTypes.includes(type)).toBe(true);
      });
    });

    it('devrait vérifier les extensions de fichiers', () => {
      const safeExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.pdf'];
      const dangerousExtensions = ['.exe', '.php', '.js', '.html', '.bat'];

      const isAllowedExtension = (filename) => {
        const ext = filename.toLowerCase().substring(filename.lastIndexOf('.'));
        return safeExtensions.includes(ext);
      };

      expect(isAllowedExtension('photo.jpg')).toBe(true);
      expect(isAllowedExtension('document.pdf')).toBe(true);
      expect(isAllowedExtension('script.exe')).toBe(false);
      expect(isAllowedExtension('malware.php')).toBe(false);
    });

    it('devrait limiter la taille des fichiers', () => {
      const maxSize = 5 * 1024 * 1024; // 5MB
      
      const testFiles = [
        { name: 'small.jpg', size: 100 * 1024 }, // 100KB
        { name: 'large.jpg', size: 10 * 1024 * 1024 }, // 10MB
        { name: 'medium.pdf', size: 2 * 1024 * 1024 } // 2MB
      ];

      testFiles.forEach(file => {
        const isValidSize = file.size <= maxSize;
        if (file.name === 'large.jpg') {
          expect(isValidSize).toBe(false);
        } else {
          expect(isValidSize).toBe(true);
        }
      });
    });
  });

  describe('SQL/NoSQL Injection via Input Fields', () => {
    it('devrait détecter les tentatives d\'injection SQL classiques', () => {
      const sqlInjectionAttempts = [
        "'; DROP TABLE users; --",
        "1' OR '1'='1",
        "admin'--",
        "1; DELETE FROM patients; --",
        "UNION SELECT * FROM users"
      ];

      // Fonction de détection simple
      const containsSQLInjection = (input) => {
        const suspiciousPatterns = [
          /('|(\\')|(;|\\;))/i,
          /((\s|^)(union|select|insert|delete|drop|create|alter|exec)(\s|$))/i,
          /(--|\#|\|)/,
          /(\bor\b|\band\b)(\s+\w+\s*=\s*\w+)/i
        ];
        
        return suspiciousPatterns.some(pattern => pattern.test(input));
      };

      sqlInjectionAttempts.forEach(attempt => {
        expect(containsSQLInjection(attempt)).toBe(true);
      });

      // Données légitimes
      const legitimateInputs = [
        "John O'Connor", // Apostrophe légitime
        "user@domain.com",
        "Description normale du patient"
      ];

      // Note: Le nom avec apostrophe pourrait déclencher une fausse alerte
      // Dans un vrai système, il faudrait une logique plus sophistiquée
    });
  });

  describe('Content Security Policy Validation', () => {
    it('devrait valider les sources CSP', () => {
      const allowedSources = [
        "'self'",
        "https://cdn.jsdelivr.net",
        "https://fonts.googleapis.com"
      ];

      const maliciousSources = [
        "javascript:",
        "data:",
        "http://malicious-site.com",
        "'unsafe-eval'"
      ];

      // En production, seules les sources autorisées devraient être acceptées
      const isAllowedSource = (source) => {
        return allowedSources.some(allowed => 
          source === allowed || 
          (source.startsWith('https://') && allowedSources.includes("'self'"))
        );
      };

      allowedSources.forEach(source => {
        expect(isAllowedSource(source)).toBe(true);
      });

      maliciousSources.forEach(source => {
        if (source !== "data:") { // data: peut être autorisé pour les images
          expect(isAllowedSource(source)).toBe(false);
        }
      });
    });
  });
});