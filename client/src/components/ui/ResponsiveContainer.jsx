import { forwardRef } from 'react';
import { useTheme } from '../../theme/useTheme';

const ResponsiveContainer = forwardRef(({ 
  children, 
  className = '', 
  size = 'lg',
  spacing = 'md',
  padding = true,
  ...props 
}, ref) => {
  const theme = useTheme();
  const { spacing: spacingTokens } = theme.tokens;
  
  const sizeClasses = {
    'sm': 'max-w-screen-sm',
    'md': 'max-w-screen-md',
    'lg': 'max-w-screen-lg',
    'xl': 'max-w-screen-xl',
    '2xl': 'max-w-screen-2xl',
  };

  const spacingClasses = {
    'sm': 'space-y-4',
    'md': 'space-y-6',
    'lg': 'space-y-8',
  };

  const paddingClasses = padding ? `
    px-4
    sm:px-${spacingTokens[6]}
    lg:px-${spacingTokens[8]}
  ` : '';

  const baseClasses = `
    ${sizeClasses[size] || sizeClasses.lg}
    mx-auto
    ${spacingClasses[spacing] || spacingClasses.md}
    ${paddingClasses}
  `;

  const combinedClasses = `${baseClasses} ${className}`.trim();

  return (
    <div ref={ref} className={combinedClasses} {...props}>
      {children}
    </div>
  );
});

ResponsiveContainer.displayName = 'ResponsiveContainer';

export default ResponsiveContainer; 