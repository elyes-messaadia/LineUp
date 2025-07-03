import { forwardRef } from 'react';

const ResponsiveContainer = forwardRef(({ 
  children, 
  className = '', 
  maxWidth = 'max-w-4xl',
  spacing = 'space-y-6 md:space-y-8',
  padding = 'px-4 sm:px-6 lg:px-8',
  ...props 
}, ref) => {
  const baseClasses = `${maxWidth} mx-auto ${spacing} ${padding}`;
  const combinedClasses = `${baseClasses} ${className}`.trim();

  return (
    <div ref={ref} className={combinedClasses} {...props}>
      {children}
    </div>
  );
});

ResponsiveContainer.displayName = 'ResponsiveContainer';

export default ResponsiveContainer; 