import { useState } from 'react';
import { DOCTEURS } from '../config/doctors';

export default function DoctorQuickLogin({ onQuickLogin, isLoading }) {
  const [showDoctorLogins, setShowDoctorLogins] = useState(false);

  const handleDoctorLogin = (doctor) => {
    onQuickLogin({
      email: doctor.credentials.email,
      password: doctor.credentials.password
    });
  };

  return (
    <div className="mb-6">
      <button
        onClick={() => setShowDoctorLogins(!showDoctorLogins)}
        className="w-full high-contrast-button touch-target-large bg-blue-100 hover:bg-blue-200 text-blue-800 border-blue-300 gentle-transition"
        type="button"
        aria-expanded={showDoctorLogins}
        aria-controls="doctor-quick-login-section"
      >
        👨‍⚕️ {showDoctorLogins ? 'Masquer' : 'Voir'} les connexions rapides médecins
      </button>

      {showDoctorLogins && (
        <div 
          id="doctor-quick-login-section"
          className="mt-4 bg-gradient-to-br from-blue-50 to-indigo-50 border-2 border-blue-200 rounded-xl p-4"
          role="region"
          aria-label="Connexions rapides pour les médecins"
        >
          <h3 className="font-bold text-blue-900 mb-4 text-center senior-friendly-text">
            🩺 Connexion rapide médecins
          </h3>
          <p className="text-sm text-blue-700 mb-4 text-center">
            Cliquez sur un médecin pour vous connecter instantanément
          </p>
          
          <div className="space-y-3">
            {DOCTEURS.map((doctor) => (
              <button
                key={doctor.id}
                onClick={() => handleDoctorLogin(doctor)}
                disabled={isLoading || !doctor.disponible}
                className={`
                  w-full touch-target-large p-4 rounded-xl transition-all duration-200 border-2
                  ${doctor.disponible 
                    ? 'bg-white hover:bg-gradient-to-r hover:from-blue-50 hover:to-indigo-50 text-blue-900 border-blue-300 hover:border-blue-400 hover:shadow-md transform hover:scale-[1.02]' 
                    : 'bg-gray-100 text-gray-500 border-gray-300 cursor-not-allowed'
                  }
                  ${isLoading ? 'opacity-50 cursor-wait' : ''}
                `}
                aria-label={`Se connecter en tant que ${doctor.fullName}`}
              >
                <div className="flex items-center space-x-3">
                  <div className="w-12 h-12 bg-gradient-to-br from-blue-100 to-indigo-100 rounded-full flex items-center justify-center text-2xl flex-shrink-0">
                    {doctor.emoji}
                  </div>
                  <div className="flex-1 text-left min-w-0">
                    <p className="font-semibold text-blue-900 truncate">
                      {doctor.fullName}
                    </p>
                    <p className="text-sm text-blue-700">
                      {doctor.specialite}
                    </p>
                    <div className="flex items-center space-x-1 mt-1">
                      <div className={`w-2 h-2 rounded-full ${doctor.disponible ? 'bg-green-500' : 'bg-red-500'}`}></div>
                      <span className={`text-xs font-medium ${doctor.disponible ? 'text-green-600' : 'text-red-600'}`}>
                        {doctor.disponible ? 'Disponible' : 'Non disponible'}
                      </span>
                    </div>
                  </div>
                  <div className="flex-shrink-0">
                    {isLoading ? (
                      <div className="animate-spin w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full"></div>
                    ) : (
                      <svg className="w-5 h-5 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    )}
                  </div>
                </div>
              </button>
            ))}
          </div>

          <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
            <p className="text-xs text-yellow-800 text-center">
              ⚠️ <strong>Mode développement :</strong> Ces connexions rapides sont uniquement pour les tests et la démonstration.
            </p>
          </div>
        </div>
      )}
    </div>
  );
} 