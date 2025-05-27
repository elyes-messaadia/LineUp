const mongoose = require("mongoose");

const ticketSchema = new mongoose.Schema({
  number: { type: Number, required: true },
  createdAt: { type: Date, default: Date.now },
  status: {
    type: String,
    enum: ["en_attente", "en_consultation", "desiste", "termine"],
    default: "en_attente"
  }
});

module.exports = mongoose.model("Ticket", ticketSchema);
