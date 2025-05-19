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
- ✅ Tableau de bord pour appeler le prochain patient
- ✅ Version mobile et **PWA** pour installation rapide
- ✅ Design épuré, centré utilisateur

---

## 🛠️ Stack technique

| Côté client       | Côté serveur         | Autres outils         |
|------------------|----------------------|------------------------|
| React + Tailwind | Node.js + Express.js | MongoDB (Mongoose)     |
| React Router     | API REST sécurisée   | QRCode + Socket.io     |
| PWA (manifest)   |                      | Figma / GitHub / Render |

---

## 🧱 Structure du projet

/client → Frontend React
/server → Backend Express
/public → Fichiers statiques & manifest PWA
/models → Schémas MongoDB
/routes → Endpoints API
/utils → Fonctions partagées


---

## 🖼️ Maquettes Figma

👉 [Lien vers les maquettes (à insérer)](https://...)

---

## 🧪 Fonctionnalités à venir

- 🔔 Notifications quand le tour approche
- 🧑‍⚕️ Interface personnalisée pour chaque médecin
- 📊 Statistiques d’attente
- 🔐 Authentification sécurisée (admin)

---

## 📦 Installation (développement)

```bash
# 1. Cloner le repo
git clone https://github.com/ton-profil/lineup.git
cd lineup

# 2. Installer les dépendances
cd client && npm install
cd ../server && npm install

# 3. Lancer les serveurs
cd server && npm run dev
cd ../client && npm start

```

---
❤️ Auteur
Elyes Messaadia
Développeur Web & Web Mobile
📍 Marseille
📧 elyes.messaadia@laplateforme.io
