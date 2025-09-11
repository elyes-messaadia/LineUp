const request = require('supertest');
const mongoose = require('mongoose');
const app = require('../index');
const User = require('../models/User');
const Role = require('../models/Role');

describe('User Management Tests', () => {
  beforeAll(async () => {
    await mongoose.connect(process.env.MONGO_URI_TEST || 'mongodb://localhost:27017/lineup_test');
  });

  afterAll(async () => {
    await mongoose.connection.close();
  });

  beforeEach(async () => {
    await User.deleteMany({});
    await Role.deleteMany({});
  });

  describe('Gestion des Rôles', () => {
    it('devrait créer un rôle avec les bonnes permissions', async () => {
      const role = await Role.create({
        name: 'medecin',
        displayName: 'Médecin',
        permissions: ['call_next', 'finish_consultation', 'view_stats']
      });

      expect(role.name).toBe('medecin');
      expect(role.permissions).toContain('call_next');
    });

    it('devrait refuser un rôle avec des permissions invalides', async () => {
      try {
        await Role.create({
          name: 'test',
          displayName: 'Test',
          permissions: ['permission_invalide']
        });
        fail('Should have thrown validation error');
      } catch (error) {
        expect(error.name).toBe('ValidationError');
      }
    });
  });

  describe('Gestion des Utilisateurs', () => {
    let rolePatient;

    beforeEach(async () => {
      rolePatient = await Role.create({
        name: 'patient',
        displayName: 'Patient',
        permissions: ['create_ticket']
      });
    });

    it('devrait créer un utilisateur avec profil', async () => {
      const user = await User.create({
        email: 'test@example.com',
        password: 'hashedPassword',
        role: rolePatient._id,
        profile: {
          firstName: 'Test',
          lastName: 'User',
          phone: '0123456789'
        }
      });

      expect(user.email).toBe('test@example.com');
      expect(user.profile.firstName).toBe('Test');
    });

    it('devrait valider le format email', async () => {
      try {
        await User.create({
          email: 'invalid-email',
          password: 'hashedPassword',
          role: rolePatient._id
        });
        fail('Should have thrown validation error');
      } catch (error) {
        expect(error.name).toBe('ValidationError');
      }
    });
  });

  describe('Permissions et Accès', () => {
    let userMedecin;
    let userPatient;
    let tokenMedecin;
    let tokenPatient;

    beforeEach(async () => {
      const roleMedecin = await Role.create({
        name: 'medecin',
        displayName: 'Médecin',
        permissions: ['call_next', 'finish_consultation', 'view_stats']
      });

      const rolePatient = await Role.create({
        name: 'patient',
        displayName: 'Patient',
        permissions: ['create_ticket']
      });

      userMedecin = await User.create({
        email: 'medecin@example.com',
        password: 'hashedPassword',
        role: roleMedecin._id
      });

      userPatient = await User.create({
        email: 'patient@example.com',
        password: 'hashedPassword',
        role: rolePatient._id
      });

      tokenMedecin = generateToken(
        { userId: userMedecin._id, role: 'medecin' },
        process.env.JWT_SECRET || 'test_secret'
      );

      tokenPatient = generateToken(
        { userId: userPatient._id, role: 'patient' },
        process.env.JWT_SECRET || 'test_secret'
      );
    });

    it('devrait autoriser l\'accès médecin aux bonnes routes', async () => {
      const response = await request(app)
        .get('/dashboard/medecin/stats')
        .set('Authorization', `Bearer ${tokenMedecin}`);

      expect(response.status).toBe(200);
    });

    it('devrait refuser l\'accès patient aux routes médecin', async () => {
      const response = await request(app)
        .get('/dashboard/medecin/stats')
        .set('Authorization', `Bearer ${tokenPatient}`);

      expect(response.status).toBe(403);
    });
  });
});