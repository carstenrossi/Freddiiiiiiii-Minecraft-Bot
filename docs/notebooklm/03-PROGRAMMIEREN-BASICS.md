# Episode 3: Programmieren verstehen - Was es ist und wie es funktioniert

## Teil 1: Was ist Programmieren überhaupt?

### Die einfachste Erklärung

Stell dir vor, du hast einen Roboter-Hund. Er kann laufen, sitzen, bellen - aber nur wenn du ihm sagst wie. Du kannst ihm nicht einfach sagen "Sei ein guter Hund!" - das versteht er nicht. Du musst sehr genau sein: "Bewege dein linkes Vorderbein 10 Zentimeter nach vorne. Dann das rechte Hinterbein. Dann das rechte Vorderbein..."

Das ist anstrengend, oder? Aber stell dir vor, du könntest diese Anweisungen EINMAL aufschreiben, und der Roboter-Hund führt sie immer wieder aus. Das ist Programmieren!

**Programmieren = Anweisungen aufschreiben, die ein Computer ausführen kann.**

### Warum brauchen wir das?

Computer sind unglaublich schnell und machen keine Fehler bei Berechnungen. Aber sie sind auch unglaublich dumm - sie können NICHTS von alleine. Jedes Mal wenn du eine App öffnest, ein Spiel spielst oder eine Website besuchst, führt der Computer Millionen von Anweisungen aus, die irgendwann jemand aufgeschrieben hat.

Minecraft selbst? Millionen Zeilen Code. YouTube? Noch mehr. Selbst der einfachste Taschenrechner auf deinem Handy besteht aus Code.

### Was ist Code?

Code ist einfach Text. Ja, wirklich nur Text! Du schreibst Text in eine Datei, und dieser Text enthält Anweisungen für den Computer.

Hier ist echtes Code-Beispiel aus unserem Projekt:

```javascript
bot.chat("Hallo!");
```

Das ist eine Zeile Code. Sie sagt dem Minecraft-Bot: "Schreibe 'Hallo!' in den Chat."

Das war's! Eine Zeile = eine Anweisung.

### Der Unterschied zu normalem Text

Normaler Text (wie dieser hier) ist für Menschen geschrieben. Der Computer zeigt ihn nur an.

Code ist für den Computer geschrieben. Der Computer LIEST ihn und TUT dann etwas.

Wenn du "Hallo!" in eine Word-Datei schreibst, zeigt der Computer "Hallo!" an.
Wenn du `bot.chat("Hallo!")` in eine Code-Datei schreibst, MACHT der Computer etwas - er lässt den Bot "Hallo!" sagen.

## Teil 2: Was ist eine Programmiersprache?

### Das große Problem

Computer "denken" in Strom. An oder aus. 1 oder 0. Das nennt man Binärcode oder Maschinensprache.

So sieht das Wort "Hi" in Maschinensprache aus:
```
01001000 01101001
```

Stell dir vor, du müsstest ein ganzes Spiel so schreiben. Unmöglich!

### Die Lösung: Eine Sprache dazwischen

Programmiersprachen sind wie eine Brücke. Sie sind:
- Einfach genug, dass Menschen sie schreiben und lesen können
- Strukturiert genug, dass Computer sie verstehen können

Eine Programmiersprache ist also eine Sprache, die BEIDE Seiten verstehen - Menschen UND Computer.

### Eine echte Sprache, mit Regeln

Genau wie Deutsch oder Englisch hat eine Programmiersprache:

**Vokabeln (Wörter die etwas bedeuten):**
- `if` = wenn
- `else` = sonst
- `for` = für (wiederhole)
- `function` = Funktion (Rezept)
- `let` = lass (mache eine Variable)

**Grammatik (Regeln wie man sie kombiniert):**
- Jede Anweisung endet mit `;` (Semikolon) - wie ein Punkt am Satzende
- Zusammengehöriger Code steht in `{ }` (geschweiften Klammern) - wie ein Absatz
- Text steht in `" "` (Anführungszeichen) - damit der Computer weiß, das ist Text, keine Anweisung

**Beispiel:**
```javascript
if (spieler.distanz < 10) {
  bot.chat("Du bist nah!");
}
```

Auf Deutsch: "WENN die Distanz des Spielers kleiner als 10 ist, DANN sage 'Du bist nah!'"

Siehst du? Die Struktur ist ähnlich wie ein deutscher Satz, nur mit anderen Wörtern und Satzzeichen.

### Warum gibt es verschiedene Programmiersprachen?

Es gibt viele verschiedene Programmiersprachen, so wie es verschiedene menschliche Sprachen gibt. Jede hat Stärken:

