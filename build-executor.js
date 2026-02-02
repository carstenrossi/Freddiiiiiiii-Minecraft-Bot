/**
 * Build-Executor - Führt den eigentlichen Bau aus
 * 
 * Platziert Blöcke Level für Level, verwaltet Materialien,
 * führt Overrides aus (Türen, Leitern, etc.)
 */

import { Vec3 } from 'vec3';

class BuildExecutor {
  constructor(bot, goals = null) {
    this.bot = bot;
    this.goals = goals; // Pathfinder goals für Navigation
    this.buildInProgress = false;
    this.currentBuild = null;
    this.stats = {
      blocksPlaced: 0,
      blocksFailed: 0,
      timeStarted: null,
      timeCompleted: null
    };
  }

  /**
   * Startet den Bau eines Templates
   * @param {Object} template - Geladenes Template
   * @param {Vec3} basePos - Basis-Position für den Bau
   * @param {Object} options - Build-Optionen
   * @returns {Promise<Object>} - Build-Ergebnis
   */
  async executeBuild(template, basePos, options = {}) {
    if (this.buildInProgress) {
      throw new Error('Ein Bau ist bereits im Gange');
    }

    this.buildInProgress = true;
    this.currentBuild = {
      template,
      basePos,
      options,
      currentLevel: 0,
      currentBlock: 0
    };

    this.stats = {
      blocksPlaced: 0,
      blocksFailed: 0,
      timeStarted: Date.now(),
      timeCompleted: null
    };

    console.log(`🏗️ Starte Bau: ${template.title}`);
    console.log(`📍 Position: ${basePos}`);
    console.log(`📐 Dimensionen: ${template.dimensions.width}x${template.dimensions.depth}x${template.dimensions.height}`);

    try {
    // 1. Materialien prüfen
    const materialCheck = this.checkMaterials(template);
    if (!materialCheck.sufficient && !options.ignoreMaterials) {
      console.warn('⚠️ Nicht genug Materialien:');
      materialCheck.missing.forEach(item => {
        console.warn(`  - ${item.name}: ${item.have}/${item.need} (fehlt ${item.missing})`);
      });
      
      if (!options.continueWithoutMaterials) {
        throw new Error('Nicht genug Materialien für den Bau');
      } else {
        console.log('🔧 Baue trotzdem mit vorhandenen Materialien...');
      }
    }

      // 2. Level für Level bauen
      for (let i = 0; i < template.buildSteps.length; i++) {
        const step = template.buildSteps[i];
        this.currentBuild.currentLevel = i;
        
        console.log(`\n📦 Baue Level ${step.level} (y=${step.y})...`);
        await this.buildLevel(step, basePos);
      }

      // 3. Overrides anwenden (falls vorhanden)
      if (template.overrides && template.overrides.length > 0) {
        console.log(`\n🔧 Wende Overrides an...`);
        await this.applyOverrides(template.overrides, basePos);
      }

      this.stats.timeCompleted = Date.now();
      const duration = ((this.stats.timeCompleted - this.stats.timeStarted) / 1000).toFixed(1);

      console.log(`\n✅ Bau abgeschlossen!`);
      console.log(`📊 Statistik:`);
      console.log(`  - Blöcke platziert: ${this.stats.blocksPlaced}`);
      console.log(`  - Fehler: ${this.stats.blocksFailed}`);
      console.log(`  - Dauer: ${duration}s`);

      return {
        success: true,
        stats: this.stats,
        duration
      };

    } catch (error) {
      console.error(`❌ Bau-Fehler: ${error.message}`);
      return {
        success: false,
        error: error.message,
        stats: this.stats
      };
    } finally {
      this.buildInProgress = false;
      this.currentBuild = null;
    }
  }

