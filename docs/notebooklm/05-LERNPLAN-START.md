# Episode 5: Los geht's - Der Lernplan und dein erstes Feature

## Du bist bereit!

Nach den ersten vier Episoden weißt du:
- Was Freddiiiiii ist und kann (Episode 1)
- Welche Technologien wir nutzen (Episode 2)
- Was Programmieren und Terminal bedeuten (Episode 3)
- Wie Cursor dein AI-Partner wird (Episode 4)

Jetzt wird's praktisch! Zeit für echten Code!

## Der Lernplan: Die 15-Feature-Challenge

Unser Ziel: Du baust in 3-4 Wochen 15 Features für Freddiiiiii. Jedes Feature bringt dir neue Fähigkeiten bei.

### Warum 15 Features?

- **5 Features** = Du verstehst die Basics
- **10 Features** = Du kannst selbstständig arbeiten
- **15 Features** = Du bist bereit für eigene Ideen

### Die Progression

**Woche 1: Chat & Bewegung (Feature 1-5)**
Einfache Features die schnelle Erfolge bringen. Du lernst wie das System funktioniert.

**Woche 2: Bauen & Interagieren (Feature 6-10)**
Komplexere Features mit Blöcken und Entities. Du lernst Schleifen und Koordinaten.

**Woche 3: Intelligentes Verhalten (Feature 11-15)**
Richtig coole Features mit Logik und Automatisierung. Du kombinierst alles Gelernte.

## Tag 1: Setup und Test

Bevor wir Features bauen, stellen wir sicher dass alles läuft.

### Schritt 1: Projekt öffnen
Öffne den Freddiiiiii-Ordner in Cursor. Du solltest die Dateien links sehen.

### Schritt 2: Dependencies installieren
Öffne das Terminal in Cursor und tippe:
```bash
npm install
```

Warte bis es fertig ist. Du siehst viele Zeilen Text - das sind die Pakete die installiert werden.

### Schritt 3: Minecraft Server starten
Starte deinen Minecraft Server (in einem anderen Fenster). Er muss laufen bevor wir weitermachen.

### Schritt 4: Bot starten
Im Cursor-Terminal:
```bash
npm start
```

Du solltest sehen:
```
✅ Bot ist verbunden und gespawnt!
Position: (X, Y, Z)
```

### Schritt 5: In Minecraft testen
Öffne Minecraft und verbinde dich mit dem Server (Multiplayer → localhost). Du solltest Freddiiiiii sehen!

Tippe im Chat:
```
Hallo
```

Freddiiiiii antwortet! Teste noch:
```
komm zu mir
scan
```

Wenn das klappt: Perfekt! Wenn nicht: Frag Cursor im Chat was falsch sein könnte.

## Dein erstes Feature: "High Five"

Jetzt bauen wir gemeinsam dein erstes Feature. Etwas ganz Einfaches zum Warmwerden.

### Was soll passieren?
Wenn jemand "high five" im Chat schreibt, antwortet der Bot mit "✋ High Five zurück!"

### Der Prozess

**1. Öffne bot-advanced.js**
Klicke links auf die Datei bot-advanced.js. Das ist unsere Hauptarbeitsdatei (ca. 2490 Zeilen!).

**2. Öffne den Composer**
Drücke Cmd/Ctrl + I oder klicke auf das Composer-Symbol.

**3. Beschreibe dein Feature**
Tippe diesen Prompt:

```
Ich möchte ein einfaches "high five" Feature hinzufügen.

Wenn jemand "high five" im Chat schreibt, soll Freddiiiiii 
mit "✋ High Five zurück!" antworten.

Füge das an der richtigen Stelle in bot-advanced.js ein.
Erkläre mir danach was du gemacht hast.
```

**4. Cursor schreibt Code**
Cursor wird Code vorschlagen. Er zeigt dir genau welche Zeilen hinzugefügt werden.

**5. Bestätige**
Wenn der Code gut aussieht (lies ihn!), bestätige die Änderung.

**6. Speichern**
Drücke Cmd/Ctrl + S zum Speichern.

**7. Bot neu starten**
Im Terminal: Erst Ctrl + C (stoppt den Bot), dann `npm start`.

