# Episode 4: Cursor - Dein AI-Partner zum Programmieren

## Was ist Cursor?

Cursor ist ein Code-Editor - also ein Programm zum Schreiben von Code. Aber es ist viel mehr als das! Cursor hat eine eingebaute künstliche Intelligenz, die dir beim Programmieren hilft.

Stell dir vor, du hättest einen erfahrenen Programmierer neben dir sitzen, der:
- Dir Code erklärt
- Fehler findet und korrigiert
- Code für dich schreibt, wenn du beschreibst was du willst
- Deine Fragen beantwortet

Das ist Cursor!

## Warum nicht einfach ein normaler Editor?

Früher haben Programmierer mit einfachen Texteditoren gearbeitet. Sie mussten alles selbst wissen und tippen. Das dauerte lange und war fehleranfällig.

Dann kamen "Intelligente Editoren" wie Visual Studio Code. Die hatten Autovervollständigung und Fehlererkennung. Besser!

Jetzt gibt es AI-Editoren wie Cursor. Die verstehen was du TUST und können dir aktiv helfen. Das ist ein Quantensprung!

### Der Unterschied in der Praxis

**Normaler Editor:**
Du tippst: `function bau`
Editor macht: nichts

**Visual Studio Code:**
Du tippst: `function bau`
Editor schlägt vor: `function` (Syntaxvervollständigung)

**Cursor:**
Du schreibst: "Ich möchte eine Funktion die einen Turm baut"
Cursor schreibt: Die komplette Funktion, mit Kommentaren, fertig zum Benutzen!

## Die vier Superkräfte von Cursor

Cursor hat vier Haupt-Features, die du kennen solltest:

### 1. Chat - Dein AI-Gesprächspartner

Der Chat ist wie ChatGPT, aber direkt in deinem Editor. Du kannst:
- Fragen stellen ("Was macht diese Funktion?")
- Erklärungen bekommen ("Erkläre mir async/await")
- Debugging-Hilfe holen ("Warum funktioniert das nicht?")

Der Unterschied zu ChatGPT: Der Cursor-Chat SIEHT deinen Code! Du musst nicht alles kopieren und einfügen. Die AI weiß was in deinen Dateien steht.

**Öffnen:** Rechte Sidebar oder Cmd/Ctrl + L

### 2. Composer - Der Code-Generator

Wenn du mehr willst als nur Fragen stellen, nutzt du den Composer. Du beschreibst was du möchtest, und Cursor schreibt (oder ändert) den Code.

Beispiel:
"Füge eine neue Funktion hinzu die den Bot 5 mal springen lässt"

Cursor:
- Findet die richtige Stelle im Code
- Schreibt die Funktion
- Zeigt dir was geändert wurde
- Du bestätigst mit einem Klick

**Öffnen:** Cmd/Ctrl + I

### 3. Tab - Der Gedankenleser

Während du tippst, versucht Cursor zu erraten was du als nächstes schreiben willst. Du tippst ein paar Zeichen, und Cursor schlägt den Rest vor.

Du tippst: `function buil`
Cursor schlägt vor: `function buildPyramid() { ... }`

Drückst du Tab, wird der Vorschlag übernommen. Passt er nicht, tippst du einfach weiter.

Das Besondere: Cursor schlägt nicht nur einzelne Wörter vor, sondern ganze Codeblöcke!

### 4. Agent - Der selbstständige Helfer

Der Agent ist wie Composer, aber selbstständiger. Du gibst ein Ziel vor, und der Agent arbeitet es ab - er macht mehrere Schritte automatisch.

Beispiel:
"Analysiere alle Intent-Typen in bot-advanced.js und erstelle eine Dokumentation"

Der Agent:
- Öffnet die Datei
- Liest den Code
- Findet alle Intents
- Erstellt die Dokumentation
- Alles automatisch!

## Cursor für Eddie eingerichtet

Für dieses Projekt haben wir Cursor speziell für dich konfiguriert! 

### Die .cursor/rules Dateien

Im Projekt-Ordner gibt es versteckte Dateien die Cursor Anweisungen geben:

**eddie-learning.mdc:**
- Cursor weiß, dass du 14 bist und Anfänger
- Erklärt alles extra verständlich
- Nutzt Minecraft-Beispiele
- Gibt Ermutigungen und feiert Erfolge

**intent-system.mdc:**
- Zeigt dir genau wo du Features hinzufügst
- Gibt dir Templates zum Kopieren
- Erklärt Bot-Funktionen

Das bedeutet: Cursor ist DEIN persönlicher Lern-Coach!

## So nutzt du Cursor - Praktisch

### Ein typischer Tag mit Cursor

**Morgens - Feature planen:**
1. Öffne den Chat
2. Frage: "Ich möchte ein Feature bauen das [Beschreibung]. Wie könnte ich das angehen?"
3. Cursor gibt dir einen Plan

**Dann - Code schreiben:**
1. Öffne den Composer
2. Beschreibe das Feature
3. Cursor schreibt den Code
4. Du liest und verstehst ihn

**Testen:**
1. Terminal öffnen
2. `npm start`
3. In Minecraft testen
4. Funktioniert es?

**Bei Problemen:**
1. Fehlermeldung kopieren
2. Chat fragen: "Ich bekomme diesen Fehler: [Fehler]. Was ist das Problem?"
3. Cursor erklärt und hilft fixen

**Verstehen:**
1. Nach dem Feature: Chat fragen "Erkläre mir was wir gerade gebaut haben"
2. Cursor erklärt Zeile für Zeile
3. Du schreibst in dein Journal was du gelernt hast

