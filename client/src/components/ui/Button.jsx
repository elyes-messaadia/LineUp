/**
 * 🎨 Composants Boutons Harmonisés - LineUp
 * 
 * Système de boutons cohérent avec le nouveau design
 */

import { forwardRef } from 'react';
import Icon from './Icon';

// 🎯 Bouton Principal
export const PrimaryButton = forwardRef(({ 
  children, 
  icon, 
  loading = false, 
  size = 'md',
  className = '',
  disabled = false,
  ...props 
}, ref) => {
  const sizeClasses = {
    sm: 'px-3 py-2 text-sm',
    md: 'px-4 py-3 text-base',
    lg: 'px-6 py-4 text-lg'
  };

  return (
    <button
      ref={ref}
      className={classes}
      disabled={disabled || loading}
      {...props}
    >
      {loading ? (
        <div className="flex items-center space-x-2">
          <div className={`w-4 h-4 ${theme.loading.spinner}`}></div>
          <span>Chargement...</span>
        </div>
      ) : (
        <div className="flex items-center space-x-2">
          {icon && iconPosition === "left" && <span>{icon}</span>}
          <span>{children}</span>
          {icon && iconPosition === "right" && <span>{icon}</span>}
        </div>
      )}
    </button>
  );
});

Button.displayName = "Button";

export default Button; 