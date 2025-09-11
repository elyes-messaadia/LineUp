import { forwardRef } from 'react';
import { useTheme } from '../../theme/useTheme';

const Button = forwardRef(({ 
  children, 
  variant = "primary", 
  size = "md", 
  className = "", 
  disabled = false,
  loading = false,
  icon,
  iconPosition = "left",
  fullWidth = false,
  ...props 
}, ref) => {
  const theme = useTheme();
  
  const classes = `${theme.button.base} ${theme.button.variants[variant]} ${theme.button.sizes[size]} ${fullWidth ? "w-full" : ""} ${className}`;

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