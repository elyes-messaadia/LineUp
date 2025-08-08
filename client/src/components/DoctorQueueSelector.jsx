import { useState } from 'react';
import { getDoctorDisplayName, getDoctorById, DOCTEURS } from '../config/doctors';
import { ClipboardList, Stethoscope, CheckCircle2 } from 'lucide-react';

const doctors = [
  'dr-husni-said-habibi',
  'dr-helios-blasco', 
  'dr-jean-eric-panacciulli'
];

export default function DoctorQueueSelector({ selectedDoctor, onDoctorChange }) {
  return (
    <div className="dashboard-card">
      <h3 className="dashboard-card-title">
        <span className="inline-flex items-center gap-2"><ClipboardList className="w-4 h-4" /> Sélectionner la file d'attente</span>
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
          <div className="doctor-name"><ClipboardList className="w-4 h-4 inline mr-1" /> Toutes les files</div>
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
                <Stethoscope className="w-4 h-4 text-blue-600" />
                <div className="doctor-name break-words">
                  {getDoctorDisplayName(doctorId)}
                </div>
              </div>
              <div className="doctor-action">
                {doctor?.specialite || 'Médecin généraliste'}
              </div>
              {doctor?.disponible && (
                <div className="text-xs text-green-600 mt-1 font-medium">
                  <span className="inline-flex items-center gap-1"><CheckCircle2 className="w-3 h-3" /> Disponible</span>
                </div>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
} 