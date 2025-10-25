# Debug-Logs optimiert - Weniger Spam, mehr Klarheit

## Problem
Terminal war überflutet mit redundanten Entity-Logs:
```
Entity: horse (animal)
Mob/Tier gefunden: horse, Type: animal, DisplayName: Horse
🔍 Prüfe Entity: name='horse', displayName='Horse', type='animal'
Entity: salmon (water_creature)
...
(29 Entities × 3 Zeilen = 87 Zeilen Spam!)
```

## Lösung - Kompakte Zusammenfassungen:

### 1. **Scan-Logs reduziert**
```javascript
// VORHER (3 Zeilen pro Entity):
console.log(`Entity: horse (animal)`);
console.log(`Mob/Tier gefunden: horse, Type: animal, DisplayName: Horse`);
console.log(`🔍 Prüfe Entity: name='horse', displayName='Horse', type='animal'`);

// NACHHER (auskommentiert):
// console.log(...) // Nur bei echten Problemen aktivieren
```

### 2. **Kompakte Zusammenfassung am Ende**
```javascript
// Nach Scan:
📊 Scan: Tiere:[4xhorse, 1xsheep] Monster:[2xcreeper, 1xskeleton]
```

**Viel übersichtlicher!** Eine Zeile statt 87.

### 3. **Detaillierte Logs nur bei Aktionen**
```javascript
// Bei gehe_entity:
🔍 Suche nach Entity-Typ: horse
📦 Gesamt-Entities im bot.entities: 30
  ⏭️ Überspringe Spieler: Edgarrr
  🎯 Entity: name='horse', type='animal', dist=12.3m → match: true
  🎯 Entity: name='horse', type='animal', dist=15.7m → match: true
  📏 Entity zu weit: horse (45.2m)
📊 Gefundene horse: 2
```

**Zeigt genau**:
- Was gesucht wird
- Welche Entities matchen
- Welche zu weit sind
- Wie viele gefunden wurden

## Vorher vs. Nachher:

### VORHER ❌:
```
(87 Zeilen Entity-Details...)
🧠 Plane Aktionen...
(Nochmal 90 Zeilen Entity-Details...)
⚡ Führe aus: gehe_entity
📊 Gefundene horse: 0
```

**Problem**: Unmöglich zu debuggen, zu viel Rauschen!

### NACHHER ✅:
```
📊 Scan: Tiere:[4xhorse, 1xsheep] Monster:[2xcreeper, 1xskeleton]
🧠 Plane Aktionen...
📊 Scan: Tiere:[4xhorse, 1xsheep] Monster:[2xcreeper, 1xskeleton]
⚡ Führe aus: gehe_entity
🔍 Suche nach Entity-Typ: horse
📦 Gesamt-Entities im bot.entities: 30
  🎯 Entity: name='horse', type='animal', dist=12.3m → match: true
  🎯 Entity: name='horse', type='animal', dist=15.7m → match: true
  📏 Entity zu weit: horse (45.2m)
📊 Gefundene horse: 2
Gehe zu Horse (12m entfernt)!
```

**Viel klarer** was passiert!

## Debug-Level-System:

### Level 1: Kompakt (Standard)
```
📊 Scan: Tiere:[4xhorse] Monster:[2xcreeper]
```

### Level 2: Detail (bei Aktionen)
```
🔍 Suche nach: horse
  🎯 Entity: horse, dist=12m → match: true
📊 Gefundene: 2
```

### Level 3: Vollständig (auskommentiert, nur bei Bugs)
```javascript
// Aktiviere bei Bedarf:
console.log(`Entity: ${entity.name} (${entity.type})`);
console.log(`Mob/Tier gefunden: ${entity.name}`);
console.log(`🔍 Prüfe Entity: ...`);
```

## Neue Logs zeigen:

### Bei Scan (kompakt):
```
📊 Scan: Tiere:[4xhorse, 1xsheep, 20xsalmon] Monster:[2xcreeper, 1xskeleton]
```

### Bei gehe_entity (detailliert):
```
🔍 Suche nach Entity-Typ: horse
📦 Gesamt-Entities im bot.entities: 30
  ⏭️ Überspringe Spieler: Edgarrr
  ❌ Entity ohne Position: item_entity
  📏 Entity zu weit: cow (45.2m)
  🎯 Entity: name='horse', dist=12.3m → match: true ✅
  🎯 Entity: name='horse', dist=15.7m → match: true ✅
📊 Gefundene horse: 2
```

**Diagnose möglich**:
- Wenn "Gesamt-Entities: 0" → Problem mit bot.entities
- Wenn viele "zu weit" → Radius-Problem
- Wenn viele "ohne Position" → Timing-Problem
- Wenn keine matches → Name-Problem

## Zukünftige Verbesserungen:

### 1. **Log-Level-Parameter**
```javascript
const LOG_LEVEL = process.env.DEBUG || 'info';

if (LOG_LEVEL === 'debug') {
  console.log(`Entity: ${entity.name}`);
}
```

### 2. **Structured Logging**
```javascript
logger.info('scan_complete', {
  tiere: tierCount,
  monster: monsterCount,
  duration: scanTime
});
```

### 3. **Performance-Metrics**
```javascript
console.log(`⏱️ Scan: ${scanTime}ms | Entities: ${count} | Tiere: ${tierCount}`);
```

## Test:

Starte den Bot und teste:
```
"scan"
→ 📊 Scan: Tiere:[4xhorse, 1xsheep] Monster:[2xcreeper]
   (Nur 1 Zeile!)

"gehe zum horse"  
→ 🔍 Suche nach: horse
→ 📦 Gesamt-Entities: 30
→ 🎯 Entity: horse, dist=12m → match: true
→ 📊 Gefundene: 2
→ Gehe zu Horse!
```

**Jetzt können wir genau sehen wo die Entities verloren gehen!**
