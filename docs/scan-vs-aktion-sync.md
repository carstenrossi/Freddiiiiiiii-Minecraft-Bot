# Scan vs. Aktion - Synchronisation

## Problem
"Scan und Aktion stimmen nicht immer überein. Er scannt ein Pferd, sagt aber, er sieht keines, wenn ich sage er soll hingehen."

### Symptome:
```
Scan zeigt:
- Entity: horse (animal)
- Mob/Tier gefunden: horse, Type: animal

User: "geh zum pferd"

Bot:
- "Kein pferd in Sicht!"
```

## Root Causes:

### 1. **Unterschiedliche Entity-Filter**

**Scan** (`scanneUmgebung`):
```javascript
for (const entity of entities) {
  if (entity.type === 'mob' || entity.type === 'animal' || ...) {
    scan.tiere.push({ typ: entity.name });
  }
}
```
→ Zeigt ALLE Tiere

**gehe_entity**:
```javascript
const entities = Object.values(bot.entities).filter(e => {
  const name = (e.name || e.displayName || e.type).toLowerCase();
  return name.includes(entityTyp.toLowerCase());
});
```
→ Filtert nach NAME

### Problem:
- Scan passiert zu einem Zeitpunkt (t=0)
- LLM sieht Entity im Scan
- Aktion passiert später (t=1)
- Entity könnte weg sein oder Name-Matching schlägt fehl

### 2. **Case-Sensitivity oder Partial Match**

User sagt: "pferd" (deutsch)  
Entity name: "horse" (englisch)  
Match: "pferd".includes("horse") → FALSE!

### 3. **Timing zwischen Scan und Aktion**

```
t=0: Scan → Horse vorhanden
t=1: LLM plant → "Gehe zum Pferd"
t=2: Execute → Horse ist despawnt oder weggelaufen
```

## Implementierte Fixes:

### 1. **Debug-Logs für Entity-Suche**
```javascript
console.log(`🔍 Suche nach Entity-Typ: ${entityTyp}`);

for (const e of entities) {
  console.log(`  - Entity: name='${e.name}', displayName='${e.displayName}', type='${e.type}' → match: ${matches}`);
}

console.log(`📊 Gefundene ${entityTyp}: ${entities.length}`);
```

**Zeigt genau**:
- Was gesucht wird
- Welche Entities gefunden wurden
- Ob Match erfolgreich war

### 2. **Verfügbare Entities anzeigen**
```javascript
if (entities.length === 0) {
  const alleEntities = Object.values(bot.entities)
    .filter(e => e.type !== 'player' && ...)
    .map(e => `${e.name}(${e.type})`)
    .join(', ');
  
  console.log(`ℹ️ Verfügbare Entities in 32m: ${alleEntities}`);
  bot.chat(`❌ Kein ${entityTyp}! Verfügbar: ${alleEntities.substring(0, 50)}`);
}
```

**Hilft dem User**:
- Sieht welche Entities tatsächlich da sind
- Kann korrekten Namen verwenden

### 3. **Fehler-Unterdrückung**
```javascript
return 'Fehler_unterdrücke_antwort';
```

Verhindert widersprüchliche LLM-Antworten.

## Debug-Output Beispiele:

### Erfolgreicher Match:
```
🔍 Suche nach Entity-Typ: horse
  - Entity: name='horse', displayName='Horse', type='animal' → match: true
📊 Gefundene horse: 1
Gehe zu Horse (12m entfernt)!
```

### Fehlgeschlagener Match (Name-Problem):
```
🔍 Suche nach Entity-Typ: pferd
  - Entity: name='horse', displayName='Horse', type='animal' → match: false
📊 Gefundene pferd: 0
ℹ️ Verfügbare Entities in 32m: horse(animal), cow(animal)
❌ Kein pferd in Reichweite! Verfügbar: horse(animal), cow(animal)
```

### Entity nicht mehr da:
```
Scan (t=0): horse vorhanden
...
gehe_entity (t=2): 
  🔍 Suche nach Entity-Typ: horse
  📊 Gefundene horse: 0
  ℹ️ Verfügbare Entities in 32m: cow(animal)
  ❌ Kein horse in Reichweite! Verfügbar: cow(animal)
```

## Lösungsansätze:

### Kurzfristig (Implementiert):
✅ Debug-Logs zeigen genau was passiert  
✅ User sieht verfügbare Entities  
✅ Kann richtigen Namen verwenden  

### Mittelfristig (TODO):

#### 1. **Deutsch-Englisch-Mapping**
```javascript
const nameMapping = {
  'pferd': 'horse',
  'kuh': 'cow',
  'schaf': 'sheep',
  'schwein': 'pig',
  'huhn': 'chicken'
};

const entityTyp = nameMapping[userInput] || userInput;
```

#### 2. **Fuzzy-Matching**
```javascript
// Akzeptiere auch ähnliche Namen
function fuzzyMatch(search, target) {
  return target.includes(search) || 
         search.includes(target) ||
         levenshtein(search, target) < 3;
}
```

#### 3. **Entity-ID-Tracking**
```javascript
// Im Scan: Speichere Entity-IDs
scan.tiere = entities.map(e => ({
  name: e.name,
  id: e.id,
  position: e.position
}));

// In Aktion: Nutze ID statt Name
const entity = bot.entities[savedId];
```

### Langfristig (Konzept):

#### 1. **Persistent Entity-State**
```javascript
// Halte Track von Entities über Zeit
const entityCache = new Map();

entityCache.set(entity.id, {
  name: entity.name,
  type: entity.type,
  lastSeen: Date.now(),
  lastPosition: entity.position
});
```

#### 2. **LLM nutzt Entity-IDs**
```javascript
// LLM-Antwort:
{
  "intent": "gehe_entity",
  "entity_id": 1234, // Statt Name
  "typ": "horse"
}

// Funktion:
const entity = bot.entities[intentData.entity_id];
```

## Workarounds für User:

### 1. **Englische Namen verwenden**
```
❌ "geh zum pferd"
✅ "geh zum horse"
```

### 2. **Auf Fehlermeldung reagieren**
```
Bot: "Kein pferd! Verfügbar: horse(animal)"
User: "geh zum horse"
```

### 3. **Scan-Info nutzen**
```
User: "scan"
Bot: "Tiere: horse (vor mir), cow (rechts)"
User: "geh zum horse"
```

## Verwandte Probleme:

| Problem | Lösung |
|---------|--------|
| **LLM-Antwort vs Realität** | Status-Codes + Unterdrückung (siehe llm-antwort-vs-realitaet.md) |
| **Entity-Wahrnehmung** | 360° Richtungs-Erkennung (siehe umgebungs-wahrnehmung.md) |
| **Entity-Typ-Filter** | Erweiterte Types: animal, hostile, passive (siehe entity-debugging.md) |

## Test-Szenarien:

### 1. Horse vorhanden, deutsch gesucht:
```
Entity: horse (animal)
User: "geh zum pferd"
→ ❌ Nicht gefunden
→ Bot: "Kein pferd! Verfügbar: horse(animal)"
→ User kann korrigieren: "geh zum horse"
```

### 2. Horse vorhanden, englisch gesucht:
```
Entity: horse (animal)
User: "geh zum horse"
→ ✅ Gefunden!
→ Bot: "Gehe zu Horse (15m)!"
```

### 3. Entity despawnt:
```
Scan: horse vorhanden
...5 Sekunden später...
User: "geh zum horse"
→ Horse despawnt
→ ❌ Nicht gefunden
→ Bot: "Kein horse! Verfügbar: cow(animal)"
```

## Metriken:

| Szenario | Vorher | Mit Debug |
|----------|---------|-----------|
| **Match erfolgreich** | ✅ | ✅ + Debug-Info |
| **Name falsch** | ❌ Keine Info | ✅ Zeigt verfügbare |
| **Entity weg** | ❌ Verwirrend | ✅ Klare Meldung |

## Code-Änderungen Summary:

```javascript
// Vorher:
if (entities.length === 0) {
  bot.chat(`Kein ${entityTyp} in Sicht!`);
}

// Nachher:
if (entities.length === 0) {
  const alleEntities = [...].map(...).join(', ');
  console.log(`ℹ️ Verfügbare: ${alleEntities}`);
  bot.chat(`❌ Kein ${entityTyp}! Verfügbar: ${alleEntities}`);
  return 'Fehler_unterdrücke_antwort';
}
```
