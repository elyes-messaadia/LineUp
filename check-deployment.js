const fetch = require("node-fetch");

async function checkDeploymentStatus() {
  console.log("🔍 Vérification du statut de déploiement...\n");

  const services = [
    {
      name: "Backend Render (Health Check)",
      url: "https://lineup-backend-xxak.onrender.com/health",
    },
    {
      name: "Backend Render (Root)",
      url: "https://lineup-backend-xxak.onrender.com/",
    },
    {
      name: "Frontend Netlify",
      url: "https://ligneup.netlify.app/",
    },
  ];

  for (const service of services) {
    try {
      console.log(`Testing ${service.name}...`);
      const response = await fetch(service.url, {
        method: "GET",
        timeout: 10000,
        headers: {
          "User-Agent": "Deployment-Check/1.0",
        },
      });

      console.log(
        `✅ ${service.name}: ${response.status} ${response.statusText}`
      );

      if (response.headers.get("content-type")?.includes("application/json")) {
        const data = await response.json();
        console.log(`   Response:`, JSON.stringify(data, null, 2));
      }
    } catch (error) {
      console.log(`❌ ${service.name}: ${error.message}`);
    }
    console.log("");
  }
}

checkDeploymentStatus();
