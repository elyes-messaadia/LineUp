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