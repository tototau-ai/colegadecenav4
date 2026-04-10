import { ScriptLine } from '../types';

export function parseGeneric(texto: string): ScriptLine[] {
  const linhas = texto.split('\n');
  const resultado: ScriptLine[] = [];
  let linhaAtual: ScriptLine | null = null;

  for (let raw of linhas) {
    let l = raw.trim();
    if (!l || l.length < 2) {
      if (linhaAtual) {
        resultado.push(linhaAtual);
        linhaAtual = null;
      }
      continue;
    }

    // Remove números de página
    if (/^(\d+\.?\s*){1,6}$/.test(l)) continue;
    if (/^(MORE|CONT'D|\(MORE\)|\(CONT'D\))$/i.test(l)) continue;

    // Detecta cabeçalho de cena
    if (/^(INT\.|EXT\.|INT\/EXT\.|I\/E\.|CENA|SCENE|LOCAL:)/i.test(l)) {
      if (linhaAtual) resultado.push(linhaAtual);
      resultado.push({ texto: l, tipo: 'scene' });
      linhaAtual = null;
      continue;
    }

    // Detecta personagem no formato "NOME: fala"
    const nameMatch = l.match(/^([A-ZÁÉÍÓÚÀÂÊÎÔÛÃÕÇ\s]{2,30}):\s*(.*)/);
    if (nameMatch) {
      if (linhaAtual) resultado.push(linhaAtual);
      const nome = nameMatch[1].trim();
      const fala = nameMatch[2].trim();
      resultado.push({ texto: nome, tipo: 'character' });
      linhaAtual = { texto: fala, tipo: 'dialogue', narrador: nome };
      continue;
    }

    // Detecta personagem (maiúsculas, sem pontuação)
    const isUpper = l === l.toUpperCase() && /[A-Z]/.test(l);
    const isShort = l.length <= 45 && l.split(' ').length <= 6;
    const noPunctuation = !/[.!?,;:]$/.test(l);
    if (isUpper && isShort && noPunctuation && !l.startsWith('(') && !/^(FADE|CUT TO|DISSOLVE)/i.test(l)) {
      if (linhaAtual) resultado.push(linhaAtual);
      resultado.push({ texto: l, tipo: 'character' });
      linhaAtual = null;
      continue;
    }

    // Detecta direção (parênteses)
    if (l.startsWith('(') && l.endsWith(')')) {
      if (linhaAtual) resultado.push(linhaAtual);
      resultado.push({ texto: l, tipo: 'direction' });
      linhaAtual = null;
      continue;
    }

    // Se estávamos em um diálogo ou ação, acumula
    if (linhaAtual && (linhaAtual.tipo === 'dialogue' || linhaAtual.tipo === 'action')) {
      linhaAtual.texto += ' ' + l;
    } else {
      if (linhaAtual) resultado.push(linhaAtual);
      linhaAtual = { texto: l, tipo: 'action' };
    }
  }

  if (linhaAtual) resultado.push(linhaAtual);

  // Pós-processamento: converte action para dialogue se vier depois de character/direction
  let ultimoTipo: ScriptLine['tipo'] | null = null;
  for (let i = 0; i < resultado.length; i++) {
    const line = resultado[i];
    if (line.tipo === 'action' && (ultimoTipo === 'character' || ultimoTipo === 'direction')) {
      line.tipo = 'dialogue';
    }
    ultimoTipo = line.tipo;
  }

  return resultado;
}
