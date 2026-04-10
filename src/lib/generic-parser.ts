import { ScriptLine } from '../types';

export function parseGeneric(texto: string): ScriptLine[] {
  const raw = texto.split('\n');
  const blocos: ScriptLine[] = [];
  let ba: ScriptLine | null = null;
  let ta: ScriptLine['tipo'] | null = null;

  raw.forEach((r) => {
    const l = r.trim();
    if (!l || l.length < 2) {
      if (ba) {
        blocos.push(ba);
        ba = null;
        ta = null;
      }
      return;
    }
    
    if (/^(\d+\.?\s*){1,6}$/.test(l)) return;
    if (/^(MORE|CONT'D|\(MORE\)|\(CONT'D\))$/.test(l)) return;
    
    const tipo = detectarTipo(l, ta);
    
    // Check for NAME: text format
    const nameMatch = l.match(/^([A-ZÁÉÍÓÚÀÂÊÎÔÛÃÕÇ\s]{2,30}):\s*(.*)/);
    if (nameMatch && tipo === 'action') {
      const name = nameMatch[1].trim();
      const text = nameMatch[2].trim();
      if (ba) blocos.push(ba);
      blocos.push({ texto: name, tipo: 'character' });
      ba = { texto: text, tipo: 'dialogue' };
      ta = 'dialogue';
      return;
    }

    if (ba && tipo === ta && (tipo === 'dialogue' || tipo === 'action')) {
      ba.texto += ' ' + l;
    } else {
      if (ba) blocos.push(ba);
      ba = { texto: l, tipo };
      ta = tipo;
    }
  });

  if (ba) blocos.push(ba);
  
  let tt: ScriptLine['tipo'] | null = null;
  blocos.forEach((b) => {
    // Only convert action to dialogue if it follows character or direction
    if (b.tipo === 'action' && (tt === 'character' || tt === 'direction')) {
      b.tipo = 'dialogue';
    }
    tt = b.tipo;
  });
  
  return blocos;
}

function detectarTipo(l: string, ant: ScriptLine['tipo'] | null): ScriptLine['tipo'] {
  if (/^(INT\.|EXT\.|INT\/EXT\.|I\/E\.)/.test(l)) return 'scene';
  if (/^\(.*\)$/.test(l) || /^\[.*\]$/.test(l)) return 'direction';
  
  const sp = l.replace(/\(.*?\)/g, '').trim();
  if (sp === sp.toUpperCase() && /^[A-ZÁÉÍÓÚÀÂÊÎÔÛÃÕÇ]/.test(sp) && 
      sp.length >= 2 && sp.length <= 45 && 
      sp.split(' ').length <= 6 && 
      !/[.!?,;:]$/.test(sp) && 
      !/^[\s\-\.\d]+$/.test(sp) && 
      !/^(FADE|CUT TO|DISSOLVE|CORTE|IRIS|MATCH|SMASH|TITLE)/.test(sp)) {
    return 'character';
  }
  
  return 'action';
}
