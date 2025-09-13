# Tests et Gestion des Handles

## Problème Rencontré

Lors de l'exécution des tests avec Jest, nous avons rencontré des problèmes de "open handles" qui empêchaient Jest de se terminer proprement. Ce problème est souvent lié à :

1. Des connexions MongoDB non fermées
2. Des serveurs HTTP qui restent actifs
3. Des promesses non résolues
4. Des timers qui continuent de tourner

## Solution Implémentée

### 1. Gestion des Connexions MongoDB

```javascript
beforeAll(async () => {
  try {
    mongoServer = process.env.MONGODB_URI;
    await mongoose.connect(mongoServer, {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
  } catch (err) {
    console.error("Erreur de connexion MongoDB:", err);
    throw err;
  }
});

afterAll(async () => {
  try {
    await Promise.all([
      // Nettoyage final
      User.deleteMany({}),
      Role.deleteMany({})
    ]);
    await mongoose.disconnect();
  } catch (err) {
    console.error("Erreur lors du nettoyage final:", err);
    throw err;
  }
});
```

### 2. Gestion du Serveur HTTP

```javascript
let server;

beforeAll(async () => {
  server = app.listen(0); // Port dynamique
});

afterAll(async () => {
  await new Promise((resolve) => {
    server.close(resolve);
  });
});
```

### 3. Nettoyage des Données

```javascript
beforeEach(async () => {
  await Promise.all([
    User.deleteMany({}),
    Role.deleteMany({})
  ]);
});

afterEach(async () => {
  await Promise.all([
    User.deleteMany({}),
    Role.deleteMany({})
  ]);
});
```

## Bonnes Pratiques

1. **Utiliser Promise.all()** pour le nettoyage parallèle
2. **Gérer les erreurs** avec try/catch
3. **Fermer explicitement** les connexions et serveurs
4. **Nettoyer après chaque test** pour éviter les interférences
5. **Utiliser des timeouts appropriés** dans Jest

## Configuration Jest

```javascript
// jest.config.js
module.exports = {
  testTimeout: 30000,
  setupFilesAfterEnv: ['./jest.setup.js'],
  globalTeardown: './jest.teardown.js'
};
```

## Détection des Problèmes

Pour identifier les handles non fermés :

```bash
npm test -- --detectOpenHandles
```

## Logging en Test

```javascript
jest.mock("../utils/logger", () => ({
  warn: jest.fn(),
  error: jest.fn(),
  info: jest.fn(),
  child: jest.fn().mockReturnValue({
    warn: jest.fn(),
    error: jest.fn(),
    info: jest.fn()
  })
}));
```

## À Éviter

1. Laisser des connexions ouvertes
2. Utiliser des timers sans .unref()
3. Oublier de nettoyer les données de test
4. Ignorer les erreurs dans les hooks beforeAll/afterAll

## Dépannage Courant

1. **Erreur : Jest did not exit**
   - Vérifier les connexions MongoDB
   - Vérifier les serveurs HTTP
   - Chercher les timers actifs

2. **Erreur : Async operations**
   - Utiliser await sur les opérations async
   - Vérifier les promesses non résolues

3. **Erreur : Database is locked**
   - Attendre la fin des opérations de cleanup
   - Vérifier les connexions concurrentes