  /**
   * Baut ein einzelnes Level
   * @param {Object} step - Build-Step
   * @param {Vec3} basePos - Basis-Position
   */
  async buildLevel(step, basePos) {
    const blocks = step.blocks;
    let placedInLevel = 0;

    console.log(`  📋 Level ${step.level} hat ${blocks.length} Blöcke zu platzieren`);
    
    await this.ensureLevelPosition(basePos, step);

    for (let i = 0; i < blocks.length; i++) {
      const { pos, block } = blocks[i];
      this.currentBuild.currentBlock = i;

      // Absolute Position berechnen
      const absolutePos = new Vec3(
        basePos.x + pos.x,
        basePos.y + pos.y,
        basePos.z + pos.z
      );

      try {
        await this.placeBlock(absolutePos, block);
        placedInLevel++;
        this.stats.blocksPlaced++;

        // Fortschritts-Updates alle 20 Blöcke
        if (placedInLevel % 20 === 0) {
          console.log(`  ⏳ ${placedInLevel}/${blocks.length} Blöcke platziert...`);
          this.bot.chat(`Level ${step.level}: ${placedInLevel}/${blocks.length}`);
        }

      } catch (error) {
        this.stats.blocksFailed++;
        
        // Detailliertes Error-Logging für die ersten Fehler (reduziert)
        if (this.stats.blocksFailed <= 3) {
          console.error(`  ❌ Fehler #${this.stats.blocksFailed} bei ${absolutePos.x},${absolutePos.y},${absolutePos.z}:`);
          console.error(`     Block: ${block.name}`);
          console.error(`     Grund: ${error.message.substring(0, 80)}`);
        } else if (this.stats.blocksFailed === 10 || this.stats.blocksFailed === 25 || this.stats.blocksFailed === 50) {
          console.warn(`  ⚠️ Fehler-Zähler: ${this.stats.blocksFailed} Fehler bisher`);
        }
        
        // Bei zu vielen Fehlern abbrechen (sehr hohe Schwelle für große Builds)
        if (this.stats.blocksFailed > 150) {
          throw new Error('Zu viele Fehler beim Platzieren von Blöcken (>150)');
        }
      }
    }

    const successRate = ((placedInLevel / blocks.length) * 100).toFixed(0);
    console.log(`  ✓ Level ${step.level} abgeschlossen (${placedInLevel}/${blocks.length} = ${successRate}%)`);
    
    // Warnung bei niedrigem Success-Rate
    if (placedInLevel < blocks.length * 0.8) {
      console.warn(`  ⚠️ Niedriger Success-Rate! Fehlende Blöcke: ${blocks.length - placedInLevel}`);
      this.bot.chat(`⚠️ Level ${step.level}: Nur ${successRate}% vollständig`);
    }
  }

  /**
   * Stellt sicher, dass der Bot für das aktuelle Level eine gute Position hat
   * @param {Vec3} basePos
   * @param {Object} step
   */
  async ensureLevelPosition(basePos, step) {
    try {
      const template = this.currentBuild?.template;
      const width = template?.dimensions?.width || 5;
      const depth = template?.dimensions?.depth || 5;

      const centerX = basePos.x + Math.floor(width / 2);
      const centerZ = basePos.z + Math.floor(depth / 2);
      const targetY = basePos.y + step.y + 1; // eine Blockhöhe über Level-Boden

      const targetPos = new Vec3(centerX, targetY, centerZ);

      // Nummerischer Zielpunkt für Pathfinder (etwas Toleranz)
      if (this.goals) {
        this.bot.pathfinder.setGoal(null);
        await this.sleep(50);

        const goal = new this.goals.GoalNear(targetPos.x, targetPos.y, targetPos.z, 4);
        this.bot.pathfinder.setGoal(goal);

        // Warte bis angekommen oder 6 Sekunden vorbei sind
        let waited = 0;
        while (waited < 60) { // 6 Sekunden
          await this.sleep(100);
          waited++;
          const dist = this.bot.entity.position.distanceTo(targetPos);
          if (dist <= 4) {
            break;
          }
        }

        this.bot.pathfinder.setGoal(null);
      }

      // Nur für hohe Level noch einen Pillar bauen
      const needHeight = (basePos.y + step.y) - this.bot.entity.position.y;
      if (step.level >= 5 && needHeight > 2) {
        console.log(`  🪜 Hoher Level (Level ${step.level}) - baue Pillar ${Math.ceil(needHeight)} hoch`);
        await this.buildPillarToHeight(basePos, step.y);
      }

    } catch (err) {
      console.log(`  ⚠️ ensureLevelPosition Fehlgeschlagen: ${err.message}`);
    }
  }

