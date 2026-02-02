# Episode 6: JavaScript-Konzepte - Einfach erklärt mit Minecraft-Beispielen

## Du lernst durch Bauen

In dieser Episode erklären wir die wichtigsten JavaScript-Konzepte. Keine Sorge - du musst nicht alles auswendig lernen! Du wirst diese Konzepte automatisch verstehen, wenn du Features baust. Diese Episode ist zum Nachschlagen da.

Jedes Konzept erklären wir mit:
1. Einer Alltagsanalogie (damit du es dir vorstellen kannst)
2. Einem einfachen Code-Beispiel
3. Einem Minecraft-Bot-Beispiel (so nutzen wir es wirklich)

---

## Konzept 1: Variablen - Dinge merken

### Die Alltagsanalogie

Stell dir beschriftete Boxen vor. Du hast eine Box mit der Aufschrift "Lieblingsspiel" und legst "Minecraft" rein. Später kannst du nachschauen was drin ist, oder den Inhalt ändern.

```
📦 [Lieblingsspiel] → "Minecraft"
📦 [Alter] → 14
📦 [MagKäse] → ja
```

### Das ist eine Variable

Eine Variable ist ein Speicherplatz mit einem Namen. Du speicherst etwas darin und kannst später darauf zugreifen.

### So schreibst du es in JavaScript

```javascript
let lieblingsspiel = "Minecraft";
let alter = 14;
let magKaese = true;
```

**Die drei Teile:**
1. `let` = "Erstelle eine neue Box"
2. `lieblingsspiel` = Der Name der Box (denkst du dir aus)
3. `= "Minecraft"` = Was du reinlegst

### Werte ändern

Du kannst den Inhalt später ändern:

```javascript
let punkte = 0;        // Am Anfang: 0 Punkte
punkte = punkte + 10;  // Jetzt: 10 Punkte
punkte = punkte + 5;   // Jetzt: 15 Punkte
```

### let vs const

- `let` = Box deren Inhalt sich ändern kann
- `const` = Box deren Inhalt sich NIE ändert

```javascript
let score = 0;        // Kann sich ändern
const PI = 3.14159;   // Bleibt für immer so
```

### Im Minecraft-Bot

```javascript
// Position merken
let homePosition = bot.entity.position;

// Später zurückgehen
geheZuPosition(homePosition);
```

```javascript
// Zählen wie oft der Bot gesprungen ist
let sprungZaehler = 0;

// Nach jedem Sprung
sprungZaehler = sprungZaehler + 1;
bot.chat("Ich bin " + sprungZaehler + " mal gesprungen!");
```

---

## Konzept 2: Datentypen - Verschiedene Arten von Daten

### Die Alltagsanalogie

Nicht alles ist gleich. Eine Zahl ist anders als ein Text ist anders als Ja/Nein. Der Computer muss wissen, womit er arbeitet.

### Die wichtigsten Typen

#### Text (String)
Text steht immer in Anführungszeichen:
```javascript
let name = "Eddie";
let nachricht = "Hallo Welt!";
let emoji = "🎮";
```

#### Zahl (Number)
Zahlen stehen OHNE Anführungszeichen:
```javascript
let alter = 14;
let temperatur = -5;
let pi = 3.14;
```

**Achtung auf den Unterschied!**
```javascript
let zahl = 42;      // Das ist eine ZAHL (man kann rechnen)
let text = "42";    // Das ist TEXT (man kann nicht rechnen)
```

#### Ja/Nein (Boolean)
Nur zwei mögliche Werte:
```javascript
let spieltMinecraft = true;   // ja
let istMuede = false;         // nein
```

#### Liste (Array)
Mehrere Dinge zusammen:
```javascript
let freunde = ["Max", "Anna", "Tom"];
let zahlen = [1, 2, 3, 4, 5];
let gemischt = ["Text", 42, true];
```

Du greifst auf Elemente mit ihrer Position zu (Achtung: zählt ab 0!):
```javascript
let freunde = ["Max", "Anna", "Tom"];
//              [0]     [1]     [2]

console.log(freunde[0]);  // "Max"
console.log(freunde[1]);  // "Anna"
console.log(freunde[2]);  // "Tom"
```

