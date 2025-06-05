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
      className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center p-6 z-50"
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
      aria-describedby="modal-description"
      aria-label={getAriaLabel()}
    >
      <div 
        ref={modalRef}
        className="bg-white rounded-xl p-6 sm:p-8 max-w-lg w-full accessible-shadow"
      >
        <div className="flex items-center gap-4 mb-6">
          <span 
            className="text-3xl flex-shrink-0" 
            aria-hidden="true"
          >
            {getIcon()}
          </span>
          <h3 
            id="modal-title"
            className="senior-friendly-text font-bold text-gray-900 leading-tight"
          >
            {title}
          </h3>
        </div>
        
        <div 
          id="modal-description"
          className="senior-friendly-text text-gray-700 mb-8 leading-relaxed"
        >
          {message}
        </div>
        
        <div className="flex flex-col sm:flex-row gap-4 sm:justify-end">
          <button
            ref={cancelButtonRef}
            onClick={onCancel}
            className="high-contrast-button touch-target-large bg-gray-100 hover:bg-gray-200 text-gray-800 border-gray-300 gentle-transition order-2 sm:order-1"
            aria-label={`${cancelText} - Fermer cette boîte de dialogue`}
          >
            {cancelText}
          </button>
          <button
            onClick={onConfirm}
            className={`high-contrast-button touch-target-large gentle-transition order-1 sm:order-2 ${getButtonStyles()}`}
            aria-label={`${confirmText} - Confirmer cette action`}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
} 