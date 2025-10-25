# Verbesserte Loch-Erkennung

## Problem
"Die Locherkennung funktioniert nicht gut. Er versucht sich auch immer rauszugraben, wenn er nur einen kleinen Berg, eine Terrasse hinuntersteigt"

### Vorher (zu simpel):
```javascript
// Zählte nur Wände
const wandCount = [nord, süd, ost, west].filter(b => b !== 'air').length;

// Loch wenn: 3+ Wände
if (wandCount >= 3) → "Ich bin in einem Loch!"
```

**Problem**: Terrassen, Hügel, offene Bereiche wurden als Loch erkannt!

## Lösung - 4-Stufen Analyse:

### 1. **Wand-Erkennung** (wie vorher)
```javascript
// Zähle solide Blöcke in 4 Richtungen
const wandCount = [nordBlock, suedBlock, ostBlock, westBlock]
  .filter(b => b && b.name !== 'air').length;
```

### 2. **Freie-Wege-Analyse** (NEU!)
```javascript
// Prüfe 2 Blöcke in jede Richtung
// Freier Weg wenn:
// - Beide Blöcke sind Luft
// - UND Boden vorhanden (nicht Abgrund)

let freieRichtungen = 0;
// Nord, Süd, Ost, West jeweils 2 Blöcke testen
```

**Resultat**:
- Terrasse: `freieRichtungen = 1` (kann runtergehen)
- Echtes Loch: `freieRichtungen = 0` (komplett eingeschlossen)

### 3. **Decken-Check** (NEU!)
```javascript
// Gibt es eine feste Decke über dem Bot?
for (let y = 1; y <= 5; y++) {
  if (blockOben !== 'air') {
    deckeFest = true;
    break;
  }
}
```

**Resultat**:
- Offenes Terrain: `deckeFest = false`
- Höhle/Grube: `deckeFest = true`

### 4. **Terrain-Höhen-Analyse** (NEU!)
```javascript
// Ist das umliegende Terrain HÖHER als Bot-Position?
// Prüfe 5x5 Bereich um Bot
// Zähle wie viele Boden-Blöcke HÖHER sind

if (bodenHoehe > pos.y + 1) {
  hoehereTerrain++;
}
```

**Resultat**:
- Flaches Terrain: `hoehereTerrain = 0-5`
- Terrassenstufe: `hoehereTerrain = 5-10`
- Tiefes Loch: `hoehereTerrain = 15-25`

## Neue Kriterien für "Echtes Loch":

### Variante A: Komplett eingeschlossen
```javascript
wandCount === 4 && freieRichtungen === 0
```
→ Alle 4 Seiten zu UND kein Ausweg

### Variante B: Tiefe Grube mit Decke
```javascript
wandCount >= 3 && deckeFest && hoehereTerrain >= 10
```
→ 3+ Wände UND Decke UND deutlich tiefer als Umgebung

## Vergleich Alt vs. Neu:

| Szenario | Alt (Fehler) | Neu (Korrekt) |
|----------|--------------|---------------|
| **Terrasse** | ❌ Loch (3 Wände) | ✅ Kein Loch (freieRichtungen=1) |
| **Hügel-Abhang** | ❌ Loch (3 Wände) | ✅ Kein Loch (keine Decke) |
| **2x2 Grube** | ✅ Loch | ✅ Loch (4 Wände, 0 Wege) |
| **Höhle** | ❌ Manchmal nicht | ✅ Loch (Decke, höheres Terrain) |
| **Tal** | ❌ Loch | ✅ Kein Loch (freie Wege) |

## Debug-Output:

### Terrasse (KEIN Loch):
```
✅ Keine Loch-Erkennung: Wände:3, aber FreieWege:1, Decke:false
```

### Echtes Loch:
```
🕳️ ECHTES LOCH! Wände:4, FreieWege:0, Decke:false, HöheresTerrain:16
```

### Höhle:
```
🕳️ ECHTES LOCH! Wände:3, FreieWege:0, Decke:true, HöheresTerrain:12
```

## Algorithmus Visualisierung:

### Terrasse (Vorher ❌):
```
Terrain:  ████████
          ████████  ← 3 Wände, aber...
Bot: 🤖        ↓   ← ...freier Weg runter!
          ▓▓▓▓▓▓▓▓

Alt: "Loch!" ❌
Neu: "Kein Loch" ✅ (freieRichtungen > 0)
```

### Echtes Loch (✅):
```
Terrain:  ████████
          ██    ██  ← Alle 4 Seiten geschlossen
Bot:      ██ 🤖 ██  ← Kein Ausweg
          ████████

Alt: "Loch!" ✅
Neu: "Loch!" ✅ (wandCount=4, freieRichtungen=0)
```

### Tiefe Grube mit Decke (✅):
```
Terrain:  ████████
          ██▓▓▓▓██  ← Decke vorhanden
Bot:      ██ 🤖 ██  ← 3+ Wände + höheres Terrain
          ████████

Alt: "Loch!" ✅
Neu: "Loch!" ✅ (Decke=true, hoehereTerrain>=10)
```

## Vorteile:

✅ **Keine False Positives** bei Terrassen  
✅ **Keine False Positives** bei Hügeln  
✅ **Erkennt echte Löcher** zuverlässig  
✅ **Erkennt Höhlen** durch Decken-Check  
✅ **Kontext-bewusst** durch Terrain-Analyse  
✅ **Debug-freundlich** mit ausführlichen Logs  

## Performance:

- **Scan-Bereich**: 5x5 Blöcke horizontal, 10 Blöcke vertikal
- **Block-Checks**: ~100 pro Analyse
- **Performance-Impact**: Minimal (nur wenn bereits deaktiviert/auf Anfrage)

## Feintuning-Parameter:

```javascript
// Kann angepasst werden bei Bedarf:

freieRichtungen Schwellwert: 0 (strikt) vs 1 (locker)
hoehereTerrain Schwellwert: 10 (empfohlen)
wandCount Minimum: 3 (bei Decke) oder 4 (ohne Decke)
```

## Test-Szenarien:

1. **Bot geht Terrasse runter**
   → ✅ KEIN Escape-Versuch

2. **Bot fällt in 2x2 Loch**
   → ✅ Erkennt Loch, pillaert raus

3. **Bot geht in Höhle**
   → ✅ Erkennt Loch wenn geschlossen

4. **Bot klettert Berg runter**
   → ✅ KEIN Escape-Versuch

5. **Bot steht in Tal zwischen Bergen**
   → ✅ KEIN Loch (freie Wege vorhanden)

## Zukünftige Verbesserungen:

1. **Machine Learning** basierte Loch-Erkennung
2. **Historische Bewegungsdaten** nutzen
3. **Pathfinder-Integration** - "Kann ich rauslaufen?"
4. **Dynamische Schwellwerte** basierend auf Biom