  /**
   * Platziert einen einzelnen Block
   * @param {Vec3} pos - Position
   * @param {Object} block - Block-Daten
   */
  async placeBlock(pos, block) {
    // Prüfe, ob Block bereits korrekt platziert ist
    const existingBlock = this.bot.blockAt(pos);
    if (existingBlock && existingBlock.name === block.name) {
      return; // Block ist bereits korrekt
    }

    // Material aus Inventar holen - mit Auto-Refill!
    let item = await this.getItemFromInventory(block.name);
    if (!item || item.count < 5) { // Refill wenn < 5 (nicht erst bei 0)
      // Kein Material da - gib automatisch nach!
      console.log(`📦 Material ${block.name} fast leer (${item ? item.count : 0}) - gebe 64 nach`);
      this.bot.chat(`/give ${this.bot.username} ${block.name} 64`);
      await this.sleep(1000); // Längere Wartezeit für /give
      
      // Prüfe nochmal
      item = await this.getItemFromInventory(block.name);
      if (!item) {
        // Zweiter Versuch
        console.log(`⚠️ Erster /give fehlgeschlagen, versuche nochmal...`);
        this.bot.chat(`/give ${this.bot.username} ${block.name} 64`);
        await this.sleep(1000);
        
        item = await this.getItemFromInventory(block.name);
        if (!item) {
          throw new Error(`Material '${block.name}' nicht verfügbar (auch nach 2x /give)`);
        }
      }
    }

    // Navigiere zum Block (in Reichweite) - SYNCHRON warten!
    const distanceToBlock = this.bot.entity.position.distanceTo(pos);
    if (distanceToBlock > 4.5 && this.goals) {
      const approachPos = await this.findApproachPosition(pos);
      const goalPos = approachPos || pos;

      try {
        this.bot.pathfinder.setGoal(null);
        await this.sleep(50);

        const tolerance = approachPos ? 2 : 1;
        const goal = new this.goals.GoalNear(goalPos.x, goalPos.y, goalPos.z, tolerance);
        this.bot.pathfinder.setGoal(goal);

        // Warte bis nah genug (max 8 Sekunden)
        const startPos = this.bot.entity.position.clone();
        let waited = 0;

        while (waited < 80) { // 8 Sekunden
          await this.sleep(100);
          waited++;

          const currentDist = this.bot.entity.position.distanceTo(pos);
          if (currentDist <= 4.5) {
            break;
          }

          const moved = this.bot.entity.position.distanceTo(startPos);
          if (waited > 20 && moved < 0.3) {
            console.log(`  ⚠️ Bot bewegt sich kaum (${moved.toFixed(2)}m), breche Pfad ab`);
            break;
          }
        }

        this.bot.pathfinder.setGoal(null);

        // Noch zu weit weg?
        const finalDist = this.bot.entity.position.distanceTo(pos);
        if (finalDist > 4.5) {
          console.warn(`  ⚠️ Noch ${finalDist.toFixed(1)}m entfernt nach Navigation - alternativer Versuch`);
          // Zweiter Versuch: direkte Annäherung ohne approach
          const directGoal = new this.goals.GoalNear(pos.x, pos.y, pos.z, 1);
          this.bot.pathfinder.setGoal(directGoal);

          let waitedDirect = 0;
          while (waitedDirect < 50) {
            await this.sleep(100);
            waitedDirect++;
            if (this.bot.entity.position.distanceTo(pos) <= 4.5) break;
          }
          this.bot.pathfinder.setGoal(null);

          const finalDist2 = this.bot.entity.position.distanceTo(pos);
          if (finalDist2 > 4.5) {
            throw new Error(`Zu weit entfernt (${finalDist2.toFixed(1)}m)`);
          }
        }

      } catch (navErr) {
        console.warn(`  ⚠️ Navigation fehlgeschlagen: ${navErr.message}`);
      }
    }

    // Block platzieren
    try {
      // Equip mit PartialReadError-Schutz
      try {
        await this.bot.equip(item, 'hand');
      } catch (equipErr) {
        if (equipErr.name === 'PartialReadError') {
          // Ignoriere Protokoll-Fehler, Item ist wahrscheinlich schon equipped
          console.log('  ⚠️ PartialReadError beim Equip (ignoriert)');
        } else {
          throw equipErr;
        }
      }
      await this.sleep(100);
      
      // Referenz-Block finden (für placeBlock)
      let referenceBlock = this.findReferenceBlock(pos);
      
      if (!referenceBlock) {
        // SMART FIX: Vielleicht fehlt der Block unter uns aus vorherigem Level?
        const blockUnten = pos.offset(0, -1, 0);
        const missingBlock = this.bot.blockAt(blockUnten);
        
        if (missingBlock && missingBlock.name === 'air') {
          console.log(`  🔧 Repariere: Block unter mir fehlt, baue nach`);
          
          // Versuche den fehlenden Block nachträglich zu bauen
          try {
            const repairSuccess = await this.repairMissingBlock(blockUnten);
            if (repairSuccess) {
              // Jetzt sollte Referenz-Block da sein
              referenceBlock = this.findReferenceBlock(pos);
            }
          } catch (repairErr) {
            console.log(`  ⚠️ Reparatur fehlgeschlagen: ${repairErr.message}`);
          }
        }
        
        // Wenn immer noch kein Referenz-Block
        if (!referenceBlock) {
          throw new Error(`Kein Referenz-Block bei ${pos.x},${pos.y},${pos.z}`);
        }
      }

      // Finde Richtung vom Referenz zum Ziel-Block
      const faceVector = pos.minus(referenceBlock.position);
      
      await this.bot.placeBlock(referenceBlock, faceVector);
      
      // Kurze Pause, um Server-Lag zu vermeiden
      await this.sleep(100);

    } catch (error) {
      throw new Error(`Platzieren fehlgeschlagen: ${error.message}`);
    }
  }

