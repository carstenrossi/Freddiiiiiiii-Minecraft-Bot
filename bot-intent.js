import mineflayer from 'mineflayer';
import pathfinderPlugin from 'mineflayer-pathfinder';
import minecraftData from 'minecraft-data';
import { Ollama } from 'ollama';

const { pathfinder, Movements, goals } = pathfinderPlugin;

// Ollama initialisieren (IPv4 erzwingen!)
const ollama = new Ollama({ host: 'http://127.0.0.1:11434' });
const MODELL = 'deepseek-r1:8b';

// Bot-Konfiguration
const bot = mineflayer.createBot({
  host: 'localhost',
  port: 4444,
  username: 'Freddiiiiii',
  version: false,
});

// Pathfinder Plugin laden
bot.loadPlugin(pathfinder);

// Event: Bot ist verbunden
bot.on('spawn', async () => {
  console.log('✅ Bot ist verbunden und gespawnt!');
  console.log(`Position: ${bot.entity.position}`);
  
  // Warte kurz bis alles geladen ist
  await sleep(1000);
  
  // Finde den ersten Spieler (meist der Owner)
  const spielerListe = Object.values(bot.players).filter(p => p.entity && p.username !== bot.username);
  
  if (spielerListe.length > 0) {
    const ersteSpieler = spielerListe[0];
    console.log(`🚀 Starte bei Spieler: ${ersteSpieler.username}`);
    
    // Versuche zu teleportieren (wenn OP-Rechte vorhanden)
    bot.chat(`/tp @s ${ersteSpieler.username}`);
    
    await sleep(500);
    bot.chat('Hi! Lass uns was starten. 🚀');
  } else {
    bot.chat('Hi! Lass uns was starten. 🚀');
  }
});

// Hilfsfunktion: Warte
function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// ============================================
// UMGEBUNGS-SCANNER
// ============================================

async function scanneUmgebung() {
  const pos = bot.entity.position;
  const radius = 64;
  const scanErgebnis = {
    position: { x: Math.floor(pos.x), y: Math.floor(pos.y), z: Math.floor(pos.z) },
    wasser: null,
    baeume: null,
    tiere: [],
    monster: [],
    spieler: []
  };
  
  try {
    // Wasser suchen
    const wasserBloecke = bot.findBlocks({
      matching: (block) => block && (block.name === 'water' || block.name === 'flowing_water'),
      maxDistance: radius,
      count: 50
    });
    
    if (wasserBloecke.length > 0) {
      const naechstesWasser = wasserBloecke.reduce((n, c) => 
        pos.distanceTo(c) < pos.distanceTo(n) ? c : n
      );
      scanErgebnis.wasser = {
        distanz: Math.floor(pos.distanceTo(naechstesWasser)),
        position: { x: naechstesWasser.x, y: naechstesWasser.y, z: naechstesWasser.z }
      };
    }
    
    // Bäume suchen
    const holzBloecke = bot.findBlocks({
      matching: (block) => block && block.name.includes('log'),
      maxDistance: radius,
      count: 30
    });
    
    if (holzBloecke.length > 0) {
      const naechsterBaum = holzBloecke.reduce((n, c) => 
        pos.distanceTo(c) < pos.distanceTo(n) ? c : n
      );
      scanErgebnis.baeume = {
        anzahl: holzBloecke.length,
        distanz: Math.floor(pos.distanceTo(naechsterBaum)),
        position: { x: naechsterBaum.x, y: naechsterBaum.y, z: naechsterBaum.z }
      };
    }
    
    // Entities
    const entities = Object.values(bot.entities).filter(e => 
      e.position && e.position.distanceTo(pos) < radius && e !== bot.entity
    );
    
    for (const entity of entities) {
      if (entity.type === 'player') {
        scanErgebnis.spieler.push({
          name: entity.username,
          distanz: Math.floor(pos.distanceTo(entity.position))
        });
      } else if (entity.type === 'mob') {
        const istFeindlich = entity.name && (
          entity.name.includes('zombie') ||
          entity.name.includes('skeleton') ||
          entity.name.includes('creeper') ||
          entity.name.includes('spider') ||
          entity.name.includes('enderman') ||
          entity.name.includes('witch')
        );
        
        if (istFeindlich) {
          scanErgebnis.monster.push({
            typ: entity.name,
            distanz: Math.floor(pos.distanceTo(entity.position)),
            position: entity.position
          });
        } else {
          scanErgebnis.tiere.push({
            typ: entity.name,
            distanz: Math.floor(pos.distanceTo(entity.position))
          });
        }
      }
    }
    
  } catch (err) {
    console.error('Fehler beim Umgebungs-Scan:', err.message);
  }
  
  return scanErgebnis;
}

