# 📦 Material-System für Template-Bau

## 🔴 Problem: /give Befehle funktionieren nicht!

Die `/give` Befehle die der Bot über `bot.chat()` sendet werden **nur ausgeführt wenn**:

1. **Bot hat OP-Rechte** auf dem Server
2. **Server erlaubt Commands von Bots**
3. **Creative Mode** ist aktiviert

## ✅ Lösung 1: Bot OP-Rechte geben (Server)

Auf deinem Minecraft-Server:
```
/op Freddiiiiii
```

**Dann funktionieren die Auto-Refill Befehle!**

## ✅ Lösung 2: Materialien manuell geben

### Vor dem Bau:
```bash
/give Freddiiiiii sandstone 500
/give Freddiiiiii smooth_sandstone 200
/give Freddiiiiii jungle_planks 200
```

### Oder nutze Creative Mode:
1. Öffne dein Inventar (E)
2. Klicke auf "Creative Inventory"
3. Gib Freddi die Items per Click

## 🔄 Auto-Refill System

Wenn OP-Rechte vorhanden:
```
📦 Baue Level 1...
  10/40 Blöcke platziert
  📦 Material sandstone fast leer (3) - gebe 64 nach
  /give Freddiiiiii sandstone 64  ← Automatisch!
  ✅ Refill erfolgreich
  20/40 Blöcke platziert
  📦 Material sandstone fast leer (2) - gebe 64 nach
  /give Freddiiiiii sandstone 64  ← Nochmal!
  ...
```

**Smart**: Refill triggert schon bei **< 5 Items** (nicht erst bei 0)

## 🎯 Empfehlung

**Für beste Erfahrung:**
1. Gib dem Bot OP-Rechte: `/op Freddiiiiii`
2. Oder: Gib initial viele Materialien (500+ pro Typ)
3. System füllt automatisch nach während Bau

**Ohne OP-Rechte:**
- Gib große Mengen vor dem Bau
- Bot zeigt Warnung wenn Material ausgeht
- Bau wird unvollständig

## 📋 Material-Bedarf für Japarabic House 5

```
sandstone:         389 Blöcke (7 Stacks)
smooth_sandstone:  122 Blöcke (2 Stacks)
jungle_planks:     122 Blöcke (2 Stacks)
---
Total: 633 Blöcke
```

**Sicherheits-Menge:**
```
/give Freddiiiiii sandstone 500
/give Freddiiiiii smooth_sandstone 200  
/give Freddiiiiii jungle_planks 200
```

