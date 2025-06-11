import { useState } from 'react';
import { getDoctorDisplayName } from '../config/doctors';
import BACKEND_URL from '../config/api';

const ResetQueueButton = ({ 
  selectedDoctor = null, 
  onResetComplete = () => {}, 
  onError = () => {},
  className = "" 
}) => {
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [showFinalConfirm, setShowFinalConfirm] = useState(false);
  const [isResetting, setIsResetting] = useState(false);
  const [confirmText, setConfirmText] = useState('');

  const doctorName = selectedDoctor ? getDoctorDisplayName(selectedDoctor) : "toutes les files";
  const targetText = selectedDoctor ? `la file de ${doctorName}` : "TOUTE LA FILE D'ATTENTE";
  const requiredText = selectedDoctor ? "SUPPRIMER" : "SUPPRIMER TOUT";

  const handleReset = async () => {
    if (confirmText !== requiredText) {
      onError('Veuillez taper exactement "' + requiredText + '" pour confirmer');
      return;
    }

    setIsResetting(true);
    try {
      const url = selectedDoctor 
        ? `${BACKEND_URL}/queue/reset?docteur=${selectedDoctor}`
        : `${BACKEND_URL}/queue/reset`;
        
      const response = await fetch(url, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        const errorMessage = errorData.message || `Erreur HTTP ${response.status}`;
        throw new Error(errorMessage);
      }

      const result = await response.json();
      
      // Réinitialiser les états
      setShowConfirmModal(false);
      setShowFinalConfirm(false);
      setConfirmText('');
      
      onResetComplete(result);
      
    } catch (error) {
      console.error('Erreur lors de la réinitialisation:', error);
      
      // Messages d'erreur plus spécifiques
      let errorMessage = error.message || 'Erreur lors de la réinitialisation';
      
      if (error.message.includes('404')) {
        errorMessage = 'Endpoint de réinitialisation non trouvé. Vérifiez l\'API.';
      } else if (error.message.includes('401') || error.message.includes('403')) {
        errorMessage = 'Vous n\'avez pas les permissions pour cette action.';
      } else if (error.message.includes('500')) {
        errorMessage = 'Erreur serveur. Veuillez réessayer dans quelques instants.';
      }
      
      onError(errorMessage);
    } finally {
      setIsResetting(false);
    }
  };

  const handleFirstConfirm = () => {
    setShowConfirmModal(false);
    setShowFinalConfirm(true);
  };

  const handleCancel = () => {
    setShowConfirmModal(false);
    setShowFinalConfirm(false);
    setConfirmText('');
  };

  return (
    <>
      {/* Bouton principal */}
      <button
        onClick={() => setShowConfirmModal(true)}
        className={`
          px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg border border-red-700 
          transition-colors duration-200 text-sm font-medium flex items-center space-x-2
          ${isResetting ? 'opacity-50 cursor-not-allowed' : 'hover:scale-105 transform'}
          ${className}
        `}
        disabled={isResetting}
        title={`Réinitialiser ${targetText}`}
      >
        <span>🗑️</span>
        <span className="hidden sm:inline">
          Réinitialiser {selectedDoctor ? "cette file" : "toutes les files"}
        </span>
        <span className="sm:hidden">Reset</span>
      </button>

      {/* Modal de première confirmation */}
      {showConfirmModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-md w-full p-6 shadow-2xl">
            <div className="text-center">
              <div className="text-4xl mb-4">⚠️</div>
              <h3 className="text-lg font-bold text-gray-900 mb-2">
                Attention : Action Irréversible
              </h3>
              <p className="text-gray-600 mb-6">
                Vous êtes sur le point de supprimer <strong>{targetText}</strong>.
                <br /><br />
                Cette action est <strong className="text-red-600">DÉFINITIVE</strong> et 
                supprimera tous les tickets concernés.
              </p>
              
              <div className="flex space-x-3">
                <button
                  onClick={handleCancel}
                  className="flex-1 px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-colors"
                >
                  ❌ Annuler
                </button>
                <button
                  onClick={handleFirstConfirm}
                  className="flex-1 px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white rounded-lg transition-colors"
                >
                  ⚠️ Continuer
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal de confirmation finale */}
      {showFinalConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-md w-full p-6 shadow-2xl border-2 border-red-300">
            <div className="text-center">
              <div className="text-4xl mb-4">🚨</div>
              <h3 className="text-xl font-bold text-red-900 mb-2">
                CONFIRMATION FINALE
              </h3>
              <p className="text-gray-700 mb-4">
                Pour confirmer la suppression de <strong>{targetText}</strong>, 
                tapez exactement :
              </p>
              
              <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4">
                <code className="text-red-800 font-bold text-lg">
                  {requiredText}
                </code>
              </div>
              
              <input
                type="text"
                value={confirmText}
                onChange={(e) => setConfirmText(e.target.value)}
                placeholder={`Tapez "${requiredText}"`}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg mb-4 text-center font-mono"
                autoFocus
              />
              
              <div className="text-xs text-gray-500 mb-6">
                Cette action supprimera définitivement {
                  selectedDoctor 
                    ? `tous les tickets de ${doctorName}` 
                    : "TOUS les tickets de TOUS les docteurs"
                }
              </div>
              
              <div className="flex space-x-3">
                <button
                  onClick={handleCancel}
                  className="flex-1 px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-colors"
                  disabled={isResetting}
                >
                  ❌ Annuler
                </button>
                <button
                  onClick={handleReset}
                  disabled={isResetting || confirmText !== requiredText}
                  className={`
                    flex-1 px-4 py-2 rounded-lg transition-colors font-bold
                    ${confirmText === requiredText && !isResetting
                      ? 'bg-red-600 hover:bg-red-700 text-white' 
                      : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                    }
                  `}
                >
                  {isResetting ? (
                    <span className="flex items-center justify-center space-x-2">
                      <span className="animate-spin">⏳</span>
                      <span>Suppression...</span>
                    </span>
                  ) : (
                    '🗑️ SUPPRIMER DÉFINITIVEMENT'
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default ResetQueueButton; 