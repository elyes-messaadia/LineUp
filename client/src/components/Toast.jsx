import { useEffect, useState } from 'react';

// Composant Toast principal pour gérer une liste de toasts
export default function Toast({ toasts, removeToast }) {
  if (!toasts || toasts.length === 0) return null;

  return (
    <div 
      className="fixed top-4 right-4 z-50 space-y-3 max-w-sm"
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
    const baseStyles = "p-4 rounded-xl accessible-shadow gentle-transition transform senior-friendly-text border-2";
    
    if (!isVisible) {
      return `${baseStyles} translate-x-full opacity-0`;
    }

    switch (type) {
      case 'success':
        return `${baseStyles} bg-green-50 text-green-900 border-green-200`;
      case 'error':
        return `${baseStyles} bg-red-50 text-red-900 border-red-200`;
      case 'warning':
        return `${baseStyles} bg-yellow-50 text-yellow-900 border-yellow-200`;
      case 'important':
        return `${baseStyles} bg-purple-50 text-purple-900 border-purple-300 border-4 shadow-lg ring-2 ring-purple-200 animate-pulse`;
      case 'info':
      default:
        return `${baseStyles} bg-blue-50 text-blue-900 border-blue-200`;
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
      <div className="flex items-start gap-3">
        <span 
          className={`${type === 'important' ? 'text-2xl animate-bounce' : 'text-xl'} flex-shrink-0 mt-1`}
          aria-hidden="true"
        >
          {getIcon()}
        </span>
        <div className="flex-1 min-w-0">
          <p className={`${type === 'important' ? 'font-bold text-lg' : 'font-semibold'} leading-relaxed break-words`}>
            {message}
          </p>
        </div>
        <button
          onClick={() => {
            setIsVisible(false);
            setTimeout(onClose, 300);
          }}
          className="touch-target-large ml-2 text-gray-600 hover:text-gray-800 font-bold text-xl flex-shrink-0 p-1 rounded gentle-transition"
          aria-label="Fermer cette notification"
          title="Fermer cette notification"
        >
          ✕
        </button>
      </div>
    </div>
  );
} 