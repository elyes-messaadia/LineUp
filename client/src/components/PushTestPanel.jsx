import { useState } from 'react';
import BACKEND_URL from '../config/api';

export default function PushTestPanel() {
  const [isLoading, setIsLoading] = useState(false);
  const [testResult, setTestResult] = useState('');

  const sendTestNotification = async () => {
    setIsLoading(true);
    setTestResult('');

    try {
      const token = localStorage.getItem('token');
      const user = JSON.parse(localStorage.getItem('user') || '{}');

      if (!token || !user._id) {
        setTestResult('Utilisateur non connecté');
        return;
      }

      const response = await fetch(`${BACKEND_URL}/auth/push/send`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          userId: user._id,
          title: 'Test LineUp',
          body: 'Ceci est une notification de test !',
          data: {
            type: 'test',
            timestamp: new Date().toISOString()
          }
        })
      });

      if (response.ok) {
        setTestResult('Notification test envoyée !');
      } else {
        const error = await response.text();
        setTestResult(`Erreur: ${error}`);
      }
    } catch (error) {
      setTestResult(`Erreur: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const testLocalNotification = () => {
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification('Test local', {
        body: 'Notification locale directe',
        icon: '/icon-192x192.png',
        badge: '/icon-192x192.png'
      });
      setTestResult('Notification locale affichée');
    } else {
      setTestResult('Permission manquante pour notification locale');
    }
  };

  if (process.env.NODE_ENV !== 'development') {
    return null;
  }

  return (
    <div className="bg-purple-50 border border-purple-200 rounded-lg p-4 mt-4">
      <h3 className="font-medium text-purple-800 mb-3">Panel de test Push</h3>
      
      <div className="space-y-3">
        <button
          onClick={sendTestNotification}
          disabled={isLoading}
          className="w-full bg-purple-600 text-white px-3 py-2 rounded-lg hover:bg-purple-700 disabled:opacity-50 text-sm"
        >
          {isLoading ? 'Envoi...' : 'Test notification serveur'}
        </button>
        
        <button
          onClick={testLocalNotification}
          className="w-full bg-indigo-600 text-white px-3 py-2 rounded-lg hover:bg-indigo-700 text-sm"
        >
          Test notification locale
        </button>
        
        {testResult && (
          <div className="text-sm p-2 bg-white rounded border">
            {testResult}
          </div>
        )}
      </div>
    </div>
  );
} 