// ============================================
// RÄUMLICHE INTELLIGENZ FÜR MINECRAFT BOT
// ============================================

import { Vec3 } from 'vec3';

export class SpatialIntelligence {
  constructor(bot) {
    this.bot = bot;
    this.scanRadius = 32; // Basis-Scan-Radius
    this.detailRadius = 10; // Detaillierter Scan
    this.lastAnalysis = null; // Cache für Performance
    this.lastAnalysisTime = 0;
    this.cacheTimeout = 30000; // 30 Sekunden Cache
  }
  
  // Schnelle Basis-Analyse (für normale Nutzung)
  async quickAnalyze(center = null) {
    center = center || this.bot.entity.position;
    console.log('⚡ Schnelle Raumanalyse...');
    
    const quick = {
      position: center.clone(),
      terrain: {
        currentHeight: Math.floor(center.y),
        nearbyHeights: []
      },
      nearbyFeatures: {
        water: false,
        lava: false,
        trees: 0,
        buildings: false
      },
      bestBuildSpot: null,
      dangers: []
    };
    
    // Schneller 10-Block Radius Check
    const quickRadius = 10;
    
    // Wasser/Lava Check
    const water = this.bot.findBlock({
      point: center,
      matching: b => b.name.includes('water'),
      maxDistance: quickRadius
    });
    if (water) quick.nearbyFeatures.water = true;
    
    const lava = this.bot.findBlock({
      point: center,
      matching: b => b.name.includes('lava'),
      maxDistance: quickRadius
    });
    if (lava) {
      quick.nearbyFeatures.lava = true;
      quick.dangers.push('Lava in der Nähe!');
    }
    
    // Bäume zählen
    const trees = this.bot.findBlocks({
      point: center,
      matching: b => b.name.includes('log'),
      maxDistance: quickRadius,
      count: 10
    });
    quick.nearbyFeatures.trees = trees.length;
    
    // Einfacher Bauplatz Check (5x5)
    const groundY = this.getGroundHeight(center);
    if (groundY) {
      let flat = true;
      for (let x = -2; x <= 2; x += 2) {
        for (let z = -2; z <= 2; z += 2) {
          const checkPos = center.offset(x, 0, z);
          const h = this.getGroundHeight(checkPos);
          if (!h || Math.abs(h - groundY) > 1) {
            flat = false;
            break;
          }
        }
        if (!flat) break;
      }
      
      if (flat) {
        quick.bestBuildSpot = new Vec3(center.x, groundY, center.z);
      }
    }
    
    return quick;
  }

  // Hauptanalyse-Funktion
  async analyzeSpace(options = {}) {
    const radius = options.radius || this.scanRadius;
    const center = options.center || this.bot.entity.position;
    const forceRefresh = options.forceRefresh || false;
    
    // Cache prüfen
    const now = Date.now();
    if (!forceRefresh && 
        this.lastAnalysis && 
        (now - this.lastAnalysisTime) < this.cacheTimeout &&
        this.lastAnalysis.center.distanceTo(center) < 5) {
      console.log('📦 Nutze gecachte Raumanalyse');
      return this.lastAnalysis;
    }
    
    console.log('🔍 Analysiere Raum...');
    
    const analysis = {
      timestamp: Date.now(),
      center: center.clone(),
      
      // Basis-Terrain
      terrain: await this.analyzeTerrain(center, radius),
      
      // Strukturen
      structures: await this.detectStructures(center, radius),
      
      // Baubare Flächen
      buildableAreas: await this.findBuildableAreas(center, radius),
      
      // Gefahren
      dangers: await this.detectDangers(center, radius),
      
      // Wege und Verbindungen
      paths: await this.analyzePaths(center, radius),
      
      // Ressourcen-Cluster
      resourceClusters: await this.findResourceClusters(center, radius),
      
      // Räumliche Beziehungen
      spatialRelations: await this.calculateSpatialRelations(center, radius)
    };
    
    // Cache aktualisieren
    this.lastAnalysis = analysis;
    this.lastAnalysisTime = Date.now();
    
    return analysis;
  }

