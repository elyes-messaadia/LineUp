# 📚 Documentation Technique LineUp

## 📋 Table des matières
1. [Frontend](#-frontend)
   - [File d'attente (Queue.jsx)](#file-dattente-queuejsx)
   - [Ticket individuel (Ticket.jsx)](#ticket-individuel-ticketjsx)
   - [Dashboard Médecin (MedecinDashboard.jsx)](#dashboard-médecin-medecindashboardjsx)
   - [Composants réutilisables](#composants-réutilisables)
2. [Backend](#-backend)
   - [Routes API](#routes-api)
   - [Modèles de données](#modèles-de-données)

## 🎨 Frontend

### File d'attente (Queue.jsx)
Le cœur de l'application, gérant l'affichage et les mises à jour en temps réel.

#### Fonctionnalités principales
- Mise à jour temps réel (500ms)
- Notifications sonores et visuelles
- Estimation des temps d'attente
- Interface interactive

#### Exemple de code clé
```jsx
// Gestion des mises à jour en temps réel
useEffect(() => {
  const interval = setInterval(() => {
    fetchQueue();
  }, 500);
  return () => clearInterval(interval);
}, [fetchQueue]);

// Notification sonore
const playNotificationSound = useCallback(() => {
  const audio = new Audio("/notify.mp3");
  audio.volume = 1.0;
  audio.play().catch(() => {});
  
  if ("vibrate" in navigator) {
    navigator.vibrate([300, 100, 300]);
  }
}, []);

// Calcul des estimations
const getCumulativeDelay = (index) => {
  let total = 0;
  for (let i = 0; i < index; i++) {
    if (queue[i].status !== "desiste") {
      total += estimations[i] || 15;
    }
  }
  return total * 60 * 1000; // converti en ms
};

// Rendu d'un ticket dans la file
const renderTicket = (ticket, index) => (
  <div className={`p-4 rounded-xl border ${
    ticket._id === myId ? "bg-yellow-50" : "bg-white"
  }`}>
    <div className="flex items-center justify-between">
      <span className="font-semibold">N°{ticket.number}</span>
      <span className="text-sm text-gray-500">
        {formatWaitingTime(getEstimatedTime(index))}
      </span>
    </div>
  </div>
);
```

### Ticket individuel (Ticket.jsx)
Gestion des tickets individuels avec QR code et options.

#### Fonctionnalités principales
- Affichage du statut
- Génération de QR code
- Options d'annulation/reprise
- Notifications personnalisées

#### Exemple de code clé
```jsx
// Vérification de l'existence du ticket
const verifyTicketExists = async (ticketId) => {
  try {
    const res = await fetch(`${import.meta.env.VITE_API_URL}/ticket/${ticketId}`);
    if (res.ok) {
      return await res.json();
    } else if (res.status === 404) {
      return null;
    }
    throw new Error(`Erreur ${res.status}`);
  } catch (error) {
    console.error("Erreur vérification ticket:", error);
    return false;
  }
};

// Gestion de l'annulation
const handleCancelRequest = async () => {
  if (!ticket) return;
  
  try {
    const res = await fetch(`${import.meta.env.VITE_API_URL}/ticket/${ticket._id}`, {
      method: "DELETE"
    });
    
    if (res.ok) {
      showSuccess("Ticket annulé avec succès");
      localStorage.removeItem("lineup_ticket");
      navigate("/");
    }
  } catch (error) {
    showError("Impossible d'annuler le ticket");
  }
};
```

### Dashboard Médecin (MedecinDashboard.jsx)
Interface de gestion pour les médecins.

#### Fonctionnalités principales
- Appel du prochain patient
- Gestion des consultations
- Vue d'ensemble de la file
- Statistiques en temps réel

#### Exemple de code clé
```jsx
// Appel du prochain patient
const handleCallNext = async () => {
  try {
    const res = await fetch(`${import.meta.env.VITE_API_URL}/next`, {
      method: "DELETE",
      headers: {
        "Authorization": `Bearer ${localStorage.getItem("token")}`
      }
    });

    if (res.ok) {
      const data = await res.json();
      playNotificationSound();
      showSuccess(`Patient n°${data.called.number} appelé !`);
      fetchQueue();
    }
  } catch (error) {
    showError("Impossible d'appeler le patient suivant");
  }
};

// Terminer une consultation
const handleFinishConsultation = async () => {
  if (!currentPatient) return;
  
  try {
    const res = await fetch(
      `${import.meta.env.VITE_API_URL}/ticket/${currentPatient._id}/finish`,
      {
        method: "PATCH",
        headers: {
          "Authorization": `Bearer ${localStorage.getItem("token")}`
        }
      }
    );

    if (res.ok) {
      showSuccess("Consultation terminée !");
      setCurrentPatient(null);
      fetchQueue();
    }
  } catch (error) {
    showError("Impossible de terminer la consultation");
  }
};
```

### Composants réutilisables

#### QRCodeTicket.jsx
Génération et impression de QR codes.

```jsx
// Gestion adaptative mobile/desktop
const handlePrint = () => {
  const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);

  if (isMobile) {
    // Génération d'image téléchargeable
    const qrCodeString = renderToString(
      <QRCodeSVG
        value="https://ligneup.netlify.app"
        size={1024}
        level="H"
        includeMargin={true}
      />
    );
    
    // Conversion en PNG et téléchargement
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    // ... logique de conversion et téléchargement
  } else {
    // Impression classique via iframe
    const iframe = document.createElement('iframe');
    // ... logique d'impression
  }
};
```

#### Toast.jsx
Système de notifications.

```jsx
// Hook personnalisé pour les notifications
export const useToast = () => {
  const [toasts, setToasts] = useState([]);

  const addToast = useCallback((message, type, duration = 3000) => {
    const id = Date.now();
    setToasts(current => [...current, { id, message, type, duration }]);
    
    setTimeout(() => {
      setToasts(current => current.filter(toast => toast.id !== id));
    }, duration);
  }, []);

  return {
    toasts,
    showSuccess: (msg, duration) => addToast(msg, "success", duration),
    showError: (msg, duration) => addToast(msg, "error", duration),
    showWarning: (msg, duration) => addToast(msg, "warning", duration),
    removeToast: (id) => setToasts(current => 
      current.filter(toast => toast.id !== id)
    )
  };
};
```

## 🖥️ Backend

### Routes API

#### Queue Management (`routes/queue.js`)
```javascript
// Route pour obtenir la file d'attente
router.get("/queue", async (req, res) => {
  try {
    const queue = await Ticket.find()
      .sort({ createdAt: 1 })
      .populate("user", "fullName");
    res.json(queue);
  } catch (error) {
    res.status(500).json({ message: "Erreur serveur" });
  }
});

// Route pour appeler le prochain patient
router.delete("/next", authMiddleware, async (req, res) => {
  try {
    const nextTicket = await Ticket.findOne({ status: "en_attente" })
      .sort({ createdAt: 1 });
    
    if (!nextTicket) {
      return res.status(404).json({ message: "Aucun patient en attente" });
    }

    nextTicket.status = "en_consultation";
    await nextTicket.save();

    res.json({ called: nextTicket });
  } catch (error) {
    res.status(500).json({ message: "Erreur serveur" });
  }
});
```

### Modèles de données

#### Ticket Model (`models/Ticket.js`)
```javascript
const ticketSchema = new Schema({
  number: {
    type: Number,
    required: true,
    unique: true
  },
  status: {
    type: String,
    enum: ["en_attente", "en_consultation", "termine", "desiste"],
    default: "en_attente"
  },
  user: {
    type: Schema.Types.ObjectId,
    ref: "User"
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Méthode pour générer un nouveau numéro de ticket
ticketSchema.statics.generateNumber = async function() {
  const lastTicket = await this.findOne().sort("-number");
  return lastTicket ? lastTicket.number + 1 : 1;
};
```

## 🔑 Points clés à retenir

1. **Architecture**
   - Frontend React avec composants modulaires
   - Backend Express avec API RESTful
   - MongoDB pour le stockage persistant

2. **Patterns utilisés**
   - Custom Hooks pour la logique réutilisable
   - Context pour l'état global
   - Middleware pour l'authentification
   - Services pour la logique métier

3. **Bonnes pratiques**
   - Code commenté et organisé
   - Gestion des erreurs robuste
   - Séparation des responsabilités
   - Composants réutilisables 