/**
 * Build-Site-Finder - Findet geeignete Bauflächen für Templates
 * 
 * Scannt das Terrain, prüft Fundament und Luftraum, schlägt ggf.
 * Terraforming vor.
 */

import { Vec3 } from 'vec3';

class BuildSiteFinder {
  constructor(bot) {
    this.bot = bot;
  }

  /**
   * Findet eine geeignete Baufläche für ein Template
   * @param {Object} template - Geladenes Template
   * @param {Vec3} startPos - Startposition für die Suche
   * @param {number} radius - Suchradius
   * @returns {Promise<Object>} - {success, position, issues, terraformNeeded}
   */
  async findBuildSite(template, startPos, radius = 32) {
    const { width, depth, height } = template.dimensions;
    
    console.log(`🔍 Suche Baufläche für ${width}x${depth}x${height} Template...`);

    // Teste verschiedene Positionen in spiralförmigem Muster
    const testPositions = this.generateTestPositions(startPos, radius, 2);

    for (const pos of testPositions) {
      const result = await this.evaluateSite(template, pos);
      
      if (result.success) {
        console.log(`✅ Geeignete Baufläche gefunden bei ${pos}`);
        return result;
      }
      
      // Wenn Terraforming möglich, akzeptiere mit Warnung
      if (result.terraformingFeasible) {
        console.log(`⚠️ Position ${pos} benötigt Terraforming: ${result.issues.join(', ')}`);
        return { ...result, terraformNeeded: true };
      }
    }

    // Keine geeignete Position gefunden
    return {
      success: false,
      position: null,
      issues: ['Keine geeignete Baufläche im Radius gefunden'],
      terraformNeeded: false
    };
  }

  /**
   * Bewertet eine spezifische Position als Baustandort
   * @param {Object} template - Template
   * @param {Vec3} basePos - Basis-Position (südwestliche Ecke)
   * @returns {Promise<Object>} - Bewertungsergebnis
   */
  async evaluateSite(template, basePos) {
    const { width, depth, height, y0_is_ground } = template.dimensions;
    const issues = [];
    
    // 1. Fundament-Check
    const foundationCheck = await this.checkFoundation(basePos, width, depth, y0_is_ground);
    if (!foundationCheck.solid) {
      issues.push(...foundationCheck.issues);
    }

    // 2. Luftraum-Check
    const airspaceCheck = await this.checkAirspace(basePos, width, depth, height);
    if (!airspaceCheck.clear) {
      issues.push(...airspaceCheck.issues);
    }

    // 3. Erreichbarkeits-Check
    const accessCheck = await this.checkAccessibility(basePos, width, depth);
    if (!accessCheck.accessible) {
      issues.push(...accessCheck.issues);
    }

    // Bewertung
    const success = issues.length === 0;
    const terraformingFeasible = issues.length > 0 && issues.length <= 3 && 
                                  foundationCheck.unevenness < 3;

    return {
      success,
      position: basePos,
      issues,
      terraformNeeded: false,
      terraformingFeasible,
      foundationInfo: foundationCheck,
      airspaceInfo: airspaceCheck
    };
  }

  /**
   * Prüft das Fundament auf Solidität und Ebenheit
   * @param {Vec3} basePos - Basis-Position
   * @param {number} width - Breite
   * @param {number} depth - Tiefe
   * @param {boolean} y0_is_ground - Ob y=0 der Boden ist
   * @returns {Promise<Object>} - Fundament-Prüfungsergebnis
   */
  async checkFoundation(basePos, width, depth, y0_is_ground) {
    const issues = [];
    let minY = Infinity;
    let maxY = -Infinity;
    let solidCount = 0;
    let totalBlocks = width * depth;

    const checkY = y0_is_ground ? basePos.y : basePos.y - 1;

    for (let x = 0; x < width; x++) {
      for (let z = 0; z < depth; z++) {
        const pos = new Vec3(basePos.x + x, checkY, basePos.z + z);
        const block = this.bot.blockAt(pos);

        if (!block) {
          issues.push(`Block bei ${pos} nicht geladen`);
          continue;
        }

        // Prüfe, ob Block solid ist
        if (block.boundingBox === 'block') {
          solidCount++;
          
          // Höhe tracken für Ebenheitsprüfung
          const surfaceY = this.findSurfaceY(pos);
          minY = Math.min(minY, surfaceY);
          maxY = Math.max(maxY, surfaceY);
        }

        // Prüfe auf Schwerkraft-Blöcke (Sand, Kies)
        if (this.isGravityBlock(block)) {
          issues.push(`Schwerkraft-Block bei ${pos.x},${pos.z}`);
        }

        // Prüfe auf Wasser/Lava
        if (block.name === 'water' || block.name === 'lava' || block.name === 'flowing_water' || block.name === 'flowing_lava') {
          issues.push(`Flüssigkeit bei ${pos.x},${pos.z}`);
        }
      }
    }

    const unevenness = maxY - minY;
    const solidPercentage = (solidCount / totalBlocks) * 100;

    if (solidPercentage < 80) {
      issues.push(`Nur ${solidPercentage.toFixed(0)}% solides Fundament`);
    }

    if (unevenness > 2) {
      issues.push(`Fundament zu uneben (${unevenness} Blöcke Unterschied)`);
    }

    return {
      solid: issues.length === 0,
      solidPercentage,
      unevenness,
      minY,
      maxY,
      issues
    };
  }

