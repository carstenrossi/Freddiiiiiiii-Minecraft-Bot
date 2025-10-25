# Bewegung & Aktions-Kopplung für Freddiiiiii

## Problem
"Freddi schlägt, bleibt aber an der Stelle"
- Bot führt Aktionen aus, bewegt sich aber nicht zum Ziel
- Angriff ohne sich zu nähern
- Graben ohne hinzugehen

## Implementierte Lösung - Pro Aktion:

### 1. **Angriff (NEU!)**

#### Initiale Bewegung zum Ziel:
```javascript
const distanz = bot.entity.position.distanceTo(ziel.position);

if (distanz > 3) {
  bot.chat(`Laufe zu ${zielName}...`);
  bot.pathfinder.setGoal(new goals.GoalFollow(ziel, 2), true);
  
  // Warte bis nah genug (max 5 Sekunden)
  for (let i = 0; i < 10; i++) {
    const aktDist = bot.entity.position.distanceTo(ziel.position);
    if (aktDist <= 3) break;
    await sleep(500);
  }
  
  bot.pathfinder.setGoal(null);
}
```

#### Verfolgung während Kampf:
```javascript
for (let i = 0; i < 20; i++) {
  const aktDistanz = bot.entity.position.distanceTo(ziel.position);
  
  if (aktDistanz > 3.5) {
    // ZU WEIT WEG → Verfolge Ziel
    console.log(`🏃 Ziel ist ${aktDistanz.toFixed(1)}m weg, folge!`);
    bot.pathfinder.setGoal(new goals.GoalFollow(ziel, 2), true);
    await sleep(300);
  } else {
    // NAH GENUG → Stoppe und greife an
    bot.pathfinder.setGoal(null);
    await bot.lookAt(ziel.position);
    await bot.attack(ziel);
    console.log(`⚔️ Angriff ${i+1} (Dist: ${aktDistanz.toFixed(1)}m)`);
  }
  
  await sleep(500);
}
```

**Resultat**: Bot läuft zum Creeper, folgt ihm wenn er wegläuft, greift nur an wenn nah genug!

### 2. **Graben (BEREITS IMPLEMENTIERT)**

```javascript
for (let x = 0; x < breite; x++) {
  const pos = start.offset(x, -y, z);
  const block = bot.blockAt(pos);
  
  // Bewegung zum Block wenn zu weit
  if (bot.entity.position.distanceTo(pos) > 4.5) {
    await bot.pathfinder.goto(new goals.GoalBlock(pos.x, pos.y + 1, pos.z));
  }
  
  await bot.dig(block);
}
```

**Resultat**: Bot bewegt sich zu jedem Block der zu weit weg ist.

### 3. **Holz sammeln (BEREITS IMPLEMENTIERT)**

```javascript
const naechster = bloecke.reduce((n, c) => 
  bot.entity.position.distanceTo(c) < bot.entity.position.distanceTo(n) ? c : n
);

const dist = bot.entity.position.distanceTo(naechster);

// NUR hingehen wenn weit weg (>8 Blöcke)
if (dist > 8) {
  bot.chat(`Gehe zum Baum...`);
  geheZuPosition(naechster);
  
  // Warte auf Ankunft (maximal 15 Sekunden)
  for (let w = 0; w < 30; w++) {
    if (!bewegungsStatus.aktiv || bewegungsStatus.erfolg) break;
    await sleep(500);
  }
}
```

**Resultat**: Bot läuft zum nächsten Baum wenn er weit weg ist.

### 4. **Bauen (TEILWEISE IMPLEMENTIERT)**

```javascript
// Bewegt sich VOR dem Bauen weg (um sich nicht selbst im Weg zu stehen)
if (muster === 'turm') {
  geheZuPosition(startPos.offset(2, 0, 0)); // 2 Blöcke zur Seite
} else {
  geheZuPosition(startPos.offset(-2, 0, 0)); // 2 Blöcke zurück
}
await sleep(2000); // Warte auf Bewegung
```

**Resultat**: Bot steht nicht mehr im eigenen Weg beim Bauen.

## Bewegungs-Strategien:

### GoalFollow (für bewegliche Ziele)
```javascript
bot.pathfinder.setGoal(new goals.GoalFollow(entity, range), true);
```
- ✅ Folgt dem Ziel automatisch
- ✅ Hält Mindestabstand (z.B. 2 Blöcke)
- ✅ Ideal für Kampf

### GoalBlock (für feste Positionen)
```javascript
bot.pathfinder.setGoal(new goals.GoalBlock(x, y, z));
```
- ✅ Geht zu exakter Position
- ✅ Ideal für graben/bauen

### geheZuPosition (wrapper)
```javascript
geheZuPosition(Vec3);
```
- ✅ Nutzt GoalNear
- ✅ Setzt `bewegungsStatus`
- ✅ Hat Stuck-Detection

## Debug-Logs:

### Angriff mit Bewegung:
```
⚔️ Suche creeper...
Greife creeper an! (13m entfernt)
Laufe zu creeper...
🏃 Bewege mich 13m zum Ziel
✅ Nah genug: 2.8m
🗡️ Equippe netherite_sword
⚔️ Angriff 1 (Dist: 2.8m)
⚔️ Angriff 2 (Dist: 2.3m)
🏃 Ziel ist 4.2m weg, folge! (Creeper läuft weg)
⚔️ Angriff 3 (Dist: 2.1m)
✅ Besiegt oder entkommen!
⚔️ Kampf beendet!
```

### Graben:
```
🔨 Grabe 4x2x4...
(Bot bewegt sich zu Blocks die >4.5m entfernt sind)
Schicht 1/2
Schicht 2/2
✅ 32 Blöcke gegraben!
```

### Holz sammeln:
```
🌳 Sammle 10 Holz...
📍 Nächster Holzblock: 45m entfernt
🚶 Gehe zum Baum (45m)
Gehe zum Baum...
(Bot läuft hin)
⛏️ Sammle Holz...
```

## Vorteile:

✅ **Natürliches Verhalten** - Bot läuft zu Zielen wie ein Spieler  
✅ **Kampf-Verfolgung** - Folgt Mobs die weglaufen  
✅ **Effizienz** - Bewegt sich nur wenn nötig (>3-8 Blöcke)  
✅ **Robust** - Try-Catch bei Bewegungsfehlern  
✅ **Transparent** - Klare Logs zeigen was passiert  

## Einschränkungen:

⚠️ **Pathfinding-Grenzen** - Bot kann nicht über alle Hindernisse  
⚠️ **Performance** - Häufiges Pathfinding kann langsam sein  
⚠️ **Monster-Aggro** - Monster könnten zurückschlagen während Bot läuft  

## Zukünftige Verbesserungen:

1. **Sprint während Verfolgung**
   ```javascript
   bot.setControlState('sprint', true);
   ```

2. **Strafe (seitwärts) während Kampf**
   - Ausweichen vor Creeper-Explosionen
   - Kreis um Ziel laufen

3. **Höhen-Awareness**
   - Pillar bei Höhenunterschieden
   - Scaffold bei Schluchten

4. **PvP-Optimierung**
   - W-Tap (Sprint-Hit)
   - Combo-Mechanik
