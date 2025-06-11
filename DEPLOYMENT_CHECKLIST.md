# 📋 **Checklist de Déploiement LineUp**

## 🚀 **Render Backend Deployment**

### **1. Variables d'environnement obligatoires**

Configurer dans le dashboard Render > Environment :

```bash
# 🔑 JWT - OBLIGATOIRE
JWT_SECRET=LineUp2024!SecureJWT#Production$Token@Render

# 🗄️ Base de données
DATABASE_URL=mongodb+srv://username:password@cluster.mongodb.net/lineup

# 🔔 Notifications Push
VAPID_PUBLIC_KEY=BE6TTcnzxhHpEBQTomuclPw9snOauTKkweaL4HnnnatHhUjy_xk8xtMqDHVYhm9PolO19WIuE_M41U7yofhAPA0
VAPID_PRIVATE_KEY=TmybpfdcI33NeNluDq7JWiiLfeu4Q7PZWDR-hqIfn7s

# 🛡️ Sécurité
NODE_ENV=production
PORT=10000
```

### **2. Configuration Build**

```yaml
# render.yaml
services:
  - type: web
    name: lineup-backend
    env: node
    plan: free
    buildCommand: cd server && npm install
    startCommand: cd server && npm start
    envVars:
      - key: JWT_SECRET
        generateValue: true
      - key: NODE_ENV
        value: production
```

### **3. Post-déploiement**

1. **Vérifier les logs** pour s'assurer qu'aucune variable n'est manquante
2. **Tester l'endpoint** `/health` pour vérifier le statut
3. **Vérifier la connexion MongoDB**

---

## 🌐 **Netlify Frontend Deployment**

### **1. Variables d'environnement**

```bash
# API Configuration
REACT_APP_API_URL=https://votre-backend.onrender.com

# Build settings
CI=false
NODE_VERSION=18
```

### **2. Configuration Build**

```toml
# netlify.toml
[build]
  command = "cd client && npm run build"
  publish = "client/build"

[[redirects]]
  from = "/*"
  to = "/index.html"
  status = 200
```

---

## ✅ **Tests de Validation**

### **Backend Tests**
```bash
# Health check
curl https://votre-backend.onrender.com/health

# API test
curl https://votre-backend.onrender.com/api/doctors
```

### **Frontend Tests**
- [ ] Page d'accueil charge correctement
- [ ] Connexion/inscription fonctionnelle  
- [ ] Création de tickets fonctionne
- [ ] Notifications push activables

---

## 🐛 **Problèmes Courants & Solutions**

### **❌ JWT_SECRET manquant**
```
⚠️ JWT_SECRET manquant - Utilisation du fallback
```

**Solution :**
1. Aller dans Render Dashboard > Service > Environment
2. Ajouter `JWT_SECRET` avec une valeur sécurisée
3. Redéployer le service

### **❌ Erreur notifications push**
```
Error: You must pass in a subscription with at least an endpoint
```

**Solution :** Déjà corrigée - le système ignore maintenant les utilisateurs non abonnés

### **❌ CORS errors**
**Solution :** Vérifier que `REACT_APP_API_URL` pointe vers le bon backend

### **❌ 401 Unauthorized**
**Solution :** Vérifier que JWT_SECRET est identique entre création et vérification

---

## 🔄 **Mise à jour Post-Déploiement**

Si vous voyez encore des erreurs :

1. **Configurer JWT_SECRET sur Render**
2. **Redéployer le backend** 
3. **Tester la création de tickets**
4. **Vérifier les logs** pour confirmation

---

## 📞 **Support**

Si des problèmes persistent, vérifier :
- Variables d'environnement bien configurées
- Logs de déploiement sans erreurs  
- Connectivité base de données
- CORS configuré correctement 