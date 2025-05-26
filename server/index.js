const connectDB = require("./db");
const adminRoutes = require("./routes/admin");

/* eslint-env node */
const express = require("express");
const cors = require("cors");

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// Base de données temporaire en mémoire
let queue = [];

// POST /ticket → création d’un nouveau ticket
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

// GET /queue → liste des tickets
app.get("/queue", (req, res) => {
  res.json(queue);
});

// DELETE /ticket/:id → marquer un ticket comme "désisté"
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

// DELETE /next → appeler le prochain ticket
app.delete("/next", (req, res) => {
  const next = queue.find((t) => t.status === "en_attente");
  if (next) {
    next.status = "en_consultation";
    res.json({ called: next });
  } else {
    res.status(404).json({ message: "Aucun ticket à appeler" });
  }
});

// ✅ DELETE /reset → vider toute la file (en dev uniquement)
app.delete("/reset", (req, res) => {
  queue = [];
  res.sendStatus(200);
});

app.use("/admin", adminRoutes);
connectDB();

app.listen(PORT, () => {
  console.log(`✅ API LineUp en ligne sur http://localhost:${PORT}`);
});
