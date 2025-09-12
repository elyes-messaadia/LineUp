# 💬 Système de Chat Intelligent - Guide Rapide

## 🎯 Qu'est-ce que c'est ?

Un système de chat intelligent qui permet aux patients d'évaluer leur urgence médicale via une conversation avec une IA. Le système calcule automatiquement un score d'urgence (1-10) et optimise la file d'attente en conséquence.

## 🚀 Démarrage Rapide

### 1. Backend - Démarrer les Services

```bash
cd server
npm install
npm start
# Le serveur démarre sur http://localhost:5000
```

### 2. Frontend - Démarrer l'Interface

```bash
cd client  
npm install
npm run dev
# L'interface démarre sur http://localhost:5173
```

### 3. Tester le Chat

1. Ouvrir le dashboard patient
2. Cliquer sur l'icône de chat (💬) en bas à droite
3. Commencer par : *"Bonjour, j'ai des symptômes à signaler"*
4. Répondre aux questions de l'IA
5. Observer le calcul automatique de l'urgence

## 🎨 Composants Principaux

### ChatWidget.jsx
Widget flottant qui s'affiche sur toutes les pages patient
```jsx
<ChatWidget
  patientId={patient._id}
  ticketId={currentTicket?._id}
  onUrgencyChange={(level, assessment) => {
    console.log(`Urgence détectée: ${level}/10`);
  }}
/>
```

### ChatInterface.jsx  
Interface principale de conversation avec l'IA

### UrgencyIndicator.jsx
Indicateur visuel du niveau d'urgence avec couleurs

## 🔧 Configuration

### Variables d'Environnement

```bash
# Server/.env
JWT_SECRET=your-secret-key
MONGODB_URI=mongodb://localhost:27017/lineup
PORT=5000

# Client/.env  
VITE_API_URL=http://localhost:5000
VITE_CHAT_ENABLED=true
```

### Personnalisation du Chatbot

Modifier `server/services/ChatbotAI.js` :

```javascript
// Ajuster les questions
const questions = {
  pain: "Sur une échelle de 1 à 10, votre douleur ?",
  symptoms: "Quels sont vos principaux symptômes ?"
};

// Modifier les seuils d'urgence
const thresholds = {
  high: 8,    // Urgence élevée  
  medium: 5,  // Urgence modérée
  low: 3      // Urgence faible
};
```

## 🔒 Sécurité

- ✅ JWT requis pour toutes les conversations
- ✅ Rate limiting (10 messages/minute)
- ✅ Sanitisation des messages  
- ✅ Validation des permissions patient

## 📊 API Endpoints

```http
POST /conversations                    # Créer conversation
POST /conversations/:id/message        # Envoyer message  
GET /conversations/:id                 # Récupérer historique
POST /tickets/priority-update          # Mettre à jour priorités
```

## 🧪 Tests

### Test Automatisé
```bash
cd client
node test-chat-system.js
```

### Test Manuel Rapide
1. Envoyer: *"J'ai très mal à la poitrine"*
2. Répondre: *"Douleur niveau 9"*  
3. Vérifier: Score d'urgence ≥ 8
4. Confirmer: Mise à jour de la priorité du ticket

## 🎯 Flux Typique d'Utilisation

1. **Patient arrive** → Crée un ticket → Accède au dashboard
2. **Ouvre le chat** → L'IA pose des questions ciblées
3. **Évalue les symptômes** → Calcule un score d'urgence 1-10
4. **Met à jour la priorité** → Repositionne dans la file d'attente
5. **Notifie l'équipe** → Urgence élevée = alerte immédiate

## 🚨 Urgences Critiques  

Le système détecte automatiquement les urgences critiques :

- **Score 9-10** : 🔴 Urgence vitale
- **Score 7-8** : 🟠 Urgence élevée  
- **Score 4-6** : 🟡 Urgence modérée
- **Score 1-3** : 🟢 Urgence faible

## 🔄 Algorithme de Priorisation

```
Priorité Finale = 
  40% × Score d'Urgence IA +
  25% × Temps d'Attente + 
  15% × Type de Patient +
  10% × Activité Conversation +
  10% × Historique Médical
```

## 💡 Conseils d'Utilisation

### Pour les Développeurs
- Surveiller les logs : `pm2 logs lineup-api`
- Tester régulièrement avec `test-chat-system.js`
- Ajuster les seuils selon les retours médecins

### Pour l'Équipe Médicale  
- Scores 8+ = priorité immédiate
- Vérifier dashboard pour les alertes
- Historique chat disponible par ticket

## 📱 Interface Mobile

Le chat est entièrement responsive :
- Widget adaptatif sur mobile
- Interface tactile optimisée
- Notifications push (si configurées)

## 🆘 Résolution de Problèmes

### Le chat ne s'affiche pas
```bash
# Vérifier les variables d'env
echo $VITE_CHAT_ENABLED  # doit être 'true'

# Vérifier la console navigateur
F12 > Console > Erreurs ?
```

### L'IA ne répond pas
```bash
# Vérifier le serveur
curl http://localhost:5000/health

# Vérifier MongoDB  
mongosh lineup --eval "db.conversations.countDocuments()"
```

### Scores d'urgence incorrects
- Vérifier la logique dans `ChatbotAI.js`
- Tester avec des cas connus
- Ajuster les seuils si nécessaire

## 📞 Support Rapide

**Logs utiles :**
```bash
# Backend
pm2 logs lineup-api

# Frontend  
npm run dev # Mode développement avec logs détaillés
```

**API de santé :**
```bash
curl http://localhost:5000/health
# Réponse attendue: { "status": "ok", "chatbot": "active" }
```

---

✅ **Système opérationnel** - Le chat intelligent est maintenant intégré et fonctionnel !

🔗 **Plus de détails :** Voir `Docs/CHAT_DEPLOYMENT.md` pour le guide complet de déploiement.