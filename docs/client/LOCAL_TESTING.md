# 🧪 Test Local - Solution Temporaire

## 🚨 Situation Actuelle
- **Frontend Netlify** : ✅ https://ligneup.netlify.app (opérationnel)
- **Backend Render** : ❌ https://lineup-nby9.onrender.com (404 Not Found)
- **Backend Local** : ✅ http://localhost:5000 (opérationnel)

## 🔧 Test de Validation Backend Local

```bash
curl http://localhost:5000/health
# ✅ Résultat: {"status":"OK","cors":"enabled","origin":"no-origin"}

curl http://localhost:5000/queue
# ✅ Devrait retourner: []
```

## 🚀 Solutions de Test

### **Solution 1 : Développement Local Complet**

```bash
# Terminal 1 - Backend (déjà démarré)
cd server
npm start
# ✅ Server running on http://localhost:5000

# Terminal 2 - Frontend Local
cd client  
npm run dev
# ✅ Frontend sur http://localhost:5173
```

**Avantage** : Test complet de l'application localement

### **Solution 2 : Modifier Temporairement l'URL dans le Code**

Dans `client/src/` - modifier les fichiers qui utilisent l'API :
```javascript
// Temporaire - changer de:
const API_URL = import.meta.env.VITE_API_URL;

// Vers:
const API_URL = 'http://localhost:5000';
```

**⚠️ ATTENTION** : Ne pas commiter cette modification !

### **Solution 3 : Proxy de Développement**

Ajouter dans `vite.config.js` :
```javascript
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:5000',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, '')
      }
    }
  }
})
```

## 🎯 Prochaines Étapes Render

### **Diagnostic Render Dashboard**
1. Aller sur https://dashboard.render.com
2. Chercher le service backend
3. Vérifier les logs d'erreur :
   ```
   - Build logs : Erreurs npm install ?
   - Deploy logs : Erreurs au démarrage ?
   - Runtime logs : Crashes récurrents ?
   ```

### **Variables d'Environnement à Vérifier**
```env
NODE_ENV=production
MONGODB_URI=mongodb+srv://...
PORT=10000 (automatique)
```

### **Configuration Render Typique**
```
Build Command: npm install
Start Command: npm start
Root Directory: server (si monorepo)
Node Version: 18
```

## 📊 Tests de Validation Render

Une fois corrigé :
```bash
curl https://lineup-nby9.onrender.com/health
# Doit retourner: {"status":"OK","cors":"enabled"}

curl https://lineup-nby9.onrender.com/queue  
# Doit retourner: [] ou [array de tickets]
```

## 💡 Debug Tips

### **Si Render montre "Building..."**
- Le déploiement prend 5-10 minutes
- Vérifier les logs en temps réel

### **Si Render montre "Deploy failed"**
- Vérifier les logs de build
- Problème probable : dépendances manquantes

### **Si Render montre "Running" mais 404**
- Start command incorrect
- Port mal configuré
- Root directory incorrect

---

**Statut** : Backend local ✅ / Backend Render ❌  
**Action** : Corriger Render ou continuer en local  
**Test** : http://localhost:5000/health fonctionnel 