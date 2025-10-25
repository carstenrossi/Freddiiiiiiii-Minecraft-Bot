import mineflayer from 'mineflayer';
import pathfinderPlugin from 'mineflayer-pathfinder';
import minecraftData from 'minecraft-data';
import { Ollama } from 'ollama';

const { pathfinder, Movements, goals } = pathfinderPlugin;

// Ollama initialisieren (IPv4 erzwingen!)
const ollama = new Ollama({ host: 'http://127.0.0.1:11434' });
const MODELL = 'deepseek-r1:8b';

// Konversationshistorie pro Spieler
const konversationen = new Map();

// Bot-Konfiguration
const bot = mineflayer.createBot({
  host: 'localhost', // Minecraft-Server IP
  port: 4444,        // Minecraft-Server Port
  username: 'GrabBot', // Bot-Name (für Offline-Server)
  // auth: 'microsoft', // Für Online-Server (auskommentiert lassen für Offline)
  version: false, // Automatische Versionsauswahl
});

// Pathfinder Plugin laden
bot.loadPlugin(pathfinder);

// Event: Bot ist erfolgreich verbunden
bot.on('spawn', () => {
  console.log('✅ Bot ist verbunden und gespawnt!');
  console.log(`Position: ${bot.entity.position}`);
  bot.chat('Hallo! Ich bin bereit zum Graben. Schreibe "graben" um zu starten!');
});

// Hilfsfunktion: Warte eine bestimmte Zeit
function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// Umgebungs-Scanner: Analysiere die Welt um den Bot herum
async function scanneUmgebung() {
  const pos = bot.entity.position;
  const radius = 64;
  const scanErgebnis = {
    position: `X:${pos.x.toFixed(0)} Y:${pos.y.toFixed(0)} Z:${pos.z.toFixed(0)}`,
    wasser: null,
    baeume: null,
    tiere: [],
    spieler: [],
    bloecke: {
      erde: 0,
      stein: 0,
      holz: 0,
      erze: 0
    },
    licht: bot.entity.position.y > 60 ? 'Tag' : 'Dunkel'
  };
  
  try {
    // Wasser suchen
    const wasserBloecke = bot.findBlocks({
      matching: (block) => block && (block.name === 'water' || block.name === 'flowing_water'),
      maxDistance: radius,
      count: 50
    });
    
    if (wasserBloecke.length > 0) {
      const naechstesWasser = wasserBloecke.reduce((naechstes, current) => 
        pos.distanceTo(current) < pos.distanceTo(naechstes) ? current : naechstes
      );
      scanErgebnis.wasser = {
        distanz: Math.floor(pos.distanceTo(naechstesWasser)),
        richtung: getRichtung(pos, naechstesWasser),
        position: naechstesWasser
      };
    }
    
    // Bäume/Holz suchen
    const holzBloecke = bot.findBlocks({
      matching: (block) => block && (
        block.name.includes('log') || 
        block.name.includes('wood')
      ),
      maxDistance: radius,
      count: 30
    });
    
    if (holzBloecke.length > 0) {
      const naechsterBaum = holzBloecke.reduce((naechstes, current) => 
        pos.distanceTo(current) < pos.distanceTo(naechstes) ? current : naechstes
      );
      scanErgebnis.baeume = {
        anzahl: holzBloecke.length,
        distanz: Math.floor(pos.distanceTo(naechsterBaum)),
        richtung: getRichtung(pos, naechsterBaum),
        position: naechsterBaum
      };
    }
    
    // Entities scannen (Tiere, Monster, Spieler)
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
        const tierInfo = {
          typ: entity.name,
          distanz: Math.floor(pos.distanceTo(entity.position)),
          position: entity.position
        };
        scanErgebnis.tiere.push(tierInfo);
      }
    }
    
  } catch (err) {
    console.error('Fehler beim Umgebungs-Scan:', err.message);
  }
  
  return scanErgebnis;
}

// Hilfsfunktion: Bestimme Himmelsrichtung
function getRichtung(von, zu) {
  const dx = zu.x - von.x;
  const dz = zu.z - von.z;
  const winkel = Math.atan2(dz, dx) * 180 / Math.PI;
  
  if (winkel >= -45 && winkel < 45) return 'Osten';
  if (winkel >= 45 && winkel < 135) return 'Süden';
  if (winkel >= -135 && winkel < -45) return 'Norden';
  return 'Westen';
}

