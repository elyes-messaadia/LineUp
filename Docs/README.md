# LineUp - Documentation Technique et Guide de Développement

## 📋 Table des Matières

1. [Vue d'ensemble](#vue-densemble)
2. [Architecture](#architecture)
3. [Stack Technologique](#stack-technologique)
4. [Structure des Dossiers](#structure-des-dossiers)
5. [Sécurité](#sécurité)
6. [Bonnes Pratiques](#bonnes-pratiques)
7. [Déploiement](#déploiement)
8. [Maintenance](#maintenance)

## Vue d'ensemble

LineUp est une application de gestion de file d'attente pour les cabinets médicaux. Elle permet aux patients de prendre un ticket virtuel et de suivre leur progression dans la file d'attente en temps réel, tout en permettant au personnel médical de gérer efficacement le flux de patients.

### Fonctionnalités principales

- Création de tickets numériques et physiques
- Suivi en temps réel des files d'attente
- Notifications push pour alerter les patients
- Interface administrateur pour médecins et secrétaires
- Support multi-docteurs
- Statistiques et métriques d'utilisation

## Architecture

LineUp utilise une architecture client-serveur classique :

- **Frontend** : Application React (SPA) hébergée sur Netlify
- **Backend** : API REST Node.js/Express hébergée sur Render
- **Base de données** : MongoDB (hébergée sur MongoDB Atlas)
- **PWA** : Fonctionnalités hors ligne et installation sur l'appareil

```
┌─────────────┐       ┌───────────┐       ┌─────────────┐
│             │       │           │       │             │
│  Frontend   │◄─────►│  Backend  │◄─────►│  MongoDB    │
│  (React)    │       │ (Express) │       │  (Atlas)    │
│             │       │           │       │             │
└─────────────┘       └───────────┘       └─────────────┘
```

## Stack Technologique

### Frontend
- **Framework** : React 18
- **Build Tool** : Vite
- **Styling** : TailwindCSS
- **Routing** : react-router-dom
- **State Management** : Context API
- **PWA** : vite-plugin-pwa
- **Notifications** : web-push

### Backend
- **Runtime** : Node.js
- **Framework** : Express 5
- **Database** : MongoDB avec Mongoose
- **Authentication** : JWT (jsonwebtoken)
- **Validation** : Joi
- **Security Middleware** : helmet, express-rate-limit, xss-clean, express-mongo-sanitize
- **Logging** : pino, pino-http
- **Testing** : Jest, Supertest

### DevOps
- **CI/CD** : GitHub Actions
- **Hosting** : Netlify (frontend), Render (backend)
- **Monitoring** : À implémenter (recommendation: Sentry)

## Structure des Dossiers

Voici la structure recommandée pour le projet :

```
LineUp/
├── client/                  # Frontend React
│   ├── public/              # Fichiers statiques
│   ├── src/
│   │   ├── assets/          # Images, sons, etc.
│   │   ├── components/      # Composants React
│   │   ├── contexts/        # Contextes React
│   │   ├── hooks/           # Custom hooks
│   │   ├── pages/           # Composants de page
│   │   ├── services/        # Services API
│   │   ├── utils/           # Fonctions utilitaires
│   │   ├── App.jsx          # Composant racine
│   │   └── main.jsx         # Point d'entrée
│   ├── .env.example         # Variables d'environnement (exemple)
│   ├── package.json
│   └── vite.config.js
│
├── server/                  # Backend Node.js/Express
│   ├── config/              # Configuration
│   ├── controllers/         # Contrôleurs Express
│   ├── middlewares/         # Middlewares Express
│   │   ├── auth.js          # Authentification
│   │   ├── errorHandler.js  # Gestion d'erreurs
│   │   └── security.js      # Sécurité (helmet, rate-limit, etc.)
│   ├── models/              # Modèles Mongoose
│   ├── routes/              # Routes Express
│   ├── services/            # Services métier
│   ├── utils/               # Fonctions utilitaires
│   │   ├── fingerprint.js   # Anonymisation des IP
│   │   ├── jwtUtils.js      # Utilitaires JWT
│   │   └── logger.js        # Configuration du logger
│   ├── __tests__/           # Tests unitaires et d'intégration
│   ├── .env.example         # Variables d'environnement (exemple)
│   ├── index.js             # Point d'entrée
│   └── package.json
│
└── Docs/                    # Documentation
    ├── DEPLOYMENT.md        # Guide de déploiement
    ├── DEVELOPMENT.md       # Guide pour développeurs
    ├── SECURITY.md          # Politiques et pratiques de sécurité
    ├── TECHNICAL_STACK.md   # Détails techniques
    └── TROUBLESHOOTING.md   # Résolution de problèmes courants
```

## Sécurité

### Bonnes pratiques implémentées

1. **Authentification sécurisée**
   - JWT avec signature et expiration
   - Stockage sécurisé des mots de passe avec bcrypt
   - Protection contre les attaques par force brute (rate-limiting)

2. **Protection contre les attaques web courantes**
   - XSS: utilisation de helmet et xss-clean
   - Injections NoSQL: express-mongo-sanitize
   - CSRF: Configuration SameSite pour les cookies
   - Clickjacking: Headers X-Frame-Options via helmet

3. **Gestion des données sensibles**
   - Redaction des logs pour masquer les informations sensibles
   - Fingerprinting des IP avec HMAC pour respecter le RGPD
   - Expiration des jetons JWT
   - Variables d'environnement pour les secrets

4. **Validation des entrées**
   - Validation via Joi pour toutes les entrées utilisateur
   - Limitation de la taille des payloads JSON (10KB max)

5. **CORS sécurisé**
   - Liste blanche d'origines en production
   - Restriction des méthodes HTTP et headers

### À implémenter

1. **Authentification à deux facteurs (2FA)**
2. **Monitoring et alertes de sécurité**
3. **Audit régulier des dépendances**
4. **Tests de pénétration**

Pour plus de détails, consultez [SECURITY.md](./SECURITY.md).

## Bonnes Pratiques

### Développement

1. **Code propre et lisible**
   - Formatage cohérent avec ESLint et Prettier
   - Commentaires explicatifs pour la logique complexe
   - Nommage significatif des variables et fonctions

2. **Tests**
   - Tests unitaires pour les utilitaires et services
   - Tests d'intégration pour les routes API
   - Tests end-to-end pour les flux critiques

3. **Performance**
   - Mise en cache appropriée
   - Pagination pour les résultats volumineux
   - Optimisation des images et assets
   - Lazy loading des composants React

4. **Versioning**
   - Commits atomiques avec messages descriptifs
   - Branches pour chaque fonctionnalité
   - Pull requests avec revue de code
   - Semantic versioning pour les releases

### Backend

1. **API REST**
   - Endpoints RESTful cohérents
   - Codes de statut HTTP appropriés
   - Réponses JSON uniformes
   - Gestion d'erreurs centralisée

2. **Middlewares**
   - Séparation des préoccupations
   - Authentification et autorisation claires
   - Logging structuré

3. **Sécurité**
   - Pas de secrets en dur dans le code
   - Validation de toutes les entrées utilisateur
   - Principe du moindre privilège

### Frontend

1. **Composants**
   - Composants petits et réutilisables
   - Séparation présentation/logique
   - Hooks personnalisés pour la logique partagée

2. **État**
   - Utilisation appropriée de Context API
   - État local pour les préoccupations locales
   - État global uniquement lorsque nécessaire

3. **UI/UX**
   - Interface réactive (responsive)
   - Feedback utilisateur pour les opérations longues
   - Gestion des erreurs conviviale
   - Design cohérent

## Déploiement

Le projet est configuré pour un déploiement continu :

- **Frontend** : Déployé automatiquement sur Netlify à partir de la branche `main`
- **Backend** : Déployé automatiquement sur Render à partir de la branche `main`

Pour plus de détails sur le déploiement, consultez [DEPLOYMENT.md](./DEPLOYMENT.md).

## Maintenance

### Mises à jour régulières

- Audit des dépendances avec `npm audit`
- Mise à jour des packages non critiques mensuellement
- Mise à jour des packages critiques dès que des correctifs de sécurité sont disponibles

### Monitoring

- Surveillance des performances et des erreurs avec Sentry (à implémenter)
- Alertes pour les pics d'utilisation et les erreurs critiques
- Analyse des logs pour détecter les comportements anormaux

### Backups

- Sauvegarde quotidienne de la base de données
- Rétention de 30 jours pour les sauvegardes

Pour plus d'informations sur la maintenance, consultez [MAINTENANCE.md](./MAINTENANCE.md).