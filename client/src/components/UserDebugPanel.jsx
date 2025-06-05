import { useState } from 'react';
import { debugUserData, getDisplayName, cleanupUserData } from '../utils/userUtils';

export default function UserDebugPanel() {
  const [isOpen, setIsOpen] = useState(false);
  const [userData, setUserData] = useState(null);

  const loadUserData = () => {
    const user = cleanupUserData();
    setUserData(user);
    if (user) {
      debugUserData(user);
    }
  };

  const clearUserData = () => {
    localStorage.removeItem('user');
    localStorage.removeItem('token');
    localStorage.removeItem('isAuthenticated');
    setUserData(null);
    console.log('🗑️ Données utilisateur supprimées');
  };

  if (!isOpen) {
    return (
      <button
        onClick={() => {
          setIsOpen(true);
          loadUserData();
        }}
        className="fixed bottom-4 right-4 bg-red-500 text-white p-2 rounded-full shadow-lg z-50 text-xs"
        title="Debug utilisateur"
      >
        🔧
      </button>
    );
  }

  return (
    <div className="fixed bottom-4 right-4 bg-white border-2 border-red-500 rounded-lg p-4 shadow-lg z-50 max-w-sm">
      <div className="flex justify-between items-center mb-3">
        <h3 className="font-bold text-red-700">🔧 Debug Utilisateur</h3>
        <button
          onClick={() => setIsOpen(false)}
          className="text-red-500 hover:text-red-700"
        >
          ✕
        </button>
      </div>

      <div className="space-y-2 text-xs">
        <div>
          <strong>Connecté:</strong> {localStorage.getItem('isAuthenticated') || 'false'}
        </div>
        
        {userData ? (
          <>
            <div>
              <strong>Email:</strong> {userData.email || 'N/A'}
            </div>
            <div>
              <strong>fullName:</strong> {userData.fullName || 'undefined'}
            </div>
            <div>
              <strong>firstName:</strong> {userData.firstName || 'undefined'}
            </div>
            <div>
              <strong>lastName:</strong> {userData.lastName || 'undefined'}
            </div>
            <div>
              <strong>profile.firstName:</strong> {userData.profile?.firstName || 'undefined'}
            </div>
            <div>
              <strong>profile.lastName:</strong> {userData.profile?.lastName || 'undefined'}
            </div>
            <div>
              <strong>Nom affiché:</strong> {getDisplayName(userData)}
            </div>
            <div>
              <strong>Rôle:</strong> {userData.role?.name || 'N/A'}
            </div>
          </>
        ) : (
          <div className="text-gray-500">Aucune donnée utilisateur</div>
        )}
      </div>

      <div className="mt-3 space-y-2">
        <button
          onClick={loadUserData}
          className="w-full bg-blue-500 text-white p-1 rounded text-xs"
        >
          🔄 Recharger
        </button>
        <button
          onClick={clearUserData}
          className="w-full bg-red-500 text-white p-1 rounded text-xs"
        >
          🗑️ Vider cache
        </button>
      </div>
    </div>
  );
} 