import { useState, useEffect } from 'react';

const VAPID_PUBLIC_KEY = 'BK8VJuX8z0P_6G4j6V_OP7Qp1M_1F5t6H5RQP_T6v4I3G5C2c9m1M8tQ4L5F6n7K8J9O0I1U2Y3T4R5E6W7Q8A9';

export const usePushNotifications = () => {
  const [isSupported, setIsSupported] = useState(false);
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [subscription, setSubscription] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    // Vérifier le support des notifications push
    const checkSupport = () => {
      const supported = 'serviceWorker' in navigator && 
                       'PushManager' in window && 
                       'Notification' in window;
      setIsSupported(supported);
    };

    // Vérifier l'abonnement existant
    const checkExistingSubscription = async () => {
      if (!isSupported) return;

      try {
        const registration = await navigator.serviceWorker.ready;
        const existingSubscription = await registration.pushManager.getSubscription();
        
        if (existingSubscription) {
          setSubscription(existingSubscription);
          setIsSubscribed(true);
        }
      } catch (error) {
        console.error('❌ Erreur lors de la vérification de l\'abonnement:', error);
      }
    };

    checkSupport();
    if (isSupported) {
      checkExistingSubscription();
    }
  }, [isSupported]);

  // Convertir la clé VAPID en Uint8Array
  const urlBase64ToUint8Array = (base64String) => {
    const padding = '='.repeat((4 - base64String.length % 4) % 4);
    const base64 = (base64String + padding)
      .replace(/-/g, '+')
      .replace(/_/g, '/');

    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);

    for (let i = 0; i < rawData.length; ++i) {
      outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
  };

  // S'abonner aux notifications
  const subscribe = async () => {
    if (!isSupported) {
      throw new Error('Les notifications push ne sont pas supportées');
    }

    setIsLoading(true);
    try {
      // Demander la permission
      const permission = await Notification.requestPermission();
      if (permission !== 'granted') {
        throw new Error('Permission refusée pour les notifications');
      }

      // Obtenir le service worker
      const registration = await navigator.serviceWorker.ready;
      
      // Créer l'abonnement
      const newSubscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY)
      });

      // Envoyer l'abonnement au serveur
      const token = localStorage.getItem('token');
      const response = await fetch('/auth/push/subscribe', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          subscription: newSubscription.toJSON()
        })
      });

      if (!response.ok) {
        throw new Error('Erreur lors de l\'enregistrement sur le serveur');
      }

      setSubscription(newSubscription);
      setIsSubscribed(true);
      
      return { success: true, message: 'Notifications activées avec succès!' };
    } catch (error) {
      console.error('❌ Erreur lors de l\'abonnement:', error);
      return { success: false, message: error.message };
    } finally {
      setIsLoading(false);
    }
  };

  // Se désabonner des notifications
  const unsubscribe = async () => {
    if (!subscription) return;

    setIsLoading(true);
    try {
      // Désabonner côté client
      await subscription.unsubscribe();
      
      // Désabonner côté serveur
      const token = localStorage.getItem('token');
      const response = await fetch('/auth/push/unsubscribe', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        throw new Error('Erreur lors du désabonnement sur le serveur');
      }

      setSubscription(null);
      setIsSubscribed(false);
      
      return { success: true, message: 'Notifications désactivées' };
    } catch (error) {
      console.error('❌ Erreur lors du désabonnement:', error);
      return { success: false, message: error.message };
    } finally {
      setIsLoading(false);
    }
  };

  return {
    isSupported,
    isSubscribed,
    isLoading,
    subscribe,
    unsubscribe
  };
}; 