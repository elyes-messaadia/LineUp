import { useState } from 'react';
import { getDoctorDisplayName, getDoctorById, DOCTEURS } from '../config/doctors';

const doctors = [
  'dr-husni-said-habibi',
  'dr-helios-blasco', 
  'dr-jean-eric-panacciulli'
];

export default function DoctorQueueSelector({ selectedDoctor, onDoctorChange }) {
  return (
    <div className="dashboard-card">
      <h3 className="dashboard-card-title">
        📋 Sélectionner la file d'attente
      </h3>
      
      <div className="dashboard-grid">
        {/* Option pour voir toutes les files */}
        <button
          onClick={() => onDoctorChange(null)}
          className={`doctor-btn ${
            selectedDoctor === null
              ? 'bg-blue-50 border-blue-500 text-blue-800'
              : 'bg-white border-gray-200 text-gray-700 hover:bg-gray-50'
          }`}
        >
          <div className="doctor-name">📊 Toutes les files</div>
          <div className="doctor-action">Vue globale</div>
        </button>

        {/* Options pour chaque docteur */}
        {doctors.map(doctorId => {
          const doctor = getDoctorById(doctorId);
          return (
            <button
              key={doctorId}
              onClick={() => onDoctorChange(doctorId)}
              className={`doctor-btn ${
                selectedDoctor === doctorId
                  ? 'bg-blue-50 border-blue-500 text-blue-800 shadow-md'
                  : 'bg-white border-gray-200 text-gray-700 hover:bg-gray-50'
              }`}
            >
              <div className="flex items-center gap-2 mb-2">
                <span className="text-xl flex-shrink-0">{doctor?.emoji || '👨‍⚕️'}</span>
                <div className="doctor-name break-words">
                  {getDoctorDisplayName(doctorId)}
                </div>
              </div>
              <div className="doctor-action">
                {doctor?.specialite || 'Médecin généraliste'}
              </div>
              {doctor?.disponible && (
                <div className="text-xs text-green-600 mt-1 font-medium">
                  ✅ Disponible
                </div>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
} 