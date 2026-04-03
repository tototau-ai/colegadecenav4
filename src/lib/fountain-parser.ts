import { ScriptLine } from '../types';

export function parseFountain(txt: string): ScriptLine[] {
  const raw = txt.split('\n');
  const res: ScriptLine[] = [];
  let tipoAnt: ScriptLine['tipo'] | null = null;
  for (let i = 0; i < raw.length; i++) {
    const l = raw[i].trimEnd();
    if (!l.trim()) { tipoAnt = null; continue; }
    const lt = l.trim();
    if (/^(Title|Author|Draft|Contact|Copyright|Credit|Source|Notes|Format):/i.test(lt)) continue;
    if (/^\.(?!\.)/.test(lt)) {
      res.push({ texto: lt.slice(1).trim(), tipo: 'scene' });
      tipoAnt = 'scene';
      continue;
    }
    if (/^@/.test(lt)) {
      res.push({ texto: lt.slice(1).trim(), tipo: 'character' });
      tipoAnt = 'character';
      continue;
    }
    if (/^>.*[^<]$/.test(lt)) {
      res.push({ texto: lt.replace(/^>/, '').trim(), tipo: 'transition' });
      tipoAnt = 'transition';
      continue;
    }
    if (/^(INT\.|EXT\.|INT\/EXT\.|I\/E\.|EST\.)/i.test(lt)) {
      res.push({ texto: lt, tipo: 'scene' });
      tipoAnt = 'scene';
      continue;
    }
    if (/^\(.*\)$/.test(lt)) {
      res.push({ texto: lt, tipo: 'direction' });
      tipoAnt = 'direction';
      continue;
    }
    if (/^(FADE OUT|FADE IN|CUT TO|DISSOLVE TO)/i.test(lt)) {
      res.push({ texto: lt, tipo: 'transition' });
      tipoAnt = 'transition';
      continue;
    }
    if (lt === lt.toUpperCase() && lt.length > 1 && !/[.!?,;:]$/.test(lt) && !/^\d/.test(lt) && i + 1 < raw.length && raw[i + 1].trim()) {
      res.push({ texto: lt, tipo: 'character' });
      tipoAnt = 'character';
      continue;
    }
    if (tipoAnt === 'character' || tipoAnt === 'direction' || tipoAnt === 'dialogue') {
      res.push({ texto: lt, tipo: 'dialogue' });
      tipoAnt = 'dialogue';
      continue;
    }
    res.push({ texto: lt, tipo: 'action' });
    tipoAnt = 'action';
  }
  return res;
}