// Formatiere Umgebungs-Info für LLM
function formatiereUmgebungsInfo(scan) {
  let info = `\n\n=== AKTUELLE UMGEBUNG ===\n`;
  info += `Position: ${scan.position}\n`;
  
  if (scan.wasser) {
    info += `🌊 Wasser: ${scan.wasser.distanz}m ${scan.wasser.richtung}\n`;
  } else {
    info += `🌊 Wasser: Keins in Sicht (64 Block Radius)\n`;
  }
  
  if (scan.baeume) {
    info += `🌳 Bäume: ${scan.baeume.anzahl} Stück, nächster ${scan.baeume.distanz}m ${scan.baeume.richtung}\n`;
  } else {
    info += `🌳 Bäume: Keine in Sicht\n`;
  }
  
  if (scan.tiere.length > 0) {
    const tierTypen = scan.tiere.reduce((acc, tier) => {
      acc[tier.typ] = (acc[tier.typ] || 0) + 1;
      return acc;
    }, {});
    info += `🐄 Tiere: ${Object.entries(tierTypen).map(([typ, anzahl]) => `${anzahl}x ${typ}`).join(', ')}\n`;
  }
  
  if (scan.spieler.length > 0) {
    info += `👥 Spieler: ${scan.spieler.map(s => `${s.name} (${s.distanz}m)`).join(', ')}\n`;
  }
  
  return info;
}

// Action-Parser: Extrahiere und führe Aktionen aus
async function verarbeiteAktionen(antwort, username) {
  // Suche nach Aktionen im Format [AKTION:params]
  const aktionRegex = /\[([A-Z_]+)(?::([^\]]+))?\]/g;
  let match;
  const aktionen = [];
  
  while ((match = aktionRegex.exec(antwort)) !== null) {
    aktionen.push({
      typ: match[1],
      params: match[2] ? match[2].trim() : null,
      vollstaendig: match[0]
    });
  }
  
  // Aktionen ausführen
  for (const aktion of aktionen) {
    console.log(`⚡ Führe aus: ${aktion.typ} ${aktion.params || ''}`);
    
    try {
      switch (aktion.typ) {
        case 'GRABEN':
          if (aktion.params) {
            const [b, t, l] = aktion.params.split(' ').map(v => parseInt(v.trim()));
            if (!isNaN(b) && !isNaN(t) && !isNaN(l)) {
              grabeBereich(b, t, l);
            } else {
              grabeBereich(4, 1, 4);
            }
          } else {
            grabeBereich(4, 1, 4);
          }
          break;
          
        case 'KOMM':
          const spieler = bot.players[username];
          if (spieler && spieler.entity) {
            geheZuPosition(spieler.entity.position);
          }
          break;
          
        case 'GEHE':
          if (aktion.params) {
            const [x, y, z] = aktion.params.split(' ').map(v => parseFloat(v.trim()));
            if (!isNaN(x) && !isNaN(y) && !isNaN(z)) {
              geheZuPosition({ x, y, z });
            }
          }
          break;
          
        case 'GEHE_ZU_WASSER':
          const scan = await scanneUmgebung();
          if (scan.wasser) {
            console.log(`🌊 Gehe zu Wasser bei ${scan.wasser.position}`);
            geheZuPosition(scan.wasser.position);
          } else {
            bot.chat('Ich sehe kein Wasser in der Nähe!');
          }
          break;
          
        case 'GEHE_ZU_BAUM':
          const scanBaum = await scanneUmgebung();
          if (scanBaum.baeume) {
            console.log(`🌳 Gehe zu Baum bei ${scanBaum.baeume.position}`);
            geheZuPosition(scanBaum.baeume.position);
          } else {
            bot.chat('Ich sehe keine Bäume in der Nähe!');
          }
          break;
          
        case 'SAMMLE_HOLZ':
          const anzahl = aktion.params ? parseInt(aktion.params) : 10;
          sammleHolz(anzahl);
          break;
          
        case 'PLATZIERE_BLOCK':
          if (aktion.params) {
            const [blockTyp, relX, relY, relZ] = aktion.params.split(' ');
            await platziereBlock(blockTyp, 
              parseFloat(relX) || 0, 
              parseFloat(relY) || 1, 
              parseFloat(relZ) || 0
            );
          }
          break;
          
        case 'SCHAUE':
          if (aktion.params) {
            const richtung = aktion.params.toLowerCase();
            schaueInRichtung(richtung);
          }
          break;
          
        case 'INVENTAR':
          zeigeInventar();
          break;
          
        case 'TP_HIER':
          bot.chat(`/tp @s ${username}`);
          break;
          
        case 'TP':
          if (aktion.params) {
            const [x, y, z] = aktion.params.split(' ').map(v => parseFloat(v.trim()));
            if (!isNaN(x) && !isNaN(y) && !isNaN(z)) {
              bot.chat(`/tp @s ${x} ${y} ${z}`);
            }
          }
          break;
          
        case 'POSITION':
          const pos = bot.entity.position;
          bot.chat(`X:${pos.x.toFixed(1)} Y:${pos.y.toFixed(1)} Z:${pos.z.toFixed(1)}`);
          break;
          
        case 'SCAN':
          const umgebung = await scanneUmgebung();
          bot.chat(formatiereUmgebungsInfo(umgebung));
          break;
      }
    } catch (err) {
      console.error(`❌ Fehler bei Aktion ${aktion.typ}:`, err.message);
    }
  }
  
  // Entferne Aktions-Marker aus der Antwort
  const bereinigteantwort = antwort.replace(aktionRegex, '').trim();
  
  return bereinigteantwort || antwort;
}

