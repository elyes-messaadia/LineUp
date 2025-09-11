const request = require('supertest');
const mongoose = require('mongoose');
const app = require('../index');
const User = require('../models/User');
const Role = require('../models/Role');
const { generateToken } = require('../utils/jwtUtils');

describe('Auth API Tests', () => {
  beforeAll(async () => {
    // Connexion à la base de données de test
    await mongoose.connect(process.env.MONGO_URI_TEST || 'mongodb://localhost:27017/lineup_test');
  });

  afterAll(async () => {
    await mongoose.connection.close();
  });

  beforeEach(async () => {
    // Nettoyer la base de données avant chaque test
    await User.deleteMany({});
    await Role.deleteMany({});
  });

  describe('POST /auth/register', () => {
    it('devrait créer un nouveau patient', async () => {
      const rolePatient = await Role.create({
        name: 'patient',
        displayName: 'Patient',
        permissions: ['create_ticket']
      });

      const response = await request(app)
        .post('/auth/register')
        .send({
          firstName: 'John',
          lastName: 'Doe',
          email: 'john@example.com',
          password: 'password123',
          phone: '0123456789',
          roleName: 'patient'
        });

      expect(response.status).toBe(201);
      expect(response.body.user).toBeDefined();
      expect(response.body.user.email).toBe('john@example.com');
    });

    it('devrait refuser un email déjà utilisé', async () => {
      // Créer d'abord un utilisateur
      const rolePatient = await Role.create({
        name: 'patient',
        displayName: 'Patient',
        permissions: ['create_ticket']
      });

      await User.create({
        email: 'john@example.com',
        password: 'hashedPassword',
        role: rolePatient._id,
        profile: {
          firstName: 'John',
          lastName: 'Doe'
        }
      });

      const response = await request(app)
        .post('/auth/register')
        .send({
          firstName: 'John',
          lastName: 'Doe',
          email: 'john@example.com',
          password: 'password123',
          phone: '0123456789',
          roleName: 'patient'
        });

      expect(response.status).toBe(400);
      expect(response.body.message).toContain('existe déjà');
    });
  });

  describe('POST /auth/login', () => {
    it('devrait connecter un utilisateur avec des identifiants valides', async () => {
      // Créer un rôle et un utilisateur pour le test
      const rolePatient = await Role.create({
        name: 'patient',
        displayName: 'Patient',
        permissions: ['create_ticket']
      });

      const hashedPassword = await bcrypt.hash('password123', 10);
      await User.create({
        email: 'john@example.com',
        password: hashedPassword,
        role: rolePatient._id,
        profile: {
          firstName: 'John',
          lastName: 'Doe'
        }
      });

      const response = await request(app)
        .post('/auth/login')
        .send({
          email: 'john@example.com',
          password: 'password123'
        });

      expect(response.status).toBe(200);
      expect(response.body.token).toBeDefined();
      expect(response.body.user).toBeDefined();
    });

    it('devrait refuser des identifiants invalides', async () => {
      const response = await request(app)
        .post('/auth/login')
        .send({
          email: 'wrong@example.com',
          password: 'wrongpassword'
        });

      expect(response.status).toBe(401);
    });
  });

  describe('Middleware d\'authentification', () => {
    it('devrait autoriser l\'accès avec un token valide', async () => {
      const rolePatient = await Role.create({
        name: 'patient',
        displayName: 'Patient',
        permissions: ['create_ticket']
      });

      const user = await User.create({
        email: 'john@example.com',
        password: 'hashedPassword',
        role: rolePatient._id,
        profile: {
          firstName: 'John',
          lastName: 'Doe'
        }
      });

      const token = generateToken(
        { userId: user._id, role: 'patient' },
        process.env.JWT_SECRET || 'test_secret',
        { expiresIn: '1h' }
      );

      const response = await request(app)
        .get('/auth/verify')
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(200);
    });

    it('devrait refuser l\'accès sans token', async () => {
      const response = await request(app)
        .get('/auth/verify');

      expect(response.status).toBe(401);
    });
  });
});