  /**
   * Findet einen Referenz-Block zum Platzieren
   * @param {Vec3} pos - Ziel-Position
   * @returns {Object|null} - Referenz-Block
   */
  findReferenceBlock(pos) {
    // Suche nach einem soliden Block in der Nähe (Priorität: Unten)
    const offsets = [
      new Vec3(0, -1, 0),  // Unten (höchste Priorität)
      new Vec3(0, 0, 1),   // Süd
      new Vec3(0, 0, -1),  // Nord
      new Vec3(1, 0, 0),   // Ost
      new Vec3(-1, 0, 0),  // West
      new Vec3(0, 1, 0)    // Oben
    ];

    for (const offset of offsets) {
      const checkPos = pos.plus(offset);
      const block = this.bot.blockAt(checkPos);
      
      if (block && block.boundingBox === 'block' && block.name !== 'air') {
        // console.log(`  ✓ Referenz: ${block.name} bei Offset ${offset.x},${offset.y},${offset.z}`);
        return block;
      }
    }

    console.warn(`  ⚠️ Kein Referenz-Block für ${pos.x},${pos.y},${pos.z}`);
    return null;
  }

  /**
   * Findet eine Position zum Annähern an einen Block
   * @param {Vec3} targetPos - Ziel-Position
   * @returns {Promise<Vec3|null>} - Anflug-Position
   */
  async findApproachPosition(targetPos) {
    const offsets = [
      new Vec3(2, 0, 0),
      new Vec3(-2, 0, 0),
      new Vec3(0, 0, 2),
      new Vec3(0, 0, -2),
      new Vec3(2, 0, 2),
      new Vec3(-2, 0, -2)
    ];

    for (const offset of offsets) {
      const checkPos = targetPos.plus(offset);
      const block = this.bot.blockAt(checkPos);
      const blockAbove = this.bot.blockAt(checkPos.offset(0, 1, 0));

      if (block && block.boundingBox === 'block' && 
          blockAbove && blockAbove.name === 'air') {
        return checkPos;
      }
    }

    return null;
  }

