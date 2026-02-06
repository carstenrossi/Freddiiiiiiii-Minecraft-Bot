# 🛡️ Mace-Trainingsmodus Dokumentation

Erstellt von Eddie am 5. Februar 2026

## 🎯 Was ist der Mace-Trainingsmodus?

Der Mace-Trainingsmodus ist ein Feature für Freddi, das dir hilft besser in PVP (Player vs Player) zu werden!

Freddi wird zu einem Trainings-Dummy:
- ✅ Er steht an einer Stelle
- ✅ Er schaut dich die ganze Zeit an (dreht seinen Kopf zu dir)
- ✅ Du bekommst automatisch PVP-Equipment
- ✅ Ihr seid beide unsterblich (könnt nicht sterben)
- ✅ Nach dem Training werden alle Inventare geleert

## 🎮 Die zwei Modi

### 🛡️ Normal-Modus (mit Schild)

**Befehl:**
```
Freddi, mace
```

**Was passiert:**
- Freddi bekommt ein Schild in die Hand
- Freddi blockt permanent (hält Schild hoch)
- Freddi dreht sich zu dir (10x pro Sekunde)
- Freddi bleibt an seiner Position stehen

**Perfekt für:**
- Üben gegen einen blockenden Gegner
- Timing lernen (wann angreifen wenn Gegner blockt)
- Schwierigeres Training

### 😊 Easy-Modus (ohne Schild)

**Befehl:**
```
Freddi, mace easy
```

**Was passiert:**
- Freddi hat KEIN Schild
- Freddi dreht sich zu dir (10x pro Sekunde)
- Freddi bleibt an seiner Position stehen
- Einfacheres Ziel zum Treffen

**Perfekt für:**
- Anfänger-Training
- Aim-Practice (Ziel-Übung)
- Combo-Übung ohne Block-Störung

## 🎁 Equipment das DU bekommst

Wenn du einen der Modi startest, bekommst du automatisch:

1. **🔱 Mace mit Windburst 3**
   - Die stärkste Nahkampf-Waffe in Minecraft
   - Windburst 3 = schleudert Gegner am weitesten weg

2. **🔱 Mace mit Windburst 2**
   - Mittlere Knockback-Stärke
   - Zum Vergleichen und Testen

3. **🔱 Mace mit Windburst 1**
   - Schwächster Knockback
   - Für präzisere Combos

4. **💨 64 Wind Charges**
   - Zum Hochwerfen für Mace-Combos
   - Wirft dich in die Luft

5. **👢 Netherite Boots mit Feather Falling 4**
   - Beste Schuhe im Spiel
   - Feather Falling 4 = kein Fall-Schaden!

6. **💖 Unsterblichkeit (Effekte):**
   - Resistance 255 = quasi kein Schaden
   - Regeneration 255 = heilt ultra schnell
   - Health Boost 10 = 20 extra Herzen
   - Dauer: 999999 Sekunden (praktisch unendlich)

**💡 Pro-Tipp:** Du kannst die 3 verschiedenen Maces testen und schauen welche dir am besten gefällt!

## 🛑 Training beenden

**Befehl:**
```
Freddi, stop
```

**Was passiert:**
- ⚔️ Mace-Modus wird beendet
- 🛡️ Freddi hört auf zu blocken
- 💔 Alle Effekte werden entfernt
- 🧹 BEIDE Inventare werden geleert (deins und Freddis)
- ⏱️ Trainingszeit wird angezeigt
- ✅ Alles ist wieder normal

## 🔧 Technische Details (für Programmierer)

### Wie funktioniert es?

**1. Globale Status-Variable:**
```javascript
let maceModus = {
  aktiv: false,              // Ist Modus aktiv?
  spieler: null,             // Welcher Spieler trainiert?
  startPosition: null,       // Wo steht Freddi?
  updateInterval: null,      // Timer für Updates
  mitSchild: false           // Hat Freddi ein Schild?
};
```

