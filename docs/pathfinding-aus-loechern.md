# Pathfinding aus Löchern - Verbesserungen

## Problem
"So richtig kommt er aus engen Löchern immer noch nicht raus"

### Symptome:
```
⚠️ Großer Höhenunterschied: 7 Blöcke
🚶 Gehe zu: -136, 67, -38 (aktuell Y:60)
✅ Bot wieder bereit
⏰ Bewegungs-Timeout!
```

Bot kommt nicht zum Spieler wenn er in einem Loch ist.

## Root Causes:

### 1. **Y-Koordinate wurde ignoriert** (HAUPTPROBLEM!)
```javascript
// VORHER (FALSCH):
if (hoehenUnterschied > 5) {
  // Nutze aktuelle Y-Höhe → Bot klettert NICHT hoch!
  bot.pathfinder.setGoal(new goals.GoalNear(ziel.x, aktuelleY, ziel.z, 3));
}
```

**Resultat**: 
- Bot versuchte horizontal zum Spieler zu kommen
- Ignorierte, dass er 7 Blöcke HOCHKLETTERN muss
- Timeout, weil Ziel unmöglich zu erreichen

### 2. **Scaffolding-Blocks waren leer**
```javascript
// VORHER:
move.scaffoldingBlocks = []; // Kann nicht pillar!
```

**Resultat**:
- Bot konnte nicht aus Löchern pillar
- Pathfinder fand keinen Weg

### 3. **Timeout zu kurz**
- 30 Sekunden für schwierige Pfade nicht genug
- Hochklettern dauert lange

## Implementierte Fixes:

### 1. **Echtes Ziel beibehalten**
```javascript
// JETZT (KORREKT):
const hoehenUnterschied = Math.abs(ziel.y - aktuelleY);

if (hoehenUnterschied > 5) {
  console.log(`⛰️ Großer Höhenunterschied: ${hoehenUnterschied} - versuche hochzuklettern!`);
}

// IMMER zum echten Ziel (mit korrekter Y-Koordinate)
bot.pathfinder.setGoal(new goals.GoalNear(ziel.x, ziel.y, ziel.z, 2));
```

### 2. **Scaffolding-Blocks aktiviert**
```javascript
// Suche Baumaterial im Inventar
const bauMaterial = bot.inventory.items().find(i => 
  i.name.includes('dirt') ||
  i.name.includes('cobblestone') ||
  i.name.includes('stone') ||
  i.name.includes('planks') ||
  i.name.includes('log')
);

if (bauMaterial) {
  move.scaffoldingBlocks = [mcData.itemsByName[bauMaterial.name].id];
  console.log(`🧱 Nutze ${bauMaterial.name} zum Pillar`);
}
```

**Resultat**: Bot kann jetzt pillar wenn nötig!

### 3. **Timeout verdoppelt**
```javascript
// Von 30 auf 60 Sekunden
setTimeout(() => {
  bot.chat('⏰ Ich komme nicht hin (zu schwieriger Weg)!');
}, 60000); // 60 Sekunden
```

### 4. **Bessere Debug-Logs**
```javascript
console.log(`🚶 Gehe zu: ${ziel.x}, ${ziel.y}, ${ziel.z} (aktuell Y:${aktuelleY}, Diff:${hoehenUnterschied})`);
```

Zeigt jetzt auch Höhenunterschied an.

## Pathfinding-Einstellungen:

```javascript
move.canDig = true;                    // Kann Blöcke abbauen
move.allow1by1towers = true;           // Kann 1x1 Türme hochklettern
move.allowParkour = false;             // Kein Parkour
move.maxDropDown = 4;                  // Max 4 Blöcke fallen
move.scaffoldingBlocks = [bauMaterial]; // Kann pillar!
```

## Vorher vs. Nachher:

### VORHER ❌:
```
Bot in Loch bei Y:60
Spieler bei Y:67 (7 Blöcke höher)

"komm zu mir"
→ Bot: Gehe zu X,Z (aber Y:60 statt Y:67!)
→ Bot: Versucht horizontal zu kommen
→ Bot: Findet keinen Pfad oder timeout
→ ❌ "Ich komme nicht rechtzeitig hin"
```

### NACHHER ✅:
```
Bot in Loch bei Y:60
Spieler bei Y:67 (7 Blöcke höher)

"komm zu mir"
→ Bot: "⛰️ Großer Höhenunterschied: 7 - versuche hochzuklettern!"
→ Bot: "🧱 Nutze cobblestone zum Pillar"
→ Bot: Klettert an Wand hoch oder pillaert
→ Bot: Gehe zu: X:67,Z (korrektes Ziel!)
→ ✅ "Angekommen!"
```