// ============================================
// INTENT-ANALYSE (Semantisches Verstehen!)
// ============================================

async function analysiereIntent(nachricht, umgebungsScan, username) {
  const intentPrompt = `Analysiere die Anfrage und gib ein JSON-Objekt zurück.

UMGEBUNG:
Position: X:${umgebungsScan.position.x} Y:${umgebungsScan.position.y} Z:${umgebungsScan.position.z}
${umgebungsScan.wasser ? `Wasser: ${umgebungsScan.wasser.distanz}m entfernt` : 'Kein Wasser sichtbar'}
${umgebungsScan.baeume ? `Bäume: ${umgebungsScan.baeume.anzahl} Stück, ${umgebungsScan.baeume.distanz}m entfernt` : 'Keine Bäume sichtbar'}
${umgebungsScan.monster.length > 0 ? `MONSTER: ${umgebungsScan.monster.map(m => `${m.typ} ${m.distanz}m`).join(', ')}` : ''}
${umgebungsScan.tiere.length > 0 ? `Tiere: ${umgebungsScan.tiere.map(t => t.typ).join(', ')}` : ''}

ANFRAGE: "${nachricht}"

Wähle den passenden Intent und generiere eine ECHTE freundliche deutsche Antwort:

1. Bewegung zum Meer/Wasser:
{"intent":"gehe_zu_wasser","antwort":"Ich gehe zum Wasser!"}

2. Bewegung zum Baum:
{"intent":"gehe_zu_baum","antwort":"Ich gehe zum Baum!"}

3. Bewegung zum Spieler (laufen):
{"intent":"komm_zu_spieler","antwort":"Ich komme!"}

4. Teleport zum Spieler:
{"intent":"teleport_zu_spieler","antwort":"Ich teleportiere mich!"}

5. Teleport zu Koordinaten:
{"intent":"teleport_koordinaten","x":100,"y":64,"z":200,"antwort":"Teleportiere!"}

6. Bewegung zu Koordinaten:
{"intent":"gehe_koordinaten","x":100,"y":64,"z":200,"antwort":"Ich gehe zu den Koordinaten!"}

7. Graben:
{"intent":"graben","breite":5,"tiefe":1,"laenge":5,"antwort":"Ich grabe ein 5x5 Gebiet!"}

8. Holz sammeln:
{"intent":"sammle_holz","anzahl":20,"antwort":"Ich sammle 20 Holz!"}

9. Umgebung scannen:
{"intent":"scan","antwort":"Lass mich schauen..."}

10. Position zeigen:
{"intent":"position","antwort":"Hier ist meine Position!"}

11. Inventar zeigen:
{"intent":"inventar","antwort":"Hier ist mein Inventar!"}

12. Bauen/Platzieren:
{"intent":"bauen","blockTyp":"dirt","muster":"reihe","antwort":"Ich baue eine Reihe!"}

13. Kämpfen:
{"intent":"angriff","mobTyp":"zombie","antwort":"Ich greife den Zombie an!"}

14. Essen:
{"intent":"essen","antwort":"Ich esse etwas!"}

15. Crafting:
{"intent":"craften","item":"stick","anzahl":4,"antwort":"Ich crafte Stöcke!"}

16. Interagieren (Tür, Knopf, Kiste):
{"intent":"interagieren","blockTyp":"door","antwort":"Ich öffne die Tür!"}

17. Nur reden (keine Aktion):
{"intent":"konversation","antwort":"Mir geht's super! Wie kann ich helfen?"}

WICHTIG - ERKENNUNG:
- "geh zum meer/wasser/see" → intent="gehe_zu_wasser"
- "geh zum baum/wald/holz" → intent="gehe_zu_baum"
- "komm/komm her/lauf zu mir" → intent="komm_zu_spieler"
- "tp*/teleport*/beam*" → intent="teleport_zu_spieler" ⚠️ WICHTIG bei "teleportiere"!
- "grab*/gräb*" → intent="graben" mit Dimensionen
- "sammel*/hol*/bring* holz" → intent="sammle_holz"
- "bau*/platzier*/mach* eine reihe/turm" → intent="bauen" mit blockTyp und muster
- "greif*/kill*/töt*/angriff*/kämpf*" → intent="angriff" mit mobTyp
- "iss*/hunger*/nahrung" → intent="essen"
- "craft*/mach* sticks/planks/etc" → intent="craften" mit item
- "öffne/aktivier* tür/kiste/knopf" → intent="interagieren" mit blockTyp
- "was siehst du/scan" → intent="scan"
- Explizite Zahlen "geh zu 100 64 200" → intent="gehe_koordinaten"
- "tp 100 64 200" (Zahlen) → intent="teleport_koordinaten"

BEISPIELE:
- "Teleportiere zu mir" → {"intent":"teleport_zu_spieler","antwort":"Zack! Ich bin da!"}
- "Komm zu mir" → {"intent":"komm_zu_spieler","antwort":"Ich laufe zu dir!"}
- "Baue mir eine Brücke" → {"intent":"bauen","blockTyp":"planks","muster":"reihe","antwort":"Ich baue eine Brücke!"}
- "Töte den Zombie" → {"intent":"angriff","mobTyp":"zombie","antwort":"Ich greife den Zombie an!"}
- "Ich habe Hunger" → {"intent":"essen","antwort":"Ich esse etwas!"}
- "Mach mir 4 Stöcke" → {"intent":"craften","item":"stick","anzahl":4,"antwort":"Ich crafte 4 Stöcke!"}
- "Öffne die Tür" → {"intent":"interagieren","blockTyp":"door","antwort":"Ich öffne die Tür!"}

Antworte NUR mit validem JSON, keine Erklärungen!`;

  try {
    const response = await ollama.chat({
      model: MODELL,
      messages: [{ role: 'user', content: intentPrompt }],
      stream: false,
      format: 'json'
    });
    
    const jsonText = response.message.content.trim();
    console.log('📋 Intent-JSON:', jsonText);
    
    return JSON.parse(jsonText);
  } catch (err) {
    console.error('❌ Intent-Parse-Fehler:', err.message);
    return {
      intent: 'konversation',
      antwort: 'Entschuldigung, ich habe das nicht verstanden.'
    };
  }
}