| Sprache | Wofür typisch? | Fun Fact |
|---------|----------------|----------|
| **JavaScript** | Websites, Apps, Bots | Wir nutzen es für Freddiiiiii! |
| **Python** | KI, Wissenschaft, Anfänger | Sehr einfach zu lesen |
| **Java** | Große Anwendungen | Minecraft ist in Java geschrieben! |
| **C++** | Spiele, schnelle Programme | Die Unreal Engine nutzt es |
| **Swift** | iPhone Apps | Von Apple entwickelt |
| **Scratch** | Anfänger | Blöcke statt Text |

Wir nutzen **JavaScript**, weil:
1. Mineflayer (die Bot-Bibliothek) in JavaScript geschrieben ist
2. Es sehr verbreitet ist - du kannst damit später Websites bauen
3. Die AI (Cursor) JavaScript sehr gut kennt
4. Es relativ einfach zu lesen ist

### Übersetzen von Mensch zu Computer

Wenn du Code schreibst, muss er irgendwie in die Nullen und Einsen übersetzt werden, die der Computer versteht. Das macht ein spezielles Programm automatisch.

Für JavaScript heißt dieses Programm "Node.js". Du schreibst JavaScript-Code, Node.js übersetzt ihn in Maschinensprache, und der Computer führt ihn aus.

Du musst dich um die Übersetzung nicht kümmern - das passiert automatisch wenn du `npm start` tippst!

## Teil 3: Der Weg vom Code zum Ergebnis

### Schritt für Schritt

Was passiert eigentlich, wenn du ein Programm startest? Lass uns das am Beispiel von Freddiiiiii durchgehen:

**1. Du öffnest die Code-Datei (bot-advanced.js)**
Das ist einfach eine Textdatei mit ca. 2500 Zeilen JavaScript-Code.

**2. Du tippst `npm start` im Terminal**
Das sagt: "Hey Computer, führe das Programm aus!"

**3. Node.js liest den Code**
Node.js geht durch jeden Buchstaben deines Codes und versteht was gemeint ist.

**4. Node.js übersetzt und führt aus**
Zeile für Zeile wird übersetzt und der Computer tut, was da steht.

**5. Der Bot verbindet sich mit Minecraft**
Eine der ersten Anweisungen im Code sagt: "Verbinde dich mit dem Minecraft-Server".

**6. Der Bot wartet auf Befehle**
Der Code sagt: "Höre auf Chat-Nachrichten und reagiere darauf".

**7. Du tippst im Minecraft-Chat**
"Freddi, baue einen Turm!"

**8. Der Bot empfängt die Nachricht**
Der Code bemerkt: "Oh, eine Chat-Nachricht! Was steht drin?"

**9. Der Code reagiert**
Die Anweisungen im Code sagen: "Wenn jemand 'baue' sagt, führe die Bau-Funktion aus".

**10. Du siehst das Ergebnis**
Der Bot baut einen Turm! 🏗️

Alles automatisch, alles weil jemand Code geschrieben hat.

### Code ist wie ein Rezept

Ein guter Vergleich: Code ist wie ein Rezept.

**Rezept für Pfannkuchen:**
1. Nimm 200g Mehl
2. Füge 2 Eier hinzu
3. Gieße 300ml Milch dazu
4. Rühre alles zusammen
5. Erhitze die Pfanne
6. Gieße etwas Teig hinein
7. Warte bis die Unterseite goldbraun ist
8. Wende den Pfannkuchen
9. Warte nochmal
10. Fertig!

**Code für einen springenden Bot:**
```javascript
// 1. Warte kurz
await sleep(100);

// 2. Drücke die Sprungtaste
bot.setControlState('jump', true);

// 3. Warte bis der Sprung oben ist
await sleep(300);

// 4. Lasse die Sprungtaste los
bot.setControlState('jump', false);

// 5. Warte bis gelandet
await sleep(200);

// 6. Fertig!
```

Siehst du die Ähnlichkeit? Schritt für Schritt, Anweisung für Anweisung.

## Teil 4: JavaScript - Unsere Programmiersprache

### Warum JavaScript?

JavaScript wurde ursprünglich für Websites erfunden. Heute kann es viel mehr:
- Websites interaktiv machen
- Apps für Handy und Computer
- Server und Backends
- Und: Minecraft Bots!

### Wie JavaScript-Code aussieht

Hier ist ein einfaches Beispiel:

```javascript
let botName = "Freddiiiiii";
bot.chat("Hallo, ich bin " + botName);
```

**Was passiert hier?**

Zeile 1: `let botName = "Freddiiiiii";`
- `let` = "Erstelle einen Speicherplatz"
- `botName` = "Nenne ihn botName"
- `=` = "und speichere darin"
- `"Freddiiiiii"` = "den Text Freddiiiiii"
- `;` = "Ende der Anweisung"

