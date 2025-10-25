// ============================================
// MINECRAFT KI-WISSENSSYSTEM
// ============================================

export const MinecraftWissen = {
  // Basis-Regeln für räumliches Verständnis
  raumRegeln: {
    reichweite: 5, // Blöcke
    fallSchaden: 3, // Blöcke Höhe
    sichtweite: 64, // Blöcke
    meeresspiegel: 64,
    hoehlenStart: 60,
  },

  // Material-Eigenschaften mit Kontext
  materialien: {
    wood: {
      namen: ['oak_log', 'birch_log', 'spruce_log', 'planks'],
      quelle: 'Bäume',
      verwendung: ['Bau', 'Crafting', 'Brennstoff'],
      eigenschaften: ['erneuerbar', 'brennbar', 'leicht_abbaubar'],
      crafting: { planks: 4 }
    },
    cobblestone: {
      namen: ['cobblestone'],
      quelle: 'Stone mit Pickaxe abbauen',
      verwendung: ['Stabiles Bauen', 'Werkzeuge'],
      eigenschaften: ['feuerfest', 'explosionsresistent', 'braucht_pickaxe'],
      werkzeug: 'pickaxe'
    },
    dirt: {
      namen: ['dirt', 'grass_block'],
      quelle: 'Überall',
      verwendung: ['Temporär', 'Farming'],
      eigenschaften: ['instabil', 'billig'],
      warnung: 'Nicht für permanente Bauten!'
    },
    sand: {
      namen: ['sand', 'red_sand'],
      quelle: 'Wüste, Strand',
      verwendung: ['Glas', 'TNT'],
      eigenschaften: ['schwerkraft', 'instabil'],
      warnung: 'FÄLLT! Nicht als Fundament!'
    }
  },

  // Struktur-Templates mit Bauanleitung
  strukturen: {
    haus: {
      mindestGroesse: { x: 5, y: 4, z: 5 },
      materialEmpfehlung: ['cobblestone', 'wood'],
      bauSchritte: [
        'Fundament prüfen (kein Sand/Gravel)',
        'Ecken markieren',
        'Wände hochziehen (mind. 3 hoch)',
        'Türöffnung lassen (2 hoch, 1 breit)',
        'Dach aufsetzen',
        'Optional: Fenster einbauen'
      ],
      raumAufteilung: {
        eingang: { breite: 1, hoehe: 2 },
        innenraum: { min: '3x3x3' },
        fenster: { hoehe: 1, abstand: 2 }
      }
    },
    turm: {
      mindestGroesse: { x: 3, y: 10, z: 3 },
      materialEmpfehlung: ['cobblestone'],
      bauSchritte: [
        'Stabiles Fundament (3x3)',
        'Spiralförmig hochbauen',
        'Alle 4 Blöcke Plattform',
        'Zinnen oben'
      ]
    },
    bruecke: {
      materialEmpfehlung: ['cobblestone', 'wood'],
      bauSchritte: [
        'Stützpfeiler an beiden Enden',
        'Hauptbalken spannen',
        'Gehweg auffüllen',
        'Geländer anbringen'
      ],
      wichtig: 'Max. 15 Blöcke ohne Stütze!'
    }
  },

  // Entity-Wissen mit Verhalten
  entities: {
    passive: {
      cow: { hp: 10, drops: ['beef', 'leather'], verhalten: 'flüchtet' },
      pig: { hp: 10, drops: ['porkchop'], verhalten: 'flüchtet' },
      sheep: { hp: 8, drops: ['wool', 'mutton'], verhalten: 'flüchtet' },
      chicken: { hp: 4, drops: ['feather', 'chicken'], verhalten: 'flüchtet' }
    },
    hostile: {
      zombie: { 
        hp: 20, 
        schaden: 3, 
        verhalten: 'verfolgt_nachts',
        schwaeche: 'langsam',
        tipp: 'Auf Distanz halten'
      },
      skeleton: {
        hp: 20,
        schaden: '2-5 (Bogen)',
        verhalten: 'schiesst_pfeile',
        schwaeche: 'nahkampf',
        tipp: 'Deckung suchen, dann angreifen'
      },
      creeper: {
        hp: 20,
        schaden: '49 (Explosion)',
        verhalten: 'explodiert_bei_naehe',
        schwaeche: 'kein_fernkampf',
        tipp: 'ABSTAND HALTEN! Hit & Run'
      }
    }
  },

  // Crafting-Rezepte mit Kontext
  crafting: {
    werkzeuge: {
      wooden_pickaxe: {
        rezept: ['planks', 'planks', 'planks', null, 'stick', null, null, 'stick', null],
        nutzen: 'Basis-Pickaxe für Stone'
      },
      stone_pickaxe: {
        rezept: ['cobblestone', 'cobblestone', 'cobblestone', null, 'stick', null, null, 'stick', null],
        nutzen: 'Für Iron Ore'
      },
      crafting_table: {
        rezept: ['planks', 'planks', 'planks', 'planks'],
        nutzen: 'Erweiterte Crafting-Möglichkeiten'
      }
    }
  },

  // Aktions-Prioritäten basierend auf Kontext
  getPrioritaeten(tageszeit, inventar, umgebung) {
    const prios = [];
    
    // Nachts?
    if (tageszeit === 'nacht' && !umgebung.hatUnterkunft) {
      prios.push({ aktion: 'schutz_suchen', grund: 'Monster spawnen nachts' });
    }
    
    // Keine Werkzeuge?
    if (!inventar.pickaxe) {
      prios.push({ aktion: 'pickaxe_craften', grund: 'Basis-Werkzeug fehlt' });
    }
    
    // Wenig Material?
    if (!inventar.wood || inventar.wood < 10) {
      prios.push({ aktion: 'holz_sammeln', grund: 'Grundmaterial fehlt' });
    }
    
    return prios;
  },

  // Intelligente Material-Auswahl
  waehleMatrial(zweck, verfuegbar) {
    const empfehlungen = {
      haus: ['cobblestone', 'wood', 'planks'],
      turm: ['cobblestone', 'stone_bricks'],
      temporaer: ['dirt', 'wood'],
      unterwasser: ['glass', 'prismarine']
    };
    
    const empfohlen = empfehlungen[zweck] || ['cobblestone'];
    
    // Finde bestes verfügbares Material
    for (const mat of empfohlen) {
      if (verfuegbar[mat] && verfuegbar[mat] > 20) {
        return mat;
      }
    }
    
    // Fallback mit Warnung
    if (verfuegbar.dirt > 50) {
      return { material: 'dirt', warnung: 'Nur temporär! Besseres Material besorgen.' };
    }
    
    return null;
  },

  // Räumliche Intelligenz
  analysierePosition(botPos, zielPos, umgebung) {
    const dx = zielPos.x - botPos.x;
    const dy = zielPos.y - botPos.y; 
    const dz = zielPos.z - botPos.z;
    const dist = Math.sqrt(dx*dx + dy*dy + dz*dz);
    
    const analyse = {
      distanz: Math.floor(dist),
      hoehenUnterschied: dy,
      richtung: this.getRichtung(dx, dz),
      gefahren: []
    };
    
    // Gefahren-Analyse
    if (dy < -3) analyse.gefahren.push('Fallschaden möglich');
    if (umgebung.lava) analyse.gefahren.push('Lava in der Nähe');
    if (dy > 20) analyse.gefahren.push('Sehr steiler Aufstieg');
    
    return analyse;
  },

  getRichtung(dx, dz) {
    const angle = Math.atan2(dz, dx) * 180 / Math.PI;
    if (angle >= -45 && angle < 45) return 'Osten';
    if (angle >= 45 && angle < 135) return 'Süden';
    if (angle >= -135 && angle < -45) return 'Norden';
    return 'Westen';
  }
};

