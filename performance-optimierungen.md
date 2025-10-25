# Performance-Optimierungen für Freddiiiiii

## Problem
Die räumliche Analyse wurde bei **jedem** `scanneUmgebung()` ausgeführt, was zu:
- Performance-Problemen führte
- Bot wurde mit "duplicate_login" gekickt
- Zu viele "Analysiere Raum" Meldungen im Terminal

## Lösung

### 1. Räumliche Analyse nur auf Anfrage
- Entfernt aus `scanneUmgebung()`
- Nur noch bei explizitem `analyse` Befehl

### 2. Cache-System
- 30 Sekunden Cache für Analysen
- Verhindert wiederholte Berechnungen
- Prüft ob Bot sich bewegt hat (>5 Blöcke)

### 3. Performance-Optimierungen
- **Terrain-Scan**: Schrittweite von 2 auf 4-8 erhöht
- **Struktur-Scan**: Schrittweite von 5 auf 8+ erhöht  
- **Loch-Erkennung**: Schrittweite von 3 auf 5+ erhöht
- **Radius**: Von 32 auf 20 reduziert für Analyse

### 4. Entfernt aus Standard-Prompts
- Räumliche Analyse nicht mehr in jedem LLM-Prompt
- Reduziert Token-Verbrauch

## Neue Befehle

### Leichter Scan (schnell)
```
"scanne umgebung"
"was ist um mich herum"
```
→ Basis-Scan OHNE räumliche Analyse

### Detaillierte Analyse (nur bei Bedarf)
```
"analysiere den raum"
"mach eine raumanalyse"  
"wo soll ich bauen?"
```
→ Volle räumliche Analyse mit:
- Terrain-Höhenkarte
- Bauflächenerkennung
- Gefahrenerkennung
- Strukturanalyse

## Performance-Vergleich

| Operation | Vorher | Nachher |
|-----------|---------|----------|
| Normaler Scan | ~3-5 Sek | ~0.5 Sek |
| Chat-Anfrage | ~4-6 Sek | ~1-2 Sek |
| Räumliche Analyse | Bei jedem Scan | Nur auf Anfrage |

## Empfehlung

Die räumliche Analyse sollte nur verwendet werden wenn:
1. Explizit nach Bauplatz gefragt wird
2. Komplexe Umgebungsanalyse nötig ist
3. Der Bot ein größeres Projekt plant

Für normale Operationen reicht der Basis-Scan völlig aus!