// ============================================
// INTENT-EXECUTOR (Führt Aktionen aus)
// ============================================

async function fuehreIntentAus(intentData, username) {
  console.log(`⚡ Führe Intent aus: ${intentData.intent}`);
  
  try {
    switch (intentData.intent) {
      case 'gehe_zu_wasser':
        const scanWasser = await scanneUmgebung();
        if (scanWasser.wasser) {
          geheZuPosition(scanWasser.wasser.position);
        } else {
          return 'Ich sehe kein Wasser in der Nähe!';
        }
        break;
        
      case 'gehe_zu_baum':
        const scanBaum = await scanneUmgebung();
        if (scanBaum.baeume) {
          geheZuPosition(scanBaum.baeume.position);
        } else {
          return 'Ich sehe keine Bäume in der Nähe!';
        }
        break;
        
      case 'komm_zu_spieler':
        const spieler = bot.players[username];
        if (spieler && spieler.entity) {
          geheZuPosition(spieler.entity.position);
        }
        break;
        
      case 'teleport_zu_spieler':
        console.log(`🔮 Teleportiere zu ${username}`);
        bot.chat(`/tp @s ${username}`);
        break;
        
      case 'teleport_koordinaten':
        if (intentData.x !== undefined && intentData.y !== undefined && intentData.z !== undefined) {
          console.log(`🔮 Teleportiere zu ${intentData.x} ${intentData.y} ${intentData.z}`);
          bot.chat(`/tp @s ${intentData.x} ${intentData.y} ${intentData.z}`);
        }
        break;
        
      case 'gehe_koordinaten':
        if (intentData.x !== undefined && intentData.y !== undefined && intentData.z !== undefined) {
          geheZuPosition({ x: intentData.x, y: intentData.y, z: intentData.z });
        }
        break;
        
      case 'graben':
        const b = intentData.breite || 4;
        const t = intentData.tiefe || 1;
        const l = intentData.laenge || 4;
        grabeBereich(b, t, l);
        break;
        
      case 'sammle_holz':
        sammleHolz(intentData.anzahl || 10);
        break;
        
      case 'bauen':
        baueStruktur(intentData.blockTyp || 'dirt', intentData.muster || 'block');
        break;
        
      case 'angriff':
        greifeMobAn(intentData.mobTyp || null);
        break;
        
      case 'essen':
        esseNahrung();
        break;
        
      case 'craften':
        crafteItem(intentData.item, intentData.anzahl || 1);
        break;
        
      case 'interagieren':
        interagiereBlock(intentData.blockTyp || 'door');
        break;
        
      case 'scan':
        const scan = await scanneUmgebung();
        return formatiereScan(scan);
        
      case 'position':
        const pos = bot.entity.position;
        return `X:${pos.x.toFixed(1)} Y:${pos.y.toFixed(1)} Z:${pos.z.toFixed(1)}`;
        
      case 'inventar':
        return zeigeInventarText();
        
      case 'konversation':
        // Keine Aktion, nur Antwort
        break;
    }
  } catch (err) {
    console.error(`❌ Fehler bei Intent ${intentData.intent}:`, err.message);
    return `Fehler: ${err.message}`;
  }
  
  return null; // Intent ausgeführt, keine zusätzliche Nachricht
}