**8. Testen!**
In Minecraft: Tippe "high five" im Chat.

**Wenn es funktioniert:** 🎉 Du hast gerade programmiert!

### Was ist passiert?

Jetzt kommt der wichtige Teil: VERSTEHEN was du gebaut hast.

Öffne den Cursor Chat und frage:
```
Erkläre mir Zeile für Zeile was wir gerade hinzugefügt haben.
Ich bin Anfänger.
```

Cursor wird erklären:
- Wo der Code eingefügt wurde
- Wie der Bot Chat-Nachrichten erkennt
- Wie er antwortet
- Welche Konzepte du dabei genutzt hast

**Schreib es auf!** Öffne eine neue Datei (EDDIES-JOURNAL.md) und notiere:
- Datum
- Feature-Name
- Was du gelernt hast
- Was unklar war

## Feature 2: "Dance"

Jetzt etwas mit Bewegung!

### Was soll passieren?
Bei "dance" oder "tanz" springt der Bot 3 mal.

### Der Prompt
```
Ich möchte ein "dance" Feature hinzufügen.

Wenn jemand "dance" oder "tanz" schreibt, soll Freddiiiiii 
3 mal hintereinander springen.

Nutze bot.setControlState für die Sprünge.
Füge es zu bot-advanced.js hinzu.
Erkläre mir was eine for-Schleife ist.
```

### Der Lernpunkt
Dieses Feature bringt dir:
- For-Schleifen (etwas mehrmals tun)
- Bot-Steuerung (Tasten "drücken")
- Timing/Pausen zwischen Aktionen

### Testen und verstehen
1. Bot neu starten
2. "dance" im Chat
3. Bot springt!
4. Cursor fragen was der Code macht
5. Im Journal notieren

## Die Feature-Karte

Für jedes Feature solltest du diese "Karte" durchgehen:

