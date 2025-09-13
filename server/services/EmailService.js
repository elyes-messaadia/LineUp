/**
 * 📧 Service d'Envoi d'Emails - LineUp
 * 
 * Système complet pour l'envoi d'emails transactionnels
 * Supporte Gmail, Outlook, et autres providers SMTP
 */

const nodemailer = require('nodemailer');
const logger = require('../utils/logger');

class EmailService {
  constructor() {
    this.transporter = null;
    this.initializeTransporter();
  }

  /**
   * 🔧 Initialise le transporteur email
   */
  async initializeTransporter() {
    try {
      // Configuration pour Gmail (recommandé)
      if (process.env.SMTP_SERVICE === 'gmail') {
        this.transporter = nodemailer.createTransporter({
          service: 'gmail',
          auth: {
            user: process.env.SMTP_USER,
            pass: process.env.SMTP_APP_PASSWORD, // App Password, pas le mot de passe normal
          },
        });
      } 
      // Configuration SMTP générique
      else {
        this.transporter = nodemailer.createTransporter({
          host: process.env.SMTP_HOST || 'smtp.gmail.com',
          port: parseInt(process.env.SMTP_PORT) || 587,
          secure: process.env.SMTP_SECURE === 'true',
          auth: {
            user: process.env.SMTP_USER,
            pass: process.env.SMTP_PASS,
          },
        });
      }

      // Test de connexion
      await this.transporter.verify();
      logger.info('📧 Service email initialisé avec succès');
    } catch (error) {
      logger.error('❌ Erreur initialisation service email:', error);
      this.transporter = null;
    }
  }