// LLM-Integration: Chat mit Ollama
async function chatMitLLM(username, nachricht) {
  try {
    // Konversationshistorie für Spieler initialisieren
    if (!konversationen.has(username)) {
      konversationen.set(username, [
        {
          role: 'system',
          content: `Du bist GrabBot, ein intelligenter Minecraft-Bot mit Wahrnehmung deiner Umgebung!

=== VERFÜGBARE AKTIONEN ===

🏗️ GRABEN & BAUEN:
- [GRABEN:B T L] - Gräbt Gebiet (Breite Tiefe Länge), z.B. [GRABEN:5 2 5]
- [SAMMLE_HOLZ:Anzahl] - Sammelt Holz von Bäumen, z.B. [SAMMLE_HOLZ:20]
- [PLATZIERE_BLOCK:Typ X Y Z] - Platziert Block, z.B. [PLATZIERE_BLOCK:dirt 1 0 0]

🚶 BEWEGUNG:
- [KOMM] - Kommt zum Spieler
- [GEHE_ZU_WASSER] - Geht zum nächsten Wasser/Meer ⚠️ VERWENDE DIES für "meer", "wasser", "see"!
- [GEHE_ZU_BAUM] - Geht zum nächsten Baum ⚠️ VERWENDE DIES für "baum", "wald", "holz"!
- [GEHE:X Y Z] - Geht zu EXAKTEN Koordinaten (nur bei Zahlen wie "100 64 200")
- [TP_HIER] - Teleportiert zu Spieler
- [TP:X Y Z] - Teleportiert zu Koordinaten

⚠️ WICHTIG - UNTERSCHEIDE GENAU:
- "geh zum meer/wasser" → [GEHE_ZU_WASSER] (NICHT [GEHE:X Y Z]!)
- "geh zu 100 64 200" → [GEHE:100 64 200]
- "geh zum baum" → [GEHE_ZU_BAUM] (NICHT [GEHE:X Y Z]!)

👁️ WAHRNEHMUNG:
- [SCAN] - Scannt die Umgebung und zeigt Details
- [SCHAUE:Richtung] - Schaut in Richtung (norden, osten, süden, westen)
- [POSITION] - Zeigt Position
- [INVENTAR] - Zeigt Inventar

=== UMGEBUNGS-BEWUSSTSEIN ===
Du erhältst bei jeder Nachricht aktuelle Informationen über deine Umgebung:
- Wasser/Meer in der Nähe (Entfernung, Richtung)
- Bäume (Anzahl, Position)
- Tiere und Spieler
- Deine aktuelle Position

Nutze diese Informationen intelligent! Wenn jemand sagt "Geh zum Meer" und du siehst Wasser 20m im Osten, nutze [GEHE_ZU_WASSER].

=== BEISPIELE ===

Spieler: "Grab mir ein großes Loch"
→ [GRABEN:6 2 6] Okay, ich grabe dir ein 6x6 Loch, 2 Schichten tief!

Spieler: "Geh zum Meer" (Umgebung zeigt: 🌊 Wasser 25m Westen)
→ [GEHE_ZU_WASSER] Ich gehe zum Wasser, das ist 25 Blöcke im Westen!

Spieler: "gehe zum meer" (Umgebung zeigt: 🌊 Wasser 15m Süden)
→ ✅ RICHTIG: [GEHE_ZU_WASSER] Auf dem Weg zum Meer, 15m südlich!
→ ❌ FALSCH: [GEHE:100 64 200] (Koordinaten nur bei expliziten Zahlen!)

Spieler: "lauf zum wasser"
→ ✅ RICHTIG: [GEHE_ZU_WASSER] Ich laufe zum Wasser!
→ ❌ FALSCH: [GEHE:X Y Z]

Spieler: "geh zu Koordinaten 100 64 200"
→ ✅ RICHTIG: [GEHE:100 64 200] Okay, gehe zu den Koordinaten!
→ ❌ FALSCH: [GEHE_ZU_WASSER]

Spieler: "Sammle 30 Holz" (Umgebung zeigt: 🌳 Bäume 10 Stück)
→ [SAMMLE_HOLZ:30] Ich sammle 30 Holzblöcke von den Bäumen!

Spieler: "hol holz" (Umgebung zeigt: 🌳 Bäume)
→ [SAMMLE_HOLZ:10] Ich hole Holz für dich!

Spieler: "Was ist in der Nähe?"
→ [SCAN] Lass mich schauen... (dann Umgebungsinfo)

Spieler: "Baue eine Brücke"
→ Ich kann Blöcke platzieren! Hast du Material im Inventar?

=== WICHTIG - AKTION-REGELN ===

KRITISCH: Du MUSST bei JEDER Handlungsanfrage die passende AKTION ausführen!

Erkennungs-Regeln (STRIKT BEFOLGEN!):
- "geh zum meer/wasser/see" → [GEHE_ZU_WASSER] ⚠️ NIE [GEHE:X Y Z] verwenden!
- "geh zum baum/wald/holz" → [GEHE_ZU_BAUM] ⚠️ NIE [GEHE:X Y Z] verwenden!
- "komm her/zu mir" → [KOMM]
- "grab*/gräb*" → [GRABEN:X Y Z]
- "sammel* holz" → [SAMMLE_HOLZ:Anzahl]
- "wo ist*/was siehst du" → [SCAN]
- "wo bist du" → [POSITION]
- "zeig inventar" → [INVENTAR]
- "geh zu 100 64 200" (ZAHLEN!) → [GEHE:100 64 200]

NOCHMAL: [GEHE:X Y Z] ist NUR für explizite Koordinaten-Zahlen!
Für "meer", "wasser", "baum" → Spezial-Aktionen nutzen!

WICHTIG:
- Wenn WASSER in den Umgebungs-Infos steht und jemand "meer/wasser/see" sagt → [GEHE_ZU_WASSER]
- Wenn BÄUME in den Umgebungs-Infos stehen und jemand "baum/holz/wald" sagt → [GEHE_ZU_BAUM]
- IMMER zuerst die Aktion in [KLAMMERN], dann dein Text!
- Nutze die Umgebungs-Daten AKTIV für Entscheidungen!
- Halte Antworten kurz (max 2-3 Sätze)
- Antworte freundlich auf Deutsch`
        }
      ]);
    }
    
    const historie = konversationen.get(username);
    
    // Scanne Umgebung für aktuellen Kontext
    console.log('🔍 Scanne Umgebung...');
    const umgebungsScan = await scanneUmgebung();
    const umgebungsKontext = formatiereUmgebungsInfo(umgebungsScan);
    
    // Neue Nachricht mit Umgebungs-Kontext hinzufügen
    const nachrichtMitKontext = nachricht + umgebungsKontext;
    
    historie.push({
      role: 'user',
      content: nachrichtMitKontext
    });
    
    console.log(`💬 ${username}: ${nachricht}`);
    console.log('🤔 Frage LLM (mit Umgebungskontext)...');
    
    // Ollama aufrufen
    const response = await ollama.chat({
      model: MODELL,
      messages: historie,
      stream: false
    });
    
    const antwort = response.message.content;
    
    // Antwort zur Historie hinzufügen
    historie.push({
      role: 'assistant',
      content: antwort
    });
    
    // Historie auf max 10 Nachrichten begrenzen (+ System-Prompt)
    if (historie.length > 21) {
      konversationen.set(username, [
        historie[0], // System-Prompt behalten
        ...historie.slice(-20) // Letzte 20 Nachrichten
      ]);
    }
    
    console.log(`🤖 Bot: ${antwort}`);
    
    // Aktionen aus der Antwort extrahieren und ausführen
    const aktionenUndAntwort = await verarbeiteAktionen(antwort, username);
    
    return aktionenUndAntwort;
    
  } catch (err) {
    console.error('❌ LLM-Fehler:', err.message);
    console.error('Fehler-Details:', err);
    console.error('Stack:', err.stack);
    return 'Entschuldigung, ich hatte gerade ein technisches Problem. Kannst du das wiederholen?';
  }
}

