# 🚨 GUIDE URGENT - Redéploiement Backend Render

## 🔍 **Problème identifié**
- Le bouton "prendre un ticket" ne fonctionne pas en production
- L'URL `https://lineup-nby9.onrender.com` retourne une erreur 404
- Le frontend Netlify était configuré sur `localhost:5000` (maintenant corrigé)

## ⚡ **Solution immédiate**

### **1. Créer un nouveau service Render**

1. **Aller sur [render.com](https://render.com)**
2. **Se connecter** avec votre compte
3. **Cliquer "New +"** → **"Web Service"**
4. **Connecter votre repository GitHub** `LineUp`

### **2. Configuration du service**

```
Name: lineup-backend
Environment: Node
Region: Frankfurt (EU Central)
Branch: main
Root Directory: server
Build Command: npm install
Start Command: npm start
```

### **3. Variables d'environnement**

Dans l'onglet "Environment" du service Render :

```
MONGO_URI = mongodb+srv://elyesmessaadia:Ler0ia5wmSN2LKe2@cluster0.vauvacv.mongodb.net/lineup
NODE_ENV = production
PORT = 10000
```

### **4. Récupérer la nouvelle URL**

Une fois déployé, Render vous donnera une URL comme :
`https://lineup-backend-XXXX.onrender.com`

### **5. Mettre à jour Netlify**

Modifier le fichier `client/netlify.toml` avec la nouvelle URL :

```toml
[build.environment]
  VITE_API_URL = "https://VOTRE-NOUVELLE-URL-RENDER.onrender.com"
```

### **6. Redéployer Netlify**

1. **Commit + Push** les changements
2. **Netlify redéploiera automatiquement**
3. **Tester** le bouton "prendre un ticket"

## 🧪 **Tests de validation**

### **Test 1 : API directe**
```powershell
Invoke-WebRequest -Uri "https://VOTRE-NOUVELLE-URL/health"
```

### **Test 2 : Création de ticket**
```powershell
$body = '{}' | ConvertTo-Json
Invoke-WebRequest -Uri "https://VOTRE-NOUVELLE-URL/ticket" -Method POST -ContentType "application/json" -Body $body
```

### **Test 3 : Frontend complet**
1. Aller sur `https://ligneup.netlify.app`
2. Cliquer "Prendre un ticket"
3. Vérifier qu'un ticket est créé

## ⏱️ **Temps estimé**
- **Création service Render** : 5-10 minutes
- **Déploiement** : 5-15 minutes
- **Tests** : 2-3 minutes
- **Total** : ~20-30 minutes

## 🆘 **Si ça ne marche toujours pas**

### **Vérifier les logs Render**
1. Dashboard Render → Votre service → "Logs"
2. Chercher les erreurs de connexion MongoDB
3. Vérifier que le serveur démarre sur le port 10000

### **Vérifier CORS**
Si erreur CORS, ajouter votre domaine Netlify dans `server/index.js` :

```js
const allowedOrigins = [
  "https://ligneup.netlify.app",
  "https://VOTRE-DOMAINE.netlify.app", // Ajouter si différent
  "http://localhost:5173"
];
```

## 📞 **Support**

Si le problème persiste après ces étapes :
1. **Vérifier les logs Render** pour erreurs spécifiques
2. **Tester l'API localement** : `cd server && npm start`
3. **Vérifier MongoDB Atlas** : connexion active ?

---

**🎯 L'objectif est d'avoir une URL Render fonctionnelle pour que le frontend puisse communiquer avec le backend.** 