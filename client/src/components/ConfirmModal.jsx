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
  if (!isOpen) return null;

  const getButtonStyles = () => {
    switch (type) {
      case 'danger':
        return "bg-red-600 hover:bg-red-700 text-white";
      case 'info':
        return "bg-blue-600 hover:bg-blue-700 text-white";
      case 'warning':
      default:
        return "bg-yellow-600 hover:bg-yellow-700 text-white";
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

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg p-4 sm:p-6 max-w-sm sm:max-w-md w-full shadow-xl">
        <div className="flex items-center gap-2 sm:gap-3 mb-3 sm:mb-4">
          <span className="text-xl sm:text-2xl">{getIcon()}</span>
          <h3 className="text-base sm:text-lg font-semibold text-gray-900 leading-tight">{title}</h3>
        </div>
        
        <div className="text-sm sm:text-base text-gray-600 mb-4 sm:mb-6 leading-relaxed">
          {message}
        </div>
        
        <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 sm:justify-end">
          <button
            onClick={onCancel}
            className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition text-sm sm:text-base order-2 sm:order-1"
          >
            {cancelText}
          </button>
          <button
            onClick={onConfirm}
            className={`px-4 py-2 rounded-lg transition text-sm sm:text-base order-1 sm:order-2 ${getButtonStyles()}`}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
} 