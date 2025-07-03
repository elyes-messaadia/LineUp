# 🔧 Configuration des Variables d'Environnement

## Configuration Serveur (`server/.env`)

Créez un fichier `.env` dans le dossier `server/` avec les variables suivantes :

```bash
# Configuration de base
NODE_ENV=development
PORT=5000

# Base de données MongoDB (OBLIGATOIRE)
MONGODB_URI=mongodb://localhost:27017/lineup
# ou pour MongoDB Atlas:
# MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/lineup

# Sécurité JWT (OBLIGATOIRE - générer un secret fort)
JWT_SECRET=votre_secret_jwt_super_securise_changez_ca

# CORS (optionnel - par défaut accepte localhost en dev)
CORS_ORIGIN=http://localhost:5173

# Push Notifications (optionnel)
VAPID_PUBLIC_KEY=your_vapid_public_key
VAPID_PRIVATE_KEY=your_vapid_private_key
VAPID_EMAIL=your_email@example.com
```

## Variables Critiques

### ⚠️ **MONGODB_URI** (Obligatoire)
- Base de données MongoDB locale ou cloud
- Sans cette variable, le serveur ne peut pas démarrer

### 🔒 **JWT_SECRET** (Obligatoire)
- Secret pour signer les tokens JWT
- **IMPORTANT**: Utilisez un secret fort et unique
- Exemple de génération: `openssl rand -base64 64`

## Configuration Production

Pour Render.com, configurez ces variables dans le dashboard :
- `MONGODB_URI` → Votre URI MongoDB Atlas
- `JWT_SECRET` → Secret sécurisé
- `NODE_ENV` → `production`
- `PORT` → `10000` (par défaut Render)

## Vérification

Le serveur affichera les variables manquantes au démarrage. 

## 📦 **Déploiement sur Render**

### 🔧 Variables d'environnement Render
Dans le dashboard Render, configurez ces variables :

```bash
# Base de données
DATABASE_URL=mongodb+srv://...

# JWT (OBLIGATOIRE - Générer un secret sécurisé)
JWT_SECRET=your_super_secure_jwt_secret_change_this_in_production

# Push notifications  
VAPID_PUBLIC_KEY=BE6TTcnzxhHpEBQTomuclPw9snOauTKkweaL4HnnnatHhUjy_xk8xtMqDHVYhm9PolO19WIuE_M41U7yofhAPA0
VAPID_PRIVATE_KEY=TmybpfdcI33NeNluDq7JWiiLfeu4Q7PZWDR-hqIfn7s

# Sécurité
NODE_ENV=production
PORT=10000
```

### 🚨 **URGENT - JWT_SECRET manquant**

D'après vos logs, JWT_SECRET n'est pas configuré sur Render.
Voici comment le configurer :

1. **Aller sur votre dashboard Render**
2. **Sélectionner votre service backend**  
3. **Aller dans "Environment"**
4. **Ajouter :**
   ```
   JWT_SECRET = your_super_secure_jwt_secret_change_this_in_production
   ```
5. **Redéployer le service**

**⚠️ Important :** Utilisez un secret complexe et unique. Exemple :
```bash
JWT_SECRET=LineUp2024!SecureJWT#Production$Token@Render
``` 