  // Terrain-Analyse mit Höhenkarte
  async analyzeTerrain(center, radius) {
    const terrain = {
      heightMap: new Map(),
      averageHeight: 0,
      highestPoint: null,
      lowestPoint: null,
      cliffs: [],
      valleys: [],
      flatAreas: [],
      waterBodies: []
    };
    
    let totalHeight = 0;
    let count = 0;
    
    // Erstelle Höhenkarte (größere Schritte für Performance)
    const step = Math.max(4, Math.floor(radius / 8));
    for (let x = -radius; x <= radius; x += step) {
      for (let z = -radius; z <= radius; z += step) {
        const pos = center.offset(x, 0, z);
        const height = this.getGroundHeight(pos);
        
        if (height !== null) {
          terrain.heightMap.set(`${pos.x},${pos.z}`, height);
          totalHeight += height;
          count++;
          
          // Höchster/Niedrigster Punkt
          if (!terrain.highestPoint || height > terrain.highestPoint.y) {
            terrain.highestPoint = new Vec3(pos.x, height, pos.z);
          }
          if (!terrain.lowestPoint || height < terrain.lowestPoint.y) {
            terrain.lowestPoint = new Vec3(pos.x, height, pos.z);
          }
        }
      }
    }
    
    terrain.averageHeight = totalHeight / count;
    
    // Erkenne Klippen und Täler
    terrain.cliffs = this.detectCliffs(terrain.heightMap);
    terrain.valleys = this.detectValleys(terrain.heightMap);
    terrain.flatAreas = this.detectFlatAreas(terrain.heightMap);
    
    return terrain;
  }

  // Strukturen erkennen (Häuser, Höhlen, etc.)
  async detectStructures(center, radius) {
    const structures = {
      buildings: [],
      caves: [],
      bridges: [],
      walls: [],
      naturalFormations: []
    };
    
    // Suche nach künstlichen Strukturen (größere Schritte für Performance)
    const structStep = Math.max(8, Math.floor(radius / 4));
    for (let x = -radius; x <= radius; x += structStep) {
      for (let z = -radius; z <= radius; z += structStep) {
        for (let y = -5; y <= 10; y += 5) {
          const pos = center.offset(x, y, z);
          const structure = this.identifyStructureAt(pos);
          
          if (structure) {
            switch (structure.type) {
              case 'building':
                structures.buildings.push(structure);
                break;
              case 'cave':
                structures.caves.push(structure);
                break;
              case 'bridge':
                structures.bridges.push(structure);
                break;
              case 'wall':
                structures.walls.push(structure);
                break;
              default:
                structures.naturalFormations.push(structure);
            }
          }
        }
      }
    }
    
    return structures;
  }

  // Finde baubare Flächen
  async findBuildableAreas(center, radius) {
    const areas = [];
    const minSize = 5; // Minimum 5x5 für Baubereich
    
    for (let x = -radius; x <= radius; x += minSize) {
      for (let z = -radius; z <= radius; z += minSize) {
        const corner = center.offset(x, 0, z);
        const area = this.checkBuildableArea(corner, minSize);
        
        if (area.suitable) {
          areas.push({
            center: area.center,
            size: area.size,
            flatness: area.flatness,
            material: area.groundMaterial,
            nearWater: area.nearWater,
            nearTrees: area.nearTrees,
            score: this.calculateBuildScore(area)
          });
        }
      }
    }
    
    // Sortiere nach Bau-Score
    return areas.sort((a, b) => b.score - a.score);
  }

  // Gefahren erkennen
  async detectDangers(center, radius) {
    const dangers = {
      lava: [],
      deepHoles: [],
      cliffs: [],
      monsters: [],
      tnt: [],
      fire: []
    };
    
    // Lave-Quellen
    const lavaBlocks = this.bot.findBlocks({
      point: center,
      matching: (block) => block.name.includes('lava'),
      maxDistance: radius
    });
    
    lavaBlocks.forEach(pos => {
      dangers.lava.push({
        position: pos,
        distance: center.distanceTo(pos),
        threat: 'high'
      });
    });
    
    // Tiefe Löcher (größere Schritte für Performance)
    const holeStep = Math.max(5, Math.floor(radius / 6));
    for (let x = -radius; x <= radius; x += holeStep) {
      for (let z = -radius; z <= radius; z += holeStep) {
        const pos = center.offset(x, 0, z);
        const depth = this.checkHoleDepth(pos);
        
        if (depth > 10) {
          dangers.deepHoles.push({
            position: pos,
            depth: depth,
            threat: depth > 20 ? 'high' : 'medium'
          });
        }
      }
    }
    
    // Monster in der Nähe
    const monsters = Object.values(this.bot.entities).filter(e => 
      e.type === 'mob' && 
      e.position.distanceTo(center) < radius &&
      this.isHostileMob(e)
    );
    
    monsters.forEach(mob => {
      dangers.monsters.push({
        type: mob.name,
        position: mob.position.clone(),
        distance: mob.position.distanceTo(center),
        threat: this.assessThreat(mob)
      });
    });
    
    return dangers;
  }

