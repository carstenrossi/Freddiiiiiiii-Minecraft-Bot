# LLM-Antwort vs. Realität - Synchronisation

## Problem
"Der Chat-Text passt nicht immer zur Wahrnehmung. Ich sage 'Greife den Zombie an', er stellt fest, dass es keinen in der Nähe gibt und sagt dann trotzdem, dass er ihn mit dem Netherit-Schwert angreift."

### Symptome:
```
User: "greife den zombie an"

LLM-Scan sieht:
- Zombie bei 50m Entfernung (außerhalb 32m Radius)

LLM-Antwort:
- "Ich greife den Zombie mit meinem Netherit-Schwert an!"

Tatsächliche Ausführung:
- ❌ "Kein zombie in der Nähe!"

User sieht:
- Bot sagt er greift an
- Bot sagt er findet keinen
- Widerspruch! 😕
```

## Root Cause:

### Timing-Problem:
```
1. Scan (t=0): Entities werden gecheckt
2. LLM-Antwort (t=1): Basierend auf Scan
3. Ausführung (t=2): Zombie ist weg oder zu weit
4. Chat-Ausgabe (t=3): Beide Nachrichten sichtbar
```

### LLM ist optimistisch:
- LLM sieht Entity im Scan (bei 47m)
- LLM denkt: "Ich kann ihn angreifen!"
- Antwort: "Ich greife an!"
- Realität: Entity ist außerhalb Reichweite (32m)

### Keine Feedback-Schleife:
```javascript
// VORHER:
const plan = LLM.plan(scan); // "Ich greife an!"
await execute(plan);          // "Kein Mob gefunden!"
return plan.antwort;          // "Ich greife an!" ❌
```

## Implementierte Lösung:

### 1. **Status-Codes von Funktionen**
```javascript
async function greifeMobAn(mobTyp) {
  const mobs = Object.values(bot.entities).filter(...);
  
  if (mobs.length === 0) {
    bot.chat(`❌ Kein ${mobTyp} in Reichweite (32m)!`);
    return 'nicht_gefunden'; // ← Status-Code!
  }
  
  // ... Angriff ausführen
  return 'erfolg'; // oder undefined
}
```

### 2. **Fehler-Erkennung im Caller**
```javascript
case 'angriff':
  const resultat = await greifeMobAn(...);
  
  if (resultat === 'nicht_gefunden') {
    return 'Fehler_unterdrücke_antwort'; // Signal nach oben
  }
  break;
```

### 3. **Antwort-Unterdrückung**
```javascript
const zusatz = await fuehreIntentAus(plan, username);

// Wenn Fehler, zeige NICHT die optimistische LLM-Antwort
if (zusatz === 'Fehler_unterdrücke_antwort') {
  return ''; // Leere Antwort
}
```

### 4. **Leere Antworten nicht chatten**
```javascript
const antwort = await chatMitLLM(username, message);

if (!antwort || antwort.trim() === '') {
  return; // Keine Chat-Ausgabe
}

bot.chat(antwort);
```

## Vorher vs. Nachher:

### VORHER ❌:
```
User: "greife den zombie an"

Bot (LLM): "Ich greife den Zombie mit meinem Netherit-Schwert an!"
Bot (Funktion): "❌ Kein zombie in Reichweite (32m)!"

User sieht BEIDE Nachrichten → Verwirrung
```

### NACHHER ✅:
```
User: "greife den zombie an"

Bot (Funktion): "❌ Kein zombie in Reichweite (32m)!"

User sieht NUR die Wahrheit
```

## Weitere Funktionen die Status-Codes zurückgeben sollten:

### Bereits implementiert:
- ✅ `greifeMobAn` → 'nicht_gefunden'

### TODO (zukünftig):
- `sammleHolz` → 'keine_baeume'
- `geheZuPosition` → 'kein_pfad'
- `baueStruktur` → 'kein_material'
- `crafteItem` → 'fehlende_zutaten'
- `esseNahrung` → 'kein_essen'

## Architektur-Muster:

### Status-Code-System:
```javascript
// Erfolgsstatus:
return undefined; // oder nichts returnen = Erfolg

// Fehlerstatus:
return 'nicht_gefunden';
return 'kein_material';
return 'timeout';
return 'kein_pfad';

// Spezial-Status für Caller:
return 'Fehler_unterdrücke_antwort';
```

