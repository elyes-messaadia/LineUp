/**
 * 🏥 Dashboard Patient - LineUp
 *
 * Interface moderne pour les patients avec gestion des rendez-vous
 */

import { useState, useEffect } from "react";
import { useAuth } from "../../contexts/AuthContext";
import { PrimaryButton, SecondaryButton } from "../ui/Button";
import Icon from "../ui/Icon";
import {
  LoadingSpinner,
  ErrorFeedback,
  SuccessFeedback,
} from "../ui/UXComponents";
import { formatDate, formatTime } from "../../utils/dateUtils";

export default function PatientDashboard() {
  const { user } = useAuth();
  const [appointments, setAppointments] = useState([]);
  const [doctors, setDoctors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedView, setSelectedView] = useState("overview");
  const [feedback, setFeedback] = useState(null);

  // Données mockées pour la démo
  useEffect(() => {
    // Simulation du chargement des données
    setTimeout(() => {
      setAppointments([
        {
          id: 1,
          doctor: "Dr. Sophie Martin",
          specialty: "Cardiologie",
          date: "2024-01-20",
          time: "14:30",
          status: "confirmed",
          type: "consultation",
          location: "Cabinet 205",
        },
        {
          id: 2,
          doctor: "Dr. Pierre Dubois",
          specialty: "Orthopédie",
          date: "2024-01-15",
          time: "09:00",
          status: "completed",
          type: "suivi",
          location: "Cabinet 102",
        },
        {
          id: 3,
          doctor: "Dr. Marie Rousseau",
          specialty: "Dermatologie",
          date: "2024-01-25",
          time: "16:00",
          status: "pending",
          type: "consultation",
          location: "Cabinet 301",
        },
      ]);

      setDoctors([
        {
          id: 1,
          name: "Dr. Sophie Martin",
          specialty: "Cardiologie",
          rating: 4.8,
          experience: "15 ans",
          nextAvailable: "2024-01-22",
          image: "/api/placeholder/60/60",
        },
        {
          id: 2,
          name: "Dr. Pierre Dubois",
          specialty: "Orthopédie",
          rating: 4.6,
          experience: "12 ans",
          nextAvailable: "2024-01-21",
          image: "/api/placeholder/60/60",
        },
        {
          id: 3,
          name: "Dr. Marie Rousseau",
          specialty: "Dermatologie",
          rating: 4.9,
          experience: "10 ans",
          nextAvailable: "2024-01-23",
          image: "/api/placeholder/60/60",
        },
      ]);

      setLoading(false);
    }, 1000);
  }, []);

  // Statistiques rapides
  const stats = {
    nextAppointment: appointments.find(
      (apt) => new Date(apt.date) > new Date()
    ),
    totalAppointments: appointments.length,
    completedAppointments: appointments.filter(
      (apt) => apt.status === "completed"
    ).length,
    pendingAppointments: appointments.filter((apt) => apt.status === "pending")
      .length,
  };

  // Prendre un rendez-vous
  const handleBookAppointment = (doctorId) => {
    setFeedback({
      type: "success",
      message:
        "Demande de rendez-vous envoyée ! Vous recevrez une confirmation par email.",
    });
  };

  // Annuler un rendez-vous
  const handleCancelAppointment = (appointmentId) => {
    setAppointments((prev) => prev.filter((apt) => apt.id !== appointmentId));
    setFeedback({
      type: "success",
      message: "Rendez-vous annulé avec succès.",
    });
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "confirmed":
        return "text-success-600 bg-success-100";
      case "pending":
        return "text-warning-600 bg-warning-100";
      case "completed":
        return "text-secondary-600 bg-secondary-100";
      case "cancelled":
        return "text-error-600 bg-error-100";
      default:
        return "text-secondary-600 bg-secondary-100";
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case "confirmed":
        return "Confirmé";
      case "pending":
        return "En attente";
      case "completed":
        return "Terminé";
      case "cancelled":
        return "Annulé";
      default:
        return status;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-64">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Feedback Messages */}
      {feedback && (
        <div className="fixed top-4 right-4 z-50">
          {feedback.type === "success" ? (
            <SuccessFeedback
              message={feedback.message}
              onClose={() => setFeedback(null)}
            />
          ) : (
            <ErrorFeedback
              message={feedback.message}
              onClose={() => setFeedback(null)}
            />
          )}
        </div>
      )}

      {/* Header */}
      <div className="bg-white rounded-xl shadow-accessible border border-secondary-200 p-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-secondary-800 mb-2">
              Bonjour {user?.firstName} ! 👋
            </h1>
            <p className="text-secondary-600">
              Gérez vos rendez-vous médicaux en toute simplicité
            </p>
          </div>
          <PrimaryButton
            onClick={() => setSelectedView("book")}
            icon="calendar"
            className="sm:flex-shrink-0"
          >
            Nouveau rendez-vous
          </PrimaryButton>
        </div>
      </div>

      {/* Navigation */}
      <div className="bg-white rounded-xl shadow-accessible border border-secondary-200 p-2">
        <nav className="flex space-x-1">
          {[
            { id: "overview", label: "Vue d'ensemble", icon: "dashboard" },
            { id: "appointments", label: "Mes rendez-vous", icon: "calendar" },
            { id: "doctors", label: "Médecins", icon: "doctor" },
            { id: "book", label: "Prendre RDV", icon: "add" },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setSelectedView(tab.id)}
              className={`
                flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium
                transition-all duration-200
                ${
                  selectedView === tab.id
                    ? "bg-primary-100 text-primary-700"
                    : "text-secondary-600 hover:text-secondary-800 hover:bg-secondary-50"
                }
              `}
            >
              <Icon name={tab.icon} size="sm" />
              <span className="hidden sm:block">{tab.label}</span>
            </button>
          ))}
        </nav>
      </div>

      {/* Vue d'ensemble */}
      {selectedView === "overview" && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Statistiques */}
          <div className="grid grid-cols-2 gap-4">
            <div
              className="bg-gradient-to-br from-primary-500 to-primary-600 
                          rounded-xl p-4 text-white"
            >
              <Icon name="calendar" size="lg" className="mb-2 opacity-80" />
              <p className="text-primary-100 text-sm">Total RDV</p>
              <p className="text-2xl font-bold">{stats.totalAppointments}</p>
            </div>

            <div
              className="bg-gradient-to-br from-success-500 to-success-600 
                          rounded-xl p-4 text-white"
            >
              <Icon name="checkmark" size="lg" className="mb-2 opacity-80" />
              <p className="text-success-100 text-sm">Terminés</p>
              <p className="text-2xl font-bold">
                {stats.completedAppointments}
              </p>
            </div>
          </div>

          {/* Prochain rendez-vous */}
          {stats.nextAppointment && (
            <div className="bg-white rounded-xl shadow-accessible border border-secondary-200 p-6">
              <h3 className="text-lg font-semibold text-secondary-800 mb-4 flex items-center gap-2">
                <Icon name="clock" size="sm" />
                Prochain rendez-vous
              </h3>
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-primary-100 rounded-full flex items-center justify-center">
                    <Icon
                      name="doctor"
                      size="sm"
                      className="text-primary-600"
                    />
                  </div>
                  <div>
                    <p className="font-medium text-secondary-800">
                      {stats.nextAppointment.doctor}
                    </p>
                    <p className="text-sm text-secondary-600">
                      {stats.nextAppointment.specialty}
                    </p>
                  </div>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-secondary-600">
                    📅 {formatDate(stats.nextAppointment.date)} à{" "}
                    {stats.nextAppointment.time}
                  </span>
                  <span
                    className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(
                      stats.nextAppointment.status
                    )}`}
                  >
                    {getStatusText(stats.nextAppointment.status)}
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Liste des rendez-vous */}
      {selectedView === "appointments" && (
        <div className="bg-white rounded-xl shadow-accessible border border-secondary-200">
          <div className="p-6 border-b border-secondary-200">
            <h2 className="text-xl font-semibold text-secondary-800 flex items-center gap-2">
              <Icon name="calendar" size="sm" />
              Mes rendez-vous
            </h2>
          </div>
          <div className="divide-y divide-secondary-200">
            {appointments.map((appointment) => (
              <div
                key={appointment.id}
                className="p-6 hover:bg-secondary-50 transition-colors duration-200"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-primary-100 rounded-full flex items-center justify-center">
                      <Icon
                        name="doctor"
                        size="sm"
                        className="text-primary-600"
                      />
                    </div>
                    <div>
                      <h3 className="font-medium text-secondary-800">
                        {appointment.doctor}
                      </h3>
                      <p className="text-sm text-secondary-600">
                        {appointment.specialty} • {appointment.location}
                      </p>
                      <p className="text-sm text-secondary-500">
                        📅 {formatDate(appointment.date)} à {appointment.time}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(
                        appointment.status
                      )}`}
                    >
                      {getStatusText(appointment.status)}
                    </span>
                    {appointment.status === "confirmed" && (
                      <SecondaryButton
                        size="sm"
                        onClick={() => handleCancelAppointment(appointment.id)}
                        icon="close"
                      >
                        Annuler
                      </SecondaryButton>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Liste des médecins */}
      {selectedView === "doctors" && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {doctors.map((doctor) => (
            <div
              key={doctor.id}
              className="bg-white rounded-xl shadow-accessible border border-secondary-200 p-6"
            >
              <div className="text-center mb-4">
                <div className="w-16 h-16 bg-primary-100 rounded-full mx-auto mb-3 flex items-center justify-center">
                  <Icon name="doctor" size="lg" className="text-primary-600" />
                </div>
                <h3 className="font-semibold text-secondary-800 mb-1">
                  {doctor.name}
                </h3>
                <p className="text-sm text-secondary-600">{doctor.specialty}</p>
              </div>

              <div className="space-y-2 mb-4">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-secondary-600">Expérience:</span>
                  <span className="font-medium">{doctor.experience}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-secondary-600">Note:</span>
                  <div className="flex items-center gap-1">
                    <Icon name="star" size="xs" className="text-warning-500" />
                    <span className="font-medium">{doctor.rating}/5</span>
                  </div>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-secondary-600">Disponible:</span>
                  <span className="font-medium">
                    {formatDate(doctor.nextAvailable)}
                  </span>
                </div>
              </div>

              <PrimaryButton
                onClick={() => handleBookAppointment(doctor.id)}
                icon="calendar"
                size="sm"
                className="w-full"
              >
                Prendre RDV
              </PrimaryButton>
            </div>
          ))}
        </div>
      )}

      {/* Prise de rendez-vous */}
      {selectedView === "book" && (
        <div className="bg-white rounded-xl shadow-accessible border border-secondary-200 p-6">
          <h2 className="text-xl font-semibold text-secondary-800 mb-6 flex items-center gap-2">
            <Icon name="add" size="sm" />
            Prendre un nouveau rendez-vous
          </h2>

          <div className="text-center py-12">
            <div className="w-16 h-16 bg-primary-100 rounded-full mx-auto mb-4 flex items-center justify-center">
              <Icon name="calendar" size="lg" className="text-primary-600" />
            </div>
            <h3 className="text-lg font-medium text-secondary-800 mb-2">
              Fonctionnalité en cours de développement
            </h3>
            <p className="text-secondary-600 mb-6">
              Le système de prise de rendez-vous sera bientôt disponible.
            </p>
            <SecondaryButton
              onClick={() => setSelectedView("doctors")}
              icon="back"
            >
              Voir les médecins disponibles
            </SecondaryButton>
          </div>
        </div>
      )}
    </div>
  );
}
