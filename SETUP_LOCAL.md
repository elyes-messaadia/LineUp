# 🚀 Configuration Développement Local

## Étape 1: Variables d'environnement

Créez le fichier `server/.env` :

```bash
# Base de données (Local MongoDB ou Atlas)
MONGODB_URI=mongodb://localhost:27017/lineup
# ou MongoDB Atlas: mongodb+srv://username:password@cluster.mongodb.net/lineup

# Sécurité JWT 
JWT_SECRET=votre_secret_jwt_super_securise_changez_ca

# Configuration locale
NODE_ENV=development
PORT=5000
```

## Étape 2: Démarrage

```bash
# Terminal 1 - Backend
cd server
npm start

# Terminal 2 - Frontend  
cd client
npm start
```

## ✅ Votre site est DÉJÀ EN PRODUCTION

👉 **ligneup.netlify.app** - Toutes les nouvelles fonctionnalités sont actives !

### Testez maintenant :
- 🎫 Tickets physiques avec noms
- 👨‍⚕️ Dashboards médecins améliorés  
- 📱 Système hybride complet 