// Kontext-basierte Prompt-Erweiterung
export function erweiterePromptMitWissen(nachricht, umgebung, inventar) {
  const wissen = [];
  
  // Analysiere Intent
  if (nachricht.includes('bau') || nachricht.includes('haus')) {
    const struktur = nachricht.includes('haus') ? 'haus' : 'generisch';
    const template = MinecraftWissen.strukturen[struktur];
    
    if (template) {
      wissen.push(`BAUWISSEN für ${struktur}:`);
      wissen.push(`- Empfohlene Materialien: ${template.materialEmpfehlung.join(', ')}`);
      wissen.push(`- Mindestgröße: ${template.mindestGroesse.x}x${template.mindestGroesse.y}x${template.mindestGroesse.z}`);
      wissen.push(`- Schritte: ${template.bauSchritte.join(' → ')}`);
    }
    
    // Material-Check
    const verfuegbar = {};
    Object.entries(inventar).forEach(([item, count]) => {
      verfuegbar[item.split(':').pop()] = count;
    });
    
    const material = MinecraftWissen.waehleMatrial(struktur, verfuegbar);
    if (material) {
      if (material.warnung) {
        wissen.push(`⚠️ ${material.warnung}`);
      } else {
        wissen.push(`✓ Verwende ${material} (${verfuegbar[material]} verfügbar)`);
      }
    }
  }
  
  // Monster-Kontext
  if (umgebung.monster && umgebung.monster.length > 0) {
    wissen.push('\nMONSTER-GEFAHR:');
    umgebung.monster.forEach(m => {
      const info = MinecraftWissen.entities.hostile[m.typ];
      if (info) {
        wissen.push(`- ${m.typ}: ${info.tipp}`);
      }
    });
  }
  
  // Prioritäten
  const tageszeit = umgebung.tageszeit || 'tag';
  const prios = MinecraftWissen.getPrioritaeten(tageszeit, inventar, umgebung);
  if (prios.length > 0) {
    wissen.push('\nPRIORITÄTEN:');
    prios.forEach(p => wissen.push(`- ${p.aktion}: ${p.grund}`));
  }
  
  return wissen.join('\n');
}

// Export für Bot
export default MinecraftWissen;
