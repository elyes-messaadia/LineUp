# Tests de Sécurité - Guide d'Exécution

## Vue d'ensemble

Cette suite de tests de sécurité couvre tous les aspects critiques de la sécurité du projet LineUp. Les tests sont organisés en 6 catégories principales pour une couverture complète.

## Structure des Tests

### 1. Tests Middleware de Sécurité (`security.test.js`)
- **Rate Limiting** : Validation des limites de requêtes
- **Headers Helmet** : Vérification des headers de sécurité (CSP, HSTS, XSS Protection)
- **Protection XSS** : Nettoyage des scripts malveillants
- **Protection NoSQL** : Blocage des injections MongoDB
- **Limite payloads** : Contrôle de la taille des données
- **Logging sécurisé** : Anonymisation des données sensibles

### 2. Tests d'Authentification (`auth.test.js`)
- **Validation JWT** : Tokens valides/invalides/expirés
- **Protection timing attacks** : Temps de réponse constants
- **Sécurité JWT Secret** : Validation de la configuration
- **Nettoyage données** : Suppression des informations sensibles
- **Authentication optionnelle** : Gestion des cas sans token

### 3. Tests Logging Sécurisé (`logging.test.js`)
- **Configuration logger** : Paramètres de sécurité
- **Redaction données** : Masquage automatique des informations sensibles
- **Anonymisation IPs** : Empreintes HMAC des adresses
- **Performance** : Impact minimal sur les performances
- **Sécurité production** : Validation des logs en environnement production

### 4. Tests Validation Données (`validation.test.js`)
- **Protection MongoDB** : Injection NoSQL avancée
- **Protection XSS** : Scripts malveillants et encodage
- **Validation inputs** : Emails, mots de passe, longueurs
- **Sécurité uploads** : Types et tailles de fichiers
- **Détection injections** : Patterns SQL/NoSQL suspects

### 5. Tests Scénarios d'Attaque (`security-integration.test.js`)
- **Force brute** : Attaques sur authentification
- **XSS complexes** : Encodages multiples et événements
- **Injections avancées** : NoSQL, headers HTTP
- **Upload malveillants** : Fichiers exécutables
- **CSRF** : Validation d'origine
- **DoS** : Payloads volumineux et requêtes simultanées
- **Traversée répertoires** : Accès non autorisé aux fichiers

## Installation des Dépendances

```bash
npm install --save-dev jest supertest
```

## Exécution des Tests

### Tous les tests de sécurité
```bash
npm test -- --testPathPattern=security
```

### Tests spécifiques
```bash
# Tests middleware
npm test security.test.js

# Tests authentification
npm test auth.test.js

# Tests logging
npm test logging.test.js

# Tests validation
npm test validation.test.js

# Tests intégration
npm test security-integration.test.js
```

### Avec couverture de code
```bash
npm test -- --coverage --testPathPattern=security
```

## Configuration des Tests

### Variables d'environnement
```bash
# Fichier .env.test
NODE_ENV=test
MONGO_URI_TEST=mongodb://localhost:27017/lineup_test
JWT_SECRET=test-secret-key-minimum-32-characters
LOG_LEVEL=error
```

### Configuration Jest (package.json)
```json
{
  "scripts": {
    "test:security": "jest --testPathPattern=security --coverage",
    "test:security:watch": "jest --testPathPattern=security --watch"
  },
  "jest": {
    "testEnvironment": "node",
    "coverageDirectory": "coverage",
    "collectCoverageFrom": [
      "middlewares/**/*.js",
      "utils/**/*.js",
      "!**/*.test.js"
    ]
  }
}
```

## Métriques de Sécurité Couvertes

### ✅ Authentification & Autorisation
- Validation des tokens JWT
- Gestion de l'expiration
- Protection contre les attaques par timing
- Nettoyage des données utilisateur

### ✅ Protection des Données
- Redaction automatique des logs
- Anonymisation des IPs
- Chiffrement des identifiants sensibles
- Validation stricte des entrées

### ✅ Prévention des Attaques
- **XSS** : Cross-Site Scripting
- **Injection NoSQL** : MongoDB operators
- **CSRF** : Cross-Site Request Forgery
- **DoS** : Denial of Service
- **Force Brute** : Tentatives répétées
- **Upload malveillants** : Fichiers dangereux

### ✅ Headers de Sécurité
- **CSP** : Content Security Policy
- **HSTS** : HTTP Strict Transport Security
- **X-Frame-Options** : Protection clickjacking
- **X-Content-Type-Options** : MIME sniffing
- **Referrer-Policy** : Contrôle des référents

### ✅ Rate Limiting
- Limites globales (100 req/15min)
- Limites authentification (5 req/h)
- Protection contre le spam
- Gestion des pics de trafic

## Interprétation des Résultats

### Succès Attendus ✅
- Tous les tests passent sans erreur
- Couverture de code > 90% sur les middlewares de sécurité
- Temps d'exécution < 30 secondes pour la suite complète

### Alertes à Surveiller ⚠️
- Tests échoués = vulnérabilité potentielle
- Couverture < 80% = zones non testées
- Temps d'exécution > 1 minute = problèmes de performance

### Actions en Cas d'Échec ❌
1. **Vérifier la configuration** des middlewares de sécurité
2. **Contrôler les variables d'environnement** (JWT_SECRET, etc.)
3. **Examiner les logs** pour identifier la cause
4. **Mettre à jour les dépendances** de sécurité si nécessaire

## Automatisation CI/CD

### GitHub Actions Example
```yaml
name: Security Tests
on: [push, pull_request]
jobs:
  security:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
      - run: npm install
      - run: npm run test:security
      - name: Upload coverage
        uses: codecov/codecov-action@v3
```

## Maintenance des Tests

### Fréquence Recommandée
- **Quotidienne** : Exécution automatique sur commits
- **Hebdomadaire** : Révision des métriques de sécurité
- **Mensuelle** : Mise à jour des patterns d'attaque
- **Trimestrielle** : Audit complet de sécurité

### Évolution des Tests
- Ajouter de nouveaux vecteurs d'attaque découverts
- Mettre à jour selon les nouvelles vulnérabilités CVE
- Adapter aux changements d'architecture
- Intégrer les retours des audits de sécurité

## Support et Documentation

### En cas de Questions
- Consulter la documentation `SECURITY.md`
- Vérifier les logs du serveur
- Contacter l'équipe sécurité si tests critiques échouent

### Ressources Utiles
- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [Node.js Security Checklist](https://nodejs.org/en/docs/guides/security/)
- [Express.js Security Best Practices](https://expressjs.com/en/advanced/best-practice-security.html)