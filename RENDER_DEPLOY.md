# 🚀 Guide de Déploiement Render - LineUp API

## ✅ Prérequis
- [x] Code serveur optimisé avec CORS robuste
- [x] Routes de santé `/` et `/health` configurées  
- [x] Configuration `render.yaml` prête
- [x] Tests locaux réussis

## 📝 **Étapes de déploiement sur Render**

### **1. Connexion à Render**
- Aller sur [render.com](https://render.com)
- Se connecter avec GitHub/GitLab
- Connecter votre repository LineUp

### **2. Créer un nouveau Web Service**
- Cliquer **"New +"** → **"Web Service"**
- Sélectionner votre repository `LineUp`
- Configurer :
  ```
  Name: lineup-backend
  Environment: Node
  Region: Frankfurt (ou Oregon)
  Branch: main
  Root Directory: server
  Build Command: npm install
  Start Command: npm start
  ```

### **3. Variables d'environnement**
⚠️ **CRITICAL** : Configurer ces variables dans l'onglet "Environment" :

```env
NODE_ENV=production
MONGO_URI=mongodb+srv://elyesmessaadia:Ler0ia5wmSN2LKe2@cluster0.vauvacv.mongodb.net/lineup
PORT=10000
CORS_ORIGIN=https://ligneup.netlify.app
```

### **4. Configuration avancée**
- **Health Check Path** : `/health`
- **Auto-Deploy** : ✅ Activé
- **Plan** : Free (pour commencer)

### **5. Déploiement**
- Cliquer **"Create Web Service"**
- Attendre 5-10 minutes pour le build
- Vérifier l'URL générée (ex: `https://lineup-backend-abc123.onrender.com`)

## 🧪 **Tests après déploiement**

### Test 1 : Route racine
```bash
curl https://VOTRE-URL-RENDER.onrender.com
# Doit retourner : {"message":"✅ API LineUp opérationnelle","status":"healthy"}
```

### Test 2 : Route de santé
```bash
curl https://VOTRE-URL-RENDER.onrender.com/health
# Doit retourner : {"status":"OK","cors":"enabled"}
```

### Test 3 : Création de ticket
```bash
curl -X POST https://VOTRE-URL-RENDER.onrender.com/ticket \
  -H "Content-Type: application/json" \
  -d '{"patientId":"test123","service":"consultation"}'
```

## 🔧 **Mise à jour Netlify**

Une fois l'URL Render obtenue, mettre à jour `client/netlify.toml` :

```toml
[build.environment]
  VITE_API_URL = "https://VOTRE-NOUVELLE-URL-RENDER.onrender.com"
```

## 🆘 **Dépannage courant**

### Erreur 404 sur Render
- Vérifier le **Root Directory** = `server`
- Vérifier le **Start Command** = `npm start`
- Vérifier les logs dans Render Dashboard

### Erreur CORS
- Vérifier `CORS_ORIGIN` dans les variables d'environnement
- S'assurer que l'URL Netlify est exacte

### Erreur MongoDB
- Vérifier `MONGO_URI` dans les variables d'environnement
- Tester la connexion MongoDB Atlas

## 📊 **URLs finales**
- **Frontend** : `https://ligneup.netlify.app`
- **Backend** : `https://VOTRE-URL-RENDER.onrender.com`
- **Database** : MongoDB Atlas (cluster0.vauvacv.mongodb.net)

---
💡 **Note** : Render peut prendre jusqu'à 15 minutes pour le premier déploiement. 