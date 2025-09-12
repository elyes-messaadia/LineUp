import React, { useState } from 'react';
import { MessageSquare, X, Minimize2, Maximize2 } from 'lucide-react';
import ChatInterface from './ChatInterface';
import UrgencyIndicator from './UrgencyIndicator';

const ChatWidget = ({ 
  patientId, 
  ticketId, 
  onUrgencyChange,
  initialPosition = 'bottom-right' 
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [urgencyLevel, setUrgencyLevel] = useState(null);
  const [urgencyAssessment, setUrgencyAssessment] = useState(null);
  const [hasUnreadMessages, setHasUnreadMessages] = useState(false);

  const handleUrgencyUpdate = (level, assessment = null) => {
    setUrgencyLevel(level);
    if (assessment) {
      setUrgencyAssessment(assessment);
    }
    
    // Notifier le composant parent du changement d'urgence
    if (onUrgencyChange) {
      onUrgencyChange(level, assessment);
    }
  };

  const toggleChat = () => {
    setIsOpen(!isOpen);
    if (!isOpen) {
      setHasUnreadMessages(false);
    }
  };

  const minimizeChat = () => {
    setIsMinimized(!isMinimized);
  };

  const getPositionClasses = () => {
    switch (initialPosition) {
      case 'bottom-left':
        return 'bottom-4 left-4';
      case 'bottom-right':
      default:
        return 'bottom-4 right-4';
    }
  };

  return (
    <>
      {/* Bouton flottant pour ouvrir le chat */}
      {!isOpen && (
        <div className={`fixed ${getPositionClasses()} z-50`}>
          <button
            onClick={toggleChat}
            className="relative bg-blue-600 hover:bg-blue-700 text-white rounded-full p-4 shadow-lg transition-all duration-200 hover:scale-105"
          >
            <MessageSquare className="h-6 w-6" />
            
            {/* Indicateur de nouveaux messages */}
            {hasUnreadMessages && (
              <div className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                !
              </div>
            )}
            
            {/* Indicateur d'urgence */}
            {urgencyLevel && urgencyLevel >= 7 && (
              <div className="absolute -top-2 -left-2 bg-red-500 text-white text-xs rounded-full h-6 w-6 flex items-center justify-center animate-pulse">
                {urgencyLevel}
              </div>
            )}
          </button>
        </div>
      )}

      {/* Fenêtre de chat */}
      {isOpen && (
        <div className={`fixed ${getPositionClasses()} z-50 transition-all duration-300`}>
          <div className={`bg-white rounded-lg shadow-2xl border border-gray-200 ${
            isMinimized ? 'w-80' : 'w-96 h-[700px]'
          }`}>
            
            {/* Header de la fenêtre de chat */}
            <div className="flex items-center justify-between p-4 bg-blue-600 text-white rounded-t-lg">
              <div className="flex items-center space-x-2">
                <MessageSquare className="h-5 w-5" />
                <span className="font-semibold">Assistant LineUp</span>
              </div>
              
              <div className="flex items-center space-x-1">
                <button
                  onClick={minimizeChat}
                  className="p-1 hover:bg-blue-700 rounded transition-colors"
                >
                  {isMinimized ? (
                    <Maximize2 className="h-4 w-4" />
                  ) : (
                    <Minimize2 className="h-4 w-4" />
                  )}
                </button>
                <button
                  onClick={toggleChat}
                  className="p-1 hover:bg-blue-700 rounded transition-colors"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>

            {/* Contenu du chat */}
            {!isMinimized && (
              <div className="h-[656px]"> {/* 700px total - 44px header */}
                <ChatInterface
                  patientId={patientId}
                  ticketId={ticketId}
                  onUrgencyUpdate={handleUrgencyUpdate}
                />
              </div>
            )}

            {/* Vue minimisée avec indicateur d'urgence */}
            {isMinimized && urgencyLevel && (
              <div className="p-3">
                <UrgencyIndicator
                  urgencyLevel={urgencyLevel}
                  urgencyAssessment={urgencyAssessment}
                  size="small"
                  showDetails={false}
                />
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
};

export default ChatWidget;