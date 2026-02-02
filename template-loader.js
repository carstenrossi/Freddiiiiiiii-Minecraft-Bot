/**
 * Template-Loader-Modul für Minecraft-Bauvorlagen
 * 
 * Lädt JSON-Templates, übersetzt Paletten in Block-IDs und bereitet
 * Bau-Schritte vor (Rotation, Ursprung, Luftblöcke).
 */

import fs from 'fs/promises';
import path from 'path';
import { Vec3 } from 'vec3';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

class TemplateLoader {
  constructor(bot) {
    this.bot = bot;
    this.templatesDir = path.join(__dirname, 'templates');
    this.loadedTemplates = new Map();
  }

  /**
   * Lädt ein Template aus einer JSON-Datei
   * @param {string} templateName - Name der Template-Datei (ohne .json)
   * @returns {Promise<Object>} - Geladenes und verarbeitetes Template
   */
  async loadTemplate(templateName) {
    try {
      // Prüfen, ob bereits geladen
      if (this.loadedTemplates.has(templateName)) {
        return this.loadedTemplates.get(templateName);
      }

      const templatePath = path.join(this.templatesDir, `${templateName}.json`);
      const data = await fs.readFile(templatePath, 'utf8');
      const template = JSON.parse(data);

      // Template validieren
      this.validateTemplate(template);

      // Palette in Block-IDs übersetzen
      const processedTemplate = this.processTemplate(template);

      // Im Cache speichern
      this.loadedTemplates.set(templateName, processedTemplate);

      return processedTemplate;
    } catch (error) {
      throw new Error(`Fehler beim Laden des Templates '${templateName}': ${error.message}`);
    }
  }

  /**
   * Validiert die Template-Struktur
   * @param {Object} template - Zu validierendes Template
   */
  validateTemplate(template) {
    if (!template.id) throw new Error('Template fehlt ID');
    if (!template.dimensions) throw new Error('Template fehlt dimensions');
    if (!template.palette) throw new Error('Template fehlt palette');
    if (!template.steps || !Array.isArray(template.steps)) {
      throw new Error('Template fehlt steps oder steps ist kein Array');
    }

    const { width, height, depth } = template.dimensions;
    if (!width || !height || !depth) {
      throw new Error('Template dimensions unvollständig');
    }

    // Prüfe, ob alle Steps die richtige Grid-Shape haben
    template.steps.forEach((step, idx) => {
      if (!step.rows || !Array.isArray(step.rows)) {
        throw new Error(`Step ${idx + 1} fehlt rows`);
      }
      const expectedRows = depth;
      const expectedCols = width;
      
      if (step.rows.length !== expectedRows) {
        throw new Error(`Step ${idx + 1}: Erwartet ${expectedRows} Reihen, aber ${step.rows.length} gefunden`);
      }
      
      step.rows.forEach((row, rowIdx) => {
        if (row.length !== expectedCols) {
          throw new Error(`Step ${idx + 1}, Reihe ${rowIdx + 1}: Erwartet ${expectedCols} Spalten, aber ${row.length} gefunden`);
        }
      });
    });
  }

  /**
   * Verarbeitet das Template: übersetzt Palette in Block-Daten
   * @param {Object} template - Rohes Template
   * @returns {Object} - Verarbeitetes Template
   */
  processTemplate(template) {
    const processed = { ...template };
    
    // Palette übersetzen
    const translatedPalette = {};
    for (const [key, block] of Object.entries(template.palette)) {
      translatedPalette[key] = this.translateBlock(block);
    }
    processed.palette = translatedPalette;

    // Steps mit übersetzten Block-Daten versehen
    processed.buildSteps = template.steps.map(step => ({
      level: step.level,
      y: step.y,
      blocks: this.extractBlocksFromStep(step, translatedPalette, template.dimensions)
    }));

    // Overrides verarbeiten (wenn vorhanden)
    if (template.overrides_todo) {
      processed.overrideHints = template.overrides_todo;
    }

    return processed;
  }

  /**
   * Übersetzt einen Block aus der Palette in Minecraft-Block-Daten
   * @param {Object} block - Block-Definition aus Palette
   * @returns {Object} - Übersetzte Block-Daten
   */
  translateBlock(block) {
    const mcData = this.bot.mcData;
    
    if (!mcData) {
      throw new Error('minecraft-data nicht initialisiert! Bitte stelle sicher dass bot.mcData gesetzt ist.');
    }
    
    if (block.name === 'minecraft:air' || block.name === 'air') {
      return { id: 0, name: 'air', isAir: true };
    }

    try {
      const blockName = block.name.replace('minecraft:', '');
      const blockData = mcData.blocksByName[blockName];
      
      if (!blockData) {
        console.warn(`⚠️ Block '${block.name}' nicht in minecraft-data gefunden, verwende air`);
        console.warn(`   Verfügbare Blöcke: ${Object.keys(mcData.blocksByName).slice(0, 5).join(', ')}...`);
        return { id: 0, name: 'air', isAir: true };
      }

      return {
        id: blockData.id,
        name: blockData.name,
        displayName: blockData.displayName,
        state: block.state || {},
        isAir: false
      };
    } catch (error) {
      console.error(`❌ Fehler beim Übersetzen von Block '${block.name}': ${error.message}`);
      throw error; // Werfe Fehler weiter statt still zu air zu werden
    }
  }

