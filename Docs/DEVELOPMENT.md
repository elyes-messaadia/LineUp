# 👨‍💻 Guide de Développement

## Architecture du Projet

### Frontend (React + Vite)

```
client/
├── src/
│   ├── components/     # Composants réutilisables
│   ├── pages/         # Pages de l'application
│   ├── hooks/         # Custom hooks
│   ├── utils/         # Fonctions utilitaires
│   ├── config/        # Configuration
│   └── assets/        # Ressources statiques
```

### Backend (Node.js + Express)

```
server/
├── routes/           # Routes API
├── controllers/      # Logique métier
├── models/          # Modèles Mongoose
├── middlewares/     # Middlewares Express
├── config/          # Configuration
├── utils/           # Utilitaires
└── scripts/         # Scripts utilitaires
```

## Conventions de Code

### Style de Code
- ESLint pour le linting
- Prettier pour le formatage
- Conventions AirBnB

### Nommage
- PascalCase pour les composants React
- camelCase pour les fonctions et variables
- UPPER_CASE pour les constantes

### Structure des Composants
```jsx
const ComponentName = ({ prop1, prop2 }) => {
  // Hooks d'abord
  const [state, setState] = useState();
  
  // Effets ensuite
  useEffect(() => {
    // ...
  }, []);
  
  // Fonctions auxiliaires
  const handleSomething = () => {
    // ...
  };
  
  // Rendu
  return (
    // ...
  );
};
```

## Workflow Git

### Branches
- `main` : Production
- `develop` : Développement
- `feature/*` : Nouvelles fonctionnalités
- `fix/*` : Corrections de bugs
- `release/*` : Préparation de release

### Commits
```
type(scope): description

feat: nouvelle fonctionnalité
fix: correction de bug
docs: documentation
style: formatage
refactor: refactoring
test: ajout de tests
chore: maintenance
```

## Tests

### Frontend
```bash
# Tests unitaires
npm run test

# Tests e2e
npm run test:e2e

# Coverage
npm run test:coverage
```

### Backend
```bash
# Tests unitaires
npm run test

# Tests d'intégration
npm run test:integration

# Coverage
npm run test:coverage
```

## Documentation

### API
- Swagger UI : `/api-docs`
- Postman Collection
- README par endpoint

### Frontend
- Storybook pour les composants
- JSDoc pour les fonctions
- README par feature

## Performance

### Optimisations Frontend
- Code splitting
- Lazy loading
- Memoization
- Bundle optimization

## 🎨 Guide des Améliorations UI/UX

### Interface Patient
- Cards interactives pour la sélection des médecins
- Statut de disponibilité en temps réel
- Feedback visuel sur les interactions
- Design responsive optimisé

### Composants Optimisés
- Modales modernes avec validation
- Radio buttons personnalisés
- Gestion d'erreurs intuitive
- Animations fluides

### Retours Utilisateur
- Messages d'erreur clairs
- Indicateurs de chargement
- Confirmations visuelles
- Tooltips d'aide

### Optimisations Backend
- Caching
- Query optimization
- Rate limiting
- Compression

## Sécurité

### Frontend
- Sanitization des inputs
- Protection XSS
- CSRF tokens
- Content Security Policy

### Backend
- JWT validation
- Rate limiting
- Input validation
- Helmet security
- CORS configuration