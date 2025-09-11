# 🔧 Guide de Dépannage

## Problèmes Courants

### 1. Problèmes de Connexion MongoDB

#### Symptômes
- Erreur "MongoDB Connection Failed"
- Timeout de connexion
- Erreurs d'authentification

#### Solutions
1. Vérifier l'URI MongoDB
2. Tester la connexion avec MongoDB Compass
3. Vérifier les paramètres du pare-feu
4. Valider les credentials dans .env

### 2. Erreurs CORS

#### Symptômes
- Erreurs dans la console du navigateur
- Requêtes bloquées
- Access-Control-Allow-Origin manquant

#### Solutions
1. Vérifier la configuration CORS dans index.js
2. Ajouter le domaine à allowedOrigins
3. Valider les headers de requête
4. Tester avec un proxy local

### 3. Problèmes d'Authentification

#### Symptômes
- Token JWT invalide
- Sessions expirées
- Erreurs 401/403

#### Solutions
1. Vérifier JWT_SECRET
2. Valider la durée de vie du token
3. Nettoyer le localStorage
4. Regénérer les tokens

### 4. Erreurs de Build Frontend

#### Symptômes
- Échec de build Vite
- Erreurs de dépendances
- Problèmes d'importation

#### Solutions
1. Nettoyer node_modules
2. Vérifier package.json
3. Mettre à jour les dépendances
4. Vérifier la compatibilité des versions

### 5. Problèmes de Notifications

#### Symptômes
- Notifications non reçues
- Erreurs de service worker
- Problèmes d'inscription push

#### Solutions
1. Vérifier les clés VAPID
2. Valider l'enregistrement du service worker
3. Tester les permissions du navigateur
4. Vérifier la configuration SSL

## Outils de Diagnostic

### Commandes Utiles

```bash
# Vérification MongoDB
npm run check:db

# Test de connexion
npm run health

# Nettoyage des données
npm run cleanup:users

# Vérification des rôles
npm run update:roles
```

### Scripts de Debug

```bash
# Debug Auth
npm run debug:auth

# Test Notifications
npm run test:notifications

# Vérification des tickets
npm run fix:tickets
```

## Logs et Monitoring

### Fichiers de Log
- `server/logs/error.log`
- `server/logs/access.log`
- `client/logs/debug.log`

### Monitoring
- Sentry pour les erreurs
- Google Analytics
- Render Dashboard
- Netlify Analytics

## Support et Ressources

### Documentation API
- [Documentation Swagger](http://localhost:5000/api-docs)
- [Guide API](./API.md)
- [Exemples de Requêtes](./API_EXAMPLES.md)

### Canaux de Support
- GitHub Issues
- Discord Support
- Email Support