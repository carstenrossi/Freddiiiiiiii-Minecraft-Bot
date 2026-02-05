#!/bin/bash
# ════════════════════════════════════════
# Freddiiiiii – Dependencies installieren
# ════════════════════════════════════════
# Führe dieses Script aus, NACHDEM du Node.js installiert hast.
# Einmal ausführen: ./install-dependencies.sh
# Oder einfach: npm install
# ════════════════════════════════════════

set -e
cd "$(dirname "$0")"

if ! command -v node >/dev/null 2>&1; then
  echo "❌ Node.js ist nicht installiert oder nicht im PATH."
  echo "   Bitte zuerst Node.js installieren: https://nodejs.org/"
  echo "   (Version 18 oder neuer)"
  exit 1
fi

echo "✅ Node gefunden: $(node --version)"
echo "📦 Installiere Dependencies (kann 1–2 Minuten dauern)..."
npm install
echo "✅ Fertig! Du kannst den Bot mit 'npm start' starten."
echo "   Vorher: Ollama laufen lassen (ollama serve) und Minecraft-Server starten."
