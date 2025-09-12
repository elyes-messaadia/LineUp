# Système de Chat Intelligent LineUp - Documentation Technique

## Vue d'ensemble

Le système de chat intelligent de LineUp permet aux patients d'interagir avec un assistant virtuel qui évalue leur niveau d'urgence et les aide à communiquer efficacement leur situation médicale. Cette fonctionnalité vise à optimiser la gestion des files d'attente en priorisant les cas selon leur urgence réelle.

## Architecture du Système

### 1. Modèle de Données (MongoDB)

```javascript
Conversation {
  patientId: ObjectId,
  ticketId: ObjectId (optionnel),
  status: enum['en_attente', 'en_cours', 'termine'],
  urgencyLevel: Number (1-10),
  messages: [Message],
  aiAssessment: AiAssessment,
  // Autres champs de gestion
}
```

### 2. Flux de Conversation IA

#### Étape 1 : Évaluation Initiale

- Message de bienvenue automatique
- Demande d'évaluation de la douleur (1-10)
- Réponse contextuelle basée sur le niveau indiqué

#### Logique de Triage

```javascript
Si douleur >= 8:
  - Questions rapides sur symptômes vitaux
  - Priorisation immédiate possible
  
Si douleur 5-7:
  - Questions sur durée et évolution
  - Évaluation détaillée des symptômes
  
Si douleur <= 4:
  - Évaluation du niveau de stress/anxiété
  - Questions sur le contexte général
```

### 3. Système de Priorisation

#### Facteurs de Priorisation

- Niveau de douleur (40%)
- Durée des symptômes (20%)
- Facteurs de risque identifiés (20%)
- Niveau de stress/anxiété (10%)
- Temps d'attente (10%)

#### Formule de Score d'Urgence

```javascript
scoreUrgence = (douleur * 0.4) + 
               (duree * 0.2) + 
               (facteurRisque * 0.2) + 
               (stress * 0.1) + 
               (tempsAttente * 0.1)
```

## Intégration Frontend

### Composant React de Chat

- Interface responsive
- Support des notifications push
- Mise à jour en temps réel via WebSocket
- Affichage contextuel selon le statut

### Exemple d'Interface

```jsx
<ChatContainer>
  <ChatHeader />
  <MessageList>
    {/* Messages avec distinction IA/Patient/Staff */}
  </MessageList>
  <UrgencyIndicator score={urgencyScore} />
  <InputArea />
</ChatContainer>
```

## API REST

### Points d'Entrée Principaux

1. Gestion des Conversations

```http
POST /api/conversations/start
GET /api/conversations/:id
PUT /api/conversations/:id/status
```

2. Messages

```http
POST /api/conversations/:id/messages
GET /api/conversations/:id/messages
```

3. Évaluations IA

```http
POST /api/conversations/:id/assess
GET /api/conversations/:id/assessment
```

## Sécurité et Protection des Données

### Mesures de Sécurité

- Chiffrement des données sensibles
- Validation stricte des entrées
- Rate limiting pour prévenir les abus
- Logs anonymisés pour la confidentialité

### Conformité RGPD

- Consentement explicite requis
- Droit à l'effacement implémenté
- Durée de conservation limitée
- Export des données possible

## Déploiement et Maintenance

### Prérequis

- Node.js >= 18
- MongoDB >= 5.0
- WebSocket supporté
- Redis pour le cache (optionnel)

### Variables d'Environnement

```bash
AI_SERVICE_URL=https://ai-service.lineup.com
AI_API_KEY=xxxxx
WEBSOCKET_ENABLED=true
MAX_CONVERSATIONS=1000
```

## Roadmap et Évolutions Futures

### Phase 1 (MVP)

- [x] Modèle de conversation
- [ ] Chatbot IA basique
- [ ] API REST fondamentale
- [ ] Interface utilisateur simple

### Phase 2 (Optimisation)

- [ ] Amélioration de l'algorithme IA
- [ ] Intégration des retours utilisateurs
- [ ] Système de notifications avancé
- [ ] Analytics et tableaux de bord

### Phase 3 (Extension)

- [ ] Support multi-langues
- [ ] Intégration télémédecine
- [ ] IA prédictive pour les pics d'affluence
- [ ] API publique pour partenaires

## Métriques de Performance

### KPIs à Suivre

1. Temps moyen de première réponse
2. Précision de l'évaluation d'urgence
3. Satisfaction patient
4. Taux de résolution
5. Temps d'attente optimisé

## Notes d'Implémentation

### Bonnes Pratiques

- Utiliser des tests automatisés
- Documenter les changements d'API
- Monitorer les performances
- Faire des revues de code régulières

### Points d'Attention

- Gestion des cas edge
- Scalabilité des WebSockets
- Protection contre les abus
- Confidentialité des données

## Support et Contact

Pour toute question technique :

- Email : [tech@lineup.com](mailto:tech@lineup.com)
- Slack : #lineup-tech
- Github : [github.com/lineup/chat-system](https://github.com/lineup/chat-system)
