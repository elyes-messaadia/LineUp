# 🚀 Guide d'Installation

## Prérequis

- Node.js v18.x ou supérieur
- MongoDB v6.x ou supérieur
- Git

## Installation Locale

### 1. Cloner le Projet

```bash
git clone https://github.com/elyes-messaadia/LineUp.git
cd LineUp
```

### 2. Configuration Backend

```bash
cd server
npm install
```

Créez un fichier `.env` :
```env
MONGO_URI=votre_uri_mongodb
PORT=5000
JWT_SECRET=votre_secret_jwt
NODE_ENV=development
VAPID_PUBLIC_KEY=votre_cle_vapid_publique
VAPID_PRIVATE_KEY=votre_cle_vapid_privee
VAPID_EMAIL=votre_email
```

### 3. Configuration Frontend

```bash
cd ../client
npm install
```

Créez un fichier `.env.local` :
```env
VITE_API_URL=http://localhost:5000
```

## Démarrage en Local

### Backend

```bash
cd server
npm run dev
```

### Frontend

```bash
cd client
npm run dev
```

## Scripts Utiles

### Backend

- `npm run dev` : Démarrage en mode développement
- `npm run seed` : Peuplement de la base de données
- `npm run check:db` : Vérification de la base de données

### Frontend

- `npm run dev` : Démarrage en mode développement
- `npm run build` : Construction pour production
- `npm run preview` : Prévisualisation de la build

## Vérification de l'Installation

1. Backend : http://localhost:5000/health
2. Frontend : http://localhost:5173
3. API Docs : http://localhost:5000/api-docs