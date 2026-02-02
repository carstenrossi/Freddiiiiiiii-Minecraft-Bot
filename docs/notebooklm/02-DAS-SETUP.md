# Episode 2: Das Setup - Alles installieren und einrichten

## Bevor es losgeht

Okay, du weißt jetzt was Freddiiiiii ist. Aber bevor der Bot laufen kann, müssen wir ein paar Programme installieren. Das klingt vielleicht kompliziert, ist es aber nicht - wir machen das Schritt für Schritt.

Diese Episode erklärt dir, was du brauchst und warum. Du musst das nicht alles sofort installieren - erst verstehen, dann machen!

## Was brauchen wir alles?

Hier ist die Übersicht:
1. Node.js (die Laufzeitumgebung für unser Programm)
2. Ein Minecraft Java Edition Server (wo Freddiiiiii spielt)
3. Das Freddiiiiii-Projekt selbst
4. Ollama mit einem LLM (die künstliche Intelligenz)
5. Cursor (die Entwicklungsumgebung)

Lass uns jedes Teil einzeln anschauen.

## Teil 1: Was ist Node.js?

### Das Problem
Computer verstehen nur Maschinensprache - Nullen und Einsen. Menschen können aber nicht in Nullen und Einsen programmieren. Also gibt es Programmiersprachen wie JavaScript, die für Menschen lesbar sind.

Aber: Der Computer versteht JavaScript nicht direkt. Es braucht ein Programm, das JavaScript in Maschinensprache übersetzt und ausführt.

### Die Lösung: Node.js
Node.js ist genau so ein Programm. Es nimmt deinen JavaScript-Code und führt ihn aus. Ohne Node.js könntest du zwar JavaScript-Code schreiben, aber nicht starten.

### Eine Analogie
Stell dir vor, JavaScript ist ein Rezept auf Deutsch. Der Computer ist ein Koch, der nur Chinesisch versteht. Node.js ist der Übersetzer, der dem Koch sagt was er tun soll.

### Installation
Du gehst auf nodejs.org, lädst die "LTS" Version herunter und installierst sie. LTS steht für "Long Term Support" - das bedeutet diese Version ist stabil und wird lange unterstützt.

Nach der Installation kannst du testen ob es funktioniert: Öffne ein Terminal und tippe `node --version`. Wenn eine Versionsnummer erscheint (zum Beispiel v20.10.0), hat es geklappt!

## Teil 2: Was ist npm?

### Das Problem
Wenn du programmierst, willst du nicht jedes Rad neu erfinden. Andere Programmierer haben schon viele nützliche Dinge gebaut - zum Beispiel Code der sich mit Minecraft verbindet.

### Die Lösung: npm
npm steht für "Node Package Manager". Es ist wie ein App Store für JavaScript-Code. Du kannst "Pakete" herunterladen, die andere geschrieben haben, und in deinem Projekt nutzen.

### Beispiel
Das Paket "mineflayer" enthält tausende Zeilen Code, um einen Minecraft Bot zu bauen. Statt das alles selbst zu schreiben, tippen wir einfach `npm install mineflayer` und haben all diesen Code zur Verfügung!

### Wichtige Datei: package.json
Jedes JavaScript-Projekt hat eine Datei namens "package.json". Darin steht:
- Wie heißt das Projekt?
- Welche Pakete braucht es?
- Wie startet man es?

Für Freddiiiiii steht dort zum Beispiel:
- Name: minecraft-bot
- Braucht: mineflayer, mineflayer-pathfinder, ollama
- Start-Befehl: node bot-advanced.js

npm kommt automatisch mit Node.js - du musst es nicht extra installieren.

## Teil 3: Der Minecraft Server

### Warum brauchen wir einen Server?
Freddiiiiii ist wie ein normaler Minecraft-Spieler. Er verbindet sich mit einem Server und spielt dort. Ohne Server kann er nirgendwo spielen!

Du könntest einen öffentlichen Server nutzen, aber:
- Die meisten erlauben keine Bots
- Du hast keine Kontrolle
- Andere Spieler könnten stören