  /**
   * Prüft den Luftraum über der Baufläche
   * @param {Vec3} basePos - Basis-Position
   * @param {number} width - Breite
   * @param {number} depth - Tiefe
   * @param {number} height - Höhe
   * @returns {Promise<Object>} - Luftraum-Prüfungsergebnis
   */
  async checkAirspace(basePos, width, depth, height) {
    const issues = [];
    let obstructionCount = 0;

    for (let y = 1; y <= height; y++) {
      for (let x = 0; x < width; x++) {
        for (let z = 0; z < depth; z++) {
          const pos = new Vec3(basePos.x + x, basePos.y + y, basePos.z + z);
          const block = this.bot.blockAt(pos);

          if (!block) {
            issues.push(`Block bei ${pos} nicht geladen`);
            continue;
          }

          // Prüfe, ob Block nicht Luft/Gras/Blume ist (also Obstruktion)
          if (!this.isReplaceable(block)) {
            obstructionCount++;
            if (obstructionCount <= 5) { // Nur erste 5 melden
              issues.push(`Obstruktion bei ${pos.x},${pos.y},${pos.z}: ${block.displayName}`);
            }
          }
        }
      }
    }

    if (obstructionCount > 5) {
      issues.push(`... und ${obstructionCount - 5} weitere Obstruktionen`);
    }

    return {
      clear: obstructionCount === 0,
      obstructionCount,
      issues
    };
  }

  /**
   * Prüft, ob die Baufläche erreichbar ist
   * @param {Vec3} basePos - Basis-Position
   * @param {number} width - Breite
   * @param {number} depth - Tiefe
   * @returns {Promise<Object>} - Erreichbarkeits-Prüfung
   */
  async checkAccessibility(basePos, width, depth) {
    const issues = [];
    
    // Prüfe, ob Bot zur Basis-Position navigieren kann
    const botPos = this.bot.entity.position;
    const distance = botPos.distanceTo(basePos);

    if (distance > 128) {
      issues.push(`Position zu weit entfernt (${distance.toFixed(0)}m)`);
    }

    // Einfache Höhenprüfung
    const heightDiff = Math.abs(botPos.y - basePos.y);
    if (heightDiff > 32) {
      issues.push(`Zu großer Höhenunterschied (${heightDiff.toFixed(0)} Blöcke)`);
    }

    return {
      accessible: issues.length === 0,
      distance,
      heightDiff,
      issues
    };
  }

  /**
   * Findet die Oberflächen-Y-Koordinate einer Position
   * @param {Vec3} pos - Position
   * @returns {number} - Y-Koordinate der Oberfläche
   */
  findSurfaceY(pos) {
    let y = pos.y;
    
    // Nach oben suchen bis Luft
    for (let checkY = pos.y; checkY < pos.y + 10; checkY++) {
      const block = this.bot.blockAt(new Vec3(pos.x, checkY, pos.z));
      if (block && (block.name === 'air' || this.isReplaceable(block))) {
        return checkY - 1;
      }
    }
    
    return y;
  }

  /**
   * Prüft, ob ein Block ein Schwerkraft-Block ist
   * @param {Object} block - Block
   * @returns {boolean} - true wenn Schwerkraft-Block
   */
  isGravityBlock(block) {
    return ['sand', 'gravel', 'red_sand', 'concrete_powder'].includes(block.name);
  }