function formatiereScan(scan) {
  let text = `Position: ${scan.position.x},${scan.position.y},${scan.position.z}`;
  if (scan.wasser) text += ` | Wasser: ${scan.wasser.distanz}m`;
  if (scan.baeume) text += ` | Bäume: ${scan.baeume.anzahl} (${scan.baeume.distanz}m)`;
  if (scan.tiere.length > 0) text += ` | Tiere: ${scan.tiere.length}`;
  return text;
}

function zeigeInventarText() {
  const items = bot.inventory.items();
  if (items.length === 0) return 'Inventar ist leer!';
  
  const itemListe = items.reduce((acc, item) => {
    const name = item.displayName || item.name;
    acc[name] = (acc[name] || 0) + item.count;
    return acc;
  }, {});
  
  return Object.entries(itemListe)
    .map(([name, count]) => `${count}x ${name}`)
    .slice(0, 5)
    .join(', ');
}

// ============================================
// HAUPT-CHAT-FUNKTION (mit Intent-System)
// ============================================

async function chatMitLLM(username, nachricht) {
  try {
    // Umgebung scannen
    console.log('🔍 Scanne Umgebung...');
    const umgebungsScan = await scanneUmgebung();
    
    // Intent analysieren
    console.log('🧠 Analysiere Intent...');
    const intentData = await analysiereIntent(nachricht, umgebungsScan, username);
    
    // Intent ausführen
    const zusatzAntwort = await fuehreIntentAus(intentData, username);
    
    // Antwort kombinieren
    let finalAntwort = intentData.antwort || 'Okay!';
    if (zusatzAntwort) {
      finalAntwort += ' ' + zusatzAntwort;
    }
    
    console.log(`🤖 Bot: ${finalAntwort}`);
    return finalAntwort;
    
  } catch (err) {
    console.error('❌ LLM-Fehler:', err.message);
    return 'Entschuldigung, ich hatte ein Problem.';
  }
}

// ============================================
// AKTIONS-FUNKTIONEN
// ============================================

