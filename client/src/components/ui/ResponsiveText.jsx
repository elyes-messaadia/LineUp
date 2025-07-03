import { forwardRef } from 'react';

const ResponsiveText = forwardRef(({ 
  as: Component = 'p',
  variant = 'body',
  children,
  className = '',
  ...props 
}, ref) => {
  
  const variants = {
    'h1': 'text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold',
    'h2': 'text-xl sm:text-2xl md:text-3xl lg:text-4xl font-semibold',
    'h3': 'text-lg sm:text-xl md:text-2xl lg:text-3xl font-semibold',
    'h4': 'text-base sm:text-lg md:text-xl lg:text-2xl font-medium',
    'body': 'text-sm sm:text-base md:text-lg',
    'body-large': 'text-base sm:text-lg md:text-xl',
    'caption': 'text-xs sm:text-sm md:text-base',
    'subtitle': 'text-sm sm:text-base md:text-lg text-gray-600'
  };

  const baseClasses = variants[variant] || variants.body;
  const combinedClasses = `${baseClasses} ${className}`.trim();

  return (
    <Component ref={ref} className={combinedClasses} {...props}>
      {children}
    </Component>
  );
});

ResponsiveText.displayName = 'ResponsiveText';

export default ResponsiveText; 