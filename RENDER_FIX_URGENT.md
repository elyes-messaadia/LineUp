# 🔥 RENDER CONFIG - ACTION IMMÉDIATE

## 🚨 PROBLÈME ACTUEL

- Backend Render : ❌ Erreur 500 (variables manquantes)
- Frontend Netlify : ✅ Fonctionne

## 🎯 SOLUTION EN 3 ÉTAPES

### 1️⃣ **MONGODB ATLAS** (2 minutes)

```
https://cloud.mongodb.com/
→ Database Access
→ Utilisateur "elyesmessaadia" 
→ Edit Password
→ Générer nouveau mot de passe FORT
```

### 2️⃣ **RENDER.COM** (3 minutes)

```
https://dashboard.render.com/
→ Service "lineup-backend"
→ Environment (menu gauche)
→ Add Environment Variable (8 fois)
```

**VARIABLES À COPIER-COLLER :**

```bash
MONGO_URI=mongodb+srv://elyesmessaadia:NOUVEAU_MOT_DE_PASSE@cluster0.vauvacv.mongodb.net/lineup
JWT_SECRET=D|o_CX^R2I&!%c]+?cR$8S{UB%aG^&:NWn*%T-}^a()HA:t/O(-jDNm-HAJsu9_6
NODE_ENV=production
PORT=10000
CORS_ORIGIN=https://ligneup.netlify.app
VAPID_PUBLIC_KEY=BGH1aJhSZ_jU0-dLqFvFNBFZNP23QeW2mep9xj1141MwxPPzp9D0bAWzltUlXfFFPrMzmfmZokem5KCDuRranNE
VAPID_PRIVATE_KEY=UNZ4EVOeFDkYeT2pc_mLGyngDZ-SNNkNHowVWCZeN7g
VAPID_EMAIL=contact@lineup.app
```

### 3️⃣ **ATTENDRE & TESTER** (5 minutes)

```powershell
# Attendre le redéploiement puis :
.\test-deployment.ps1
```

## ✅ **RÉSULTAT ATTENDU**

```
Backend Status: 200
Frontend Status: 200
```

---
**⏰ Total : 10 minutes max**