function geheZuPosition(zielPosition) {
  const mcData = minecraftData(bot.version);
  const defaultMove = new Movements(bot, mcData);
  defaultMove.canDig = true;
  defaultMove.allow1by1towers = false;
  
  bot.pathfinder.setMovements(defaultMove);
  const ziel = new goals.GoalNear(zielPosition.x, zielPosition.y, zielPosition.z, 1);
  
  console.log(`🚶 Bewege mich zu: X:${zielPosition.x.toFixed(1)} Y:${zielPosition.y.toFixed(1)} Z:${zielPosition.z.toFixed(1)}`);
  bot.pathfinder.setGoal(ziel);
}

bot.on('goal_reached', () => {
  console.log('✅ Ziel erreicht!');
  bot.chat('✅ Angekommen!');
});

bot.on('path_update', (results) => {
  if (results.status === 'noPath') {
    console.log('❌ Kein Pfad gefunden!');
    bot.chat('❌ Ich kann dort nicht hin!');
  }
});

async function grabeBereich(breite, tiefe, laenge) {
  bot.chat(`🔨 Grabe ${breite}x${tiefe}x${laenge} Bereich...`);
  console.log('📍 Startposition:', bot.entity.position);
  
  try {
    const startPos = bot.entity.position.clone();
    let bloeckeGegraben = 0;
    
    for (let y = 0; y < tiefe; y++) {
      for (let z = 0; z < laenge; z++) {
        for (let x = 0; x < breite; x++) {
          const grabPos = startPos.offset(x, -(y + 1), z);
          const block = bot.blockAt(grabPos);
          
          if (!block || block.name === 'air' || block.name === 'void_air') {
            continue;
          }
          
          const distanz = bot.entity.position.distanceTo(grabPos);
          if (distanz > 4.5) {
            const zielPos = grabPos.offset(0, 1, 0);
            await bot.pathfinder.goto(new goals.GoalBlock(zielPos.x, zielPos.y, zielPos.z));
          }
          
          console.log(`⛏️ Grabe ${block.name} bei (${x}, ${y}, ${z})`);
          await bot.dig(block);
          bloeckeGegraben++;
          await sleep(100);
        }
      }
      
      if (tiefe > 1) {
        bot.chat(`Schicht ${y + 1}/${tiefe} fertig!`);
      }
    }
    
    bot.chat(`🎉 Fertig! ${bloeckeGegraben} Blöcke gegraben!`);
  } catch (err) {
    bot.chat(`❌ Fehler: ${err.message}`);
    console.error('Fehler beim Graben:', err);
  }
}

async function sammleHolz(anzahl) {
  bot.chat(`🌳 Ich sammle ${anzahl} Holz...`);
  console.log(`🌳 Starte Holz-Sammlung: ${anzahl} Blöcke`);
  
  try {
    const holzBloecke = bot.findBlocks({
      matching: (block) => block && block.name.includes('log'),
      maxDistance: 64,
      count: anzahl * 2
    });
    
    console.log(`📍 ${holzBloecke.length} Holzblöcke gefunden`);
    
    if (holzBloecke.length === 0) {
      bot.chat('Keine Bäume in der Nähe (64 Block Radius)!');
      return;
    }
    
    const naechsterHolzBlock = holzBloecke.reduce((n, c) => 
      bot.entity.position.distanceTo(c) < bot.entity.position.distanceTo(n) ? c : n
    );
    
    const distanzZumBaum = bot.entity.position.distanceTo(naechsterHolzBlock);
    
    if (distanzZumBaum > 5) {
      console.log(`🚶 Gehe zum Baum (${Math.floor(distanzZumBaum)}m entfernt)`);
      bot.chat(`Baum ist ${Math.floor(distanzZumBaum)}m entfernt, gehe dorthin...`);
      geheZuPosition(naechsterHolzBlock);
      await sleep(1000);
    }
    
    let gesammelt = 0;
    for (const blockPos of holzBloecke) {
      if (gesammelt >= anzahl) break;
      
      const block = bot.blockAt(blockPos);
      if (block && block.name.includes('log')) {
        await bot.dig(block);
        gesammelt++;
        console.log(`⛏️ Holz ${gesammelt}/${anzahl}`);
        await sleep(100);
      }
    }
    
    bot.chat(`✅ ${gesammelt} Holz gesammelt!`);
  } catch (err) {
    bot.chat(`❌ Fehler: ${err.message}`);
    console.error('Fehler beim Holz sammeln:', err);
  }
}

