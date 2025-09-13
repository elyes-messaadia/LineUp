/**
 * 👩‍💼 Dashboard Secrétaire - LineUp
 *
 * Interface d'administration pour la gestion des rendez-vous et patients
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

export default function SecretaryDashboard() {
  const { user } = useAuth();
  const [appointments, setAppointments] = useState([]);
  const [patients, setPatients] = useState([]);
  const [doctors, setDoctors] = useState([]);
  const [waitingList, setWaitingList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedView, setSelectedView] = useState("overview");
  const [selectedDate, setSelectedDate] = useState(
    new Date().toISOString().split("T")[0]
  );
  const [feedback, setFeedback] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [showNewAppointmentModal, setShowNewAppointmentModal] = useState(false);

  // Données mockées pour la démo
  useEffect(() => {
    setTimeout(() => {
      setAppointments([
        {
          id: 1,
          patient: "Marie Dubois",
          doctor: "Dr. Sophie Martin",
          specialty: "Cardiologie",
          date: "2024-01-20",
          time: "09:00",
          duration: 30,
          status: "confirmed",
          type: "Consultation",
          phone: "06 12 34 56 78",
          reason: "Douleurs thoraciques",
        },
        {
          id: 2,
          patient: "Pierre Martin",
          doctor: "Dr. Sophie Martin",
          specialty: "Cardiologie",
          date: "2024-01-20",
          time: "10:30",
          duration: 20,
          status: "pending",
          type: "Suivi",
          phone: "06 87 65 43 21",
          reason: "Contrôle post-opératoire",
        },
        {
          id: 3,
          patient: "Sophie Rousseau",
          doctor: "Dr. Pierre Dubois",
          specialty: "Orthopédie",
          date: "2024-01-20",
          time: "14:00",
          duration: 45,
          status: "confirmed",
          type: "Consultation",
          phone: "06 55 44 33 22",
          reason: "Douleurs articulaires",
        },
      ]);

      setPatients([
        {
          id: 1,
          name: "Marie Dubois",
          phone: "06 12 34 56 78",
          email: "marie.dubois@email.com",
          birthDate: "1979-03-15",
          address: "123 Rue de la Paix, Paris",
          lastVisit: "2024-01-15",
          totalVisits: 8,
          preferredDoctor: "Dr. Sophie Martin",
        },
        {
          id: 2,
          name: "Pierre Martin",
          phone: "06 87 65 43 21",
          email: "pierre.martin@email.com",
          birthDate: "1966-07-22",
          address: "456 Avenue des Champs, Lyon",
          lastVisit: "2024-01-18",
          totalVisits: 12,
          preferredDoctor: "Dr. Sophie Martin",
        },
        {
          id: 3,
          name: "Sophie Rousseau",
          phone: "06 55 44 33 22",
          email: "sophie.rousseau@email.com",
          birthDate: "1992-11-08",
          address: "789 Boulevard Saint-Michel, Marseille",
          lastVisit: "2024-01-10",
          totalVisits: 3,
          preferredDoctor: "Dr. Pierre Dubois",
        },
      ]);

      setDoctors([
        {
          id: 1,
          name: "Dr. Sophie Martin",
          specialty: "Cardiologie",
          phone: "01 23 45 67 89",
          email: "sophie.martin@clinique.fr",
          schedule: "Lun-Ven 9h-17h",
          nextAvailable: "2024-01-22",
        },
        {
          id: 2,
          name: "Dr. Pierre Dubois",
          specialty: "Orthopédie",
          phone: "01 98 76 54 32",
          email: "pierre.dubois@clinique.fr",
          schedule: "Mar-Sam 10h-18h",
          nextAvailable: "2024-01-21",
        },
        {
          id: 3,
          name: "Dr. Marie Rousseau",
          specialty: "Dermatologie",
          phone: "01 11 22 33 44",
          email: "marie.rousseau@clinique.fr",
          schedule: "Lun-Mer 8h-16h",
          nextAvailable: "2024-01-23",
        },
      ]);

      setWaitingList([
        {
          id: 1,
          patient: "Jean Durand",
          phone: "06 99 88 77 66",
          requestedDoctor: "Dr. Sophie Martin",
          requestedDate: "2024-01-25",
          reason: "Consultation cardiologie",
          priority: "normal",
          addedDate: "2024-01-19",
        },
        {
          id: 2,
          patient: "Anne Leclerc",
          phone: "06 77 66 55 44",
          requestedDoctor: "Dr. Pierre Dubois",
          requestedDate: "2024-01-24",
          reason: "Douleurs genoux",
          priority: "urgent",
          addedDate: "2024-01-18",
        },
      ]);

      setLoading(false);
    }, 1000);
  }, []);

  // Filtrer les données selon le terme de recherche
  const filteredAppointments = appointments.filter(
    (apt) =>
      apt.patient.toLowerCase().includes(searchTerm.toLowerCase()) ||
      apt.doctor.toLowerCase().includes(searchTerm.toLowerCase()) ||
      apt.reason.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredPatients = patients.filter(
    (patient) =>
      patient.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      patient.phone.includes(searchTerm) ||
      patient.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Statistiques
  const todayAppointments = appointments.filter(
    (apt) => apt.date === selectedDate
  );
  const stats = {
    todayTotal: todayAppointments.length,
    todayConfirmed: todayAppointments.filter(
      (apt) => apt.status === "confirmed"
    ).length,
    todayPending: todayAppointments.filter((apt) => apt.status === "pending")
      .length,
    totalPatients: patients.length,
    waitingListCount: waitingList.length,
    urgentWaiting: waitingList.filter((w) => w.priority === "urgent").length,
  };

  // Actions
  const handleConfirmAppointment = (appointmentId) => {
    setAppointments((prev) =>
      prev.map((apt) =>
        apt.id === appointmentId ? { ...apt, status: "confirmed" } : apt
      )
    );
    setFeedback({
      type: "success",
      message: "Rendez-vous confirmé avec succès.",
    });
  };

  const handleCancelAppointment = (appointmentId) => {
    setAppointments((prev) =>
      prev.map((apt) =>
        apt.id === appointmentId ? { ...apt, status: "cancelled" } : apt
      )
    );
    setFeedback({
      type: "success",
      message: "Rendez-vous annulé.",
    });
  };

  const handleProcessWaitingList = (waitingId) => {
    setWaitingList((prev) => prev.filter((w) => w.id !== waitingId));
    setFeedback({
      type: "success",
      message: "Patient retiré de la liste d'attente.",
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

  const getPriorityColor = (priority) => {
    switch (priority) {
      case "urgent":
        return "text-error-600 bg-error-100";
      case "normal":
        return "text-secondary-600 bg-secondary-100";
      default:
        return "text-secondary-600 bg-secondary-100";
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
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-secondary-800 mb-2">
              Bonjour {user?.firstName} ! 👩‍💼
            </h1>
            <p className="text-secondary-600">
              Gérez les rendez-vous et coordonnez les plannings
            </p>
          </div>

          {/* Statistiques rapides */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
            <div className="text-center">
              <p className="text-2xl font-bold text-primary-600">
                {stats.todayTotal}
              </p>
              <p className="text-xs text-secondary-600">RDV aujourd'hui</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-warning-600">
                {stats.todayPending}
              </p>
              <p className="text-xs text-secondary-600">À confirmer</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-accent-600">
                {stats.waitingListCount}
              </p>
              <p className="text-xs text-secondary-600">Liste d'attente</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-error-600">
                {stats.urgentWaiting}
              </p>
              <p className="text-xs text-secondary-600">Urgents</p>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation et Recherche */}
      <div className="bg-white rounded-xl shadow-accessible border border-secondary-200 p-4">
        <div className="flex flex-col lg:flex-row lg:items-center gap-4">
          {/* Navigation */}
          <nav className="flex space-x-1 lg:flex-1">
            {[
              { id: "overview", label: "Vue d'ensemble", icon: "dashboard" },
              { id: "appointments", label: "Rendez-vous", icon: "calendar" },
              { id: "patients", label: "Patients", icon: "patient" },
              { id: "waiting", label: "Liste d'attente", icon: "clock" },
              { id: "doctors", label: "Médecins", icon: "doctor" },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setSelectedView(tab.id)}
                className={`
                  flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium
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

          {/* Barre de recherche */}
          <div className="relative lg:w-80">
            <input
              type="text"
              placeholder="Rechercher patient, médecin..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-secondary-300 rounded-lg text-sm
                       focus:outline-none focus:ring-2 focus:ring-primary-400 focus:border-transparent"
            />
            <Icon
              name="search"
              size="sm"
              className="absolute left-3 top-1/2 -translate-y-1/2 text-secondary-400"
            />
          </div>
        </div>
      </div>

      {/* Vue d'ensemble */}
      {selectedView === "overview" && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Rendez-vous urgents */}
          <div className="bg-white rounded-xl shadow-accessible border border-secondary-200 p-6">
            <h3 className="text-lg font-semibold text-secondary-800 mb-4 flex items-center gap-2">
              <Icon name="warning" size="sm" className="text-warning-600" />
              Actions requises
            </h3>
            <div className="space-y-3">
              {appointments
                .filter((apt) => apt.status === "pending")
                .slice(0, 3)
                .map((appointment) => (
                  <div
                    key={appointment.id}
                    className="p-3 bg-warning-50 rounded-lg border border-warning-200"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <p className="font-medium text-secondary-800">
                        {appointment.patient}
                      </p>
                      <span className="text-xs text-warning-600">
                        {appointment.time}
                      </span>
                    </div>
                    <p className="text-sm text-secondary-600 mb-2">
                      {appointment.reason}
                    </p>
                    <div className="flex gap-2">
                      <PrimaryButton
                        size="xs"
                        onClick={() => handleConfirmAppointment(appointment.id)}
                        icon="checkmark"
                      >
                        Confirmer
                      </PrimaryButton>
                      <SecondaryButton
                        size="xs"
                        onClick={() => handleCancelAppointment(appointment.id)}
                        icon="close"
                      >
                        Annuler
                      </SecondaryButton>
                    </div>
                  </div>
                ))}
            </div>
          </div>

          {/* Liste d'attente urgente */}
          <div className="bg-white rounded-xl shadow-accessible border border-secondary-200 p-6">
            <h3 className="text-lg font-semibold text-secondary-800 mb-4 flex items-center gap-2">
              <Icon name="clock" size="sm" className="text-error-600" />
              Liste d'attente urgente
            </h3>
            <div className="space-y-3">
              {waitingList
                .filter((w) => w.priority === "urgent")
                .map((waiting) => (
                  <div
                    key={waiting.id}
                    className="p-3 bg-error-50 rounded-lg border border-error-200"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <p className="font-medium text-secondary-800">
                        {waiting.patient}
                      </p>
                      <span
                        className={`px-2 py-1 rounded-full text-xs font-medium ${getPriorityColor(
                          waiting.priority
                        )}`}
                      >
                        URGENT
                      </span>
                    </div>
                    <p className="text-sm text-secondary-600 mb-2">
                      {waiting.requestedDoctor} • {waiting.reason}
                    </p>
                    <div className="flex gap-2">
                      <PrimaryButton
                        size="xs"
                        onClick={() => handleProcessWaitingList(waiting.id)}
                        icon="calendar"
                      >
                        Programmer
                      </PrimaryButton>
                      <SecondaryButton
                        size="xs"
                        onClick={() => handleProcessWaitingList(waiting.id)}
                        icon="phone"
                      >
                        Appeler
                      </SecondaryButton>
                    </div>
                  </div>
                ))}
            </div>
          </div>
        </div>
      )}

      {/* Gestion des rendez-vous */}
      {selectedView === "appointments" && (
        <div className="space-y-4">
          {/* Sélecteur de date et actions */}
          <div className="bg-white rounded-xl shadow-accessible border border-secondary-200 p-4">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div className="flex items-center gap-4">
                <label className="text-sm font-medium text-secondary-700">
                  Date :
                </label>
                <input
                  type="date"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  className="px-3 py-2 border border-secondary-300 rounded-lg text-sm
                           focus:outline-none focus:ring-2 focus:ring-primary-400"
                />
              </div>
              <PrimaryButton
                onClick={() => setShowNewAppointmentModal(true)}
                icon="add"
                size="sm"
              >
                Nouveau RDV
              </PrimaryButton>
            </div>
          </div>

          {/* Liste des rendez-vous */}
          <div className="bg-white rounded-xl shadow-accessible border border-secondary-200">
            <div className="p-6 border-b border-secondary-200">
              <h2 className="text-xl font-semibold text-secondary-800 flex items-center gap-2">
                <Icon name="calendar" size="sm" />
                Rendez-vous du {formatDate(selectedDate)}
                <span className="text-sm font-normal text-secondary-600">
                  (
                  {
                    filteredAppointments.filter(
                      (apt) => apt.date === selectedDate
                    ).length
                  }
                  )
                </span>
              </h2>
            </div>
            <div className="divide-y divide-secondary-200">
              {filteredAppointments
                .filter((apt) => apt.date === selectedDate)
                .sort((a, b) => a.time.localeCompare(b.time))
                .map((appointment) => (
                  <div
                    key={appointment.id}
                    className="p-6 hover:bg-secondary-50 transition-colors duration-200"
                  >
                    <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
                      {/* Informations patient */}
                      <div className="lg:col-span-2">
                        <div className="flex items-center gap-3 mb-2">
                          <div className="w-10 h-10 bg-primary-100 rounded-full flex items-center justify-center">
                            <Icon
                              name="patient"
                              size="sm"
                              className="text-primary-600"
                            />
                          </div>
                          <div>
                            <h3 className="font-medium text-secondary-800">
                              {appointment.patient}
                            </h3>
                            <p className="text-sm text-secondary-600">
                              {appointment.phone}
                            </p>
                          </div>
                        </div>
                        <p className="text-sm text-secondary-600 pl-13">
                          Motif : {appointment.reason}
                        </p>
                      </div>

                      {/* Informations médecin */}
                      <div>
                        <p className="text-sm text-secondary-600 mb-1">
                          Médecin :
                        </p>
                        <p className="font-medium text-secondary-800">
                          {appointment.doctor}
                        </p>
                        <p className="text-sm text-secondary-600">
                          {appointment.specialty}
                        </p>
                      </div>

                      {/* Horaire et actions */}
                      <div className="text-right">
                        <p className="text-sm text-secondary-600 mb-1">
                          Horaire :
                        </p>
                        <p className="font-medium text-secondary-800">
                          {appointment.time} ({appointment.duration} min)
                        </p>
                        <div className="flex items-center justify-end gap-2 mt-2">
                          <span
                            className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(
                              appointment.status
                            )}`}
                          >
                            {getStatusText(appointment.status)}
                          </span>
                          {appointment.status === "pending" && (
                            <>
                              <PrimaryButton
                                size="xs"
                                onClick={() =>
                                  handleConfirmAppointment(appointment.id)
                                }
                                icon="checkmark"
                              >
                                Confirmer
                              </PrimaryButton>
                              <SecondaryButton
                                size="xs"
                                onClick={() =>
                                  handleCancelAppointment(appointment.id)
                                }
                                icon="close"
                              >
                                Annuler
                              </SecondaryButton>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
            </div>
          </div>
        </div>
      )}

      {/* Gestion des patients */}
      {selectedView === "patients" && (
        <div className="bg-white rounded-xl shadow-accessible border border-secondary-200">
          <div className="p-6 border-b border-secondary-200">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold text-secondary-800 flex items-center gap-2">
                <Icon name="patient" size="sm" />
                Base patients
                <span className="text-sm font-normal text-secondary-600">
                  ({filteredPatients.length})
                </span>
              </h2>
              <PrimaryButton icon="add" size="sm">
                Nouveau patient
              </PrimaryButton>
            </div>
          </div>
          <div className="divide-y divide-secondary-200">
            {filteredPatients.map((patient) => (
              <div
                key={patient.id}
                className="p-6 hover:bg-secondary-50 transition-colors duration-200"
              >
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                  <div className="lg:col-span-2">
                    <div className="flex items-center gap-3 mb-2">
                      <div className="w-10 h-10 bg-accent-100 rounded-full flex items-center justify-center">
                        <Icon
                          name="patient"
                          size="sm"
                          className="text-accent-600"
                        />
                      </div>
                      <div>
                        <h3 className="font-medium text-secondary-800">
                          {patient.name}
                        </h3>
                        <p className="text-sm text-secondary-600">
                          {patient.phone} • {patient.email}
                        </p>
                      </div>
                    </div>
                    <div className="pl-13 text-sm text-secondary-600">
                      <p>📍 {patient.address}</p>
                      <p>🎂 {formatDate(patient.birthDate)}</p>
                      <p>👨‍⚕️ Médecin préféré : {patient.preferredDoctor}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-secondary-600 mb-1">
                      Dernière visite :
                    </p>
                    <p className="font-medium text-secondary-800">
                      {formatDate(patient.lastVisit)}
                    </p>
                    <p className="text-sm text-secondary-600">
                      {patient.totalVisits} consultations
                    </p>
                    <div className="flex justify-end gap-2 mt-2">
                      <SecondaryButton size="xs" icon="info">
                        Dossier
                      </SecondaryButton>
                      <SecondaryButton size="xs" icon="calendar">
                        RDV
                      </SecondaryButton>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Liste d'attente */}
      {selectedView === "waiting" && (
        <div className="bg-white rounded-xl shadow-accessible border border-secondary-200">
          <div className="p-6 border-b border-secondary-200">
            <h2 className="text-xl font-semibold text-secondary-800 flex items-center gap-2">
              <Icon name="clock" size="sm" />
              Liste d'attente
              <span className="text-sm font-normal text-secondary-600">
                ({waitingList.length})
              </span>
            </h2>
          </div>
          <div className="divide-y divide-secondary-200">
            {waitingList.map((waiting) => (
              <div
                key={waiting.id}
                className="p-6 hover:bg-secondary-50 transition-colors duration-200"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 bg-warning-100 rounded-full flex items-center justify-center">
                      <Icon
                        name="clock"
                        size="sm"
                        className="text-warning-600"
                      />
                    </div>
                    <div>
                      <h3 className="font-medium text-secondary-800">
                        {waiting.patient}
                      </h3>
                      <p className="text-sm text-secondary-600">
                        {waiting.phone}
                      </p>
                      <p className="text-sm text-secondary-500">
                        Demande : {waiting.requestedDoctor} • {waiting.reason}
                      </p>
                      <p className="text-xs text-secondary-400">
                        Ajouté le {formatDate(waiting.addedDate)}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-medium ${getPriorityColor(
                        waiting.priority
                      )}`}
                    >
                      {waiting.priority === "urgent" ? "URGENT" : "NORMAL"}
                    </span>
                    <div className="flex gap-2">
                      <PrimaryButton
                        size="sm"
                        onClick={() => handleProcessWaitingList(waiting.id)}
                        icon="calendar"
                      >
                        Programmer
                      </PrimaryButton>
                      <SecondaryButton
                        size="sm"
                        onClick={() => handleProcessWaitingList(waiting.id)}
                        icon="phone"
                      >
                        Appeler
                      </SecondaryButton>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Médecins */}
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

              <div className="space-y-2 mb-4 text-sm">
                <div>
                  <span className="text-secondary-600">Horaires : </span>
                  <span className="font-medium">{doctor.schedule}</span>
                </div>
                <div>
                  <span className="text-secondary-600">Disponible : </span>
                  <span className="font-medium">
                    {formatDate(doctor.nextAvailable)}
                  </span>
                </div>
                <div>
                  <span className="text-secondary-600">Contact : </span>
                  <span className="font-medium">{doctor.phone}</span>
                </div>
              </div>

              <div className="flex gap-2">
                <SecondaryButton size="sm" icon="calendar" className="flex-1">
                  Planning
                </SecondaryButton>
                <SecondaryButton size="sm" icon="info" className="flex-1">
                  Détails
                </SecondaryButton>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
