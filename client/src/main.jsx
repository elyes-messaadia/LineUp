console.log("🔥 main.jsx - Démarrage du script");

import { createRoot } from "react-dom/client";
console.log("✅ Import React DOM réussi");

import AppTest from "./AppTest.jsx";
console.log("✅ Import AppTest réussi");

const rootElement = document.getElementById("root");
console.log("🎯 Élément root trouvé:", rootElement);

if (!rootElement) {
  console.error("❌ Élément #root introuvable !");
} else {
  const root = createRoot(rootElement);
  console.log("✅ Root React créé");
  
  root.render(<AppTest />);
  console.log("✅ Rendu React terminé");
}