### Fehler-Hierarchie:
```
1. Funktion erkennt Fehler
   ↓
2. Funktion sendet bot.chat() mit Fehler
   ↓
3. Funktion gibt Status-Code zurück
   ↓
4. fuehreIntentAus prüft Status
   ↓
5. Gibt 'Fehler_unterdrücke_antwort' zurück
   ↓
6. chatMitLLM unterdrückt LLM-Antwort
   ↓
7. Nur Fehler-Nachricht ist sichtbar
```

## Beispiele:

### Angriff ohne Ziel:
```
LLM-Scan: "zombie (47m, links)"
LLM-Plan: {"intent":"angriff","typ":"zombie","antwort":"Ich greife den Zombie an!"}
Execute: mobs.filter(e => dist < 32) → []
Status: 'nicht_gefunden'
Bot: "❌ Kein zombie in Reichweite (32m)!"
User sieht: Nur Fehler ✅
```

### Erfolgreiches Angreifen:
```
LLM-Scan: "zombie (20m, rechts)"
LLM-Plan: {"intent":"angriff","typ":"zombie","antwort":"Ich greife den Zombie an!"}
Execute: Findet Zombie, greift an
Status: undefined (Erfolg)
Bot: "Ich greife den Zombie an!" + "Greife zombie an!" + "⚔️ Angriff 1..."
User sieht: Bestätigung + Aktion ✅
```

## Vorteile:

✅ **Keine Widersprüche** - Bot sagt nur was wirklich passiert  
✅ **Besseres UX** - User sieht konsistente Nachrichten  
✅ **Debugging** - Klarer was schiefging  
✅ **Erweiterbar** - System kann auf alle Aktionen angewandt werden  

## Einschränkungen:

⚠️ **LLM-Antwort geht verloren** - Optimistische Antwort wird nie gezeigt  
⚠️ **Weniger "Persönlichkeit"** - Nur technische Fehlermeldung  
⚠️ **Keine Erklärung** - User weiß nicht was LLM dachte  

## Alternative Ansätze (nicht implementiert):

### 1. LLM-Antwort umschreiben:
```javascript
if (resultat === 'nicht_gefunden') {
  return `Ich wollte ${mobTyp} angreifen, aber finde keinen in Reichweite!`;
}
```

**Pro**: Persönlicher  
**Contra**: Komplexer, mehr Code

### 2. Zwei-Phasen-LLM:
```javascript
// Phase 1: Plane
const plan = LLM.plan(scan);

// Phase 2: Execute + Re-Plan
const result = execute(plan);
const finalAnswer = LLM.explain(plan, result);
```

**Pro**: LLM kann Fehler erklären  
**Contra**: Doppelte LLM-Calls, langsamer, teurer

### 3. Pessimistische Antworten:
```javascript
// LLM gibt vorsichtigere Antworten
"Ich versuche den Zombie anzugreifen..." (statt "Ich greife an!")
```

**Pro**: Einfach  
**Contra**: LLM-Prompt-Änderung nötig

## Test-Szenarien:

### 1. Entity außer Reichweite:
```
Scan: zombie 50m
Plan: Angriff
Execute: Nicht gefunden (32m limit)
Output: "❌ Kein zombie in Reichweite!"
✅ PASS
```

### 2. Entity verschwunden:
```
Scan: zombie 20m
Plan: Angriff
(Zombie despawnt)
Execute: Nicht gefunden
Output: "❌ Kein zombie in Reichweite!"
✅ PASS
```

### 3. Erfolgreich:
```
Scan: zombie 15m
Plan: Angriff
Execute: Erfolg
Output: "Ich greife den Zombie an!" + Kampf-Logs
✅ PASS
```

## Zukünftige Erweiterungen:

### 1. Strukturierte Fehler-Objekte:
```javascript
return {
  status: 'error',
  code: 'NOT_FOUND',
  message: 'Kein zombie in Reichweite',
  suggestedAction: 'Versuche näher zu kommen'
};
```

### 2. Retry-Logik:
```javascript
if (resultat === 'nicht_gefunden') {
  // Versuche zum Ziel zu laufen
  await geheZuEntity(mobTyp);
  return await greifeMobAn(mobTyp); // Retry
}
```

### 3. LLM-Feedback-Loop:
```javascript
const result = await execute(plan);
if (result.error) {
  const newPlan = await LLM.replan(plan, result.error);
  await execute(newPlan);
}
```
