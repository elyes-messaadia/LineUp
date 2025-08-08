import React from 'react';

/**
 * Composant helper pour démontrer les améliorations responsives
 * Ce composant peut être utilisé pour tester les différentes tailles d'écran
 */
export default function ResponsiveHelper() {
  return (
    <div className="dashboard-container">
      <div className="dashboard-card">
        <h2 className="dashboard-title text-purple-800">
          Améliorations Responsives - LineUp
        </h2>
        
        {/* Nouvelles classes CSS responsives */}
        <div className="dashboard-section">
          <h3 className="text-responsive-lg font-semibold text-gray-800 mb-4">
            Nouvelles classes CSS responsives
          </h3>
          
          <div className="info-grid">
            <div className="stats-card border-blue-200">
              <div className="text-responsive-sm text-blue-600 font-medium">Système de grille</div>
              <div className="text-responsive-base text-blue-800">dashboard-grid, stats-grid, actions-grid</div>
            </div>
            
            <div className="stats-card border-green-200">
              <div className="text-responsive-sm text-green-600 font-medium">Composants UI</div>
              <div className="text-responsive-base text-green-800">dashboard-card, ticket-card, alert-card</div>
            </div>
            
            <div className="stats-card border-purple-200">
              <div className="text-responsive-sm text-purple-600 font-medium">Boutons</div>
              <div className="text-responsive-base text-purple-800">action-button avec variantes</div>
            </div>
            
            <div className="stats-card border-yellow-200">
              <div className="text-responsive-sm text-yellow-600 font-medium">Typographie</div>
              <div className="text-responsive-base text-yellow-800">text-responsive-sm/base/lg</div>
            </div>
          </div>
        </div>

        {/* Breakpoints optimisés */}
        <div className="dashboard-section">
          <h3 className="text-responsive-lg font-semibold text-gray-800 mb-4">
            Breakpoints optimisés
          </h3>
          
          <div className="space-y-3">
            <div className="alert-card bg-red-50 border border-red-200">
              <h4 className="text-responsive-base font-semibold text-red-800">≤ 320px - iPhone SE 1ère génération</h4>
              <p className="text-responsive-sm text-red-700">Layout ultra-compact, police 14px, padding réduit</p>
            </div>
            
            <div className="alert-card bg-orange-50 border border-orange-200">
              <h4 className="text-responsive-base font-semibold text-orange-800">≤ 375px - iPhone SE, iPhone 12 mini</h4>
              <p className="text-responsive-sm text-orange-700">Police 15px, espacements optimisés</p>
            </div>
            
            <div className="alert-card bg-yellow-50 border border-yellow-200">
              <h4 className="text-responsive-base font-semibold text-yellow-800">≤ 390px - iPhone 12/13/14</h4>
              <p className="text-responsive-sm text-yellow-700">Police 15.5px, boutons optimisés</p>
            </div>
            
            <div className="alert-card bg-green-50 border border-green-200">
              <h4 className="text-responsive-base font-semibold text-green-800">≤ 430px - iPhone 14/15 Pro Max</h4>
              <p className="text-responsive-sm text-green-700">Navigation compacte, grilles simplifiées</p>
            </div>
            
            <div className="alert-card bg-blue-50 border border-blue-200">
              <h4 className="text-responsive-base font-semibold text-blue-800">≥ 640px - Tablettes et plus</h4>
              <p className="text-responsive-sm text-blue-700">Grilles multi-colonnes, espacements augmentés</p>
            </div>
          </div>
        </div>

        {/* Dashboards améliorés */}
        <div className="dashboard-section">
          <h3 className="text-responsive-lg font-semibold text-gray-800 mb-4">
            Dashboards modernisés
          </h3>
          
          <div className="dashboard-grid">
            <div className="ticket-card bg-blue-50 border-blue-200">
              <h4 className="text-responsive-base font-semibold text-blue-800">PatientDashboard</h4>
              <p className="text-responsive-sm text-blue-700">Grille moderne pour les informations de ticket, actions responsives</p>
            </div>
            
            <div className="ticket-card bg-purple-50 border-purple-200">
              <h4 className="text-responsive-base font-semibold text-purple-800">VisiteurDashboard</h4>
              <p className="text-responsive-sm text-purple-700">Statistiques temps réel, analyse de journée, aide contextuelle</p>
            </div>
            
            <div className="ticket-card bg-pink-50 border-pink-200">
              <h4 className="text-responsive-base font-semibold text-pink-800">SecretaireDashboard</h4>
              <p className="text-responsive-sm text-pink-700">Actions par médecin, état des consultations, file détaillée</p>
            </div>
            
            <div className="ticket-card bg-green-50 border-green-200">
              <h4 className="text-responsive-base font-semibold text-green-800">MedecinDashboard</h4>
              <p className="text-responsive-sm text-green-700">Statut consultation, prochain patient, actions principales</p>
            </div>
          </div>
        </div>

        {/* Optimisations pour anciens appareils */}
        <div className="dashboard-section">
          <h3 className="text-responsive-lg font-semibold text-gray-800 mb-4">
            Optimisations pour anciens appareils
          </h3>
          
          <div className="info-grid">
            <div className="help-text">
              <h4 className="text-responsive-base font-semibold mb-2">Compatibilité étendue</h4>
              <p className="text-responsive-sm">
                Support des anciens modèles Android, iPhone SE, avec optimisations de performance
                et réduction des animations coûteuses.
              </p>
            </div>
            
            <div className="help-text">
              <h4 className="text-responsive-base font-semibold mb-2">Accessibilité</h4>
              <p className="text-responsive-sm">
                Zones de touch agrandies (44px min), contrastes améliorés, 
                navigation clavier optimisée.
              </p>
            </div>
          </div>
        </div>

        {/* Exemples de classes */}
        <div className="dashboard-section">
          <h3 className="text-responsive-lg font-semibold text-gray-800 mb-4">
            Exemples d'utilisation
          </h3>
          
          <div className="space-y-4">
            <div className="alert-card bg-gray-50 border border-gray-200">
              <h4 className="text-responsive-base font-semibold text-gray-800 mb-2">Layout de base</h4>
              <code className="text-responsive-sm text-gray-700 block">
                {`<div className="dashboard-container overflow-protection">
  <div className="dashboard-card">
    <h1 className="dashboard-title">Titre</h1>
    <p className="dashboard-subtitle">Sous-titre</p>
  </div>
</div>`}
              </code>
            </div>
            
            <div className="alert-card bg-gray-50 border border-gray-200">
              <h4 className="text-responsive-base font-semibold text-gray-800 mb-2">Statistiques</h4>
              <code className="text-responsive-sm text-gray-700 block">
                {`<div className="stats-grid">
  <div className="stats-card">
    <div className="stats-number">42</div>
    <div className="stats-label">En attente</div>
  </div>
</div>`}
              </code>
            </div>
            
            <div className="alert-card bg-gray-50 border border-gray-200">
              <h4 className="text-responsive-base font-semibold text-gray-800 mb-2">Actions</h4>
              <code className="text-responsive-sm text-gray-700 block">
                {`<div className="actions-grid">
  <button className="action-button action-button-primary">
    Action principale
  </button>
</div>`}
              </code>
            </div>
          </div>
        </div>

        {/* Résultats */}
        <div className="alert-card bg-green-50 border border-green-200">
          <h3 className="text-responsive-lg font-semibold text-green-800 mb-3">
            Résultats obtenus
          </h3>
          <ul className="space-y-2 text-responsive-sm text-green-700">
            <li>• <strong>100% responsive</strong> sur tous les appareils mobiles</li>
            <li>• <strong>Lisibilité améliorée</strong> avec des tailles de police adaptatives</li>
            <li>• <strong>Navigation optimisée</strong> pour les écrans tactiles</li>
            <li>• <strong>Performance maintenue</strong> même sur anciens appareils</li>
            <li>• <strong>Accessibilité renforcée</strong> conforme aux standards</li>
            <li>• <strong>UX cohérente</strong> sur tous les dashboards</li>
          </ul>
        </div>
      </div>
    </div>
  );
} 