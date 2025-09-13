/**
 * 🎪 Composants d'États UX - LineUp
 *
 * Composants pour améliorer l'expérience utilisateur
 */

import Icon from "./Icon";

// 🌀 Composant de Chargement (Skeleton)
export const LoadingSkeleton = ({
  lines = 3,
  className = "",
  animated = true,
}) => {
  return (
    <div className={`space-y-3 ${className}`}>
      {Array.from({ length: lines }).map((_, index) => (
        <div key={index} className="space-y-2">
          <div
            className={`h-4 bg-secondary-200 rounded-lg ${
              animated ? "animate-pulse" : ""
            }`}
          />
          {index === lines - 1 && (
            <div
              className={`h-4 bg-secondary-200 rounded-lg w-2/3 ${
                animated ? "animate-pulse" : ""
              }`}
            />
          )}
        </div>
      ))}
    </div>
  );
};

// 🎯 Indicateur de Chargement avec Icône
export const LoadingSpinner = ({ size = "md", text = "", className = "" }) => {
  const sizes = {
    sm: "h-4 w-4",
    md: "h-6 w-6",
    lg: "h-8 w-8",
    xl: "h-12 w-12",
  };

  return (
    <div
      className={`flex flex-col items-center justify-center gap-3 ${className}`}
    >
      <div
        className={`
        ${sizes[size]} 
        border-3 border-primary-200 border-t-primary-500 
        rounded-full animate-spin
      `}
      />
      {text && (
        <p className="text-secondary-600 text-sm font-medium animate-pulse">
          {text}
        </p>
      )}
    </div>
  );
};

// 📭 État Vide
export const EmptyState = ({
  icon,
  title,
  description,
  action,
  className = "",
}) => {
  return (
    <div className={`text-center py-12 animate-fade-in ${className}`}>
      <div className="text-6xl mb-4">
        <Icon name={icon} size="3xl" />
      </div>
      <h3 className="text-secondary-700 font-semibold mb-2 text-lg">{title}</h3>
      <p className="text-secondary-500 mb-6 max-w-sm mx-auto">{description}</p>
      {action && <div className="animate-slide-up">{action}</div>}
    </div>
  );
};

// ✨ Feedback de Succès
export const SuccessFeedback = ({
  message,
  onClose,
  autoClose = true,
  duration = 3000,
}) => {
  if (autoClose) {
    setTimeout(() => {
      onClose && onClose();
    }, duration);
  }

  return (
    <div
      className="
      fixed top-4 right-4 z-50
      bg-success-50/95 text-success-700 
      border border-success-200
      px-4 py-3 rounded-lg shadow-accessible
      backdrop-blur-sm animate-bounce-gentle
      max-w-sm
    "
    >
      <div className="flex items-center gap-2">
        <Icon name="success" className="text-success-500" />
        <span className="font-medium">{message}</span>
        {onClose && (
          <button
            onClick={onClose}
            className="ml-2 text-success-500 hover:text-success-700 
                       transition-colors duration-200"
          >
            <Icon name="close" size="sm" />
          </button>
        )}
      </div>
    </div>
  );
};

// 🚨 Feedback d'Erreur
export const ErrorFeedback = ({
  message,
  onClose,
  onRetry,
  autoClose = false,
}) => {
  return (
    <div
      className="
      fixed top-4 right-4 z-50
      bg-error-50/95 text-error-700 
      border border-error-200
      px-4 py-3 rounded-lg shadow-accessible-strong
      backdrop-blur-sm animate-slide-in-right
      max-w-sm
    "
    >
      <div className="flex items-start gap-2">
        <Icon name="error" className="text-error-500 mt-0.5" />
        <div className="flex-1">
          <p className="font-medium">{message}</p>
          {onRetry && (
            <button
              onClick={onRetry}
              className="mt-2 text-sm underline hover:no-underline
                         transition-all duration-200"
            >
              Réessayer
            </button>
          )}
        </div>
        {onClose && (
          <button
            onClick={onClose}
            className="ml-2 text-error-500 hover:text-error-700 
                       transition-colors duration-200"
          >
            <Icon name="close" size="sm" />
          </button>
        )}
      </div>
    </div>
  );
};

// 🎭 Composant de Transition de Page
export const PageTransition = ({ children, className = "" }) => {
  return <div className={`animate-slide-up ${className}`}>{children}</div>;
};

// 🎯 Badge de Statut
export const StatusBadge = ({
  status,
  label,
  size = "md",
  animated = false,
}) => {
  const statusConfig = {
    en_attente: {
      bg: "bg-info-100",
      text: "text-info-700",
      border: "border-info-200",
      icon: "pending",
    },
    en_consultation: {
      bg: "bg-success-100",
      text: "text-success-700",
      border: "border-success-200",
      icon: "inProgress",
    },
    termine: {
      bg: "bg-secondary-100",
      text: "text-secondary-700",
      border: "border-secondary-200",
      icon: "completed",
    },
    desiste: {
      bg: "bg-error-100",
      text: "text-error-700",
      border: "border-error-200",
      icon: "cancelled",
    },
    urgent: {
      bg: "bg-warning-100",
      text: "text-warning-700",
      border: "border-warning-200",
      icon: "emergency",
    },
  };

  const sizes = {
    sm: "px-2 py-1 text-xs",
    md: "px-3 py-1.5 text-sm",
    lg: "px-4 py-2 text-base",
  };

  const config = statusConfig[status] || statusConfig["en_attente"];

  return (
    <span
      className={`
      inline-flex items-center gap-1.5
      ${sizes[size]}
      ${config.bg} ${config.text}
      border ${config.border}
      rounded-full font-medium
      ${animated ? "animate-pulse" : ""}
      transition-all duration-300
    `}
    >
      <Icon name={config.icon} size="xs" />
      {label || status}
    </span>
  );
};

// 🎪 Composant de Carte Interactive
export const InteractiveCard = ({
  children,
  onClick,
  hover = true,
  className = "",
  ...props
}) => {
  return (
    <div
      className={`
        p-6 bg-white/95 backdrop-blur-sm
        rounded-xl shadow-mobile border border-secondary-200
        transition-all duration-400 ease-smooth
        ${
          hover
            ? "hover:shadow-accessible hover:scale-[1.02] cursor-pointer"
            : ""
        }
        ${onClick ? "active:scale-[0.98]" : ""}
        animate-fade-in
        ${className}
      `}
      onClick={onClick}
      {...props}
    >
      {children}
    </div>
  );
};

// 🌟 Export de tous les composants
export default {
  LoadingSkeleton,
  LoadingSpinner,
  EmptyState,
  SuccessFeedback,
  ErrorFeedback,
  PageTransition,
  StatusBadge,
  InteractiveCard,
};