  /**
   * Extrahiert alle Block-Positionen aus einem Step
   * @param {Object} step - Build-Step mit rows
   * @param {Object} palette - Übersetzte Palette
   * @param {Object} dimensions - Template-Dimensionen
   * @returns {Array} - Array von Block-Positionen mit Daten
   */
  extractBlocksFromStep(step, palette, dimensions) {
    const blocks = [];
    const { origin } = dimensions;

    step.rows.forEach((row, z) => {
      row.forEach((paletteKey, x) => {
        const blockData = palette[paletteKey];
        
        if (!blockData) {
          console.warn(`⚠️ Palette-Schlüssel '${paletteKey}' nicht gefunden in Level ${step.level}`);
          return;
        }

        // Luftblöcke nicht in die Build-Liste aufnehmen
        if (blockData.isAir) {
          return;
        }

        // Koordinaten basierend auf Origin berechnen
        const relPos = this.calculateRelativePosition(x, step.y, z, dimensions);

        blocks.push({
          pos: relPos,
          block: blockData,
          paletteKey
        });
      });
    });

    return blocks;
  }

  /**
   * Berechnet relative Position basierend auf Origin
   * @param {number} x - X-Koordinate im Grid
   * @param {number} y - Y-Koordinate (Höhe)
   * @param {number} z - Z-Koordinate im Grid
   * @param {Object} dimensions - Template-Dimensionen
   * @returns {Object} - {x, y, z} relative Position
   */
  calculateRelativePosition(x, y, z, dimensions) {
    const { origin, width, depth } = dimensions;
    
    // Standardmäßig: southwest = (0,0) ist südwestliche Ecke
    // north = positive Z, east = positive X
    let relX = x;
    let relZ = z;

    switch (origin) {
      case 'southwest':
        // Standard: x bleibt x, z bleibt z
        break;
      case 'southeast':
        // X invertieren
        relX = width - 1 - x;
        break;
      case 'northwest':
        // Z invertieren
        relZ = depth - 1 - z;
        break;
      case 'northeast':
        // Beide invertieren
        relX = width - 1 - x;
        relZ = depth - 1 - z;
        break;
      default:
        console.warn(`⚠️ Unbekannter Origin: ${origin}, verwende southwest`);
    }

    return { x: relX, y, z: relZ };
  }

  /**
   * Rotiert ein Template um 90°-Schritte
   * @param {Object} template - Zu rotierendes Template
   * @param {number} rotation - Rotation in Grad (0, 90, 180, 270)
   * @returns {Object} - Rotiertes Template
   */
  rotateTemplate(template, rotation) {
    if (rotation === 0) return template;
    
    const rotated = JSON.parse(JSON.stringify(template));
    const steps = rotation / 90;
    
    // TODO: Implementiere Rotation für 90°, 180°, 270°
    // Dies würde die rows transformieren und width/depth ggf. tauschen
    
    console.warn(`⚠️ Template-Rotation ist noch nicht implementiert`);
    return rotated;
  }

  /**
   * Listet alle verfügbaren Templates auf
   * @returns {Promise<Array>} - Liste der verfügbaren Template-Namen
   */
  async listTemplates() {
    try {
      const files = await fs.readdir(this.templatesDir);
      return files
        .filter(f => f.endsWith('.json'))
        .map(f => f.replace('.json', ''));
    } catch (error) {
      console.error('Fehler beim Auflisten der Templates:', error);
      return [];
    }
  }

  /**
   * Gibt Template-Informationen zurück ohne es zu laden
   * @param {string} templateName - Name des Templates
   * @returns {Promise<Object>} - Basis-Informationen (id, title, dimensions)
   */
  async getTemplateInfo(templateName) {
    try {
      const templatePath = path.join(this.templatesDir, `${templateName}.json`);
      const data = await fs.readFile(templatePath, 'utf8');
      const template = JSON.parse(data);
      
      return {
        id: template.id,
        title: template.title,
        version: template.version,
        dimensions: template.dimensions,
        blockCount: this.estimateBlockCount(template)
      };
    } catch (error) {
      throw new Error(`Fehler beim Lesen der Template-Info: ${error.message}`);
    }
  }

  /**
   * Schätzt die Anzahl der benötigten Blöcke (ohne Luft)
   * @param {Object} template - Template
   * @returns {number} - Geschätzte Anzahl der Blöcke
   */
  estimateBlockCount(template) {
    let count = 0;
    template.steps.forEach(step => {
      step.rows.forEach(row => {
        row.forEach(key => {
          if (key !== 'C6' && !template.palette[key]?.name?.includes('air')) {
            count++;
          }
        });
      });
    });
    return count;
  }
}

export default TemplateLoader;

