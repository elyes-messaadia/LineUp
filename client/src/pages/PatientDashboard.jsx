import React, { useState, useEffect } from "react";
import ChatWidget from "../components/ChatWidget";
import UrgencyIndicator from "../components/UrgencyIndicator";
import { User, MapPin, Clock, Phone } from "lucide-react";

const PatientDashboard = () => {
  const [patient, setPatient] = useState(null);
  const [currentTicket, setCurrentTicket] = useState(null);
  const [urgencyLevel, setUrgencyLevel] = useState(null);
  const [urgencyAssessment, setUrgencyAssessment] = useState(null);

  useEffect(() => {
    // Simuler le chargement des données patient
    const loadPatientData = async () => {
      try {
        const token = localStorage.getItem("token");

        // Récupérer les informations du patient
        const patientResponse = await fetch("/auth/verify", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        const patientData = await patientResponse.json();

        if (patientData.success) {
          setPatient(patientData.user);
        }

        // Récupérer le ticket actuel si il existe
        const ticketsResponse = await fetch("/tickets/my-tickets", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        const ticketsData = await ticketsResponse.json();

        if (ticketsData.success && ticketsData.tickets.length > 0) {
          const activeTicket = ticketsData.tickets.find((ticket) =>
            ["en-attente", "en-cours"].includes(ticket.statut)
          );
          setCurrentTicket(activeTicket);
        }
      } catch (error) {
        console.error("Erreur lors du chargement des données:", error);
      }
    };

    loadPatientData();
  }, []);

  const handleUrgencyChange = (level, assessment) => {
    setUrgencyLevel(level);
    setUrgencyAssessment(assessment);

    // Ici vous pourriez déclencher des notifications ou d'autres actions
    // basées sur le niveau d'urgence
    if (level >= 8) {
      // Déclencher une alerte pour l'équipe médicale
      console.log("🚨 Urgence élevée détectée!");
    }
  };

  const getEstimatedWaitTime = () => {
    if (!currentTicket) return null;

    // Calcul basé sur la position et le niveau d'urgence
    const baseWaitMinutes = currentTicket.position * 15; // 15 min par patient en moyenne
    const urgencyMultiplier = urgencyLevel
      ? Math.max(0.3, (10 - urgencyLevel) / 10)
      : 1;

    return Math.round(baseWaitMinutes * urgencyMultiplier);
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header avec informations patient */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
          <div className="flex items-start justify-between">
            <div className="flex items-center space-x-4">
              <div className="bg-blue-100 rounded-full p-3">
                <User className="h-8 w-8 text-blue-600" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">
                  Bonjour {patient?.name || "Patient"}
                </h1>
                <p className="text-gray-600">Tableau de bord patient</p>
              </div>
            </div>

            {urgencyLevel && (
              <div className="w-72">
                <UrgencyIndicator
                  urgencyLevel={urgencyLevel}
                  urgencyAssessment={urgencyAssessment}
                  size="small"
                />
              </div>
            )}
          </div>
        </div>

        {/* Informations sur le ticket actuel */}
        {currentTicket ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            {/* Statut du ticket */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">
                Votre Ticket
              </h2>

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Numéro:</span>
                  <span className="font-mono text-lg font-bold text-blue-600">
                    #{currentTicket.numero}
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Statut:</span>
                  <span
                    className={`px-3 py-1 rounded-full text-sm font-medium ${
                      currentTicket.statut === "en-cours"
                        ? "bg-green-100 text-green-800"
                        : "bg-yellow-100 text-yellow-800"
                    }`}
                  >
                    {currentTicket.statut === "en-cours"
                      ? "En consultation"
                      : "En attente"}
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Position:</span>
                  <span className="text-lg font-semibold text-gray-900">
                    {currentTicket.position}
                  </span>
                </div>

                {getEstimatedWaitTime() && (
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">
                      Temps d'attente estimé:
                    </span>
                    <span className="text-lg font-semibold text-orange-600">
                      ~{getEstimatedWaitTime()} min
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Informations médecin */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">
                Médecin Assigné
              </h2>

              <div className="space-y-4">
                <div className="flex items-center space-x-3">
                  <div className="bg-green-100 rounded-full p-2">
                    <User className="h-5 w-5 text-green-600" />
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">
                      Dr. {currentTicket.docteur?.nom || "Non assigné"}
                    </p>
                    <p className="text-sm text-gray-600">
                      {currentTicket.docteur?.specialite || "Médecine générale"}
                    </p>
                  </div>
                </div>

                <div className="flex items-center space-x-3">
                  <MapPin className="h-5 w-5 text-gray-400" />
                  <span className="text-gray-600">
                    Cabinet {currentTicket.docteur?.cabinet || "1"}
                  </span>
                </div>

                <div className="flex items-center space-x-3">
                  <Phone className="h-5 w-5 text-gray-400" />
                  <span className="text-gray-600">
                    {currentTicket.docteur?.telephone || "Non disponible"}
                  </span>
                </div>
              </div>
            </div>
          </div>
        ) : (
          /* Pas de ticket actuel */
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6 text-center">
            <Clock className="mx-auto h-12 w-12 text-gray-400 mb-4" />
            <h2 className="text-xl font-semibold text-gray-900 mb-2">
              Aucun ticket actif
            </h2>
            <p className="text-gray-600 mb-4">
              Vous n'avez actuellement aucun ticket en attente ou en cours.
            </p>
            <button className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors">
              Créer un nouveau ticket
            </button>
          </div>
        )}

        {/* Instructions d'utilisation du chat */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-6">
          <h3 className="text-lg font-semibold text-blue-900 mb-3">
            💬 Assistant d'Évaluation Médicale
          </h3>
          <div className="text-blue-800 space-y-2">
            <p>
              Notre assistant intelligent peut vous aider à évaluer votre
              situation médicale et optimiser votre prise en charge.
            </p>
            <ul className="list-disc list-inside space-y-1 text-sm">
              <li>Décrivez vos symptômes et votre niveau de douleur</li>
              <li>Répondez aux questions pour une évaluation précise</li>
              <li>Votre niveau d'urgence sera automatiquement calculé</li>
              <li>L'équipe médicale sera notifiée selon votre priorité</li>
            </ul>
            <p className="text-sm font-medium">
              👆 Cliquez sur l'icône de chat en bas à droite pour commencer
            </p>
          </div>
        </div>

        {/* Historique des consultations récentes */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            Consultations Récentes
          </h2>
          <div className="text-center py-8 text-gray-500">
            <Clock className="mx-auto h-8 w-8 mb-2" />
            <p>Aucune consultation récente à afficher</p>
          </div>
        </div>
      </div>

      {/* Widget de Chat */}
      <ChatWidget
        patientId={patient?._id}
        ticketId={currentTicket?._id}
        onUrgencyChange={handleUrgencyChange}
        initialPosition="bottom-right"
      />
    </div>
  );
};

export default PatientDashboard;