```
Feature: [Name]
━━━━━━━━━━━━━━━━━━━━━━━━━━━━

📝 BESCHREIBUNG
Was soll passieren?

🎯 PROMPT AN CURSOR
Was fragst du?

✅ TESTEN
Wie testest du es?

🧠 VERSTEHEN
Welche Fragen stellst du an Cursor?

📓 JOURNAL
Was hast du gelernt?

💪 CHALLENGE
Kannst du es erweitern?

━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

## Die 15 Features im Überblick

Hier ist deine Roadmap. Du musst nicht alle Details jetzt verstehen - wir machen eins nach dem anderen.

### Woche 1: Basics

**Feature 1: High Five** ✅ (gerade gemacht!)
- Einfache Chat-Antwort
- Lernpunkt: Wie Chat funktioniert

**Feature 2: Dance** ✅ (gerade gemacht!)
- Bot springt mehrmals
- Lernpunkt: Schleifen, Bot-Steuerung

**Feature 3: Zufälliger Witz**
- Bot erzählt einen zufälligen Witz aus einer Liste
- Lernpunkt: Arrays, Zufallszahlen

**Feature 4: Position merken (Home)**
- Bot speichert Position als "Home"
- "go home" → Bot geht dahin
- Lernpunkt: Variablen, Koordinaten

**Feature 5: Aktuelle Zeit**
- Bot sagt Tageszeit in Minecraft
- Lernpunkt: Spielwelt-Informationen abrufen

### Woche 2: Interaktion

**Feature 6: Pyramide bauen**
- Bot baut kleine Pyramide aus Blöcken
- Lernpunkt: Verschachtelte Schleifen, Block-Platzierung

**Feature 7: Aufräumen**
- Bot sammelt Items vom Boden
- Lernpunkt: Entity-Erkennung, Inventory

**Feature 8: Beschützer-Modus**
- Bot greift aggressive Mobs in der Nähe an
- Lernpunkt: Entity-Filter, Kampf-System

**Feature 9: Echo (Nachsprechen)**
- Bot wiederholt was du sagst
- Lernpunkt: String-Manipulation

**Feature 10: Countdown**
- Bot zählt von 10 runter mit Ansage
- Lernpunkt: Timing, Async/Await

### Woche 3: Komplex

**Feature 11: Brücke bauen**
- Bot baut Brücke über Lücke
- Lernpunkt: Umgebungserkennung, Logik

**Feature 12: Nachtmodus**
- Bot verhält sich anders bei Nacht
- Lernpunkt: Bedingungen, Tageszeit

**Feature 13: Ressourcen-Zähler**
- Bot sagt wie viel er von etwas im Inventar hat
- Lernpunkt: Inventar durchsuchen

**Feature 14: Fackel-Linie**
- Bot platziert Fackeln im Abstand
- Lernpunkt: Präzise Platzierung

**Feature 15: Dein eigenes Feature!**
- Du denkst dir etwas aus
- Lernpunkt: Alles kombinieren

## Der tägliche Rhythmus

### Empfohlener Ablauf (1-2 Stunden)

**Erste 10 Minuten: Setup**
- Cursor öffnen
- Bot starten
- Minecraft starten

**Nächste 30-45 Minuten: Feature bauen**
- Feature-Karte durchgehen
- Mit Cursor zusammen coden
- Testen

**Nächste 15 Minuten: Verstehen**
- Cursor fragen was du gebaut hast
- Unklarheiten klären
- Journal schreiben

**Letzte 10 Minuten: Vorausschauen**
- Was machst du morgen?
- Was willst du noch lernen?

### Tipps für gutes Lernen

**1. Nicht zu viel auf einmal**
Ein Feature pro Session ist okay! Lieber eins richtig verstehen als drei oberflächlich.

**2. Pausen machen**
Wenn es nicht klappt: Pause! Oft kommt die Lösung wenn du nicht dran denkst.

**3. Fehler sind Freunde**
Jeder Fehler ist eine Lernchance. Nicht frustriert sein!

**4. Experimentieren**
Ändere den Code und schau was passiert. Kann nicht viel kaputtgehen!

**5. Journal führen**
Aufschreiben hilft beim Lernen und du siehst deinen Fortschritt.

## Die Verstehens-Checkliste

Nach jedem Feature, frag dich:

- [ ] Kann ich erklären was der Code macht? (ohne Cursor)
- [ ] Verstehe ich WARUM es so funktioniert?
- [ ] Könnte ich etwas Ähnliches selbst starten?
- [ ] Habe ich mindestens eine neue Sache gelernt?
- [ ] Habe ich es im Journal notiert?

Wenn du bei einem Punkt "Nein" sagst: Frag Cursor nochmal!

## Dein Lern-Journal

Erstelle eine Datei namens `EDDIES-JOURNAL.md` im Projekt. Hier ein Template:

```markdown
# Eddie's Lern-Journal

## Tag 1 - [Datum]

### Feature: High Five
Was es macht: Bot sagt "High Five zurück" wenn man "high five" schreibt.

Was ich gelernt habe:
- Wie man Chat-Nachrichten erkennt
- bot.on('chat', ...) empfängt Nachrichten
- bot.chat("text") sendet Nachrichten

Was ich noch nicht ganz verstehe:
- Warum da "async" steht

Nächstes Mal:
- Dance-Feature bauen!

---

## Tag 2 - [Datum]
...
```

## Zusammenfassung

- **15-Feature-Challenge**: Dein Lernpfad
- **Heute geschafft**: High Five und Dance Feature!
- **Der Rhythmus**: Bauen → Testen → Verstehen → Journal
- **Wichtig**: Ein Feature richtig > Drei Features oberflächlich
- **Journal führen**: Hilft beim Lernen

## Was kommt als Nächstes?

Ab jetzt machst DU! In Episode 6 gehen wir tiefer in JavaScript-Konzepte - aber du wirst sie schon aus deinen Features kennen.

Die nächsten Features kannst du selbstständig mit Cursor bauen. Du weißt jetzt wie:
1. Feature beschreiben (Prompt)
2. Cursor Code schreiben lassen
3. Testen
4. Verstehen lassen
5. Journal schreiben

Viel Erfolg bei den nächsten Features! Du schaffst das! 💪

---

**Weiter zu Episode 6: JavaScript-Konzepte die du jetzt schon nutzt!**
