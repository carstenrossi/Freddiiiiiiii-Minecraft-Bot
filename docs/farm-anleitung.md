# Weizenfarm bauen mit Freddiiiiii

## Neues Feature: Farm-Bau

Freddiiiiii kann jetzt richtige Minecraft-Farmen bauen!

### Einfacher Befehl:
```
"baue eine weizenfarm"
"mache eine kleine farm"
"baue eine effiziente weizenfarm"
```

### Was der Bot macht:

1. **Wasserquelle finden/platzieren**
   - Sucht Wasser in 20 Block Umkreis
   - Oder platziert Wasser aus Eimer

2. **Boden vorbereiten**
   - Hackt Erde/Gras zu Farmland
   - 9x9 Feld (klein), 15x15 (mittel), 21x21 (groß)

3. **Seeds pflanzen**
   - Wheat Seeds, Karotten oder Kartoffeln
   - Automatisch auf Farmland

4. **Optional: Zaun**
   - Schützt vor Tieren
   - Bei kleinen Farmen

### Voraussetzungen:

**Minimal:**
- Dirt/Grass Boden
- Wasserquelle ODER Wassereimer
- Seeds (Wheat Seeds, Carrot, Potato)

**Optimal:**
- Hoe (zum Boden bearbeiten)
- Zaun (für Schutz)
- Flache Fläche

### Multi-Step Alternative:

Das LLM kann auch eine Farm in Schritten planen:

```json
{
  "aktionen": [
    {"intent": "scan"},  // Umgebung checken
    {"intent": "gehe_zu_wasser"},  // Wasser finden
    {"intent": "baue_farm", "typ": "weizen", "groesse": "klein"}
  ]
}
```

### Oder mit Vorbereitung:

```json
{
  "aktionen": [
    {"intent": "sammle_holz", "anzahl": 20},  // Für Zaun
    {"intent": "craften", "item": "fence", "anzahl": 16},
    {"intent": "baue_farm", "typ": "weizen", "groesse": "mittel"}
  ]
}
```

### Minecraft-Wissen:

- Wasser bewässert 4 Blöcke in alle Richtungen
- Farmland wird zu Dirt wenn man drauf springt
- Seeds wachsen nur mit Licht (Sonne oder Fackeln)
- Zäune halten Tiere fern

### Fehlerbehandlung:

Wenn etwas fehlt, sagt der Bot was er braucht:
- "Kein Wasser gefunden und kein Eimer!"
- "Keine Samen vorhanden!"
- "Keine Hacke gefunden - improvisiere..."

### Größen:

- **klein**: 9x9 (bis zu 80 Weizen)
- **mittel**: 15x15 (bis zu 224 Weizen)  
- **groß**: 21x21 (bis zu 440 Weizen)

Wasser in der Mitte = maximale Effizienz!
