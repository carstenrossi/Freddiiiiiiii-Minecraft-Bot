# Feature: "Gehe zu Entity/Tier"

## Problem
"Geh zu + entity funktioniert nicht"

Befehle wie:
- "geh zum llama"
- "lauf zur kuh"
- "komm zum schaf"

...hatten keinen entsprechenden Intent.

## Lösung - Neuer Intent: `gehe_entity`

### Intent-Handler:
```javascript
case 'gehe_entity':
case 'gehe_tier':
case 'gehe_mob':
  const entityTyp = intentData.typ || intentData.entity || intentData.ziel;
  
  // Suche alle passenden Entities
  const entities = Object.values(bot.entities).filter(e => {
    if (e.type === 'player' || e === bot.entity) return false;
    if (!e.position || e.position.distanceTo(bot.entity.position) >= 64) return false;
    
    const name = (e.name || e.displayName || e.type || '').toLowerCase();
    return name.includes(entityTyp.toLowerCase());
  });
  
  // Gehe zum nächsten
  const naechste = entities.reduce((n, c) => 
    bot.entity.position.distanceTo(c.position) < 
    bot.entity.position.distanceTo(n.position) ? c : n
  );
  
  bot.chat(`Gehe zu ${naechsteName} (${dist}m entfernt)!`);
  geheZuPosition(naechste.position);
```

### Funktionsweise:

1. **Suche Entities** mit passendem Namen/Typ
2. **Finde nächstes** (shortest distance)
3. **Gehe hin** mit pathfinder

### Unterstützte Befehle:

| Befehl | LLM Intent | Resultat |
|--------|-----------|----------|
| "geh zum llama" | `{"intent":"gehe_entity","typ":"llama"}` | Läuft zum nächsten Llama |
| "lauf zur kuh" | `{"intent":"gehe_entity","typ":"cow"}` | Läuft zur nächsten Kuh |
| "komm zum schaf" | `{"intent":"gehe_entity","typ":"sheep"}` | Läuft zum nächsten Schaf |
| "geh zum zombie" | `{"intent":"gehe_entity","typ":"zombie"}` | Läuft zum nächsten Zombie |
| "lauf zum creeper" | `{"intent":"gehe_entity","typ":"creeper"}` | Läuft zum nächsten Creeper |

### Entity-Matching:

**Flexibel durch .includes()**:
- "llama" matched: `trader_llama`, `llama`
- "sheep" matched: `sheep`
- "cow" matched: `cow`, `mooshroom`
- "zombie" matched: `zombie`, `zombie_villager`

### Parameter-Varianten:

LLM kann verschiedene Feld-Namen nutzen:
```javascript
intentData.typ || intentData.entity || intentData.ziel
```

Akzeptiert:
- `{"typ":"llama"}`
- `{"entity":"cow"}`
- `{"ziel":"sheep"}`

### Such-Radius:

- **Maximum**: 64 Blöcke
- **Warum**: Balance zwischen "findet genug" und "Performance"

### Fehlerbehandlung:

```javascript
if (entities.length === 0) {
  bot.chat(`Kein ${entityTyp} in Sicht!`);
  break;
}
```

**User Feedback**:
- "Kein llama in Sicht!" wenn nichts gefunden
- "Gehe zu llama (15m entfernt)!" wenn gefunden

### Console-Output:

```
🚶 Gehe zu trader_llama bei -163, 66, 2
```

Zeigt exakte Position für Debugging.

### Vorhandene "Gehe zu" Intents:

Jetzt komplett:
- ✅ `gehe_wasser` - Zum nächsten Wasser
- ✅ `gehe_baum` - Zum nächsten Baum
- ✅ `gehe_berg` - Zum höchsten Punkt
- ✅ `gehe_entity` - **NEU!** Zu Entity/Tier/Mob
- ✅ `komm_spieler` - Zum Spieler
- ✅ `gehe_xy` - Zu Koordinaten

### Multi-Step Beispiele:

**Intelligent kombinierbar**:
```json
{
  "aktionen": [
    {"intent":"gehe_entity","typ":"llama"},
    {"intent":"angriff","typ":"llama"}
  ],
  "antwort":"Ich laufe zum Llama und greife es an!"
}
```

```json
{
  "aktionen": [
    {"intent":"gehe_entity","typ":"cow"},
    {"intent":"scan"}
  ],
  "antwort":"Ich gehe zur Kuh und schaue mir die Umgebung an!"
}
```

### Unterschied zu "angriff":

| Feature | gehe_entity | angriff |
|---------|-------------|---------|
| **Zweck** | Nur hinlaufen | Hinlaufen + Angreifen |
| **Verfolgung** | Nein, einmalig | Ja, kontinuierlich |
| **Weapon Equip** | Nein | Ja |
| **Use Case** | Friedlich beobachten | Kämpfen |

**Beispiel**:
- "geh zum llama" → läuft hin, NICHT angreifen
- "töte das llama" → läuft hin, greift an, verfolgt

### Vorteile:

✅ **Friedliche Interaktion** - Kann zu Tieren ohne Angriff  
✅ **Flexibel** - Funktioniert mit ALLEN Entity-Typen  
✅ **Intelligent** - Findet nächstes automatisch  
✅ **Multi-Step** - Kombinierbar mit anderen Aktionen  
✅ **User Feedback** - Klare Meldungen  

### Zukünftige Erweiterungen:

1. **Folgen statt einmaliges Gehen**
   ```javascript
   case 'folge_entity':
     bot.pathfinder.setGoal(new goals.GoalFollow(entity, 3));
   ```

2. **Interaktion nach Ankunft**
   ```javascript
   // z.B. automatisch reiten bei Pferden
   if (entity.name === 'horse') {
     await bot.mount(entity);
   }
   ```

3. **Mehrere Entities**
   ```javascript
   // Gehe zu ALLEN Schafen in der Nähe (Herde)
   case 'sammle_herde':
   ```

## Test:

```
"geh zum llama"
→ LLM: {"intent":"gehe_entity","typ":"llama"}
→ Bot: Sucht llamas in 64 Block Radius
→ Bot: "Gehe zu trader_llama (15m entfernt)!"
→ Bot: Läuft hin mit pathfinder
→ ✅ Angekommen!
```