  // Wege analysieren
  async analyzePaths(center, radius) {
    const paths = {
      toWater: null,
      toTrees: null,
      toHighGround: null,
      toCaves: null,
      escapeRoutes: []
    };
    
    // Finde Pfade zu wichtigen Ressourcen
    const water = this.findNearestWater(center, radius);
    if (water) {
      paths.toWater = {
        target: water,
        distance: center.distanceTo(water),
        difficulty: this.assessPathDifficulty(center, water)
      };
    }
    
    // Fluchtrouten (4 Himmelsrichtungen)
    const directions = [
      new Vec3(1, 0, 0),   // Ost
      new Vec3(-1, 0, 0),  // West
      new Vec3(0, 0, 1),   // Süd
      new Vec3(0, 0, -1)   // Nord
    ];
    
    for (const dir of directions) {
      const escape = this.findEscapeRoute(center, dir, 20);
      if (escape) {
        paths.escapeRoutes.push(escape);
      }
    }
    
    return paths;
  }

  // Ressourcen-Cluster finden
  async findResourceClusters(center, radius) {
    const clusters = {
      wood: [],
      stone: [],
      ores: [],
      food: []
    };
    
    // Holz-Cluster (Wälder)
    const trees = this.bot.findBlocks({
      point: center,
      matching: (block) => block.name.includes('log'),
      maxDistance: radius,
      count: 100
    });
    
    if (trees.length > 0) {
      const woodClusters = this.clusterPositions(trees, 10);
      clusters.wood = woodClusters.map(c => ({
        center: c.center,
        size: c.positions.length,
        density: c.positions.length / (Math.PI * 100), // pro 10-Block Radius
        nearestDistance: center.distanceTo(c.center)
      }));
    }
    
    return clusters;
  }

  // Räumliche Beziehungen berechnen (OHNE Rekursion!)
  async calculateSpatialRelations(center, radius) {
    const relations = {
      // Was ist in jeder Richtung?
      directions: {
        north: await this.analyzeDirection(center, new Vec3(0, 0, -1), radius),
        south: await this.analyzeDirection(center, new Vec3(0, 0, 1), radius),
        east: await this.analyzeDirection(center, new Vec3(1, 0, 0), radius),
        west: await this.analyzeDirection(center, new Vec3(-1, 0, 0), radius),
        up: await this.analyzeDirection(center, new Vec3(0, 1, 0), radius / 2),
        down: await this.analyzeDirection(center, new Vec3(0, -1, 0), radius / 2)
      },
      
      // Vereinfachte Landmarken (ohne komplette Analyse)
      landmarks: [],
      
      // Basis-Empfehlungen
      suggestions: []
    };
    
    return relations;
  }

  // === Hilfsfunktionen ===

  getGroundHeight(pos) {
    // Start bei aktueller Höhe für Performance
    const startY = Math.min(Math.floor(pos.y) + 10, 100);
    
    for (let y = startY; y >= -64; y -= 2) { // 2er Schritte für Performance
      const block = this.bot.blockAt(new Vec3(Math.floor(pos.x), y, Math.floor(pos.z)));
      if (block && block.name !== 'air' && block.name !== 'cave_air') {
        // Genauer Check für exakte Höhe
        for (let exactY = y + 2; exactY > y - 2; exactY--) {
          const exactBlock = this.bot.blockAt(new Vec3(Math.floor(pos.x), exactY, Math.floor(pos.z)));
          if (exactBlock && exactBlock.name !== 'air' && exactBlock.name !== 'cave_air') {
            return exactY + 1;
          }
        }
        return y + 1;
      }
    }
    return null;
  }

