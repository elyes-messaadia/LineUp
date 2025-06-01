# 🔧 Configuration Render - Paramètres Exacts

## 🚨 Problème Actuel
- Service redéployé mais retourne `404 Not Found`
- Header `x-render-routing: no-server` = Service crash au démarrage

## ✅ Configuration Correcte Render

### **1. Settings → Build & Deploy**
```
Repository: votre-repo/LineUp
Branch: main (ou master)
Root Directory: server          ← CRITIQUE !
Environment: Node
Build Command: npm install
Start Command: npm start
```

### **2. Environment Variables**
```
NODE_ENV = production
MONGODB_URI = mongodb+srv://username:password@cluster.mongodb.net/lineup
PORT = (laisser vide, Render l'assigne automatiquement)
```

### **3. Advanced → Auto-Deploy**
```
✅ Auto-Deploy: Yes
✅ Pre-Deploy Command: (vide)
```

## 🔍 Vérifications à Faire

### **A. Structure Repository**
Votre repository doit avoir :
```
LineUp/
├── client/          ← Frontend
└── server/          ← Backend ← RENDER DOIT POINTER ICI
    ├── index.js
    ├── package.json
    └── ...
```

### **B. Package.json Scripts**
Dans `server/package.json` :
```json
{
  "scripts": {
    "start": "node index.js"
  },
  "main": "index.js"
}
```

### **C. Variables d'Environnement MongoDB**
- Aller sur https://cloud.mongodb.com
- Database → Connect → Application
- Copier la connection string
- Remplacer `<password>` par le vrai mot de passe

## 🚨 Erreurs Communes

### **❌ Root Directory Vide**
```
Root Directory: (vide)  ← ERREUR !
Root Directory: .       ← ERREUR !
Root Directory: /       ← ERREUR !
```

### **✅ Root Directory Correct**
```
Root Directory: server  ← CORRECT !
```

### **❌ Start Command Incorrect**
```
Start Command: node server.js     ← ERREUR si fichier = index.js
Start Command: nodemon index.js   ← ERREUR en production
```

### **✅ Start Command Correct**
```
Start Command: npm start          ← CORRECT !
Start Command: node index.js      ← CORRECT aussi
```

## 🔧 Fix Immédiat

### **Étape 1 : Vérifier Root Directory**
1. Dashboard Render → Votre service
2. Settings → Build & Deploy
3. **Root Directory** doit être exactement `server`
4. Si différent → Changer → Save

### **Étape 2 : Variables Environnement**
1. Settings → Environment
2. Ajouter/vérifier :
   ```
   NODE_ENV = production
   MONGODB_URI = mongodb+srv://...
   ```

### **Étape 3 : Manual Redeploy**
1. Deployments → Manual Deploy
2. Attendre 5-10 minutes
3. Tester : `curl https://lineup-nby9.onrender.com/health`

## 📊 Tests de Validation

### **Une fois configuré correctement :**
```bash
# Doit retourner JSON, pas "Not Found"
curl https://lineup-nby9.onrender.com/health
# Résultat attendu: {"status":"OK","cors":"enabled"}

curl https://lineup-nby9.onrender.com/queue
# Résultat attendu: [] (array vide)
```

## 🚀 Alternative : Fichier render.yaml

Créer `render.yaml` à la racine :
```yaml
services:
  - type: web
    name: lineup-backend
    runtime: node
    buildCommand: cd server && npm install
    startCommand: cd server && npm start
    env: node
    envVars:
      - key: NODE_ENV
        value: production
      - key: MONGODB_URI
        fromDatabase:
          name: mongodb
          property: connectionString
```

---

**🎯 ACTION IMMÉDIATE** : Vérifier Root Directory = `server`  
**🔄 PUIS** : Manual Redeploy  
**✅ TEST** : `curl https://lineup-nby9.onrender.com/health` 