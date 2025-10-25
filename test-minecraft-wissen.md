# Test-Anfragen für Minecraft-Wissen

## Einfache Tests
1. "Baue ein Haus" → Sollte Cobblestone/Wood vorschlagen
2. "Gehe mining" → Sollte wissen dass man unter Y=60 gehen muss
3. "Es wird dunkel" → Sollte Schutz/Licht vorschlagen

## Komplexe Tests mit Minecraft-Wissen
1. "Ich brauche Eisen" → Sollte wissen:
   - Iron Ore spawnt Y=0 bis Y=64
   - Braucht mindestens Stone Pickaxe
   - Muss im Ofen geschmolzen werden

2. "Mache eine Weizenfarm" → Sollte wissen:
   - Braucht Wasser (max 4 Blöcke entfernt)
   - Seeds von Gras
   - Zaun gegen Tiere
   - Licht für Wachstum

3. "Baue ein Nether-Portal" → Sollte wissen:
   - 10 Obsidian minimum (14 für komplettes Portal)
   - Obsidian = Wasser + Lava
   - Braucht Diamond Pickaxe
   - Feuerzeug zum Aktivieren

4. "Bereite dich auf den Enderdragon vor" → Sollte wissen:
   - Rüstung (idealerweise Diamond)
   - Bogen + viele Pfeile
   - Wassereimer für Endermen
   - Betten für Explosionsschaden
   - Enderperlen

## Material-Hierarchie Test
"Was ist das beste Material für ein Haus?"
→ Sollte antworten:
- Obsidian (explosionssicher, aber teuer)
- Stone Bricks (schön, stabil)
- Cobblestone (günstig, stabil)
- Wood (leicht zu bekommen, aber brennbar)
- NICHT Dirt/Sand (instabil)

## Crafting-Ketten Test
"Ich will eine Enchanting Table"
→ Sollte wissen:
1. Brauche Diamanten (Y=-64 bis Y=16)
2. Brauche Obsidian (4 Blöcke)
3. Brauche Buch (Papier aus Zuckerrohr + Leder)
4. Rezept: Buch oben, Diamanten links/rechts, Obsidian unten

## Mob-Wissen Test
"Ein Creeper kommt!"
→ Sollte wissen:
- Explosionsradius ~3 Blöcke
- Kein Schaden durch Wasser
- Sprint + Schlag Taktik
- Schild blockt Explosion

## Redstone Test
"Baue eine automatische Tür"
→ Sollte wissen:
- Pressure Plates oder Buttons
- Redstone Dust verbindet
- Iron Door braucht Redstone
- Sticky Pistons für komplexere Türen