  checkHoleDepth(pos) {
    const ground = this.getGroundHeight(pos);
    if (!ground) return 0;
    
    let depth = 0;
    for (let y = ground - 1; y >= -64; y--) {
      const block = this.bot.blockAt(new Vec3(pos.x, y, pos.z));
      if (!block || block.name === 'air' || block.name.includes('water')) {
        depth++;
      } else {
        break;
      }
    }
    return depth;
  }

  identifyStructureAt(pos) {
    // Prüfe 5x5x5 Bereich
    const materials = new Map();
    let artificialCount = 0;
    
    for (let dx = -2; dx <= 2; dx++) {
      for (let dy = -2; dy <= 2; dy++) {
        for (let dz = -2; dz <= 2; dz++) {
          const block = this.bot.blockAt(pos.offset(dx, dy, dz));
          if (block && block.name !== 'air') {
            materials.set(block.name, (materials.get(block.name) || 0) + 1);
            
            // Künstliche Blöcke?
            if (this.isArtificialBlock(block.name)) {
              artificialCount++;
            }
          }
        }
      }
    }
    
    if (artificialCount > 5) {
      return {
        type: 'building',
        position: pos.clone(),
        materials: Array.from(materials.entries()),
        confidence: artificialCount / 25
      };
    }
    
    return null;
  }

  isArtificialBlock(name) {
    const artificial = [
      'planks', 'bricks', 'stone_bricks', 'cobblestone',
      'glass', 'wool', 'concrete', 'terracotta'
    ];
    return artificial.some(a => name.includes(a));
  }

  checkBuildableArea(corner, size) {
    let totalHeight = 0;
    let minHeight = Infinity;
    let maxHeight = -Infinity;
    let solidCount = 0;
    
    const positions = [];
    
    for (let x = 0; x < size; x++) {
      for (let z = 0; z < size; z++) {
        const pos = corner.offset(x, 0, z);
        const height = this.getGroundHeight(pos);
        
        if (height !== null) {
          positions.push(new Vec3(pos.x, height, pos.z));
          totalHeight += height;
          minHeight = Math.min(minHeight, height);
          maxHeight = Math.max(maxHeight, height);
          
          const block = this.bot.blockAt(new Vec3(pos.x, height - 1, pos.z));
          if (block && this.isSolidBlock(block.name)) {
            solidCount++;
          }
        }
      }
    }
    
    const avgHeight = totalHeight / positions.length;
    const flatness = 1 - ((maxHeight - minHeight) / size);
    
    return {
      suitable: flatness > 0.7 && solidCount / positions.length > 0.8,
      center: corner.offset(size/2, avgHeight, size/2),
      size: size,
      flatness: flatness,
      groundMaterial: this.bot.blockAt(positions[0])?.name || 'unknown'
    };
  }

  isSolidBlock(name) {
    const nonSolid = ['air', 'water', 'lava', 'tall_grass', 'flower'];
    return !nonSolid.some(n => name.includes(n));
  }

  clusterPositions(positions, maxDist) {
    const clusters = [];
    const used = new Set();
    
    for (const pos of positions) {
      if (used.has(pos.toString())) continue;
      
      const cluster = {
        positions: [pos],
        center: pos.clone()
      };
      
      used.add(pos.toString());
      
      // Finde alle Positionen im Cluster
      for (const other of positions) {
        if (!used.has(other.toString()) && pos.distanceTo(other) <= maxDist) {
          cluster.positions.push(other);
          used.add(other.toString());
        }
      }
      
      // Berechne Zentrum
      if (cluster.positions.length > 1) {
        let sumX = 0, sumY = 0, sumZ = 0;
        for (const p of cluster.positions) {
          sumX += p.x;
          sumY += p.y;
          sumZ += p.z;
        }
        cluster.center = new Vec3(
          sumX / cluster.positions.length,
          sumY / cluster.positions.length,
          sumZ / cluster.positions.length
        );
      }
      
      clusters.push(cluster);
    }
    
    return clusters;
  }

