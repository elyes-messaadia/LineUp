import { useEffect, useState } from 'react';

export default function Toast({ message, type = 'info', duration = 3000, onClose }) {
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(false);
      setTimeout(onClose, 300); // Attendre la fin de l'animation
    }, duration);

    return () => clearTimeout(timer);
  }, [duration, onClose]);

  const getToastStyles = () => {
    const baseStyles = "fixed top-4 right-4 z-50 p-4 rounded-lg shadow-lg transition-all duration-300 transform";
    
    if (!isVisible) {
      return `${baseStyles} translate-x-full opacity-0`;
    }

    switch (type) {
      case 'success':
        return `${baseStyles} bg-green-500 text-white`;
      case 'error':
        return `${baseStyles} bg-red-500 text-white`;
      case 'warning':
        return `${baseStyles} bg-yellow-500 text-white`;
      case 'info':
      default:
        return `${baseStyles} bg-blue-500 text-white`;
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
      case 'info':
      default:
        return 'ℹ️';
    }
  };

  return (
    <div className={getToastStyles()}>
      <div className="flex items-center gap-2">
        <span className="text-lg">{getIcon()}</span>
        <span className="font-medium">{message}</span>
        <button
          onClick={() => {
            setIsVisible(false);
            setTimeout(onClose, 300);
          }}
          className="ml-2 text-white hover:text-gray-200 font-bold"
        >
          ×
        </button>
      </div>
    </div>
  );
} 