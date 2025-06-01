import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import Layout from "../components/Layout";
import AnimatedPage from "../components/AnimatedPage";
import Toast from "../components/Toast";
import { useToast } from "../hooks/useToast";

export default function Login() {
  const [formData, setFormData] = useState({
    email: "",
    password: ""
  });
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const { toasts, showSuccess, showError, removeToast } = useToast();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/auth/login`, {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "Accept": "application/json"
        },
        credentials: 'include',
        body: JSON.stringify(formData)
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || "Identifiants incorrects");
      }

      // Stocker les informations utilisateur
      localStorage.setItem("user", JSON.stringify(data.user));
      localStorage.setItem("token", data.token);
      localStorage.setItem("isAuthenticated", "true");

      showSuccess(`Connexion réussie ! Bienvenue ${data.user.fullName || data.user.firstName}`, 3000);

      // Redirection selon le rôle
      setTimeout(() => {
        const role = data.user.role?.name || 'visiteur';
        switch (role) {
          case "medecin":
            navigate("/dashboard/medecin");
            break;
          case "secretaire":
            navigate("/dashboard/secretaire");
            break;
          case "patient":
            navigate("/dashboard/patient");
            break;
          case "visiteur":
            navigate("/dashboard/visiteur");
            break;
          default:
            navigate("/");
        }
      }, 1500);

    } catch (error) {
      console.error("Erreur de connexion:", error);
      showError(error.message || "Identifiants incorrects", 5000);
      // Nettoyer le stockage local en cas d'erreur
      localStorage.removeItem("user");
      localStorage.removeItem("token");
      localStorage.removeItem("isAuthenticated");
    } finally {
      setIsLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value.trim()
    }));
  };

  const handleQuickLogin = async (credentials) => {
    setFormData(credentials);
    try {
      await handleSubmit({ preventDefault: () => {} });
    } catch (error) {
      console.error("Erreur connexion rapide:", error);
    }
  };

  return (
    <Layout>
      <AnimatedPage>
        <div className="max-w-md mx-auto">
          <h2 className="text-xl sm:text-2xl font-bold mb-6 text-center text-gray-800">
            🔐 Connexion
          </h2>

          {/* Boutons de connexion rapide */}
          {import.meta.env.MODE === 'development' && (
            <div className="mb-8 bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h3 className="font-semibold text-blue-800 mb-3">🧪 Comptes de test</h3>
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => handleQuickLogin({
                    email: "medecin@lineup.com",
                    password: "medecin123"
                  })}
                  className="p-2 bg-green-100 hover:bg-green-200 text-green-800 rounded-lg text-sm transition"
                  disabled={isLoading}
                >
                  👨‍⚕️ Médecin
                </button>
                <button
                  onClick={() => handleQuickLogin({
                    email: "secretaire@lineup.com",
                    password: "secretaire123"
                  })}
                  className="p-2 bg-purple-100 hover:bg-purple-200 text-purple-800 rounded-lg text-sm transition"
                  disabled={isLoading}
                >
                  👩‍💼 Secrétaire
                </button>
                <button
                  onClick={() => handleQuickLogin({
                    email: "patient@lineup.com",
                    password: "patient123"
                  })}
                  className="p-2 bg-blue-100 hover:bg-blue-200 text-blue-800 rounded-lg text-sm transition"
                  disabled={isLoading}
                >
                  🏥 Patient
                </button>
                <button
                  onClick={() => handleQuickLogin({
                    email: "visiteur@lineup.com",
                    password: "visiteur123"
                  })}
                  className="p-2 bg-yellow-100 hover:bg-yellow-200 text-yellow-800 rounded-lg text-sm transition"
                  disabled={isLoading}
                >
                  👁️ Visiteur
                </button>
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                📧 Email
              </label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="votre@email.com"
                disabled={isLoading}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                🔒 Mot de passe
              </label>
              <input
                type="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="••••••••"
                disabled={isLoading}
              />
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className={`w-full py-3 rounded-lg transition font-medium ${
                isLoading
                  ? "bg-gray-400 cursor-not-allowed"
                  : "bg-blue-600 hover:bg-blue-700"
              } text-white`}
            >
              {isLoading ? (
                <>
                  <span className="animate-spin inline-block mr-2">⏳</span>
                  Connexion en cours...
                </>
              ) : (
                "Se connecter"
              )}
            </button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-sm text-gray-600 mb-4">
              Pas encore de compte ?
            </p>
            <Link
              to="/register"
              className="inline-block bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition"
            >
              Créer un compte
            </Link>
          </div>

          {/* Notifications Toast */}
          {toasts.map((toast) => (
            <Toast
              key={toast.id}
              message={toast.message}
              type={toast.type}
              duration={toast.duration}
              onClose={() => removeToast(toast.id)}
            />
          ))}
        </div>
      </AnimatedPage>
    </Layout>
  );
} 