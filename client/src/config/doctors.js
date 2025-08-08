// Configuration centralisée des docteurs
export const DOCTEURS = [
  { 
    value: 'dr-husni-said-habibi',
    id: 'dr-husni-said-habibi',
    label: 'Dr. Husni SAID HABIBI', 
    fullName: 'Dr. Husni SAID HABIBI',
    emoji: '', 
    color: 'green',
    disponible: true,
    specialite: 'Médecin généraliste',
    // Informations de connexion
    credentials: {
      username: 'husni.said.habibi',
      email: 'husni.said.habibi@lineup.medical',
      password: 'husni123' // Mot de passe de développement
    }
  },
  { 
    value: 'dr-helios-blasco',
    id: 'dr-helios-blasco',
    label: 'Dr. Helios BLASCO', 
    fullName: 'Dr. Helios BLASCO',
    emoji: '', 
    color: 'blue',
    disponible: true,
    specialite: 'Médecin généraliste',
    credentials: {
      username: 'helios.blasco',
      email: 'helios.blasco@lineup.medical',
      password: 'helios123' // Mot de passe de développement
    }
  },
  { 
    value: 'dr-jean-eric-panacciulli',
    id: 'dr-jean-eric-panacciulli',
    label: 'Dr. Jean-Eric PANACCIULLI', 
    fullName: 'Dr. Jean-Eric PANACCIULLI',
    emoji: '', 
    color: 'purple',
    disponible: true,
    specialite: 'Médecin généraliste',
    credentials: {
      username: 'jean.eric.panacciulli',
      email: 'jean.eric.panacciulli@lineup.medical',
      password: 'jeaneric123' // Mot de passe de développement
    }
  }
];

// Fonction utilitaire pour obtenir un docteur par son ID
export const getDoctorById = (id) => {
  return DOCTEURS.find(doctor => doctor.id === id || doctor.value === id);
};

// Fonction utilitaire pour obtenir tous les docteurs disponibles
export const getAvailableDoctors = () => {
  return DOCTEURS.filter(doctor => doctor.disponible);
};

// Fonction pour obtenir le nom complet d'un docteur
export const getDoctorDisplayName = (doctorId) => {
  const doctor = getDoctorById(doctorId);
  return doctor ? doctor.fullName : doctorId;
};

// Fonction pour obtenir les informations complètes d'un docteur
export const getDoctorInfo = (doctorId) => {
  return getDoctorById(doctorId);
}; 