import { useTheme } from '../../theme/useTheme';

const Card = ({ 
  children, 
  className = "", 
  variant = "default",
  hover = false,
  padding = "md",
  gradient = false,
  ...props 
}) => {
  const theme = useTheme();
  
  const classes = `
    ${theme.card.base}
    ${hover ? theme.card.variants.hover : ""}
    ${theme.card.padding[padding]}
    ${gradient ? "bg-gradient-to-br from-white to-blue-50" : ""}
    ${className}
  `;

  return (
    <div className={classes} {...props}>
      {children}
    </div>
  );
};

const CardHeader = ({ children, className = "", ...props }) => {
  const theme = useTheme();
  return (
    <div className={`px-6 py-4 border-b border-gray-200 ${className}`} {...props}>
      {children}
    </div>
  );
};

const CardContent = ({ children, className = "", ...props }) => {
  return (
    <div className={`px-6 py-4 ${className}`} {...props}>
      {children}
    </div>
  );
};

const CardFooter = ({ children, className = "", ...props }) => {
  const theme = useTheme();
  return (
    <div className={`px-6 py-4 border-t border-gray-200 bg-secondary-50 rounded-b-xl ${className}`} {...props}>
      {children}
    </div>
  );
};

Card.Header = CardHeader;
Card.Content = CardContent;
Card.Footer = CardFooter;

export default Card; 