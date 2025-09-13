import { useEffect, useState } from 'react';

// Composant Toast principal pour gérer une liste de toasts
export default function Toast({ toasts, removeToast }) {
  if (!toasts || toasts.length === 0) return null;

  return (
    <div 
      className="fixed 
                 top-safe-top top-3 xs:top-4 
                 left-safe-left left-3 right-safe-right right-3 xs:right-4 
                 se:left-auto se:max-w-sm 
                 z-50 space-y-2 xs:space-y-3 
                 old-device-optimized"
      role="region"
      aria-label="Notifications"
      aria-live="polite"
    >
      {toasts.map((toast) => (
        <ToastItem
          key={toast.id}
          message={toast.message}
          type={toast.type}
          duration={toast.duration}
          onClose={() => removeToast(toast.id)}
        />
      ))}
    </div>
  );
}

// Composant ToastItem individuel
function ToastItem({ message, type = 'info', duration = 3000, onClose }) {
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(false);
      setTimeout(onClose, 300); // Attendre la fin de l'animation
    }, duration);

    return () => clearTimeout(timer);
  }, [duration, onClose]);

  const getToastStyles = () => {
    const baseStyles = "p-4 xs:p-5 rounded-xl shadow-mobile transition-all duration-400 ease-smooth transform legacy-text-secondary border old-android-safe backdrop-blur-sm";
    
    if (!isVisible) {
      return `${baseStyles} se:translate-x-full translate-y-full se:translate-y-0 opacity-0 scale-95`;
    }

    switch (type) {
      case 'success':
        return `${baseStyles} bg-success-50/95 text-success-700 border-success-200 shadow-accessible animate-slide-in-right`;
      case 'error':
        return `${baseStyles} bg-error-50/95 text-error-700 border-error-200 shadow-accessible animate-slide-in-right`;
      case 'warning':
        return `${baseStyles} bg-warning-50/95 text-warning-700 border-warning-200 shadow-accessible animate-slide-in-right`;
      case 'important':
        return `${baseStyles} bg-accent-50/95 text-accent-700 border-accent-300 border-2 shadow-accessible-strong ring-2 ring-accent-200/50 animate-bounce-gentle`;
      case 'info':
      default:
        return `${baseStyles} bg-info-50/95 text-info-700 border-info-200 shadow-accessible animate-slide-in-right`;
    }
  };

  const getIcon = () => {
    switch (type) {
      case 'success':
        return '✅';
      case 'error':
        return '❌';
      case 'warning':
        return '⚠️';
      case 'important':
        return '🔔';
      case 'info':
      default:
        return 'ℹ️';
    }
  };

  const getAriaLabel = () => {
    switch (type) {
      case 'success':
        return `Message de succès: ${message}`;
      case 'error':
        return `Message d'erreur: ${message}`;
      case 'warning':
        return `Avertissement: ${message}`;
      case 'important':
        return `Notification importante: ${message}`;
      case 'info':
      default:
        return `Information: ${message}`;
    }
  };

  const getAriaLive = () => {
    // Les notifications importantes et erreurs sont annoncées immédiatement
    return (type === 'important' || type === 'error') ? 'assertive' : 'polite';
  };

  return (
    <div 
      className={getToastStyles()}
      role="alert"
      aria-label={getAriaLabel()}
      aria-live={getAriaLive()}
    >
      <div className="flex items-start gap-2 xs:gap-3">
        <span 
          className={`${type === 'important' ? 'text-lg xs:text-2xl old-android-safe' : 'text-base xs:text-xl'} flex-shrink-0 mt-1`}
          aria-hidden="true"
        >
          {getIcon()}
        </span>
        <div className="flex-1 min-w-0">
          <p className={`${type === 'important' ? 'legacy-text-primary font-bold' : 'font-semibold'} leading-relaxed break-words`}>
            {message}
          </p>
        </div>
        <button
          onClick={() => {
            setIsVisible(false);
            setTimeout(onClose, 300);
          }}
          className="min-h-touch min-w-touch ml-1 xs:ml-2 text-gray-600 hover:text-gray-800 font-bold text-lg xs:text-xl flex-shrink-0 p-1 rounded transition-colors duration-200"
          aria-label="Fermer cette notification"
          title="Fermer cette notification"
        >
          ✕
        </button>
      </div>
    </div>
  );
} 