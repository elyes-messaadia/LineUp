# 🌐 Guide de Déploiement

## Environnements de Déploiement

### Production
- Frontend : Netlify (https://lineup.netlify.app)
- Backend : Render (https://lineup-backend.onrender.com)
- Base de données : MongoDB Atlas

### Staging
- Frontend : Netlify (https://staging-lineup.netlify.app)
- Backend : Render (https://staging-lineup.onrender.com)
- Base de données : MongoDB Atlas (cluster de staging)

## Procédure de Déploiement

### 1. Préparation

```bash
# Vérification des tests
npm test

# Build du frontend
cd client
npm run build

# Vérification des variables d'environnement
npm run check:env
```

### 2. Déploiement Frontend (Netlify)

1. Push vers la branche main
2. Netlify déploie automatiquement
3. Vérifier les logs de build
4. Tester l'application déployée

### 3. Déploiement Backend (Render)

1. Push vers la branche main
2. Render déploie automatiquement
3. Vérifier les logs de déploiement
4. Tester les endpoints API

## Variables d'Environnement

### Netlify (.env.production)

```env
VITE_API_URL=https://lineup-backend.onrender.com
```

### Render

```env
NODE_ENV=production
PORT=5000
MONGO_URI=mongodb+srv://...
JWT_SECRET=...
VAPID_PUBLIC_KEY=...
VAPID_PRIVATE_KEY=...
VAPID_EMAIL=...
```

## Liste de Contrôle Post-Déploiement

1. Vérifier la connexion Frontend-Backend
2. Tester l'authentification
3. Vérifier les notifications push
4. Contrôler les performances
5. Vérifier les logs d'erreur

## Rollback

En cas de problème :

1. Retourner à la version précédente sur Netlify
2. Redéployer la dernière version stable sur Render
3. Vérifier la cohérence des données

## Monitoring

- Logs : Render Dashboard
- Performance : Google Analytics
- Erreurs : Sentry
- Uptime : UptimeRobot

## Sécurité

- Headers CORS configurés
- Rate limiting activé
- Protection XSS en place
- CSP configuré
- HTTPS forcé