// Sammle Holz von Bäumen
async function sammleHolz(anzahl) {
  bot.chat(`🌳 Ich sammle ${anzahl} Holz...`);
  console.log(`🌳 Starte Holz-Sammlung: ${anzahl} Blöcke`);
  
  try {
    const holzBloecke = bot.findBlocks({
      matching: (block) => block && block.name.includes('log'),
      maxDistance: 32,
      count: anzahl * 2
    });
    
    if (holzBloecke.length === 0) {
      bot.chat('Keine Bäume in der Nähe!');
      return;
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
    bot.chat(`❌ Fehler beim Holz sammeln: ${err.message}`);
    console.error('Fehler beim Holz sammeln:', err);
  }
}

// Platziere einen Block
async function platziereBlock(blockTyp, relX, relY, relZ) {
  try {
    const pos = bot.entity.position;
    const zielPos = pos.offset(relX, relY, relZ);
    const referenzBlock = bot.blockAt(zielPos.offset(0, -1, 0));
    
    if (!referenzBlock) {
      bot.chat('Kein Platz zum Bauen!');
      return;
    }
    
    // Suche Block im Inventar
    const item = bot.inventory.items().find(i => i.name.includes(blockTyp));
    
    if (!item) {
      bot.chat(`Ich habe kein ${blockTyp} im Inventar!`);
      return;
    }
    
    await bot.equip(item, 'hand');
    await bot.placeBlock(referenzBlock, new bot.vec3(0, 1, 0));
    bot.chat(`✅ ${blockTyp} platziert!`);
    
  } catch (err) {
    bot.chat(`❌ Fehler beim Bauen: ${err.message}`);
    console.error('Fehler beim Block platzieren:', err);
  }
}

// Schaue in eine Richtung
function schaueInRichtung(richtung) {
  const pos = bot.entity.position;
  let yaw;
  
  switch(richtung) {
    case 'norden': yaw = -Math.PI; break;
    case 'osten': yaw = -Math.PI / 2; break;
    case 'süden': yaw = 0; break;
    case 'westen': yaw = Math.PI / 2; break;
    default: 
      bot.chat('Ungültige Richtung! (norden, osten, süden, westen)');
      return;
  }
  
  bot.look(yaw, 0, true);
  bot.chat(`👀 Schaue nach ${richtung}`);
}

// Zeige Inventar
function zeigeInventar() {
  const items = bot.inventory.items();
  
  if (items.length === 0) {
    bot.chat('Inventar ist leer!');
    return;
  }
  
  const itemListe = items.reduce((acc, item) => {
    const name = item.displayName || item.name;
    acc[name] = (acc[name] || 0) + item.count;
    return acc;
  }, {});
  
  const text = Object.entries(itemListe)
    .map(([name, count]) => `${count}x ${name}`)
    .slice(0, 5)
    .join(', ');
    
  bot.chat(`📦 Inventar: ${text}${items.length > 5 ? '...' : ''}`);
}

// Bewegungsfunktion: Gehe zu einer Position
function geheZuPosition(zielPosition) {
  const mcData = minecraftData(bot.version);
  const defaultMove = new Movements(bot, mcData);
  
  // Erlaube dem Bot zu springen, Blöcke zu platzieren/abbauen, etc.
  defaultMove.canDig = true;
  defaultMove.allow1by1towers = false; // Keine 1x1 Türme bauen
  
  bot.pathfinder.setMovements(defaultMove);
  
  // Setze Ziel: Gehe zur Position (mit 1 Block Toleranz)
  const ziel = new goals.GoalNear(zielPosition.x, zielPosition.y, zielPosition.z, 1);
  
  console.log(`🚶 Bewege mich zu: X:${zielPosition.x.toFixed(1)} Y:${zielPosition.y.toFixed(1)} Z:${zielPosition.z.toFixed(1)}`);
  
  bot.pathfinder.setGoal(ziel);
}

// Event: Ziel erreicht
bot.on('goal_reached', () => {
  console.log('✅ Ziel erreicht!');
  bot.chat('✅ Angekommen!');
});

// Event: Pfad kann nicht gefunden werden
bot.on('path_update', (results) => {
  if (results.status === 'noPath') {
    console.log('❌ Kein Pfad gefunden!');
    bot.chat('❌ Ich kann dort nicht hin!');
  }
});

// Hauptfunktion: Flexibles Graben
async function grabeBereich(breite = 1, tiefe = 1, laenge = 1) {
  bot.chat(`🔨 Grabe ${breite}x${tiefe}x${laenge} Bereich...`);
  console.log('📍 Startposition:', bot.entity.position);
  
  try {
    const startPos = bot.entity.position.clone();
    let bloeckeGegraben = 0;
    
    // Durch alle Schichten (Tiefe)
    for (let y = 0; y < tiefe; y++) {
      // Durch alle Reihen (Länge in Z-Richtung)
      for (let z = 0; z < laenge; z++) {
        // Durch alle Spalten (Breite in X-Richtung)
        for (let x = 0; x < breite; x++) {
          // Position des zu grabenden Blocks
          const grabPos = startPos.offset(x, -(y + 1), z);
          const block = bot.blockAt(grabPos);
          
          if (!block) {
            console.log(`Kein Block bei ${grabPos}`);
            continue;
          }
          
          if (block.name === 'air' || block.name === 'void_air') {
            continue; // Luft überspringen
          }
          
          // Zum Block bewegen (falls nötig)
          const distanz = bot.entity.position.distanceTo(grabPos);
          if (distanz > 4.5) {
            console.log(`Bewege zum Block bei ${grabPos.x.toFixed(0)}, ${grabPos.y.toFixed(0)}, ${grabPos.z.toFixed(0)}`);
            // Stehe neben dem Block
            const zielPos = grabPos.offset(0, 1, 0);
            await bot.pathfinder.goto(new goals.GoalBlock(zielPos.x, zielPos.y, zielPos.z));
          }
          
          // Block abbauen
          console.log(`⛏️  Grabe ${block.name} bei (${x}, ${y}, ${z})`);
          await bot.dig(block);
          bloeckeGegraben++;
          
          await sleep(100); // Kleine Pause
        }
      }
      
      if (tiefe > 1) {
        bot.chat(`Schicht ${y + 1}/${tiefe} fertig!`);
      }
    }
    
    bot.chat(`🎉 Fertig! ${bloeckeGegraben} Blöcke gegraben!`);
    console.log('✅ Graben abgeschlossen!');
    
  } catch (err) {
    bot.chat(`❌ Fehler: ${err.message}`);
    console.error('Fehler:', err);
  }
}

// Event: Chat-Nachrichten empfangen
bot.on('chat', async (username, message) => {
  if (username === bot.username) return; // Eigene Nachrichten ignorieren
  
  console.log(`<${username}> ${message}`);
  
  // Direktbefehle (haben Priorität)
  const istDirektBefehl = message.startsWith('graben') || 
                          message.startsWith('gehe ') ||
                          message.startsWith('tp ') ||
                          message === 'komm' ||
                          message === 'stopp' ||
                          message === 'position' ||
                          message === 'hilfe';
  
  // Wenn es kein Direktbefehl ist, verwende LLM
  if (!istDirektBefehl) {
    const antwort = await chatMitLLM(username, message);
    // Lange Antworten aufteilen (Minecraft-Chat-Limit: ~256 Zeichen)
    if (antwort.length > 240) {
      const teile = antwort.match(/.{1,240}/g) || [antwort];
      for (const teil of teile) {
        bot.chat(teil);
        await sleep(500);
      }
    } else {
      bot.chat(antwort);
    }
    return; // Beende hier, damit keine weiteren Befehle ausgeführt werden
  }
  
  // Direkte Befehle (alte Logik)
  if (message === 'hallo') {
    bot.chat(`Hallo ${username}!`);
  }
  
  if (message === 'position') {
    const pos = bot.entity.position;
    bot.chat(`Ich bin bei X:${pos.x.toFixed(2)} Y:${pos.y.toFixed(2)} Z:${pos.z.toFixed(2)}`);
  }
  
  if (message.startsWith('graben')) {
    const teile = message.split(' ');
    
    if (teile.length === 1) {
      // Standard: 4x4 Quadrat, 1 Schicht tief
      grabeBereich(4, 1, 4);
    } else if (teile.length === 4) {
      // Benutzerdefiniert: graben BREITE TIEFE LÄNGE
      const breite = parseInt(teile[1]);
      const tiefe = parseInt(teile[2]);
      const laenge = parseInt(teile[3]);
      
      if (!isNaN(breite) && !isNaN(tiefe) && !isNaN(laenge)) {
        if (breite > 0 && tiefe > 0 && laenge > 0 && breite <= 10 && tiefe <= 10 && laenge <= 10) {
          grabeBereich(breite, tiefe, laenge);
        } else {
          bot.chat('Werte müssen zwischen 1 und 10 sein!');
        }
      } else {
        bot.chat('Ungültige Zahlen! Beispiel: graben 4 2 4');
      }
    } else {
      bot.chat('Beispiel: graben oder graben 4 2 4 (Breite Tiefe Länge)');
    }
  }
  
  if (message === 'hilfe') {
    bot.chat('graben [B T L], komm, gehe X Y Z, tp hier/X Y Z, position, stopp');
  }
  
  if (message.startsWith('tp ')) {
    // Teleport-Befehl: "tp 100 64 200" oder "tp hier"
    const teile = message.split(' ');
    
    if (teile[1] === 'hier') {
      // Bot teleportiert sich zum Spieler
      bot.chat(`/tp @s ${username}`);
      console.log(`🔮 Teleportiere zu ${username}`);
    } else if (teile.length === 4) {
      const x = parseFloat(teile[1]);
      const y = parseFloat(teile[2]);
      const z = parseFloat(teile[3]);
      
      if (!isNaN(x) && !isNaN(y) && !isNaN(z)) {
        bot.chat(`/tp @s ${x} ${y} ${z}`);
        console.log(`🔮 Teleportiere zu X:${x} Y:${y} Z:${z}`);
      } else {
        bot.chat('Ungültige Koordinaten! Beispiel: tp 100 64 200');
      }
    } else {
      bot.chat('Beispiel: tp 100 64 200 oder tp hier');
    }
  }
  
  if (message === 'komm') {
    // Bot kommt zum Spieler
    const spieler = bot.players[username];
    if (!spieler || !spieler.entity) {
      bot.chat('Ich kann dich nicht sehen!');
      return;
    }
    
    bot.chat(`Ich komme zu dir, ${username}!`);
    geheZuPosition(spieler.entity.position);
  }
  
  if (message.startsWith('gehe ')) {
    // Bot geht zu Koordinaten: "gehe 100 64 200"
    const teile = message.split(' ');
    if (teile.length === 4) {
      const x = parseFloat(teile[1]);
      const y = parseFloat(teile[2]);
      const z = parseFloat(teile[3]);
      
      if (!isNaN(x) && !isNaN(y) && !isNaN(z)) {
        bot.chat(`Gehe zu X:${x} Y:${y} Z:${z}`);
        geheZuPosition({ x, y, z });
      } else {
        bot.chat('Ungültige Koordinaten! Beispiel: gehe 100 64 200');
      }
    } else {
      bot.chat('Beispiel: gehe 100 64 200');
    }
  }
  
  if (message === 'stopp') {
    bot.pathfinder.setGoal(null);
    bot.chat('Bewegung gestoppt!');
    console.log('🛑 Bewegung gestoppt');
  }
});

// Event: Fehlerbehandlung
bot.on('error', (err) => {
  console.error('❌ Fehler:', err);
});

// Event: Bot wurde gekickt
bot.on('kicked', (reason) => {
  console.log('⚠️  Bot wurde gekickt:', reason);
});

// Event: Bot wurde vom Server getrennt
bot.on('end', () => {
  console.log('🔌 Verbindung zum Server beendet');
});

// Graceful Shutdown
process.on('SIGINT', () => {
  console.log('\n👋 Bot wird heruntergefahren...');
  bot.quit();
  process.exit(0);
});