Zeile 2: `bot.chat("Hallo, ich bin " + botName);`
- `bot` = "Der Bot"
- `.chat(...)` = "soll im Chat schreiben"
- `"Hallo, ich bin "` = "diesen Text"
- `+` = "verbunden mit"
- `botName` = "dem was in botName gespeichert ist"

**Ergebnis im Chat:** "Hallo, ich bin Freddiiiiii"

### Die Bausteine von JavaScript

Jedes Programm besteht aus ein paar grundlegenden Bausteinen. Du musst sie jetzt nicht perfekt verstehen - du wirst sie nach und nach lernen!

#### 1. Variablen - Dinge merken

```javascript
let score = 0;           // Eine Zahl merken
let name = "Eddie";      // Einen Text merken
let isAlive = true;      // Wahr oder falsch merken
```

Variablen sind wie beschriftete Boxen. Du gibst ihnen einen Namen und packst etwas rein. Später kannst du nachschauen was drin ist, oder es ändern.

#### 2. Funktionen - Rezepte

```javascript
function sagHallo() {
  bot.chat("Hallo!");
}
```

Eine Funktion ist wie ein Rezept. Du schreibst einmal auf, was passieren soll. Danach kannst du das Rezept immer wieder benutzen, indem du einfach seinen Namen sagst:

```javascript
sagHallo();  // Bot sagt "Hallo!"
sagHallo();  // Bot sagt nochmal "Hallo!"
```

#### 3. Bedingungen - Entscheidungen treffen

```javascript
if (wetter === "sonnig") {
  goOutside();
} else {
  stayHome();
}
```

Der Computer trifft Entscheidungen: WENN etwas wahr ist, TUE das, SONST tue etwas anderes.

In Minecraft-Bot-Code:
```javascript
if (bot.health < 5) {
  bot.chat("Ich brauche Hilfe, nur noch wenig Leben!");
} else {
  bot.chat("Mir geht's gut!");
}
```

#### 4. Schleifen - Dinge wiederholen

```javascript
for (let i = 0; i < 5; i++) {
  bot.chat("Sprung!");
  bot.setControlState('jump', true);
}
```

Statt fünfmal das Gleiche zu schreiben, sagst du "mache das 5 mal".

#### 5. Events - Auf Dinge reagieren

```javascript
bot.on('chat', (username, message) => {
  bot.chat("Ich habe gehört: " + message);
});
```

Der Code wartet darauf, dass etwas passiert (jemand chattet), und reagiert dann.

### Kommentare - Notizen für Menschen

Im Code kannst du Notizen schreiben, die der Computer ignoriert:

```javascript
// Das ist ein Kommentar - der Computer ignoriert das
let playerCount = 5; // Das hier auch

/*
  Das ist ein langer Kommentar
  über mehrere Zeilen.
  Praktisch für Erklärungen!
*/
```

Kommentare helfen dir (und anderen) zu verstehen, was der Code macht. Cursor wird viele Kommentare schreiben, damit du den Code verstehst!

## Teil 5: Das Terminal - Dein Kommandozentrum

### Was ist das Terminal?

Wenn du deinen Computer normal benutzt, klickst du auf Symbole und Fenster. Das Terminal ist anders: Du tippst Textbefehle, und der Computer antwortet mit Text.

Das klingt altmodisch, aber das Terminal ist mächtig! Programmierer nutzen es ständig.

### Warum brauchen wir das Terminal?

1. **Programme starten**: Um Freddiiiiii zu starten, tippst du `npm start`
2. **Pakete installieren**: Um Bibliotheken zu laden, tippst du `npm install`
3. **Ordner navigieren**: Um in verschiedene Ordner zu wechseln
4. **Fehlermeldungen sehen**: Wenn etwas schief geht, zeigt das Terminal was los ist

### Das Terminal in Cursor öffnen

Gute Nachricht: Du musst kein extra Programm öffnen! Cursor hat ein eingebautes Terminal.

**So öffnest du es:**
- Menü: View → Terminal
- Oder: Tastenkürzel `Ctrl + ö` (Windows/Linux) bzw. `Ctrl + Backtick` (Mac)

Das Terminal erscheint unten im Cursor-Fenster.

### Die wichtigsten Befehle

Du musst nur ein paar Befehle kennen:

#### Programm starten
```bash
npm start
```
Startet den Bot.

#### Programm stoppen
```
Ctrl + C
```
Drücke diese Tastenkombination um ein laufendes Programm zu stoppen.

#### Pakete installieren
```bash
npm install
```
Lädt alle benötigten Bibliotheken herunter.

#### Wo bin ich?
```bash
pwd
```
Zeigt in welchem Ordner du bist. Beispiel-Ausgabe: `/Users/eddie/mineflayer`

#### Was ist hier?
```bash
ls
```
Zeigt alle Dateien im aktuellen Ordner.

#### Ordner wechseln
```bash
cd docs
```
Wechselt in den Ordner "docs".

