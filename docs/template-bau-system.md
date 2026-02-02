# Template-basiertes Bausystem

## Übersicht

Das Template-System ermöglicht es Freddi, komplexe Gebäude nach vorgefertigten JSON-Templates zu bauen. Das System besteht aus drei Hauptkomponenten:

1. **Template-Loader**: Lädt und verarbeitet JSON-Templates
2. **Build-Site-Finder**: Findet geeignete Bauflächen
3. **Build-Executor**: Führt den eigentlichen Bau aus

## Verwendung

### Einfacher Befehl

```
Spieler: "Bau mir ein Haus"
Freddi: 🏗️ Lade Template: japarabic-house-5...
        Suche einen guten Bauplatz...
        ✅ Perfekten Bauplatz gefunden!
        🏗️ Starte Bau von Japarabic House 5!
        📦 Baue Level 1 (y=0)...
        ...
        🎉 Japarabic House 5 fertig gebaut!
```

### Verfügbare Intents

- `baue_template` - Baut ein Gebäude nach Template
  - Parameter:
    - `template`: Name des Templates (z.B. "japarabic-house-5")
    - `position`: Optional - Spezifische Position {x, y, z}

## Template-Format

Templates sind JSON-Dateien im Ordner `templates/`. 

### Struktur

```json
{
  "id": "grabcraft:japarabic-house-5",
  "title": "Japarabic House 5",
  "version": 1,
  "dimensions": {
    "width": 11,
    "height": 7,
    "depth": 12,
    "origin": "southwest",
    "facing": "north",
    "y0_is_ground": true
  },
  "palette": {
    "C1": { "name": "minecraft:sandstone" },
    "C2": { "name": "minecraft:smooth_sandstone" },
    "C3": { "name": "minecraft:jungle_planks" }
  },
  "steps": [
    {
      "level": 1,
      "y": 0,
      "grid_shape": [11, 12],
      "rows": [
        ["C1", "C1", "C1", ...],
        ["C1", "C6", "C6", ...],
        ...
      ]
    }
  ],
  "overrides_todo": [
    {
      "hint": "Eingangstor/Fence Gate...",
      "example_format": { ... }
    }
  ]
}
```

### Felder-Erklärung

#### dimensions
- `width`: Breite in X-Richtung
- `height`: Höhe (Anzahl Levels)
- `depth`: Tiefe in Z-Richtung
- `origin`: Ursprungspunkt ("southwest", "southeast", "northwest", "northeast")
- `facing`: Blickrichtung des Gebäudes ("north", "south", "east", "west")
- `y0_is_ground`: true wenn Level 0 auf dem Boden ist

#### palette
Mapping von Kurzzeichen zu Minecraft-Blöcken:
- `name`: Minecraft Block-ID (mit oder ohne "minecraft:" prefix)
- `state`: Optional - Block-States (z.B. `{"half": "bottom"}` für Slabs)

#### steps
Array von Build-Levels, von unten nach oben:
- `level`: Level-Nummer (1-basiert)
- `y`: Y-Offset relativ zum Boden
- `grid_shape`: [breite, tiefe] - Validierung
- `rows`: 2D-Array von Palette-Schlüsseln
  - Jede Reihe ist eine Z-Linie
  - Jeder Eintrag ist ein X-Wert
  - `"C6"` oder `"air"` für Luftblöcke

#### overrides_todo
Hinweise für spezielle Blöcke (Türen, Leitern, etc.) - noch nicht vollständig implementiert

## Module

### TemplateLoader (`template-loader.js`)

**Hauptfunktionen:**

- `loadTemplate(templateName)` - Lädt und verarbeitet ein Template
  - Validiert Struktur
  - Übersetzt Palette in Minecraft-Block-IDs
  - Bereitet Build-Steps vor
  - Cached geladene Templates

- `listTemplates()` - Listet alle verfügbaren Templates auf

- `getTemplateInfo(templateName)` - Gibt Basis-Infos ohne vollständiges Laden

- `estimateBlockCount(template)` - Schätzt benötigte Block-Anzahl

**Beispiel:**
```javascript
const loader = new TemplateLoader(bot);
const template = await loader.loadTemplate('japarabic-house-5');
console.log(template.title); // "Japarabic House 5"
```

### BuildSiteFinder (`build-site-finder.js`)

**Hauptfunktionen:**

- `findBuildSite(template, startPos, radius)` - Findet geeignete Baufläche
  - Scannt Terrain in Spirale vom Startpunkt
  - Prüft Fundament auf Solidität
  - Prüft Luftraum auf Hindernisse
  - Gibt Position und Bewertung zurück

- `evaluateSite(template, basePos)` - Bewertet eine spezifische Position
  - Fundament-Check: Solide Blöcke, keine Schwerkraft-Blöcke, Ebenheit
  - Luftraum-Check: Keine Obstruktionen
  - Erreichbarkeits-Check: Distanz, Höhenunterschied