#### Objekt (Object)
Mehrere benannte Eigenschaften zusammen:
```javascript
let spieler = {
  name: "Eddie",
  alter: 14,
  level: 25,
  istOnline: true
};

console.log(spieler.name);   // "Eddie"
console.log(spieler.level);  // 25
```

### Im Minecraft-Bot

```javascript
// String für Chat-Nachrichten
bot.chat("Hallo zusammen!");

// Number für Koordinaten
let x = 100;
let y = 64;
let z = -200;

// Boolean für Zustände
let istVerbunden = true;
let hatHunger = bot.food < 10;

// Array für Witz-Liste
const witze = [
  "Warum können Creeper nicht tanzen? Sie explodieren vor Aufregung!",
  "Was sagt ein Enderman zum anderen? Schau mir in die Augen, Kleines!",
  "Warum sind Zombies schlechte Köche? Das Essen ist immer tot."
];

// Zufälligen Witz auswählen
let index = Math.floor(Math.random() * witze.length);
bot.chat(witze[index]);
```

---

## Konzept 3: Funktionen - Wiederverwendbare Rezepte

### Die Alltagsanalogie

Ein Rezept schreibst du einmal auf, und du kannst es immer wieder benutzen. Du sagst nicht jedes Mal "nimm Mehl, nimm Eier, rühre..." - du sagst einfach "mach Pfannkuchen".

Eine Funktion ist wie ein Rezept: Du schreibst einmal auf was passieren soll, gibst dem Ganzen einen Namen, und kannst es dann immer wieder aufrufen.

### So schreibst du eine Funktion

```javascript
function sagHallo() {
  console.log("Hallo!");
  console.log("Wie geht's?");
}
```

**Die Teile:**
1. `function` = "Ich definiere ein Rezept"
2. `sagHallo` = Der Name (denkst du dir aus)
3. `()` = Hier könnten Zutaten rein (Parameter)
4. `{ ... }` = Das Rezept selbst (was passieren soll)

### Funktion aufrufen

```javascript
sagHallo();  // Führt die Funktion aus
sagHallo();  // Nochmal!
sagHallo();  // Und nochmal!
```

### Parameter - Zutaten fürs Rezept

Manchmal braucht dein Rezept Zutaten:

```javascript
function begruessung(name) {
  console.log("Hallo " + name + "!");
}

begruessung("Eddie");   // "Hallo Eddie!"
begruessung("Anna");    // "Hallo Anna!"
begruessung("Max");     // "Hallo Max!"
```

Mit mehreren Parametern:

```javascript
function addiere(a, b) {
  console.log(a + b);
}

addiere(5, 3);    // 8
addiere(10, 20);  // 30
```

### Rückgabewert - Das Ergebnis

Manchmal soll die Funktion ein Ergebnis zurückgeben:

```javascript
function verdopple(zahl) {
  return zahl * 2;
}

let ergebnis = verdopple(5);  // ergebnis = 10
let anderes = verdopple(7);   // anderes = 14
```

### Im Minecraft-Bot

```javascript
// Einfache Funktion
function winkImChat() {
  bot.chat("👋 Hey!");
}

// Mit Parameter
function sagZuSpieler(spielerName, nachricht) {
  bot.chat(spielerName + ", " + nachricht);
}

sagZuSpieler("Eddie", "komm mal her!");  // "Eddie, komm mal her!"

// Komplexere Funktion für den Dance
async function tanze(anzahlSpruenge) {
  bot.chat("💃 Lass uns tanzen!");
  
  for (let i = 0; i < anzahlSpruenge; i++) {
    bot.setControlState('jump', true);
    await sleep(500);
    bot.setControlState('jump', false);
    await sleep(300);
  }
  
  bot.chat("🎉 Fertig!");
}

tanze(5);  // Bot springt 5 mal
```

---

## Konzept 4: Bedingungen - Entscheidungen treffen

### Die Alltagsanalogie

Jeden Tag triffst du Entscheidungen:
- WENN es regnet, DANN nehme ich einen Schirm, SONST nicht.
- WENN ich Hunger habe, DANN esse ich.
- WENN es dunkel ist, DANN mache ich Licht an.

Das ist genau was `if/else` in Code macht!

### So schreibst du es

```javascript
if (esRegnet) {
  nimm("Schirm");
} else {
  geh("ohne Schirm");
}
```

