# 🚨 CORRECTION URGENTE RENDER - Guide Pas-à-Pas

## 🎯 Problème : Backend Render Inaccessible

**Erreur actuelle** : `lineup-nby9.onrender.com/ticket → 404 Not Found`

## 📋 Plan d'Action Immédiat (15 minutes max)

### **ÉTAPE 1 : Diagnostic Render Dashboard**

1. **Ouvrir** : https://dashboard.render.com
2. **Se connecter** avec vos identifiants
3. **Chercher** le service `lineup-backend` ou similaire
4. **Noter le statut** :
   - 🟢 **Running** → Problème de configuration
   - 🔴 **Deploy Failed** → Erreur de build
   - 🟡 **Building** → Attendre la fin
   - 🟣 **Sleeping** → Service suspendu

### **ÉTAPE 2 : Selon le Statut Trouvé**

#### **Si "Deploy Failed" 🔴**
1. Cliquer sur **"Logs"**
2. Chercher les erreurs dans **"Build Logs"**
3. Erreurs courantes :
   ```
   npm install failed
   → Problème package.json
   
   Module not found
   → Dépendance manquante
   
   MONGODB_URI undefined
   → Variable d'environnement manquante
   ```

#### **Si "Running" mais 404 🟢**
1. Aller dans **"Settings"**
2. Vérifier **"Build & Deploy"** :
   ```
   Root Directory: server ← IMPORTANT !
   Build Command: npm install
   Start Command: npm start
   ```

#### **Si "Sleeping" 🟣**
1. Cliquer **"Manual Deploy"**
2. Attendre 5-10 minutes
3. Retester : `curl https://lineup-nby9.onrender.com/health`

### **ÉTAPE 3 : Variables d'Environnement**

1. Dans Dashboard → **"Environment"**
2. **Vérifier ces variables** :
   ```
   NODE_ENV = production
   MONGODB_URI = mongodb+srv://...
   PORT = (laisser vide, auto)
   ```
3. **Si MONGODB_URI manque** :
   - Aller sur https://cloud.mongodb.com
   - Créer un cluster gratuit
   - Copier la connection string
   - L'ajouter dans Render

### **ÉTAPE 4 : Configuration Repository**

1. **Settings** → **"Connected Repository"**
2. Vérifier :
   ```
   Repository: votre-username/LineUp
   Branch: main
   Root Directory: server ← CRITIQUE !
   ```

### **ÉTAPE 5 : Test de Validation**

```bash
# Test immédiat après chaque correction
curl https://lineup-nby9.onrender.com/health
```

**Résultats attendus** :
- ✅ `{"status":"OK","cors":"enabled"}` = SUCCESS !
- ❌ `404 Not Found` = Continuer debug
- ❌ `Connection refused` = Service down

## 🔧 Solutions Spécifiques

### **Solution A : Root Directory Incorrect**
```
Settings → Build & Deploy
Root Directory: server
```

### **Solution B : Start Command Incorrect**
```
Start Command: npm start
OU
Start Command: node index.js
```

### **Solution C : Variables d'Environnement**
```env
NODE_ENV=production
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/lineup
```

### **Solution D : Package.json Manquant**
Vérifier que `server/package.json` existe et contient :
```json
{
  "scripts": {
    "start": "node index.js"
  }
}
```

## 🚀 Solution Alternative : Railway

Si Render continue à poser problème :

1. **Aller sur** : https://railway.app
2. **"New Project"** → **"Deploy from GitHub"**
3. **Sélectionner** votre repository LineUp
4. **Root Directory** : `server`
5. **Variables** : Ajouter `MONGODB_URI`
6. **Deploy** → URL automatique

## 📞 Tests Finaux

```bash
# Une fois corrigé
curl https://lineup-nby9.onrender.com/health
curl https://lineup-nby9.onrender.com/queue
curl -X POST https://lineup-nby9.onrender.com/ticket \
  -H "Content-Type: application/json" \
  -d '{"docteur":"Docteur 1"}'
```

## ⏱️ Timeline Estimé

- **Diagnostic** : 2-3 minutes
- **Correction config** : 3-5 minutes  
- **Redéploiement** : 5-10 minutes
- **Test validation** : 1-2 minutes

**TOTAL** : 15-20 minutes maximum

---

**🎯 OBJECTIF** : `curl https://lineup-nby9.onrender.com/health` doit retourner du JSON  
**🚨 PRIORITÉ** : CRITIQUE - Sans backend, frontend inutilisable  
**💡 BACKUP** : Local fonctionne, Railway en alternative 