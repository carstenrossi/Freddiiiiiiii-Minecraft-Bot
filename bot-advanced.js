import mineflayer from 'mineflayer';
import pathfinderPlugin from 'mineflayer-pathfinder';
import minecraftData from 'minecraft-data';
import { Ollama } from 'ollama';
import { Vec3 } from 'vec3';
import { erweiterePromptMitWissen } from './minecraft-ai-knowledge.js';
import SpatialIntelligence from './spatial-intelligence.js';
import TemplateLoader from './template-loader.js';
import BuildSiteFinder from './build-site-finder.js';
import BuildExecutor from './build-executor.js';

const { pathfinder, Movements, goals } = pathfinderPlugin;

// Ollama initialisieren
const ollama = new Ollama({ host: 'http://127.0.0.1:11434' });
const MODELL = 'deepseek-v3.1:671b-cloud'; // 🔥 Beast-Modell!

// Bot-Konfiguration
const bot = mineflayer.createBot({
  host: 'localhost',
  port: 4444,
  username: 'Freddiiiiii',
  version: false,
});

bot.loadPlugin(pathfinder);

// Räumliche Intelligenz (wird nach spawn initialisiert)
let spatial = null;

// Template-System
let templateLoader = null;
let buildSiteFinder = null;
let buildExecutor = null;

// Minecraft-Data initialisieren nach Login
bot.once('login', () => {
  const mcData = minecraftData(bot.version);
  bot.mcData = mcData;
  console.log(`✅ Minecraft-Data initialisiert für Version ${bot.version}`);
  
  // ════════════════════════════════════════
  // 🔧 FIX: Chat-Signierung für Minecraft 1.21+
  // ════════════════════════════════════════
  // Problem: Minecraft 1.21+ verlangt Chat-Signierung für normale Nachrichten.
  // Mineflayer kann das nicht → Bot wird gekickt!
  // Lösung: Alle normalen Chat-Messages automatisch zu /say umwandeln.
  // /say ist ein Server-Command und braucht KEINE Signierung!
  // ════════════════════════════════════════
  const originalChat = bot.chat.bind(bot);
  bot.chat = (message) => {
    if (!message.startsWith('/')) {
      originalChat(`/say ${message}`);
    } else {
      originalChat(message);
    }
  };
  console.log('🔧 Chat-Fix aktiviert (alle Messages → /say)');
});

// Event: Bot ist verbunden
bot.on('spawn', async () => {
  console.log('✅ Bot ist verbunden und gespawnt!');
  console.log(`Position: ${bot.entity.position}`);
  
  // Initialisiere räumliche Intelligenz
  spatial = new SpatialIntelligence(bot);
  
  // Initialisiere Template-System
  templateLoader = new TemplateLoader(bot);
  buildSiteFinder = new BuildSiteFinder(bot);
  buildExecutor = new BuildExecutor(bot, goals);
  
  await sleep(1000);
  
  const spielerListe = Object.values(bot.players).filter(p => p.entity && p.username !== bot.username);
  
  if (spielerListe.length > 0) {
    const ersteSpieler = spielerListe[0];
    console.log(`🚀 Starte bei Spieler: ${ersteSpieler.username}`);
    bot.chat(`/tp @s ${ersteSpieler.username}`);
    await sleep(500);
  }
  
  bot.chat('Hi! Lass uns was starten. 🚀');
  
  // Starte automatische Loch-Überprüfung (alle 10 Sekunden)
  // OPTIONAL: Deaktiviere dies wenn es Probleme gibt
  // starteLochUeberwachung();
  console.log('⚠️ Loch-Überwachung DEAKTIVIERT (kann manuell mit "escape" aufgerufen werden)');
});

// Automatische Loch-Überwachung
let lochCheckInterval = null;
let letzterEscapeVersuch = 0;
let botBeschaeftigt = false; // Globaler Status

// ════════════════════════════════════════
// 🛡️ MACE-MODUS SYSTEM
// ════════════════════════════════════════
let maceModus = {
  aktiv: false,              // Ist Mace-Modus an?
  spieler: null,             // Welcher Spieler wird angeschaut
  spielerUsername: null,     // Username des Spielers
  startPosition: null,       // Wo Freddi stehen bleiben soll
  updateInterval: null,      // Interval für Kopf-Drehung und Updates
  startZeit: null,           // Wann wurde Mace gestartet
  mitSchild: false           // Hat Freddi ein Schild? (wichtig für Update-Loop)
};

// ════════════════════════════════════════
// ⚔️ SWORD-MODUS SYSTEM
// ════════════════════════════════════════
let swordModus = {
  aktiv: false,              // Ist Sword-Modus an?
  spieler: null,             // Welcher Spieler wird bekämpft
  spielerUsername: null,     // Username des Spielers
  kampfInterval: null,       // Interval für Kampf-Loop
  startZeit: null,           // Wann wurde Sword gestartet
  mitSchaden: true,          // true = echter Schaden (kann sterben), false = easy mode (unsterblich)
  letzterAngriff: 0          // Timestamp vom letzten Angriff (für Cooldown)
};

