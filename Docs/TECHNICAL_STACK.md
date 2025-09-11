# 📚 Documentation Technique - LineUp

## 🏗 Architecture Globale

### Frontend (Client)
- **Framework** : React 18 avec Vite
- **Routing** : React Router DOM v6
- **Styling** : TailwindCSS avec système de design personnalisé
- **Animation** : Framer Motion
- **PWA** : vite-plugin-pwa
- **QR Code** : qrcode.react

### Backend (Server)
- **Runtime** : Node.js avec Express 5
- **Base de données** : MongoDB avec Mongoose
- **Authentication** : JWT (jsonwebtoken)
- **Sécurité** : 
  - Helmet (sécurité des headers HTTP)
  - Express Rate Limit (protection contre les attaques DDoS)
  - XSS-Clean (protection contre les attaques XSS)
  - Express Mongo Sanitize (protection contre les injections NoSQL)
  - Bcrypt (hashage des mots de passe)
  - Cors (gestion des CORS)
- **Validation** : Joi
- **Notifications** : Web-Push

## 🎨 Système de Design

### Composants Réutilisables

#### 1. Button
```jsx
<Button 
  variant="primary|secondary|outline"
  size="sm|md|lg"
  loading={boolean}
  icon={<Icon />}
  iconPosition="left|right"
/>
```

Props disponibles :
- `variant` : Type de bouton
- `size` : Taille du bouton
- `loading` : État de chargement
- `icon` : Icône à afficher
- `iconPosition` : Position de l'icône
- `fullWidth` : Bouton pleine largeur
- `disabled` : État désactivé
- `className` : Classes CSS additionnelles

#### 2. Card
```jsx
<Card 
  variant="default|hover"
  padding="sm|md|lg"
  gradient={boolean}
>
  <Card.Header />
  <Card.Content />
  <Card.Footer />
</Card>
```

Props disponibles :
- `variant` : Style de la carte
- `padding` : Espacement interne
- `gradient` : Activation du dégradé
- `hover` : Effet au survol
- `className` : Classes CSS additionnelles

#### 3. ResponsiveText
```jsx
<ResponsiveText
  variant="h1|h2|h3|h4|body|body-large|caption|subtitle"
  weight="normal|medium|semibold|bold"
  color="primary|secondary|etc"
/>
```

Props disponibles :
- `variant` : Style de texte
- `weight` : Graisse de la police
- `color` : Couleur du texte
- `as` : Élément HTML à utiliser
- `className` : Classes CSS additionnelles

#### 4. ResponsiveContainer
```jsx
<ResponsiveContainer
  maxWidth="max-w-4xl"
  spacing="space-y-6"
  padding="px-4"
/>
```

Props disponibles :
- `maxWidth` : Largeur maximale
- `spacing` : Espacement entre les éléments
- `padding` : Marges internes
- `className` : Classes CSS additionnelles

### Design Tokens

#### 🎨 Couleurs
```javascript
colors: {
  primary: {
    50: '#f0f9ff',
    100: '#e0f2fe',
    200: '#bae6fd',
    300: '#7dd3fc',
    400: '#38bdf8',
    500: '#0ea5e9',
    600: '#0284c7',
    700: '#0369a1',
    800: '#075985',
    900: '#0c4a6e',
  },
  secondary: {
    50: '#f8fafc',
    100: '#f1f5f9',
    200: '#e2e8f0',
    300: '#cbd5e1',
    400: '#94a3b8',
    500: '#64748b',
    600: '#475569',
    700: '#334155',
    800: '#1e293b',
    900: '#0f172a',
  },
  // Autres palettes...
}
```

#### 📝 Typographie
```javascript
typography: {
  fontFamily: {
    sans: 'Inter, system-ui, sans-serif',
    heading: 'Inter, system-ui, sans-serif'
  },
  fontSize: {
    xs: '0.75rem',    // 12px
    sm: '0.875rem',   // 14px
    base: '1rem',     // 16px
    lg: '1.125rem',   // 18px
    xl: '1.25rem',    // 20px
    '2xl': '1.5rem',  // 24px
    '3xl': '1.875rem',// 30px
    '4xl': '2.25rem', // 36px
  },
  fontWeight: {
    normal: '400',
    medium: '500',
    semibold: '600',
    bold: '700',
  }
}
```

#### 📏 Espacement
```javascript
spacing: {
  0: '0',
  1: '0.25rem',    // 4px
  2: '0.5rem',     // 8px
  3: '0.75rem',    // 12px
  4: '1rem',       // 16px
  // ...
}
```

## 🔄 Scripts Utilitaires

### Frontend
- `npm run dev` : Développement local
- `npm run dev:local` : Développement avec configuration locale
- `npm run dev:prod` : Développement avec configuration production
- `npm run build` : Build de production
- `npm run build:prod` : Build de production avec configuration production
- `npm run lint` : Vérification du code
- `npm run preview` : Preview de la build

### Backend
- Tests :
  - `npm test` : Exécuter les tests
  - `npm run test:watch` : Tests en mode watch
  - `npm run test:coverage` : Couverture des tests

- Base de données : 
  - `npm run seed` : Seeding des données
  - `npm run migrate` : Migration des données
  - `npm run check:db` : Vérification de la BDD
  - `npm run list:collections` : Liste des collections

- Gestion des utilisateurs :
  - `npm run create:user` : Création d'utilisateur
  - `npm run list:users` : Liste des utilisateurs
  - `npm run cleanup:users` : Nettoyage des utilisateurs
  - `npm run update:roles` : Mise à jour des rôles
  - `npm run create:test-users` : Création d'utilisateurs de test

- Maintenance :
  - `npm run fix:tickets` : Correction des tickets
  - `npm run check:deploy` : Vérification du déploiement
  - `npm run health` : Vérification de la santé du serveur

## 📝 Suggestions d'Améliorations

### 1. Documentation
- Créer une documentation Storybook pour les composants
- Documenter les API avec Swagger/OpenAPI
- Ajouter des exemples d'utilisation pour chaque composant

### 2. Tests
- Ajouter des tests E2E avec Cypress
- Augmenter la couverture des tests unitaires
- Ajouter des tests de performance
- Implémenter des tests de régression visuelle

### 3. UX/UI
- Implémenter le mode sombre
- Ajouter des animations de transition
- Améliorer l'accessibilité (ARIA, contraste)
- Optimiser l'expérience mobile

### 4. Performance
- Mettre en place le code splitting
- Optimiser le chargement des images
- Implémenter le SSR pour le SEO
- Utiliser le lazy loading pour les composants

### 5. Sécurité
- Ajouter une authentification 2FA
- Mettre en place un système de logs
- Implémenter un rate limiting plus sophistiqué
- Renforcer la validation des données

### 6. Développement
- Mettre en place un système de versioning des APIs
- Ajouter des hooks pre-commit (husky)
- Configurer un CI/CD plus robuste
- Standardiser les messages de commit

### 7. Monitoring
- Implémenter Sentry pour le suivi des erreurs
- Ajouter des métriques de performance
- Mettre en place un système de monitoring
- Configurer des alertes automatiques

### 8. Features
- Système de notifications plus avancé
- Export de données en différents formats
- Filtres et recherche avancés
- Système de thèmes personnalisables