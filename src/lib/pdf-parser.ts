import * as pdfjs from 'pdfjs-dist';
import { ScriptLine, LineType } from '../types';

// Usa o worker empacotado para evitar CSP
import workerUrl from 'pdfjs-dist/build/pdf.worker.mjs?url';
pdfjs.GlobalWorkerOptions.workerSrc = workerUrl;

export async function parsePDF(buf: ArrayBuffer): Promise<ScriptLine[]> {
  try {
    const loadingTask = pdfjs.getDocument({
      data: new Uint8Array(buf),
      cMapUrl: `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/cmaps/`,
      cMapPacked: true,
    });
    const pdf = await loadingTask.promise;
    const allLines: { text: string; x: number; y: number; page: number }[] = [];

    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i);
      const content = await page.getTextContent();
      const viewport = page.getViewport({ scale: 1.0 });
      const pageHeight = viewport.height;
      const items = content.items
        .map((item: any) => ({
          str: item.str,
          x: item.transform[4],
          y: item.transform[5],
        }))
        .filter((item) => item.str.trim().length > 0);
      items.sort((a, b) => b.y - a.y || a.x - b.x);

      let currentLine: any = null;
      items.forEach((item) => {
        const relY = item.y / pageHeight;
        if (relY < 0.05 || relY > 0.95) return;
        if (!currentLine || Math.abs(item.y - currentLine.y) > 5) {
          if (currentLine) allLines.push(currentLine);
          currentLine = { text: item.str, x: item.x, y: item.y, page: i };
        } else {
          currentLine.text += (currentLine.text.endsWith(' ') ? '' : ' ') + item.str;
          currentLine.x = Math.min(currentLine.x, item.x);
        }
      });
      if (currentLine) allLines.push(currentLine);
    }

    if (allLines.length === 0) throw new Error('PDF sem texto extraível.');

    // Detecta margens
    const xCoords = allLines.map((l) => Math.round(l.x / 10) * 10);
    const freq: Record<number, number> = {};
    xCoords.forEach((x) => (freq[x] = (freq[x] || 0) + 1));
    const sortedFreq = Object.entries(freq).sort((a, b) => b[1] - a[1]);
    const peaks = sortedFreq.slice(0, 5).map((p) => Number(p[0])).sort((a, b) => a - b);
    const actionMargin = peaks[0] || 50;
    const dialogueMargin = peaks.find((p) => p > actionMargin + 40) || 150;
    const characterMargin = peaks.find((p) => p > dialogueMargin + 40) || 220;

    const result: ScriptLine[] = [];
    let currentCharacter = '';

    allLines.forEach((line) => {
      const text = line.text.trim();
      const x = line.x;
      const isUpper = text === text.toUpperCase() && /[A-Z]/.test(text);
      let tipo: LineType = 'action';
      let narrador: string | undefined = undefined;

      const isScene = /^(INT\.|EXT\.|INT\/EXT\.|I\/E\.|EST\.|CENA|SEQUÊNCIA|SCENE|LOCAL:)/i.test(text);
      const isTransition =
        /^(FADE|CUT|DISSOLVE|CORTE|SUBIDA|DESCIDA|FIM|THE END|FECHA|VOLTA)/i.test(text) ||
        (x > 350 && isUpper);

      const distToChar = Math.abs(x - characterMargin);
      const distToDiag = Math.abs(x - dialogueMargin);

      if (isScene) {
        tipo = 'scene';
        currentCharacter = '';
      } else if (isTransition) {
        tipo = 'transition';
        currentCharacter = '';
      } else if (isUpper && distToChar < 40 && text.length < 40 && !text.startsWith('(')) {
        tipo = 'character';
        currentCharacter = text.replace(/\(.*?\)/g, '').trim();
      } else if (text.startsWith('(') && text.endsWith(')') && (distToDiag < 50 || distToChar < 50)) {
        tipo = 'direction';
        narrador = currentCharacter;
      } else if (currentCharacter && (distToDiag < 60 || (x > dialogueMargin - 20 && x < characterMargin))) {
        tipo = 'dialogue';
        narrador = currentCharacter;
      } else {
        if (currentCharacter && x > dialogueMargin - 20 && x < characterMargin) {
          tipo = 'dialogue';
          narrador = currentCharacter;
        } else {
          tipo = 'action';
          currentCharacter = '';
        }
      }
      result.push({ texto: text, tipo, narrador });
    });

    // Mescla linhas consecutivas
    const finalResult: ScriptLine[] = [];
    result.forEach((line) => {
      const last = finalResult[finalResult.length - 1];
      if (
        last &&
        last.tipo === line.tipo &&
        last.narrador === line.narrador &&
        line.tipo !== 'character' &&
        line.tipo !== 'scene'
      ) {
        last.texto += ' ' + line.texto;
      } else {
        finalResult.push({ ...line });
      }
    });
    return finalResult;
  } catch (err) {
    console.error('Erro no parsePDF:', err);
    throw err;
  }
}