### Die besten Prompts für Cursor

**Für neue Features:**
```
Ich möchte ein Feature hinzufügen: [Beschreibung]
Füge es zu bot-advanced.js hinzu.
Erkläre mir jeden Schritt nach dem Code.
```

**Für Erklärungen:**
```
Erkläre mir was diese Funktion macht:
[Code markieren]
Ich bin 14 und lerne JavaScript.
```

**Für Fehler:**
```
Ich bekomme diesen Fehler: [Fehlermeldung]
Das passiert wenn ich [was du gemacht hast].
Was ist das Problem und wie fixe ich es?
```

**Für Konzepte:**
```
Was bedeutet "async/await" in JavaScript?
Erkläre es mit einem Minecraft-Beispiel.
```

## Vibe Coding - Die neue Art zu Programmieren

Was wir hier machen, nennt sich "Vibe Coding". Das bedeutet:

### Der alte Weg (2020):
1. Tutorial lesen
2. Theorie verstehen
3. Selbst programmieren
4. Bei Fehlern googeln
5. Stundenlang debuggen

### Der neue Weg - Vibe Coding (2026):
1. Beschreibe was du willst
2. AI schreibt Code
3. Du testest (Erfolgserlebnis!)
4. AI erklärt was passiert ist
5. Du verstehst und lernst

Der Unterschied: Du hast SOFORT Erfolge! Du baust zuerst, verstehst dann. Das macht mehr Spaß und motiviert weiterzulernen.

### Wichtig: Verstehen, nicht nur Nutzen!

Vibe Coding heißt NICHT: "AI macht alles, ich muss nichts lernen."

Es heißt: "AI hilft mir schneller zu bauen, aber ich verstehe was ich baue."

Deshalb:
- Lies immer den Code den Cursor schreibt
- Frag nach wenn du etwas nicht verstehst
- Schreib auf was du lernst
- Manchmal probiere ohne AI zu schreiben

Du bist der Pilot, Cursor ist der Co-Pilot!

## Die Cursor-Oberfläche kennenlernen

### Links: Die Seitenleiste
- Dateien durchsuchen
- Suchen im Projekt
- Git-Integration (dazu später)

### Mitte: Der Editor
- Hier schreibst und liest du Code
- Syntax-Highlighting (verschiedene Farben für verschiedene Elemente)
- Zeilennummern links

### Rechts: Chat und Context
- Cursor Chat für Gespräche mit der AI
- Zeigt was die AI "sieht"

### Unten: Terminal und Output
- Terminal für Befehle
- Fehlermeldungen
- Console-Output vom Bot

### Oben: Menü und Tabs
- Menü für alle Funktionen
- Tabs für offene Dateien (wie im Browser)

## Tastenkürzel die du brauchst

Du musst nicht alle lernen, aber diese sind praktisch:

### Die wichtigsten:
- `Cmd/Ctrl + L` - Chat öffnen
- `Cmd/Ctrl + I` - Composer öffnen
- `Cmd/Ctrl + S` - Speichern
- `Ctrl + Backtick` - Terminal öffnen/schließen

### Für Navigation:
- `Cmd/Ctrl + P` - Schnell Datei öffnen
- `Cmd/Ctrl + F` - Suchen in Datei
- `Cmd/Ctrl + Shift + F` - Suchen im gesamten Projekt

### Für Code:
- `Tab` - AI-Vorschlag akzeptieren
- `Cmd/Ctrl + Z` - Rückgängig
- `Cmd/Ctrl + Shift + Z` - Wiederherstellen

## Der Unterschied zu ChatGPT

Du denkst vielleicht: "Ich könnte doch auch ChatGPT nutzen?"

Ja, aber Cursor hat Vorteile:

### Cursor weiß mehr
ChatGPT kennt dein Projekt nicht. Du müsstest immer erklären: "Ich habe eine Datei bot-advanced.js mit folgendem Inhalt..."

Cursor SIEHT dein Projekt. Es weiß welche Dateien du hast, was drinsteht, wo du gerade arbeitest.

### Cursor ändert direkt
Bei ChatGPT kopierst du Code hin und her. Cursor ändert deine Dateien direkt!

### Cursor versteht den Kontext
Wenn du sagst "ändere das", weiß Cursor was "das" ist - die Funktion die du gerade anschaust.

### Cursor ist spezialisiert
ChatGPT kann alles mögliche. Cursor ist spezialisiert auf Programmieren und deshalb besser darin.

## Zusammenfassung

- **Cursor** = AI-gestützter Code-Editor
- **Chat** = Für Fragen und Erklärungen (Cmd/Ctrl + L)
- **Composer** = Für Code-Generierung (Cmd/Ctrl + I)
- **Tab** = Für Auto-Vervollständigung (Tab-Taste)
- **Agent** = Für größere selbstständige Tasks
- **Vibe Coding** = Bauen → Verstehen (nicht andersrum!)
- **Für Eddie konfiguriert** = Cursor weiß dass du Anfänger bist

## Was kommt als Nächstes?

Jetzt hast du alles verstanden:
- Das Projekt (Episode 1)
- Das Setup (Episode 2)
- Programmier-Basics (Episode 3)
- Cursor (Episode 4)

In Episode 5 geht es endlich los: Dein erster Code, dein erstes Feature, dein erster Erfolg!

---

**Weiter zu Episode 5: Los geht's - Dein erstes Feature!**
