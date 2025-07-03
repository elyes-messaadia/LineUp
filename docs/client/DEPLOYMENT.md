# Configuration pour le déploiement

## Variables d'environnement

Pour déployer l'application sur Netlify et Render, vous devez configurer la variable d'environnement suivante :

### Pour le client (Netlify)

Créez un fichier `.env` dans le dossier `client/` avec :

```
VITE_API_URL=https://votre-api-render.onrender.com
```

Ou configurez directement dans les paramètres de déploiement Netlify :
- Variable : `VITE_API_URL`
- Valeur : `https://votre-api-render.onrender.com`

### Pour le développement local

```
VITE_API_URL=http://localhost:5000
```

## Modifications effectuées

Tous les appels `fetch("http://localhost:5000/...")` ont été remplacés par `fetch(\`\${import.meta.env.VITE_API_URL}/...\`)` dans les fichiers suivants :

- `src/pages/RegisterAdmin.jsx`
- `src/pages/AdminLogin.jsx` 
- `src/pages/Admin.jsx`

Les autres fichiers utilisaient déjà la variable d'environnement.

## Base de données MongoDB

Assurez-vous que votre serveur (déployé sur Render) est configuré avec la chaîne de connexion MongoDB appropriée. 