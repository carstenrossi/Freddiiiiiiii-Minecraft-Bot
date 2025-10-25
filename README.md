# 🤖 Freddiiiiii - Intelligenter Minecraft Bot

Ein KI-gesteuerter Minecraft Bot mit fortgeschrittenen Fähigkeiten, powered by **Mineflayer** und **Deepseek V3.1 671B Cloud** via Ollama.

## 🌟 Features

### 🧠 Künstliche Intelligenz
- **Deepseek V3.1 Cloud Integration** - Nutzt ein mächtiges LLM für natürliche Sprachverarbeitung
- **Minecraft-Weltwissen** - Versteht Minecraft-Mechaniken, Crafting, Materialien und Strategien
- **Räumliche Intelligenz** - Fortgeschrittene 3D-Umgebungsanalyse mit Caching
- **Multi-Step-Planung** - Kann komplexe Aufgaben in Schritte aufteilen

### 👀 Wahrnehmung
- **360° Entity-Erkennung** - Erkennt Tiere, Monster und Spieler in alle Richtungen (vor/hinter/links/rechts)
- **Intelligenter Umgebungs-Scan** - Findet Wasser, Bäume, Berge und Gefahren
- **Konsistente Reichweite** - 32 Blöcke Scan = 32 Blöcke Aktionen (keine Widersprüche!)
- **Kompakte Debug-Logs** - Übersichtliche Statistiken statt Spam

### ⚔️ Kampf-System
- **Automatische Verfolgung** - Läuft zu Zielen und verfolgt sie im Kampf
- **Sprint-Optimierung** - Sprint AN während Verfolgung, AUS beim Angriff
- **Robuste Ausführung** - Funktioniert auch bei Equipment-Fehlern
- **32m Reichweite** - Findet und bekämpft Mobs bis 32 Blöcke entfernt

### 🏗️ Bau-System
- **Intelligente Positionierung** - Steht sich nicht mehr selbst im Weg
- **Flexible Strukturen** - Türme, Wände, Häuser, Brücken
- **Farm-Bau** - Automatischer Bau von Weizen-Farmen mit Wasser, Acker und Zaun
- **Sicherheitsabstand** - Baut mit Abstand für bessere Sicht

### 🔨 Graben & Mining
- **Brunnen mit Ausgang** - Gräbt automatisch einen Ausgang (kein Pillaring nötig!)
- **Automatisches Werkzeug** - Equippt Schaufel/Spitzhacke automatisch
- **Parametrisierbar** - Breite × Tiefe × Länge konfigurierbar
- **Intelligenter Ausstieg** - Geht nach Graben automatisch raus

### 🚶 Bewegung & Navigation
- **Pathfinding aus Löchern** - Kommt aus tiefen Löchern mit Scaffolding raus
- **Höhenunterschiede** - Klettert und pillaert über große Höhenunterschiede
- **Ziel-Kopplung** - Bewegung + Aktion sind gekoppelt (läuft zu Zielen)
- **Timeout-System** - 60 Sekunden für schwierige Pfade

### 🔍 Erweiterte Features
- **Verbesserte Loch-Erkennung** - 4-Stufen-Analyse (keine False Positives bei Terrassen)
- **Fehler-Feedback-System** - Konsistente Nachrichten, keine Widersprüche
- **Status-Codes** - Funktionen kommunizieren Erfolg/Fehler
- **"Dreh dich um"** - Kann sich umdrehen um hinter sich zu schauen

## 🚀 Installation

### Voraussetzungen
- Node.js (v14+)
- Minecraft Java Edition Server
- Ollama mit Deepseek Cloud-Zugang

### Setup

1. **Projekt klonen**:
```bash
git clone https://github.com/DEIN_USERNAME/mineflayer-bot.git
cd mineflayer-bot
```

2. **Dependencies installieren**:
```bash
npm install
```

3. **Bot starten**:
```bash
npm start
```

## 📖 Nutzung

### Basis-Befehle

#### Bewegung:
- `"komm zu mir"` - Bot kommt zum Spieler
- `"geh zum wasser"` - Läuft zum nächsten Wasser
- `"geh zum horse"` - Läuft zum nächsten Pferd
- `"gehe zu 100 65 200"` - Geht zu Koordinaten

#### Kampf:
- `"greife den zombie an"` - Greift Zombie an (läuft hin + verfolgt)
- `"töte das llama"` - Tötet nächstes Llama
- `"angriff"` - Greift nächsten Mob an

#### Wahrnehmung:
- `"scan"` - Scannt Umgebung (32m Radius)
- `"dreh dich um"` - 180° Drehung + neuer Scan
- `"analyse"` - Detaillierte Raumanalyse (5s Timeout)

#### Bau & Graben:
- `"baue einen turm"` - Baut Turm (von der Seite)
- `"baue ein haus"` - Baut kleines Haus
- `"grabe einen brunnen"` - Gräbt 3x10x3 Brunnen mit Ausgang
- `"grabe 5x3x5"` - Gräbt mit Parametern
- `"baue eine weizenfarm"` - Baut automatisch Farm

#### Ressourcen:
- `"sammle holz"` - Sammelt Holz von Bäumen
- `"craften"` - Craftet Items (wenn Materialien vorhanden)
- `"inventar"` - Zeigt Inventar

