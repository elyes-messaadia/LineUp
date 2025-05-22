
# 📲 LineUp

**LineUp** est une application web simple et intuitive permettant de gérer les files d’attente chez un médecin ou dans tout lieu de consultation, grâce à un système de **tickets virtuels** et **QR Codes**.

---

## 🧠 Contexte

L’idée est née dans une salle d’attente, où un patient a suggéré un système pour éviter de demander “C’est qui le dernier pour le docteur ?”.  
**LineUp** répond à ce besoin en offrant une expérience fluide, sans stress, pour les patients et le personnel médical.

---

## 🚀 Fonctionnalités principales

- ✅ Prise de ticket en ligne ou via QR Code  
- ✅ Affichage en temps réel de la file d’attente  
- ✅ Visualisation de sa position dans la file  
- ✅ PWA installable (Mobile First)  
- 🔜 Annulation de ticket (en cours)  
- 🔜 Interface admin médecin (en cours)  

---

## 🛠️ Stack technique

| Côté client       | Côté serveur         | Outils complémentaires     |
|------------------|----------------------|----------------------------|
| React + Tailwind | Node.js + Express.js | MongoDB (à venir)          |
| React Router     | API REST             | Figma, GitHub, Render      |
| Vite             | JSON (mock)          | HTTPie, ESLint, Postman    |

---

## 📁 Structure du projet

```
LineUp/
├── client/
│   └── src/
│       ├── pages/         # Pages React (Home, Ticket, Queue)
│       ├── components/    # Composants réutilisables
│       ├── App.jsx
│       └── main.jsx
├── server/                # API Express
│   ├── index.js
│   ├── routes/ (à venir)
│   └── models/ (à venir)
├── public/
├── .gitignore
├── tailwind.config.js
├── postcss.config.js
├── README.md
```

---

## 📋 Fonctionnalité : Prise de ticket

### Description

Depuis l’écran d’accueil, l’utilisateur peut cliquer sur **“Prendre un ticket”**, ce qui :

- Envoie une requête `POST` à l’API  
- Crée un nouveau ticket avec numéro et timestamp  
- Stocke le ticket dans le `localStorage`  
- Redirige automatiquement vers la page `/ticket`  

### API utilisée

```
POST /ticket
```

---

## 🎫 Fonctionnalité : Affichage du ticket

### Description

L’écran `/ticket` affiche :

- Le numéro du ticket  
- L’heure de création  
- Un message de confirmation  
- (À venir : bouton “Annuler mon ticket”)  

### Stockage local

- Données conservées dans `localStorage` pour éviter la perte au rechargement


---

## Fonctionnalité : Accès administrateur

### Description

Un accès spécial permet au médecin ou à la secrétaire de voir la file d’attente en temps réel et d’appeler le patient suivant.

- Une page `/admin-login` permet de saisir un **code d’accès confidentiel**
- Si le code est correct, l’accès à `/admin` est autorisé
- Sinon, l’utilisateur est redirigé vers `/admin-login`

### Fonctionnement

- Le code est vérifié en front (valeur locale type `admin2024`)
- Une fois connecté, le statut `isAdmin=true` est stocké dans `localStorage`
- L’interface `/admin` permet de :
  - Voir toute la file (avec les statuts)
  - Appeler le patient suivant (`DELETE /next`)
  - Actualisation toutes les 3 secondes

### Statuts affichés

| Statut            | Signification             |
|-------------------|---------------------------|
| en_attente        | Patient en file           |
| en_consultation   | Patient appelé            |
| desiste           | Patient désisté (rayé)    |

### Routes API utilisées

---

## 📋 Fonctionnalité : Annulation de ticket

### Description:

Permet à l’utilisateur d’annuler son ticket depuis la page /ticket en cliquant sur un bouton "Annuler mon ticket".

Plutôt que de supprimer le ticket de la file, l’application modifie son statut pour indiquer qu’il a été désisté.
Cela permet de conserver une trace du passage et d’informer les autres utilisateurs dans la file.

Comportement
Le ticket est marqué status: "desiste" dans le back-end

Le ticket reste visible dans la file avec le message "Désisté"

Le localStorage est vidé

L’utilisateur est redirigé vers l’accueil (/)

Mise à jour de la file d’attente
Dans la page /queue, les statuts s’affichent ainsi :

Statut du ticket	Affichage
en_attente	"En attente"
desiste	"Désisté"
Premier ticket	"En consultation"

API utilisée

DELETE /ticket/:id

---


## 📋 Fonctionnalité : File d’attente

### Description

Affiche dynamiquement tous les tickets pris par les utilisateurs, dans l’ordre d’arrivée.

- Le ticket en cours est affiché en haut avec la mention "En consultation"  
- Le ticket de l’utilisateur actuel est mis en évidence ("(vous)")  
- Rafraîchissement automatique toutes les 3 secondes  

### Design (selon la maquette Figma)

| Élément          | Style appliqué             |
|------------------|----------------------------|
| Fond             | Couleur beige clair (#F5F1E3) |
| Cartes ticket    | Fond blanc, ombre légère, coins arrondis |
| Ticket actif     | Fond jaune clair, texte en gras |
| Ticket en cours  | Affiché en première position avec mention spéciale |

### API utilisée

```
GET /queue
```

---

## 🧪 Lancement du projet

### Frontend (React)

```bash
cd client
npm install
npm run dev
```

### Backend (Express)

```bash
cd server
npm install
npm run dev
```

---

## 🖼️ Maquettes Figma

📱 **Design Mobile First disponible ici :**  
👉 [Lien vers Figma](https://www.figma.com/design/zi5VEcXZSOYnyhJ9Yh9UDc/LineUp---Mobile-UI?node-id=0-1&t=owCn5p4ayv6n3qFb-1)

---

## 👤 Auteur

**Elyes Messaadia**  
Développeur Web & Web Mobile  
📍 Marseille  
📧 <elyes.messaadia@laplateforme.io>
