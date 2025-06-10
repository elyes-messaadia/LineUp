import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Layout from "../../components/Layout";
import AnimatedPage from "../../components/AnimatedPage";
import Toast from "../../components/Toast";
import { useToast } from "../../hooks/useToast";
import BACKEND_URL from "../../config/api";

export default function VisiteurDashboard() {
  const [user, setUser] = useState(null);
  const [queue, setQueue] = useState([]);
  const [currentTime, setCurrentTime] = useState(Date.now());
  const [queueLoading, setQueueLoading] = useState(true);
  const navigate = useNavigate();
  const { toasts, showInfo, removeToast } = useToast();

  useEffect(() => {
    const userData = localStorage.getItem("user");
    const isAuthenticated = localStorage.getItem("isAuthenticated");

    if (!userData || !isAuthenticated) {
      navigate("/login");
      return;
    }

    const parsedUser = JSON.parse(userData);
    if (parsedUser.role.name !== "visiteur") {
      navigate("/login");
      return;
    }

    setUser(parsedUser);
    loadQueue();

    // Actualiser toutes les 3 secondes
    const interval = setInterval(() => {
      loadQueue();
      setCurrentTime(Date.now());
    }, 3000);

    return () => clearInterval(interval);
  }, [navigate]);

  const loadQueue = async () => {
    try {
      const res = await fetch(`${BACKEND_URL}/queue`);
      if (res.ok) {
        const data = await res.json();
        setQueue(data);
      }
    } catch (error) {
      console.error("Erreur chargement queue:", error);
    } finally {
      setQueueLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("user");
    localStorage.removeItem("token");
    localStorage.removeItem("isAuthenticated");
    showInfo("Déconnexion réussie");
    navigate("/");
  };

  // Estimation du temps d'attente
  const getEstimatedTime = (position) => {
    const avgConsultationTime = 15; // 15 minutes par consultation
    const totalMinutes = position * avgConsultationTime;
    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;
    
    if (hours > 0) {
      return `${hours}h${minutes.toString().padStart(2, '0')}`;
    }
    return `${minutes} min`;
  };

  const waitingCount = queue.filter(t => t.status === "en_attente").length;
  const inConsultationCount = queue.filter(t => t.status === "en_consultation").length;
  const totalToday = queue.length;
  const completedToday = queue.filter(t => t.status === "termine").length;

  if (!user) {
    return (
      <Layout>
        <AnimatedPage>
          <div className="dashboard-container text-center">
            <div className="animate-spin text-4xl mb-4">⏳</div>
            <p className="text-responsive-base">Chargement...</p>
          </div>
        </AnimatedPage>
      </Layout>
    );
  }

  return (
    <Layout>
      <AnimatedPage>
        <div className="dashboard-container container-safe overflow-protection">
          {/* En-tête du dashboard */}
          <div className="mb-6">
            <h1 className="dashboard-title text-overflow-safe">
              👁️ Vue visiteur - File d'attente en temps réel
            </h1>
            <p className="dashboard-subtitle text-overflow-safe">
              Consultez l'état actuel de la file d'attente sans vous identifier
            </p>
          </div>

          {/* Statistiques générales */}
          <div className="dashboard-section">
            <h2 className="dashboard-section-title text-overflow-safe">Statistiques en temps réel</h2>
            <div className="stats-grid">
              <div className="stats-card">
                <div className="stats-number text-blue-600 text-overflow-safe">{stats.total}</div>
                <div className="stats-label text-overflow-safe">Total patients en file</div>
              </div>
              
              <div className="stats-card">
                <div className="stats-number text-green-600 text-overflow-safe">{stats.enConsultation}</div>
                <div className="stats-label text-overflow-safe">En consultation</div>
              </div>
              
              <div className="stats-card">
                <div className="stats-number text-orange-600 text-overflow-safe">{stats.enAttente}</div>
                <div className="stats-label text-overflow-safe">En attente</div>
              </div>
              
              <div className="stats-card">
                <div className="stats-number text-purple-600 text-overflow-safe">{stats.tempsAttenteMoyen}</div>
                <div className="stats-label text-overflow-safe">Temps d'attente moyen</div>
              </div>
            </div>
          </div>

          {/* Analyse de la journée */}
          <div className="dashboard-section">
            <h2 className="dashboard-section-title text-overflow-safe">Analyse de la journée</h2>
            <div className="info-grid">
              <div className="stats-card">
                <div className="stats-number text-indigo-600 text-overflow-safe">{analyseDuJour.tauxOccupation}%</div>
                <div className="stats-label text-overflow-safe">Taux d'occupation</div>
              </div>
              
              <div className="stats-card">
                <div className="stats-number text-teal-600 text-overflow-safe">{analyseDuJour.patientsTraites}</div>
                <div className="stats-label text-overflow-safe">Patients traités</div>
              </div>
              
              <div className="stats-card">
                <div className="stats-number text-rose-600 text-overflow-safe">{analyseDuJour.consultationLaPlusLongue}</div>
                <div className="stats-label text-overflow-safe">Consultation la plus longue</div>
              </div>
            </div>
          </div>

          {/* File d'attente détaillée */}
          <div className="dashboard-section">
            <h2 className="dashboard-section-title text-overflow-safe">File d'attente actuelle</h2>
            
            {loading ? (
              <div className="dashboard-card text-center">
                <div className="text-4xl mb-4">⏳</div>
                <p className="text-responsive-base text-gray-600 text-overflow-safe">
                  Chargement des données en cours...
                </p>
              </div>
            ) : tickets.length > 0 ? (
              <div className="dashboard-grid">
                {tickets.map((ticket, index) => (
                  <div key={ticket.id} className="ticket-card">
                    <div className="flex justify-between items-start mb-3">
                      <div className="flex-1 min-w-0">
                        <h3 className="text-responsive-lg font-semibold text-overflow-safe">
                          Position #{index + 1}
                        </h3>
                        <p className="text-responsive-base text-gray-600 text-overflow-safe">
                          Ticket #{ticket.numero}
                        </p>
                      </div>
                      <div className="ml-4 flex-shrink-0">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium text-overflow-safe ${
                          ticket.status === 'appelé' ? 'bg-green-100 text-green-800' :
                          ticket.status === 'en_cours' ? 'bg-blue-100 text-blue-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {getStatusDisplay(ticket.status)}
                        </span>
                      </div>
                    </div>
                    
                    <div className="info-grid">
                      <div>
                        <p className="text-responsive-sm text-gray-500 text-overflow-safe">Docteur</p>
                        <p className="text-responsive-base font-medium text-overflow-safe">
                          Dr. {ticket.docteurNom}
                        </p>
                      </div>
                      <div>
                        <p className="text-responsive-sm text-gray-500 text-overflow-safe">Cabinet</p>
                        <p className="text-responsive-base font-medium text-overflow-safe">
                          {ticket.cabinetNom}
                        </p>
                      </div>
                      <div>
                        <p className="text-responsive-sm text-gray-500 text-overflow-safe">Temps d'attente</p>
                        <p className="text-responsive-base font-medium text-overflow-safe">
                          {ticket.tempsAttenteActuel || 'Calcul...'}
                        </p>
                      </div>
                      <div>
                        <p className="text-responsive-sm text-gray-500 text-overflow-safe">Heure création</p>
                        <p className="text-responsive-base font-medium text-overflow-safe">
                          {new Date(ticket.heureCreation).toLocaleTimeString('fr-FR', {
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </p>
                      </div>
                    </div>
                    
                    {/* Indicateur visuel pour les tickets prioritaires */}
                    {ticket.priorite && (
                      <div className="mt-2 p-2 bg-red-50 border-l-4 border-red-400 rounded">
                        <p className="text-responsive-sm text-red-700 text-overflow-safe">
                          🚨 Prioritaire : {ticket.priorite}
                        </p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="dashboard-card text-center">
                <div className="text-4xl mb-4">📭</div>
                <h3 className="text-responsive-lg font-semibold text-gray-800 mb-2 text-overflow-safe">
                  Aucun patient en attente
                </h3>
                <p className="text-responsive-base text-gray-600 text-overflow-safe">
                  La file d'attente est actuellement vide.
                </p>
              </div>
            )}
          </div>

          {/* Actions rapides */}
          <div className="dashboard-section">
            <h2 className="dashboard-section-title text-overflow-safe">Actions rapides</h2>
            <div className="actions-grid">
              <button
                onClick={rafraichirDonnees}
                disabled={loading}
                className="action-button action-button-primary text-overflow-safe"
              >
                {loading ? 'Actualisation...' : '🔄 Actualiser les données'}
              </button>
              
              <button
                onClick={() => setShowFiltreDocteurModal(true)}
                className="action-button action-button-secondary text-overflow-safe"
              >
                🔍 Filtrer par docteur
              </button>
              
              <button
                onClick={() => setShowStatistiquesModal(true)}
                className="action-button action-button-secondary text-overflow-safe"
              >
                📊 Statistiques détaillées
              </button>
              
              <button
                onClick={() => navigate('/')}
                className="action-button action-button-secondary text-overflow-safe"
              >
                🏠 Retour à l'accueil
              </button>
            </div>
          </div>

          {/* Aide contextuelle */}
          <div className="dashboard-section">
            <div className="help-text">
              <h3 className="text-responsive-lg font-semibold mb-2 text-overflow-safe">
                💡 À propos de cette vue
              </h3>
              <ul className="text-responsive-sm space-y-1 text-overflow-safe">
                <li>• Les données se mettent à jour automatiquement toutes les 30 secondes</li>
                <li>• Les positions peuvent changer selon les priorités médicales</li>
                <li>• Cette vue est disponible sans connexion pour informer les visiteurs</li>
                <li>• Pour prendre un ticket, vous devez vous connecter en tant que patient</li>
              </ul>
            </div>
          </div>

          {/* Message d'erreur */}
          {erreur && (
            <div className="alert-card bg-red-50 border-l-4 border-red-400 text-overflow-safe">
              <div className="p-1">
                <p className="text-responsive-base text-red-800 text-overflow-safe">
                  ❌ {erreur}
                </p>
              </div>
            </div>
          )}

          {/* Modal filtre par docteur */}
          {showFiltreDocteurModal && (
            <div className="modal-overlay-fullscreen animate-overlay">
              <div className="modal-responsive animate-in bg-white p-6 rounded-lg shadow-xl">
                <h2 className="dashboard-title mb-4 text-overflow-safe">Filtrer par docteur</h2>
                <div className="space-y-4">
                  <div>
                    <label className="block text-responsive-base font-medium text-gray-700 mb-2 text-overflow-safe">
                      Sélectionner un docteur
                    </label>
                    <select
                      value={filtreDocteur}
                      onChange={(e) => setFiltreDocteur(e.target.value)}
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-overflow-safe"
                    >
                      <option value="">-- Tous les docteurs --</option>
                      {docteurs.map(docteur => (
                        <option key={docteur.id} value={docteur.id} className="text-overflow-safe">
                          Dr. {docteur.nom} {docteur.prenom} - {docteur.specialite}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="actions-grid">
                    <button
                      onClick={() => {
                        appliquerFiltre();
                        setShowFiltreDocteurModal(false);
                      }}
                      className="action-button action-button-primary text-overflow-safe"
                    >
                      ✅ Appliquer le filtre
                    </button>
                    <button
                      onClick={() => setShowFiltreDocteurModal(false)}
                      className="action-button action-button-secondary text-overflow-safe"
                    >
                      ❌ Annuler
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Modal statistiques détaillées */}
          {showStatistiquesModal && (
            <div className="modal-overlay-fullscreen animate-overlay">
              <div className="modal-responsive animate-in bg-white p-6 rounded-lg shadow-xl max-w-4xl">
                <h2 className="dashboard-title mb-4 text-overflow-safe">Statistiques détaillées</h2>
                <div className="space-y-6">
                  <div>
                    <h3 className="dashboard-section-title text-overflow-safe">Répartition par docteur</h3>
                    <div className="stats-grid">
                      {statistiquesDetailees.parDocteur.map((stat, index) => (
                        <div key={index} className="stats-card">
                          <div className="stats-number text-overflow-safe">{stat.nombrePatients}</div>
                          <div className="stats-label text-overflow-safe">
                            Dr. {stat.docteurNom}
                          </div>
                          <p className="text-responsive-sm text-gray-500 mt-1 text-overflow-safe">
                            Temps moyen: {stat.tempsMoyen}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div>
                    <h3 className="dashboard-section-title text-overflow-safe">Tendances horaires</h3>
                    <div className="info-grid">
                      <div className="stats-card">
                        <div className="stats-number text-orange-600 text-overflow-safe">
                          {statistiquesDetailees.creteAfflux.heure}
                        </div>
                        <div className="stats-label text-overflow-safe">Heure de pointe</div>
                      </div>
                      <div className="stats-card">
                        <div className="stats-number text-green-600 text-overflow-safe">
                          {statistiquesDetailees.creteAfflux.nombre}
                        </div>
                        <div className="stats-label text-overflow-safe">Patients à cette heure</div>
                      </div>
                      <div className="stats-card">
                        <div className="stats-number text-blue-600 text-overflow-safe">
                          {statistiquesDetailees.periodeCalme.debut}-{statistiquesDetailees.periodeCalme.fin}
                        </div>
                        <div className="stats-label text-overflow-safe">Période la plus calme</div>
                      </div>
                    </div>
                  </div>

                  <div className="pt-4 border-t">
                    <button
                      onClick={() => setShowStatistiquesModal(false)}
                      className="action-button action-button-secondary w-full text-overflow-safe"
                    >
                      ✅ Fermer
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </AnimatedPage>
    </Layout>
  );
} 