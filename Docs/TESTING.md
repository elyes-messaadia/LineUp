# Documentation Tests Unitaires

## Configuration

### Environment

Les tests s'exécutent dans un environnement dédié avec les paramètres suivants :

- `NODE_ENV=test`
- Base de données de test dédiée
- Logging désactivé
- Timeouts augmentés

### Outils

- Jest comme framework principal
- Supertest pour les tests HTTP
- MongoDB Memory Server (optionnel)

## Structure

### Organisation

```
server/
  __tests__/           # Tests principaux
    auth.test.js       # Tests d'authentification
    security.test.js   # Tests de sécurité
    ticket.test.js     # Tests des tickets
    ...
  __mocks__/          # Mocks globaux
    pino.js           # Mock du logger
    pino-http.js      # Mock du middleware logger
```

### Conventions

- Un fichier de test par module
- Nommage explicite des tests
- Groupement par fonctionnalité
- Isolation des tests

## Bonnes Pratiques

### Préparation

```javascript
beforeAll(async () => {
  await connectDB();
});

beforeEach(async () => {
  await cleanupTestData();
});

afterAll(async () => {
  await disconnectDB();
});
```

### Isolation

- Chaque test doit être indépendant
- Nettoyage de la base entre les tests
- Pas d'effets de bord entre tests

### Mocking

- Mock des services externes
- Simulation des erreurs
- Vérification des appels

## Exécution

### Commandes

```bash
# Tous les tests
npm test

# Tests spécifiques
npm test auth.test.js

# Avec couverture
npm test -- --coverage

# Détection des handles ouverts
npm test -- --detectOpenHandles
```

### Debug

- Utiliser `console.log` en test uniquement
- Augmenter les timeouts si nécessaire
- Vérifier les connexions ouvertes

## Maintenance

### Couverture

- Minimum 80% de couverture
- Tests des cas d'erreur
- Tests des cas limites

### Performance

- Tests rapides (<10s par suite)
- Pas de blocage de ressources
- Nettoyage efficace

### Qualité

- Tests lisibles et maintenables
- Documentation à jour
- Revue de code systématique

## Troubleshooting

### Problèmes Courants

1. Handles ouverts
   - Vérifier les connexions DB
   - Fermer les listeners
   - Nettoyer les timers

2. Tests instables
   - Augmenter les timeouts
   - Vérifier les mocks
   - Isoler les tests

3. Échecs aléatoires
   - Race conditions
   - État partagé
   - Timeouts trop courts

### Solutions

1. Handles DB
   ```javascript
   afterAll(async () => {
     await disconnectDB();
     // Attendre un peu pour la fermeture
     await new Promise(r => setTimeout(r, 500));
   });
   ```

2. Mocks
   ```javascript
   jest.mock('../services/external', () => ({
     callExternal: jest.fn().mockResolvedValue({ success: true })
   }));
   ```

3. Cleanup
   ```javascript
   afterEach(async () => {
     jest.clearAllMocks();
     await cleanupTestData();
   });
   ```

## Best Practices Supplémentaires

### Tests d'Intégration

- Tests des routes complètes
- Vérification des middlewares
- Tests de bout en bout

### Tests de Sécurité

- Validation des tokens
- Tests des limites de rate
- Injection de données

### Tests de Performance

- Temps de réponse
- Charge mémoire
- Connexions simultanées