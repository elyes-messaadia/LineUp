/**
 * 🎨 Composants Boutons Harmonisés - LineUp
 *
 * Système de boutons cohérent avec le nouveau design
 */

import { forwardRef } from "react";
import Icon from "./Icon";

// Styles utilitaires partagés
const baseClasses = "inline-flex items-center justify-center font-medium rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-60 disabled:cursor-not-allowed";
const sizeClassesMap = {
  xs: "px-2 py-1 text-xs",
  sm: "px-3 py-2 text-sm",
  md: "px-4 py-2 text-base",
  lg: "px-6 py-3 text-lg",
};

// Composant générique Button
const Button = forwardRef(
  (
    {
      children,
      icon,
      iconPosition = "left",
      variant = "primary",
      loading = false,
      size = "md",
      className = "",
      disabled = false,
      ...props
    },
    ref
  ) => {
    const sizeClasses = sizeClassesMap[size] || sizeClassesMap.md;
    const variantClasses = {
      primary:
        "bg-primary-600 text-white hover:bg-primary-700 focus:ring-primary-400",
      secondary:
        "bg-secondary-100 text-secondary-800 hover:bg-secondary-200 focus:ring-secondary-300",
      accent:
        "bg-accent-600 text-white hover:bg-accent-700 focus:ring-accent-400",
      ghost:
        "bg-transparent text-secondary-800 hover:bg-secondary-100 focus:ring-secondary-300",
    }[variant];

    return (
      <button
        ref={ref}
        className={`${baseClasses} ${sizeClasses} ${variantClasses} ${className}`}
        disabled={disabled || loading}
        {...props}
      >
        {loading ? (
          <span className="flex items-center gap-2">
            <span className="inline-block w-4 h-4 border-2 border-white/60 border-t-white rounded-full animate-spin" />
            <span>Chargement…</span>
          </span>
        ) : (
          <span className="flex items-center gap-2">
            {icon && iconPosition === "left" && <Icon name={icon} />}
            <span>{children}</span>
            {icon && iconPosition === "right" && <Icon name={icon} />}
          </span>
        )}
      </button>
    );
  }
);

Button.displayName = "Button";

// Variantes spécialisées
export const PrimaryButton = forwardRef((props, ref) => (
  <Button ref={ref} variant="primary" {...props} />
));
export const SecondaryButton = forwardRef((props, ref) => (
  <Button ref={ref} variant="secondary" {...props} />
));

export default Button;
