
# 📚 README_DEV – Suivi Technique du Projet LineUp

Ce fichier est destiné au développeur du projet (moi, Elyes) pour documenter l’état d’avancement, les routes, les décisions techniques et les idées futures. Il ne s'agit **pas** du README public GitHub.

---

## ✅ Avancement des fonctionnalités

| Fonctionnalité                              | Statut       | Notes                                 |
|---------------------------------------------|--------------|----------------------------------------|
| Prise de ticket (`/`)                       | ✅ Fait       | Stocké dans localStorage               |
| Affichage du ticket (`/ticket`)             | ✅ Fait       | Affiche numéro + bouton annuler        |
| Annulation de ticket                        | ✅ Fait       | `DELETE /ticket/:id` => status: désisté |
| Affichage file d’attente (`/queue`)         | ✅ Fait       | Auto-refresh toutes les 3 sec          |
| Connexion admin (`/admin-login`)            | ✅ Fait       | Vérifie code `admin2024`               |
| Interface médecin (`/admin`)                | ✅ Fait       | Appeler suivant / Réinitialiser file   |
| Déconnexion admin                           | ✅ Fait       | Supprime `isAdmin`, redirige login     |
| Réinitialisation de la file                | ✅ Fait       | `DELETE /reset`                        |
| QR Code vers page admin-login               | 🟡 Généré     | Localhost pour test                    |
| Historique des appels (optionnel)           | 🔜 À faire    | À décider si besoin pour oral          |
| Champ "Nom du patient" (optionnel)          | 🔜 À faire    | Idée UX pour admin                     |

---

## 🧠 Routes API backend (Express)

| Méthode | Route              | Description                              |
|---------|-------------------|------------------------------------------|
| POST    | /ticket            | Crée un ticket avec `status: en_attente` |
| GET     | /queue             | Retourne la liste complète de la file    |
| DELETE  | /ticket/:id        | Marque le ticket `status: desiste`       |
| DELETE  | /next              | Met le ticket suivant en consultation    |
| DELETE  | /reset             | Vide toute la file (danger zone)         |

---

## 📦 Stockage local (côté front)

- `lineup_ticket` : contient l’objet ticket de l’utilisateur
- `isAdmin` : `"true"` si l’admin est connecté (localStorage)

---

## 🛠️ Tech utilisées

- React, Vite, TailwindCSS
- Express.js (backend)
- localStorage (stockage temporaire)
- Pas encore de base de données

---

## 🖥️ Arborescence simplifiée

```
LineUp/
├── src/
│   ├── pages/           # Toutes les pages React (Accueil, Ticket, Queue, Admin...)
│   └── App.jsx, main.jsx
├── server/
│   └── index.js         # Backend Express avec routes intégrées
├── public/
├── README.md            # Présentation publique
├── README_DEV.md        # Suivi technique (ce fichier)
```

---

## 🔐 Sécurité Admin

- Vérification frontend avec code `admin2024`
- Redirection automatique si `!isAdmin`
- Lien discret dans `/queue`
- QR Code utilisable depuis un poste local

---

## 🔮 Pistes d’amélioration

- Intégrer MongoDB pour stocker la file
- Ajouter des notifications temps réel avec Socket.io
- Ajouter un champ nom/prénom facultatif dans les tickets
- Interface statistiques pour le médecin
- Export CSV ou impression de la file

---

## 📌 Notes perso pour l’oral

- Bien expliquer la logique des statuts : `en_attente`, `en_consultation`, `desiste`
- Montrer les rôles du front et du back séparément
- Expliquer chaque fichier et chaque interaction
