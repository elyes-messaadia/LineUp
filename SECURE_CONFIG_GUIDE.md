# 🔐 CONFIGURATION SÉCURISÉE LINEUP - GUIDE COMPLET

## 📋 NOUVELLES VARIABLES GÉNÉRÉES (2025-10-01)

### 🔑 JWT Secret

```
JWT_SECRET=D|o_CX^R2I&!%c]+?cR$8S{UB%aG^&:NWn*%T-}^a()HA:t/O(-jDNm-HAJsu9_6
```

### 📱 Clés VAPID

```
VAPID_PUBLIC_KEY=BGH1aJhSZ_jU0-dLqFvFNBFZNP23QeW2mep9xj1141MwxPPzp9D0bAWzltUlXfFFPrMzmfmZokem5KCDuRranNE
VAPID_PRIVATE_KEY=UNZ4EVOeFDkYeT2pc_mLGyngDZ-SNNkNHowVWCZeN7g
VAPID_EMAIL=contact@lineup.app
```

## 🚀 CONFIGURATION RENDER.COM

### Variables d'environnement à ajouter dans Render Dashboard

```
MONGO_URI=mongodb+srv://NOUVEAU_USER:NOUVEAU_PASS@cluster0.vauvacv.mongodb.net/lineup
JWT_SECRET=D|o_CX^R2I&!%c]+?cR$8S{UB%aG^&:NWn*%T-}^a()HA:t/O(-jDNm-HAJsu9_6
NODE_ENV=production
PORT=10000
CORS_ORIGIN=https://ligneup.netlify.app
VAPID_PUBLIC_KEY=BGH1aJhSZ_jU0-dLqFvFNBFZNP23QeW2mep9xj1141MwxPPzp9D0bAWzltUlXfFFPrMzmfmZokem5KCDuRranNE
VAPID_PRIVATE_KEY=UNZ4EVOeFDkYeT2pc_mLGyngDZ-SNNkNHowVWCZeN7g
VAPID_EMAIL=contact@lineup.app
```

## 🌐 CONFIGURATION NETLIFY

### Variables d'environnement

```
VITE_API_URL=https://lineup-backend-xxak.onrender.com
NODE_VERSION=18
VITE_SHOW_QUICK_LOGIN=true
```

## 🗄️ CONFIGURATION MONGODB ATLAS

### Actions à effectuer

1. Se connecter à [MongoDB Atlas](https://cloud.mongodb.com/)
2. Aller dans Database Access
3. Changer le mot de passe de l'utilisateur `elyesmessaadia`
4. Ou créer un nouvel utilisateur avec des permissions readWrite
5. Mettre à jour la variable MONGO_URI avec les nouveaux identifiants

## ✅ TESTS DE VÉRIFICATION

### Tester le backend (après configuration)

```powershell
# Test de base
Invoke-WebRequest -Uri "https://lineup-backend-xxak.onrender.com/health"

# Test de l'endpoint racine
Invoke-WebRequest -Uri "https://lineup-backend-xxak.onrender.com/"
```

### Tester le frontend

```powershell
# Vérifier que le site charge
Invoke-WebRequest -Uri "https://ligneup.netlify.app/"
```

## 🔄 ORDRE D'EXÉCUTION RECOMMANDÉ

1. **IMMÉDIAT** : Changer le mot de passe MongoDB Atlas
2. **URGENT** : Configurer les variables sur Render.com
3. **URGENT** : Configurer les variables sur Netlify
4. **Attendre** : Le redéploiement automatique (5-10 minutes)
5. **Tester** : Vérifier que l'API répond correctement
6. **Valider** : Tester une connexion sur l'application

## 🚨 RAPPEL SÉCURITÉ

- ❌ Ne jamais commiter de fichiers .env
- ✅ Utiliser uniquement les variables d'environnement des plateformes
- 🔄 Changer les secrets tous les 3 mois
- 📝 Documenter les changements dans ce fichier

---
**Dernière mise à jour** : 2025-10-01
**Status** : Variables générées, en attente de configuration sur les plateformes