// NEU: Baue/Platziere Blöcke
async function baueStruktur(blockTyp, muster) {
  bot.chat(`🏗️ Ich baue mit ${blockTyp}...`);
  console.log(`🏗️ Starte Bau: ${blockTyp}, Muster: ${muster}`);
  
  try {
    // Finde Item im Inventar
    const item = bot.inventory.items().find(i => 
      i.name.toLowerCase().includes(blockTyp.toLowerCase())
    );
    
    if (!item) {
      bot.chat(`Ich habe kein ${blockTyp} im Inventar!`);
      return;
    }
    
    await bot.equip(item, 'hand');
    
    // Einfaches Muster: Reihe, Turm, Plattform
    const pos = bot.entity.position.floored();
    let gebaut = 0;
    
    if (muster === 'reihe') {
      // Baue Reihe vor dem Bot
      for (let x = 1; x <= 5; x++) {
        const zielPos = pos.offset(x, 0, 0);
        const referenzBlock = bot.blockAt(zielPos);
        if (referenzBlock && referenzBlock.name !== 'air') {
          await bot.placeBlock(referenzBlock, bot.vec3(0, 1, 0));
          gebaut++;
          await sleep(200);
        }
      }
    } else if (muster === 'turm') {
      // Baue Turm nach oben
      for (let y = 1; y <= 5; y++) {
        const zielPos = pos.offset(0, y - 1, 0);
        const referenzBlock = bot.blockAt(zielPos);
        if (referenzBlock && referenzBlock.name !== 'air') {
          await bot.placeBlock(referenzBlock, bot.vec3(0, 1, 0));
          gebaut++;
          await sleep(200);
        }
      }
    } else {
      // Standard: Block vor dem Bot platzieren
      const referenzBlock = bot.blockAt(pos.offset(0, -1, 0));
      if (referenzBlock) {
        await bot.placeBlock(referenzBlock, bot.vec3(0, 1, 0));
        gebaut++;
      }
    }
    
    bot.chat(`✅ ${gebaut} Blöcke platziert!`);
  } catch (err) {
    bot.chat(`❌ Fehler beim Bauen: ${err.message}`);
    console.error('Fehler beim Bauen:', err);
  }
}

// NEU: Kämpfe gegen Mob
async function greifeMobAn(mobTyp) {
  bot.chat(`⚔️ Suche ${mobTyp || 'Mob'}...`);
  console.log(`⚔️ Starte Kampf gegen: ${mobTyp || 'beliebiger Mob'}`);
  
  try {
    const entities = Object.values(bot.entities).filter(e => 
      e.type === 'mob' && 
      (!mobTyp || e.name.toLowerCase().includes(mobTyp.toLowerCase())) &&
      e.position.distanceTo(bot.entity.position) < 16
    );
    
    if (entities.length === 0) {
      bot.chat(`Kein ${mobTyp || 'Mob'} in der Nähe!`);
      return;
    }
    
    const ziel = entities[0];
    console.log(`🎯 Greife ${ziel.name} an`);
    bot.chat(`Greife ${ziel.name} an!`);
    
    // Schaue zum Mob und greife an
    await bot.lookAt(ziel.position.offset(0, ziel.height, 0));
    await sleep(200);
    
    for (let i = 0; i < 10; i++) {
      if (!ziel || ziel.isValid === false) {
        bot.chat('✅ Mob besiegt!');
        break;
      }
      
      await bot.attack(ziel);
      await sleep(500);
    }
    
  } catch (err) {
    bot.chat(`❌ Fehler im Kampf: ${err.message}`);
    console.error('Fehler im Kampf:', err);
  }
}

