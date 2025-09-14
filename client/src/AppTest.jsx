import React from "react";

console.log("🧩 AppTest - Composant en cours de chargement");

function AppTest() {
  console.log("🚀 AppTest - Rendu en cours");

  return (
    <div
      style={{ padding: "20px", background: "lightblue", minHeight: "100vh" }}
    >
      <h1>Test App - ça marche !</h1>
      <p>Si vous voyez ceci, React fonctionne.</p>
      <p>Timestamp: {new Date().toLocaleTimeString()}</p>
    </div>
  );
}

console.log("✅ AppTest - Composant défini");

export default AppTest;
