const express = require("express");
const cors = require("cors");
const connectDB = require("./config/db");
const adminRoutes = require("./routes/admin");
const patientRoutes = require("./routes/patient");

const app = express();
const PORT = process.env.PORT || 5000;

// 🌐 Middleware
app.use(cors());
app.use(express.json());

// 📦 Connexion MongoDB
connectDB();

// 📥 File d’attente (temporaire en mémoire)
let queue = [];

// 🎫 Créer un ticket
app.post("/ticket", (req, res) => {
  const ticket = {
    id: Date.now(),
    number: queue.length + 1,
    createdAt: new Date(),
    status: "en_attente",
  };
  queue.push(ticket);
  res.status(201).json(ticket);
});

// 📋 Obtenir la file d'attente
app.get("/queue", (req, res) => {
  res.json(queue);
});

// 🗑️ Désister un ticket
app.delete("/ticket/:id", (req, res) => {
  const ticketId = req.params.id;
  const ticket = queue.find((t) => String(t.id) === ticketId);

  if (ticket) {
    ticket.status = "desiste";
    res.json({ updated: ticket });
  } else {
    res.status(404).json({ message: "Ticket non trouvé" });
  }
});

// 📣 Appeler le patient suivant
app.delete("/next", (req, res) => {
  const next = queue.find((t) => t.status === "en_attente");
  if (next) {
    next.status = "en_consultation";
    res.json({ called: next });
  } else {
    res.status(404).json({ message: "Aucun ticket à appeler" });
  }
});

// ✅ Réinitialiser la file (dev uniquement)
app.delete("/reset", (req, res) => {
  queue = [];
  res.sendStatus(200);
});

// 🟣 Marquer un ticket comme terminé
app.patch("/ticket/:id/finish", (req, res) => {
  const ticketId = req.params.id;
  const ticket = queue.find((t) => String(t.id) === ticketId);

  if (ticket && ticket.status === "en_consultation") {
    ticket.status = "termine";
    res.json({ updated: ticket });
  } else {
    res.status(404).json({ message: "Ticket non trouvé ou statut invalide" });
  }
});

// 🔐 Routes API externes
app.use("/admin", adminRoutes);
app.use("/patient", patientRoutes);

// 🚀 Démarrage serveur (nécessaire pour Render)
app.listen(PORT, () => {
  console.log(`✅ API LineUp en ligne sur http://localhost:${PORT}`);
});