- `checkFoundation(basePos, width, depth)` - Prüft nur Fundament

- `checkAirspace(basePos, width, depth, height)` - Prüft nur Luftraum

- `createTerraformingPlan(siteEvaluation, template)` - Erstellt Terraforming-Plan

**Fundament-Kriterien:**
- ≥80% solide Blöcke
- Maximale Unebenheit: 2 Blöcke
- Keine Schwerkraft-Blöcke (Sand, Kies)
- Keine Flüssigkeiten (Wasser, Lava)

**Beispiel:**
```javascript
const finder = new BuildSiteFinder(bot);
const result = await finder.findBuildSite(template, bot.entity.position, 32);

if (result.success) {
  console.log(`Baufläche bei: ${result.position}`);
} else if (result.terraformNeeded) {
  console.log(`Terraforming nötig: ${result.issues}`);
}
```

### BuildExecutor (`build-executor.js`)

**Hauptfunktionen:**

- `executeBuild(template, basePos, options)` - Führt Bau aus
  - Prüft Materialien
  - Baut Level für Level
  - Platziert Blöcke in Reichweite
  - Navigiert automatisch
  - Wendet Overrides an

- `checkMaterials(template)` - Prüft Inventar auf benötigte Materialien

- `getBuildStatus()` - Gibt aktuellen Build-Fortschritt zurück

- `stopBuild()` - Stoppt laufenden Bau

**Build-Optionen:**
```javascript
{
  continueWithoutMaterials: true,  // Weiterbauen auch bei Materialmangel
  ignoreMaterials: false           // Material-Check überspringen
}
```

**Build-Ablauf:**
1. Material-Check
2. Level für Level durchgehen
3. Pro Level: Alle Nicht-Luft-Blöcke platzieren
4. Navigation zum Block (wenn >4.5m entfernt)
5. Referenz-Block finden (für placeBlock)
6. Block platzieren
7. Overrides anwenden

**Statistiken:**
- `blocksPlaced`: Anzahl platzierter Blöcke
- `blocksFailed`: Anzahl fehlgeschlagener Platzierungen
- `timeStarted`: Start-Zeitstempel
- `timeCompleted`: End-Zeitstempel

**Beispiel:**
```javascript
const executor = new BuildExecutor(bot);
const result = await executor.executeBuild(template, buildPos, {
  continueWithoutMaterials: true
});

console.log(`Gebaut: ${result.stats.blocksPlaced} Blöcke in ${result.duration}s`);
```

## Template erstellen

### 1. Von Grabcraft exportieren