  analyzeDirection(center, direction, distance) {
    const target = center.offset(
      direction.x * distance,
      direction.y * distance,
      direction.z * distance
    );
    
    // Was ist in dieser Richtung?
    const features = [];
    
    // Terrain (vereinfacht)
    const height = this.getGroundHeight(target);
    if (height) {
      const diff = height - center.y;
      if (Math.abs(diff) > 5) {
        features.push(diff > 0 ? 'bergauf' : 'bergab');
      }
    }
    
    // Nur wichtige Block-Types checken (performanter)
    const importantBlocks = ['water', 'lava', 'log', 'leaves'];
    
    for (const blockType of importantBlocks) {
      const found = this.bot.findBlock({
        point: target,
        matching: (block) => block.name.includes(blockType),
        maxDistance: 5
      });
      
      if (found) {
        if (blockType === 'water') features.push('wasser');
        else if (blockType === 'lava') features.push('lava');
        else if (blockType === 'log' || blockType === 'leaves') {
          features.push('wald');
          break; // Einmal Wald reicht
        }
      }
    }
    
    return features;
  }

  determineContext(pos, terrain = null) {
    const contexts = [];
    
    // Höhe
    if (pos.y > 100) contexts.push('hochgebirge');
    else if (pos.y > 80) contexts.push('berg');
    else if (pos.y < 60) contexts.push('tiefland');
    
    // Weitere Kontexte könnten hier ergänzt werden
    
    return contexts;
  }

  generateSpatialSuggestions(buildableAreas = [], dangers = {}, resources = {}) {
    const suggestions = [];
    
    // Vereinfachte Vorschläge ohne volle Analyse
    if (buildableAreas && buildableAreas.length > 0) {
      const best = buildableAreas[0];
      suggestions.push({
        action: 'bauen',
        location: best.center,
        reason: `Flache Fläche gefunden`
      });
    }
    
    return suggestions;
  }

  isHostileMob(entity) {
    const hostile = ['zombie', 'skeleton', 'creeper', 'spider', 'enderman'];
    return hostile.some(h => entity.name.toLowerCase().includes(h));
  }

  assessThreat(mob) {
    const dist = mob.position.distanceTo(this.bot.entity.position);
    if (mob.name.includes('creeper') && dist < 5) return 'critical';
    if (dist < 10) return 'high';
    if (dist < 20) return 'medium';
    return 'low';
  }
  
  // Fehlende Hilfsmethoden
  detectCliffs(heightMap) {
    const cliffs = [];
    // Vereinfachte Cliff-Erkennung
    return cliffs;
  }
  
  detectValleys(heightMap) {
    const valleys = [];
    // Vereinfachte Valley-Erkennung
    return valleys;
  }
  
  detectFlatAreas(heightMap) {
    const flatAreas = [];
    // Vereinfachte Flat-Area-Erkennung
    return flatAreas;
  }
  
  calculateBuildScore(area) {
    let score = 100;
    score *= area.flatness;
    if (area.nearWater) score += 20;
    if (area.nearTrees) score += 10;
    return score;
  }
  
  findNearestWater(center, radius) {
    const waterBlocks = this.bot.findBlocks({
      point: center,
      matching: (block) => block.name.includes('water'),
      maxDistance: radius,
      count: 1
    });
    return waterBlocks.length > 0 ? waterBlocks[0] : null;
  }
  
  findEscapeRoute(center, direction, distance) {
    const target = center.offset(
      direction.x * distance,
      direction.y * distance,
      direction.z * distance
    );
    
    return {
      direction: direction,
      target: target,
      clear: true // Vereinfacht
    };
  }
  
  assessPathDifficulty(from, to) {
    const dist = from.distanceTo(to);
    const heightDiff = Math.abs(to.y - from.y);
    
    if (heightDiff > dist) return 'hard';
    if (heightDiff > dist/2) return 'medium';
    return 'easy';
  }
  
  identifyLandmarks(analysis) {
    const landmarks = [];
    
    if (analysis.terrain?.highestPoint) {
      landmarks.push({
        type: 'mountain',
        position: analysis.terrain.highestPoint
      });
    }
    
    if (analysis.structures?.buildings?.length > 0) {
      landmarks.push({
        type: 'settlement',
        position: analysis.structures.buildings[0].position
      });
    }
    
    return landmarks;
  }
}

export default SpatialIntelligence;
