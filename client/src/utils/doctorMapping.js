// Mapping des utilisateurs médecins vers leurs dashboards spécifiques
export const getDoctorDashboardRoute = (user) => {
  if (!user || user.role?.name !== "medecin") {
    return "/dashboard/medecin"; // Dashboard générique par défaut
  }

  // Mapping basé sur le nom d'utilisateur ou l'email
  const mappings = {
    // Par username
    'husni.said.habibi': '/dashboard/dr-husni-said-habibi',
    'helios.blasco': '/dashboard/dr-helios-blasco',
    'jean.eric.panacciulli': '/dashboard/dr-jean-eric-panacciulli',
    
    // Par email (au cas où)
    'husni.said.habibi@lineup.medical': '/dashboard/dr-husni-said-habibi',
    'helios.blasco@lineup.medical': '/dashboard/dr-helios-blasco',
    'jean.eric.panacciulli@lineup.medical': '/dashboard/dr-jean-eric-panacciulli',
    
    // Par nom complet (fallback)
    'dr. husni said habibi': '/dashboard/dr-husni-said-habibi',
    'dr. helios blasco': '/dashboard/dr-helios-blasco',
    'dr. jean-eric panacciulli': '/dashboard/dr-jean-eric-panacciulli',
  };

  // Essayer plusieurs identifiants
  const identifiers = [
    user.username?.toLowerCase(),
    user.email?.toLowerCase(),
    user.firstName && user.lastName ? `dr. ${user.firstName} ${user.lastName}`.toLowerCase() : null,
    user.name?.toLowerCase()
  ].filter(Boolean);

  for (const identifier of identifiers) {
    if (mappings[identifier]) {
      return mappings[identifier];
    }
  }

  // Si aucun mapping trouvé, retourner le dashboard générique
  return "/dashboard/medecin";
};

// Obtenir l'ID du docteur basé sur l'utilisateur
export const getDoctorIdFromUser = (user) => {
  if (!user || user.role?.name !== "medecin") {
    return null;
  }

  const mappings = {
    'husni.said.habibi': 'dr-husni-said-habibi',
    'helios.blasco': 'dr-helios-blasco',
    'jean.eric.panacciulli': 'dr-jean-eric-panacciulli',
    'husni.said.habibi@lineup.medical': 'dr-husni-said-habibi',
    'helios.blasco@lineup.medical': 'dr-helios-blasco',
    'jean.eric.panacciulli@lineup.medical': 'dr-jean-eric-panacciulli',
  };

  const identifiers = [
    user.username?.toLowerCase(),
    user.email?.toLowerCase()
  ].filter(Boolean);

  for (const identifier of identifiers) {
    if (mappings[identifier]) {
      return mappings[identifier];
    }
  }

  return null;
} 