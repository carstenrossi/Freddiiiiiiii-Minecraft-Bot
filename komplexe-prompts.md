# Komplexe Prompts für Freddiiiiii mit KI-Power

## 1. 🏘️ Siedlungsbau mit Planung
```
"Ich möchte ein kleines Dorf bauen"
```
Freddiiiiii sollte:
- Erst Raumanalyse für große flache Fläche
- Mehrere Häuser planen
- Wege zwischen Häusern
- Zentrale Wasserquelle suchen/nutzen

## 2. 🏭 Ressourcen-Management
```
"Bereite dich auf eine Mining-Expedition vor"
```
Freddiiiiii sollte wissen:
- Braucht Pickaxe (craftet aus Holz → Stone → Iron)
- Fackeln für Licht (Coal + Sticks)
- Essen mitnehmen
- Treppen/Leitern für Aufstieg
- Kiste für Lagerung

## 3. 🌾 Intelligente Farm
```
"Baue eine effiziente Weizenfarm"
```
Freddiiiiii sollte:
- Wasserquelle finden/nutzen (4 Block Radius)
- 9x9 Feld mit Wasser in Mitte
- Zaun drumherum (gegen Tiere)
- Seeds sammeln (Gras zerstören)
- Lichtquellen planen

## 4. 🏰 Defensive Strukturen
```
"Baue einen sicheren Unterschlupf für die Nacht"
```
Freddiiiiii sollte verstehen:
- Monster spawnen im Dunkeln
- Braucht Wände + Dach + Tür
- Fackeln innen für Licht
- Bett für Respawn-Punkt
- Kisten für Lagerung

## 5. 🗺️ Exploration mit Kontext
```
"Erkunde die Gegend und finde interessante Orte"
```
Freddiiiiii sollte:
- Systematisch in alle Richtungen scannen
- POIs markieren (Dörfer, Höhlen, Berge)
- Ressourcen notieren
- Sichere Rückkehr planen

## 6. ⛏️ Mining-Strategien
```
"Finde Diamanten"
```
Freddiiiiii sollte wissen:
- Diamanten spawnen Y=-64 bis Y=16
- Beste Höhe: Y=-58
- Braucht Iron Pickaxe minimum
- Strip-Mining Technik
- Lava-Gefahr beachten

## 7. 🏗️ Komplexe Bauaufträge
```
"Baue eine Brücke über den Fluss"
```
Freddiiiiii sollte:
- Breite messen
- Stützpfeiler planen
- Material kalkulieren
- Von beiden Seiten bauen
- Geländer nicht vergessen

## 8. 🎯 Bedingte Aktionen
```
"Wenn es dunkel wird, baue schnell einen Unterschlupf"
```
Freddiiiiii sollte:
- Zeit/Licht checken
- Bei Gefahr priorisieren
- Notunterkunft vs. richtiges Haus
- Material-Verfügbarkeit beachten

## 9. 🔄 Automatisierung
```
"Sammle 64 Holz und verarbeite alles zu Sticks"
```
Freddiiiiii sollte:
- Crafting-Kette verstehen
- Log → Planks (1:4)
- Planks → Sticks (2:4)
- Inventar-Management

## 10. 🧭 Navigationstests
```
"Gehe zum höchsten Berg, dann zum nächsten See, dann zurück"
```
Freddiiiiii sollte:
- Mehrere Wegpunkte merken
- Pfade optimieren
- Startpunkt merken
- Hindernisse umgehen

## 11. 🏛️ Architektur mit Stil
```
"Baue ein Haus im mittelalterlichen Stil"
```
Freddiiiiii sollte verstehen:
- Cobblestone/Stone Bricks Base
- Holzbalken-Details
- Spitzdach
- Kleine Fenster
- Eventuell Turm

## 12. 🛡️ Kampf-Vorbereitung
```
"Ein Zombie-Angriff steht bevor, bereite dich vor"
```
Freddiiiiii sollte:
- Waffen craften/finden
- Rüstung anlegen
- Defensive Position
- Heilung bereithalten
- Fluchtweg planen

## Test-Strategie:

1. **Einfach → Komplex**: Erst einzelne Features, dann Kombinationen
2. **Beobachte LLM-Output**: Schaut er sich die Umgebung an? Plant er mehrere Schritte?
3. **Fehlerbehandlung**: Was macht er wenn Material fehlt?
4. **Kreativität**: Findet er alternative Lösungen?

## Erwartete Intelligenz:

- **Kontext-Verständnis**: "Es wird dunkel" → Monster-Gefahr
- **Material-Wissen**: "Haus aus Stein" → Cobblestone, nicht Dirt
- **Prozess-Verständnis**: "Farm" → Wasser + Seeds + Zaun
- **Prioritäten**: Sicherheit > Schönheit bei Nacht
- **Adaptivität**: Alternative wenn Plan A nicht geht
