# Documentation Base de Données

## Configuration

La base de données MongoDB est configurée dans `server/config/db.js` avec deux environnements distincts :

### Production/Développement

- URI : Défini via `MONGO_URI` dans les variables d'environnement
- Pool de connexions : 10 connexions maximum
- Timeouts : 30 secondes pour la sélection du serveur et les opérations
- Logging : Activé avec différents niveaux selon l'environnement

### Test

- Base dédiée : `lineup-test`
- Pool réduit : 1 connexion maximum
- Logging : Désactivé
- Nettoyage automatique entre les tests

## Modèles

### User

- Authentification et profil utilisateur
- Rôles et permissions
- Relations avec tickets et conversations

### Ticket

- File d'attente et suivi des patients
- État et priorité
- Historique des modifications

### Conversation

- Messages entre utilisateurs
- Support du chat en temps réel
- Historique des échanges

### Patient

- Informations médicales
- Historique des visites
- Relations avec tickets

### Role

- Définition des rôles (médecin, patient, etc.)
- Permissions associées
- Hiérarchie des accès

## Sécurité

### Connexion

- Options de sécurité MongoDB activées
- TLS/SSL en production
- Authentification requise

### Validation

- Schémas Mongoose avec validations
- Sanitization des entrées
- Contraintes d'intégrité

### Backup

- Recommandation de backup quotidien
- Rétention de 30 jours minimum
- Procédure de restauration documentée

## Maintenance

### Indexation

```javascript
// Exemple d'index composé pour les tickets
Ticket.index({ status: 1, priority: -1 });
```

### Monitoring

- Utilisation des logs Pino
- Métriques de performance
- Alertes sur erreurs critiques

### Optimisation

- Requêtes optimisées
- Gestion du cache
- Agrégations efficaces
