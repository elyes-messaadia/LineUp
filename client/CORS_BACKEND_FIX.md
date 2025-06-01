# 🔧 Correction Problème Backend - CORS & API

## 🚨 Problème Identifié

### Frontend Netlify : ✅ Déployé
- **URL** : https://ligneup.netlify.app
- **Statut** : Fonctionnel
- **Build** : Réussi

### Backend Render : ❌ Problème
- **URL** : https://lineup-nby9.onrender.com
- **Erreur** : `Not Found` pour toutes les routes
- **Impact** : CORS impossible car API non disponible

## 🔍 Tests Diagnostic

```bash
# Test connectivité backend
curl https://lineup-nby9.onrender.com/
# Résultat: "Not Found"

curl https://lineup-nby9.onrender.com/queue  
# Résultat: "Not Found"

curl https://lineup-nby9.onrender.com/health
# Résultat: "Not Found"
```

## 📋 Causes Possibles

### 1. **Code non déployé sur Render**
- Le repository n'est pas connecté
- Le build Render a échoué
- Les changements ne sont pas pushés

### 2. **Problème de démarrage serveur**
- Variables d'environnement manquantes
- Base de données non connectée
- Port mal configuré

### 3. **Configuration Render incorrecte**
- Build command incorrect
- Start command incorrect
- Root directory mal défini

## ✅ Solutions à Appliquer

### **Solution 1 : Vérifier le Déploiement Render**

1. **Se connecter au Dashboard Render** : https://dashboard.render.com
2. **Vérifier le service `lineup-backend`**
3. **Consulter les logs de déploiement**
4. **Redéployer si nécessaire**

### **Solution 2 : Configuration Render**

Dans les settings Render, vérifier :
```
Build Command: npm install
Start Command: npm start
Environment Variables:
  - NODE_ENV=production
  - MONGODB_URI=<your_mongodb_uri>
  - PORT=10000
```

### **Solution 3 : Forcer un Nouveau Déploiement**

```bash
# Dans le dossier server/
git add .
git commit -m "fix: force backend redeploy"
git push origin main
```

### **Solution 4 : Variables d'Environnement**

Vérifier que ces variables sont définies dans Render :
- `MONGODB_URI` : Connexion MongoDB Atlas
- `NODE_ENV` : `production`
- `PORT` : `10000` (automatique sur Render)

## 🔧 Configuration CORS (déjà OK)

Le code backend a déjà la bonne configuration CORS :
```javascript
const allowedOrigins = [
  'https://ligneup.netlify.app',  // ✅ Correct
  'https://lineup.netlify.app',
  // ... autres origines
];
```

## 🚀 Test Final

Une fois le backend redéployé, tester :
```bash
curl https://lineup-nby9.onrender.com/health
# Devrait retourner: {"status":"OK","cors":"enabled"}

curl https://lineup-nby9.onrender.com/queue
# Devrait retourner: [array de tickets]
```

## 📊 Vérification Post-Correction

- [ ] Backend accessible via curl
- [ ] Route `/health` retourne du JSON
- [ ] Route `/queue` retourne des données
- [ ] Frontend peut créer des tickets
- [ ] Pas d'erreurs CORS dans les logs

---

**Priorité** : 🔴 CRITIQUE - Backend inaccessible  
**Action** : Redéployer le backend sur Render  
**Impact** : Frontend inutilisable sans API 