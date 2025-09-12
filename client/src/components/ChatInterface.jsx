import React, { useState, useEffect, useRef } from "react";
import {
  Send,
  MessageCircle,
  AlertCircle,
  Clock,
  User,
  Bot,
} from "lucide-react";

const ChatInterface = ({ patientId, ticketId, onUrgencyUpdate }) => {
  const [conversation, setConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [error, setError] = useState(null);
  const messagesEndRef = useRef(null);

  // Démarrer ou récupérer la conversation existante
  useEffect(() => {
    initializeChat();
  }, [patientId, ticketId]);

  // Auto-scroll vers le bas lors de nouveaux messages
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const initializeChat = async () => {
    try {
      setIsLoading(true);
      const response = await fetch("/api/conversations/start", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        body: JSON.stringify({ ticketId }),
      });

      const data = await response.json();

      if (data.success) {
        setConversation(data.conversation);
        setMessages(data.conversation.messages || []);

        // Notifier le parent du niveau d'urgence initial
        if (onUrgencyUpdate && data.conversation.urgencyLevel) {
          onUrgencyUpdate(data.conversation.urgencyLevel);
        }
      } else {
        setError(data.message || "Erreur lors de l'initialisation du chat");
      }
    } catch (error) {
      console.error("Erreur d'initialisation:", error);
      setError("Impossible de se connecter au service de chat");
    } finally {
      setIsLoading(false);
    }
  };

  const sendMessage = async () => {
    if (!newMessage.trim() || isLoading || !conversation) return;

    const messageContent = newMessage.trim();
    setNewMessage("");
    setIsLoading(true);
    setIsTyping(true);

    // Ajouter le message utilisateur immédiatement pour une meilleure UX
    const userMessage = {
      _id: Date.now().toString(),
      sender: "patient",
      content: messageContent,
      timestamp: new Date(),
      metadata: {},
    };
    setMessages((prev) => [...prev, userMessage]);

    try {
      const response = await fetch(
        `/api/conversations/${conversation._id}/messages`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
          body: JSON.stringify({
            content: messageContent,
            metadata: {},
          }),
        }
      );

      const data = await response.json();

      if (data.success) {
        // Mettre à jour avec la conversation complète du serveur
        setMessages(data.conversation.messages || []);
        setConversation(data.conversation);

        // Notifier des changements d'urgence
        if (onUrgencyUpdate && data.conversation.urgencyLevel) {
          onUrgencyUpdate(data.conversation.urgencyLevel);
        }
      } else {
        setError(data.message || "Erreur lors de l'envoi du message");
        // Retirer le message utilisateur en cas d'erreur
        setMessages((prev) =>
          prev.filter((msg) => msg._id !== userMessage._id)
        );
      }
    } catch (error) {
      console.error("Erreur d'envoi:", error);
      setError("Impossible d'envoyer le message");
      setMessages((prev) => prev.filter((msg) => msg._id !== userMessage._id));
    } finally {
      setIsLoading(false);
      setIsTyping(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const handleQuickResponse = (option) => {
    setNewMessage(option.label || option.value);
    // Auto-envoyer pour les réponses rapides
    setTimeout(() => sendMessage(), 100);
  };

  const getUrgencyColor = (level) => {
    if (level >= 8) return "text-red-600 bg-red-50";
    if (level >= 6) return "text-orange-600 bg-orange-50";
    if (level >= 4) return "text-yellow-600 bg-yellow-50";
    return "text-green-600 bg-green-50";
  };

  const formatTime = (timestamp) => {
    return new Date(timestamp).toLocaleTimeString("fr-FR", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  if (error) {
    return (
      <div className="flex items-center justify-center h-96 bg-red-50 rounded-lg">
        <div className="text-center">
          <AlertCircle className="mx-auto h-12 w-12 text-red-400 mb-4" />
          <h3 className="text-lg font-medium text-red-800 mb-2">
            Erreur de connexion
          </h3>
          <p className="text-red-600">{error}</p>
          <button
            onClick={initializeChat}
            className="mt-4 px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
          >
            Réessayer
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-[600px] bg-white rounded-lg border border-gray-200 shadow-sm">
      {/* Header du chat */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200 bg-blue-50">
        <div className="flex items-center space-x-3">
          <MessageCircle className="h-6 w-6 text-blue-600" />
          <div>
            <h3 className="text-lg font-medium text-gray-900">
              Assistant LineUp
            </h3>
            <p className="text-sm text-gray-500">
              Évaluation de votre situation médicale
            </p>
          </div>
        </div>

        {conversation?.urgencyLevel && (
          <div
            className={`px-3 py-1 rounded-full text-sm font-medium ${getUrgencyColor(
              conversation.urgencyLevel
            )}`}
          >
            Urgence: {conversation.urgencyLevel}/10
          </div>
        )}
      </div>

      {/* Zone des messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {isLoading && messages.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        ) : (
          messages.map((message, index) => (
            <div
              key={message._id || index}
              className={`flex ${
                message.sender === "patient" ? "justify-end" : "justify-start"
              }`}
            >
              <div
                className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                  message.sender === "patient"
                    ? "bg-blue-600 text-white"
                    : "bg-gray-100 text-gray-900"
                }`}
              >
                <div className="flex items-start space-x-2">
                  {message.sender === "ia" && (
                    <Bot className="h-4 w-4 mt-0.5 text-blue-600" />
                  )}
                  {message.sender === "patient" && (
                    <User className="h-4 w-4 mt-0.5 text-blue-100" />
                  )}
                  <div className="flex-1">
                    <p className="text-sm">{message.content}</p>
                    <p
                      className={`text-xs mt-1 ${
                        message.sender === "patient"
                          ? "text-blue-100"
                          : "text-gray-500"
                      }`}
                    >
                      {formatTime(message.timestamp)}
                    </p>
                  </div>
                </div>

                {/* Options de réponse rapide */}
                {message.sender === "ia" && message.metadata?.options && (
                  <div className="mt-3 space-y-2">
                    {message.metadata.options.map((option, optIndex) => (
                      <button
                        key={optIndex}
                        onClick={() => handleQuickResponse(option)}
                        className="w-full text-left px-3 py-2 text-xs bg-white text-gray-700 rounded border hover:bg-gray-50 transition-colors"
                        disabled={isLoading}
                      >
                        {option.label || option.value}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ))
        )}

        {isTyping && (
          <div className="flex justify-start">
            <div className="bg-gray-100 rounded-lg px-4 py-2">
              <div className="flex items-center space-x-1">
                <Bot className="h-4 w-4 text-blue-600" />
                <div className="flex space-x-1">
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                  <div
                    className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
                    style={{ animationDelay: "0.1s" }}
                  ></div>
                  <div
                    className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
                    style={{ animationDelay: "0.2s" }}
                  ></div>
                </div>
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Zone de saisie */}
      <div className="border-t border-gray-200 p-4">
        <div className="flex items-end space-x-2">
          <div className="flex-1">
            <textarea
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Décrivez votre situation..."
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
              rows={2}
              disabled={isLoading || conversation?.status === "termine"}
            />
          </div>
          <button
            onClick={sendMessage}
            disabled={
              !newMessage.trim() ||
              isLoading ||
              conversation?.status === "termine"
            }
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <Send className="h-4 w-4" />
          </button>
        </div>

        {conversation?.status === "termine" && (
          <div className="mt-2 p-2 bg-green-50 border border-green-200 rounded text-sm text-green-700">
            <div className="flex items-center space-x-1">
              <Clock className="h-4 w-4" />
              <span>
                Évaluation terminée. Un membre de notre équipe va prendre
                contact avec vous.
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ChatInterface;
