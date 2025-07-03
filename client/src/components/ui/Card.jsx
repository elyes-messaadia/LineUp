const Card = ({ 
  children, 
  className = "", 
  variant = "default",
  hover = false,
  gradient = false,
  ...props 
}) => {
  const baseClasses = "bg-white rounded-xl border transition-all duration-200";
  
  const variantClasses = {
    default: "border-gray-200 shadow-sm",
    elevated: "border-gray-200 shadow-md hover:shadow-lg",
    bordered: "border-2 border-gray-300",
    success: "border-green-200 bg-green-50",
    warning: "border-yellow-200 bg-yellow-50",
    danger: "border-red-200 bg-red-50",
    info: "border-blue-200 bg-blue-50"
  };

  const hoverClasses = hover ? "hover:shadow-lg hover:border-blue-300 hover:-translate-y-1" : "";
  const gradientClasses = gradient ? "bg-gradient-to-br from-white to-blue-50" : "";
  
  const classes = `${baseClasses} ${variantClasses[variant]} ${hoverClasses} ${gradientClasses} ${className}`;

  return (
    <div className={classes} {...props}>
      {children}
    </div>
  );
};

const CardHeader = ({ children, className = "", ...props }) => {
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
  return (
    <div className={`px-6 py-4 border-t border-gray-200 bg-gray-50 rounded-b-xl ${className}`} {...props}>
      {children}
    </div>
  );
};

Card.Header = CardHeader;
Card.Content = CardContent;
Card.Footer = CardFooter;

export default Card; 