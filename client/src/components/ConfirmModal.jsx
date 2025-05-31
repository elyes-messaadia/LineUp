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
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4 shadow-xl">
        <div className="flex items-center gap-3 mb-4">
          <span className="text-2xl">{getIcon()}</span>
          <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
        </div>
        
        <p className="text-gray-600 mb-6">{message}</p>
        
        <div className="flex gap-3 justify-end">
          <button
            onClick={onCancel}
            className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition"
          >
            {cancelText}
          </button>
          <button
            onClick={onConfirm}
            className={`px-4 py-2 rounded-lg transition ${getButtonStyles()}`}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
} 