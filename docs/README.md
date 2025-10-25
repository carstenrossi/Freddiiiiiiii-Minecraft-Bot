# 📚 Dokumentation - Freddiiiiii Bot

Übersicht über alle Dokumentationen und Feature-Beschreibungen.

## 📖 Hauptdokumentationen

### 🎯 [SESSION-ZUSAMMENFASSUNG.md](SESSION-ZUSAMMENFASSUNG.md)
**Komplette Übersicht** aller Features, Fixes und Verbesserungen dieser Session.

### 🚀 [GITHUB-SETUP.md](GITHUB-SETUP.md)
Anleitung zum Hochladen des Projekts auf GitHub.

---

## 🏗️ Bau-System

### [bau-verbesserungen.md](bau-verbesserungen.md)
**Problem**: Bot steht sich selbst im Weg beim Bauen  
**Lösung**: Sichere Positionierung vor dem Bauen, Sicherheitsabstand

### [brunnen-mit-ausgang.md](brunnen-mit-ausgang.md)
**Problem**: Pillaring aus Brunnen scheitert  
**Lösung**: Brunnen mit automatischem Ausgang graben

### [graben-fix.md](graben-fix.md)
**Problem**: Graben funktioniert nicht (fehlte await)  
**Lösung**: Await hinzugefügt, automatisches Werkzeug-Equippen

### [farm-anleitung.md](farm-anleitung.md)
Dokumentation des automatischen Weizen-Farm-Bau-Systems.

---

## ⚔️ Kampf & Bewegung

### [angriffs-fix.md](angriffs-fix.md)
**Problem**: PartialReadError beim Angriff  
**Lösung**: Robuste Fehlerbehandlung, funktioniert auch ohne Waffe

### [angriffs-reichweite-fix.md](angriffs-reichweite-fix.md)
**Problem**: Begrenzte Angriffs-Reichweite  
**Lösung**: 32m Radius, dynamischer Timeout, Abbruch-Logik

### [bewegung-und-aktion-kopplung.md](bewegung-und-aktion-kopplung.md)
**Problem**: Bot bewegt sich nicht zu Zielen  
**Lösung**: GoalFollow, Sprint-Optimierung, kontinuierliche Verfolgung

### [gehe-zu-entity-feature.md](gehe-zu-entity-feature.md)
Neuer `gehe_entity` Intent zum friedlichen Annähern an Tiere/Mobs.

---

## 👀 Wahrnehmung & Entities

### [umgebungs-wahrnehmung.md](umgebungs-wahrnehmung.md)
**Problem**: Bot sieht nicht was hinter ihm ist  
**Lösung**: 360° Richtungs-Erkennung (vor/hinter/links/rechts)

### [entity-debugging.md](entity-debugging.md)
Debug-Ansatz für Entity-Erkennung, alle Entity-Typen.

### [scan-vs-aktion-sync.md](scan-vs-aktion-sync.md)
**Problem**: Scan zeigt Entities, Aktion findet sie nicht  
**Lösung**: Debug-System zur Diagnose

### [scan-aktions-radius-fix.md](scan-aktions-radius-fix.md)
**Problem**: Scan-Radius (64m) ≠ Aktions-Radius (32m)  
**Lösung**: Beide auf 32m vereinheitlicht

### [debug-logs-optimiert.md](debug-logs-optimiert.md)
Reduzierung von Spam-Logs, kompakte Statistiken.

---

## 🕳️ Loch-Erkennung & Pathfinding

### [verbesserte-loch-erkennung.md](verbesserte-loch-erkennung.md)
**Problem**: Terrassen werden als Loch erkannt  
**Lösung**: 4-Stufen-Analyse (Wände, freie Wege, Decke, Terrain-Höhe)

### [loch-ueberwachung-fix.md](loch-ueberwachung-fix.md)
**Problem**: Loch-Überwachung blockiert andere Aktionen  
**Lösung**: Deaktiviert, botBeschaeftigt-Flag, manueller Escape

