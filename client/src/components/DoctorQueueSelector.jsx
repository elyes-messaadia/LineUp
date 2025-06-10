import { useState } from 'react';
import { getDoctorDisplayName } from '../config/doctors';

const doctors = [
  'dr-husni-said-habibi',
  'dr-helios-blasco', 
  'dr-jean-eric-panacciulli'
];

export default function DoctorQueueSelector({ selectedDoctor, onDoctorChange }) {
  return (
    <div className="bg-white rounded-lg shadow-md p-6 mb-6">
      <h3 className="text-lg font-semibold text-gray-800 mb-4">
        📋 Sélectionner la file d'attente
      </h3>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Option pour voir toutes les files */}
        <button
          onClick={() => onDoctorChange(null)}
          className={`p-4 rounded-lg border-2 transition-all duration-200 text-left ${
            selectedDoctor === null
              ? 'border-blue-500 bg-blue-50 text-blue-800'
              : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
          }`}
        >
          <div className="font-semibold">📊 Toutes les files</div>
          <div className="text-sm text-gray-600 mt-1">Vue globale</div>
        </button>

        {/* Options pour chaque docteur */}
        {doctors.map(doctorId => (
          <button
            key={doctorId}
            onClick={() => onDoctorChange(doctorId)}
            className={`p-4 rounded-lg border-2 transition-all duration-200 text-left ${
              selectedDoctor === doctorId
                ? 'border-blue-500 bg-blue-50 text-blue-800'
                : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
            }`}
          >
            <div className="font-semibold">
              👨‍⚕️ {getDoctorDisplayName(doctorId)}
            </div>
            <div className="text-sm text-gray-600 mt-1">
              File spécifique
            </div>
          </button>
        ))}
      </div>
    </div>
  );
} 