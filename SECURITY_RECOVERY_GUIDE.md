# 🚨 GUIDE DE RÉCUPÉRATION DE SÉCURITÉ - LINEUP

## ⚠️ PROBLÈME DÉTECTÉ

Le fichier `server/.env` a été exposé dans Git contenant :

- URI MongoDB avec identifiants
- JWT Secret
- Clés VAPID privées

## 🔥 ACTIONS CRITIQUES IMMÉDIATES

### 1. **Changer les identifiants MongoDB**

1. Se connecter à MongoDB Atlas
2. Changer le mot de passe de l'utilisateur `elyesmessaadia`
3. Créer un nouvel utilisateur avec un mot de passe fort
4. Mettre à jour `MONGO_URI` sur Render

### 2. **Régénérer JWT Secret**

```powershell
# Générer un nouveau secret fort
[System.Web.Security.Membership]::GeneratePassword(64, 8)
```

### 3. **Régénérer les clés VAPID**

```powershell
npm install -g web-push
web-push generate-vapid-keys
```

### 4. **Configuration sur Render.com**

Aller dans les variables d'environnement et mettre à jour :

- `MONGO_URI=mongodb+srv://NOUVEAU_USER:NOUVEAU_PASS@cluster.mongodb.net/lineup`
- `JWT_SECRET=NOUVEAU_SECRET_GENERE`
- `VAPID_PUBLIC_KEY=NOUVELLE_CLE_PUBLIQUE`
- `VAPID_PRIVATE_KEY=NOUVELLE_CLE_PRIVEE`
- `VAPID_EMAIL=contact@lineup.app`

### 5. **Configuration sur Netlify**

Mettre à jour la variable :

- `VITE_API_URL=https://lineup-backend-xxak.onrender.com`

## ✅ VÉRIFICATIONS POST-RÉCUPÉRATION

1. **Tester l'API backend** :

```powershell
Invoke-WebRequest -Uri "https://lineup-backend-xxak.onrender.com/health"
```

2. **Tester la connexion frontend-backend** :

- Ouvrir <https://ligneup.netlify.app/>
- Tenter une connexion/inscription
- Vérifier les logs dans la console

3. **Vérifier que les secrets ne sont plus exposés** :

```powershell
.\security-check-simple.ps1
```

## 📋 CHECKLIST DE SÉCURITÉ FUTURE

- [ ] Tous les fichiers `.env` sont dans `.gitignore`
- [ ] Aucun secret dans le code source
- [ ] Variables d'environnement uniquement sur les plateformes de déploiement
- [ ] Rotation régulière des secrets (tous les 3 mois)
- [ ] Monitoring des accès à la base de données

## 🔗 LIENS UTILES

- [MongoDB Atlas Security](https://docs.atlas.mongodb.com/security/)
- [Render Environment Variables](https://render.com/docs/environment-variables)
- [Netlify Environment Variables](https://docs.netlify.com/environment-variables/overview/)
- [Web Push VAPID Keys](https://web.dev/push-notifications-web-push-protocol/)

---
**⚠️ NE PAS IGNORER : Cette brèche de sécurité doit être traitée IMMÉDIATEMENT**
