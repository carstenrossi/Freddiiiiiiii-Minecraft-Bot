# Verbesserte Umgebungs-Wahrnehmung für Freddiiiiii

## Problem: "Lama direkt hinter ihm und er sieht es nicht"

### Gelöst durch:

#### 1. **Richtungs-basierte Entity-Erkennung**
Freddiiiiii weiß jetzt WO Tiere und Monster relativ zu ihm sind:
- **vor mir**: -45° bis +45°
- **rechts**: +45° bis +135°
- **hinter mir**: +135° bis -135°
- **links**: -135° bis -45°

#### 2. **Erweiterter Scan-Output**
```
Vorher: "🐄 2 Tiere"
Jetzt:  "🐄 Tiere: llama (hinter mir), cow (rechts)"
```

#### 3. **Neuer "Umdrehen" Intent**
```
"dreh dich um"
"schau nach hinten"
"was ist hinter mir"
```

Bot-Reaktion:
1. Dreht sich um (180°)
2. Scannt erneut
3. Sagt was er jetzt sieht: "👀 Oh! Da ist ein llama!"

#### 4. **Richtungs-Befehle**
- `{"intent":"schaue","richtung":"umdrehen"}` - 180° Drehung
- `{"intent":"schaue","richtung":"rechts"}` - 90° rechts
- `{"intent":"schaue","richtung":"links"}` - 90° links
- `{"intent":"schaue","richtung":"oben"}` - Nach oben
- `{"intent":"schaue","richtung":"unten"}` - Nach unten

## Code-Details:

### Entity-Richtungsberechnung:
```javascript
const dx = entity.position.x - pos.x;
const dz = entity.position.z - pos.z;
const winkel = Math.atan2(dz, dx) * (180 / Math.PI);
const botYaw = bot.entity.yaw * (180 / Math.PI);
let relativWinkel = winkel - botYaw;
```

### Scan-Objekt erweitert:
```javascript
scan.tiere.push({ 
  typ: entity.name, 
  distanz: Math.floor(pos.distanceTo(entity.position)),
  richtung: richtung,  // NEU!
  position: { x, y, z }
});
```

## Test-Szenarien:

1. **Lama hinter Bot**
   - "scan" → zeigt "llama (hinter mir)"
   - "dreh dich um" → Bot dreht sich und sieht Lama

2. **Monster-Warnung**
   - "scan" → "⚠️ Monster: creeper (links), zombie (hinter mir)"
   - Bot weiß aus welcher Richtung Gefahr droht

3. **360° Awareness**
   - Bot kann jetzt in alle Richtungen "sehen"
   - Keine blinden Flecken mehr

## Minecraft-Realismus:
- Entspricht dem Spieler-Verhalten
- Man muss sich umdrehen um zu sehen was hinten ist
- Erhöht Immersion und Spielspaß
