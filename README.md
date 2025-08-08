# 🏥 LineUp - Gestion de File d'Attente Médicale

LineUp est une application web moderne conçue pour optimiser la gestion des files d'attente dans les cabinets médicaux. Elle offre une expérience fluide tant pour les patients que pour le personnel médical.

## ✨ Fonctionnalités

### 👥 Pour les Patients
- Prise de ticket virtuel
- Suivi en temps réel de la position dans la file
- Notifications sonores et visuelles
- QR code pour accès mobile
- Estimations du temps d'attente
- Possibilité d'annuler ou reprendre son ticket

### 👨‍⚕️ Pour les Médecins
- Tableau de bord en temps réel
- Gestion des consultations
- Appel du prochain patient
- Statistiques de la journée
- Interface intuitive

### 👩‍💼 Pour les Secrétaires
- Création de tickets
- Gestion de la file d'attente
- Vue d'ensemble des patients
- Interface de gestion dédiée

## 🏗️ Architecture

### Client (`/client`)
```
client/
├── src/
│   ├── components/           # Composants réutilisables
│   │   ├── Layout.jsx       # Layout principal
│   │   ├── QRCodeTicket.jsx # Gestion des QR codes
│   │   ├── Toast.jsx        # Notifications
│   │   └── AnimatedPage.jsx # Animations
│   │
│   ├── pages/               # Pages principales
│   │   ├── Home.jsx         # Accueil
│   │   ├── Queue.jsx        # File d'attente
│   │   ├── Ticket.jsx       # Page de ticket
│   │   └── dashboards/      # Tableaux de bord
│   │
│   └── hooks/               # Hooks personnalisés
```

### Serveur (`/server`)
```
server/
├── routes/                  # Routes API
├── models/                  # Modèles de données
└── controllers/             # Logique métier
```

## 🚀 Démarrage Rapide

### Prérequis
- Node.js (v14+)
- MongoDB
- npm ou yarn

### Installation

1. **Client**
```bash
cd client
npm install
npm run dev
```

2. **Serveur**
```bash
cd server
npm install
npm run dev
```

## 🔑 Comptes de Test

| Rôle      | Email                  | Mot de passe    |
|-----------|------------------------|-----------------|
| Médecin   | medecin@lineup.com    | medecin123     |
| Secrétaire| secretaire@lineup.com  | secretaire123  |
| Patient   | patient@lineup.com     | patient123     |
| Visiteur  | visiteur@lineup.com    | visiteur123    |

## 💡 Points Forts

### Temps Réel
- Mises à jour toutes les 500ms
- Notifications instantanées
- Estimations précises du temps d'attente

### Interface Utilisateur
- Design moderne et responsive
- Animations fluides
- Codes couleur intuitifs
- Support mobile complet

### Notifications
- Sons personnalisés
- Vibrations sur mobile
- Alertes visuelles
- Notifications système

### Sécurité
- Système de rôles
- Authentification sécurisée
- Protection des données

## 🛠️ Technologies

### Frontend
- React
- TailwindCSS
- React Router
- QR Code Generator

### Backend
- Node.js
- Express
- MongoDB
- JWT Authentication

## 📱 Fonctionnalités Mobile

- Interface responsive
- QR codes téléchargeables
- Notifications push
- Vibrations
- Design adaptatif

## 🔒 Sécurité

- Authentification JWT
- Protection des routes
- Validation des données
- Gestion des sessions
- Contrôle d'accès basé sur les rôles

## 📊 Monitoring

- Statistiques en temps réel
- Suivi des consultations
- Temps d'attente moyen
- Nombre de patients
- État de la file d'attente

## 🎯 Objectifs

1. **Efficacité**
   - Réduction des temps d'attente
   - Optimisation du flux de patients
   - Amélioration de l'expérience utilisateur

2. **Transparence**
   - Information en temps réel
   - Estimations précises
   - Communication claire

3. **Accessibilité**
   - Interface intuitive
   - Support multiplateforme
   - Adaptation aux besoins des utilisateurs

## 📁 Fichiers Importants

### Frontend (`/client/src/`)

#### Pages Principales
- **`pages/Queue.jsx`**
  - Cœur de l'application
  - Affichage en temps réel de la file d'attente
  - Gestion des notifications et estimations
  - Interface interactive avec statuts colorés
  - Mise à jour toutes les 500ms

- **`pages/Ticket.jsx`**
  - Gestion individuelle des tickets
  - Affichage du statut et position
  - Options d'annulation/reprise
  - Génération de QR code

- **`pages/dashboards/MedecinDashboard.jsx`**
  - Interface principale du médecin
  - Gestion des consultations
  - Appel du prochain patient
  - Vue d'ensemble de la journée

- **`pages/dashboards/SecretaireDashboard.jsx`**
  - Création et gestion des tickets
  - Vue d'ensemble de la file
  - Interface de gestion dédiée

#### Composants Clés
- **`components/QRCodeTicket.jsx`**
  - Génération des QR codes
  - Système d'impression adaptatif
  - Support mobile avec téléchargement
  - Format optimisé pour impression

- **`components/Toast.jsx`**
  - Système de notifications
  - Alertes personnalisables
  - Animations fluides
  - Support multi-types (succès, erreur, info)

- **`components/Layout.jsx`**
  - Structure principale de l'application
  - Navigation responsive
  - Thème cohérent
  - Gestion des transitions

### Backend (`/server/`)

#### API Routes
- **`routes/auth.js`**
  - Authentification des utilisateurs
  - Gestion des sessions
  - Protection des routes
  - Validation des tokens

- **`routes/queue.js`**
  - Gestion de la file d'attente
  - Endpoints temps réel
  - Mise à jour des statuts
  - Statistiques

#### Modèles
- **`models/User.js`**
  - Schéma utilisateur
  - Rôles et permissions
  - Validation des données
  - Méthodes utilitaires

- **`models/Ticket.js`**
  - Structure des tickets
  - Statuts et transitions
  - Horodatage
  - Relations utilisateur

#### Configuration
- **`config/database.js`**
  - Configuration MongoDB
  - Options de connexion
  - Gestion des erreurs
  - Indexation

- **`config/auth.js`**
  - Configuration JWT
  - Middleware d'authentification
  - Stratégies de sécurité
  - Gestion des sessions

## 📝 Licence

Ce projet est sous licence [MIT](./LICENSE).


## 👥 Contribution

Les contributions sont les bienvenues ! N'hésitez pas à :
1. Fork le projet
2. Créer une branche (`git checkout -b feature/AmazingFeature`)
3. Commit vos changements (`git commit -m 'Add some AmazingFeature'`)
4. Push sur la branche (`git push origin feature/AmazingFeature`)
5. Ouvrir une Pull Request

## 📞 Support

Pour toute question ou assistance :
- Ouvrir une issue sur GitHub
- Contacter l'équipe de support
- Consulter la documentation

---

Développé avec ❤️ pour améliorer l'expérience en cabinet médical
