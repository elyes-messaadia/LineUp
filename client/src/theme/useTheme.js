import { useMemo } from 'react';
import tokens from './tokens';

export const useTheme = () => {
  return useMemo(() => ({
    // Composants communs
    button: {
      base: `
        inline-flex items-center justify-center px-4 py-2
        font-medium rounded-lg transition-colors
        focus:outline-none focus:ring-2 focus:ring-offset-2
      `,
      variants: {
        primary: `
          bg-primary-600 text-white
          hover:bg-primary-700
          focus:ring-primary-500
        `,
        secondary: `
          bg-secondary-200 text-secondary-900
          hover:bg-secondary-300
          focus:ring-secondary-500
        `,
        outline: `
          border-2 border-primary-600 text-primary-600
          hover:bg-primary-50
          focus:ring-primary-500
        `,
      },
      sizes: {
        sm: 'text-sm px-3 py-1.5',
        md: 'text-base px-4 py-2',
        lg: 'text-lg px-6 py-3',
      },
    },

    // Input et form controls
    input: {
      base: `
        w-full px-4 py-2 rounded-lg border-2
        focus:outline-none focus:ring-2
        disabled:bg-gray-100 disabled:cursor-not-allowed
        transition duration-200
      `,
      variants: {
        default: `
          border-gray-300
          focus:border-primary-500 focus:ring-primary-200
        `,
        error: `
          border-red-500
          focus:border-red-500 focus:ring-red-200
        `,
      },
    },

    // Cards et conteneurs
    card: {
      base: `
        bg-white rounded-xl shadow-md
        border border-gray-100
      `,
      variants: {
        hover: `
          hover:shadow-lg
          transition-shadow duration-200
        `,
        interactive: `
          cursor-pointer
          hover:shadow-lg hover:border-primary-200
          transition-all duration-200
        `,
      },
      padding: {
        none: '',
        sm: 'p-4',
        md: 'p-6',
        lg: 'p-8',
      },
    },

    // Navigation
    nav: {
      link: {
        base: `
          inline-flex items-center px-4 py-2
          text-sm font-medium rounded-md
          transition-colors duration-200
        `,
        variants: {
          default: `
            text-gray-600 hover:text-gray-900
            hover:bg-gray-50
          `,
          active: `
            text-primary-600 bg-primary-50
            hover:bg-primary-100
          `,
        },
      },
    },

    // Composants de retour
    feedback: {
      toast: {
        base: `
          flex items-center p-4 rounded-lg shadow-lg
          border-l-4
        `,
        variants: {
          success: `
            bg-green-50 border-green-500
            text-green-700
          `,
          error: `
            bg-red-50 border-red-500
            text-red-700
          `,
          warning: `
            bg-yellow-50 border-yellow-500
            text-yellow-700
          `,
          info: `
            bg-blue-50 border-blue-500
            text-blue-700
          `,
        },
      },
      alert: {
        base: `
          p-4 rounded-lg border
          flex items-start
        `,
        variants: {
          success: `
            bg-success-50 border-success-500
            text-success-700
          `,
          error: `
            bg-error-50 border-error-500
            text-error-700
          `,
          warning: `
            bg-warning-50 border-warning-500
            text-warning-700
          `,
          info: `
            bg-info-50 border-info-500
            text-info-700
          `,
        },
      },
    },

    // États de chargement
    loading: {
      spinner: `
        animate-spin rounded-full
        border-4 border-gray-200
        border-t-primary-600
      `,
      skeleton: `
        animate-pulse bg-gray-200
        rounded
      `,
    },

    // Utilities
    utils: {
      focusRing: 'focus:outline-none focus:ring-2 focus:ring-offset-2',
      transition: 'transition-all duration-200',
    },

    // Tokens de base
    tokens,
  }), []);
};