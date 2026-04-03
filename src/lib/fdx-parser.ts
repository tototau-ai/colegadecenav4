import { ScriptLine } from '../types';

export function parseFDX(xml: string): ScriptLine[] {
  try {
    const cleanXml = xml.replace(/^\uFEFF/, '').replace(/&(?!(amp|lt|gt|quot|apos|#\d+|#x[\da-fA-F]+);)/g, '&amp;');
    const parser = new DOMParser();
    const doc = parser.parseFromString(cleanXml, 'text/xml');
    const paragraphs = doc.querySelectorAll('Paragraph');
    const res: ScriptLine[] = [];
    const typeMap: Record<string, ScriptLine['tipo']> = {
      'Scene Heading': 'scene',
      'Action': 'action',
      'Character': 'character',
      'Dialogue': 'dialogue',
      'Parenthetical': 'direction',
      'Transition': 'transition',
      'Shot': 'scene',
      'General': 'action',
      'Centered': 'action'
    };
    paragraphs.forEach((p) => {
      const type = p.getAttribute('Type') || 'Action';
      if (type === 'More' || type === 'Cont') return;
      let txt = '';
      const textNodes = p.querySelectorAll('Text');
      if (textNodes.length) {
        textNodes.forEach((t) => { txt += t.textContent; });
      } else {
        txt = p.textContent || '';
      }
      const trimmedTxt = txt.trim();
      if (!trimmedTxt) return;
      res.push({ texto: trimmedTxt, tipo: typeMap[type] || 'action' });
    });
    return res;
  } catch (e) {
    console.error('Error parsing FDX:', e);
    throw new Error('Falha ao processar arquivo FDX.');
  }
}