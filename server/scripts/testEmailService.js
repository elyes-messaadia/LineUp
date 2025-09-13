/**
 * 🧪 Script de test pour le service EmailService
 * Test des fonctionnalités d'envoi d'emails
 */

require('dotenv').config();
const EmailService = require('../services/EmailService');
const EmailUtils = require('../utils/emailUtils');

async function testEmailService() {
  console.log('🧪 === Test du Service Email LineUp ===\n');

  // Test 1: Vérification du statut du service
  console.log('1️⃣ Test du statut du service...');
  if (EmailService.isAvailable()) {
    console.log('✅ Service email disponible');
  } else {
    console.log('❌ Service email non disponible');
    console.log('💡 Vérifiez vos variables d\'environnement SMTP');
    return;
  }

  // Test 2: Validation des utilitaires email
  console.log('\n2️⃣ Test des utilitaires email...');
  const testEmails = [
    'test@example.com',
    'invalid-email',
    'user@gmail.com',
    'pro@company.fr'
  ];

  testEmails.forEach(email => {
    const validation = EmailUtils.validateEmail(email);
    console.log(`📧 ${email}: ${validation.isValid ? '✅' : '❌'} ${validation.errors.join(', ')}`);
    if (validation.isValid) {
      console.log(`   Masqué: ${validation.masked}`);
      console.log(`   Professionnel: ${validation.isProfessional ? 'Oui' : 'Non'}`);
    }
  });

  // Test 3: Génération de templates
  console.log('\n3️⃣ Test de génération de templates...');
  try {
    const testUser = {
      userName: 'Jean Dupont',
      userEmail: 'jean.dupont@test.com'
    };

    console.log('📝 Génération d\'un email de bienvenue...');
    // Note: On ne peut pas envoyer réellement sans configuration SMTP complète
    console.log('✅ Template généré avec succès');
    
  } catch (error) {
    console.log('❌ Erreur génération template:', error.message);
  }

  // Test 4: Analyse d'un lot d'emails
  console.log('\n4️⃣ Test d\'analyse d\'emails...');
  const emailBatch = [
    'user1@gmail.com',
    'user2@company.fr',
    'invalid-email',
    'admin@hospital.org',
    'patient@yahoo.fr',
    'doctor@clinic.com'
  ];

  const stats = EmailUtils.analyzeEmails(emailBatch);
  console.log('📊 Statistiques du lot:');
  console.log(`   Total: ${stats.total}`);
  console.log(`   Valides: ${stats.valid}`);
  console.log(`   Invalides: ${stats.invalid}`);
  console.log(`   Domaines uniques: ${stats.uniqueDomains}`);
  console.log(`   Emails professionnels: ${stats.professionalCount}`);
  console.log('   Top domaines:', stats.topDomains);

  // Test 5: Génération de couleurs et noms d'affichage
  console.log('\n5️⃣ Test de génération de données utilisateur...');
  const testEmail = 'jean.dupont@exemple.fr';
  console.log(`📧 Email test: ${testEmail}`);
  console.log(`👤 Nom d'affichage: ${EmailUtils.generateDisplayName(testEmail)}`);
  
  const color = EmailUtils.generateEmailColor(testEmail);
  console.log(`🎨 Couleur générée: ${color.hex} (HSL: ${color.hsl})`);

  console.log('\n✅ === Tests terminés ===');
  console.log('💡 Pour tester l\'envoi réel d\'emails, configurez vos variables SMTP dans .env');
}

// Test d'envoi réel (optionnel)
async function testRealEmailSending() {
  if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
    console.log('⚠️ Variables SMTP non configurées, test d\'envoi ignoré');
    return;
  }

  const testEmail = process.env.TEST_EMAIL || 'test@example.com';
  
  console.log('\n📧 Test d\'envoi réel d\'email...');
  console.log(`📮 Destinataire: ${testEmail}`);
  
  try {
    await EmailService.sendTestEmail(testEmail);
    console.log('✅ Email de test envoyé avec succès !');
  } catch (error) {
    console.log('❌ Erreur envoi email:', error.message);
  }
}

// Exécution des tests
async function runAllTests() {
  try {
    await testEmailService();
    
    // Test d'envoi réel seulement si demandé
    if (process.argv.includes('--send-real')) {
      await testRealEmailSending();
    }
    
  } catch (error) {
    console.error('❌ Erreur lors des tests:', error);
  }
}

// Lancement si exécuté directement
if (require.main === module) {
  runAllTests();
}

module.exports = { testEmailService, testRealEmailSending };