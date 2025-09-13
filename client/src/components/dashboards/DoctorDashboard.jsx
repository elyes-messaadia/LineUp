/**
 * 👨‍⚕️ Dashboard Docteur - LineUp
 * 
 * Interface de gestion pour les médecins avec planification et suivi des patients
 */

import { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { PrimaryButton, SecondaryButton } from '../ui/Button';
import Icon from '../ui/Icon';
import { LoadingSpinner, ErrorFeedback, SuccessFeedback } from '../ui/UXComponents';
import { formatDate, formatTime } from '../../utils/dateUtils';

export default function DoctorDashboard() {
  const { user } = useAuth();
  const [appointments, setAppointments] = useState([]);
  const [patients, setPatients] = useState([]);
  const [schedule, setSchedule] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedView, setSelectedView] = useState('overview');
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [feedback, setFeedback] = useState(null);

  // Données mockées pour la démo
  useEffect(() => {
    setTimeout(() => {
      setAppointments([
        {
          id: 1,
          patient: 'Marie Dubois',
          type: 'Consultation',
          date: '2024-01-20',
          time: '09:00',
          duration: 30,
          status: 'confirmed',
          reason: 'Douleurs thoraciques',
          phone: '06 12 34 56 78',
          age: 45
        },
        {
          id: 2,
          patient: 'Pierre Martin',
          type: 'Suivi',
          date: '2024-01-20',
          time: '10:30',
          duration: 20,
          status: 'confirmed',
          reason: 'Contrôle post-opératoire',
          phone: '06 87 65 43 21',
          age: 58
        },
        {
          id: 3,
          patient: 'Sophie Rousseau',
          type: 'Urgence',
          date: '2024-01-20',
          time: '14:00',
          duration: 45,
          status: 'pending',
          reason: 'Palpitations cardiaques',
          phone: '06 55 44 33 22',
          age: 32
        }
      ]);

      setPatients([
        {
          id: 1,
          name: 'Marie Dubois',
          age: 45,
          lastVisit: '2024-01-15',
          totalVisits: 8,
          condition: 'Hypertension',
          phone: '06 12 34 56 78',
          email: 'marie.dubois@email.com'
        },
        {
          id: 2,
          name: 'Pierre Martin',
          age: 58,
          lastVisit: '2024-01-18',
          totalVisits: 12,
          condition: 'Post-chirurgie cardiaque',
          phone: '06 87 65 43 21',
          email: 'pierre.martin@email.com'
        },
        {
          id: 3,
          name: 'Sophie Rousseau',
          age: 32,
          lastVisit: '2024-01-10',
          totalVisits: 3,
          condition: 'Arythmie',
          phone: '06 55 44 33 22',
          email: 'sophie.rousseau@email.com'
        }
      ]);

      // Génération du planning de la semaine
      const today = new Date();
      const weekSchedule = [];
      for (let i = 0; i < 7; i++) {
        const date = new Date(today);
        date.setDate(today.getDate() + i);
        const slots = [];
        
        // Créneaux de 9h à 17h
        for (let hour = 9; hour < 17; hour++) {
          for (let minute = 0; minute < 60; minute += 30) {
            const timeStr = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
            const isBooked = appointments.some(apt => 
              apt.date === date.toISOString().split('T')[0] && 
              apt.time === timeStr
            );
            
            slots.push({
              time: timeStr,
              available: !isBooked && Math.random() > 0.3, // 70% de chances d'être disponible
              booked: isBooked
            });
          }
        }
        
        weekSchedule.push({
          date: date.toISOString().split('T')[0],
          dayName: date.toLocaleDateString('fr-FR', { weekday: 'long' }),
          slots
        });
      }
      
      setSchedule(weekSchedule);
      setLoading(false);
    }, 1000);
  }, []);

  // Statistiques du jour
  const todayAppointments = appointments.filter(apt => apt.date === selectedDate);
  const stats = {
    todayTotal: todayAppointments.length,
    todayConfirmed: todayAppointments.filter(apt => apt.status === 'confirmed').length,
    todayPending: todayAppointments.filter(apt => apt.status === 'pending').length,
    totalPatients: patients.length,
    nextAppointment: todayAppointments.find(apt => 
      new Date(`${apt.date} ${apt.time}`) > new Date()
    )
  };

  // Confirmer un rendez-vous
  const handleConfirmAppointment = (appointmentId) => {
    setAppointments(prev => 
      prev.map(apt => 
        apt.id === appointmentId 
          ? { ...apt, status: 'confirmed' }
          : apt
      )
    );
    setFeedback({
      type: 'success',
      message: 'Rendez-vous confirmé avec succès.'
    });
  };

  // Annuler un rendez-vous
  const handleCancelAppointment = (appointmentId) => {
    setAppointments(prev => 
      prev.map(apt => 
        apt.id === appointmentId 
          ? { ...apt, status: 'cancelled' }
          : apt
      )
    );
    setFeedback({
      type: 'success',
      message: 'Rendez-vous annulé.'
    });
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'confirmed': return 'text-success-600 bg-success-100';
      case 'pending': return 'text-warning-600 bg-warning-100';
      case 'completed': return 'text-secondary-600 bg-secondary-100';
      case 'cancelled': return 'text-error-600 bg-error-100';
      default: return 'text-secondary-600 bg-secondary-100';
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'confirmed': return 'Confirmé';
      case 'pending': return 'En attente';
      case 'completed': return 'Terminé';
      case 'cancelled': return 'Annulé';
      default: return status;
    }
  };

  const getUrgencyColor = (type) => {
    switch (type) {
      case 'Urgence': return 'text-error-600 bg-error-100';
      case 'Consultation': return 'text-primary-600 bg-primary-100';
      case 'Suivi': return 'text-secondary-600 bg-secondary-100';
      default: return 'text-secondary-600 bg-secondary-100';
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
          {feedback.type === 'success' ? (
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
              Bienvenue Dr. {user?.lastName} 👨‍⚕️
            </h1>
            <p className="text-secondary-600">
              Gérez votre planning et suivez vos patients
            </p>
          </div>
          
          {/* Statistiques rapides */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
            <div className="text-center">
              <p className="text-2xl font-bold text-primary-600">{stats.todayTotal}</p>
              <p className="text-xs text-secondary-600">RDV aujourd'hui</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-success-600">{stats.todayConfirmed}</p>
              <p className="text-xs text-secondary-600">Confirmés</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-warning-600">{stats.todayPending}</p>
              <p className="text-xs text-secondary-600">En attente</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-accent-600">{stats.totalPatients}</p>
              <p className="text-xs text-secondary-600">Patients</p>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <div className="bg-white rounded-xl shadow-accessible border border-secondary-200 p-2">
        <nav className="flex space-x-1">
          {[
            { id: 'overview', label: 'Vue d\'ensemble', icon: 'dashboard' },
            { id: 'appointments', label: 'Rendez-vous', icon: 'calendar' },
            { id: 'patients', label: 'Mes patients', icon: 'patient' },
            { id: 'schedule', label: 'Planning', icon: 'clock' }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setSelectedView(tab.id)}
              className={`
                flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium
                transition-all duration-200
                ${selectedView === tab.id
                  ? 'bg-primary-100 text-primary-700'
                  : 'text-secondary-600 hover:text-secondary-800 hover:bg-secondary-50'
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
      {selectedView === 'overview' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Prochain patient */}
          {stats.nextAppointment && (
            <div className="lg:col-span-2 bg-gradient-to-br from-primary-500 to-primary-600 
                          rounded-xl p-6 text-white">
              <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <Icon name="clock" size="sm" />
                Prochain patient
              </h3>
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center">
                    <Icon name="patient" size="sm" className="text-white" />
                  </div>
                  <div>
                    <p className="font-medium text-lg">
                      {stats.nextAppointment.patient}
                    </p>
                    <p className="text-primary-100">
                      {stats.nextAppointment.reason}
                    </p>
                  </div>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-primary-100">
                    📅 {stats.nextAppointment.time} ({stats.nextAppointment.duration} min)
                  </span>
                  <span className={`px-3 py-1 rounded-full text-xs font-medium ${getUrgencyColor(stats.nextAppointment.type)}`}>
                    {stats.nextAppointment.type}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Résumé du jour */}
          <div className="bg-white rounded-xl shadow-accessible border border-secondary-200 p-6">
            <h3 className="text-lg font-semibold text-secondary-800 mb-4 flex items-center gap-2">
              <Icon name="calendar" size="sm" />
              Aujourd'hui
            </h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-secondary-600">Total RDV</span>
                <span className="font-bold text-lg text-primary-600">{stats.todayTotal}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-secondary-600">Confirmés</span>
                <span className="font-bold text-success-600">{stats.todayConfirmed}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-secondary-600">En attente</span>
                <span className="font-bold text-warning-600">{stats.todayPending}</span>
              </div>
              <div className="pt-2 border-t border-secondary-200">
                <PrimaryButton
                  onClick={() => setSelectedView('appointments')}
                  size="sm"
                  icon="calendar"
                  className="w-full"
                >
                  Voir le planning
                </PrimaryButton>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Rendez-vous */}
      {selectedView === 'appointments' && (
        <div className="space-y-4">
          {/* Sélecteur de date */}
          <div className="bg-white rounded-xl shadow-accessible border border-secondary-200 p-4">
            <div className="flex items-center gap-4">
              <label className="text-sm font-medium text-secondary-700">
                Date sélectionnée :
              </label>
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="px-3 py-2 border border-secondary-300 rounded-lg text-sm
                         focus:outline-none focus:ring-2 focus:ring-primary-400"
              />
            </div>
          </div>

          {/* Liste des rendez-vous */}
          <div className="bg-white rounded-xl shadow-accessible border border-secondary-200">
            <div className="p-6 border-b border-secondary-200">
              <h2 className="text-xl font-semibold text-secondary-800 flex items-center gap-2">
                <Icon name="calendar" size="sm" />
                Rendez-vous du {formatDate(selectedDate)}
              </h2>
            </div>
            <div className="divide-y divide-secondary-200">
              {todayAppointments.length > 0 ? (
                todayAppointments.map((appointment) => (
                  <div key={appointment.id} className="p-6 hover:bg-secondary-50 transition-colors duration-200">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-primary-100 rounded-full flex items-center justify-center">
                          <Icon name="patient" size="sm" className="text-primary-600" />
                        </div>
                        <div>
                          <h3 className="font-medium text-secondary-800 text-lg">
                            {appointment.patient}
                          </h3>
                          <p className="text-sm text-secondary-600">
                            {appointment.age} ans • {appointment.phone}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${getUrgencyColor(appointment.type)}`}>
                          {appointment.type}
                        </span>
                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(appointment.status)}`}>
                          {getStatusText(appointment.status)}
                        </span>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                      <div>
                        <p className="text-sm text-secondary-600 mb-1">Motif :</p>
                        <p className="font-medium text-secondary-800">{appointment.reason}</p>
                      </div>
                      <div>
                        <p className="text-sm text-secondary-600 mb-1">Horaire :</p>
                        <p className="font-medium text-secondary-800">
                          {appointment.time} ({appointment.duration} min)
                        </p>
                      </div>
                    </div>
                    
                    {appointment.status === 'pending' && (
                      <div className="flex gap-2">
                        <PrimaryButton
                          size="sm"
                          onClick={() => handleConfirmAppointment(appointment.id)}
                          icon="checkmark"
                        >
                          Confirmer
                        </PrimaryButton>
                        <SecondaryButton
                          size="sm"
                          onClick={() => handleCancelAppointment(appointment.id)}
                          icon="close"
                        >
                          Annuler
                        </SecondaryButton>
                      </div>
                    )}
                  </div>
                ))
              ) : (
                <div className="p-12 text-center">
                  <Icon name="calendar" size="xl" className="text-secondary-300 mb-4 mx-auto" />
                  <p className="text-secondary-600">Aucun rendez-vous pour cette date</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Patients */}
      {selectedView === 'patients' && (
        <div className="bg-white rounded-xl shadow-accessible border border-secondary-200">
          <div className="p-6 border-b border-secondary-200">
            <h2 className="text-xl font-semibold text-secondary-800 flex items-center gap-2">
              <Icon name="patient" size="sm" />
              Mes patients
            </h2>
          </div>
          <div className="divide-y divide-secondary-200">
            {patients.map((patient) => (
              <div key={patient.id} className="p-6 hover:bg-secondary-50 transition-colors duration-200">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-accent-100 rounded-full flex items-center justify-center">
                      <Icon name="patient" size="sm" className="text-accent-600" />
                    </div>
                    <div>
                      <h3 className="font-medium text-secondary-800">
                        {patient.name}
                      </h3>
                      <p className="text-sm text-secondary-600">
                        {patient.age} ans • {patient.email}
                      </p>
                      <p className="text-sm text-secondary-500">
                        Condition : {patient.condition}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-secondary-600">
                      Dernière visite : {formatDate(patient.lastVisit)}
                    </p>
                    <p className="text-sm text-secondary-500">
                      {patient.totalVisits} consultations
                    </p>
                    <SecondaryButton
                      size="sm"
                      icon="info"
                      className="mt-2"
                    >
                      Dossier
                    </SecondaryButton>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Planning */}
      {selectedView === 'schedule' && (
        <div className="bg-white rounded-xl shadow-accessible border border-secondary-200 p-6">
          <h2 className="text-xl font-semibold text-secondary-800 mb-6 flex items-center gap-2">
            <Icon name="clock" size="sm" />
            Planning de la semaine
          </h2>
          
          <div className="text-center py-12">
            <div className="w-16 h-16 bg-primary-100 rounded-full mx-auto mb-4 flex items-center justify-center">
              <Icon name="clock" size="lg" className="text-primary-600" />
            </div>
            <h3 className="text-lg font-medium text-secondary-800 mb-2">
              Calendrier interactif en développement
            </h3>
            <p className="text-secondary-600 mb-6">
              La vue planning détaillée sera bientôt disponible.
            </p>
            <SecondaryButton
              onClick={() => setSelectedView('appointments')}
              icon="calendar"
            >
              Voir les rendez-vous du jour
            </SecondaryButton>
          </div>
        </div>
      )}
    </div>
  );
}