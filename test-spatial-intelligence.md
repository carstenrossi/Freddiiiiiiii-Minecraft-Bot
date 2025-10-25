# Räumliche Intelligenz Test-Szenarien

## Neue Features:
1. **Erweiterte Umgebungsanalyse** mit 32 Block Radius
2. **Terrain-Analyse** mit Höhenkarte
3. **Bauflächenerkennung** mit Flachheitsberechnung
4. **Gefahrenerkennung** (Lava, tiefe Löcher, Klippen)
5. **Strukturerkennung** (Gebäude, Höhlen, Brücken)
6. **Ressourcen-Clustering** (Wälder erkennen)
7. **Räumliche Empfehlungen** basierend auf Kontext

## Test-Befehle:

### Basis-Scan
```
"scanne die umgebung"
"was ist um mich herum?"
```
→ Sollte normalen Scan mit räumlicher Analyse zeigen

### Detaillierte Analyse
```
"analysiere den raum"
"mach eine raumanalyse"
"zeige mir die umgebung genau"
```
→ Sollte detaillierte räumliche Analyse mit:
- Terrain-Höhe
- Baubare Flächen
- Gefahren
- Strukturen
- Empfehlungen

### Intelligentes Bauen
```
"wo soll ich bauen?"
"finde einen guten bauplatz"
"suche flache fläche für haus"
```
→ Bot sollte:
1. Raumanalyse durchführen
2. Beste Baufläche identifizieren
3. Empfehlung geben

### Komplexe Anfragen
```
"ich will ein dorf bauen"
```
→ Bot sollte:
1. Großflächige Analyse
2. Mehrere Bauplätze finden
3. Wasserquelle berücksichtigen
4. Ressourcen einplanen

```
"ist es hier sicher?"
```
→ Bot sollte:
1. Gefahren analysieren
2. Monster checken
3. Terrain-Gefahren prüfen
4. Empfehlung geben

## Erwartete Verbesserungen:

1. **Bessere Bauplatzwahl**: Nicht mehr zufällig, sondern auf flachen, sicheren Flächen
2. **Gefahrenvermeidung**: Erkennt Lava, Klippen, tiefe Löcher
3. **Ressourcen-Effizienz**: Findet Wald-Cluster statt einzelne Bäume
4. **Kontext-Verständnis**: Versteht "am Berg", "im Tal", "am Wasser"
5. **Multi-Step-Planung**: Kann große Projekte besser planen

## Debug-Ausgaben:

In der Konsole sollten erscheinen:
- `🔍 Analysiere Raum...`
- `🧠 Führe räumliche Analyse durch...`
- `📊 Vollständige Raumanalyse:` (bei detaillierter Analyse)

## Performance:

- Basis-Scan: ~1-2 Sekunden
- Räumliche Analyse: ~2-4 Sekunden (32 Block Radius)
- Kann bei Bedarf mit größerem Radius (64 Blöcke) laufen

## Troubleshooting:

Falls "Räumliche Analyse nicht verfügbar":
- Prüfe ob `spatial-intelligence.js` existiert
- Prüfe Import in `bot-advanced.js`
- Prüfe ob Bot gespawnt ist (spatial wird erst nach spawn initialisiert)