```bash
cd ..
```
Geht einen Ordner nach oben (zurück).

### Der typische Arbeitsablauf

1. **Terminal öffnen** (in Cursor)
2. **`npm start` tippen** - Bot startet
3. **In Minecraft testen** - Funktioniert es?
4. **`Ctrl + C` drücken** - Bot stoppen
5. **Code ändern** - In Cursor
6. **Speichern** - Cmd/Ctrl + S
7. **`npm start` tippen** - Bot mit Änderungen starten
8. **Wiederholen!**

## Teil 6: Dateien und Ordner

### Was ist ein Projekt?

Ein Programmierprojekt ist ein Ordner mit allen Dateien die zusammengehören. Unser Freddiiiiii-Projekt ist ein Ordner namens "mineflayer" mit vielen Dateien drin.

### Dateiendungen

Die Endung einer Datei (nach dem Punkt) sagt, was für eine Datei es ist:

| Endung | Bedeutung | Beispiel |
|--------|-----------|----------|
| `.js` | JavaScript Code | bot-advanced.js |
| `.json` | Daten/Konfiguration | package.json |
| `.md` | Dokumentation (Markdown) | README.md |

### Unser Projekt-Ordner

```
mineflayer/
├── bot-advanced.js       ← HAUPTDATEI! Hier arbeitest du
├── spatial-intelligence.js
├── minecraft-ai-knowledge.js
├── template-loader.js
├── build-executor.js
├── build-site-finder.js
├── package.json          ← Projekt-Konfiguration
├── node_modules/         ← Heruntergeladene Pakete (groß!)
├── docs/                 ← Dokumentation
│   └── notebooklm/      ← Diese Lern-Materialien!
└── templates/            ← Bau-Vorlagen
```

Die wichtigste Datei für dich: **bot-advanced.js** - hier steht der Haupt-Code!

## Teil 7: Fehler sind normal!

### Jeder macht Fehler

Wenn du programmierst, wirst du Fehler machen. Das ist völlig normal! Selbst Profis machen ständig Fehler. Der Unterschied: Sie wissen, wie man sie findet und behebt.

### Arten von Fehlern

**Tippfehler (Syntaxfehler):**
```javascript
// Falsch - 'consol' statt 'console'
consol.log("Hallo");

// Richtig
console.log("Hallo");
```
Der Computer versteht 'consol' nicht und beschwert sich.

**Logikfehler:**
```javascript
// Du wolltest 5 mal springen, aber...
for (let i = 0; i <= 5; i++) {
  // Das sind 6 Sprünge! (0, 1, 2, 3, 4, 5)
}
```
Der Code läuft, macht aber nicht was du wolltest.

**Laufzeitfehler:**
```javascript
// Der Spieler existiert nicht
let pos = spieler.position;  // CRASH!
```
Der Code stürzt ab während er läuft.

### Fehlermeldungen lesen

Wenn etwas schief geht, zeigt das Terminal eine Fehlermeldung. Sie sieht gruselig aus, aber sie hilft dir!

```
TypeError: Cannot read property 'position' of undefined
    at bot-advanced.js:127:15
```

Das bedeutet:
- **TypeError** = Art des Fehlers
- **Cannot read property 'position'** = Was schief ging (Position kann nicht gelesen werden)
- **of undefined** = Weil das Objekt nicht existiert
- **bot-advanced.js:127:15** = In Datei "bot-advanced.js", Zeile 127, Zeichen 15

### Cursor hilft bei Fehlern!

Wenn du einen Fehler bekommst, frag einfach Cursor:
```
Ich bekomme diesen Fehler: [Fehlermeldung]
Was bedeutet das und wie fixe ich es?
```

Cursor erklärt den Fehler und hilft dir ihn zu beheben!

## Zusammenfassung

Was du in dieser Episode gelernt hast:

✅ **Programmieren** = Anweisungen aufschreiben, die ein Computer ausführt

✅ **Code** = Text in einer Datei, der Anweisungen enthält

✅ **Programmiersprache** = Sprache die Menschen UND Computer verstehen

✅ **JavaScript** = Die Programmiersprache die wir nutzen

✅ **Node.js** = Das Programm das JavaScript ausführt

✅ **Terminal** = Textbasierte Steuerung (npm start, Ctrl+C)

✅ **Projekt** = Ordner mit allen Code-Dateien

✅ **Fehler** = Normal! Cursor hilft beim Fixen

## Was kommt als Nächstes?

In Episode 4 lernst du Cursor kennen - deine Entwicklungsumgebung und deinen AI-Partner. Das ist das Werkzeug, mit dem du arbeiten wirst, und es ist speziell für dich konfiguriert!

---

**Weiter zu Episode 4: Cursor - Deine AI-Entwicklungsumgebung!**
