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

## 🌐 **Déploiement Frontend sur Netlify**

### **1. Préparation du projet client**
Avant de déployer sur Netlify, s'assurer que le projet client est configuré :

```bash
cd client
npm install
npm run build:prod
```

### **2. Connexion à Netlify**
- Aller sur [netlify.com](https://netlify.com)
- Se connecter avec GitHub/GitLab
- Cliquer **"Add new site"** → **"Import an existing project"**

### **3. Configuration du site Netlify**
**Étape 1 : Sélection du repository**
- Choisir votre provider Git (GitHub/GitLab)
- Sélectionner le repository `LineUp`

**Étape 2 : Configuration de build**
```
Site name: ligneup (ou votre choix)
Branch to deploy: main
Base directory: client
Build command: npm run build:prod
Publish directory: client/dist
```

**Étape 3 : Variables d'environnement**
Dans **Site settings** → **Environment variables**, ajouter :
```env
VITE_API_URL = https://VOTRE-URL-RENDER.onrender.com
NODE_VERSION = 18
```

### **4. Configuration avancée**
**Redirections et Headers** (automatique avec `netlify.toml`) :
- ✅ SPA redirections configurées
- ✅ Headers de sécurité activés
- ✅ Variable d'environnement API_URL définie

**Custom Domain (optionnel)** :
- Aller dans **Domain settings**
- Ajouter un domaine personnalisé si souhaité

### **5. Déploiement automatique**
- Cliquer **"Deploy site"**
- Attendre 2-5 minutes pour le build
- Votre site sera disponible sur `https://VOTRE-SITE.netlify.app`

## 🔄 **Mise à jour après déploiement Render**

Une fois l'URL Render obtenue, mettre à jour la variable d'environnement Netlify :

### **Option 1 : Via Interface Netlify**
1. Aller dans **Site settings** → **Environment variables**
2. Modifier `VITE_API_URL` avec la nouvelle URL Render
3. Cliquer **"Trigger deploy"** pour redéployer

### **Option 2 : Via fichier netlify.toml**
Mettre à jour `client/netlify.toml` et pousser sur Git :

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

## 🧪 **Tests complets après déploiement**

### **Test de bout en bout**
Une fois les deux plateformes déployées :

1. **Frontend Netlify** : Aller sur `https://VOTRE-SITE.netlify.app`
2. **Prendre un ticket** : Vérifier que ça fonctionne sans erreur CORS
3. **Interface admin** : Tester la connexion et la gestion de file
4. **API directe** : Tester les endpoints Render

### **Commandes de test PowerShell**
```powershell
# Test API Render
Invoke-WebRequest -Uri "https://VOTRE-URL-RENDER.onrender.com/health"

# Test création ticket via API
$body = '{"patientId":"test123","service":"consultation"}' | ConvertTo-Json
Invoke-WebRequest -Uri "https://VOTRE-URL-RENDER.onrender.com/ticket" -Method POST -ContentType "application/json" -Body $body

# Test frontend
Start-Process "https://VOTRE-SITE.netlify.app"
```

## 🚀 **Workflow de déploiement complet**

### **Ordre recommandé :**
1. ✅ **Backend d'abord** : Déployer sur Render et obtenir l'URL
2. ✅ **Frontend ensuite** : Configurer Netlify avec l'URL backend
3. ✅ **Tests finaux** : Vérifier que tout fonctionne ensemble

### **En cas de problème :**
1. **Vérifier les logs Render** : Dashboard → Service → Logs
2. **Vérifier les logs Netlify** : Site → Deploys → Build logs
3. **Tester les APIs individuellement** avec les commandes ci-dessus

## 📊 **URLs finales**
- **Frontend** : `https://VOTRE-SITE.netlify.app`
- **Backend** : `https://VOTRE-URL-RENDER.onrender.com`
- **Database** : MongoDB Atlas (cluster0.vauvacv.mongodb.net)
- **Admin** : `https://VOTRE-SITE.netlify.app/admin`
- **Patient** : `https://VOTRE-SITE.netlify.app/patient`

## 📋 **Checklist finale**
- [ ] Render déployé et URL obtenue
- [ ] Variables d'environnement Render configurées
- [ ] Netlify déployé avec bonne URL API
- [ ] Test création ticket frontend
- [ ] Test interface admin
- [ ] Test interface patient
- [ ] Performance et temps de réponse acceptables

---
💡 **Notes importantes** :
- Render peut prendre jusqu'à 15 minutes pour le premier déploiement
- Netlify build prend généralement 2-5 minutes
- Les services gratuits peuvent avoir un délai de réveil (cold start) 