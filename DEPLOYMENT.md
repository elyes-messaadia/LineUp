# Guide de Déploiement - LineUp

## 🏠 Développement Local

### Prérequis
- Node.js 18+
- MongoDB (local ou Atlas)

### Configuration

1. **Backend (Server)**
   ```bash
   cd server
   npm install
   ```
   
   Créer un fichier `.env` dans le dossier `server/` :
   ```
   MONGO_URI=mongodb://localhost:27017/lineup
   # ou MongoDB Atlas :
   # MONGO_URI=mongodb+srv://username:password@cluster.mongodb.net/lineup
   PORT=5000
   ```

2. **Frontend (Client)**
   ```bash
   cd client
   npm install
   ```
   
   Pour le développement local, créer `.env.local` :
   ```
   VITE_API_URL=http://localhost:5000
   ```

### Démarrage en mode développement

1. **Démarrer le backend :**
   ```bash
   cd server
   npm run dev
   ```

2. **Démarrer le frontend :**
   ```bash
   cd client
   npm run dev:local
   ```

## 🚀 Déploiement en Production

### Backend - Render

1. **Préparer le serveur**
   - S'assurer que le `package.json` du serveur contient le script `start`
   - Variables d'environnement sur Render :
     ```
     MONGO_URI=mongodb+srv://...
     PORT=10000
     ```

2. **Déployer sur Render**
   - Connecter le repo GitHub
   - Root Directory: `server`
   - Build Command: `npm install`
   - Start Command: `npm start`

### Frontend - Netlify

1. **Préparer le client**
   - Le fichier `netlify.toml` est déjà configuré
   - Variables d'environnement sur Netlify :
     ```
     VITE_API_URL=https://votre-app.onrender.com
     ```

2. **Déployer sur Netlify**
   - Connecter le repo GitHub
   - Base directory: `client`
   - Build command: `npm run build:prod`
   - Publish directory: `client/dist`

## 📝 Scripts Disponibles

### Client
- `npm run dev` - Développement normal
- `npm run dev:local` - Développement avec config locale
- `npm run dev:prod` - Développement avec config production
- `npm run build:prod` - Build pour la production
- `npm run preview` - Aperçu du build

### Server
- `npm run dev` - Développement avec nodemon
- `npm start` - Production

## 🔧 Configuration des Variables d'Environnement

### Client (.env fichiers)
- `.env` - Configuration par défaut (production)
- `.env.local` - Configuration locale (ignoré par git)
- `.env.production` - Configuration production explicite
- `.env.example` - Template de configuration

### Server (.env)
```
MONGO_URI=mongodb+srv://...
PORT=5000
```

## 🌐 URLs

- **Local Frontend**: http://localhost:5173
- **Local Backend**: http://localhost:5000
- **Production Frontend**: https://votre-app.netlify.app
- **Production Backend**: https://votre-app.onrender.com

## 🔄 Workflow de Développement

1. **Pour développer localement :**
   ```bash
   # Terminal 1 - Backend
   cd server && npm run dev
   
   # Terminal 2 - Frontend
   cd client && npm run dev:local
   ```

2. **Pour tester avec l'API de production :**
   ```bash
   cd client && npm run dev:prod
   ```

3. **Pour build en production :**
   ```bash
   cd client && npm run build:prod
   ``` 