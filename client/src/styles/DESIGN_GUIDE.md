# Guide du Nouveau Système de Design LineUp

## 🎨 Palette de Couleurs Harmonisée

### Couleurs Principales
```css
/* Bleu professionnel et chaleureux */
primary-50: '#f0f7ff'
primary-500: '#0091ff'  /* Couleur principale */
primary-700: '#0062b3'

/* Gris moderne et doux */
secondary-50: '#f9fafb'
secondary-500: '#6b7280'
secondary-700: '#374151'

/* Orange accent chaleureux */
accent-50: '#fff7ed'
accent-500: '#f97316'
accent-700: '#c2410c'
```

### Couleurs de Statut
```css
/* Succès - Vert professionnel */
success-50: '#f0fdf4'
success-500: '#16a34a'
success-700: '#15803d'

/* Erreur - Rouge doux */
error-50: '#fef2f2'
error-500: '#dc2626'
error-700: '#b91c1c'

/* Avertissement - Orange harmonisé */
warning-50: '#fff7ed'
warning-500: '#f97316'
warning-700: '#c2410c'

/* Information - Bleu informatif */
info-50: '#eff6ff'
info-500: '#3b82f6'
info-700: '#1d4ed8'
```

## 🌟 Système d'Ombres

```css
/* Ombres subtiles pour la hiérarchie */
shadow-subtle: '0 2px 4px rgba(0, 0, 0, 0.05), 0 1px 2px rgba(0, 0, 0, 0.1)'

/* Ombres pour mobile */
shadow-mobile: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)'

/* Ombres pour éléments accessibles */
shadow-accessible: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)'

/* Ombres pour focus */
shadow-focus: '0 0 0 3px rgba(0, 145, 255, 0.2)'
```

## ✨ Animations et Transitions

### Durées et Fonctions
```css
/* Durées recommandées */
duration-300: '300ms'   /* Hover rapide */
duration-400: '400ms'   /* Standard */
duration-500: '500ms'   /* Entrées/sorties */

/* Fonctions de transition */
ease-smooth: 'cubic-bezier(0.4, 0, 0.2, 1)'
ease-bounce: 'cubic-bezier(0.34, 1.56, 0.64, 1)'
```

### Animations Prêtes à l'Emploi
```css
animate-fade-in       /* Apparition douce */
animate-slide-up      /* Glissement vers le haut */
animate-scale-in      /* Zoom d'entrée */
animate-bounce-gentle /* Rebond doux */
animate-slide-in-right /* Glissement depuis la droite */
```

## 🎯 Exemples d'Utilisation

### Boutons
```jsx
// Bouton principal
<button className="
  px-4 py-3 
  bg-primary-500 hover:bg-primary-600 
  text-white font-medium 
  rounded-lg shadow-mobile hover:shadow-accessible
  transition-all duration-300 ease-smooth
  transform hover:scale-105 active:scale-95
">
  Action Principale
</button>

// Bouton secondaire
<button className="
  px-4 py-3
  bg-secondary-50 hover:bg-secondary-100
  text-secondary-700 font-medium
  rounded-lg shadow-subtle hover:shadow-mobile
  transition-all duration-300 ease-smooth
  transform hover:scale-105 active:scale-95
">
  Action Secondaire
</button>

// Bouton accent
<button className="
  px-4 py-3
  bg-accent-500 hover:bg-accent-600
  text-white font-medium
  rounded-lg shadow-mobile hover:shadow-accessible
  transition-all duration-300 ease-smooth
  transform hover:scale-105 active:scale-95
">
  Action d'Accent
</button>
```

### Cartes
```jsx
// Carte de base
<div className="
  p-6 
  bg-white/95 backdrop-blur-sm
  rounded-xl shadow-mobile hover:shadow-accessible
  border border-secondary-200
  transition-all duration-400 ease-smooth
  transform hover:scale-[1.02]
  animate-fade-in
">
  Contenu de la carte
</div>

// Carte de statut (succès)
<div className="
  p-6
  bg-success-50/80 
  border border-success-200
  rounded-xl shadow-mobile
  animate-slide-in-right
">
  <div className="flex items-center gap-3">
    <span className="text-2xl">✅</span>
    <div className="text-success-700">
      Opération réussie
    </div>
  </div>
</div>
```

### Notifications (Toasts)
```jsx
// Toast d'information
<div className="
  p-4 
  bg-info-50/95 
  text-info-700 
  border border-info-200
  rounded-xl shadow-accessible
  backdrop-blur-sm
  animate-slide-in-right
">
  Message d'information
</div>

// Toast important
<div className="
  p-4
  bg-accent-50/95
  text-accent-700
  border-2 border-accent-300
  rounded-xl shadow-accessible-strong
  ring-2 ring-accent-200/50
  backdrop-blur-sm
  animate-bounce-gentle
">
  Message important
</div>
```

### États Interactifs
```jsx
// Élément avec focus
<div className="
  focus:outline-none focus:ring-2 focus:ring-primary-400
  focus:shadow-focus
  transition-all duration-300
">
  Élément focusable
</div>

// Élément avec hover
<div className="
  hover:bg-primary-50
  hover:shadow-mobile
  hover:scale-105
  transition-all duration-300 ease-smooth
  cursor-pointer
">
  Élément interactif
</div>
```

## 🎨 Conseils d'Utilisation

### ✅ Bonnes Pratiques
- Utilisez les couleurs avec transparence (ex: `bg-primary-50/95`) pour plus de profondeur
- Combinez plusieurs ombres pour créer de la hiérarchie
- Utilisez `backdrop-blur-sm` avec des arrière-plans transparents
- Préférez les transitions douces avec `ease-smooth`
- Ajoutez des micro-interactions avec `transform` et `scale`

### ❌ À Éviter
- Mélanger trop de couleurs d'accent sur une même page
- Utiliser des animations trop rapides (< 200ms)
- Ombres trop prononcées sur mobile
- Transitions abruptes sans courbes d'ease

### 📱 Responsive Design
- Les ombres sont adaptées aux écrans mobiles
- Les animations sont optimisées pour éviter les problèmes de performance
- Les couleurs gardent un bon contraste sur tous les écrans

Ce système de design assure une interface **professionnelle**, **chaleureuse** et **cohérente** dans toute l'application.