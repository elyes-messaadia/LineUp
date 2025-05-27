const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
require("dotenv").config();

const app = express();
const port = process.env.PORT || 5000;

// Middleware
app.use(
  cors({
    origin: "https://ligneup.netlify.app",
    methods: ["GET", "POST", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type"],
    credentials: true,
  })
);

// MongoDB
const mongoURI = process.env.MONGO_URI;
if (!mongoURI) {
  console.error("❌ Erreur MongoDB : ❌ MONGO_URI non défini");
  process.exit(1);
}

mongoose
  .connect(mongoURI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => console.log("✅ Connexion à MongoDB réussie"))
  .catch((err) => console.error("❌ Erreur de connexion MongoDB :", err));

// === Exemple simple de modèle de ticket ===
const ticketSchema = new mongoose.Schema({
  status: {
    type: String,
    enum: ["en attente", "en consultation", "terminé", "désisté"],
    default: "en attente",
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

const Ticket = mongoose.model("Ticket", ticketSchema);

// === Routes ===

// GET - liste des tickets
app.get("/ticket", async (req, res) => {
  try {
    const tickets = await Ticket.find().sort({ createdAt: 1 });
    res.json(tickets);
  } catch (err) {
    res.status(500).json({ message: "Erreur serveur" });
  }
});

// POST - créer un ticket
app.post("/ticket", async (req, res) => {
  try {
    const newTicket = new Ticket();
    await newTicket.save();
    res.status(201).json(newTicket);
  } catch (err) {
    res.status(500).json({ message: "Erreur lors de la création du ticket" });
  }
});

// PATCH - mettre à jour un ticket (ex: changer le statut)
app.patch("/ticket/:id", async (req, res) => {
  try {
    const updated = await Ticket.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
    });
    res.json(updated);
  } catch (err) {
    res
      .status(500)
      .json({ message: "Erreur lors de la mise à jour du ticket" });
  }
});

// DELETE - supprimer un ticket
app.delete("/ticket/:id", async (req, res) => {
  try {
    await Ticket.findByIdAndDelete(req.params.id);
    res.status(204).end();
  } catch (err) {
    res.status(500).json({ message: "Erreur lors de la suppression" });
  }
});

// === Démarrage du serveur ===
app.listen(port, () => {
  console.log(`✅ API LineUp en ligne sur http://localhost:${port}`);
});
