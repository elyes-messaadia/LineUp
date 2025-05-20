/* eslint-env node */
const express = require('express');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// Base de données temporaire en mémoire
let queue = [];

// POST /ticket → création d’un nouveau ticket
app.post('/ticket', (req, res) => {
  const ticket = {
    id: Date.now(),
    number: queue.length + 1,
    createdAt: new Date(),
    status: 'en_attente' // ✅ ajout du statut ici
  };
  queue.push(ticket);
  res.status(201).json(ticket);
});


// GET /queue → liste des tickets en attente
app.get('/queue', (req, res) => {
  res.json(queue);
});

// DELETE /next → retire le prochain de la file
app.delete('/next', (req, res) => {
  const next = queue.shift();
  res.json({ called: next });
});

app.listen(PORT, () => {
  console.log(`✅ API LineUp en ligne sur http://localhost:${PORT}`);
});

// Supprimer un ticket spécifique (via ID)
app.delete('/ticket/:id', (req, res) => {
  const ticketId = req.params.id;
  const ticket = queue.find((t) => String(t.id) === ticketId);

  if (ticket) {
    ticket.status = 'desiste'; // 🟨 On ne supprime plus, on change l'état
    res.json({ updated: ticket });
  } else {
    res.status(404).json({ message: 'Ticket non trouvé' });
  }
});


