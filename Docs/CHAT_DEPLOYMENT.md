# Guide de Déploiement - Système de Chat Intelligent

## 🎯 Vue d'Ensemble

Le système de chat intelligent permet aux patients d'évaluer leur urgence médicale via une interface conversationnelle alimentée par l'IA. Le système calcule automatiquement un score d'urgence et optimise la file d'attente en conséquence.

## 📋 Prérequis

### Backend

- Node.js v18+
- MongoDB v6+
- Packages npm installés (`npm install`)

### Frontend  

- React v18+
- Tailwind CSS v4+
- Vite v7+ pour le build

### Variables d'Environnement

```bash
# Server (.env)
JWT_SECRET=votre-clé-jwt-sécurisée
MONGODB_URI=mongodb://localhost:27017/lineup
PORT=5000
NODE_ENV=production

# Client (.env)
VITE_API_URL=http://localhost:5000
VITE_CHAT_ENABLED=true
```

## 🚀 Étapes de Déploiement

### 1. Préparation du Backend

```bash
cd server
npm install
npm run test  # Exécuter les tests de sécurité
```

**Fichiers Backend Critiques:**

- `controllers/notificationController.js` - API conversations
- `services/ChatbotAI.js` - Intelligence artificielle  
- `services/PrioritizationService.js` - Algorithme de priorisation
- `routes/auth.js` - Routes API ajoutées

### 2. Préparation du Frontend

```bash
cd client
npm install
npm run build  # Build de production
```

**Composants Frontend Critiques:**

- `components/ChatInterface.jsx` - Interface principale
- `components/ChatWidget.jsx` - Widget flottant
- `components/UrgencyIndicator.jsx` - Indicateur visuel
- `pages/PatientDashboard.jsx` - Intégration complète

### 3. Configuration de la Base de Données

Le système utilise les collections MongoDB existantes plus une nouvelle :

```javascript
// Nouvelle collection automatiquement créée
db.conversations.createIndex({ "patientId": 1, "createdAt": -1 })
db.conversations.createIndex({ "ticketId": 1 })
```

### 4. Tests de Validation

```bash
# Tests de sécurité (Backend)
cd server
npm test

# Tests d'intégration (Frontend)
cd client
node test-chat-system.js
```

## ⚙️ Configuration du Chat

### Activation du Chat Widget

Dans votre composant patient principal :

```jsx
import ChatWidget from '../components/ChatWidget';

// Dans votre composant
<ChatWidget
  patientId={patient._id}
  ticketId={currentTicket?._id}
  onUrgencyChange={(level, assessment) => {
    // Traiter le changement d'urgence
    console.log(`Nouvelle urgence: ${level}/10`);
  }}
  initialPosition="bottom-right"
/>
```

### Personnalisation du Chatbot

Modifiez `server/services/ChatbotAI.js` pour ajuster :

```javascript
// Questions personnalisées
const customQuestions = {
  pain: "Sur une échelle de 1 à 10, comment évalueriez-vous votre douleur ?",
  duration: "Depuis combien de temps ressentez-vous ces symptômes ?"
};

// Seuils d'urgence  
const urgencyThresholds = {
  high: 8,    // Urgence élevée
  medium: 5,  // Urgence modérée  
  low: 3      // Urgence faible
};
```

## 🔧 Configuration de la Priorisation

Le service de priorisation utilise une formule pondérée :

```javascript
// Pondérations par défaut (dans PrioritizationService.js)
const weights = {
  urgencyScore: 0.4,      // 40% - Score IA d'urgence
  waitingTime: 0.25,      // 25% - Temps d'attente
  patientType: 0.15,      // 15% - Type de patient
  conversationActivity: 0.1,  // 10% - Activité chat
  medicalHistory: 0.1     // 10% - Historique médical
};
```

## 📡 API Endpoints Ajoutées

### Conversations