**Die Teile:**
1. `if` = "Wenn..."
2. `(esRegnet)` = Die Bedingung (muss true oder false sein)
3. `{ ... }` = Was tun wenn WAHR
4. `else { ... }` = Was tun wenn FALSCH (optional)

### Vergleiche (was in die Klammer kommt)

| Zeichen | Bedeutung | Beispiel |
|---------|-----------|----------|
| `===` | Ist gleich | `alter === 14` |
| `!==` | Ist NICHT gleich | `name !== "Max"` |
| `<` | Kleiner als | `punkte < 100` |
| `>` | Größer als | `punkte > 50` |
| `<=` | Kleiner oder gleich | `level <= 10` |
| `>=` | Größer oder gleich | `health >= 20` |

### Mehrere Bedingungen

```javascript
if (uhrzeit < 12) {
  console.log("Guten Morgen!");
} else if (uhrzeit < 18) {
  console.log("Guten Tag!");
} else {
  console.log("Guten Abend!");
}
```

### Bedingungen kombinieren

Mit `&&` (UND) und `||` (ODER):

```javascript
// Beides muss wahr sein
if (alter >= 18 && hatFuehrerschein) {
  console.log("Du darfst fahren!");
}

// Eins von beiden reicht
if (istWochenende || istFeiertag) {
  console.log("Keine Schule!");
}
```

### Im Minecraft-Bot

```javascript
// Leben prüfen
if (bot.health < 5) {
  bot.chat("⚠️ Ich brauche Hilfe! Nur noch wenig Leben!");
} else if (bot.health < 10) {
  bot.chat("Mir geht's nicht so gut...");
} else {
  bot.chat("Alles bestens! 💪");
}

// Monster erkennen
if (entity.type === 'hostile') {
  bot.chat("⚔️ Monster entdeckt!");
  greifAn(entity);
}

// Tag/Nacht Verhalten
if (bot.time.isDay) {
  bot.chat("☀️ Es ist Tag, ich arbeite!");
  sammleRessourcen();
} else {
  bot.chat("🌙 Es ist Nacht, ich verstecke mich!");
  geheNachHause();
}
```

---

## Konzept 5: Schleifen - Dinge wiederholen

### Die Alltagsanalogie

Statt zu sagen "Mach einen Liegestütz. Mach einen Liegestütz. Mach einen Liegestütz..." sagst du einfach "Mach 10 Liegestütze".

Eine Schleife wiederholt Code eine bestimmte Anzahl mal.

### For-Schleife (wenn du weißt wie oft)

```javascript
for (let i = 0; i < 5; i++) {
  console.log("Durchgang " + i);
}
```

**Ausgabe:**
```
Durchgang 0
Durchgang 1
Durchgang 2
Durchgang 3
Durchgang 4
```

**Die drei Teile in der Klammer:**
1. `let i = 0` = Starte bei 0
2. `i < 5` = Mach weiter solange i kleiner als 5
3. `i++` = Nach jedem Durchgang: erhöhe i um 1

### Schleife durch eine Liste

```javascript
let freunde = ["Max", "Anna", "Tom"];

for (let freund of freunde) {
  console.log("Hallo " + freund + "!");
}
```

**Ausgabe:**
```
Hallo Max!
Hallo Anna!
Hallo Tom!
```

### While-Schleife (solange etwas wahr ist)

```javascript
let zaehler = 0;

while (zaehler < 3) {
  console.log("Zähler ist " + zaehler);
  zaehler = zaehler + 1;
}
```

### Im Minecraft-Bot

```javascript
// 5 mal springen
for (let i = 0; i < 5; i++) {
  bot.setControlState('jump', true);
  await sleep(300);
  bot.setControlState('jump', false);
  await sleep(300);
}

// Turm bauen (5 Blöcke hoch)
for (let hoehe = 0; hoehe < 5; hoehe++) {
  let blockPosition = startPos.offset(0, hoehe, 0);
  await platziereBlock(blockPosition);
}

// Alle Spieler begrüßen
for (let spieler of Object.values(bot.players)) {
  bot.chat("Hallo " + spieler.username + "!");
}

// Pyramide bauen (verschachtelte Schleifen)
for (let ebene = 0; ebene < 5; ebene++) {
  for (let x = 0; x < 5 - ebene; x++) {
    for (let z = 0; z < 5 - ebene; z++) {
      await platziereBlock(startPos.offset(x, ebene, z));
    }
  }
}
```

