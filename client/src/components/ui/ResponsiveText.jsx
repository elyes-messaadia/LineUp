import { forwardRef } from 'react';
import { useTheme } from '../../theme/useTheme';

const ResponsiveText = forwardRef(({ 
  as: Component = 'p',
  variant = 'body',
  weight = 'normal',
  color,
  children,
  className = '',
  ...props 
}, ref) => {
  const theme = useTheme();
  const { typography } = theme.tokens;
  
  const variants = {
    'h1': `
      ${typography.fontSize['4xl']}
      ${typography.fontWeight.bold}
      ${typography.lineHeight.tight}
      font-heading
    `,
    'h2': `
      ${typography.fontSize['3xl']}
      ${typography.fontWeight.semibold}
      ${typography.lineHeight.tight}
      font-heading
    `,
    'h3': `
      ${typography.fontSize['2xl']}
      ${typography.fontWeight.semibold}
      ${typography.lineHeight.snug}
      font-heading
    `,
    'h4': `
      ${typography.fontSize.xl}
      ${typography.fontWeight.medium}
      ${typography.lineHeight.snug}
      font-heading
    `,
    'body': `
      ${typography.fontSize.base}
      ${typography.lineHeight.normal}
      font-sans
    `,
    'body-large': `
      ${typography.fontSize.lg}
      ${typography.lineHeight.relaxed}
      font-sans
    `,
    'caption': `
      ${typography.fontSize.sm}
      ${typography.lineHeight.normal}
      font-sans
    `,
    'subtitle': `
      ${typography.fontSize.sm}
      ${typography.lineHeight.normal}
      text-secondary-600
      font-sans
    `
  };

  const weightClasses = typography.fontWeight[weight];
  const colorClasses = color ? `text-${color}` : '';
  
  const baseClasses = variants[variant] || variants.body;
  const combinedClasses = `${baseClasses} ${weightClasses} ${colorClasses} ${className}`.trim();

  return (
    <Component ref={ref} className={combinedClasses} {...props}>
      {children}
    </Component>
  );
});

ResponsiveText.displayName = 'ResponsiveText';

export default ResponsiveText; 