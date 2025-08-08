import { useState, useEffect } from 'react';

/**
 * Composant pour optimiser l'expérience de chargement
 * Informe l'utilisateur des délais liés au backend gratuit
 */
export default function LoadingOptimizer({ isLoading, hasError, onRetry }) {
  const [loadingTime, setLoadingTime] = useState(0);
  const [showBackendInfo, setShowBackendInfo] = useState(false);

  useEffect(() => {
    if (isLoading) {
      setLoadingTime(0);
      const timer = setInterval(() => {
        setLoadingTime(prev => prev + 1);
      }, 1000);

      // Afficher l'info backend après 5 secondes de chargement
      const backendInfoTimer = setTimeout(() => {
        setShowBackendInfo(true);
      }, 5000);

      return () => {
        clearInterval(timer);
        clearTimeout(backendInfoTimer);
      };
    } else {
      setShowBackendInfo(false);
    }
  }, [isLoading]);

  if (!isLoading && !hasError) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-md mx-4 text-center">
        {isLoading ? (
          <>
            <div className="w-10 h-10 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mb-4 mx-auto"></div>
            <h3 className="text-lg font-semibold text-gray-800 mb-2">
              Chargement en cours...
            </h3>
            <p className="text-gray-600 mb-4">
              {loadingTime} secondes écoulées
            </p>
            
            {showBackendInfo && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 text-left">
                <h4 className="font-semibold text-yellow-800 mb-2">
                  Information technique
                </h4>
                <p className="text-yellow-700 text-sm mb-2">
                  Le serveur se réveille automatiquement après une période d&apos;inactivité.
                  Cela peut prendre jusqu&apos;à <strong>60 secondes</strong>.
                </p>
                <p className="text-yellow-600 text-xs">
                  Ceci est normal avec l&apos;hébergement gratuit Render.
                </p>
              </div>
            )}
          </>
        ) : hasError ? (
          <>
            <div className="w-10 h-10 text-yellow-600 mx-auto mb-4">!</div>
            <h3 className="text-lg font-semibold text-gray-800 mb-2">
              Connexion échouée
            </h3>
            <p className="text-gray-600 mb-4">
              Impossible de contacter le serveur
            </p>
            <button
              onClick={onRetry}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition"
            >
              Réessayer
            </button>
          </>
        ) : null}
      </div>
    </div>
  );
} 