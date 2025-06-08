
# 🧾 Fiche Déploiement — Projet LineUp

## 🌐 Environnements

| Élément        | Technologie         | Hébergement        |
|----------------|---------------------|---------------------|
| Frontend       | React (Vite)        | Netlify             |
| Backend        | Node.js + Express   | Render              |
| Base de données| MongoDB Atlas       | MongoDB Cloud       |

---

## ⚙️ Variables d’environnement

### 🔐 Backend (`.env` Render)

```
MONGO_URI=mongodb+srv://...
```

### 🌍 Frontend (`.env` ou Netlify UI)

```
VITE_API_URL=https://lineup-nby9.onrender.com
```

---

## 🔧 Scripts `package.json` (frontend)

```json
"scripts": {
  "dev": "vite",
  "build": "vite build",
  "build:prod": "vite build --mode production",
  "preview": "vite preview"
}
```

---

## ❌ Erreurs rencontrées et solutions

### 1. ❌ `No 'Access-Control-Allow-Origin' header`
**Cause :** CORS non autorisé pour Netlify → appel bloqué dans le navigateur.

**Solution :**
```js
const allowedOrigins = [
  "http://localhost:5173",
  "https://ligneup.netlify.app"
];

app.use(cors({
  origin: allowedOrigins,
  methods: ["GET", "POST", "PATCH", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type"]
}));
```

---

### 2. ❌ `fetch('/undefined/ticket')`
**Cause :** `VITE_API_URL` non défini ou mal injecté dans React.

**Solution :** Vérifier :
```js
fetch(`${import.meta.env.VITE_API_URL}/ticket`, { method: "POST" })
```

Et définir la variable dans Netlify : `VITE_API_URL=https://...`

---

### 3. ❌ `npm run build` ignoré sur Netlify
**Cause :** fichier `netlify.toml` avec un `build:prod` personnalisé.

**Solution :** Soit adapter le script `"build:prod"`, soit retirer `netlify.toml` et utiliser `build` classique.

---

## ✅ Résultat final

- [x] Fonctionnalité "Prendre un ticket" opérationnelle depuis le front Netlify
- [x] Appels API autorisés côté Netlify + localhost
- [x] Base MongoDB connectée
- [x] Comportement identique en local et en production

---

📝 Réalisé par : **Elyes Messaadia**  
📁 Projet : **LineUp** — Titre DWWM