---

## Konzept 6: async/await - Auf Dinge warten

### Die Alltagsanalogie

Wenn du Pizza bestellst, wartest du bis sie da ist, bevor du isst. Du machst nicht gleichzeitig den Mund auf und wartest auf die Pizza - das wäre komisch!

In Minecraft: Wenn du einen Block platzierst, wartest du kurz bis deine Hand wieder frei ist, bevor du den nächsten platzierst.

### Das Problem ohne await

```javascript
bot.placeBlock(position1);
bot.placeBlock(position2);  // PROBLEM! Position 1 ist noch nicht fertig!
```

Der Computer ist so schnell, dass er den zweiten Block platzieren will, bevor der erste fertig ist!

### Die Lösung mit await

```javascript
await bot.placeBlock(position1);  // Warte bis Block 1 fertig
await bot.placeBlock(position2);  // DANN erst Block 2
```

### async bei Funktionen

Wenn eine Funktion `await` benutzt, muss sie mit `async` markiert werden:

```javascript
async function baueTurm() {
  await bot.placeBlock(position1);
  await bot.placeBlock(position2);
  await bot.placeBlock(position3);
  bot.chat("Turm fertig!");
}
```

### Im Minecraft-Bot

```javascript
// Auf Zeit warten
async function countdown() {
  bot.chat("3...");
  await sleep(1000);  // 1 Sekunde warten
  bot.chat("2...");
  await sleep(1000);
  bot.chat("1...");
  await sleep(1000);
  bot.chat("🚀 Los!");
}

// Mehrere Blöcke platzieren
async function baueWand() {
  for (let x = 0; x < 5; x++) {
    await bot.placeBlock(startPos.offset(x, 0, 0));
    // Warte nach jedem Block, sonst gehts zu schnell
  }
}

// Zum Spieler laufen und warten bis angekommen
async function kommZuSpieler(spielerName) {
  let spieler = bot.players[spielerName];
  if (!spieler) return;
  
  bot.chat("Ich komme!");
  await bot.pathfinder.goto(new goals.GoalNear(
    spieler.entity.position.x,
    spieler.entity.position.y,
    spieler.entity.position.z,
    2
  ));
  bot.chat("Da bin ich!");
}
```

---

## Konzept 7: Events - Auf Dinge reagieren

### Die Alltagsanalogie

Dein Handy klingelt → Du gehst ran.
Jemand klopft → Du öffnest die Tür.
Der Wecker klingelt → Du stehst auf.

Du reagierst auf Ereignisse. Der Code macht das auch!

### So schreibst du es

```javascript
bot.on('chat', (username, message) => {
  console.log(username + " sagt: " + message);
});
```

**Die Teile:**
1. `bot.on` = "Wenn beim Bot folgendes passiert..."
2. `'chat'` = Der Name des Ereignisses
3. `(username, message)` = Daten die das Ereignis mitbringt
4. `=> { ... }` = Was tun wenn es passiert

### Wichtige Events für den Bot

| Event | Wann? | Daten |
|-------|-------|-------|
| `'chat'` | Jemand schreibt im Chat | username, message |
| `'spawn'` | Bot ist in der Welt gespawnt | - |
| `'health'` | Leben hat sich geändert | - |
| `'death'` | Bot ist gestorben | - |
| `'playerJoined'` | Spieler ist beigetreten | player |
| `'playerLeft'` | Spieler hat verlassen | player |

### Im Minecraft-Bot

```javascript
// Auf Chat reagieren
bot.on('chat', (username, message) => {
  // High-Five Feature
  if (message.toLowerCase() === 'high five') {
    bot.chat("✋ High Five zurück, " + username + "!");
  }
});

// Wenn Bot spawnt
bot.on('spawn', () => {
  bot.chat("Ich bin da! 🎮");
});

// Wenn Spieler beitritt
bot.on('playerJoined', (player) => {
  bot.chat("Willkommen, " + player.username + "!");
});

// Wenn Bot stirbt
bot.on('death', () => {
  console.log("Bot ist gestorben!");
});
```