function starteLochUeberwachung() {
  // Verhindere mehrfache Intervals
  if (lochCheckInterval) {
    clearInterval(lochCheckInterval);
  }
  
  lochCheckInterval = setInterval(async () => {
    // NUR prüfen wenn Bot komplett IDLE ist
    if (bewegungsStatus.aktiv || botBeschaeftigt) {
      console.log('⏸️ Loch-Check übersprungen (Bot beschäftigt)');
      return;
    }
    
    const lochInfo = istInLoch();
    
    if (lochInfo.inLoch) {
      // Verhindere zu häufige Escape-Versuche (min 30 Sekunden Pause)
      const jetztZeit = Date.now();
      if (jetztZeit - letzterEscapeVersuch < 30000) {
        console.log('⏳ Warte bevor nächster Escape-Versuch...');
        return;
      }
      
      letzterEscapeVersuch = jetztZeit;
      console.log('🚨 AUTOMATISCHER LOCH-CHECK: Bot sitzt fest!');
      
      // Versuche rauszukommen
      await smartEscape();
    }
  }, 10000); // Alle 10 Sekunden prüfen
  
  console.log('👁️ Loch-Überwachung gestartet (alle 10 Sek)');
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// ============================================
// UMGEBUNGS-SCANNER
// ============================================

async function scanneUmgebung() {
  const pos = bot.entity.position;
  const radius = 32; // KONSISTENT mit Aktions-Reichweite!
  const scan = {
    position: { x: Math.floor(pos.x), y: Math.floor(pos.y), z: Math.floor(pos.z) },
    wasser: null,
    baeume: null,
    hoechsterPunkt: null,
    tiere: [],
    monster: [],
    spieler: [],
    inventar: getInventarInfo(),
    spatialAnalysis: null // Erweiterte räumliche Analyse
  };
  
  try {
    // Wasser
    const wasserBloecke = bot.findBlocks({
      matching: (block) => block && (block.name === 'water' || block.name === 'flowing_water'),
      maxDistance: radius,
      count: 50
    });
    
    if (wasserBloecke.length > 0) {
      const naechstes = wasserBloecke.reduce((n, c) => 
        pos.distanceTo(c) < pos.distanceTo(n) ? c : n
      );
      scan.wasser = {
        distanz: Math.floor(pos.distanceTo(naechstes)),
        position: { x: naechstes.x, y: naechstes.y, z: naechstes.z }
      };
    }
    
    // Bäume
    const holzBloecke = bot.findBlocks({
      matching: (block) => block && block.name.includes('log'),
      maxDistance: radius,
      count: 30
    });
    
    if (holzBloecke.length > 0) {
      const naechstes = holzBloecke.reduce((n, c) => 
        pos.distanceTo(c) < pos.distanceTo(n) ? c : n
      );
      scan.baeume = {
        anzahl: holzBloecke.length,
        distanz: Math.floor(pos.distanceTo(naechstes)),
        position: { x: naechstes.x, y: naechstes.y, z: naechstes.z }
      };
    }
    
    // Höchster Punkt / Berg finden
    try {
      const solidBloecke = bot.findBlocks({
        matching: (block) => block && block.name !== 'air' && !block.name.includes('water'),
        maxDistance: radius,
        count: 100
      });
      
      if (solidBloecke.length > 0) {
        // Finde höchsten Block
        const hoechster = solidBloecke.reduce((max, current) => 
          current.y > max.y ? current : max
        );
        
        // Nur als "Berg" markieren wenn deutlich höher als Bot
        if (hoechster.y > pos.y + 5) {
          scan.hoechsterPunkt = {
            hoehe: hoechster.y,
            unterschied: Math.floor(hoechster.y - pos.y),
            distanz: Math.floor(pos.distanceTo(hoechster)),
            position: { x: hoechster.x, y: hoechster.y, z: hoechster.z }
          };
        }
      }
    } catch (err) {
      console.log('Höhen-Scan fehlgeschlagen:', err.message);
    }
    
    // Entities
    const entities = Object.values(bot.entities).filter(e => 
      e.position && e.position.distanceTo(pos) < radius && e !== bot.entity
    );
    
    // console.log(`🔍 Gefundene Entities: ${entities.length}`); // Zu verbose
    
    for (const entity of entities) {
      // Reduzierte Logs (nur wichtige)
      if (entity.type === 'player') {
        scan.spieler.push({ name: entity.username, distanz: Math.floor(pos.distanceTo(entity.position)) });
      } else if (entity.type === 'mob' || entity.type === 'passive_mob' || entity.type === 'animal' || 
                 entity.type === 'hostile' || entity.type === 'passive' || entity.type === 'water_creature') {
        
        // entity.name ist oft der Entity-Typ, nicht der Display-Name!
        const entityTyp = entity.name || entity.displayName || entity.type || 'unbekannt';
        
        const istMonster = entityTyp && (
          entityTyp.includes('zombie') || entityTyp.includes('skeleton') ||
          entityTyp.includes('creeper') || entityTyp.includes('spider') ||
          entity.type === 'hostile'
        );
        
        if (istMonster) {
          // Berechne Richtung zum Monster
          const dx = entity.position.x - pos.x;
          const dz = entity.position.z - pos.z;
          const winkel = Math.atan2(dz, dx) * (180 / Math.PI);
          const botYaw = bot.entity.yaw * (180 / Math.PI);
          let relativWinkel = winkel - botYaw;
          
          // Normalisiere auf -180 bis 180
          while (relativWinkel > 180) relativWinkel -= 360;
          while (relativWinkel < -180) relativWinkel += 360;
          
          // Bestimme Richtung
          let richtung = '';
          if (Math.abs(relativWinkel) < 45) richtung = 'vor mir';
          else if (Math.abs(relativWinkel) > 135) richtung = 'hinter mir';
          else if (relativWinkel > 0) richtung = 'rechts';
          else richtung = 'links';
          
          scan.monster.push({ 
            typ: entityTyp, 
            distanz: Math.floor(pos.distanceTo(entity.position)),
            richtung: richtung
          });
        } else {
          // Berechne Richtung zum Tier
          const dx = entity.position.x - pos.x;
          const dz = entity.position.z - pos.z;
          const winkel = Math.atan2(dz, dx) * (180 / Math.PI);
          const botYaw = bot.entity.yaw * (180 / Math.PI);
          let relativWinkel = winkel - botYaw;
          
          // Normalisiere auf -180 bis 180
          while (relativWinkel > 180) relativWinkel -= 360;
          while (relativWinkel < -180) relativWinkel += 360;
          
          // Bestimme Richtung
          let richtung = '';
          if (Math.abs(relativWinkel) < 45) richtung = 'vor mir';
          else if (Math.abs(relativWinkel) > 135) richtung = 'hinter mir';
          else if (relativWinkel > 0) richtung = 'rechts';
          else richtung = 'links';
          
          scan.tiere.push({ 
            typ: entityTyp, 
            distanz: Math.floor(pos.distanceTo(entity.position)),
            richtung: richtung,
            position: { x: Math.floor(entity.position.x), y: Math.floor(entity.position.y), z: Math.floor(entity.position.z) }
          });
        }
      } else {
        // ALLE anderen Entities (falls type nicht mob/player ist)
        // console.log(`Andere Entity: ${entity.name || entity.displayName || 'unbekannt'}, Type: ${entity.type}`);
        
        // Versuche es als Tier zu behandeln
        if (entity.name || entity.displayName) {
          const dx = entity.position.x - pos.x;
          const dz = entity.position.z - pos.z;
          const winkel = Math.atan2(dz, dx) * (180 / Math.PI);
          const botYaw = bot.entity.yaw * (180 / Math.PI);
          let relativWinkel = winkel - botYaw;
          
          while (relativWinkel > 180) relativWinkel -= 360;
          while (relativWinkel < -180) relativWinkel += 360;
          
          let richtung = '';
          if (Math.abs(relativWinkel) < 45) richtung = 'vor mir';
          else if (Math.abs(relativWinkel) > 135) richtung = 'hinter mir';
          else if (relativWinkel > 0) richtung = 'rechts';
          else richtung = 'links';
          
          scan.tiere.push({ 
            typ: entity.name || entity.displayName || entity.type || 'unbekannt', 
            distanz: Math.floor(pos.distanceTo(entity.position)),
            richtung: richtung,
            position: { x: Math.floor(entity.position.x), y: Math.floor(entity.position.y), z: Math.floor(entity.position.z) }
          });
        }
      }
    }
    
  } catch (err) {
    console.error('Scan-Fehler:', err.message);
  }
  
  // Kompakte Zusammenfassung im Log
  const tierZusammenfassung = scan.tiere.map(t => t.typ).reduce((acc, typ) => {
    acc[typ] = (acc[typ] || 0) + 1;
    return acc;
  }, {});
  
  const tierListe = Object.entries(tierZusammenfassung).map(([typ, count]) => `${count}x${typ}`).join(', ');
  const monsterListe = scan.monster.map(m => m.typ).join(', ');
  
  console.log(`📊 Scan: Tiere:[${tierListe || 'keine'}] Monster:[${monsterListe || 'keine'}]`);
  
  // Erweiterte räumliche Analyse NUR auf Anfrage (zu performance-intensiv)
  // Wird nur bei expliziter "analyse" Anfrage durchgeführt
  
  return scan;
}

function getInventarInfo() {
  const items = bot.inventory.items();
  const zusammenfassung = {};
  
  for (const item of items) {
    const name = item.name;
    zusammenfassung[name] = (zusammenfassung[name] || 0) + item.count;
  }
  
  return zusammenfassung;
}

function formatiereUmgebungsInfo(scan) {
  const teile = [];
  
  teile.push(`📍 Position: X:${scan.position.x} Y:${scan.position.y} Z:${scan.position.z}`);
  
  if (scan.wasser) {
    teile.push(`💧 Wasser: ${scan.wasser.distanz}m entfernt`);
  }
  
  if (scan.baeume) {
    teile.push(`🌲 ${scan.baeume.anzahl} Bäume (nächster: ${scan.baeume.distanz}m)`);
  }
  
  if (scan.hoechsterPunkt) {
    teile.push(`⛰️ Berg: ${scan.hoechsterPunkt.unterschied}m höher`);
  }
  
  if (scan.monster.length > 0) {
    teile.push(`⚠️ ${scan.monster.length} Monster`);
  }
  
  if (scan.tiere.length > 0) {
    const tierInfo = scan.tiere.map(t => `${t.typ} (${t.richtung})`).join(', ');
    teile.push(`🐄 Tiere: ${tierInfo}`);
  }
  
  return teile.join(' | ');
}

// ============================================
// KATEGORIE-ERKENNUNG (Schnell & Kompakt!)
// ============================================

async function erkennKategorie(nachricht) {
  const prompt = `Kategorisiere diese Minecraft-Anfrage. Antworte NUR mit einem Wort:

Kategorien: bewegung, ressourcen, kampf, bau, info, konversation

Anfrage: "${nachricht}"

Kategorie:`;

  try {
    const response = await ollama.chat({
      model: MODELL,
      messages: [{ role: 'user', content: prompt }],
      stream: false
    });
    
    const kategorie = response.message.content.trim().toLowerCase();
    console.log(`📁 Kategorie: ${kategorie}`);
    return kategorie;
  } catch (err) {
    console.error('Kategorie-Fehler:', err.message);
    return 'konversation';
  }
}

// ============================================
// RÄUMLICHE ANALYSE FORMATTER
// ============================================

function formatSpatialAnalysis(analysis) {
  if (!analysis) return '';
  
  const parts = [];
  
  // Terrain
  if (analysis.terrain) {
    parts.push(`📍 Terrain: Durchschnittshöhe Y:${Math.floor(analysis.terrain.averageHeight)}`);
    if (analysis.terrain.highestPoint) {
      parts.push(`  ⛰️ Höchster Punkt: Y:${analysis.terrain.highestPoint.y}`);
    }
    if (analysis.terrain.flatAreas?.length > 0) {
      parts.push(`  🏗️ ${analysis.terrain.flatAreas.length} flache Bereiche gefunden`);
    }
  }
  
  // Baubare Flächen
  if (analysis.buildableAreas?.length > 0) {
    const best = analysis.buildableAreas[0];
    parts.push(`🏗️ Beste Baufläche gefunden (${best.size}x${best.size}, Flachheit: ${(best.flatness*100).toFixed(0)}%)`);
  }
  
  // Strukturen
  if (analysis.structures) {
    if (analysis.structures.buildings?.length > 0) {
      parts.push(`🏠 ${analysis.structures.buildings.length} Gebäude erkannt`);
    }
    if (analysis.structures.caves?.length > 0) {
      parts.push(`🕳️ ${analysis.structures.caves.length} Höhlen gefunden`);
    }
  }
  
  // Gefahren
  if (analysis.dangers) {
    const totalDangers = (analysis.dangers.lava?.length || 0) + 
                        (analysis.dangers.deepHoles?.length || 0) + 
                        (analysis.dangers.monsters?.length || 0);
    if (totalDangers > 0) {
      parts.push(`⚠️ ${totalDangers} Gefahren erkannt:`);
      if (analysis.dangers.lava?.length > 0) {
        parts.push(`  🔥 Lava: ${analysis.dangers.lava[0].distance.toFixed(0)}m`);
      }
      if (analysis.dangers.deepHoles?.length > 0) {
        parts.push(`  🕳️ Tiefe Löcher: ${analysis.dangers.deepHoles.length}`);
      }
    }
  }
  
  // Ressourcen
  if (analysis.resourceClusters) {
    if (analysis.resourceClusters.wood?.length > 0) {
      const biggest = analysis.resourceClusters.wood[0];
      parts.push(`🌳 Wald-Cluster: ${biggest.size} Bäume (${Math.floor(biggest.nearestDistance)}m)`);
    }
  }
  
  // Räumliche Empfehlungen
  if (analysis.spatialRelations?.suggestions?.length > 0) {
    parts.push('💡 Empfehlungen:');
    analysis.spatialRelations.suggestions.forEach(s => {
      parts.push(`  - ${s.action}: ${s.reason}`);
    });
  }
  
  return parts.join('\n');
}

// ============================================
// MULTI-STEP PLANNER
// ============================================

async function planeAktionen(nachricht, umgebung) {
  const istKomplex = nachricht.split(/und|dann|danach|bevor/).length > 1;
  
  // Hole kontextbezogenes Minecraft-Wissen (optional, da Cloud-Modell bereits viel weiß)
  let zusatzWissen = '';
  try {
    zusatzWissen = erweiterePromptMitWissen(nachricht, umgebung, umgebung.inventar || {});
  } catch (e) {
    // Fallback wenn Wissensdatei fehlt - Cloud-Modell hat genug eigenes Wissen
    console.log('📚 Nutze Cloud-Modell Wissen');
  }
  
  const prompt = `Du bist ein intelligenter Minecraft-Bot mit tiefem Verständnis für Minecraft-Mechaniken, Crafting-Rezepte, Bau-Techniken und Spielstrategien.

DEINE POSITION & UMGEBUNG:
Position: ${umgebung.position.x}, ${umgebung.position.y}, ${umgebung.position.z}
${umgebung.wasser ? `🌊 Wasser: ${umgebung.wasser.distanz}m entfernt` : '❌ Kein Wasser sichtbar'}
${umgebung.baeume ? `🌲 Bäume: ${umgebung.baeume.anzahl} Stück (nächster: ${umgebung.baeume.distanz}m)` : '❌ Keine Bäume sichtbar'}
${umgebung.hoechsterPunkt ? `⛰️ Berg: ${umgebung.hoechsterPunkt.unterschied}m höher (Y:${umgebung.hoechsterPunkt.hoehe})` : '🏔️ Flaches Terrain'}
${umgebung.monster.length > 0 ? `⚠️ Monster: ${umgebung.monster.map(m => `${m.typ}(${m.distanz}m, ${m.richtung})`).join(', ')}` : '✅ Keine Monster'}
${umgebung.tiere.length > 0 ? `🐄 Tiere: ${umgebung.tiere.map(t => `${t.typ}(${t.distanz}m, ${t.richtung})`).join(', ')}` : '🐾 Keine Tiere sichtbar'}

INVENTAR:
${Object.keys(umgebung.inventar).length > 0 ? Object.entries(umgebung.inventar).map(([k,v]) => `- ${v}x ${k}`).join('\n') : '🎒 Inventar ist leer'}


SPIELER-ANFRAGE: "${nachricht}"

NUTZE DEIN MINECRAFT-WISSEN:
- Überlege welche Materialien für die Anfrage optimal sind
- Beachte Minecraft-Physik (Schwerkraft bei Sand/Gravel, Wasser fließt 8 Blöcke, etc.)
- Plane effiziente Crafting-Ketten wenn nötig
- Berücksichtige Tageszeit und Monster-Spawning
- Denke an optimale Bau-Techniken (z.B. Fundament auf festem Grund)

INTENTS (kurz):
gehe_wasser, gehe_baum, gehe_berg, gehe_entity, komm_spieler, gehe_xy, tp_spieler, tp_xy
graben, sammle_holz, bauen, baue_farm, baue_template, angriff, essen, craften, interagieren
mace, mace_start, mace_easy, easy, mace_stop, training_dummy, stop
scan, analyse, position, inventar, schaue, drehe, escape, konversation

JSON-Format (${istKomplex ? 'Array erlaubt' : 'Einzeln'}):
${istKomplex ? `
{
  "aktionen":[
    {"intent":"gehe_baum"},
    {"intent":"sammle_holz","anzahl":20},
    {"intent":"bauen","material":"planks","struktur":"wand","groesse":"klein"}
  ],
  "antwort":"Ich gehe zum Baum, sammle Holz und baue!"
}` : `
{"intent":"komm_spieler","antwort":"Ich komme!"}`}

SPEZIAL-PARAMETER:
"bauen": NUR für sehr einfache Strukturen (1-4 Blöcke, Wand, Turm). Bei "Haus" IMMER baue_template nutzen!
"baue_template": FÜR HÄUSER! template (z.B. "japarabic-house-5"), position (optional)
"graben": breite (b), tiefe (t), laenge (l) - z.B. 3x5x3 Brunnen → {"breite":3,"tiefe":5,"laenge":3}
"angriff": typ (z.B. "zombie", "creeper", "llama")
"baue_farm": typ ("weizen"/"karotten"), groesse ("klein"/"mittel"/"gross")
"gehe_entity": typ (z.B. "sheep", "cow", "llama", "horse")

DENKPROZESS:
1. Analysiere die Anfrage mit deinem Minecraft-Wissen
2. Überlege welche Ressourcen/Schritte optimal wären
3. Plane realistische Minecraft-Aktionen
4. Bei "baue ein Haus aus Stein" → Weißt du dass man Cobblestone braucht!

BEISPIELE MIT MINECRAFT-INTELLIGENZ:
- "baue ein Haus" / "bau mir ein Haus" → IMMER Template nutzen!
  → {"intent":"baue_template","template":"japarabic-house-5","antwort":"Ich baue ein schönes Haus!"}
- "baue eine Farm/Weizenfarm" → Du weißt: Braucht Wasser, Acker, Seeds, Zaun
  → {"intent":"baue_farm","typ":"weizen","groesse":"klein"} ODER multi-step mit Wasser suchen
- "gehe mining" → Du weißt: Unter Y=60 findet man Erze
- "es wird dunkel" → Du weißt: Monster spawnen, Schutz nötig!
- "wo soll ich bauen?" → Nutze {"intent":"analyse"} für Bauplatze-Empfehlung
- "was ist um mich herum?" → Nutze {"intent":"scan"} oder {"intent":"analyse"}
- "dreh dich um" / "schau nach hinten" → {"intent":"schaue","richtung":"umdrehen"}
- "ich stecke fest" / "komm raus" → {"intent":"escape"} für Pillar aus Loch
- "töte das Lama" / "greife Zombie an" → {"intent":"angriff","typ":"llama"} oder {"intent":"angriff","typ":"zombie"}
- "geh zum Schaf" / "lauf zur Kuh" → {"intent":"gehe_entity","typ":"sheep"} oder {"intent":"gehe_entity","typ":"cow"}
- "grabe einen Brunnen" / "grabe 3x5x3" → {"intent":"graben","breite":3,"tiefe":5,"laenge":3,"antwort":"Ich grabe einen Brunnen!"}
- "baue ein Haus" / "bau mir ein Gebäude" → {"intent":"baue_template","template":"japarabic-house-5","antwort":"Ich baue ein Haus für dich!"}
- "mace" / "mace start" / "training dummy" → {"intent":"mace","antwort":"🛡️ Mace-Modus aktiviert! Ich blocke jetzt."}
- "mace easy" / "easy" → {"intent":"mace_easy","antwort":"😊 Easy-Modus aktiviert! Kein Schild!"}
- "stop" / "mace stop" → {"intent":"mace_stop","antwort":"Mace-Modus beendet!"}

${istKomplex ? 'MULTI-STEP erlaubt! Plane intelligent wie ein erfahrener Minecraft-Spieler.' : 'Single-Step - aber nutze dein Wissen!'}

Antworte NUR mit JSON:`;

  try {
    const response = await ollama.chat({
      model: MODELL,
      messages: [{ role: 'user', content: prompt }],
      stream: false,
      format: 'json',
      options: {
        temperature: 0.2,  // Niedrig für faktentreue Minecraft-Antworten
        top_p: 0.95,
        seed: 42  // Konsistente Antworten
      }
    });
    
    const result = JSON.parse(response.message.content.trim());
    console.log('📋 Plan:', JSON.stringify(result, null, 2));
    return result;
  } catch (err) {
    console.error('Planning-Fehler:', err.message);
    return { intent: 'konversation', antwort: 'Das habe ich nicht verstanden.' };
  }
}

// ============================================
// INTENT-EXECUTOR
// ============================================

async function fuehreIntentAus(intentData, username) {
  const intent = intentData.intent;
  console.log(`⚡ Führe aus: ${intent}`);
  
  try {
    switch (intent) {
      case 'gehe_wasser':
      case 'gehe_zu_wasser':
        const s1 = await scanneUmgebung();
        if (s1.wasser) {
          geheZuPosition(s1.wasser.position);
        } else {
          return 'Kein Wasser in Sicht!';
        }
        break;
        
      case 'gehe_baum':
      case 'gehe_zu_baum':
        const s2 = await scanneUmgebung();
        if (s2.baeume) {
          geheZuPosition(s2.baeume.position);
        } else {
          return 'Keine Bäume in Sicht!';
        }
        break;
        
      case 'gehe_berg':
      case 'gehe_hoch':
        const s3 = await scanneUmgebung();
        if (s3.hoechsterPunkt) {
          console.log(`⛰️ Gehe zu Berg auf Höhe ${s3.hoechsterPunkt.hoehe}`);
          geheZuPosition(s3.hoechsterPunkt.position);
        } else {
          return 'Kein Berg/Höhe in Sicht!';
        }
        break;
        
      case 'komm_spieler':
      case 'komm_zu_spieler':
        const spieler = bot.players[username];
        if (spieler?.entity) {
          geheZuPosition(spieler.entity.position);
        }
        break;
        
      case 'gehe_entity':
      case 'gehe_tier':
      case 'gehe_mob':
        const entityTyp = intentData.typ || intentData.entity || intentData.ziel;
        if (!entityTyp) {
          bot.chat('Zu welchem Tier soll ich gehen?');
          break;
        }
        
        // Suche Entity (32 Blöcke Radius wie bei Angriff)
        console.log(`🔍 Suche nach Entity-Typ: ${entityTyp}`);
        
        const alleEntities = Object.values(bot.entities);
        console.log(`📦 Gesamt-Entities: ${alleEntities.length}`);
        
        let spielerCount = 0, ohnePositionCount = 0, zuWeitCount = 0;
        const matchedEntities = [];
        
        const entities = alleEntities.filter(e => {
          // Stille Filter-Schritte, nur zählen
          if (e.type === 'player') {
            spielerCount++;
            return false;
          }
          if (e === bot.entity) return false;
          
          if (!e.position) {
            ohnePositionCount++;
            return false;
          }
          
          const dist = e.position.distanceTo(bot.entity.position);
          if (dist >= 32) {
            zuWeitCount++;
            return false;
          }
          
          const name = (e.name || e.displayName || e.type || '').toLowerCase();
          const matches = name.includes(entityTyp.toLowerCase());
          
          if (matches) {
            matchedEntities.push({ name: e.name, dist: dist.toFixed(1) });
          }
          
          return matches;
        });
        
        // Kompakte Zusammenfassung
        console.log(`  📊 Filter: Spieler:${spielerCount}, OhnePosition:${ohnePositionCount}, ZuWeit:${zuWeitCount}`);
        if (matchedEntities.length > 0) {
          console.log(`  ✅ Matches: ${matchedEntities.map(e => `${e.name}(${e.dist}m)`).join(', ')}`);
        }
        
        console.log(`📊 Gefundene ${entityTyp}: ${entities.length}`);
        
        if (entities.length === 0) {
          // Zeige alle Nicht-Spieler Entities zur Info
          const alleEntities = Object.values(bot.entities)
            .filter(e => e.type !== 'player' && e !== bot.entity && e.position && e.position.distanceTo(bot.entity.position) < 32)
            .map(e => `${e.name || e.type}(${e.type})`)
            .join(', ');
          
          console.log(`ℹ️ Verfügbare Entities in 32m: ${alleEntities || 'keine'}`);
          bot.chat(`❌ Kein ${entityTyp} in Reichweite! Verfügbar: ${alleEntities.substring(0, 50) || 'keine'}`);
          return 'Fehler_unterdrücke_antwort';
        }
        
        // Gehe zum nächsten
        const naechste = entities.reduce((n, c) => 
          bot.entity.position.distanceTo(c.position) < bot.entity.position.distanceTo(n.position) ? c : n
        );
        
        const naechsteName = naechste.name || naechste.displayName || naechste.type || 'Kreatur';
        const dist = Math.floor(bot.entity.position.distanceTo(naechste.position));
        
        bot.chat(`Gehe zu ${naechsteName} (${dist}m entfernt)!`);
        console.log(`🚶 Gehe zu ${naechsteName} bei ${naechste.position.x}, ${naechste.position.y}, ${naechste.position.z}`);
        
        geheZuPosition(naechste.position);
        break;
        
      case 'tp_spieler':
      case 'teleport_zu_spieler':
        bot.chat(`/tp @s ${username}`);
        await sleep(500);
        break;
        
      case 'gehe_xy':
      case 'gehe_koordinaten':
        if (intentData.x && intentData.y && intentData.z) {
          geheZuPosition({ x: intentData.x, y: intentData.y, z: intentData.z });
        }
        break;
        
      case 'graben':
        const b = intentData.breite || intentData.b || 4;
        const t = intentData.tiefe || intentData.t || 1;
        const l = intentData.laenge || intentData.l || 4;
        await grabeBereich(b, t, l);
        break;
        
      case 'sammle_holz':
        await sammleHolz(intentData.anzahl || 10);
        break;
        
      case 'bauen':
        await baueStruktur(
          intentData.typ || intentData.blockTyp || intentData.material || 'dirt', 
          intentData.muster || intentData.struktur || intentData.groesse || 'block'
        );
        break;
        
      case 'baue_farm':
        await baueFarm(
          intentData.typ || 'weizen',
          intentData.groesse || 'klein'
        );
        break;
        
      case 'baue_template':
        await baueTemplate(
          intentData.template || 'japarabic-house-5',
          intentData.position
        );
        break;
        
      case 'angriff':
        const angriffsResultat = await greifeMobAn(intentData.mobTyp || intentData.typ || intentData.ziel);
        if (angriffsResultat === 'nicht_gefunden') {
          return 'Fehler_unterdrücke_antwort'; // Signal: Zeige LLM-Antwort nicht
        }
        break;
        
      case 'essen':
        await esseNahrung();
        break;
        
      case 'craften':
        await crafteItem(intentData.item, intentData.anzahl || 1);
        break;
        
      case 'interagieren':
        await interagiereBlock(intentData.blockTyp || intentData.typ || 'door');
        break;
        
      case 'mace':
      case 'mace_start':
      case 'training_dummy':
        return await starteMaceModus(username, true); // MIT Schild
        
      case 'mace_easy':
      case 'easy':
      case 'mace_easy_start':
        return await starteMaceModus(username, false); // OHNE Schild
        
      case 'mace_stop':
      case 'stop':
        if (maceModus.aktiv) {
          return stoppeMaceModus();
        }
        break;
        
      case 'scan':
        const scan = await scanneUmgebung();
        return formatScanKompakt(scan);
        
      case 'position':
        const p = bot.entity.position;
        return `X:${p.x.toFixed(0)} Y:${p.y.toFixed(0)} Z:${p.z.toFixed(0)}`;
        
      case 'inventar':
        return formatInventar();
        
      case 'schaue':
      case 'drehe':
      case 'umdrehen':
        const r = intentData.richtung || 'umdrehen';
        
        if (r === 'hinten' || r === 'um' || r === 'umdrehen' || r === 'zurück') {
          // 180 Grad Drehung
          bot.look(bot.entity.yaw + Math.PI, bot.entity.pitch);
          bot.chat('🔄 Ich drehe mich um!');
          // Neuer Scan nach Drehung
          await sleep(500);
          const nachDrehung = await scanneUmgebung();
          if (nachDrehung.tiere.length > 0) {
            const hintenTiere = nachDrehung.tiere.filter(t => t.richtung === 'vor mir');
            if (hintenTiere.length > 0) {
              bot.chat(`👀 Oh! Da ist ein ${hintenTiere[0].typ}!`);
            }
          }
        } else if (r === 'rechts') {
          bot.look(bot.entity.yaw - Math.PI/2, bot.entity.pitch);
          bot.chat('➡️ Schaue nach rechts');
        } else if (r === 'links') {
          bot.look(bot.entity.yaw + Math.PI/2, bot.entity.pitch);
          bot.chat('⬅️ Schaue nach links');
        } else if (r === 'oben') {
          bot.look(bot.entity.yaw, -Math.PI/3);
          bot.chat('⬆️ Schaue nach oben');
        } else if (r === 'unten') {
          bot.look(bot.entity.yaw, Math.PI/3);
          bot.chat('⬇️ Schaue nach unten');
        }
        break;
        
      case 'escape':
        bot.chat('🆘 Versuche aus Loch zu entkommen...');
        const erfolg = await smartEscape();
        return erfolg ? 'Ich bin raus!' : 'Konnte nicht entkommen';
        
      case 'scan':
      case 'umgebung':
        const u = await scanneUmgebung();
        return formatiereUmgebungsInfo(u);
        
      case 'analyse':
      case 'raum_analyse':
        bot.chat('🔬 Führe detaillierte Raumanalyse durch...');
        
        // Führe spezielle räumliche Analyse durch (nicht bei jedem Scan!)
        if (spatial) {
          try {
            // Mit Timeout für Sicherheit
            const analysePromise = spatial.analyzeSpace({ 
              radius: 15,  // Noch kleiner für Performance
              center: bot.entity.position 
            });
            
            const timeoutPromise = new Promise((_, reject) => 
              setTimeout(() => reject(new Error('Analyse-Timeout')), 5000)
            );
            
            const spatialData = await Promise.race([analysePromise, timeoutPromise]);
            
            const formatted = formatSpatialAnalysis(spatialData);
            
            // Zeige kompakte Zusammenfassung im Chat
            const summary = formatted.split('\n').slice(0, 3).join(' | ');
            bot.chat(summary.substring(0, 256));
            
            // Vollständige Analyse in Konsole
            console.log('📊 Vollständige Raumanalyse:\n', formatted);
            
            return 'Analyse abgeschlossen';
          } catch (err) {
            console.error('Analyse-Fehler:', err.message);
            bot.chat('⚠️ Analyse abgebrochen (Timeout/Fehler)');
            return 'Analyse fehlgeschlagen';
          }
        } else {
          return 'Räumliche Intelligenz noch nicht bereit';
        }
        
      case 'konversation':
        // Nur Antwort, keine Aktion
        break;
    }
  } catch (err) {
    console.error(`Fehler bei ${intent}:`, err.message);
    return `Fehler: ${err.message}`;
  }
  
  return null;
}

function formatScanKompakt(scan) {
  let text = `Pos:${scan.position.x},${scan.position.y},${scan.position.z}`;
  if (scan.wasser) text += ` Wasser:${scan.wasser.distanz}m`;
  if (scan.baeume) text += ` Bäume:${scan.baeume.anzahl}`;
  if (scan.monster.length > 0) text += ` Monster:${scan.monster.length}`;
  if (scan.tiere.length > 0) {
    const tierTypen = scan.tiere.map(t => `${t.typ}(${t.richtung})`).join(',');
    text += ` Tiere:${tierTypen}`;
  }
  return text;
}

function formatInventar() {
  const items = bot.inventory.items();
  if (items.length === 0) return 'Leer';
  
  const zusammen = {};
  for (const item of items) {
    zusammen[item.name] = (zusammen[item.name] || 0) + item.count;
  }
  
  return Object.entries(zusammen)
    .map(([name, count]) => `${count}x${name}`)
    .slice(0, 5)
    .join(', ');
}

// ============================================
// HAUPT-CHAT mit MULTI-STEP
// ============================================

async function chatMitLLM(username, nachricht) {
  try {
    // Setze Bot-Status auf beschäftigt
    botBeschaeftigt = true;
    
    // 1. Umgebung scannen
    console.log('🔍 Scanne Umgebung...');
    const umgebung = await scanneUmgebung();
    
    // 2. Aktionen planen
    console.log('🧠 Plane Aktionen...');
    const plan = await planeAktionen(nachricht, umgebung);
    
    // 3. Aktionen ausführen
    if (plan.aktionen && Array.isArray(plan.aktionen)) {
      // Multi-Step mit Erfolgs-Checks!
      console.log(`🔗 Multi-Step-Plan mit ${plan.aktionen.length} Aktionen`);
      
      for (let i = 0; i < plan.aktionen.length; i++) {
        const aktion = plan.aktionen[i];
        console.log(`📍 Schritt ${i+1}/${plan.aktionen.length}: ${aktion.intent}`);
        
        // Führe Aktion aus
        const zusatz = await fuehreIntentAus(aktion, username);
        
        // Prüfe bei Bewegungs-Aktionen ob es geklappt hat
        const istBewegung = ['gehe_wasser', 'gehe_baum', 'komm_spieler', 'gehe_xy'].includes(aktion.intent);
        
        if (istBewegung) {
          // Warte auf Bewegungs-Resultat
          await sleep(2000);
          
          // Check ob Bot stuck ist
          if (bewegungsStatus.grund === 'kein_pfad') {
            bot.chat('Plan abgebrochen - ich komme nicht hin!');
            return 'Ich konnte den Plan nicht ausführen, weil ich nicht zum Ziel komme.';
          }
          
          // Bei langer Bewegung: Warte bis angekommen
          if (bewegungsStatus.aktiv) {
            bot.chat(`Unterwegs zu Schritt ${i+1}...`);
            
            // Warte maximal 20 Sekunden
            for (let wait = 0; wait < 40; wait++) {
              if (!bewegungsStatus.aktiv) break;
              
              // Prüfe alle 4 Sekunden ob Bot stuck ist
              if (wait % 8 === 0 && wait > 0) {
                const stuck = await istBotStuck();
                if (stuck) {
                  await befreieBot();
                }
              }
              
              await sleep(500);
            }
            
            // Timeout erreicht?
            if (bewegungsStatus.aktiv) {
              bot.chat('⏰ Bewegung dauert zu lange, breche ab!');
              bot.pathfinder.setGoal(null);
              bewegungsStatus = { aktiv: false, erfolg: false, grund: 'timeout' };
              return 'Plan abgebrochen wegen Timeout.';
            }
          }
        }
        
        if (zusatz) {
          bot.chat(zusatz);
        }
        
        // Pause zwischen Aktionen
        if (i < plan.aktionen.length - 1) {
          await sleep(500);
        }
      }
    } else if (plan.intent) {
      // Single-Step
      const zusatz = await fuehreIntentAus(plan, username);
      
      // Wenn Aktion fehlgeschlagen ist, zeige NICHT die optimistische LLM-Antwort
      if (zusatz === 'Fehler_unterdrücke_antwort') {
        return ''; // Keine Antwort (Funktion hat schon bot.chat gemacht)
      }
      
      if (zusatz) {
        return plan.antwort + ' ' + zusatz;
      }
    }
    
    return plan.antwort || 'Erledigt!';
    
  } catch (err) {
    console.error('❌ Chat-Fehler:', err.message);
    return 'Entschuldigung, da ist was schiefgelaufen.';
  } finally {
    // Bot wieder auf IDLE setzen
    botBeschaeftigt = false;
    console.log('✅ Bot wieder bereit');
  }
}

// ============================================
// AKTIONS-FUNKTIONEN
// ============================================

// Bewegungs-Status Tracking
let bewegungsStatus = { aktiv: false, erfolg: false, grund: null };

function geheZuPosition(ziel) {
  const mcData = minecraftData(bot.version);
  const move = new Movements(bot, mcData);
  
  // AGGRESSIVE Bewegungs-Einstellungen für Löcher/Höhen
  move.canDig = true;
  move.allow1by1towers = true; // Kann aus Löchern klettern! ✅
  move.allowParkour = false; // Kein Parkour
  move.maxDropDown = 4; // Max 4 Blöcke runter fallen
  move.infiniteLiquidDropdownDistance = false;
  
  // WICHTIG: Scaffolding-Blocks für Pillar aus Löchern!
  const bauMaterial = bot.inventory.items().find(i => 
    i.name && (
      i.name.includes('dirt') ||
      i.name.includes('cobblestone') ||
      i.name.includes('stone') ||
      i.name.includes('planks') ||
      i.name.includes('log')
    )
  );
  
  if (bauMaterial) {
    move.scaffoldingBlocks = [mcData.itemsByName[bauMaterial.name].id];
    console.log(`🧱 Nutze ${bauMaterial.name} zum Pillar`);
  } else {
    move.scaffoldingBlocks = [];
    console.log('⚠️ Kein Baumaterial für Pillar');
  }
  
  bot.pathfinder.setMovements(move);
  
  const aktuelleY = bot.entity.position.y;
  const hoehenUnterschied = Math.abs(ziel.y - aktuelleY);
  
  // IMMER zum echten Ziel gehen (auch bei Höhenunterschied!)
  if (hoehenUnterschied > 5) {
    console.log(`⛰️ Großer Höhenunterschied: ${hoehenUnterschied} Blöcke - versuche hochzuklettern!`);
  }
  
  // GoalNear mit 2 Blöcken Toleranz
  bot.pathfinder.setGoal(new goals.GoalNear(ziel.x, ziel.y, ziel.z, 2));
  
  bewegungsStatus = { aktiv: true, erfolg: false, grund: null };
  
  console.log(`🚶 Gehe zu: ${ziel.x}, ${ziel.y}, ${ziel.z} (aktuell Y:${Math.floor(aktuelleY)}, Diff:${Math.floor(hoehenUnterschied)})`);
  
  // Längerer Timeout für schwierige Pfade (60 Sekunden)
  // ABER: Nicht während Template-Bau!
  setTimeout(() => {
    if (bewegungsStatus.aktiv && !bewegungsStatus.erfolg && !botBeschaeftigt) {
      console.log('⏰ Bewegungs-Timeout nach 60s!');
      bot.pathfinder.setGoal(null);
      bewegungsStatus = { aktiv: false, erfolg: false, grund: 'timeout' };
      bot.chat('⏰ Ich komme nicht hin (zu schwieriger Weg)!');
    }
  }, 60000); // 60 Sekunden
}

bot.on('goal_reached', () => {
  console.log('✅ Ziel erreicht!');
  bewegungsStatus = { aktiv: false, erfolg: true, grund: null };
  bot.chat('✅ Angekommen!');
});

bot.on('path_update', (r) => {
  if (r.status === 'noPath') {
    // NUR loggen wenn KEIN Kampf-Modus aktiv ist!
    if (!swordModus.aktiv && !maceModus.aktiv) {
      console.log('❌ Kein Pfad!');
      bewegungsStatus = { aktiv: false, erfolg: false, grund: 'kein_pfad' };
      bot.chat('❌ Ich komme nicht hin - kein Pfad möglich!');
    }
    // Im Kampf-Modus: Stille ignorieren
  }
});

// Stuck Detection & Escape
async function istBotStuck() {
  const startPos = bot.entity.position.clone();
  await sleep(2000);
  const endPos = bot.entity.position;
  const bewegung = startPos.distanceTo(endPos);
  
  if (bewegung < 0.5 && bewegungsStatus.aktiv) {
    console.log('🚫 Bot steckt fest!');
    return true;
  }
  
  return false;
}

// Erkenne ob Bot in Loch ist
function istInLoch() {
  const pos = bot.entity.position;
  
  // VERBESSERTE Loch-Erkennung mit mehr Kontext
  
  // 1. Prüfe Wände in unmittelbarer Nähe (1 Block)
  const nordBlock = bot.blockAt(pos.offset(0, 0, -1));
  const suedBlock = bot.blockAt(pos.offset(0, 0, 1));
  const ostBlock = bot.blockAt(pos.offset(1, 0, 0));
  const westBlock = bot.blockAt(pos.offset(-1, 0, 0));
  
  const wandCount = [nordBlock, suedBlock, ostBlock, westBlock]
    .filter(b => b && b.name !== 'air').length;
  
  // 2. Prüfe ob es einen freien Weg raus gibt (2 Blöcke entfernt)
  let freieRichtungen = 0;
  const richtungen = [
    {x: 0, z: -2},  // Nord
    {x: 0, z: 2},   // Süd
    {x: 2, z: 0},   // Ost
    {x: -2, z: 0}   // West
  ];
  
  for (const richtung of richtungen) {
    const block1 = bot.blockAt(pos.offset(richtung.x / 2, 0, richtung.z / 2)); // 1 Block weg
    const block2 = bot.blockAt(pos.offset(richtung.x, 0, richtung.z)); // 2 Blöcke weg
    const bodenCheck = bot.blockAt(pos.offset(richtung.x, -1, richtung.z)); // Boden vorhanden?
    
    // Freie Richtung wenn: Beide Blöcke sind Luft UND Boden vorhanden
    if (block1 && block1.name === 'air' && 
        block2 && block2.name === 'air' &&
        bodenCheck && bodenCheck.name !== 'air') {
      freieRichtungen++;
    }
  }
  
  // 3. Prüfe Himmel über Bot
  let luftOben = 0;
  let deckeFest = false;
  for (let y = 1; y <= 5; y++) {
    const blockOben = bot.blockAt(pos.offset(0, y, 0));
    if (blockOben && blockOben.name === 'air') {
      luftOben++;
    } else if (blockOben && blockOben.name !== 'air') {
      deckeFest = true; // Feste Decke gefunden!
      break;
    }
  }
  
  // 4. Prüfe Terrain-Höhe (ist Bot wirklich TIEFER als Umgebung?)
  let hoehereTerrain = 0;
  for (let dx = -2; dx <= 2; dx++) {
    for (let dz = -2; dz <= 2; dz++) {
      if (dx === 0 && dz === 0) continue; // Skip Bot-Position
      
      // Finde Boden-Höhe in dieser Richtung
      for (let dy = 5; dy >= -5; dy--) {
        const checkBlock = bot.blockAt(pos.offset(dx, dy, dz));
        if (checkBlock && checkBlock.name !== 'air') {
          const bodenHoehe = pos.y + dy;
          // Ist dieser Boden höher als Bot?
          if (bodenHoehe > pos.y + 1) {
            hoehereTerrain++;
          }
          break;
        }
      }
    }
  }
  
  // STRIKTERE KRITERIEN für echtes Loch:
  // - ALLE 4 Wände + keine freien Wege ODER
  // - 3+ Wände + feste Decke + umgebendes Terrain ist höher
  const istEchtesLoch = (
    (wandCount === 4 && freieRichtungen === 0) || // Komplett eingeschlossen
    (wandCount >= 3 && deckeFest && hoehereTerrain >= 10) // Tiefe Grube mit Decke
  );
  
  if (istEchtesLoch) {
    const tiefe = Math.max(0, 65 - pos.y);
    console.log(`🕳️ ECHTES LOCH! Wände:${wandCount}, FreieWege:${freieRichtungen}, Decke:${deckeFest}, HöheresTerrain:${hoehereTerrain}`);
    return { inLoch: true, tiefe };
  }
  
  // Wenn nicht alle Kriterien erfüllt → KEIN Loch (z.B. Terrasse, Hügel)
  if (wandCount >= 3) {
    console.log(`✅ Keine Loch-Erkennung: Wände:${wandCount}, aber FreieWege:${freieRichtungen}, Decke:${deckeFest}`);
  }
  
  return { inLoch: false, tiefe: 0 };
}

// Smart Escape - Intelligentes Rauskommen
async function smartEscape() {
  const lochInfo = istInLoch();
  
  if (!lochInfo.inLoch) {
    console.log('✅ Nicht in Loch');
    return true;
  }
  
  const tiefe = lochInfo.tiefe;
  bot.chat(`🆘 Ich bin in einem Loch (${Math.floor(tiefe)}m tief)! Komme raus...`);
  console.log(`🆘 Escape-Strategie für ${Math.floor(tiefe)}m Tiefe`);
  
  try {
    // STRATEGIE: IMMER PILLARING (am zuverlässigsten!)
    // Suche Baumaterial
    const baublock = bot.inventory.items().find(i => 
      i.name.includes('dirt') || i.name.includes('cobblestone') || 
      i.name.includes('stone') || i.name.includes('log') ||
      i.name.includes('plank') || i.name.includes('sand') ||
      i.name.includes('gravel')
    );
    
    if (baublock) {
      console.log(`📍 Strategie: Pillaring mit ${baublock.name} (${baublock.count}x vorhanden)`);
      bot.chat(`Baue Turm mit ${baublock.displayName || baublock.name}...`);
      
      await bot.equip(baublock, 'hand');
      
      const zielHoehe = Math.max(Math.ceil(tiefe) + 2, 5); // Min 5, besser mehr
      let erfolg = 0;
      
      for (let i = 0; i < zielHoehe; i++) {
        try {
          // Schaue nach unten
          await bot.look(0, Math.PI / 2, true); // Pitch runter
          await sleep(50);
          
          // Springe
          bot.setControlState('jump', true);
          await sleep(150);
          
          // Platziere Block unter sich
          const unterMir = bot.entity.position.offset(0, -1, 0);
          const ref = bot.blockAt(unterMir);
          
          if (ref && ref.name === 'air') {
            // Schaue zum Referenzblock unter dem Luft-Block
            const boden = bot.blockAt(unterMir.offset(0, -1, 0));
            if (boden && boden.name !== 'air') {
              await bot.placeBlock(boden, new Vec3(0, 1, 0));
              erfolg++;
              console.log(`📦 Pillar ${erfolg}/${zielHoehe}`);
            }
          }
          
          bot.setControlState('jump', false);
          await sleep(300);
        } catch (e) {
          console.log(`Pillar-Fehler: ${e.message}`);
        }
      }
      
      // Prüfe ob raus
      await sleep(500);
      const nachEscape = istInLoch();
      
      if (!nachEscape.inLoch) {
        bot.chat(`✅ Rausgepillart! (${erfolg} Blöcke)`);
        return true;
      } else {
        bot.chat('⚠️ Noch nicht ganz raus, versuche weiter...');
        // Fallback: Nach oben graben
      }
    }
    
    // FALLBACK: Kein Material oder Pillaring hat nicht gereicht → Nach oben graben
    console.log('📍 Fallback-Strategie: Nach oben graben');
    bot.chat('Grabe nach oben...');
    
    for (let y = 1; y <= Math.ceil(tiefe) + 3; y++) {
      const block = bot.blockAt(bot.entity.position.offset(0, y, 0));
      
      if (block && block.name !== 'air') {
        console.log(`⛏️ Grabe ${block.name} bei Y+${y}`);
        await bot.dig(block);
        await sleep(200);
      }
    }
    
    // Jetzt versuche hochzuspringen
    for (let jump = 0; jump < 10; jump++) {
      bot.setControlState('jump', true);
      await sleep(250);
      bot.setControlState('jump', false);
      await sleep(150);
    }
    
    // Final-Check
    await sleep(500);
    const finalCheck = istInLoch();
    
    if (!finalCheck.inLoch) {
      bot.chat('✅ Rausgegraben!');
      return true;
    } else {
      bot.chat('❌ Escape fehlgeschlagen! Bitte teleportiere mich: /tp Freddiiiiii @p');
      return false;
    }
    
  } catch (err) {
    console.error('❌ Escape gescheitert:', err.message);
    bot.chat('❌ Ich komme nicht raus! Bitte teleportiere mich!');
    return false;
  }
}

async function grabeBereich(b, t, l, mitTreppe = true) {
  bot.chat(`🔨 Grabe ${b}x${t}x${l}${mitTreppe ? ' mit Treppe' : ''}...`);
  console.log(`⛏️ Starte Graben: ${b}x${t}x${l} Bereich${mitTreppe ? ' (mit Treppe)' : ''}`);
  
  try {
    // Debug: Zeige verfügbare Items
    const allItems = bot.inventory.items().map(i => i.name).join(', ');
    console.log(`📦 Inventar: ${allItems || 'leer'}`);
    
    // Versuche Schaufel oder Spitzhacke zu equippen
    const werkzeug = bot.inventory.items().find(i => 
      i.name && (
        i.name.includes('shovel') || 
        i.name.includes('pickaxe') ||
        i.name.includes('spade') // Alternative Bezeichnung
      )
    );
    
    if (werkzeug) {
      try {
        await bot.equip(werkzeug, 'hand');
        console.log(`🔧 Equippe ${werkzeug.name} zum Graben`);
        bot.chat(`Nutze ${werkzeug.name}...`);
      } catch (equipErr) {
        console.error('⚠️ Equip-Fehler:', equipErr.message);
        bot.chat('Nutze Hand (kein Werkzeug)...');
      }
    } else {
      console.log('⚠️ Kein Grab-Werkzeug gefunden, nutze Hand');
      bot.chat('⚠️ Keine Schaufel/Spitzhacke - das wird langsam!');
      
      // Optional: Prüfe ob Material zum Craften da ist
      const holzSticks = bot.inventory.items().find(i => i.name === 'stick');
      const holzPlanks = bot.inventory.items().find(i => i.name.includes('planks'));
      
      if (holzSticks && holzPlanks && holzPlanks.count >= 3) {
        bot.chat('💡 Tipp: Ich könnte eine Holz-Schaufel craften!');
      }
    }
    
    const start = bot.entity.position.clone();
    let count = 0;
    
    // Wenn Treppe gewünscht und tief genug (>2 Blöcke)
    const baueTreppe = mitTreppe && t >= 3;
    
    if (baueTreppe) {
      bot.chat('🪜 Grabe mit Treppen-Ausgang...');
    }
    
    for (let y = 0; y < t; y++) {
      for (let z = 0; z < l; z++) {
        for (let x = 0; x < b; x++) {
          // EINFACHE LÖSUNG: Lasse eine Seite komplett frei zum Raus-Graben
          if (baueTreppe && x === 0 && z === 0) {
            continue; // Skip erste Spalte - hier kann man rausgraben
          }
          
          const pos = start.offset(x, -(y + 1), z);
          const block = bot.blockAt(pos);
          
          if (!block || block.name === 'air') continue;
          
          // Bewege dich hin wenn zu weit
          if (bot.entity.position.distanceTo(pos) > 4.5) {
            try {
              await bot.pathfinder.goto(new goals.GoalBlock(pos.x, pos.y + 1, pos.z));
            } catch (moveErr) {
              console.log(`⚠️ Kann nicht zu Block bewegen: ${moveErr.message}`);
              continue;
            }
          }
          
          try {
            await bot.dig(block);
            count++;
            await sleep(100);
          } catch (digErr) {
            console.log(`⚠️ Graben fehlgeschlagen: ${digErr.message}`);
          }
        }
      }
      if (t > 1) bot.chat(`Schicht ${y+1}/${t}`);
    }
    
    // Nach Graben: Gehe zur Treppe raus
    if (baueTreppe) {
      bot.chat('🚶 Gehe Treppe hoch...');
      await sleep(500);
      
      try {
        // Gehe zur Ecke mit der Treppe
        const treppenAusgang = start.offset(0, 0, 0);
        await bot.pathfinder.goto(new goals.GoalNear(treppenAusgang.x, treppenAusgang.y, treppenAusgang.z, 1));
        bot.chat('✅ Aus dem Loch!');
      } catch (exitErr) {
        console.log('⚠️ Konnte nicht zur Treppe:', exitErr.message);
      }
    }
    
    bot.chat(`✅ ${count} Blöcke gegraben!`);
  } catch (err) {
    bot.chat(`❌ ${err.message}`);
  }
}

async function sammleHolz(anzahl) {
  bot.chat(`🌳 Sammle ${anzahl} Holz...`);
  
  try {
    const bloecke = bot.findBlocks({
      matching: (b) => b && b.name.includes('log'),
      maxDistance: 64,
      count: anzahl * 2
    });
    
    if (bloecke.length === 0) {
      bot.chat('Keine Bäume in Sicht!');
      throw new Error('Keine Bäume gefunden');
    }
    
    const naechster = bloecke.reduce((n, c) => 
      bot.entity.position.distanceTo(c) < bot.entity.position.distanceTo(n) ? c : n
    );
    
    const dist = bot.entity.position.distanceTo(naechster);
    console.log(`📍 Nächster Holzblock: ${Math.floor(dist)}m entfernt`);
    
    // NUR hingehen wenn weit weg (>8 Blöcke)
    if (dist > 8) {
      console.log(`🚶 Gehe zum Baum (${Math.floor(dist)}m)`);
      bot.chat(`Gehe zum Baum...`);
      geheZuPosition(naechster);
      
      // Warte auf Ankunft (maximal 15 Sekunden)
      for (let w = 0; w < 30; w++) {
        if (!bewegungsStatus.aktiv || bewegungsStatus.erfolg) break;
        
        if (bewegungsStatus.grund === 'kein_pfad') {
          bot.chat('❌ Kann nicht zum Baum!');
          throw new Error('Kein Pfad zum Baum');
        }
        
        await sleep(500);
      }
      
      if (bewegungsStatus.aktiv) {
        bot.chat('⏰ Timeout beim Gehen!');
        bot.pathfinder.setGoal(null);
        throw new Error('Timeout');
      }
      
      await sleep(500); // Kurz stabilisieren
    } else {
      console.log(`✅ Bereits nah genug am Baum (${Math.floor(dist)}m)`);
    }
    
    // Jetzt sammeln!
    console.log(`⛏️ Starte Abbau von ${anzahl} Holzblöcken`);
    let gesammelt = 0;
    
    for (const pos of bloecke) {
      if (gesammelt >= anzahl) break;
      
      const block = bot.blockAt(pos);
      if (block && block.name.includes('log')) {
        // Prüfe Reichweite
        const entfernung = bot.entity.position.distanceTo(pos);
        if (entfernung > 5) {
          console.log(`Block zu weit (${Math.floor(entfernung)}m), überspringe`);
          continue;
        }
        
        await bot.dig(block);
        gesammelt++;
        console.log(`⛏️ Holz ${gesammelt}/${anzahl}`);
        await sleep(100);
      }
    }
    
    if (gesammelt === 0) {
      bot.chat('❌ Konnte kein Holz sammeln!');
      throw new Error('Kein Holz gesammelt');
    }
    
    bot.chat(`✅ ${gesammelt} Holz gesammelt!`);
  } catch (err) {
    bot.chat(`❌ Holz-Sammeln fehlgeschlagen: ${err.message}`);
    throw err; // Werfe Fehler weiter damit Multi-Step abbricht
  }
}

async function baueStruktur(blockTyp, muster) {
  bot.chat(`🏗️ Baue ${muster || 'Struktur'}...`);
  
  try {
    // Intelligente Item-Suche (auch für abstrakte Begriffe wie "haus")
    let item = null;
    
    // Wenn "haus" oder abstrakt → Suche nach Planken/Holz
    if (blockTyp === 'haus' || blockTyp === 'klein' || blockTyp === 'struktur') {
      item = bot.inventory.items().find(i => 
        i.name.includes('plank') || 
        i.name.includes('log') ||
        i.name.includes('cobblestone') ||
        i.name.includes('stone')
      );
      if (item) {
        console.log(`🔧 Nutze ${item.name} für Bau`);
      }
    } else {
      // Spezifischer Block-Typ
      item = bot.inventory.items().find(i => i.name.includes(blockTyp));
    }
    
    if (!item) {
      const inv = bot.inventory.items().map(i => i.name).join(', ');
      bot.chat(`Kein Baumaterial! Inventar: ${inv.substring(0, 50)}...`);
      throw new Error('Kein Baumaterial im Inventar');
    }
    
    bot.chat(`Nutze ${item.name}...`);
    await bot.equip(item, 'hand');
    const startPos = bot.entity.position.floored();
    let count = 0;
    
    // WICHTIG: Erst in sichere Position bewegen!
    console.log('🚶 Bewege mich in Bauposition...');
    
    // Sichere Bau-Position je nach Muster
    let bauPos = startPos.clone();
    if (muster === 'turm') {
      // Bei Turm: 2 Blöcke zur Seite gehen
      geheZuPosition(startPos.offset(2, 0, 0));
      await sleep(2000); // Warte auf Bewegung
      bauPos = startPos; // Baue auf ursprünglicher Position
    } else {
      // Bei anderen: 2 Blöcke zurück für bessere Sicht  
      geheZuPosition(startPos.offset(-2, 0, 0));
      await sleep(2000); // Warte auf Bewegung
    }
    
    // Intelligente Muster
    if (muster === 'reihe' || muster === 'bruecke') {
      // Baue Reihe VORWÄRTS von aktueller Position
      for (let x = 3; x <= 7; x++) { // Start bei 3 für Sicherheitsabstand
        const blockPos = startPos.offset(x, -1, 0);
        const ref = bot.blockAt(blockPos);
        if (ref && ref.name !== 'air') {
          try {
            await bot.lookAt(blockPos.offset(0.5, 0.5, 0.5));
            await bot.placeBlock(ref, new Vec3(0, 1, 0));
            count++;
            await sleep(300);
          } catch (e) {
            console.log(`Block ${x} fehlgeschlagen: ${e.message}`);
          }
        }
      }
    } else if (muster === 'turm') {
      // Turm an bauPos (nicht wo Bot steht!)
      bot.chat('Baue Turm von der Seite...');
      
      for (let y = 0; y <= 5; y++) {
        try {
          const turmPos = bauPos.offset(0, y, 0);
          
          // Schaue zum Turm
          await bot.lookAt(turmPos.offset(0.5, 0.5, 0.5));
          
          // Finde Referenzblock (der Block UNTER dem zu platzierenden)
          const refPos = bauPos.offset(0, y-1, 0);
          const ref = bot.blockAt(refPos);
          
          if (ref && ref.name !== 'air') {
            await bot.placeBlock(ref, new Vec3(0, 1, 0));
            count++;
            console.log(`🏗️ Turm-Ebene ${y} gebaut`);
            await sleep(400);
          }
        } catch (e) {
          console.log(`Turm-Fehler bei Y=${y}: ${e.message}`);
        }
      }
    } else {
      // "haus" oder unbekannt → Baue kleine Wand/Box
      bot.chat('Baue Struktur mit Abstand...');
      
      // Baue 2x2 Blöcke VORWÄRTS für Mini-Haus Grundriss
      for (let x = 3; x <= 4; x++) {
        for (let z = -1; z <= 0; z++) {
          try {
            // Finde Boden-Block als Referenz
            const bodenPos = startPos.offset(x, -1, z);
            const bodenBlock = bot.blockAt(bodenPos);
          
            if (!bodenBlock || bodenBlock.name === 'air') {
              console.log(`Kein Boden bei ${x},${z}, überspringe`);
              continue;
            }
            
            // Schaue zum Block-Platz
            await bot.lookAt(bodenPos.offset(0.5, 1.5, 0.5));
            
            // Platziere Block AUF dem Boden
            await bot.placeBlock(bodenBlock, new Vec3(0, 1, 0));
            count++;
            console.log(`🧱 Block ${count} platziert bei ${x},${z}`);
            await sleep(400); // Pause gegen Timeout
            
          } catch (e) {
            console.log(`Fehler bei Block ${x},${z}: ${e.message.substring(0,50)}`);
            await sleep(200);
          }
        }
      }
    }
    
    if (count === 0) {
      bot.chat('❌ Konnte nichts bauen - kein stabiler Untergrund?');
      throw new Error('Nichts gebaut');
    }
    
    bot.chat(`✅ ${count} Blöcke gebaut!`);
  } catch (err) {
    console.error('Bau-Fehler:', err.message);
    bot.chat(`❌ Bau fehlgeschlagen`);
    throw err;
  }
}

async function baueFarm(farmTyp = 'weizen', groesse = 'klein') {
  bot.chat(`🌾 Baue ${groesse}e ${farmTyp}-Farm...`);
  
  try {
    const pos = bot.entity.position.clone();
    
    // Größen-Definition
    const farmSizes = {
      'klein': { breite: 9, laenge: 9 },    // 9x9 mit Wasser in Mitte
      'mittel': { breite: 15, laenge: 15 }, // Größere Farm
      'gross': { breite: 21, laenge: 21 }   // Sehr große Farm
    };
    
    const size = farmSizes[groesse] || farmSizes.klein;
    const mitte = Math.floor(size.breite / 2);
    
    // 1. Check für Wasserquelle
    bot.chat('🔍 Suche nach Wasser...');
    const wasserBlocks = bot.findBlocks({
      matching: (block) => block.name === 'water',
      maxDistance: 20,
      count: 1
    });
    
    let wasserPos;
    if (wasserBlocks.length > 0) {
      wasserPos = wasserBlocks[0];
      bot.chat(`💧 Wasser gefunden bei ${wasserPos}`);
    } else {
      // Wasser platzieren (wenn Eimer vorhanden)
      const eimer = bot.inventory.items().find(i => i.name === 'water_bucket');
      if (eimer) {
        wasserPos = pos.offset(mitte, -1, mitte);
        const lochBlock = bot.blockAt(wasserPos.offset(0, -1, 0));
        if (lochBlock) {
          await bot.dig(lochBlock);
          await sleep(300);
          await bot.equip(eimer, 'hand');
          await bot.placeBlock(lochBlock, new Vec3(0, 1, 0));
          bot.chat('💧 Wasser platziert!');
        }
      } else {
        bot.chat('❌ Kein Wasser gefunden und kein Eimer vorhanden!');
        throw new Error('Kein Wasser für Farm');
      }
    }
    
    // 2. Hoe finden oder craften
    let hoe = bot.inventory.items().find(i => i.name.includes('hoe'));
    if (!hoe) {
      bot.chat('🔨 Keine Hacke gefunden - improvisiere...');
      // Könnte hier Hoe craften, aber erstmal vereinfacht
    }
    
    // 3. Farmland erstellen
    bot.chat('🚜 Bearbeite Boden...');
    let bearbeiteteFelder = 0;
    
    for (let x = -mitte; x <= mitte; x++) {
      for (let z = -mitte; z <= mitte; z++) {
        // Skip Wasser in der Mitte
        if (Math.abs(x) <= 1 && Math.abs(z) <= 1) continue;
        
        const feldPos = pos.offset(x, -1, z);
        const block = bot.blockAt(feldPos);
        
        if (block && (block.name === 'grass_block' || block.name === 'dirt')) {
          try {
            // Mit Hoe bearbeiten (rechtsklick)
            if (hoe) {
              await bot.equip(hoe, 'hand');
            }
            
            // Farmland erstellen durch "use" auf dirt/grass
            await bot.lookAt(feldPos.offset(0.5, 0.5, 0.5));
            
            // Simuliere Rechtsklick zum Hacken
            await bot.activateBlock(block); // Das macht farmland mit hoe
            await sleep(200);
            
            bearbeiteteFelder++;
            
          } catch (e) {
            console.log(`Fehler bei Feld ${x},${z}: ${e.message}`);
          }
        }
      }
    }
    
    bot.chat(`✅ ${bearbeiteteFelder} Felder bearbeitet!`);
    
    // 4. Seeds pflanzen
    const seeds = bot.inventory.items().find(i => 
      i.name === 'wheat_seeds' || 
      i.name === 'carrot' || 
      i.name === 'potato'
    );
    
    if (seeds) {
      bot.chat(`🌱 Pflanze ${seeds.name}...`);
      await bot.equip(seeds, 'hand');
      
      let gepflanzt = 0;
      for (let x = -mitte; x <= mitte; x++) {
        for (let z = -mitte; z <= mitte; z++) {
          if (Math.abs(x) <= 1 && Math.abs(z) <= 1) continue;
          
          const feldPos = pos.offset(x, -1, z);
          const block = bot.blockAt(feldPos);
          
          if (block && block.name === 'farmland') {
            try {
              await bot.placeBlock(block, new Vec3(0, 1, 0));
              gepflanzt++;
              await sleep(150);
            } catch (e) {
              // Ignoriere Fehler beim Pflanzen
            }
          }
        }
      }
      
      bot.chat(`✅ ${gepflanzt} Samen gepflanzt!`);
    } else {
      bot.chat('⚠️ Keine Samen vorhanden!');
    }
    
    // 5. Optional: Zaun bauen
    const zaun = bot.inventory.items().find(i => i.name.includes('fence'));
    if (zaun && groesse === 'klein') {
      bot.chat('🚧 Baue Zaun...');
      // Vereinfacht - nur Ecken markieren
      const ecken = [
        pos.offset(-mitte-1, 0, -mitte-1),
        pos.offset(mitte+1, 0, -mitte-1),
        pos.offset(-mitte-1, 0, mitte+1),
        pos.offset(mitte+1, 0, mitte+1)
      ];
      
      for (const ecke of ecken) {
        const boden = bot.blockAt(ecke.offset(0, -1, 0));
        if (boden && boden.name !== 'air') {
          try {
            await bot.equip(zaun, 'hand');
            await bot.placeBlock(boden, new Vec3(0, 1, 0));
            await sleep(300);
          } catch (e) {
            console.log('Zaun-Fehler:', e.message);
          }
        }
      }
    }
    
    bot.chat(`🎉 Farm fertig! ${bearbeiteteFelder} Felder angelegt.`);
    
  } catch (err) {
    bot.chat(`❌ Farm-Fehler: ${err.message}`);
    throw err;
  }
}

async function baueTemplate(templateName, position = null) {
  bot.chat(`🏗️ Lade Template: ${templateName}...`);
  console.log(`📋 Template-Bau gestartet: ${templateName}`);
  
  try {
    // 1. Template laden
    const template = await templateLoader.loadTemplate(templateName);
    console.log(`✅ Template geladen: ${template.title}`);
    console.log(`📐 Dimensionen: ${template.dimensions.width}x${template.dimensions.depth}x${template.dimensions.height}`);
    
    bot.chat(`Template: ${template.title} (${template.dimensions.width}x${template.dimensions.depth}x${template.dimensions.height})`);
    
    // 2. Baufläche finden (wenn keine Position angegeben)
    let buildPos;
    let siteResult = null;
    
    if (position) {
      buildPos = new Vec3(position.x, position.y, position.z);
      console.log(`📍 Nutze angegebene Position: ${buildPos}`);
    } else {
      console.log('🔍 Suche geeignete Baufläche...');
      bot.chat('Suche einen guten Bauplatz...');
      
      siteResult = await buildSiteFinder.findBuildSite(
        template,
        bot.entity.position,
        32 // Suchradius
      );
      
      if (!siteResult.success && !siteResult.terraformNeeded) {
        bot.chat('❌ Keine geeignete Baufläche gefunden!');
        console.error('Probleme:', siteResult.issues.join(', '));
        throw new Error('Keine Baufläche gefunden');
      }
      
      buildPos = siteResult.position;
      
      if (siteResult.terraformNeeded) {
        bot.chat('⚠️ Bauplatz benötigt Vorbereitung...');
        console.log('Probleme:', siteResult.issues.join(', '));
      } else {
        bot.chat('✅ Perfekten Bauplatz gefunden!');
      }
    }
    
    // Runde Position auf ganze Zahlen
    buildPos = new Vec3(
      Math.floor(buildPos.x),
      Math.floor(buildPos.y),
      Math.floor(buildPos.z)
    );
    
    console.log(`🏗️ Bauposition: ${buildPos.x}, ${buildPos.y}, ${buildPos.z}`);
    
    // 3. Material-System: Gib initial-Materialien (System füllt automatisch nach)
    const materialCheck = buildExecutor.checkMaterials(template);
    if (!materialCheck.sufficient) {
      bot.chat('📦 Beschaffe Baumaterialien...');
      
      // Gib initial-Stacks für jedes Material
      for (const missing of materialCheck.missing) {
        const name = missing.name;
        const initialAmount = Math.min(missing.missing, 64); // Erstmal 1 Stack
        
        console.log(`📦 Initial-Material: /give ${bot.username} ${name} ${initialAmount}`);
        bot.chat(`/give ${bot.username} ${name} ${initialAmount}`);
        await sleep(200);
      }
      
      bot.chat('✅ Start-Materialien bereit!');
      bot.chat('💡 System füllt automatisch nach während Bau');
      console.log('💡 Auto-Refill: System gibt während Bau automatisch Material nach (64er Stacks)');
      
      await sleep(2000); // Kurze Wartezeit für erste Items
    } else {
      bot.chat('✅ Alle Materialien vorhanden!');
    }
    
    // 3.5. Terraforming: Erstelle plane Baufläche
    // Das ist der Schlüssel zum Erfolg - plane Fläche = keine Hindernisse, perfekte Referenz-Blöcke
    bot.chat('🏗️ Bereite Baufläche vor...');
    await baueFundament(buildPos, template.dimensions.width, template.dimensions.depth);
    
    console.log(`🏗️ Finale Bauposition: ${buildPos.x}, ${buildPos.y}, ${buildPos.z}`);
    
    // 4. Bau starten
    bot.chat(`🏗️ Starte Bau von ${template.title}!`);
    
    const result = await buildExecutor.executeBuild(template, buildPos, {
      continueWithoutMaterials: true, // Baue mit dem was wir haben
      ignoreMaterials: false
    });
    
    if (result.success) {
      bot.chat(`🎉 ${template.title} fertig gebaut!`);
      bot.chat(`📊 ${result.stats.blocksPlaced} Blöcke in ${result.duration}s`);
    } else {
      bot.chat(`❌ Bau fehlgeschlagen: ${result.error}`);
      throw new Error(result.error);
    }
    
  } catch (err) {
    console.error('❌ Template-Bau Fehler:', err);
    bot.chat(`❌ Template-Bau fehlgeschlagen: ${err.message}`);
    throw err;
  }
}

async function baueFundament(basePos, width, depth) {
  console.log(`🏗️ Terraform: Erstelle plane Fläche ${width+4}x${depth+4}`);
  bot.chat('Terraforming: Ebne Gelände ein...');
  
  try {
    // Erweitere Fläche um 2 Blöcke pro Seite (Puffer)
    const terraformWidth = width + 4;
    const terraformDepth = depth + 4;
    const startX = basePos.x - 2;
    const startZ = basePos.z - 2;
    
    // 1. ANALYSE: Finde niedrigste solide Y-Position im Bereich
    let minY = Infinity;
    for (let x = 0; x < terraformWidth; x++) {
      for (let z = 0; z < terraformDepth; z++) {
        // Suche nach solidem Grund
        for (let y = basePos.y; y >= basePos.y - 5; y--) {
          const checkPos = new Vec3(startX + x, y, startZ + z);
          const block = bot.blockAt(checkPos);
          
          if (block && block.boundingBox === 'block' && block.name !== 'air') {
            minY = Math.min(minY, y);
            break;
          }
        }
      }
    }
    
    // Falls nichts gefunden, nutze basePos.y - 1
    if (minY === Infinity) {
      minY = basePos.y - 1;
    }
    
    const fundamentY = minY;
    console.log(`📐 Fundament-Ebene gefunden bei Y=${fundamentY}`);
    bot.chat(`Ebene Fläche bei Y=${fundamentY}...`);
    
    // 2. GRABEN: Entferne alles ÜBER dem Fundament (Säulen-weise!)
    console.log('⛏️ Phase 1: Grabe Hindernisse ab (säulenweise)...');
    let gegraben = 0;
    const maxHeight = 10;
    
    // Analyse: Sind wir ÜBER oder UNTER dem durchschnittlichen Terrain?
    const botY = bot.entity.position.y;
    const grabVonOben = botY >= fundamentY; // Von oben wenn Bot höher als Fundament
    
    console.log(`📐 Bot-Y: ${Math.floor(botY)}, Fundament-Y: ${fundamentY}`);
    console.log(`⛏️ Strategie: Grabe von ${grabVonOben ? 'OBEN nach UNTEN' : 'UNTEN nach OBEN'}`);
    
    // Grabe Position für Position als SÄULE
    for (let x = 0; x < terraformWidth; x++) {
      for (let z = 0; z < terraformDepth; z++) {
        // Für diese X,Z Position: Grabe ALLE Blöcke in der Säule
        const yStart = grabVonOben ? (fundamentY + maxHeight) : (fundamentY + 1);
        const yEnd = grabVonOben ? (fundamentY + 1) : (fundamentY + maxHeight);
        const yStep = grabVonOben ? -1 : 1;
        
        for (let y = yStart; grabVonOben ? (y > yEnd) : (y <= yEnd); y += yStep) {
          const pos = new Vec3(startX + x, y, startZ + z);
          const block = bot.blockAt(pos);
          
          // Grabe alle soliden Blöcke
          if (block && block.name !== 'air' && block.boundingBox === 'block') {
            try {
              const dist = bot.entity.position.distanceTo(pos);
              
              // Navigiere falls zu weit
              if (dist > 4.5) {
                // Gehe zur Basis dieser Säule
                const targetPos = new Vec3(startX + x, fundamentY + 1, startZ + z);
                
                bot.pathfinder.setGoal(new goals.GoalNear(targetPos.x, targetPos.y, targetPos.z, 3));
                
                // Warte bis nahe genug
                for (let wait = 0; wait < 30; wait++) {
                  await sleep(100);
                  if (bot.entity.position.distanceTo(pos) <= 4.5) {
                    break;
                  }
                }
                
                bot.pathfinder.setGoal(null);
              }
              
              // Grabe Block
              await bot.dig(block);
              gegraben++;
              
              if (gegraben % 20 === 0) {
                console.log(`  ⛏️ Gegraben: ${gegraben} Blöcke`);
              }
              
              await sleep(80); // Kurze Pause
              
            } catch (err) {
              // Ignoriere Einzelfehler
            }
          }
        }
      }
    }
    
    console.log(`✅ Phase 1 fertig: ${gegraben} Blöcke gegraben`);
    bot.chat(`${gegraben} Blöcke abgetragen!`);
    
    // 3. AUFFÜLLEN: Fülle Lücken im Fundament
    console.log('🏗️ Phase 2: Fülle Fundament auf...');
    
    // Gebe Material für Fundament
    const benoetigte = Math.ceil((terraformWidth * terraformDepth) / 64);
    for (let i = 0; i < benoetigte; i++) {
      bot.chat(`/give ${bot.username} dirt 64`);
      await sleep(100);
    }
    await sleep(2000); // Warte auf Items
    
    let gefuellt = 0;
    for (let x = 0; x < terraformWidth; x++) {
      for (let z = 0; z < terraformDepth; z++) {
        const pos = new Vec3(startX + x, fundamentY, startZ + z);
        const block = bot.blockAt(pos);
        
        // Fülle nur wenn Luft oder kein solider Block
        if (!block || block.name === 'air' || block.boundingBox !== 'block') {
          try {
            const fillMaterial = bot.inventory.items().find(i => 
              i.name === 'dirt' || i.name === 'cobblestone' || i.name === 'stone'
            );
            
            if (!fillMaterial) break;
            
            await bot.equip(fillMaterial, 'hand');
            
            // Finde Referenz unter der Position
            const unterPos = pos.offset(0, -1, 0);
            const unterBlock = bot.blockAt(unterPos);
            
            if (unterBlock && unterBlock.name !== 'air') {
              await bot.placeBlock(unterBlock, new Vec3(0, 1, 0));
              gefuellt++;
              
              if (gefuellt % 10 === 0) {
                console.log(`  🏗️ Gefüllt: ${gefuellt} Blöcke`);
              }
              
              await sleep(80);
            }
          } catch (err) {
            // Ignoriere Fehler
          }
        }
      }
    }
    
    console.log(`✅ Phase 2 fertig: ${gefuellt} Blöcke gefüllt`);
    bot.chat(`✅ Terrain vorbereitet! (${gegraben} abgetragen, ${gefuellt} aufgefüllt)`);
    
    // Update: Setze basePos.y auf Fundament-Ebene + 1
    basePos.y = fundamentY + 1;
    
    await sleep(1000);
    
  } catch (err) {
    console.error('❌ Terraform-Fehler:', err.message);
    bot.chat('⚠️ Terraforming teilweise fertig, starte Bau...');
  }
  
  return;
  
  // DEAKTIVIERT: Automatisches Fundament (zu viele Fehler)
  /*
  try {
    let platziert = 0;
    const fundamentY = basePos.y - 1;
    
    for (let x = 0; x < width; x++) {
      for (let z = 0; z < depth; z++) {
        const pos = new Vec3(basePos.x + x, fundamentY, basePos.z + z);
        const block = bot.blockAt(pos);
        
        if (!block || block.name === 'air' || block.boundingBox !== 'block') {
          try {
            const material = bot.inventory.items().find(i => 
              i.name === 'dirt' || i.name === 'cobblestone' || i.name === 'stone'
            );
            
            if (!material) break;
            
            await bot.equip(material, 'hand');
            const unterPos = pos.offset(0, -1, 0);
            const unterBlock = bot.blockAt(unterPos);
            
            if (unterBlock && unterBlock.name !== 'air') {
              await bot.placeBlock(unterBlock, new Vec3(0, 1, 0));
              platziert++;
              await sleep(50);
            }
          } catch (err) {
            // Ignoriere Einzelfehler
          }
        }
      }
    }
    
    console.log(`✅ Fundament fertig: ${platziert} Blöcke platziert`);
    bot.chat(`✅ Fundament vorbereitet (${platziert} Blöcke)`);
    
  } catch (err) {
    console.error('❌ Fundament-Fehler:', err.message);
  }
  */
}

async function greifeMobAn(mobTyp) {
  bot.chat(`⚔️ Suche ${mobTyp || 'Mob'}...`);
  
  try {
    const mobs = Object.values(bot.entities).filter(e => {
      // Alle Nicht-Spieler Entities
      if (e.type === 'player' || e === bot.entity) return false;
      
      // Distanz-Check (erhöht auf 32 Blöcke für bessere Reichweite)
      if (!e.position || e.position.distanceTo(bot.entity.position) >= 32) return false;
      
      // Typ-Check wenn spezifiziert
      if (mobTyp) {
        const entityName = (e.name || e.displayName || e.type || '').toLowerCase();
        return entityName.includes(mobTyp.toLowerCase());
      }
      
      // Wenn kein Typ angegeben, alle Mobs/Tiere
      return ['mob', 'animal', 'hostile', 'passive', 'water_creature'].includes(e.type);
    });
    
    if (mobs.length === 0) {
      bot.chat(`❌ Kein ${mobTyp || 'Mob'} in Reichweite (32m)!`);
      return 'nicht_gefunden'; // Status-Code für Caller
    }
    
    const ziel = mobs[0];
    const zielName = ziel.name || ziel.displayName || ziel.type || 'Kreatur';
    const distanz = bot.entity.position.distanceTo(ziel.position);
    
    bot.chat(`Greife ${zielName} an! (${Math.floor(distanz)}m entfernt)`);
    
    // Wenn zu weit weg → erstmal hinbewegen!
    if (distanz > 3) {
      bot.chat(`Laufe zu ${zielName}...`);
      console.log(`🏃 Bewege mich ${Math.floor(distanz)}m zum Ziel`);
      
      // Nutze pathfinder um zum Ziel zu laufen (aber nicht zu nah)
      const mcData = minecraftData(bot.version);
      const movements = new Movements(bot, mcData);
      movements.canDig = false; // Nicht graben während Verfolgung
      movements.allowParkour = false;
      bot.pathfinder.setMovements(movements);
      
      try {
        // Laufe bis 2 Blöcke ran (Angriffs-Reichweite)
        bot.pathfinder.setGoal(new goals.GoalFollow(ziel, 2), true);
        
        // Warte kurz auf Bewegung
        await sleep(1000);
        
        // Warte bis nah genug (max 15 Sekunden für weite Strecken)
        const maxWait = Math.min(30, Math.ceil(distanz / 2)); // 2 Blöcke pro Sekunde
        for (let i = 0; i < maxWait; i++) {
          const aktDist = bot.entity.position.distanceTo(ziel.position);
          if (aktDist <= 3) {
            console.log(`✅ Nah genug: ${aktDist.toFixed(1)}m`);
            break;
          }
          
          // Prüfe ob Ziel noch existiert
          if (!ziel.isValid) {
            console.log('⚠️ Ziel verschwunden während Bewegung');
            break;
          }
          
          await sleep(500);
        }
        
        // Stoppe Bewegung
        bot.pathfinder.setGoal(null);
      } catch (moveErr) {
        console.error('⚠️ Bewegung zum Ziel fehlgeschlagen:', moveErr.message);
        // Greife trotzdem an
      }
    }
    
    // Versuche beste Waffe zu equippen (OHNE zu crashen bei Protokoll-Fehlern)
    try {
      const waffe = bot.inventory.items().find(i => 
        i.name && (
          i.name.includes('sword') || 
          i.name.includes('axe') ||
          i.name.includes('trident')
        )
      );
      
      if (waffe) {
        console.log(`🗡️ Equippe ${waffe.name}`);
        await bot.equip(waffe, 'hand');
        await sleep(200);
      } else {
        console.log('⚠️ Keine Waffe gefunden, nutze Faust');
      }
    } catch (equipErr) {
      console.error('⚠️ Equip-Fehler (ignoriert):', equipErr.message);
      // Weiter machen auch ohne Waffe
    }
    
    // Schaue zum Ziel
    try {
      await bot.lookAt(ziel.position.offset(0, ziel.height || 1, 0));
    } catch (lookErr) {
      console.error('⚠️ LookAt-Fehler:', lookErr.message);
    }
    
    await sleep(200);
    
    // Angriffs-Schleife mit Bewegung
    for (let i = 0; i < 20; i++) { // Mehr Iterationen für längere Kämpfe
      // Prüfe ob Ziel noch existiert und valide ist
      if (!ziel || !ziel.isValid || !ziel.position) {
        bot.chat('✅ Besiegt oder entkommen!');
        bot.pathfinder.setGoal(null); // Stoppe Verfolgung
        bot.setControlState('sprint', false); // Stoppe Sprint
        break;
      }
      
      try {
        // Prüfe aktuelle Distanz
        const aktDistanz = bot.entity.position.distanceTo(ziel.position);
        
        // Abbruch wenn Ziel zu weit weggelaufen ist (>25 Blöcke)
        if (aktDistanz > 25) {
          console.log(`❌ Ziel ist ${aktDistanz.toFixed(1)}m weg - zu weit, breche ab`);
          bot.chat(`${zielName} ist entkommen (zu weit weg)!`);
          bot.pathfinder.setGoal(null);
          bot.setControlState('sprint', false);
          break;
        }
        
        // Wenn zu weit weg → folge dem Ziel
        if (aktDistanz > 3.5) {
          console.log(`🏃 Ziel ist ${aktDistanz.toFixed(1)}m weg, folge!`);
          
          // Aktiviere Sprint für schnellere Verfolgung
          bot.setControlState('sprint', true);
          
          // Nutze GoalFollow für kontinuierliches Verfolgen
          const mcData = minecraftData(bot.version);
          const movements = new Movements(bot, mcData);
          movements.canDig = false;
          movements.allowParkour = false;
          movements.allowSprinting = true; // Erlaube Sprint!
          bot.pathfinder.setMovements(movements);
          bot.pathfinder.setGoal(new goals.GoalFollow(ziel, 2), true);
          
          // Warte kurz auf Bewegung
          await sleep(300);
        } else {
          // Nah genug → stoppe Bewegung und greife an
          bot.pathfinder.setGoal(null);
          bot.setControlState('sprint', false); // WICHTIG: Kein Sprint beim Angriff (mehr Schaden!)
          
          // Schaue zum Ziel
          await bot.lookAt(ziel.position.offset(0, ziel.height || 1, 0));
          
          // Angriff
          await bot.attack(ziel);
          console.log(`⚔️ Angriff ${i+1} (Dist: ${aktDistanz.toFixed(1)}m)`);
        }
        
      } catch (attackErr) {
        console.error(`⚠️ Angriffs-Fehler: ${attackErr.message}`);
        // Versuche weiterzumachen
      }
      
      await sleep(500);
    }
    
    // Stoppe finale Bewegung und Sprint
    bot.pathfinder.setGoal(null);
    bot.setControlState('sprint', false);
    
    bot.chat('⚔️ Kampf beendet!');
    
  } catch (err) {
    console.error('❌ Angriffs-Fehler:', err);
    bot.chat(`❌ Angriff fehlgeschlagen: ${err.message}`);
  }
}

async function esseNahrung() {
  try {
    const food = bot.inventory.items().find(i => 
      i.name.includes('bread') || i.name.includes('beef') ||
      i.name.includes('porkchop') || i.name.includes('chicken') ||
      i.name.includes('apple') || i.name.includes('carrot')
    );
    
    if (!food) {
      bot.chat('Keine Nahrung!');
      return;
    }
    
    bot.chat(`🍖 Esse ${food.name}...`);
    await bot.equip(food, 'hand');
    await bot.consume();
    bot.chat('✅ Gegessen!');
  } catch (err) {
    bot.chat(`❌ ${err.message}`);
  }
}

// ════════════════════════════════════════
// 🛡️ MACE - SCHILD FUNKTION
// ════════════════════════════════════════
// Was es macht: Gibt Freddi ein Schild und hält es hoch
// Befehl: "Freddi Mace" oder "Freddi mace"
// ════════════════════════════════════════

// ════════════════════════════════════════
// 🛡️ MACE-TRAININGSMODUS FUNKTIONEN
// ════════════════════════════════════════
// Was es macht: Freddi steht still, blockt mit Schild, schaut Spieler an
// Befehl: "Freddi, mace" zum Starten, "Freddi, stop" zum Beenden
// Easy-Modus: "Freddi, mace easy" - ohne Schild!
// ════════════════════════════════════════

async function starteMaceModus(username, mitSchild = true) {
  try {
    // Prüfe ob Mace-Modus schon aktiv
    if (maceModus.aktiv) {
      bot.chat('⚠️ Mace-Modus läuft bereits!');
      console.log('⚠️ Mace-Modus bereits aktiv');
      return 'Mace bereits aktiv';
    }
    
    console.log(`🛡️ Starte Mace-Modus für: ${username} (mit Schild: ${mitSchild})`);
    
    if (mitSchild) {
      bot.chat('🛡️ MACE-MODUS AKTIVIERT!');
    } else {
      bot.chat('😊 MACE EASY-MODUS AKTIVIERT!');
      bot.chat('💪 Kein Schild - Easy-Ziel!');
    }
    
    // 1. Finde Spieler-Entity
    const spieler = bot.players[username];
    if (!spieler || !spieler.entity) {
      bot.chat('❌ Ich kann dich nicht finden!');
      console.log('❌ Spieler-Entity nicht gefunden');
      return 'Spieler nicht gefunden';
    }
    
    // 2. Speichere aktuelle Position als Stand-Position
    maceModus.startPosition = bot.entity.position.clone();
    maceModus.spieler = spieler.entity;
    maceModus.spielerUsername = username;
    maceModus.startZeit = Date.now();
    
    console.log('📍 Start-Position gespeichert:', maceModus.startPosition);
    
    // 3. Gib Freddi ein Schild (NUR wenn mitSchild = true)
    if (mitSchild) {
      let schild = bot.inventory.items().find(i => i.name === 'shield');
      
      if (!schild) {
        console.log('📦 Gebe Schild via /give');
        bot.chat(`/give ${bot.username} minecraft:shield 1`);
        await sleep(2000);
        
        schild = bot.inventory.items().find(i => i.name === 'shield');
      }
      
      if (!schild) {
        bot.chat('❌ Kein Schild bekommen!');
        bot.chat('💡 Tipp: Gib mir manuell ein Schild oder aktiviere Cheats mit /op Freddiiiiii');
        console.log('❌ Kein Schild im Inventar');
        return 'Kein Schild';
      }
      
      // 4. Equippe Schild in HAUPTHAND (nicht Offhand!)
      console.log('🛡️ Equippe Schild in HAUPTHAND');
      await bot.equip(schild, 'hand');  // HAUPTHAND statt off-hand!
      await sleep(500);
      
      // 5. Aktiviere Schild-Block BEVOR die Effekte kommen
      console.log('🛡️ Aktiviere Schild (Block-Modus) - 3x zur Sicherheit');
      for (let i = 0; i < 3; i++) {
        bot.activateItem();
        await sleep(200);
        console.log(`  🛡️ Aktivierung ${i+1}/3`);
      }
    } else {
      console.log('😊 Easy-Modus: Überspringe Schild');
    }
    
    // WICHTIG: Längere Pause damit Server nicht overwhelmed wird
    await sleep(1000);
    
    // 6. Gib Spieler PVP-Equipment
    console.log('⚔️ Gebe Spieler PVP-Equipment');
    bot.chat('⚔️ Hier ist dein Equipment!');
    
    await sleep(800); // Extra Pause VOR Commands
    
    // Mace mit Windburst 3 (neue 1.21+ Syntax)
    bot.chat(`/give ${username} minecraft:mace[minecraft:enchantments={levels:{"minecraft:wind_burst":3}}] 1`);
    await sleep(800);
    
    // Mace mit Windburst 2
    bot.chat(`/give ${username} minecraft:mace[minecraft:enchantments={levels:{"minecraft:wind_burst":2}}] 1`);
    await sleep(800);
    
    // Mace mit Windburst 1
    bot.chat(`/give ${username} minecraft:mace[minecraft:enchantments={levels:{"minecraft:wind_burst":1}}] 1`);
    await sleep(800); // LÄNGERE Pausen zwischen Commands!
    
    // Netherite Axt
    bot.chat(`/give ${username} minecraft:netherite_axe 1`);
    await sleep(800);
    
    // 64 Wind Charges
    bot.chat(`/give ${username} minecraft:wind_charge 64`);
    await sleep(800);
    
    // Netherite Boots mit Feather Falling 4 (neue 1.21+ Syntax)
    bot.chat(`/give ${username} minecraft:netherite_boots[minecraft:enchantments={levels:{"minecraft:feather_falling":4}}] 1`);
    await sleep(1000); // Extra lange Pause vor Effekten
    
    // 7. Gib beiden unendlich Leben (Resistance + Regeneration)
    console.log('💖 Gebe unendlich Leben');
    bot.chat('💖 Aktiviere Unsterblichkeit!');
    
    await sleep(500); // Pause VOR Effekten
    
    // Spieler unverwundbar machen
    bot.chat(`/effect give ${username} minecraft:resistance 999999 255 true`);
    await sleep(400); // Längere Pausen
    bot.chat(`/effect give ${username} minecraft:regeneration 999999 255 true`);
    await sleep(400);
    bot.chat(`/effect give ${username} minecraft:health_boost 999999 10 true`);
    await sleep(400);
    
    // Freddi auch unverwundbar machen
    bot.chat(`/effect give ${bot.username} minecraft:resistance 999999 255 true`);
    await sleep(400);
    bot.chat(`/effect give ${bot.username} minecraft:regeneration 999999 255 true`);
    await sleep(400);
    bot.chat(`/effect give ${bot.username} minecraft:health_boost 999999 10 true`);
    await sleep(1000); // LÄNGERE Pause vor Schild-Reaktivierung
    
    // WICHTIG: Schild MEHRFACH reaktivieren nach Effekten (NUR wenn mit Schild)
    if (mitSchild) {
      console.log('🛡️ Reaktiviere Schild nach Effekten (3x mit Pausen)');
      try {
        for (let i = 0; i < 3; i++) {
          bot.deactivateItem();
          await sleep(200);
          bot.activateItem();
          await sleep(200);
          console.log(`  🛡️ Reaktivierung ${i+1}/3`);
        }
        console.log('✅ Schild sollte jetzt DEFINITIV aktiv sein');
      } catch (schildErr) {
        console.error('⚠️ Schild-Reaktivierung fehlgeschlagen:', schildErr.message);
      }
    } else {
      console.log('😊 Easy-Modus: Kein Schild zum aktivieren');
    }
    
    // 8. Aktiviere Mace-Modus
    maceModus.aktiv = true;
    maceModus.mitSchild = mitSchild; // WICHTIG: Speichere ob Schild aktiv ist
    
    // 8. Starte Update-Loop
    starteMaceUpdateLoop();
    
    bot.chat('🛡️ Bereit! Ich blocke und schaue dich an!');
    bot.chat('💪 Viel Erfolg beim Training!');
    console.log('✅ Mace-Modus erfolgreich gestartet');
    
    return 'Mace-Modus gestartet';
    
  } catch (error) {
    console.error('❌ Mace-Start Fehler:', error);
    bot.chat(`❌ Mace-Start fehlgeschlagen: ${error.message}`);
    
    // Cleanup bei Fehler
    maceModus.aktiv = false;
    if (maceModus.updateInterval) {
      clearInterval(maceModus.updateInterval);
      maceModus.updateInterval = null;
    }
    
    return 'Fehler beim Mace-Start';
  }
}

// ────────────────────────────────────────
// Update-Loop für Mace-Modus
// ────────────────────────────────────────
function starteMaceUpdateLoop() {
  console.log('🔁 Starte Mace Update-Loop (10x pro Sekunde)');
  
  let tickCount = 0;
  
  maceModus.updateInterval = setInterval(async () => {
    if (!maceModus.aktiv) {
      clearInterval(maceModus.updateInterval);
      maceModus.updateInterval = null;
      return;
    }
    
    tickCount++;
    
    try {
      // Schaue Spieler an (jedes Mal) - OHNE await!
      maceLookAtPlayer(); // Kein await = nicht blockierend
      
      // Position checken (alle 0.2 Sekunden = 2 Ticks) - VIEL SCHNELLER! ⚡
      if (tickCount % 2 === 0) {
        checkPositionLock();
      }
      
      // Schild reaktivieren (alle 5 Sekunden = 50 Ticks) - NUR wenn Schild vorhanden!
      if (tickCount % 50 === 0 && maceModus.mitSchild) {
        console.log('🛡️ 5-Sekunden-Check: Reaktiviere Schild');
        try {
          bot.deactivateItem();
          await sleep(100);
          bot.activateItem();
        } catch (shieldErr) {
          console.error('⚠️ Schild-Reaktivierung fehlgeschlagen:', shieldErr.message);
        }
      }
      
    } catch (error) {
      console.error('⚠️ Mace Update-Loop Fehler:', error.message);
      console.error('Stack:', error.stack);
    }
    
  }, 100); // 100ms = 10 Updates pro Sekunde
}

// ────────────────────────────────────────
// Schaue kontinuierlich zum Spieler
// ────────────────────────────────────────
async function maceLookAtPlayer() {
  if (!maceModus.aktiv || !maceModus.spieler) return;
  
  try {
    // Prüfe ob Spieler-Entity noch valide ist
    if (!maceModus.spieler.isValid) {
      // Versuche Spieler neu zu finden
      const spieler = bot.players[maceModus.spielerUsername];
      if (spieler && spieler.entity) {
        maceModus.spieler = spieler.entity;
        console.log('🔄 Spieler-Entity neu gefunden');
      } else {
        console.log('❌ Spieler-Entity verloren');
        bot.chat('❌ Ich habe dich verloren! Mace-Modus beendet.');
        stoppeMaceModus();
        return;
      }
    }
    
    const spielerPos = maceModus.spieler.position;
    const botPos = bot.entity.position;
    
    // Berechne Yaw (horizontale Drehung)
    const dx = spielerPos.x - botPos.x;
    const dz = spielerPos.z - botPos.z;
    const yaw = Math.atan2(-dx, -dz);
    
    // Berechne Pitch (vertikale Drehung - schaue zum Kopf des Spielers)
    const dy = (spielerPos.y + 1.6) - (botPos.y + 1.6); // +1.6 = Augenhöhe
    const groundDistance = Math.sqrt(dx * dx + dz * dz);
    const pitch = -Math.atan2(dy, groundDistance);
    
    // Setze Blickrichtung (force = true für sofortige Drehung)
    // WICHTIG: Kein await! Das könnte der Crash-Grund sein
    bot.look(yaw, pitch, true);
    
  } catch (error) {
    // Ignoriere ALLE lookAt Fehler komplett
    // Nicht mal loggen - das könnte Spam verursachen
  }
}

// ────────────────────────────────────────
// Prüfe ob Freddi von seiner Position abgewichen ist
// ────────────────────────────────────────
function checkPositionLock() {
  if (!maceModus.aktiv || !maceModus.startPosition) return;
  
  const currentPos = bot.entity.position;
  const startPos = maceModus.startPosition;
  
  // Berechne Distanz
  const distanz = currentPos.distanceTo(startPos);
  
  // Wenn mehr als 0.5 Blöcke abgewichen (Knockback, Physik, etc.)
  if (distanz > 0.5) {
    console.log(`📍 Position-Abweichung: ${distanz.toFixed(2)} Blöcke - teleportiere zurück`);
    
    // Teleportiere zurück zur Start-Position
    bot.chat(`/tp ${bot.username} ${startPos.x.toFixed(2)} ${startPos.y.toFixed(2)} ${startPos.z.toFixed(2)}`);
    
    // Reaktiviere Schild nach Teleport
    setTimeout(() => {
      if (maceModus.aktiv) {
        bot.activateItem();
      }
    }, 200);
  }
}

// ────────────────────────────────────────
// Stoppt Mace-Modus
// ────────────────────────────────────────
function stoppeMaceModus() {
  if (!maceModus.aktiv) {
    bot.chat('⚠️ Mace-Modus war nicht aktiv!');
    return 'Mace war nicht aktiv';
  }
  
  console.log('🛑 Stoppe Mace-Modus');
  
  // Stoppe Update-Loop
  if (maceModus.updateInterval) {
    clearInterval(maceModus.updateInterval);
    maceModus.updateInterval = null;
  }
  
  // Deaktiviere Schild-Block und Bewegung freigeben
  try { bot.deactivateItem(); } catch(e) {}
  try {
    bot.pathfinder.setGoal(null);
    bot.setControlState('forward', false);
    bot.setControlState('sprint', false);
    bot.setControlState('jump', false);
  } catch(e) {}
  
  // Speichere Infos bevor Reset
  const username = maceModus.spielerUsername;
  const dauer = Math.floor((Date.now() - maceModus.startZeit) / 1000);
  const sekunden = dauer % 60;
  
  console.log(`📊 Mace-Modus lief ${dauer} Sekunden`);
  
  // Setze Status SOFORT zurück
  maceModus.aktiv = false;
  maceModus.spieler = null;
  maceModus.spielerUsername = null;
  maceModus.startPosition = null;
  maceModus.mitSchild = false;
  
  // Cleanup mit LANGEN PAUSEN (damit Server nicht kickt!)
  setTimeout(() => {
    try { bot.chat(`Mace-Modus beendet! (${sekunden}s)`); } catch(e) {}
  }, 500);
  
  setTimeout(() => {
    try { if (username) bot.chat(`/clear ${username}`); } catch(e) {}
  }, 2000);
  
  setTimeout(() => {
    try { bot.chat(`/clear ${bot.username}`); } catch(e) {}
  }, 3500);
  
  setTimeout(() => {
    try { if (username) bot.chat(`/effect clear ${username}`); } catch(e) {}
  }, 5000);
  
  setTimeout(() => {
    try { bot.chat(`/effect clear ${bot.username}`); } catch(e) {}
  }, 6500);
  
  return 'Mace-Modus gestoppt';
}

// ════════════════════════════════════════
// ⚔️ SWORD-KAMPFMODUS FUNKTIONEN
// ════════════════════════════════════════
// Was es macht: 1v1 Schwertkampf mit Freddi
// Modi:
//   - "Freddi, sword" = Echter Kampf (kann sterben)
//   - "Freddi, sword easy" = Trainingskampf (unsterblich)
// Befehl zum Stoppen: "Freddi, stop"
// ════════════════════════════════════════

async function starteSwordModus(username, mitSchaden = true) {
  try {
    // Prüfe ob Sword-Modus schon aktiv
    if (swordModus.aktiv) {
      bot.chat('⚠️ Sword-Modus läuft bereits!');
      console.log('⚠️ Sword-Modus bereits aktiv');
      return 'Sword bereits aktiv';
    }
    
    // Prüfe ob Mace-Modus aktiv ist
    if (maceModus.aktiv) {
      bot.chat('⚠️ Stoppe erst den Mace-Modus!');
      return 'Mace aktiv';
    }
    
    console.log(`⚔️ Starte Sword-Modus für: ${username} (mit Schaden: ${mitSchaden})`);
    
    if (mitSchaden) {
      bot.chat('⚔️ SWORD-MODUS AKTIVIERT! Echter Kampf!');
    } else {
      bot.chat('⚔️ SWORD EASY-MODUS AKTIVIERT! Training!');
    }
    
    // 1. Finde Spieler-Entity
    const spieler = bot.players[username];
    if (!spieler || !spieler.entity) {
      bot.chat('❌ Ich kann dich nicht finden!');
      console.log('❌ Spieler-Entity nicht gefunden');
      return 'Spieler nicht gefunden';
    }
    
    // 2. Speichere Spieler-Infos SOFORT
    swordModus.spieler = spieler.entity;
    swordModus.spielerUsername = username;
    swordModus.startZeit = Date.now();
    swordModus.mitSchaden = mitSchaden;
    swordModus.letzterAngriff = 0;
    swordModus.aktiv = true; // SETZE AKTIV SOFORT!
    
    console.log('📝 Spieler-Info gespeichert, Modus aktiv');
    
    // 2.5 KOMPLETTER RESET (wichtig nach Mace-Modus!)
    console.log('🧹 Lösche alte Effekte und reset Bewegung');
    
    // Pathfinder resetten
    swordPathfinderSetup = false;
    try {
      bot.pathfinder.setGoal(null);
      bot.setControlState('forward', false);
      bot.setControlState('sprint', false);
      bot.setControlState('jump', false);
    } catch(e) {}
    
    // Effekte löschen
    bot.chat(`/effect clear ${username}`);
    await sleep(800);
    bot.chat(`/effect clear ${bot.username}`);
    await sleep(1000);
    
    // 3. Gib NUR dem Spieler Equipment (Freddi benutzt was er hat!)
    console.log('⚔️ Gebe Spieler Equipment');
    await sleep(1000);
    
    // Spieler Equipment (5 Commands)
    bot.chat(`/give ${username} diamond_sword 1`);
    await sleep(800);
    bot.chat(`/give ${username} diamond_helmet 1`);
    await sleep(800);
    bot.chat(`/give ${username} diamond_chestplate 1`);
    await sleep(800);
    bot.chat(`/give ${username} diamond_leggings 1`);
    await sleep(800);
    bot.chat(`/give ${username} diamond_boots 1`);
    await sleep(1000);
    
    // Freddi Equipment - NUR wenn er nichts hat!
    console.log('⚔️ Gebe Freddi Equipment (falls nötig)');
    const hatSchwert = bot.inventory.items().find(i => i.name.includes('sword'));
    const hatRuestung = bot.inventory.items().find(i => i.name.includes('helmet') || i.name.includes('chestplate'));
    
    if (!hatSchwert || !hatRuestung) {
      console.log('📦 Freddi braucht Equipment');
      bot.chat(`/give ${bot.username} diamond_sword 1`);
      await sleep(800);
      bot.chat(`/give ${bot.username} diamond_helmet 1`);
      await sleep(800);
      bot.chat(`/give ${bot.username} diamond_chestplate 1`);
      await sleep(800);
      bot.chat(`/give ${bot.username} diamond_leggings 1`);
      await sleep(800);
      bot.chat(`/give ${bot.username} diamond_boots 1`);
      await sleep(1000);
    } else {
      console.log('✅ Freddi hat schon Equipment');
    }
    
    // 4. Equippe Freddis Rüstung (mit Error-Handling)
    console.log('👔 Equippe Freddis Rüstung');
    await sleep(1000);
    
    try {
      const helmet = bot.inventory.items().find(i => i.name === 'diamond_helmet');
      if (helmet) {
        await bot.equip(helmet, 'head');
        await sleep(500);
      }
      
      const chestplate = bot.inventory.items().find(i => i.name === 'diamond_chestplate');
      if (chestplate) {
        await bot.equip(chestplate, 'torso');
        await sleep(500);
      }
      
      const leggings = bot.inventory.items().find(i => i.name === 'diamond_leggings');
      if (leggings) {
        await bot.equip(leggings, 'legs');
        await sleep(500);
      }
      
      const boots = bot.inventory.items().find(i => i.name === 'diamond_boots');
      if (boots) {
        await bot.equip(boots, 'feet');
        await sleep(500);
      }
      
      const sword = bot.inventory.items().find(i => i.name === 'diamond_sword');
      if (sword) {
        await bot.equip(sword, 'hand');
        await sleep(500);
      }
      
      console.log('✅ Rüstung equippt');
    } catch (equipErr) {
      console.error('⚠️ Fehler beim Equippen:', equipErr.message);
      // Nicht abbrechen, weitermachen!
    }
    
    // 5. Wenn Easy-Modus: Unsterblichkeit (MIT LANGER PAUSE UND LANGSAMEN EFFECTS!)
    if (!mitSchaden) {
      console.log('💖 Bereite Unsterblichkeit vor (Easy-Modus)');
      console.log('⏳ Warte 3 Sekunden damit Server Commands vergisst...');
      
      // LANGE PAUSE damit Server die /give Commands "vergisst"!
      await sleep(3000); // 3 SEKUNDEN PAUSE!
      
      console.log('💖 Gebe jetzt Unsterblichkeit - LANGSAM!');
      
      // Spieler unverwundbar machen - MIT LANGEN PAUSEN!
      bot.chat(`/effect give ${username} minecraft:resistance 999999 255 true`);
      await sleep(1200); // LANGE PAUSE!
      bot.chat(`/effect give ${username} minecraft:regeneration 999999 255 true`);
      await sleep(1200); // LANGE PAUSE!
      bot.chat(`/effect give ${username} minecraft:health_boost 999999 10 true`);
      await sleep(1500); // EXTRA LANGE PAUSE!
      
      // Freddi auch unverwundbar machen - MIT LANGEN PAUSEN!
      bot.chat(`/effect give ${bot.username} minecraft:resistance 999999 255 true`);
      await sleep(1200); // LANGE PAUSE!
      bot.chat(`/effect give ${bot.username} minecraft:regeneration 999999 255 true`);
      await sleep(1200); // LANGE PAUSE!
      bot.chat(`/effect give ${bot.username} minecraft:health_boost 999999 10 true`);
      await sleep(1500); // EXTRA LANGE PAUSE!
      
      console.log('✅ Unsterblichkeit erfolgreich gegeben!');
      
      // WICHTIG: LANGE PAUSE nach Effekten bevor weitere Chat-Messages!
      console.log('⏳ Warte nochmal 2 Sekunden bevor Kampf startet...');
      await sleep(2000); // Noch 2 Sekunden warten!
    }
    
    // 6. Starte Kampf-Loop SOFORT (kein Countdown, keine Chat-Messages!)
    console.log('⚔️ Starte Kampf-Loop');
    // KEINE bot.chat() Messages mehr! Der Server hat genug Commands gesehen!
    console.log('⚔️ KAMPF GESTARTET!');
    
    await sleep(500);
    starteSwordKampfLoop();
    
    // KEINE weiteren Chat-Messages!
    console.log('✅ Sword-Modus erfolgreich gestartet');
    
    return 'Sword-Modus gestartet';
    
  } catch (err) {
    console.error('❌ Fehler beim Starten des Sword-Modus:', err);
    console.error('Stack:', err.stack);
    bot.chat('❌ Fehler beim Starten!');
    
    // Cleanup bei Fehler
    swordModus.aktiv = false;
    swordModus.spieler = null;
    swordModus.spielerUsername = null;
    
    return 'Fehler';
  }
}

// ────────────────────────────────────────
// ⚔️ Sword Kampf-Loop
// ────────────────────────────────────────
// Was es macht: Läuft kontinuierlich während Sword-Modus aktiv ist
// Checkt: Spieler-Status, Bot-Gesundheit, führt Angriffe aus
// ────────────────────────────────────────
function starteSwordKampfLoop() {
  console.log('🔁 Starte Sword Kampf-Loop (2x pro Sekunde)');
  
  swordModus.kampfInterval = setInterval(() => {
    // Prüfe ob Modus noch aktiv
    if (!swordModus.aktiv) {
      clearInterval(swordModus.kampfInterval);
      swordModus.kampfInterval = null;
      console.log('⚠️ Sword-Loop gestoppt - Modus nicht mehr aktiv');
      return;
    }
    
    try {
      // Prüfe ob Spieler noch existiert und valide ist
      const spieler = swordModus.spieler;
      if (!spieler || !spieler.isValid) {
        console.log('⚠️ Spieler-Entity nicht mehr valide');
        if (swordModus.mitSchaden) {
          // Im echten Kampf-Modus = Spieler ist gestorben oder disconnected
          stoppeSwordModus('Du hast gewonnen! 🎉');
        }
        return;
      }
      
      // Prüfe Bot-Gesundheit (nur im echten Kampf-Modus)
      if (swordModus.mitSchaden && bot.health <= 0) {
        console.log('💀 Bot ist gestorben');
        stoppeSwordModus('Freddi ist gestorben! Du hast gewonnen! 🎉');
        return;
      }
      
      // Führe Angriff aus (mit Cooldown-Management) - OHNE await!
      swordAngriff(); // Kein await = nicht blockierend!
      
    } catch (error) {
      console.error('⚠️ Sword Kampf-Loop Fehler:', error.message);
      console.error('Stack:', error.stack);
    }
    
  }, 500); // 500ms = 2x pro Sekunde
}

// ────────────────────────────────────────
// ⚔️ Sword Angriffs-Logik
// ────────────────────────────────────────
// Was es macht: Greift Spieler an mit Cooldown-Management
// Intelligenz: Läuft zum Spieler wenn zu weit, wartet auf Cooldown
// ────────────────────────────────────────
// Pathfinder wird EINMAL initialisiert (nicht jedes Mal neu!)
let swordPathfinderSetup = false;

function swordAngriff() {
  if (!swordModus.aktiv || !swordModus.spieler) return;
  
  try {
    const spieler = swordModus.spieler;
    
    // Prüfe ob Spieler noch valide
    if (!spieler.isValid) {
      return;
    }
    
    // Pathfinder EINMAL initialisieren (nicht jedes Mal!)
    if (!swordPathfinderSetup) {
      try {
        const mcData = minecraftData(bot.version);
        const movements = new Movements(bot, mcData);
        movements.canDig = false;
        movements.allowParkour = true;  // Kann springen!
        movements.scaffoldingBlocks = [];
        bot.pathfinder.setMovements(movements);
        swordPathfinderSetup = true;
      } catch (e) {
        // Stille Fehler
      }
    }
    
    const distanz = bot.entity.position.distanceTo(spieler.position);
    
    // Cooldown-Check (600ms = 0.6 Sekunden)
    const jetzt = Date.now();
    const zeitSeitLetztemAngriff = jetzt - swordModus.letzterAngriff;
    
    // Wenn zu weit weg: Laufe zum Spieler mit Pathfinder!
    if (distanz > 3.5) {
      try {
        bot.pathfinder.setGoal(new goals.GoalFollow(spieler, 2), true);
      } catch (pathErr) {
        // Stille Fehler - kein Spam!
      }
    } 
    // Wenn nah genug: Greife an!
    else {
      // Stoppe Pathfinder
      try { bot.pathfinder.setGoal(null); } catch(e) {}
      
      // Cooldown bereit? Dann angreifen!
      if (zeitSeitLetztemAngriff >= 600) {
        // Schaue zum Spieler
        const spielerPos = spieler.position.offset(0, spieler.height * 0.5, 0);
        bot.lookAt(spielerPos, false);
        
        // Angriff!
        bot.attack(spieler);
        swordModus.letzterAngriff = jetzt;
      }
    }
    
  } catch (err) {
    // Stille Fehler - kein Console-Spam!
  }
}

// ────────────────────────────────────────
// 🛑 Sword-Modus stoppen
// ────────────────────────────────────────
function stoppeSwordModus(grund = 'Manuell gestoppt') {
  console.log(`🛑 Stoppe Sword-Modus: ${grund}`);
  
  // Stoppe Kampf-Interval
  if (swordModus.kampfInterval) {
    clearInterval(swordModus.kampfInterval);
    swordModus.kampfInterval = null;
  }
  
  // Stoppe Bewegung
  try {
    bot.pathfinder.setGoal(null);
    bot.setControlState('forward', false);
    bot.setControlState('sprint', false);
    bot.setControlState('jump', false);
  } catch (err) {
    // Stille Fehler
  }
  
  // Reset Pathfinder-Flag
  swordPathfinderSetup = false;
  
  // Setze Status SOFORT zurück (damit kein Loop mehr läuft)
  const username = swordModus.spielerUsername;
  const warEasyModus = !swordModus.mitSchaden;
  const dauer = Math.floor((Date.now() - swordModus.startZeit) / 1000);
  const minuten = Math.floor(dauer / 60);
  const sekunden = dauer % 60;
  
  swordModus.aktiv = false;
  swordModus.spieler = null;
  swordModus.spielerUsername = null;
  swordModus.mitSchaden = true;
  swordModus.letzterAngriff = 0;
  
  console.log(`📊 Sword-Modus lief ${dauer} Sekunden`);
  
  // KEINE bot.chat() Messages! Nur /commands mit Verzögerung!
  // Benutze /say statt bot.chat() - das ist ein Server-Command!
  setTimeout(() => {
    try { bot.chat(`⚔️ Sword-Modus beendet! (${sekunden}s)`); } catch(e) {}
  }, 500);
  
  setTimeout(() => {
    try {
      if (username) bot.chat(`/clear ${username}`);
    } catch(e) {}
  }, 2000);
  
  setTimeout(() => {
    try { bot.chat(`/clear ${bot.username}`); } catch(e) {}
  }, 3500);
  
  if (warEasyModus) {
    setTimeout(() => {
      try {
        if (username) bot.chat(`/effect clear ${username}`);
      } catch(e) {}
    }, 5000);
    
    setTimeout(() => {
      try { bot.chat(`/effect clear ${bot.username}`); } catch(e) {}
    }, 6500);
  }
  
  return 'Sword-Modus gestoppt';
}

async function crafteItem(item, anzahl) {
  bot.chat(`🔨 Crafte ${anzahl}x ${item}...`);
  
  try {
    const mcData = minecraftData(bot.version);
    const itemData = mcData.itemsByName[item];
    
    if (!itemData) {
      bot.chat(`Kenne ${item} nicht!`);
      return;
    }
    
    const recipe = bot.recipesFor(itemData.id, null, 1, null)[0];
    
    if (!recipe) {
      bot.chat(`Kein Rezept für ${item}!`);
      return;
    }
    
    await bot.craft(recipe, anzahl, null);
    bot.chat(`✅ ${anzahl}x ${item}!`);
  } catch (err) {
    bot.chat(`❌ ${err.message}`);
  }
}

async function interagiereBlock(typ) {
  bot.chat(`🚪 Suche ${typ}...`);
  
  try {
    const bloecke = bot.findBlocks({
      matching: (b) => b && b.name.includes(typ),
      maxDistance: 16,
      count: 10
    });
    
    if (bloecke.length === 0) {
      bot.chat(`Kein ${typ} in der Nähe!`);
      return;
    }
    
    const block = bot.blockAt(bloecke[0]);
    await bot.activateBlock(block);
    bot.chat(`✅ ${typ} aktiviert!`);
  } catch (err) {
    bot.chat(`❌ ${err.message}`);
  }
}

// ============================================
// CHAT-EVENT
// ============================================

bot.on('chat', async (username, message) => {
  if (username === bot.username) return;
  
  console.log(`<${username}> ${message}`);
  
  // ============================================
  // AKTIVIERUNGS-SYSTEM
  // ============================================
  
  // Prüfe ob Bot angesprochen wird
  const botNames = ['freddi', 'freddiiiiii', '@freddi', 'bot'];
  const messageLower = message.toLowerCase();
  
  let isAddressed = false;
  let cleanedMessage = message;
  
  // Option 1: Nachricht beginnt mit Bot-Name + Komma/Doppelpunkt
  // "Freddi, baue ein haus" → true
  for (const name of botNames) {
    if (messageLower.startsWith(name + ',') || 
        messageLower.startsWith(name + ':') ||
        messageLower.startsWith(name + ' ')) {
      isAddressed = true;
      // Entferne Bot-Namen aus Nachricht
      cleanedMessage = message.substring(name.length).trim();
      if (cleanedMessage.startsWith(',') || cleanedMessage.startsWith(':')) {
        cleanedMessage = cleanedMessage.substring(1).trim();
      }
      break;
    }
  }
  
  // Option 2: Nachricht enthält @freddi
  if (messageLower.includes('@freddi') || messageLower.includes('@bot')) {
    isAddressed = true;
    cleanedMessage = message.replace(/@freddi[^\s]*/gi, '').replace(/@bot/gi, '').trim();
  }
  
  // Schnelle Direktbefehle (funktionieren IMMER)
  if (message === 'stopp' || message === 'stop') {
    bot.pathfinder.setGoal(null);
    bot.chat('Gestoppt!');
    return;
  }
  
  if (message === 'fertig' || message === 'ready' || message === 'done') {
    // Wird vom Material-Warte-Loop automatisch erkannt
    console.log('✅ Spieler hat "fertig" gesagt');
    return;
  }
  
  // Andere Direktbefehle nur wenn adressiert
  if (!isAddressed) {
    // Ignoriere Nachricht wenn Bot nicht angesprochen wurde
    return;
  }
  
  console.log(`✅ Bot wurde angesprochen: "${cleanedMessage}"`);
  
  // Mace-Modus Befehle (höchste Priorität)
  if (cleanedMessage === 'mace' || cleanedMessage === 'mace start') {
    await starteMaceModus(username, true); // MIT Schild
    return;
  }
  
  if (cleanedMessage === 'mace easy') {
    await starteMaceModus(username, false); // OHNE Schild
    return;
  }
  
  // Sword-Modus Befehle
  if (cleanedMessage === 'sword' || cleanedMessage === 'sword start') {
    await starteSwordModus(username, true); // MIT Schaden (echter Kampf)
    return;
  }
  
  if (cleanedMessage === 'sword easy') {
    await starteSwordModus(username, false); // OHNE Schaden (unsterblich)
    return;
  }
  
  if (cleanedMessage === 'stop' || cleanedMessage === 'mace stop' || cleanedMessage === 'sword stop') {
    if (maceModus.aktiv) {
      stoppeMaceModus();
    } else if (swordModus.aktiv) {
      stoppeSwordModus('Manuell gestoppt');
    } else {
      bot.chat('⚠️ Kein Modus aktiv!');
    }
    return;
  }
  
  if (cleanedMessage === 'raus' || cleanedMessage === 'escape' || cleanedMessage === 'help') {
    bot.chat('🆘 Versuche rauszukommen...');
    await smartEscape();
    return;
  }
  
  if (cleanedMessage === 'check' || cleanedMessage === 'loch?') {
    const lochInfo = istInLoch();
    if (lochInfo.inLoch) {
      bot.chat(`Ja, bin in Loch! ${Math.floor(lochInfo.tiefe)}m tief`);
    } else {
      bot.chat('Nein, alles gut!');
    }
    return;
  }
  
  if (cleanedMessage === 'position') {
    const p = bot.entity.position;
    bot.chat(`${p.x.toFixed(0)}, ${p.y.toFixed(0)}, ${p.z.toFixed(0)}`);
    return;
  }
  
  // LLM-System (mit gereinigter Nachricht)
  const antwort = await chatMitLLM(username, cleanedMessage);
  
  // Wenn leere Antwort (z.B. Fehler wurde schon von Funktion kommuniziert), nichts sagen
  if (!antwort || antwort.trim() === '') {
    return; // Keine zusätzliche Antwort
  }
  
  if (antwort.length > 240) {
    const teile = antwort.match(/.{1,240}/g) || [antwort];
    for (const teil of teile) {
      bot.chat(teil);
      await sleep(500);
    }
  } else {
    bot.chat(antwort);
  }
});

// Fehlerbehandlung
bot.on('error', (err) => console.error('❌', err));
bot.on('kicked', (reason) => {
  console.log('⚠️ Gekickt:', reason);
  
  // Stoppe Sword-Modus wenn aktiv
  if (swordModus.aktiv) {
    console.log('🛑 Stoppe Sword-Modus wegen Kick');
    if (swordModus.kampfInterval) {
      clearInterval(swordModus.kampfInterval);
      swordModus.kampfInterval = null;
    }
    swordModus.aktiv = false;
  }
  
  // Stoppe Mace-Modus wenn aktiv
  if (maceModus.aktiv) {
    console.log('🛑 Stoppe Mace-Modus wegen Kick');
    if (maceModus.updateInterval) {
      clearInterval(maceModus.updateInterval);
      maceModus.updateInterval = null;
    }
    maceModus.aktiv = false;
  }
});
bot.on('end', () => {
  console.log('🔌 Verbindung beendet');
  
  // Stoppe Sword-Modus wenn aktiv
  if (swordModus.aktiv) {
    console.log('🛑 Stoppe Sword-Modus wegen Disconnect');
    if (swordModus.kampfInterval) {
      clearInterval(swordModus.kampfInterval);
      swordModus.kampfInterval = null;
    }
    swordModus.aktiv = false;
  }
  
  // Stoppe Mace-Modus wenn aktiv
  if (maceModus.aktiv) {
    console.log('🛑 Stoppe Mace-Modus wegen Disconnect');
    if (maceModus.updateInterval) {
      clearInterval(maceModus.updateInterval);
      maceModus.updateInterval = null;
    }
    maceModus.aktiv = false;
  }
});
process.on('SIGINT', () => { bot.quit(); process.exit(0); });

// ════════════════════════════════════════
// 💖 HEALTH MONITORING (für Sword-Modus)
// ════════════════════════════════════════
// Erkennt wenn Bot oder Spieler sterben (nur im echten Kampf-Modus)
bot.on('health', () => {
  // Nur checken wenn Sword-Modus aktiv UND mit echtem Schaden
  if (swordModus.aktiv && swordModus.mitSchaden) {
    // Check Bot-Gesundheit
    if (bot.health <= 0) {
      console.log('💀 Bot ist gestorben (Health-Event)');
      stoppeSwordModus('Freddi ist gestorben! Du hast gewonnen! 🎉');
    }
  }
});

// Spieler-Tod wird in der Kampf-Loop erkannt (wenn entity.isValid false wird)