```
POST /conversations                    # Créer conversation
POST /conversations/:id/message        # Envoyer message
GET /conversations/:id                 # Récupérer historique
GET /conversations/patient/:patientId  # Conversations patient
```

### Priorisation  

```
POST /tickets/priority-update          # Mise à jour priorités
GET /tickets/queue-status             # Statut file d'attente
```

## 🔒 Sécurité

### Authentification

- JWT requis pour toutes les routes chat
- Validation des permissions patient/ticket
- Rate limiting sur les messages (10/minute)

### Sanitisation

- Nettoyage automatique des messages
- Protection XSS sur le contenu chat
- Validation des entrées utilisateur

## 🚨 Surveillance et Alertes

### Logs Automatiques

```javascript
// Logs générés automatiquement
logger.info('Chat message sent', { patientId, urgencyLevel });
logger.warn('High urgency detected', { urgencyLevel: 9 });
logger.error('Chat service error', { error });
```

### Métriques à Surveiller

- Temps de réponse de l'IA (< 2s)
- Score d'urgence moyen par jour
- Nombre de conversations actives
- Taux d'erreur des évaluations

## 🧪 Tests de Production

### Test Manuel Rapide

1. Ouvrir le dashboard patient
2. Cliquer sur l'icône de chat
3. Envoyer : "J'ai mal à la tête niveau 8"
4. Vérifier que l'urgence est détectée
5. Confirmer la mise à jour de priorité

### Test Automatisé

```bash
# Dans client/
node test-chat-system.js
```

### Indicateurs de Succès

- ✅ Conversation créée sans erreur
- ✅ Messages envoyés/reçus correctement  
- ✅ Score d'urgence calculé (1-10)
- ✅ Priorité de ticket mise à jour
- ✅ Interface responsive sur mobile

## 🔄 Mise à Jour de Production

### Rolling Update

```bash
# 1. Backup base de données
mongodump --db lineup --out backup/

# 2. Update backend (zero downtime)
pm2 reload lineup-api

# 3. Update frontend 
npm run build
cp -r dist/* /var/www/html/

# 4. Vérification santé
curl http://localhost:5000/health
```

### Rollback Rapide

```bash
# Si problème détecté
pm2 restart lineup-api --update-env
# Ou revenir au build précédent
cp -r dist-backup/* /var/www/html/
```

## 🎛️ Configuration Avancée

### Optimisation Performance

```javascript
// Cache des réponses IA (optionnel)
const responseCache = new Map();
const CACHE_TTL = 300000; // 5 minutes

// Limitation des conversations simultanées
const MAX_CONCURRENT_CHATS = 50;
```

### Intégration Notifications Push

```javascript
// Dans onUrgencyChange callback
if (urgencyLevel >= 8) {
  await sendPushNotification({
    to: 'medical-staff',
    title: 'Urgence Élevée Détectée',
    body: `Patient ${patientId} - Score: ${urgencyLevel}/10`
  });
}
```

## 🆘 Résolution de Problèmes

### Problèmes Courants

**Chat ne s'affiche pas:**

- Vérifier VITE_CHAT_ENABLED=true
- Contrôler les permissions utilisateur
- Examiner la console développeur

**IA ne répond pas:**  

- Vérifier la connexion MongoDB
- Contrôler les logs serveur  
- Tester l'endpoint /conversations

**Scores d'urgence incorrects:**

- Vérifier la logique dans ChatbotAI.js
- Contrôler les seuils d'évaluation
- Examiner les données de conversation

### Debug Mode

```bash
# Activer logs détaillés
DEBUG=chat:* node server/index.js
```

## 📞 Support

En cas de problème critique :

1. Vérifier les logs : `pm2 logs lineup-api`
2. Status santé : `curl /health`
3. Rollback si nécessaire
4. Contacter l'équipe technique

---

**Version:** 1.0.0  
**Dernière mise à jour:** 2024  
**Compatibilité:** Node.js 18+, React 18+, MongoDB 6+
