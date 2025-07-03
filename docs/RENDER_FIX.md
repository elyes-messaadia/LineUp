# 🔧 Fix Render : "Service Root Directory Missing"

## 🚨 **Erreur rencontrée**
```
Service Root Directory "/opt/render/project/src/server" is missing.
```

## ✅ **Solutions testées**

### **Solution 1 : Configuration simple (Recommandée)**

Dans **Render Dashboard** → **Settings** → **Build & Deploy** :

| Champ | Valeur |
|-------|--------|
| **Name** | `lineup-api` |
| **Environment** | `Node` |
| **Region** | `Frankfurt` |
| **Branch** | `main` |
| **Root Directory** | *(LAISSER VIDE)* |
| **Build Command** | `cd server && npm install` |
| **Start Command** | `cd server && npm start` |

### **Solution 2 : Avec scripts bash**

| Champ | Valeur |
|-------|--------|
| **Build Command** | `chmod +x build.sh && ./build.sh` |
| **Start Command** | `chmod +x start.sh && ./start.sh` |

### **Variables d'environnement**

Dans **Settings** → **Environment** :
```env
NODE_ENV=production
MONGO_URI=mongodb+srv://elyesmessaadia:Ler0ia5wmSN2LKe2@cluster0.vauvacv.mongodb.net/lineup
PORT=10000
```

## 🧪 **Test après déploiement**

Une fois déployé, testez :
```bash
curl https://VOTRE-NOUVELLE-URL.onrender.com/health
```

Doit retourner :
```json
{"status":"OK","cors":"enabled","origin":"no-origin"}
```

## 📝 **Checklist**
- [ ] Root Directory laissé vide OU scripts bash créés
- [ ] Build Command configuré
- [ ] Start Command configuré  
- [ ] Variables d'environnement ajoutées
- [ ] Déploiement sans erreur
- [ ] Test API réussi

---
💡 **Après succès** : Mettre à jour `client/netlify.toml` avec la nouvelle URL ! 