### Die Lösung: Lokaler Server
Du startest einen eigenen Minecraft Server auf deinem Computer. "Lokal" bedeutet: Er läuft nur auf deinem Rechner, nicht im Internet.

Das hat Vorteile:
- Volle Kontrolle
- Keine anderen Spieler die stören
- Keine Internetverbindung nötig
- Du kannst experimentieren ohne Konsequenzen

### Wie installiert man einen lokalen Server?

1. **Minecraft Java Edition** - Du brauchst Minecraft Java Edition (nicht Bedrock/Windows 10 Edition!). Wenn du Minecraft besitzt, hast du das wahrscheinlich schon.

2. **Server-Software** - Du lädst die Server-Software von minecraft.net herunter. Das ist eine .jar Datei.

3. **Server starten** - Du startest die .jar Datei. Beim ersten Start erstellt sie eine Welt.

4. **server.properties anpassen** - In dieser Datei stellst du ein:
   - `online-mode=false` (Damit Freddiiiiii sich verbinden kann ohne Microsoft-Account)
   - `spawn-protection=0` (Damit der Bot überall bauen kann)

5. **Server neu starten** - Damit die Änderungen wirksam werden.

### Verbindung
Der Server läuft dann auf deinem Computer unter der Adresse "localhost" (das bedeutet "dieser Computer") und Port 25565 (der Standard-Minecraft-Port).

Freddiiiiii verbindet sich also mit: localhost:25565

Du selbst kannst auch mit dem normalen Minecraft-Client beitreten: Multiplayer → Server hinzufügen → localhost

## Teil 4: Was ist Mineflayer?

### Das Problem
Wie sagt man einem Computer, er soll sich mit Minecraft verbinden? Minecraft benutzt ein spezielles "Protokoll" - eine Art Sprache, die Client und Server sprechen. Diese Sprache zu lernen und selbst zu implementieren würde Jahre dauern.

### Die Lösung: Mineflayer
Mineflayer ist ein npm-Paket, das all diese Arbeit schon erledigt hat. Es weiß wie man:
- Sich mit einem Minecraft-Server verbindet
- Chat-Nachrichten sendet und empfängt
- Die Welt liest (welche Blöcke sind wo?)
- Den Bot bewegt
- Blöcke abbaut und platziert
- Entities erkennt (Spieler, Tiere, Monster)
- Und vieles mehr!

### Wie wir es nutzen
In unserem Code schreiben wir:

```javascript
import mineflayer from 'mineflayer';

const bot = mineflayer.createBot({
  host: 'localhost',
  port: 25565,
  username: 'Freddiiiiii'
});
```

Diese wenigen Zeilen reichen, damit sich ein Bot mit dem Server verbindet! Mineflayer kümmert sich um den ganzen komplizierten Teil.

### Was Mineflayer uns gibt
Nach der Verbindung haben wir ein "bot" Objekt, mit dem wir alles machen können:
- `bot.chat("Hallo!")` - Im Chat schreiben
- `bot.entity.position` - Wo ist der Bot gerade?
- `bot.players` - Welche Spieler sind online?
- `bot.dig(block)` - Block abbauen
- Und hunderte weitere Funktionen!

## Teil 5: Der Pathfinder

### Das Problem
Wenn du sagst "Geh zu Position X", muss der Bot wissen WIE er dort hinkommt. Er muss:
- Hindernisse umgehen
- Über Hügel klettern
- Eventuell Blöcke abbauen
- Nicht in Löcher fallen

Das selbst zu programmieren wäre extrem aufwändig.

### Die Lösung: mineflayer-pathfinder
Ein weiteres npm-Paket, das wir nutzen. Es berechnet automatisch den besten Weg von A nach B.

Du sagst nur: "Geh zu Position (100, 64, 200)"
Der Pathfinder berechnet: "Okay, ich muss 3 Blöcke nach vorne, dann links um den Berg, dann 10 Blöcke geradeaus..."

### Installation
Beide Pakete installieren wir mit einem einzigen Befehl:
`npm install`

Dieser Befehl liest die package.json und installiert alle dort aufgelisteten Pakete.

## Teil 6: Ollama und das LLM

