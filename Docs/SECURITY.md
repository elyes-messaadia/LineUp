# 🔒 LineUp - Documentation de Sécurité

## Table des Matières

1. [Introduction](#introduction)
2. [Failles Identifiées et Correctifs](#failles-identifiées-et-correctifs)
3. [Bonnes Pratiques de Sécurité](#bonnes-pratiques-de-sécurité)
4. [Configuration de Sécurité](#configuration-de-sécurité)
5. [Procédures d'Audit](#procédures-daudit)
6. [Plan de Réponse aux Incidents](#plan-de-réponse-aux-incidents)

## Introduction

Ce document détaille les aspects de sécurité du projet LineUp, les vulnérabilités identifiées au cours du développement et les mesures prises pour les corriger. Il sert de référence pour l'équipe de développement et les administrateurs système.

## Failles Identifiées et Correctifs

### 1. Exposition de données sensibles dans les logs

**Problème** : Les logs exposaient des données sensibles, incluant:

- Tokens d'authentification
- Adresses IP complètes des utilisateurs
- Données personnelles identifiables (PII)
- Informations de debugging en production

**Solution** :

- Implémentation d'un logger structuré avec pino
- Redaction automatique des champs sensibles (authorization, cookies, passwords)
- Fingerprinting HMAC des adresses IP pour l'anonymisation
- Niveaux de logging différenciés entre développement et production

**Code impacté** :

- `server/utils/logger.js` - Configuration de pino avec redaction
- `server/utils/fingerprint.js` - Fonction HMAC pour anonymiser les identifiants
- `server/index.js` et autres fichiers - Remplacement de console.log par logger

### 2. Absence de vérification de JWT_SECRET en production

**Problème** : Le serveur démarrait en production même si JWT_SECRET n'était pas configuré, utilisant un fallback non sécurisé.

**Solution** :

- Arrêt du serveur si JWT_SECRET n'est pas défini en production
- Message d'erreur explicite indiquant la raison de l'arrêt
- Vérification au démarrage pour éviter les risques de sécurité

**Code impacté** :

- `server/index.js` - Ajout d'une vérification de présence de JWT_SECRET
- `server/middlewares/auth.js` - Refus d'utiliser un secret par défaut en production

### 3. CORS trop permissif

**Problème** : Configuration CORS permettant toutes les origines, même en production.

**Solution** :

- Création d'une liste blanche d'origines autorisées
- Refus des requêtes sans origine en production
- Acceptation conditionnelle des sous-domaines *.netlify.app
- Log des tentatives d'accès refusées

**Code impacté** :

- `server/index.js` - Configuration CORS avec whitelist et validation stricte en production

### 4. Routes de débogage accessibles en production

**Problème** : Endpoints de débogage exposant des informations système accessibles en production.

**Solution** :

- Désactivation complète des routes de débogage en production
- Réponse 404 pour masquer leur existence
- Accès limité aux environnements de développement uniquement

**Code impacté** :

- `server/index.js` - Conditions pour désactiver `/debug-ip` et `/debug-auth` en production

### 5. Absence de protection contre les injections

**Problème** : Vulnérabilité aux attaques par injection (NoSQL, XSS).

**Solution** :

- Implémentation de express-mongo-sanitize pour prévenir les injections NoSQL
- Ajout de xss-clean pour échapper automatiquement le contenu HTML dangereux
- Configuration helmet avec CSP stricte

**Code impacté** :

- `server/middlewares/security.js` - Mise en place de sanitizers et CSP

### 6. Absence de limitation de taux

**Problème** : Pas de protection contre les attaques par force brute ou DDoS.

**Solution** :

- Implémentation de express-rate-limit
- Limites différenciées pour les routes d'authentification
- IP fingerprinting pour le tracking des abus

**Code impacté** :

- `server/middlewares/security.js` - Configuration du rate limiting
- `server/routes/auth.js` - Limites spécifiques pour login/register

### 7. Absence de protection HTTPS

**Problème** : Aucune directive forçant l'utilisation de HTTPS.

**Solution** :

- Configuration HSTS via helmet
- MaxAge de 1 an, includeSubdomains, preload
- Refus des connexions non-HTTPS en production

**Code impacté** :

- `server/middlewares/security.js` - Configuration HSTS

### 8. Route temporaire de création d'administrateur non sécurisée

**Problème** : Endpoint `/create-secretary-temp` accessible sans protection adéquate.

**Solution** :

- Désactivation complète en production
- Exigence d'une clé d'administration via header ou corps de requête
- Suppression de l'exposition du mot de passe en texte clair

**Code impacté** :

- `server/index.js` - Protection et désactivation conditionnelle de la route

### 9. Dépendances obsolètes ou vulnérables

**Problème** : Certaines dépendances étaient obsolètes ou contenaient des vulnérabilités connues.

**Solution** :

- Audit et mise à jour de toutes les dépendances
- Configuration Dependabot pour les mises à jour automatiques
- Script npm pour vérification régulière des vulnérabilités

**Code impacté** :

- `server/package.json` - Mise à jour des versions
- `client/package.json` - Mise à jour des versions

## Bonnes Pratiques de Sécurité

### Authentification

1. **JWT Sécurisé**
   - Signature avec algorithme fort (HS256)
   - Durée d'expiration courte (1 heure max)
   - Révocation possible via blacklist
   - Stockage sécurisé côté client

2. **Mots de passe**
   - Hachage avec bcrypt (coût de 12+)
   - Validation de la complexité (longueur, caractères spéciaux, etc.)
   - Politique de réinitialisation sécurisée

### Protection des Données

1. **Données Sensibles**
   - Pas de PII dans les logs
   - Anonymisation des identifiants (IP, etc.)
   - Chiffrement des données sensibles en base

2. **Cookies et Stockage**
   - Cookies avec flags Secure, HttpOnly, SameSite
   - Stockage minimal de données sensibles côté client
   - Nettoyage lors de la déconnexion

### Limitation des Attaques

1. **Injection**
   - Validation/sanitization de toutes les entrées
   - Requêtes paramétrées pour MongoDB
   - Échappement côté frontend

2. **XSS et CSRF**
   - CSP stricte via helmet
   - Sanitization des données affichées
   - Tokens anti-CSRF pour les opérations sensibles

## Configuration de Sécurité

### Headers HTTP de Sécurité

```javascript
// Configuration helmet recommandée
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", "data:"],
      connectSrc: ["'self'"]
    }
  },
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true
  }
}));
```

### Rate Limiting

```javascript
// Configuration rate-limit
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,  // 15 minutes
  max: 100,                  // 100 requêtes par fenêtre
  message: {
    success: false,
    message: "Trop de requêtes depuis cette IP. Réessayez plus tard."
  }
});

// Limiteur plus strict pour routes d'auth
const authLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,  // 1 heure
  max: 10,                   // 10 tentatives par heure
  message: {
    success: false,
    message: "Trop de tentatives de connexion. Compte temporairement bloqué."
  }
});
```

## Procédures d'Audit

### Audit Régulier

1. **Dépendances**
   - Exécution hebdomadaire de `npm audit`
   - Correction immédiate des vulnérabilités critiques
   - Révision mensuelle des dépendances obsolètes

2. **Code**
   - Révisions de code obligatoires pour les PR
   - Analyse statique avec ESLint + règles de sécurité
   - Tests de pénétration semestriels

3. **Infrastructure**
   - Vérification mensuelle des configurations de sécurité
   - Audit des logs pour détecter les activités suspectes
   - Test de restauration des backups

## Plan de Réponse aux Incidents

1. **Détection**
   - Alertes automatisées sur activité suspecte
   - Monitoring des erreurs et des patterns anormaux
   - Canaux de signalement pour les utilisateurs

2. **Réponse**
   - Équipe de réponse désignée
   - Procédure d'isolation et d'évaluation
   - Communication transparente avec les utilisateurs affectés

3. **Récupération**
   - Procédures de correction et de déploiement d'urgence
   - Restauration des données si nécessaire
   - Analyse post-incident et mesures correctives
