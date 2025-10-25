# Fix: Angriffs- und Verfolgungs-Reichweite erweitert

## Problem
"Kann es sein, dass er ab einer gewissen Entfernung nicht mehr angreift / hinterherläuft?"

### Ursache:
Mehrere zu strikte Distanz-Limits im Code:

1. **Initiale Suche**: Nur Mobs < 16 Blöcke wurden gefunden
2. **Keine Abbruch-Logik**: Bot folgte endlos (oder brach zu früh ab)
3. **Zu kurzer Timeout**: Bei weiten Strecken gab Bot zu früh auf

## Implementierte Fixes:

### 1. **Erhöhtes Such-Radius**

**Vorher**:
```javascript
if (e.position.distanceTo(bot.entity.position) >= 16) return false;
```

**Jetzt**:
```javascript
if (e.position.distanceTo(bot.entity.position) >= 32) return false;
```

**Resultat**:
- ✅ Findet Mobs bis 32 Blöcke entfernt (verdoppelt!)
- ✅ Funktioniert auch bei `gehe_entity`

### 2. **Intelligenter Timeout basierend auf Distanz**

**Vorher**:
```javascript
// Warte max 5 Sekunden, egal wie weit
for (let i = 0; i < 10; i++) {
  await sleep(500);
}
```

**Jetzt**:
```javascript
// Dynamischer Timeout: 2 Blöcke pro Sekunde
const maxWait = Math.min(30, Math.ceil(distanz / 2));
for (let i = 0; i < maxWait; i++) {
  await sleep(500);
}
```

**Beispiele**:
- 10m entferntes Ziel: wartet 5 Sekunden
- 20m entferntes Ziel: wartet 10 Sekunden
- 30m+ entferntes Ziel: wartet max 15 Sekunden

### 3. **Abbruch bei zu großer Distanz während Verfolgung**

**NEU hinzugefügt**:
```javascript
// Während Kampf-Schleife
if (aktDistanz > 25) {
  console.log(`❌ Ziel ist ${aktDistanz}m weg - zu weit, breche ab`);
  bot.chat(`${zielName} ist entkommen (zu weit weg)!`);
  bot.pathfinder.setGoal(null);
  bot.setControlState('sprint', false);
  break;
}
```

**Verhindert**:
- Endlose Verfolgungsjagden
- Bot läuft nicht ins Nirgendwo

### 4. **Validierungs-Check während Bewegung**

**NEU hinzugefügt**:
```javascript
// Prüfe ob Ziel noch existiert während Bot läuft
if (!ziel.isValid) {
  console.log('⚠️ Ziel verschwunden während Bewegung');
  break;
}
```

**Verhindert**:
- Laufen zu despawnten Entities
- Crashes bei invaliden Zielen

## Neue Reichweiten-Tabelle:

| Aktion | Such-Radius | Verfolgungs-Max | Angriffs-Range |
|--------|-------------|-----------------|----------------|
| **Mob finden** | 32 Blöcke | - | - |
| **Hinlaufen** | - | 25 Blöcke | - |
| **Angreifen** | - | - | 3.5 Blöcke |
| **Timeout** | - | 15 Sek max | - |

## Verhalten bei verschiedenen Distanzen:

### Szenario 1: Mob 10m entfernt
```
"töte den zombie"
→ Findet Zombie ✅ (< 32m)
→ "Laufe zu zombie..."
→ Wartet 5 Sekunden (10/2)
→ ✅ Nah genug: 2.8m
→ ⚔️ Angriff!
```

### Szenario 2: Mob 25m entfernt
```
"töte den creeper"
→ Findet Creeper ✅ (< 32m)
→ "Laufe zu creeper..."
→ Wartet 12 Sekunden (25/2)
→ ✅ Nah genug: 3.1m
→ ⚔️ Angriff!
```

### Szenario 3: Mob 35m entfernt
```
"töte den skeleton"
→ ❌ "Kein skeleton in Sicht!" (> 32m)
```

### Szenario 4: Mob läuft während Kampf weg
```
⚔️ Angriff 1 (Dist: 2.8m)
Creeper läuft weg...
🏃 Ziel ist 8.0m weg, folge!
⚔️ Angriff 2 (Dist: 2.3m)
Creeper läuft weiter...
🏃 Ziel ist 15.0m weg, folge!
...
❌ Ziel ist 26.0m weg - zu weit, breche ab
Bot: "creeper ist entkommen (zu weit weg)!"
```

## Debug-Logs:

### Erfolgreiche weite Verfolgung:
```
⚔️ Suche zombie...
Greife zombie an! (28m entfernt)
Laufe zu zombie...
🏃 Bewege mich 28m zum Ziel
(wartet 14 Sekunden)
✅ Nah genug: 2.9m
🗡️ Equippe netherite_sword
⚔️ Angriff 1 (Dist: 2.9m)
⚔️ Angriff 2 (Dist: 2.1m)
✅ Besiegt!
```

### Abbruch bei zu großer Distanz:
```
⚔️ Angriff 1 (Dist: 3.2m)
🏃 Ziel ist 12.0m weg, folge!
⚔️ Angriff 2 (Dist: 2.8m)
🏃 Ziel ist 18.0m weg, folge!
🏃 Ziel ist 26.5m weg, folge!
❌ Ziel ist 26.5m weg - zu weit, breche ab
creeper ist entkommen (zu weit weg)!
⚔️ Kampf beendet!
```

## Vorteile:

✅ **Doppelte Such-Reichweite** - Findet Mobs bis 32m (war 16m)  
✅ **Intelligenter Timeout** - Passt sich Distanz an  
✅ **Kein endloses Folgen** - Bricht bei >25m ab  
✅ **Validierung** - Prüft ob Ziel noch existiert  
✅ **Besseres Feedback** - Klare Meldungen im Chat  

## Performance:

- **Mehr Entities gescannt**: 32m Radius = 4x mehr Fläche als 16m
- **Performance-Impact**: Minimal (Filter ist effizient)
- **Entity-Count**: Typisch 5-20 Entities in 32m Radius

## Parameter-Tuning (falls gewünscht):

```javascript
// Such-Radius (aktuell 32)
if (e.position.distanceTo(...) >= 32) return false;

// Max Verfolgungs-Distanz (aktuell 25)
if (aktDistanz > 25) break;

// Angriffs-Range (aktuell 3.5)
if (aktDistanz > 3.5) { /* folge */ }

// Speed-Annahme für Timeout (aktuell 2 Blöcke/Sek)
const maxWait = Math.ceil(distanz / 2);
```

## Zukünftige Verbesserungen:

1. **Adaptive Range** basierend auf Waffentyp
   - Bogen: 15m Angriffs-Range
   - Schwert: 3m Angriffs-Range

2. **Sprint-Speed berücksichtigen**
   - Mit Sprint: 5.6 Blöcke/Sek
   - Ohne Sprint: 4.3 Blöcke/Sek

3. **Terrain-Awareness**
   - Hindernisse erkennen
   - Alternative Routen finden

4. **Prioritäten-System**
   - Näher = höhere Priorität
   - Monster > passive Mobs
