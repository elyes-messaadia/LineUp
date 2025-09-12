import React from "react";
import { AlertTriangle, Clock, CheckCircle, AlertCircle } from "lucide-react";

const UrgencyIndicator = ({
  urgencyLevel,
  urgencyAssessment,
  size = "medium",
  showDetails = true,
}) => {
  const getUrgencyConfig = (level) => {
    if (level >= 8) {
      return {
        color: "red",
        icon: AlertTriangle,
        label: "Urgence Élevée",
        bgColor: "bg-red-50",
        textColor: "text-red-700",
        borderColor: "border-red-200",
        iconColor: "text-red-500",
        action: "Consultation immédiate recommandée",
      };
    } else if (level >= 6) {
      return {
        color: "orange",
        icon: AlertCircle,
        label: "Priorité Haute",
        bgColor: "bg-orange-50",
        textColor: "text-orange-700",
        borderColor: "border-orange-200",
        iconColor: "text-orange-500",
        action: "Consultation prioritaire",
      };
    } else if (level >= 4) {
      return {
        color: "yellow",
        icon: Clock,
        label: "Priorité Normale",
        bgColor: "bg-yellow-50",
        textColor: "text-yellow-700",
        borderColor: "border-yellow-200",
        iconColor: "text-yellow-500",
        action: "Attente normale",
      };
    } else {
      return {
        color: "green",
        icon: CheckCircle,
        label: "Priorité Faible",
        bgColor: "bg-green-50",
        textColor: "text-green-700",
        borderColor: "border-green-200",
        iconColor: "text-green-500",
        action: "Peut attendre",
      };
    }
  };

  const getSizeClasses = () => {
    switch (size) {
      case "small":
        return {
          container: "p-2",
          icon: "h-4 w-4",
          title: "text-sm font-medium",
          score: "text-lg font-bold",
          subtitle: "text-xs",
        };
      case "large":
        return {
          container: "p-6",
          icon: "h-8 w-8",
          title: "text-lg font-semibold",
          score: "text-3xl font-bold",
          subtitle: "text-sm",
        };
      default:
        return {
          container: "p-4",
          icon: "h-6 w-6",
          title: "text-base font-semibold",
          score: "text-2xl font-bold",
          subtitle: "text-sm",
        };
    }
  };

  if (!urgencyLevel) {
    return (
      <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg">
        <div className="flex items-center space-x-2 text-gray-500">
          <Clock className="h-5 w-5" />
          <span className="text-sm">Évaluation en cours...</span>
        </div>
      </div>
    );
  }

  const config = getUrgencyConfig(urgencyLevel);
  const sizeClasses = getSizeClasses();
  const IconComponent = config.icon;

  return (
    <div
      className={`${config.bgColor} ${config.borderColor} border rounded-lg ${sizeClasses.container}`}
    >
      <div className="flex items-start space-x-3">
        <div className={`${config.iconColor} mt-1`}>
          <IconComponent className={sizeClasses.icon} />
        </div>

        <div className="flex-1">
          <div className="flex items-center justify-between">
            <h3 className={`${config.textColor} ${sizeClasses.title}`}>
              {config.label}
            </h3>
            <div className={`${config.textColor} ${sizeClasses.score}`}>
              {urgencyLevel}/10
            </div>
          </div>

          {showDetails && (
            <div className="mt-2 space-y-1">
              <p
                className={`${config.textColor} ${sizeClasses.subtitle} font-medium`}
              >
                {config.action}
              </p>

              {urgencyAssessment && (
                <div className="space-y-1">
                  {urgencyAssessment.reasoning && (
                    <p className={`text-gray-600 ${sizeClasses.subtitle}`}>
                      {urgencyAssessment.reasoning}
                    </p>
                  )}

                  {urgencyAssessment.confidenceScore && (
                    <div className="flex items-center space-x-2">
                      <span className={`text-gray-500 ${sizeClasses.subtitle}`}>
                        Confiance:
                      </span>
                      <div className="flex-1 bg-gray-200 rounded-full h-2">
                        <div
                          className={`bg-${config.color}-400 h-2 rounded-full`}
                          style={{
                            width: `${Math.round(
                              urgencyAssessment.confidenceScore * 100
                            )}%`,
                          }}
                        />
                      </div>
                      <span className={`text-gray-600 ${sizeClasses.subtitle}`}>
                        {Math.round(urgencyAssessment.confidenceScore * 100)}%
                      </span>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Barre de progression visuelle pour le niveau d'urgence */}
      {showDetails && (
        <div className="mt-3">
          <div className="flex justify-between text-xs text-gray-500 mb-1">
            <span>Faible</span>
            <span>Élevée</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className={`bg-gradient-to-r from-green-400 via-yellow-400 via-orange-400 to-red-500 h-2 rounded-full transition-all duration-500`}
              style={{ width: `${(urgencyLevel / 10) * 100}%` }}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default UrgencyIndicator;
