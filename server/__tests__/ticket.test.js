const request = require('supertest');
const mongoose = require('mongoose');
const app = require('../index');
const Ticket = require('../models/Ticket');
const User = require('../models/User');

describe('Ticket API Tests', () => {
  beforeAll(async () => {
    await mongoose.connect(process.env.MONGO_URI_TEST || 'mongodb://localhost:27017/lineup_test');
  });

  afterAll(async () => {
    await mongoose.connection.close();
  });

  beforeEach(async () => {
    await Ticket.deleteMany({});
  });

  describe('POST /tickets', () => {
    it('devrait créer un nouveau ticket', async () => {
      const response = await request(app)
        .post('/tickets')
        .send({
          docteur: 'dr-husni-said-habibi',
          patientName: 'John Doe'
        });

      expect(response.status).toBe(201);
      expect(response.body.ticket).toBeDefined();
      expect(response.body.ticket.docteur).toBe('dr-husni-said-habibi');
    });

    it('devrait refuser un docteur invalide', async () => {
      const response = await request(app)
        .post('/tickets')
        .send({
          docteur: 'docteur-invalide',
          patientName: 'John Doe'
        });

      expect(response.status).toBe(400);
    });
  });

  describe('GET /tickets/queue/:docteur', () => {
    beforeEach(async () => {
      // Créer quelques tickets de test
      await Ticket.create([
        {
          number: 1,
          docteur: 'dr-husni-said-habibi',
          status: 'en_attente'
        },
        {
          number: 2,
          docteur: 'dr-husni-said-habibi',
          status: 'en_consultation'
        }
      ]);
    });

    it('devrait retourner la file d\'attente du docteur', async () => {
      const response = await request(app)
        .get('/tickets/queue/dr-husni-said-habibi');

      expect(response.status).toBe(200);
      expect(Array.isArray(response.body.tickets)).toBe(true);
      expect(response.body.tickets.length).toBe(2);
    });

    it('devrait filtrer par status', async () => {
      const response = await request(app)
        .get('/tickets/queue/dr-husni-said-habibi?status=en_attente');

      expect(response.status).toBe(200);
      expect(response.body.tickets.length).toBe(1);
      expect(response.body.tickets[0].status).toBe('en_attente');
    });
  });

  describe('PUT /tickets/:id/status', () => {
    let ticket;

    beforeEach(async () => {
      ticket = await Ticket.create({
        number: 1,
        docteur: 'dr-husni-said-habibi',
        status: 'en_attente'
      });
    });

    it('devrait mettre à jour le status d\'un ticket', async () => {
      const response = await request(app)
        .put(`/tickets/${ticket._id}/status`)
        .send({ status: 'en_consultation' });

      expect(response.status).toBe(200);
      expect(response.body.ticket.status).toBe('en_consultation');
    });

    it('devrait refuser un status invalide', async () => {
      const response = await request(app)
        .put(`/tickets/${ticket._id}/status`)
        .send({ status: 'status_invalide' });

      expect(response.status).toBe(400);
    });
  });
});