  /**
   * Holt ein Item aus dem Inventar
   * @param {string} itemName - Name des Items
   * @returns {Object|null} - Item oder null
   */
  async getItemFromInventory(itemName) {
    const mcData = this.bot.mcData;
    if (!mcData) return null;
    
    const itemData = mcData.itemsByName[itemName];
    
    if (!itemData) {
      return null;
    }

    return this.bot.inventory.items().find(item => item.type === itemData.id);
  }

  /**
   * Prüft, ob genug Materialien vorhanden sind
   * @param {Object} template - Template
   * @returns {Object} - {sufficient, missing: [...]}
   */
  checkMaterials(template) {
    const required = {};
    const missing = [];

    // Zähle benötigte Blöcke
    template.buildSteps.forEach(step => {
      step.blocks.forEach(({ block }) => {
        if (block.isAir) return;
        
        const key = block.name;
        required[key] = (required[key] || 0) + 1;
      });
    });

    console.log(`📊 Benötigte Materialien:`, required);

    // Prüfe Inventar (synchron)
    for (const [blockName, count] of Object.entries(required)) {
      // Direkt nach Item suchen im Inventar
      const items = this.bot.inventory.items();
      const item = items.find(i => i.name === blockName);
      const have = item ? item.count : 0;

      if (have < count) {
        missing.push({
          name: blockName,
          need: count,
          have: have,
          missing: count - have
        });
      }
    }

    console.log(`📊 Fehlende Materialien:`, missing.length > 0 ? missing : 'keine');

    return {
      sufficient: missing.length === 0,
      required,
      missing
    };
  }

  /**
   * Repariert einen fehlenden Block (z.B. aus vorherigem Level)
   * @param {Vec3} pos - Position des fehlenden Blocks
   * @returns {Promise<boolean>} - true wenn erfolgreich repariert
   */
  async repairMissingBlock(pos) {
    console.log(`  🔧 Repariere fehlenden Block bei ${pos.x},${pos.y},${pos.z}`);
    
    try {
      // Finde ein Material im Inventar (irgendein Baumaterial)
      const repairMaterial = this.bot.inventory.items().find(i =>
        i.name === 'sandstone' || 
        i.name === 'cobblestone' || 
        i.name === 'dirt' ||
        i.name === 'stone' ||
        i.name.includes('planks')
      );
      
      if (!repairMaterial) {
        console.log(`  ⚠️ Kein Reparatur-Material`);
        return false;
      }
      
      await this.bot.equip(repairMaterial, 'hand');
      await this.sleep(100);
      
      // Finde Referenz-Block für die Reparatur-Position
      const repairRef = this.findReferenceBlock(pos);
      if (!repairRef) {
        console.log(`  ⚠️ Auch für Reparatur kein Referenz-Block`);
        return false;
      }
      
      const faceVector = pos.minus(repairRef.position);
      await this.bot.placeBlock(repairRef, faceVector);
      await this.sleep(150);
      
      console.log(`  ✅ Reparatur erfolgreich mit ${repairMaterial.name}`);
      return true;
      
    } catch (err) {
      console.log(`  ⚠️ Reparatur fehlgeschlagen: ${err.message.substring(0, 50)}`);
      return false;
    }
  }