  /**
   * Prüft, ob ein Block ersetzbar ist (Luft, Gras, Blumen, etc.)
   * @param {Object} block - Block
   * @returns {boolean} - true wenn ersetzbar
   */
  isReplaceable(block) {
    const replaceableBlocks = [
      'air', 'cave_air', 'void_air',
      'grass', 'tall_grass', 'fern', 'large_fern',
      'dandelion', 'poppy', 'blue_orchid', 'allium',
      'azure_bluet', 'red_tulip', 'orange_tulip', 'white_tulip', 'pink_tulip',
      'oxeye_daisy', 'cornflower', 'lily_of_the_valley',
      'dead_bush', 'vine', 'snow'
    ];
    
    return replaceableBlocks.includes(block.name) || block.boundingBox === 'empty';
  }

  /**
   * Generiert Test-Positionen in spiralförmigem Muster
   * @param {Vec3} center - Zentrum der Suche
   * @param {number} radius - Suchradius
   * @param {number} spacing - Abstand zwischen Test-Positionen
   * @returns {Array<Vec3>} - Array von Test-Positionen
   */
  generateTestPositions(center, radius, spacing = 4) {
    const positions = [];
    
    // Spirale vom Zentrum nach außen
    for (let r = 0; r < radius; r += spacing) {
      const steps = Math.max(1, Math.floor(r / spacing) * 8);
      
      for (let i = 0; i < steps; i++) {
        const angle = (i / steps) * Math.PI * 2;
        const x = Math.floor(center.x + Math.cos(angle) * r);
        const z = Math.floor(center.z + Math.sin(angle) * r);
        
        // Y-Koordinate: finde Boden
        const y = this.findGroundY(new Vec3(x, center.y, z));
        
        if (y !== null) {
          positions.push(new Vec3(x, y, z));
        }
      }
    }

    return positions;
  }

  /**
   * Findet die Boden-Y-Koordinate an einer Position
   * @param {Vec3} pos - Position
   * @returns {number|null} - Y-Koordinate des Bodens oder null
   */
  findGroundY(pos) {
    // Suche von aktueller Y-Position nach unten
    for (let y = pos.y; y > pos.y - 32; y--) {
      const block = this.bot.blockAt(new Vec3(pos.x, y, pos.z));
      const blockAbove = this.bot.blockAt(new Vec3(pos.x, y + 1, pos.z));
      
      if (!block || !blockAbove) continue;
      
      // Gefunden: solider Block mit Luft darüber
      if (block.boundingBox === 'block' && 
          (blockAbove.name === 'air' || this.isReplaceable(blockAbove))) {
        return y + 1; // Position auf dem Block
      }
    }
    
    return null;
  }

  /**
   * Erstellt einen Terraforming-Plan
   * @param {Object} siteEvaluation - Ergebnis von evaluateSite
   * @param {Object} template - Template
   * @returns {Object} - Terraforming-Plan
   */
  createTerraformingPlan(siteEvaluation, template) {
    const plan = {
      fillBlocks: [],
      removeBlocks: [],
      estimatedBlocks: 0
    };

    const { position } = siteEvaluation;
    const { width, depth, height } = template.dimensions;
    const targetY = siteEvaluation.foundationInfo.minY;

    // Ebene Fläche herstellen
    for (let x = 0; x < width; x++) {
      for (let z = 0; z < depth; z++) {
        const pos = new Vec3(position.x + x, targetY, position.z + z);
        const block = this.bot.blockAt(pos);

        if (!block || block.name === 'air') {
          plan.fillBlocks.push({ pos, material: 'dirt' });
          plan.estimatedBlocks++;
        }
      }
    }

    // Luftraum freimachen
    for (let y = 1; y <= height; y++) {
      for (let x = 0; x < width; x++) {
        for (let z = 0; z < depth; z++) {
          const pos = new Vec3(position.x + x, position.y + y, position.z + z);
          const block = this.bot.blockAt(pos);

          if (block && !this.isReplaceable(block)) {
            plan.removeBlocks.push({ pos, block: block.name });
            plan.estimatedBlocks++;
          }
        }
      }
    }

    return plan;
  }
}

export default BuildSiteFinder;

