import { useEffect, useRef } from 'react';

export default function ConfirmModal({ 
  isOpen, 
  title, 
  message, 
  confirmText = "Confirmer", 
  cancelText = "Annuler", 
  onConfirm, 
  onCancel,
  type = "warning" // warning, danger, info
}) {
  const cancelButtonRef = useRef(null);
  const modalRef = useRef(null);
  const overlayRef = useRef(null);

  // Focus management et navigation clavier
  useEffect(() => {
    if (isOpen) {
      // Focus sur le bouton d'annulation par défaut (plus sûr)
      setTimeout(() => {
        if (cancelButtonRef.current) {
          cancelButtonRef.current.focus();
        }
      }, 100);

      // Gestion de la touche Escape
      const handleEscape = (e) => {
        if (e.key === 'Escape') {
          onCancel();
        }
      };

      // Piéger le focus dans la modal
      const handleTabKey = (e) => {
        if (e.key === 'Tab') {
          const focusableElements = modalRef.current?.querySelectorAll(
            'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
          );
          
          if (focusableElements?.length) {
            const firstElement = focusableElements[0];
            const lastElement = focusableElements[focusableElements.length - 1];

            if (e.shiftKey) {
              if (document.activeElement === firstElement) {
                e.preventDefault();
                lastElement.focus();
              }
            } else {
              if (document.activeElement === lastElement) {
                e.preventDefault();
                firstElement.focus();
              }
            }
          }
        }
      };

      document.addEventListener('keydown', handleEscape);
      document.addEventListener('keydown', handleTabKey);
      
      return () => {
        document.removeEventListener('keydown', handleEscape);
        document.removeEventListener('keydown', handleTabKey);
      };
    }
  }, [isOpen, onCancel]);

  // Gestion du clic à l'extérieur de la modal
  const handleOverlayClick = (e) => {
    if (e.target === overlayRef.current) {
      onCancel();
    }
  };

  if (!isOpen) return null;

  const getButtonStyles = () => {
    switch (type) {
      case 'danger':
        return "bg-red-600 hover:bg-red-700 text-white border-red-600";
      case 'info':
        return "bg-blue-600 hover:bg-blue-700 text-white border-blue-600";
      case 'warning':
      default:
        return "bg-yellow-600 hover:bg-yellow-700 text-white border-yellow-600";
    }
  };

  const getIcon = () => {
    switch (type) {
      case 'danger':
        return "🚨";
      case 'info':
        return "ℹ️";
      case 'warning':
      default:
        return "⚠️";
    }
  };

  const getAriaLabel = () => {
    switch (type) {
      case 'danger':
        return "Boîte de dialogue d'alerte critique";
      case 'info':
        return "Boîte de dialogue d'information";
      case 'warning':
      default:
        return "Boîte de dialogue d'avertissement";
    }
  };

  return (
    <div 
      ref={overlayRef}
      onClick={handleOverlayClick}
      className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center 
                 p-3 xs:p-4 se:p-6 z-50 old-device-optimized"
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
      aria-describedby="modal-description"
      aria-label={getAriaLabel()}
    >
      <div 
        ref={modalRef}
        className="bg-white rounded-lg se:rounded-xl 
                   legacy-modal
                   p-4 xs:p-5 se:p-6 sm:p-8 
                   max-w-xs xs:max-w-sm se:max-w-md lg:max-w-lg 
                   w-full accessible-shadow relative"
      >
        {/* Bouton de fermeture (croix) */}
        <button
          onClick={onCancel}
          className="absolute top-3 right-3 p-2 text-gray-400 hover:text-gray-600 
                     transition-colors duration-200 rounded-full hover:bg-gray-100
                     focus:outline-none focus:ring-2 focus:ring-gray-300"
          aria-label="Fermer la fenêtre"
          title="Fermer"
        >
          <svg
            className="w-5 h-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        </button>

        <div className="flex items-center gap-3 xs:gap-4 mb-4 xs:mb-6 pr-8">
          <span 
            className="text-2xl xs:text-3xl flex-shrink-0" 
            aria-hidden="true"
          >
            {getIcon()}
          </span>
          <h3 
            id="modal-title"
            className="legacy-text-primary font-bold text-gray-900 leading-tight"
          >
            {title}
          </h3>
        </div>
        
        <div 
          id="modal-description"
          className="legacy-text-secondary text-gray-700 mb-6 xs:mb-8 leading-relaxed"
        >
          {message}
        </div>
        
        <div className="flex flex-col se:flex-row gap-3 xs:gap-4 se:justify-end">
          <button
            ref={cancelButtonRef}
            onClick={onCancel}
            className="legacy-button bg-gray-100 hover:bg-gray-200 text-gray-800 border-gray-300 
                       transition-colors duration-200 order-2 se:order-1"
            aria-label={`${cancelText} - Fermer cette boîte de dialogue`}
          >
            {cancelText}
          </button>
          <button
            onClick={onConfirm}
            className={`legacy-button transition-colors duration-200 order-1 se:order-2 ${getButtonStyles()}`}
            aria-label={`${confirmText} - Confirmer cette action`}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
} 