  /**
   * Baut einen Pillar nach oben für hohe Levels
   * @param {Vec3} basePos - Basis-Position
   * @param {number} targetY - Ziel-Höhe (relativ)
   */
  async buildPillarToHeight(basePos, targetY) {
    const currentY = this.bot.entity.position.y;
    const needHeight = (basePos.y + targetY) - currentY;
    
    if (needHeight <= 0) {
      return; // Schon hoch genug
    }
    
    console.log(`  🪜 Baue Pillar ${Math.ceil(needHeight)} Blöcke hoch`);
    
    try {
      // Finde Baumaterial
      const pillarMaterial = this.bot.inventory.items().find(i =>
        i.name === 'dirt' || i.name === 'cobblestone' || i.name === 'stone' || i.name === 'sandstone'
      );
      
      if (!pillarMaterial) {
        console.log('  ⚠️ Kein Pillar-Material, überspringe');
        return;
      }
      
      await this.bot.equip(pillarMaterial, 'hand');
      
      // Pillaring-Technik: Springe und platziere unter dir
      for (let i = 0; i < Math.ceil(needHeight) + 2; i++) {
        try {
          // Schaue runter
          await this.bot.look(0, Math.PI / 2, true);
          
          // Springe
          this.bot.setControlState('jump', true);
          await this.sleep(150);
          
          // Platziere Block unter dir
          const unterMir = this.bot.entity.position.offset(0, -1, 0);
          const boden = this.bot.blockAt(unterMir.offset(0, -1, 0));
          
          if (boden && boden.name !== 'air') {
            await this.bot.placeBlock(boden, new Vec3(0, 1, 0));
          }
          
          this.bot.setControlState('jump', false);
          await this.sleep(250);
        } catch (err) {
          // Ignoriere Pillar-Fehler
        }
      }
      
      console.log(`  ✅ Pillar gebaut, nun bei Y=${Math.floor(this.bot.entity.position.y)}`);
      
    } catch (err) {
      console.log(`  ⚠️ Pillar-Fehler: ${err.message}`);
    }
  }

  /**
   * Wendet Override-Blöcke an (Türen, Leitern, etc.)
   * @param {Array} overrides - Liste von Overrides
   * @param {Vec3} basePos - Basis-Position
   */
  async applyOverrides(overrides, basePos) {
    console.log(`📝 Hinweis: Overrides müssen manuell konfiguriert werden.`);
    console.log(`   Template enthält ${overrides.length} Override-Vorschläge.`);
    
    // TODO: Implementiere automatische Override-Anwendung
    // Dies erfordert spezielle Logik für Türen, Treppen, Leitern etc.
  }

  /**
   * Stoppt den aktuellen Bau
   */
  stopBuild() {
    if (this.buildInProgress) {
      console.log('⏹️ Bau wird gestoppt...');
      this.buildInProgress = false;
      this.currentBuild = null;
    }
  }

  /**
   * Gibt den aktuellen Build-Status zurück
   * @returns {Object|null} - Build-Status
   */
  getBuildStatus() {
    if (!this.buildInProgress) {
      return null;
    }

    const { currentLevel, currentBlock, template } = this.currentBuild;
    const totalBlocks = template.buildSteps.reduce((sum, step) => sum + step.blocks.length, 0);
    const progress = (this.stats.blocksPlaced / totalBlocks * 100).toFixed(1);

    return {
      inProgress: true,
      template: template.title,
      currentLevel: currentLevel + 1,
      totalLevels: template.buildSteps.length,
      blocksPlaced: this.stats.blocksPlaced,
      totalBlocks,
      progress: `${progress}%`,
      errors: this.stats.blocksFailed
    };
  }

  /**
   * Hilfsfunktion: Sleep
   * @param {number} ms - Millisekunden
   */
  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

export default BuildExecutor;