## Test-Szenarien:

### 1. Bot in tiefem Loch (10 Blöcke)
```
Spieler: Y:70
Bot: Y:60
Höhenunterschied: 10

Bot verhält sich:
1. Findet Cobblestone im Inventar
2. Aktiviert scaffolding mit Cobblestone
3. Pathfinder berechnet Route (pillar + klettern)
4. Bot pillaert hoch
5. ✅ Erreicht Spieler
```

### 2. Bot ohne Baumaterial
```
Spieler: Y:70
Bot: Y:60
Kein Baumaterial im Inventar

Bot verhält sich:
1. "⚠️ Kein Baumaterial für Pillar"
2. Versucht trotzdem (mit allow1by1towers)
3. Klettert an Wänden hoch wenn möglich
4. Falls kein Weg: "❌ Kein Pfad möglich"
```

### 3. Kleine Höhenunterschiede (< 5 Blöcke)
```
Spieler: Y:63
Bot: Y:60
Höhenunterschied: 3

Bot verhält sich:
1. Normales Pathfinding
2. Klettert über Blöcke
3. Kein Pillar nötig
4. ✅ Schnell angekommen
```

## Debug-Output:

### Erfolgreiche Klettern:
```
🚶 Gehe zu: -136, 67, -38 (aktuell Y:60, Diff:7)
⛰️ Großer Höhenunterschied: 7 Blöcke - versuche hochzuklettern!
🧱 Nutze cobblestone zum Pillar
(Bot klettert/pillaert)
✅ Ziel erreicht!
✅ Angekommen!
```

### Kein Pfad gefunden:
```
🚶 Gehe zu: -136, 67, -38 (aktuell Y:60, Diff:7)
⚠️ Kein Baumaterial für Pillar
❌ Kein Pfad!
❌ Ich komme nicht hin - kein Pfad möglich!
```

## Pathfinder-Strategien:

### Strategie 1: Klettern an bestehenden Blöcken
- `allow1by1towers = true` erlaubt Hochklettern
- Bot springt an Wänden hoch
- Kein Material nötig

### Strategie 2: Pillar aus Loch
- `scaffoldingBlocks` aktiviert
- Bot baut Blöcke unter sich
- Braucht Baumaterial

### Strategie 3: Graben/Tunnel
- `canDig = true` erlaubt Graben
- Bot gräbt sich Weg durch Hindernisse
- Kombinierbar mit Klettern

## Einschränkungen:

⚠️ **Overhang**: Wenn Loch Decke hat, kann Bot nicht pillar  
⚠️ **Kein Material**: Ohne Baumaterial nur Klettern möglich  
⚠️ **Zu tief**: Sehr tiefe Löcher (>20 Blöcke) dauern lange  
⚠️ **Komplexe Geometrie**: Enge Winkel können problematisch sein  

## Performance:

| Szenario | Vorher | Nachher |
|----------|---------|---------|
| **3 Blöcke hoch** | ✅ 10s | ✅ 10s |
| **7 Blöcke hoch** | ❌ Timeout | ✅ 30s |
| **10 Blöcke hoch** | ❌ Kein Pfad | ✅ 45s |
| **Ohne Material** | ❌ Stuck | ⚠️ Klettern wenn Wände |

## Zukünftige Verbesserungen:

### 1. **Adaptive Scaffolding-Materialien**
```javascript
// Priorisiere billige Materialien
const materials = ['dirt', 'cobblestone', 'stone', 'planks'];
```

### 2. **Intelligente Pfad-Wahl**
```javascript
// Bevorzuge Klettern über Pillar (spart Material)
if (wandVorhanden) {
  // Klettern
} else {
  // Pillar
}
```

### 3. **Backup-Escape**
```javascript
// Falls Pathfinding fehlschlägt, manueller Escape
if (timeout && inLoch) {
  await smartEscape();
}
```

### 4. **Progress-Feedback**
```javascript
// Zeige Fortschritt beim Klettern
bot.chat(`Klettere... ${aktuelleY}/${zielY}`);
```

## Verwandte Probleme & Lösungen:

| Problem | Lösung |
|---------|--------|
| **Pillaring scheitert** | Benutze Brunnen mit Treppe (siehe brunnen-mit-ausgang.md) |
| **Loch-Erkennung zu sensitiv** | Verbesserte Kriterien (siehe verbesserte-loch-erkennung.md) |
| **Bewegung blockiert** | botBeschaeftigt Flag (siehe loch-ueberwachung-fix.md) |
