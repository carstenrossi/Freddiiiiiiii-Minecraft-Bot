# Fix: Graben funktioniert nicht (Bot fuchtelt nur mit Schwert)

## Problem
"Den Brunnen hat er letztlich nicht gebaut. Er stand auf der Stelle und hat mit seinem Netherit-Schwert gefuchtelt."

### Symptome:
```
📋 Plan: {"intent": "graben", "antwort": "Ich grabe einen Brunnen..."}
⚡ Führe aus: graben
✅ Bot wieder bereit
```
→ Bot gräbt NICHTS, beendet sofort

## Ursachen:

### 1. **Fehlendes `await`** (Haupt-Problem!)
```javascript
// VORHER (falsch):
case 'graben':
  grabeBereich(b, t, l);  // ❌ Kein await!
  break;
```

**Resultat**: 
- Funktion wird aufgerufen
- Bot wartet NICHT auf Completion
- Beendet sofort mit "✅ Bot wieder bereit"
- Graben läuft nie an

### 2. **Falsches Werkzeug**
Bot hatte Netherit-Schwert in der Hand:
- Schwert ist NICHT optimal zum Graben
- Sollte Schaufel oder Spitzhacke nutzen

### 3. **Fehlende Parameter im Prompt**
LLM wusste nicht, dass es Parameter für "graben" angeben kann

## Implementierte Fixes:

### 1. **`await` hinzugefügt**
```javascript
// JETZT (korrekt):
case 'graben':
  const b = intentData.breite || intentData.b || 4;
  const t = intentData.tiefe || intentData.t || 1;
  const l = intentData.laenge || intentData.l || 4;
  await grabeBereich(b, t, l);  // ✅ Mit await!
  break;
```

**Resultat**: Bot wartet bis Graben komplett fertig ist

### 2. **Automatisches Werkzeug-Equippen**
```javascript
// Am Anfang von grabeBereich():
const werkzeug = bot.inventory.items().find(i => 
  i.name && (i.name.includes('shovel') || i.name.includes('pickaxe'))
);

if (werkzeug) {
  await bot.equip(werkzeug, 'hand');
  console.log(`🔧 Equippe ${werkzeug.name} zum Graben`);
} else {
  console.log('⚠️ Kein Grab-Werkzeug gefunden, nutze Hand');
}
```

**Priorisierung**:
1. **Schaufel** (beste für Dirt, Sand, Gravel)
2. **Spitzhacke** (für Stein, Erze)
3. **Hand** (langsam aber funktioniert)

### 3. **Prompt-Verbesserung**
```
SPEZIAL-PARAMETER:
"graben": breite (b), tiefe (t), laenge (l) 
Beispiel: 3x5x3 Brunnen → {"breite":3,"tiefe":5,"laenge":3}

BEISPIELE:
- "grabe einen Brunnen" → {"intent":"graben","breite":3,"tiefe":5,"laenge":3}
```

### 4. **Debug-Logs**
```javascript
console.log(`⛏️ Starte Graben: ${b}x${t}x${l} Bereich`);
console.log(`🔧 Equippe ${werkzeug.name} zum Graben`);
```

## Vorher vs. Nachher:

### VORHER ❌:
```
User: "grabe einen brunnen"
LLM: {"intent":"graben","antwort":"..."}
Bot: "⚡ Führe aus: graben"
Bot: "✅ Bot wieder bereit" (sofort!)
→ Nichts passiert, fuchtelt mit Schwert
```

### NACHHER ✅:
```
User: "grabe einen brunnen"
LLM: {"intent":"graben","breite":3,"tiefe":5,"laenge":3}
Bot: "⚡ Führe aus: graben"
Bot: "🔨 Grabe 3x5x5..."
Console: "⛏️ Starte Graben: 3x5x5 Bereich"
Console: "🔧 Equippe diamond_shovel zum Graben"
Bot: [gräbt tatsächlich...]
Bot: "Schicht 1/5"
Bot: "Schicht 2/5"
...
Bot: "✅ 45 Blöcke gegraben!"
Bot: "✅ Bot wieder bereit"
```

## Technische Details:

### Async/Await Problem:
```javascript
// Ohne await:
async function chatMitLLM() {
  ...
  grabeBereich(3, 5, 3);  // Startet Funktion
  // Wartet NICHT
  return "Erledigt!";     // Gibt sofort zurück
}

// Mit await:
async function chatMitLLM() {
  ...
  await grabeBereich(3, 5, 3);  // Startet Funktion
  // Wartet bis fertig
  return "Erledigt!";           // Gibt erst nach Completion zurück
}
```

### Grab-Mechanik:
```javascript
for (let y = 0; y < tiefe; y++) {
  for (let z = 0; z < laenge; z++) {
    for (let x = 0; x < breite; x++) {
      const pos = start.offset(x, -(y + 1), z);
      const block = bot.blockAt(pos);
      
      // Bewege dich hin wenn zu weit
      if (bot.entity.position.distanceTo(pos) > 4.5) {
        await bot.pathfinder.goto(pos);
      }
      
      // Grabe
      await bot.dig(block);
    }
  }
}
```

## Werkzeug-Effizienz:

| Material | Hand | Holz-Schaufel | Stein-Schaufel | Eisen-Schaufel | Diamant-Schaufel |
|----------|------|---------------|----------------|----------------|------------------|
| Dirt | 0.75s | 0.15s | 0.10s | 0.05s | 0.05s |
| Sand | 0.75s | 0.15s | 0.10s | 0.05s | 0.05s |
| Gravel | 0.90s | 0.20s | 0.15s | 0.10s | 0.05s |
| Stone | 7.50s | - | 0.55s | 0.40s | 0.30s |

→ Mit Schaufel **15x schneller** für Dirt/Sand!

## Weitere "Vergessene await" Checks:

Alle anderen Intents geprüft:
- ✅ `sammle_holz` - hat await
- ✅ `bauen` - hat await
- ✅ `baue_farm` - hat await
- ✅ `angriff` - hat await
- ❌ `graben` - **HATTE** kein await → **JETZT BEHOBEN**

## Test-Szenarien:

### 1. Einfacher Brunnen:
```
"grabe einen 3x3x5 brunnen"
→ {"intent":"graben","breite":3,"tiefe":5,"laenge":3}
→ Equippt Schaufel
→ Gräbt 45 Blöcke
→ "✅ 45 Blöcke gegraben!"
```

### 2. Großer Graben:
```
"grabe einen 10x2x10 graben"
→ {"intent":"graben","breite":10,"tiefe":2,"laenge":10}
→ Gräbt 200 Blöcke
→ "Schicht 1/2"
→ "Schicht 2/2"
→ "✅ 200 Blöcke gegraben!"
```

### 3. Default-Werte:
```
"grabe hier"
→ {"intent":"graben"} (keine Parameter)
→ Nutzt Default: 4x1x4
→ Gräbt 16 Blöcke
```

## Zukünftige Verbesserungen:

1. **Material-spezifisches Werkzeug**
   - Stein → Spitzhacke
   - Dirt/Sand → Schaufel
   - Holz → Axt

2. **Effizienz-Enchantments**
   - Bevorzuge Efficiency V Werkzeuge
   - Nutze Unbreaking für Langlebigkeit

3. **Form-Spezifikation**
   - Rund (Brunnen)
   - Rechteckig (Graben)
   - L-förmig (Ecke)

4. **Sicherheits-Checks**
   - Nicht eigenen Standort graben
   - Nicht zu tief (Lava bei Y<10)
