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
  const { layout, spacing: spacingTokens } = theme.tokens;
  
  const sizeClasses = {
    'sm': layout.container.maxWidth.sm,
    'md': layout.container.maxWidth.md,
    'lg': layout.container.maxWidth.lg,
    'xl': layout.container.maxWidth.xl,
    '2xl': layout.container.maxWidth['2xl'],
  };

  const spacingClasses = {
    'sm': `space-y-${spacingTokens[4]}`,
    'md': `space-y-${spacingTokens[6]}`,
    'lg': `space-y-${spacingTokens[8]}`,
  };

  const paddingClasses = padding ? `
    px-${spacingTokens[4]}
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