  /**
   * 🎨 Template HTML de base
   */
  getBaseTemplate(title, content, actionUrl = null, actionText = null) {
    return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>${title}</title>
      <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; margin: 0; padding: 0; background-color: #f9fafb; }
        .container { max-width: 600px; margin: 0 auto; background: white; }
        .header { background: linear-gradient(135deg, #0091ff, #45b3ff); color: white; padding: 2rem; text-align: center; border-radius: 12px 12px 0 0; }
        .content { padding: 2rem; }
        .footer { background: #f3f4f6; padding: 1rem 2rem; text-align: center; color: #6b7280; font-size: 0.875rem; border-radius: 0 0 12px 12px; }
        .button { display: inline-block; background: #0091ff; color: white; padding: 1rem 2rem; text-decoration: none; border-radius: 8px; font-weight: 600; margin: 1rem 0; }
        .button:hover { background: #0077e6; }
        .feature-list { list-style: none; padding: 0; }
        .feature-list li { padding: 0.5rem 0; }
        .highlight { background: #f0f7ff; padding: 1rem; border-left: 4px solid #0091ff; margin: 1rem 0; border-radius: 0 8px 8px 0; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>${title}</h1>
        </div>
        <div class="content">
          ${content}
          ${actionUrl && actionText ? `
          <div style="text-align: center; margin: 2rem 0;">
            <a href="${actionUrl}" class="button">${actionText}</a>
          </div>
          ` : ''}
        </div>
        <div class="footer">
          <p>📧 Cet email a été envoyé automatiquement par LineUp</p>
          <p>🏥 Système de gestion de file d'attente médicale</p>
          <p style="margin-top: 1rem;">
            <a href="https://lineup.netlify.app" style="color: #0091ff;">🌐 Visiter LineUp</a> |
            <a href="mailto:support@lineup.com" style="color: #0091ff;">💬 Support</a>
          </p>
        </div>
      </div>
    </body>
    </html>
    `;
  }

  /**
   * 🎉 Email de bienvenue
   */
  async sendWelcomeEmail(userEmail, userName) {
    if (!this.transporter) {
      throw new Error('Service email non disponible');
    }

    const content = `
      <h2>Bonjour ${userName} ! 👋</h2>
      <p>Nous sommes <strong>ravis</strong> de vous accueillir dans la communauté LineUp.</p>
      
      <div class="highlight">
        <h3>🚀 Votre compte est maintenant actif !</h3>
        <p>Vous pouvez dès maintenant profiter de tous nos services.</p>
      </div>

      <h3>✨ Ce que vous pouvez faire maintenant :</h3>
      <ul class="feature-list">
        <li>🎟️ <strong>Prendre des tickets</strong> en ligne en quelques clics</li>
        <li>⏳ <strong>Suivre votre position</strong> en temps réel dans la file</li>
        <li>💭 <strong>Discuter avec nos équipes</strong> via le chat intégré</li>
        <li>📱 <strong>Accéder depuis tous vos appareils</strong> (mobile, tablette, ordinateur)</li>
        <li>🔔 <strong>Recevoir des notifications</strong> sur l'évolution de votre ticket</li>
      </ul>

      <div class="highlight">
        <h3>💡 Conseil de pro</h3>
        <p>Ajoutez LineUp à vos favoris ou installez-le comme application sur votre téléphone pour un accès encore plus rapide !</p>
      </div>

      <p>Si vous avez des questions, notre équipe est là pour vous aider. N'hésitez pas à nous contacter !</p>
      
      <p style="margin-top: 2rem;">
        Bienvenue dans l'avenir de la gestion des files d'attente ! 🚀<br>
        <em>L'équipe LineUp 💙</em>
      </p>
    `;

    const mailOptions = {
      from: `"LineUp - Bienvenue ! 🎉" <${process.env.SMTP_USER}>`,
      to: userEmail,
      subject: '🎉 Bienvenue sur LineUp - Votre compte est activé !',
      html: this.getBaseTemplate(
        '🏡 Bienvenue sur LineUp !',
        content,
        'https://lineup.netlify.app/login',
        '🚀 Commencer maintenant'
      ),
    };

    try {
      const result = await this.transporter.sendMail(mailOptions);
      logger.info(`📧 Email de bienvenue envoyé à ${userEmail}`, { messageId: result.messageId });
      return result;
    } catch (error) {
      logger.error(`❌ Erreur envoi email bienvenue à ${userEmail}:`, error);
      throw error;
    }
  }

  /**
   * 🎟️ Confirmation de ticket
   */
  async sendTicketConfirmation(userEmail, ticketData) {
    if (!this.transporter) {
      throw new Error('Service email non disponible');
    }

    const { ticketNumber, doctorName, position, estimatedWait } = ticketData;
    
    const content = `
      <h2>Votre ticket a été confirmé ! 🎟️</h2>
      
      <div class="highlight">
        <h3>📋 Détails de votre ticket</h3>
        <p><strong>Numéro :</strong> #${ticketNumber}</p>
        <p><strong>Médecin :</strong> Dr. ${doctorName}</p>
        <p><strong>Position :</strong> ${position}${position === 1 ? 'er' : 'ème'} dans la file</p>
        <p><strong>Temps d'attente estimé :</strong> ${estimatedWait} minutes</p>
      </div>

      <h3>📱 Que faire maintenant ?</h3>
      <ul class="feature-list">
        <li>⏳ <strong>Suivez votre position</strong> en temps réel sur l'application</li>
        <li>🔔 <strong>Restez alerté</strong> - nous vous préviendrons quand ce sera bientôt votre tour</li>
        <li>💭 <strong>Utilisez le chat</strong> si vous avez des questions</li>
        <li>📍 <strong>Arrivez à l'heure</strong> - nous vous enverrons une notification 15 minutes avant</li>
      </ul>

      <div class="highlight">
        <h3>⚠️ Important</h3>
        <p>Gardez votre téléphone à portée de main pour recevoir les notifications. Si vous devez annuler, faites-le via l'application pour libérer votre place.</p>
      </div>

      <p>Merci de faire confiance à LineUp ! 🙏</p>
    `;

    const mailOptions = {
      from: `"LineUp - Confirmation 🎟️" <${process.env.SMTP_USER}>`,
      to: userEmail,
      subject: `🎟️ Ticket confirmé - Position n°${position} chez Dr. ${doctorName}`,
      html: this.getBaseTemplate(
        '✅ Ticket Confirmé !',
        content,
        'https://lineup.netlify.app/queue',
        '👀 Voir ma position'
      ),
    };

    try {
      const result = await this.transporter.sendMail(mailOptions);
      logger.info(`📧 Confirmation ticket envoyée à ${userEmail}`, { ticketNumber });
      return result;
    } catch (error) {
      logger.error(`❌ Erreur envoi confirmation ticket à ${userEmail}:`, error);
      throw error;
    }
  }

  /**
   * 🚨 Notification de tour arrivé
   */
  async sendTurnNotification(userEmail, userData) {
    if (!this.transporter) {
      throw new Error('Service email non disponible');
    }

    const { userName, doctorName, roomNumber } = userData;
    
    const content = `
      <h2>C'est votre tour ! 🎯</h2>
      
      <div class="highlight">
        <h3>🏃‍♂️ Présentez-vous maintenant</h3>
        <p><strong>Médecin :</strong> Dr. ${doctorName}</p>
        <p><strong>Salle :</strong> ${roomNumber || 'Voir à l\'accueil'}</p>
      </div>

      <p><strong>${userName}</strong>, votre tour est arrivé ! Présentez-vous dès maintenant à l'accueil ou directement dans la salle indiquée.</p>

      <div class="highlight">
        <h3>⏰ Attention</h3>
        <p>Si vous n'êtes pas présent(e) dans les 10 prochaines minutes, votre ticket sera automatiquement annulé pour permettre au patient suivant de passer.</p>
      </div>

      <p>Bonne consultation ! 🩺</p>
    `;

    const mailOptions = {
      from: `"LineUp - C'est votre tour ! 🎯" <${process.env.SMTP_USER}>`,
      to: userEmail,
      subject: `🎯 C'est votre tour ! Dr. ${doctorName} vous attend`,
      html: this.getBaseTemplate(
        '🎯 C\'est votre tour !',
        content,
        'https://lineup.netlify.app/queue',
        '🏃‍♂️ J\'arrive !'
      ),
    };

    try {
      const result = await this.transporter.sendMail(mailOptions);
      logger.info(`📧 Notification tour envoyée à ${userEmail}`);
      return result;
    } catch (error) {
      logger.error(`❌ Erreur envoi notification tour à ${userEmail}:`, error);
      throw error;
    }
  }

  /**
   * 🔑 Reset de mot de passe
   */
  async sendPasswordReset(userEmail, resetToken, userName) {
    if (!this.transporter) {
      throw new Error('Service email non disponible');
    }

    const resetUrl = `${process.env.CLIENT_URL}/reset-password?token=${resetToken}`;
    
    const content = `
      <h2>Réinitialisation de mot de passe 🔑</h2>
      
      <p>Bonjour <strong>${userName}</strong>,</p>
      
      <p>Vous avez demandé la réinitialisation de votre mot de passe LineUp. Cliquez sur le bouton ci-dessous pour créer un nouveau mot de passe :</p>

      <div class="highlight">
        <h3>🔐 Lien sécurisé</h3>
        <p>Ce lien est valable <strong>1 heure</strong> et ne peut être utilisé qu'une seule fois.</p>
      </div>

      <p>Si vous n'avez pas demandé cette réinitialisation, ignorez simplement cet email. Votre mot de passe actuel reste inchangé.</p>

      <div class="highlight">
        <h3>🛡️ Sécurité</h3>
        <p>Pour votre sécurité, ne partagez jamais ce lien avec personne. L'équipe LineUp ne vous demandera jamais votre mot de passe par email.</p>
      </div>
    `;

    const mailOptions = {
      from: `"LineUp - Sécurité 🔑" <${process.env.SMTP_USER}>`,
      to: userEmail,
      subject: '🔑 Réinitialisation de votre mot de passe LineUp',
      html: this.getBaseTemplate(
        '🔑 Réinitialisation de mot de passe',
        content,
        resetUrl,
        '🔐 Changer mon mot de passe'
      ),
    };

    try {
      const result = await this.transporter.sendMail(mailOptions);
      logger.info(`📧 Reset mot de passe envoyé à ${userEmail}`);
      return result;
    } catch (error) {
      logger.error(`❌ Erreur envoi reset mot de passe à ${userEmail}:`, error);
      throw error;
    }
  }

  /**
   * 📊 Récapitulatif hebdomadaire (optionnel)
   */
  async sendWeeklySummary(userEmail, summaryData) {
    if (!this.transporter) {
      throw new Error('Service email non disponible');
    }

    const { userName, ticketsCount, averageWait, favoriteDoctor } = summaryData;
    
    const content = `
      <h2>Votre semaine avec LineUp 📊</h2>
      
      <p>Bonjour <strong>${userName}</strong> !</p>
      
      <p>Voici un petit récapitulatif de votre activité cette semaine :</p>

      <div class="highlight">
        <h3>📈 Vos statistiques</h3>
        <p><strong>Tickets pris :</strong> ${ticketsCount}</p>
        <p><strong>Temps d'attente moyen :</strong> ${averageWait} minutes</p>
        <p><strong>Médecin le plus consulté :</strong> Dr. ${favoriteDoctor}</p>
      </div>

      <h3>💡 Le saviez-vous ?</h3>
      <p>Grâce à LineUp, vous avez économisé environ <strong>${ticketsCount * 15} minutes</strong> d'attente en salle cette semaine !</p>

      <p>Merci de faire confiance à LineUp pour simplifier vos rendez-vous médicaux ! 💙</p>
    `;

    const mailOptions = {
      from: `"LineUp - Récapitulatif 📊" <${process.env.SMTP_USER}>`,
      to: userEmail,
      subject: `📊 Votre semaine LineUp - ${ticketsCount} ticket${ticketsCount > 1 ? 's' : ''}`,
      html: this.getBaseTemplate(
        '📊 Récapitulatif Hebdomadaire',
        content,
        'https://lineup.netlify.app/dashboard',
        '📱 Voir mon tableau de bord'
      ),
    };

    try {
      const result = await this.transporter.sendMail(mailOptions);
      logger.info(`📧 Récapitulatif hebdo envoyé à ${userEmail}`);
      return result;
    } catch (error) {
      logger.error(`❌ Erreur envoi récapitulatif à ${userEmail}:`, error);
      throw error;
    }
  }

  /**
   * 🧪 Test du service email
   */
  async sendTestEmail(userEmail) {
    if (!this.transporter) {
      throw new Error('Service email non disponible');
    }

    const content = `
      <h2>Test du service email 🧪</h2>
      
      <p>Si vous recevez cet email, cela signifie que le service d'envoi d'emails LineUp fonctionne parfaitement !</p>

      <div class="highlight">
        <h3>✅ Configuration validée</h3>
        <p>Tous les systèmes sont opérationnels et prêts à envoyer vos notifications.</p>
      </div>

      <p>Vous pouvez maintenant profiter de toutes les fonctionnalités de notification de LineUp ! 🚀</p>
    `;

    const mailOptions = {
      from: `"LineUp - Test 🧪" <${process.env.SMTP_USER}>`,
      to: userEmail,
      subject: '🧪 Test du service email LineUp - ✅ Succès !',
      html: this.getBaseTemplate(
        '🧪 Test Email - ✅ Succès !',
        content,
        'https://lineup.netlify.app',
        '🏡 Retour à LineUp'
      ),
    };

    try {
      const result = await this.transporter.sendMail(mailOptions);
      logger.info(`📧 Email de test envoyé à ${userEmail}`);
      return result;
    } catch (error) {
      logger.error(`❌ Erreur envoi email test à ${userEmail}:`, error);
      throw error;
    }
  }

  /**
   * 🔍 Vérification du statut du service
   */
  isAvailable() {
    return this.transporter !== null;
  }
}

// Export singleton
module.exports = new EmailService();