### Was ist ein LLM?
LLM steht für "Large Language Model". Das sind die KI-Systeme hinter ChatGPT, Claude und ähnlichen Diensten. Sie verstehen menschliche Sprache und können intelligent antworten.

### Warum braucht Freddiiiiii ein LLM?
Damit Freddiiiiii Befehle wie "Bau mir ein kleines Haus neben dem Fluss" verstehen kann! 

Ohne LLM müsstest du exakte Befehle eingeben:
- "build house 5 5 5 at 100 64 200"

Mit LLM kannst du natürlich reden:
- "Hey Freddi, bau mir mal ein gemütliches Häuschen, am besten irgendwo in der Nähe von Wasser!"

Das LLM versteht die Absicht und erstellt daraus strukturierte Befehle.

### Was ist Ollama?
Ollama ist ein Programm, mit dem du LLMs auf deinem eigenen Computer laufen lassen kannst. Das hat Vorteile:
- Kostenlos (keine API-Gebühren)
- Privat (deine Daten bleiben bei dir)
- Schnell (keine Internet-Latenz)

### Welches Modell?
Freddiiiiii nutzt "Deepseek" - ein sehr fähiges Open-Source-Modell. Es versteht Minecraft-Begriffe und kann Befehle gut interpretieren.

### Wie funktioniert die Kommunikation?
1. Du schreibst im Minecraft-Chat: "Baue einen Turm"
2. Freddiiiiii sendet diese Nachricht an Ollama
3. Ollama lässt das LLM die Nachricht analysieren
4. Das LLM antwortet: "Intent: baue_turm, Params: {}"
5. Freddiiiiii führt die `buildTower()` Funktion aus

## Teil 7: Das Projekt installieren

### Schritt 1: Repository klonen
Das Projekt liegt auf GitHub (einer Plattform für Code). Um es herunterzuladen, nutzen wir Git (dazu mehr in einer späteren Episode).

```bash
git clone [Repository-URL]
cd mineflayer
```

### Schritt 2: Abhängigkeiten installieren
```bash
npm install
```

Dieser Befehl lädt alle Pakete herunter die in package.json stehen:
- mineflayer
- mineflayer-pathfinder
- ollama
- und weitere

Das erstellt einen Ordner namens "node_modules" mit allen heruntergeladenen Paketen.

### Schritt 3: Konfiguration prüfen
In bot-advanced.js steht die Server-Konfiguration:
- host: 'localhost' (oder die IP deines Servers)
- port: 25565 (oder ein anderer Port)
- username: 'Freddiiiiii' (der Bot-Name)

### Schritt 4: Alles starten
In dieser Reihenfolge:
1. Ollama starten (für die KI)
2. Minecraft Server starten
3. Bot starten: `npm start`
4. Mit Minecraft beitreten und chatten!

## Zusammenfassung: Was installieren wir?

1. **Node.js** - Führt JavaScript aus
2. **npm** - Installiert Pakete (kommt mit Node.js)
3. **Minecraft Java Server** - Wo der Bot spielt
4. **Das Projekt** - Unser Code (via git clone)
5. **Ollama** - Führt die KI lokal aus
6. **Cursor** - Die Entwicklungsumgebung (nächste Episode!)

## Das große Bild

```
Du (in Minecraft) 
    ↓ Chat-Nachricht
Minecraft Server
    ↓ 
Mineflayer (empfängt Nachricht)
    ↓
Unser JavaScript Code
    ↓ Nachricht an LLM
Ollama (mit Deepseek)
    ↓ Intent zurück
Unser Code (führt Aktion aus)
    ↓ Befehle
Mineflayer (steuert Bot)
    ↓
Minecraft Server (Bot bewegt sich, baut, etc.)
    ↓
Du siehst das Ergebnis! 🎉
```

## Was kommt als Nächstes?

In Episode 3 lernen wir die Grundlagen: Was ist eine Programmiersprache? Was ist JavaScript? Was ist das Terminal? Diese Grundlagen brauchst du, um zu verstehen was du später tust.

---

**Weiter zu Episode 3: Programmiersprachen und Terminal verstehen!**
