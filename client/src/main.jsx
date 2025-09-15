console.log("🔥 main.jsx - Démarrage du script");

import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
console.log("✅ Import React DOM réussi");

import App from "./App.jsx";
import { AuthProvider } from "./contexts/AuthContext";
console.log("✅ Import App et AuthContext réussis");

const rootElement = document.getElementById("root");
console.log("🎯 Élément root trouvé:", rootElement);

if (!rootElement) {
  console.error("❌ Élément #root introuvable !");
} else {
  const root = createRoot(rootElement);
  console.log("✅ Root React créé");

  root.render(
    <BrowserRouter>
      <AuthProvider>
        <App />
      </AuthProvider>
    </BrowserRouter>
  );
  console.log("✅ Rendu React terminé");
}