---

## Konzept 8: Objekte und der Punkt

### Die Alltagsanalogie

Ein Auto hat Eigenschaften: Farbe, Marke, Geschwindigkeit, Tankinhalt.
Ein Spieler hat Eigenschaften: Name, Position, Leben, Inventar.

Ein Objekt ist eine Sammlung von Eigenschaften.

### Mit dem Punkt auf Eigenschaften zugreifen

```javascript
// Das bot-Objekt hat viele Eigenschaften
bot.health         // Leben des Bots
bot.food           // Hunger des Bots
bot.username       // Name des Bots
bot.entity         // Die Entity des Bots

// entity hat wieder Eigenschaften
bot.entity.position    // Position der Entity
bot.entity.position.x  // X-Koordinate
bot.entity.position.y  // Y-Koordinate
bot.entity.position.z  // Z-Koordinate
```

Der Punkt bedeutet "geh rein und hole":
- `bot.entity` = "Hole die entity aus bot"
- `bot.entity.position` = "Hole die position aus entity"
- `bot.entity.position.x` = "Hole x aus position"

### Im Minecraft-Bot

```javascript
// Position ausgeben
let pos = bot.entity.position;
bot.chat("Ich bin bei X:" + pos.x + " Y:" + pos.y + " Z:" + pos.z);

// Leben prüfen
if (bot.health < 10) {
  bot.chat("Wenig Leben: " + bot.health);
}

// Spieler-Info
let spieler = bot.players["Eddie"];
if (spieler && spieler.entity) {
  let distanz = bot.entity.position.distanceTo(spieler.entity.position);
  bot.chat("Eddie ist " + distanz + " Blöcke entfernt");
}
```

---

## Alles zusammen - Ein echtes Feature

Hier siehst du wie alle Konzepte zusammenarbeiten:

```javascript
// Das "Aufräumen" Feature

async function sammleItems() {
  // VARIABLE: Zähler für gesammelte Items
  let gesammelt = 0;
  
  // OBJEKT: Alle Entities vom Bot holen
  let alleEntities = Object.values(bot.entities);
  
  // SCHLEIFE: Durch alle Entities gehen
  for (let entity of alleEntities) {
    
    // BEDINGUNG: Nur wenn es ein Item ist
    if (entity.type === 'item') {
      
      // ASYNC: Warten bis wir beim Item sind
      await bot.pathfinder.goto(new goals.GoalNear(
        entity.position.x,  // OBJEKT: Position auslesen
        entity.position.y,
        entity.position.z,
        1
      ));
      
      // VARIABLE: Zähler erhöhen
      gesammelt = gesammelt + 1;
    }
  }
  
  // TEXT: Ergebnis verkünden
  bot.chat("Ich habe " + gesammelt + " Items gesammelt! 🎉");
}

// EVENT: Wenn jemand "aufräumen" sagt
bot.on('chat', (username, message) => {
  if (message.toLowerCase() === 'aufräumen') {
    sammleItems();  // FUNKTION aufrufen
  }
});
```

---

## Zusammenfassung

| Konzept | Was es macht | Beispiel |
|---------|--------------|----------|
| **Variable** | Dinge merken | `let name = "Eddie"` |
| **Datentyp** | Art der Daten | Text, Zahl, Ja/Nein, Liste |
| **Funktion** | Wiederverwendbares Rezept | `function tanze() { ... }` |
| **Bedingung** | Entscheidung treffen | `if (x > 5) { ... }` |
| **Schleife** | Wiederholen | `for (let i = 0; i < 5; i++)` |
| **async/await** | Warten | `await bot.placeBlock()` |
| **Event** | Auf etwas reagieren | `bot.on('chat', ...)` |
| **Objekt/Punkt** | Eigenschaften holen | `bot.entity.position.x` |

## Nicht auswendig lernen!

Du musst das nicht alles im Kopf haben. Wenn du Features baust:

1. **Cursor schreibt den Code** mit diesen Konzepten
2. **Du liest den Code** und erkennst die Muster
3. **Du fragst Cursor** wenn du etwas nicht verstehst
4. **Nach ein paar Features** erkennst du alles automatisch!

---

**Weiter zu Episode 7: Das Bot-System im Detail!**
