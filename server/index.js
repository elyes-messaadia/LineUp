const express = require("express");
const cors = require("cors");
const connectDB = require("./config/db");
const adminRoutes = require("./routes/admin");
const patientRoutes = require("./routes/patient");
const Ticket = require("./models/Ticket");

const app = express();
const PORT = process.env.PORT || 5000;

// ✅ CORS dynamique (fonction) — compatible Render
const allowedOrigins = [
  "https://ligneup.netlify.app",
  "http://localhost:5173"
];

app.use(cors({
  origin: function (origin, callback) {
    if (!origin) return callback(null, true); // autorise Postman ou tests
    if (allowedOrigins.includes(origin)) {
      return callback(null, true);
    } else {
      return callback(new Error("Not allowed by CORS"));
    }
  },
  methods: ["GET", "POST", "PATCH", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type"]
}));

app.use(express.json());
connectDB();

// 🎫 Créer un ticket
app.post("/ticket", async (req, res) => {
  try {
    const count = await Ticket.countDocuments();
    const ticket = new Ticket({ number: count + 1 });
    await ticket.save();
    res.status(201).json(ticket);
  } catch (err) {
    res.status(500).json({ message: "Erreur serveur" });
  }
});

// 📋 Obtenir la file d'attente
app.get("/queue", async (req, res) => {
  try {
    const queue = await Ticket.find().sort({ createdAt: 1 });
    res.json(queue);
  } catch (err) {
    res.status(500).json({ message: "Erreur de récupération" });
  }
});

// 🗑️ Désister un ticket
app.delete("/ticket/:id", async (req, res) => {
  try {
    const ticket = await Ticket.findById(req.params.id);
    if (!ticket) return res.status(404).json({ message: "Ticket non trouvé" });
    ticket.status = "desiste";
    await ticket.save();
    res.json({ updated: ticket });
  } catch (err) {
    res.status(500).json({ message: "Erreur lors de l'annulation" });
  }
});

// 📣 Appeler le patient suivant
app.delete("/next", async (req, res) => {
  try {
    const next = await Ticket.findOne({ status: "en_attente" }).sort({ createdAt: 1 });
    if (next) {
      next.status = "en_consultation";
      await next.save();
      res.json({ called: next });
    } else {
      res.status(404).json({ message: "Aucun ticket à appeler" });
    }
  } catch (err) {
    res.status(500).json({ message: "Erreur lors de l'appel" });
  }
});

// ✅ Réinitialiser la file
app.delete("/reset", async (req, res) => {
  try {
    await Ticket.deleteMany();
    res.sendStatus(200);
  } catch (err) {
    res.status(500).json({ message: "Erreur lors de la réinitialisation" });
  }
});

// 🟣 Marquer un ticket comme terminé
app.patch("/ticket/:id/finish", async (req, res) => {
  try {
    const ticket = await Ticket.findById(req.params.id);
    if (ticket && ticket.status === "en_consultation") {
      ticket.status = "termine";
      await ticket.save();
      res.json({ updated: ticket });
    } else {
      res.status(404).json({ message: "Ticket non trouvé ou statut invalide" });
    }
  } catch (err) {
    res.status(500).json({ message: "Erreur serveur" });
  }
});

// 🔐 Routes API externes
app.use("/admin", adminRoutes);
app.use("/patient", patientRoutes);

// 🚀 Démarrage du serveur
app.listen(PORT, () => {
  console.log(`✅ API LineUp en ligne sur http://localhost:${PORT}`);
});