1. Gehe zu [Grabcraft.com](https://www.grabcraft.com)
2. Suche ein Gebäude
3. Exportiere als JSON (falls verfügbar)
4. Speichere in `templates/`

### 2. Manuell erstellen

```json
{
  "id": "custom:mein-haus",
  "title": "Mein Haus",
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
        ["W", "D", "W", "W", "W"]
      ]
    }
  ]
}
```

### 3. Validation

Teste dein Template mit:
```javascript
const loader = new TemplateLoader(bot);
const template = await loader.loadTemplate('mein-template');
const info = await loader.getTemplateInfo('mein-template');
console.log(`Geschätzte Blöcke: ${info.blockCount}`);
```

## Best Practices

### Template-Design

1. **Palette kompakt halten**: Verwende nur die nötigen Blöcke
2. **Luftblöcke konsistent**: Immer "C6" oder "air" verwenden
3. **Fundament beachten**: Level 0 sollte solid sein
4. **Höhe begrenzen**: Nicht zu hoch (max 10-15 Blöcke für Performance)
5. **Komplexität**: Einfache Strukturen sind zuverlässiger

### Material-Planung

Vor dem Bau:
```javascript
const materialCheck = executor.checkMaterials(template);
materialCheck.missing.forEach(m => {
  console.log(`Benötigt: ${m.need}x ${m.name}, Vorhanden: ${m.have}`);
});
```

### Bauflächen-Suche

- **Flaches Terrain** bevorzugen
- **Suchradius** anpassen (32-64 Blöcke)
- **Terraforming** nur bei geringen Unebenheiten

### Performance

- **Template-Größe**: Kleine bis mittlere Templates (< 500 Blöcke)
- **Build-Geschwindigkeit**: ~2-5 Blöcke/Sekunde
- **Navigation**: Berücksichtige Pathfinding-Zeit

## Troubleshooting

### "Keine geeignete Baufläche gefunden"

**Ursachen:**
- Terrain zu uneben
- Zu viele Hindernisse
- Suchradius zu klein

**Lösungen:**
- Gehe zu flacherem Gebiet
- Vergrößere Suchradius
- Nutze manuelle Position

### "Nicht genug Materialien"

**Ursachen:**
- Inventar leer oder unzureichend
- Falsche Block-Namen in Palette

**Lösungen:**
- Sammle mehr Materialien (z.B. `/give @p sandstone 500`)
- Prüfe Template-Palette
- Nutze `continueWithoutMaterials: true`

### "Platzieren fehlgeschlagen"

**Ursachen:**
- Kein Referenz-Block gefunden
- Zu weit entfernt
- Block bereits vorhanden

**Lösungen:**
- Bot näher an Baustelle
- Fundament manuell vorbereiten
- Template-Position anpassen

### "Block nicht gefunden in Version"

**Ursachen:**
- Block-Name falsch
- Version-Inkompatibilität

**Lösungen:**
- Prüfe Block-Namen (ohne "minecraft:" prefix oft besser)
- Nutze minecraft-data für korrekte Namen
- Teste mit einfachem Template

## Zukünftige Erweiterungen

### Geplante Features

1. **Automatisches Terraforming**
   - Fundament auffüllen
   - Hindernisse entfernen
   - Ebene Fläche schaffen

2. **Override-System**
   - Türen automatisch platzieren
   - Leitern/Treppen hinzufügen
   - Fenster-Trapdoors

3. **Template-Rotation**
   - 90°, 180°, 270° Drehung
   - Automatische Ausrichtung

4. **Multi-Template-Projekte**
   - Dörfer aus mehreren Templates
   - Verbindungs-Logik

5. **Template-Editor**
   - In-Game Template-Erstellung
   - Export/Import

6. **Schematic-Import**
   - .schem-Dateien laden
   - WorldEdit-Kompatibilität

## Beispiel-Session

```
Spieler: "Freddi, baue mir ein Haus"
Freddi:  🏗️ Lade Template: japarabic-house-5...
         ✅ Template geladen: Japarabic House 5
         📐 Dimensionen: 11x12x7
         🔍 Suche geeignete Baufläche...
         ✅ Perfekten Bauplatz gefunden!
         ✅ Alle Materialien vorhanden!
         🏗️ Starte Bau von Japarabic House 5!
         
         📦 Baue Level 1 (y=0)...
           ✓ Level 1 abgeschlossen (95/110 Blöcke)
         
         📦 Baue Level 2 (y=1)...
           ✓ Level 2 abgeschlossen (87/110 Blöcke)
         
         ... [weitere Levels] ...
         
         🎉 Japarabic House 5 fertig gebaut!
         📊 428 Blöcke in 214.3s

Spieler: "Super! Danke!"
Freddi:  Gerne! Das Haus steht! 🏠
```

## Template-Bibliothek

### Verfügbare Templates

1. **japarabic-house-5**
   - Stil: Japanisch-Arabisch Mix
   - Größe: 11x12x7
   - Materialien: Sandstone, Smooth Sandstone, Jungle Planks
   - Blöcke: ~428

### Eigene Templates hinzufügen

1. Erstelle JSON in `templates/`
2. Folge dem Format (siehe oben)
3. Teste mit `bot.chat("baue <templatename>")`
4. Bei Problemen: Logs prüfen

## API-Referenz

### TemplateLoader

```javascript
class TemplateLoader {
  constructor(bot)
  
  async loadTemplate(templateName)
  async listTemplates()
  async getTemplateInfo(templateName)
  
  validateTemplate(template)
  processTemplate(template)
  translateBlock(block)
  extractBlocksFromStep(step, palette, dimensions)
  calculateRelativePosition(x, y, z, dimensions)
  rotateTemplate(template, rotation)
  estimateBlockCount(template)
}
```

### BuildSiteFinder

```javascript
class BuildSiteFinder {
  constructor(bot)
  
  async findBuildSite(template, startPos, radius = 32)
  async evaluateSite(template, basePos)
  async checkFoundation(basePos, width, depth, y0_is_ground)
  async checkAirspace(basePos, width, depth, height)
  async checkAccessibility(basePos, width, depth)
  
  findSurfaceY(pos)
  isGravityBlock(block)
  isReplaceable(block)
  generateTestPositions(center, radius, spacing = 4)
  findGroundY(pos)
  createTerraformingPlan(siteEvaluation, template)
}
```

### BuildExecutor

```javascript
class BuildExecutor {
  constructor(bot)
  
  async executeBuild(template, basePos, options = {})
  async buildLevel(step, basePos)
  async placeBlock(pos, block)
  
  checkMaterials(template)
  findReferenceBlock(pos)
  async findApproachPosition(targetPos)
  async getItemFromInventory(itemName)
  async applyOverrides(overrides, basePos)
  
  stopBuild()
  getBuildStatus()
}
```

## Lizenz & Credits

- **System**: Template-basiertes Bausystem für Mineflayer
- **Format**: Inspiriert von Grabcraft JSON-Export
- **Author**: Carsten Rossi / Freddi AI
- **Version**: 1.0