// NEU: Esse Nahrung
async function esseNahrung() {
  try {
    const nahrung = bot.inventory.items().find(item => 
      item.name.includes('bread') ||
      item.name.includes('beef') ||
      item.name.includes('porkchop') ||
      item.name.includes('chicken') ||
      item.name.includes('apple') ||
      item.name.includes('carrot') ||
      item.name.includes('potato')
    );
    
    if (!nahrung) {
      bot.chat('Ich habe keine Nahrung!');
      return;
    }
    
    console.log(`🍖 Esse ${nahrung.name}`);
    bot.chat(`🍖 Ich esse ${nahrung.displayName}...`);
    
    await bot.equip(nahrung, 'hand');
    await bot.consume();
    
    bot.chat('✅ Gegessen!');
  } catch (err) {
    bot.chat(`❌ Fehler beim Essen: ${err.message}`);
    console.error('Fehler beim Essen:', err);
  }
}

// NEU: Crafte Items
async function crafteItem(itemName, anzahl = 1) {
  bot.chat(`🔨 Versuche ${anzahl}x ${itemName} zu craften...`);
  console.log(`🔨 Crafte: ${anzahl}x ${itemName}`);
  
  try {
    const mcData = minecraftData(bot.version);
    const item = mcData.itemsByName[itemName];
    
    if (!item) {
      bot.chat(`Kenne ${itemName} nicht!`);
      return;
    }
    
    const recipe = bot.recipesFor(item.id, null, 1, null)[0];
    
    if (!recipe) {
      bot.chat(`Kein Rezept für ${itemName}!`);
      return;
    }
    
    await bot.craft(recipe, anzahl, null);
    bot.chat(`✅ ${anzahl}x ${itemName} gecraftet!`);
    
  } catch (err) {
    bot.chat(`❌ Fehler beim Crafting: ${err.message}`);
    console.error('Fehler beim Crafting:', err);
  }
}

// NEU: Interagiere mit Block (Tür, Knopf, Kiste, etc.)
async function interagiereBlock(blockTyp) {
  bot.chat(`🚪 Suche ${blockTyp}...`);
  console.log(`🚪 Suche ${blockTyp} in der Nähe`);
  
  try {
    const bloecke = bot.findBlocks({
      matching: (block) => block && block.name.toLowerCase().includes(blockTyp.toLowerCase()),
      maxDistance: 16,
      count: 10
    });
    
    if (bloecke.length === 0) {
      bot.chat(`Kein ${blockTyp} in der Nähe!`);
      return;
    }
    
    const blockPos = bloecke[0];
    const block = bot.blockAt(blockPos);
    
    console.log(`🎯 Interagiere mit ${block.name} bei ${blockPos}`);
    
    await bot.activateBlock(block);
    bot.chat(`✅ ${block.displayName} aktiviert!`);
    
  } catch (err) {
    bot.chat(`❌ Fehler bei Interaktion: ${err.message}`);
    console.error('Fehler bei Interaktion:', err);
  }
}

// ============================================
// CHAT-EVENT (mit Intent-System)
// ============================================

bot.on('chat', async (username, message) => {
  if (username === bot.username) return;
  
  console.log(`<${username}> ${message}`);
  
  // Direktbefehle (Fallback für schnelle Befehle ohne LLM)
  if (message === 'position') {
    const pos = bot.entity.position;
    bot.chat(`X:${pos.x.toFixed(2)} Y:${pos.y.toFixed(2)} Z:${pos.z.toFixed(2)}`);
    return;
  }
  
  if (message === 'hilfe') {
    bot.chat('Sprich einfach natürlich mit mir! Z.B: "geh zum meer", "sammle holz", "komm zu mir"');
    return;
  }
  
  if (message === 'stopp') {
    bot.pathfinder.setGoal(null);
    bot.chat('Bewegung gestoppt!');
    return;
  }
  
  // Alle anderen Nachrichten → Intent-System
  const antwort = await chatMitLLM(username, message);
  
  // Lange Antworten aufteilen
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

// ============================================
// FEHLERBEHANDLUNG
// ============================================

bot.on('error', (err) => {
  console.error('❌ Fehler:', err);
});

bot.on('kicked', (reason) => {
  console.log('⚠️  Bot wurde gekickt:', reason);
});

bot.on('end', () => {
  console.log('🔌 Verbindung zum Server beendet');
});

process.on('SIGINT', () => {
  console.log('\n👋 Bot wird heruntergefahren...');
  bot.quit();
  process.exit(0);
});