#### Sonstiges:
- `"escape"` / `"ich stecke fest"` - Pillaert aus Loch
- `"position"` - Zeigt aktuelle Position
- `"stopp"` - Stoppt aktuelle Bewegung

### Komplexe Multi-Step-Befehle:
- `"Baue eine effiziente Weizenfarm"` - Plant und baut automatisch
- `"Sammle Holz und baue ein Haus"` - Multi-Step-Ausführung
- `"Geh zum Baum, sammle Holz und komm zurück"` - Ketten von Aktionen

## 🏗️ Architektur

### Hauptdateien:
- **`bot-advanced.js`** - Haupt-Bot-Logik mit LLM-Integration
- **`spatial-intelligence.js`** - Räumliche Analyse-Engine
- **`minecraft-ai-knowledge.js`** - Minecraft-Wissens-Datenbank

### Dokumentationen:
Umfassende Dokumentation aller Features und Fixes in `*.md` Dateien:
- `bau-verbesserungen.md` - Bau-System
- `umgebungs-wahrnehmung.md` - Entity-Erkennung
- `bewegung-und-aktion-kopplung.md` - Pathfinding
- `SESSION-ZUSAMMENFASSUNG.md` - Komplette Übersicht
- ... und viele mehr

## 🎯 Technische Details

### LLM-Integration:
- **Modell**: Deepseek V3.1 671B (Cloud via Ollama)
- **Prompt-Engineering**: Minecraft-spezifische System-Prompts
- **Intent-basiert**: LLM generiert strukturierte JSON-Aktionen
- **Fehler-Feedback**: Status-Codes für konsistente Antworten

### Pathfinding:
- **mineflayer-pathfinder** für Navigation
- **Scaffolding** aktiviert (pillaert aus Löchern)
- **allow1by1towers** für Klettern
- **canDig** für Hindernisse

### Performance:
- **Caching**: Räumliche Analysen gecacht (30s)
- **Optimierte Scans**: 32m Radius statt 64m
- **Lazy Loading**: Detaillierte Analyse nur auf Anfrage
- **Kompakte Logs**: Statistiken statt Details

## ⚙️ Konfiguration

### Server-Einstellungen:
```javascript
// bot-advanced.js
const bot = mineflayer.createBot({
  host: 'localhost',
  username: 'Freddiiiiii',
  auth: 'offline'
});
```

### Ollama-Verbindung:
```javascript
const ollama = new Ollama({ 
  host: 'http://localhost:11434' 
});
```

### Reichweiten:
```javascript
const SCAN_RADIUS = 32;      // Umgebungs-Scan
const ACTION_RADIUS = 32;    // Aktionen (Angriff, gehe_entity)
const RESOURCE_RADIUS = 64;  // Ressourcen (Bäume, Wasser)
```

## 🐛 Bekannte Probleme & Lösungen

### Problem: Bot kommt nicht aus Loch
**Lösung**: 
- Scaffolding-Blocks sind aktiviert (nutzt Dirt/Cobblestone)
- Brunnen werden mit Ausgang gegraben
- 60s Timeout für schwierige Pfade

### Problem: Entities werden nicht gefunden
**Lösung**:
- Alle Entity-Typen unterstützt: animal, hostile, passive, water_creature
- Englische Namen verwenden ("horse" statt "pferd")
- 32m Radius (konsistent)

### Problem: LLM-Antwort vs. Realität
**Lösung**:
- Fehler-Feedback-System
- Status-Codes unterdrücken optimistische Antworten
- Nur echte Fehlermeldungen werden gezeigt

## 📊 Statistiken

- **~2000 Zeilen Code** (bot-advanced.js)
- **750 Zeilen** Spatial Intelligence
- **15+ Dokumentations-Dateien**
- **20+ Intent-Typen**
- **14 Haupt-Features**

## 🛠️ Entwicklung

### Dependencies:
```json
{
  "mineflayer": "^4.x",
  "mineflayer-pathfinder": "^2.x",
  "ollama": "latest",
  "vec3": "^0.1.x"
}
```

### Testing:
Teste-Szenarien in `test-*.md` Dateien:
- `test-minecraft-wissen.md`
- `test-spatial-intelligence.md`

## 📝 Changelog

### Version 1.0 (Aktuell)
- ✅ Vollständige LLM-Integration
- ✅ 360° Entity-Wahrnehmung
- ✅ Intelligentes Kampf-System
- ✅ Brunnen mit Ausgang
- ✅ Farm-Bau-System
- ✅ Räumliche Intelligenz
- ✅ Fehler-Feedback-System
- ✅ Konsistente Reichweiten (32m)

## 🤝 Beitragen

Contributions willkommen! Bitte erstelle ein Issue oder Pull Request.

## 📄 Lizenz

MIT License

## 🙏 Credits

- **Mineflayer** - Minecraft Bot Framework
- **Deepseek** - KI-Modell
- **Ollama** - LLM Inference Server
- **PrismarineJS** - Minecraft-Protokoll-Bibliotheken

## 📞 Kontakt

Bei Fragen oder Problemen bitte ein GitHub Issue erstellen.

---

**Freddiiiiii** - Der intelligenteste Minecraft Bot mit echtem Weltwissen! 🎮🤖
