/** @type {import('tailwindcss').Config} */
export default {
    content: [
      "./index.html",
      "./src/**/*.{js,ts,jsx,tsx}",
    ],
    theme: {
      extend: {
        screens: {
          // Breakpoints optimisés pour différents modèles de téléphones
          'xs': '320px',     // Très petits écrans et anciens téléphones
          'se': '375px',     // iPhone SE spécifiquement
          'sm': '390px',     // iPhone 12/13/14 standard
          'md': '430px',     // iPhone 14/15 Pro Max et équivalents
          'lg': '768px',     // Tablettes et desktop pour navigation
          'xl': '1024px',    // Desktop
          '2xl': '1280px',   // Large desktop
          
          // Breakpoints pour orientation
          'landscape': {'raw': '(orientation: landscape)'},
          'portrait': {'raw': '(orientation: portrait)'},
          
          // Breakpoints spécifiques pour anciens modèles
          'iphone-se': {'raw': '(max-width: 375px)'},
          'iphone-13': {'raw': '(min-width: 390px) and (max-width: 428px)'},
          'old-android': {'raw': '(max-width: 360px)'},
        },
        
        // Espacements optimisés pour les anciens modèles
        spacing: {
          'safe-top': 'env(safe-area-inset-top)',
          'safe-bottom': 'env(safe-area-inset-bottom)',
          'safe-left': 'env(safe-area-inset-left)',
          'safe-right': 'env(safe-area-inset-right)',
          '18': '4.5rem',
          '22': '5.5rem',
          '26': '6.5rem',
        },
        
        // Tailles de police optimisées
        fontSize: {
          'xs-mobile': ['0.75rem', { lineHeight: '1.4' }],
          'sm-mobile': ['0.875rem', { lineHeight: '1.5' }],
          'base-mobile': ['1rem', { lineHeight: '1.6' }],
          'lg-mobile': ['1.125rem', { lineHeight: '1.6' }],
          'xl-mobile': ['1.25rem', { lineHeight: '1.5' }],
          'senior': ['1.125rem', { lineHeight: '1.7', fontWeight: '500' }],
          'senior-small': ['1rem', { lineHeight: '1.6', fontWeight: '500' }],
        },
        
        // Ombres adaptées aux petits écrans
        boxShadow: {
          'mobile': '0 2px 8px rgba(0, 0, 0, 0.1)',
          'mobile-md': '0 4px 12px rgba(0, 0, 0, 0.15)',
          'accessible': '0 4px 12px rgba(0, 0, 0, 0.15)',
          'accessible-strong': '0 6px 20px rgba(0, 0, 0, 0.25)',
        },
        
        // Hauteurs minimales pour zones tactiles
        minHeight: {
          'touch': '44px',
          'touch-large': '56px',
          'touch-senior': '64px',
        },
        
        // Largeurs minimales pour zones tactiles
        minWidth: {
          'touch': '44px',
          'touch-large': '56px',
          'touch-senior': '64px',
        },
        
        // Animations douces pour éviter les problèmes vestibulaires
        animation: {
          'fade-in': 'fadeIn 0.3s ease-out',
          'slide-up': 'slideUp 0.3s ease-out',
          'bounce-gentle': 'bounceGentle 0.5s ease-out',
        },
        
        keyframes: {
          fadeIn: {
            '0%': { opacity: '0' },
            '100%': { opacity: '1' },
          },
          slideUp: {
            '0%': { transform: 'translateY(10px)', opacity: '0' },
            '100%': { transform: 'translateY(0)', opacity: '1' },
          },
          bounceGentle: {
            '0%, 20%, 50%, 80%, 100%': { transform: 'translateY(0)' },
            '40%': { transform: 'translateY(-5px)' },
            '60%': { transform: 'translateY(-3px)' },
          },
        },
      },
    },
    plugins: [],
  }
  