### [pathfinding-aus-loechern.md](pathfinding-aus-loechern.md)
**Problem**: Bot kommt aus Löchern nicht raus  
**Lösung**: Y-Koordinate beibehalten, Scaffolding-Blocks, 60s Timeout

---

## 💬 LLM & Kommunikation

### [llm-antwort-vs-realitaet.md](llm-antwort-vs-realitaet.md)
**Problem**: LLM-Antwort widerspricht Realität  
**Lösung**: Fehler-Feedback-System, Status-Codes, Antwort-Unterdrückung

---

## 🧪 Tests & Beispiele

### [test-minecraft-wissen.md](test-minecraft-wissen.md)
Test-Szenarien für Minecraft-Wissen des Bots.

### [test-spatial-intelligence.md](test-spatial-intelligence.md)
Test-Szenarien für räumliche Intelligenz.

### [komplexe-prompts.md](komplexe-prompts.md)
Sammlung komplexer Befehle die der Bot verstehen sollte.

---

## 🔧 Technische Dokumentationen

### [performance-optimierungen.md](performance-optimierungen.md)
Performance-Verbesserungen für räumliche Analyse.

### [raumanalyse-fix.md](raumanalyse-fix.md)
Fix für Endlosschleifen in der Raumanalyse.

### [minecraft-knowledge.md](minecraft-knowledge.md)
Minecraft-Wissens-Datenbank (Materialien, Crafting, etc.).

---

## 📂 Dokumentations-Struktur

```
docs/
├── README.md (diese Datei - Index)
├── SESSION-ZUSAMMENFASSUNG.md (Hauptübersicht)
├── GITHUB-SETUP.md (Setup-Anleitung)
│
├── Bau-System/
│   ├── bau-verbesserungen.md
│   ├── brunnen-mit-ausgang.md
│   ├── graben-fix.md
│   └── farm-anleitung.md
│
├── Kampf & Bewegung/
│   ├── angriffs-fix.md
│   ├── angriffs-reichweite-fix.md
│   ├── bewegung-und-aktion-kopplung.md
│   └── gehe-zu-entity-feature.md
│
├── Wahrnehmung/
│   ├── umgebungs-wahrnehmung.md
│   ├── entity-debugging.md
│   ├── scan-vs-aktion-sync.md
│   ├── scan-aktions-radius-fix.md
│   └── debug-logs-optimiert.md
│
├── Pathfinding/
│   ├── verbesserte-loch-erkennung.md
│   ├── loch-ueberwachung-fix.md
│   └── pathfinding-aus-loechern.md
│
├── LLM & AI/
│   ├── llm-antwort-vs-realitaet.md
│   └── minecraft-knowledge.md
│
└── Tests/
    ├── test-minecraft-wissen.md
    ├── test-spatial-intelligence.md
    ├── komplexe-prompts.md
    ├── performance-optimierungen.md
    └── raumanalyse-fix.md
```

---

## 🔍 Quick Links

### Problem-Lösungen (häufig):
- [Bot steht sich im Weg](bau-verbesserungen.md)
- [Kommt nicht aus Loch](pathfinding-aus-loechern.md)
- [Graben funktioniert nicht](graben-fix.md)
- [Angriff scheitert](angriffs-fix.md)
- [Entities nicht gefunden](scan-aktions-radius-fix.md)

### Features:
- [360° Wahrnehmung](umgebungs-wahrnehmung.md)
- [Kampf-System](bewegung-und-aktion-kopplung.md)
- [Farm-Bau](farm-anleitung.md)
- [Gehe zu Entity](gehe-zu-entity-feature.md)

### Technisch:
- [Performance](performance-optimierungen.md)
- [Debug-Logs](debug-logs-optimiert.md)
- [LLM-Integration](llm-antwort-vs-realitaet.md)

---

**Für Entwickler**: Start mit [SESSION-ZUSAMMENFASSUNG.md](SESSION-ZUSAMMENFASSUNG.md)  
**Für Nutzer**: Start mit [komplexe-prompts.md](komplexe-prompts.md)  
**Für Debugging**: Start mit [debug-logs-optimiert.md](debug-logs-optimiert.md)

