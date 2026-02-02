# Templates für Freddi's Bausystem

## 🏠 Quick Start

### 1. Template verwenden

Einfach im Spiel sagen:
```
"Freddi, bau mir ein Haus!"
```

Freddi wird:
1. Das Template laden (`japarabic-house-5.json`)
2. Eine geeignete Baufläche suchen
3. Materialien prüfen
4. Das Haus bauen (11x12x7 Blöcke)

### 2. Benötigte Materialien

Für das Beispiel-Haus:
- ~300x Sandstone
- ~80x Smooth Sandstone
- ~50x Jungle Planks

**Tipp**: Gib Freddi die Materialien mit:
```
/give Freddiiiiii sandstone 500
/give Freddiiiiii smooth_sandstone 100
/give Freddiiiiii jungle_planks 100
```

## 📋 Verfügbare Templates

### japarabic-house-5.json
- **Stil**: Japanisch-Arabischer Mix
- **Größe**: 11 (Breite) × 12 (Tiefe) × 7 (Höhe) Blöcke
- **Materialien**: Sandstone, Smooth Sandstone, Jungle Planks
- **Blöcke**: ~428
- **Bauzeit**: ~3-5 Minuten
- **Quelle**: Grabcraft

## 🎨 Eigenes Template erstellen

### Einfaches Beispiel

Erstelle `templates/kleines-haus.json`:

```json
{
  "id": "custom:kleines-haus",
  "title": "Kleines Haus",
  "version": 1,
  "dimensions": {
    "width": 5,
    "height": 3,
    "depth": 5,
    "origin": "southwest",
    "facing": "north",
    "y0_is_ground": true
  },
  "palette": {
    "W": { "name": "oak_planks" },
    "D": { "name": "oak_door", "state": {"half": "lower"} },
    "A": { "name": "air" }
  },
  "steps": [
    {
      "level": 1,
      "y": 0,
      "grid_shape": [5, 5],
      "rows": [
        ["W", "W", "W", "W", "W"],
        ["W", "A", "A", "A", "W"],
        ["W", "A", "A", "A", "W"],
        ["W", "A", "A", "A", "W"],
        ["W", "W", "D", "W", "W"]
      ]
    },
    {
      "level": 2,
      "y": 1,
      "grid_shape": [5, 5],
      "rows": [
        ["W", "A", "A", "A", "W"],
        ["W", "A", "A", "A", "W"],
        ["W", "A", "A", "A", "W"],
        ["W", "A", "A", "A", "W"],
        ["W", "A", "A", "A", "W"]
      ]
    },
    {
      "level": 3,
      "y": 2,
      "grid_shape": [5, 5],
      "rows": [
        ["W", "W", "W", "W", "W"],
        ["W", "W", "W", "W", "W"],
        ["W", "W", "W", "W", "W"],
        ["W", "W", "W", "W", "W"],
        ["W", "W", "W", "W", "W"]
      ]
    }
  ]
}
```

### Template-Regeln

1. **Dateiname**: Kleinbuchstaben, Bindestriche, `.json` Endung
2. **ID**: Eindeutig, Format: `quelle:name`
3. **Palette**: Kurze Codes (1-2 Zeichen) für Blöcke
4. **Luft**: Verwende "A" oder "C6" für Luftblöcke
5. **Reihenfolge**: Steps von unten (y=0) nach oben
6. **Grid**: Erste Dimension = Breite (X), Zweite = Tiefe (Z)

### Block-Namen

Verwende Minecraft-Block-IDs **ohne** `minecraft:` Prefix:

✅ Gut:
```json
{"name": "oak_planks"}
{"name": "stone_bricks"}
{"name": "sandstone"}
```

❌ Schlecht:
```json
{"name": "minecraft:oak_planks"}  // Funktioniert auch, aber nicht nötig
```

### Block-States

Für spezielle Block-Varianten:

```json
// Slab (halbe Stufe)
{"name": "sandstone_slab", "state": {"half": "bottom"}}

// Tür (untere Hälfte)
{"name": "oak_door", "state": {"half": "lower", "facing": "south"}}

// Treppe
{"name": "oak_stairs", "state": {"facing": "north", "half": "bottom"}}
```

## 🔍 Template testen

Prüfe ob Template gültig ist:

```javascript
// In Node.js REPL:
import TemplateLoader from './template-loader.js';
const loader = new TemplateLoader(bot);

// Template laden
const template = await loader.loadTemplate('kleines-haus');
console.log(template.title); // "Kleines Haus"

// Infos anzeigen
const info = await loader.getTemplateInfo('kleines-haus');
console.log(`Blöcke: ${info.blockCount}`);
```

## 📦 Templates aus Grabcraft

1. Gehe zu [grabcraft.com](https://www.grabcraft.com)
2. Suche ein Gebäude
3. Kopiere das JSON-Schema (falls verfügbar)
4. Speichere als `templates/name.json`
5. Passe Palette und Steps an

**Hinweis**: Grabcraft-Export ist oft sehr groß - für beste Performance:
- Wähle kleinere Builds (<500 Blöcke)
- Vereinfache komplexe Strukturen
- Entferne unnötige Deko-Blöcke

## 🚀 Fortgeschritten

### Template-Rotation

*(Noch nicht implementiert)*

Zukünftig kannst du Templates rotieren:
```json
{"intent": "baue_template", "template": "mein-haus", "rotation": 90}
```

### Mehrere Templates kombinieren

*(Geplant)*

Baue komplexe Strukturen aus mehreren Templates:
```json
{
  "aktionen": [
    {"intent": "baue_template", "template": "haus-1"},
    {"intent": "baue_template", "template": "haus-2", "offset": {"x": 20}}
  ]
}
```

### Custom Origin-Points

Ändere den Ursprungspunkt für spezielle Layouts:

```json
"dimensions": {
  "origin": "southwest",  // Standardmäßig
  // oder: "southeast", "northwest", "northeast"
  "facing": "north"       // Richtung des Gebäudes
}
```

## ❓ Troubleshooting

### "Template nicht gefunden"

- Prüfe Dateinamen (keine Leerzeichen, `.json` Endung)
- Template muss in `templates/` Ordner sein
- Verwende Template-Namen ohne `.json`

### "Keine Baufläche gefunden"

- Gehe zu flacherem Terrain
- Terrain muss einigermaßen eben sein (max 2 Blöcke Unterschied)
- Template darf nicht zu groß sein (max ~20x20)

### "Nicht genug Materialien"

- Prüfe Inventar mit `/give` Befehl
- Bot zeigt fehlende Materialien an
- Oder: Bot baut mit dem was er hat (unvollständig)

### "Platzieren fehlgeschlagen"

- Bot muss in der Nähe sein (< 64 Blöcke)
- Fundament muss fest sein (kein Sand/Kies)
- Kein Wasser/Lava im Weg

## 📖 Weitere Ressourcen

- **Vollständige Doku**: `../docs/template-bau-system.md`
- **API-Referenz**: Siehe Dokumentation
- **Beispiele**: Siehe `japarabic-house-5.json`

## 💡 Template-Ideen

- Kleine Hütte (5x5x3)
- Turm (5x5x10)
- Brücke (3x15x1)
- Zaun-Ring (10x10x2)
- Brunnen-Überdachung (5x5x3)
- Farm-Schuppen (7x5x4)
- Wachturm (4x4x8)
- Lagerhalle (12x8x5)

**Viel Spaß beim Bauen! 🏗️**

