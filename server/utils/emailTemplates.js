/**
 * 📧 Templates d'emails pour LineUp
 * Gestion centralisée des templates HTML pour tous les types d'emails
 */

const fs = require('fs').promises;
const path = require('path');
const Handlebars = require('handlebars');

class EmailTemplates {
  constructor() {
    this.templatesPath = path.join(__dirname, '../templates');
    this.compiledTemplates = new Map();
  }

  /**
   * 📂 Charge et compile un template HTML
   */
  async loadTemplate(templateName) {
    if (this.compiledTemplates.has(templateName)) {
      return this.compiledTemplates.get(templateName);
    }

    try {
      const templatePath = path.join(this.templatesPath, `${templateName}.html`);
      const templateContent = await fs.readFile(templatePath, 'utf8');
      const compiled = Handlebars.compile(templateContent);
      
      this.compiledTemplates.set(templateName, compiled);
      return compiled;
    } catch (error) {
      console.error(`❌ Erreur chargement template ${templateName}:`, error);
      return null;
    }
  }

  /**
   * 🎨 Rendu d'un template avec données
   */
  async render(templateName, data = {}) {
    const template = await this.loadTemplate(templateName);
    if (!template) {
      throw new Error(`Template ${templateName} introuvable`);
    }

    // Données par défaut pour tous les templates
    const defaultData = {
      currentYear: new Date().getFullYear(),
      appName: 'LineUp',
      appUrl: process.env.CLIENT_URL || 'https://lineup.netlify.app',
      supportEmail: 'support@lineup.com',
      ...data
    };

    return template(defaultData);
  }

  /**
   * 🔄 Recharge tous les templates (utile en développement)
   */
  clearCache() {
    this.compiledTemplates.clear();
  }

  /**
   * 📋 Liste des templates disponibles
   */
  async getAvailableTemplates() {
    try {
      const files = await fs.readdir(this.templatesPath);
      return files
        .filter(file => file.endsWith('.html'))
        .map(file => file.replace('.html', ''));
    } catch (error) {
      console.error('❌ Erreur lecture dossier templates:', error);
      return [];
    }
  }

  /**
   * ✅ Vérifie si un template existe
   */
  async templateExists(templateName) {
    const templates = await this.getAvailableTemplates();
    return templates.includes(templateName);
  }
}

// Enregistrement des helpers Handlebars personnalisés
Handlebars.registerHelper('formatDate', function(date) {
  return new Date(date).toLocaleDateString('fr-FR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
});

Handlebars.registerHelper('formatTime', function(date) {
  return new Date(date).toLocaleTimeString('fr-FR', {
    hour: '2-digit',
    minute: '2-digit'
  });
});

Handlebars.registerHelper('plural', function(count, singular, plural) {
  return count === 1 ? singular : plural;
});

Handlebars.registerHelper('eq', function(a, b) {
  return a === b;
});

Handlebars.registerHelper('gt', function(a, b) {
  return a > b;
});

Handlebars.registerHelper('currency', function(amount) {
  return new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: 'EUR'
  }).format(amount);
});

// Export singleton
module.exports = new EmailTemplates();