**2. Update-Loop (10x pro Sekunde):**
- Dreht Freddis Kopf zum Spieler
- Checkt alle 2 Sekunden ob Freddi von Position abgewichen ist
- Teleportiert ihn zurück wenn er weggeschoben wird (Knockback)
- Reaktiviert Schild alle 5 Sekunden (nur bei Normal-Modus)

**3. Mathematische Blickrichtung:**
```javascript
// Berechne Yaw (horizontale Drehung)
const yaw = Math.atan2(-dx, -dz);

// Berechne Pitch (vertikale Drehung)
const pitch = -Math.atan2(dy, groundDistance);

// Setze Blickrichtung
bot.look(yaw, pitch, true);
```

**4. Positions-Lock:**
```javascript
// Wenn Freddi > 0.5 Blöcke von Start-Position weg ist:
if (distanz > 0.5) {
  bot.chat(`/tp Freddiiiiii ${startPos.x} ${startPos.y} ${startPos.z}`);
}
```

## 📚 Was du dabei gelernt hast

### Konzepte die wir verwendet haben:

1. **setInterval()** - Timer der Code wiederholt ausführt
   - Wie eine Schleife die alle X Millisekunden läuft
   - Perfekt für kontinuierliche Updates

2. **Trigonometrie (Mathe!)** - Math.atan2() für Blickwinkel
   - Berechnet Winkel zwischen zwei Punkten
   - Damit dreht sich Freddi smooth zu dir

3. **Position.clone()** - Position speichern
   - Merkt sich wo Freddi stehen soll
   - Wichtig damit er zurück teleportiert werden kann

4. **bot.activateItem()** - Item benutzen per Code
   - Wie Rechtsklick halten
   - Damit blockt Freddi mit dem Schild

5. **Conditional Logic** - if/else für verschiedene Modi
   - mitSchild = true → macht Schild-Sachen
   - mitSchild = false → überspringt Schild-Sachen

6. **Try-Catch Blöcke** - Fehlerbehandlung
   - Wenn was schief geht, crasht Freddi nicht
   - Zeigt nur Fehlermeldung

## 🎓 Fortgeschrittene Features

### Smooth Kopfdrehung
- 10 Updates pro Sekunde = flüssige Bewegung
- Berechnet exakte Blickrichtung mathematisch
- Funktioniert auch wenn du springst oder dich bewegst

### Anti-Knockback System
- Checkt Position alle 2 Sekunden
- Wenn > 0.5 Blöcke Abweichung → Teleport zurück
- Freddi bleibt GARANTIERT an Ort und Stelle

### Schild-Persistenz
- Reaktiviert Schild alle 5 Sekunden
- Auch nach Teleport wird Schild reaktiviert
- Freddi blockt IMMER (außer Easy-Modus)

## 🔮 Mögliche Erweiterungen (für später)

Ideen für weitere Modi:

- **Aggressive-Modus:** Freddi greift zurück
- **Dodge-Modus:** Freddi weicht aus (bewegt sich seitwärts)
- **Strafe-Modus:** Freddi läuft um dich herum
- **Combo-Modus:** Freddi macht Angriffs-Kombinationen
- **Schwierigkeits-Level:** Easy, Medium, Hard

## 📋 Zusammenfassung

### Befehle:
- `Freddi, mace` - Normal-Modus (mit Schild)
- `Freddi, mace easy` - Easy-Modus (ohne Schild)
- `Freddi, stop` - Training beenden

### Equipment das du bekommst:
- Mace mit Windburst 3
- Mace mit Windburst 2
- Mace mit Windburst 1
- 64 Wind Charges
- Netherite Boots mit Feather Falling 4
- Unsterblichkeit (Resistance, Regeneration, Health Boost)

### Equipment das Freddi bekommt:
- Shield (nur im Normal-Modus)
- Unsterblichkeit (beide Modi)

### Was beim Stoppen passiert:
- Inventare werden geleert
- Effekte werden entfernt
- Trainingszeit wird angezeigt

---

**🎉 Viel Spaß beim PVP-Training mit Freddi!**

*Erstellt mit ❤️ von Eddie - 14 Jahre - Lerne Programmieren durch Bauen!*
