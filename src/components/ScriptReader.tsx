import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Play, Pause, SkipBack, SkipForward, RotateCcw, 
  Upload, FileText, Clipboard, Globe, Mic, 
  User, Settings, X, Check, Edit3, Trash2, 
  Plus, Undo2, CreditCard, AlertCircle, Menu, Search, Languages
} from 'lucide-react';
import { ScriptLine, Character, CastingProfile, LineType } from '../types';
import { parseFDX } from '../lib/fdx-parser';
import { parseFountain } from '../lib/fountain-parser';
import { parsePDF } from '../lib/pdf-parser';
import { parseGeneric } from '../lib/generic-parser';
import { cn } from '../lib/utils';
import pt from '../locales/pt';
import en from '../locales/en';

const PALETTE = [
  { bg: '#2a1f3d', cor: '#c4a8ff' }, { bg: '#1f2d2a', cor: '#7ec8a8' },
  { bg: '#2d1f1f', cor: '#e8a0a0' }, { bg: '#1f2535', cor: '#90b8e8' },
  { bg: '#2d2a1f', cor: '#e8d090' }, { bg: '#1f2d2d', cor: '#90d8d8' },
  { bg: '#2d1f2a', cor: '#e8a0d8' }, { bg: '#1f2820', cor: '#a0d890' },
];

const CASTING_PROFILES: CastingProfile[] = [
  { id: 'homem-adulto', label: 'Homem adulto', icon: '👨', masc: true, jovem: false, idoso: false },
  { id: 'homem-jovem', label: 'Homem jovem', icon: '👦', masc: true, jovem: true, idoso: false },
  { id: 'homem-idoso', label: 'Homem idoso', icon: '👴', masc: true, jovem: false, idoso: true },
  { id: 'mulher-adulta', label: 'Mulher adulta', icon: '👩', masc: false, jovem: false, idoso: false },
  { id: 'mulher-jovem', label: 'Mulher jovem', icon: '👧', masc: false, jovem: true, idoso: false },
  { id: 'mulher-idosa', label: 'Mulher idosa', icon: '👵', masc: false, jovem: false, idoso: true },
  { id: 'crianca', label: 'Criança', icon: '🧒', masc: null, jovem: true, idoso: false },
  { id: 'neutro', label: 'Neutro / Narrador', icon: '🎭', masc: null, jovem: false, idoso: false },
];

const SPEEDS = [0.75, 1, 1.25, 1.5, 2];

interface ScriptReaderProps {
  onBack: () => void;
}

// Helper function moved outside component
function deveExibir(l: ScriptLine, readMode: 'tudo' | 'dialogos' | 'acao'): boolean {
  if (readMode === 'tudo') return true;
  if (readMode === 'dialogos') return l.tipo === 'character' || l.tipo === 'dialogue' || l.tipo === 'direction' || l.tipo === 'scene';
  if (readMode === 'acao') return l.tipo === 'action' || l.tipo === 'scene';
  return true;
}

const PROMPT_PT = `Formate o texto abaixo seguindo EXATAMENTE estas regras:

MANTER APENAS: cabeçalhos de cena (INT./EXT. + LOCAL + PERÍODO), ações simples, nomes de personagem e diálogos.
REMOVER: títulos, autor, lista de personagens, numerações, atos/cenas, CONT'D, MORE, comentários editoriais.
AÇÃO: converter rubricas e parênteses em ação simples. Não interpretar nem expandir.
DIÁLOGO: nome em MAIÚSCULO, fala na linha abaixo, sem direções entre parênteses.
Retorne apenas o roteiro formatado, sem explicações.

TEXTO: [cole aqui]`;

const PROMPT_EN = `Format the text below following EXACTLY these rules:

KEEP ONLY: scene headings (INT./EXT. + LOCATION + TIME), simple action, character names and dialogue.
REMOVE: title, author, character list, numbering, acts/scenes, CONT'D, MORE, editorial comments.
ACTION: convert stage directions and parentheticals into simple action. Do not interpret or expand.
DIALOGUE: character name in UPPERCASE, line below with dialogue, no parenthetical directions.
Return only the formatted script, no explanations.

TEXT: [paste here]`;

export default function ScriptReader({ onBack }: ScriptReaderProps) {
  const [lang, setLang] = useState<'pt' | 'en'>('pt');
  const t = lang === 'pt' ? pt : en;

  useEffect(() => {
    const saved = localStorage.getItem('colega-lang') as 'pt' | 'en' | null;
    if (saved) setLang(saved);
  }, []);

  const switchLang = () => {
    const newLang = lang === 'pt' ? 'en' : 'pt';
    setLang(newLang);
    localStorage.setItem('colega-lang', newLang);
  };

  const [lines, setLines] = useState<ScriptLine[]>([]);
  const [characters, setCharacters] = useState<Record<string, Character>>({});
  const [currentLineIdx, setCurrentLineIdx] = useState(0);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [speedIdx, setSpeedIdx] = useState(1);
  const [language, setLanguage] = useState('pt-BR');
  const [readMode, setReadMode] = useState<'tudo' | 'dialogos' | 'acao'>('tudo');
  const [isActorMode, setIsActorMode] = useState(false);
  const [actorCharacter, setActorCharacter] = useState('');
  const [isWaitingForActor, setIsWaitingForActor] = useState(false);
  const [narratorVoiceId, setNarratorVoiceId] = useState<string | null>(null);
  const [narratorProfile, setNarratorProfile] = useState('neutro');
  
  const isPlayingRef = useRef(false);
  const lastStartedIdx = useRef(-1);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  
  const [elKey, setElKey] = useState('');
  const [elVoices, setElVoices] = useState<any[]>([]);
  const [elStatus, setElStatus] = useState<'off' | 'checking' | 'ok' | 'err'>('off');
  const [cartKey, setCartKey] = useState('');
  const [cartVoices, setCartVoices] = useState<any[]>([]);
  const [cartStatus, setCartStatus] = useState<'off' | 'checking' | 'ok' | 'err'>('off');
  const [voiceProvider, setVoiceProvider] = useState<'elevenlabs' | 'cartesia'>('elevenlabs');
  
  const [isLoading, setIsLoading] = useState(false);
  const [loadingMsg, setLoadingMsg] = useState('');
  const [scriptName, setScriptName] = useState('');
  const [showPaste, setShowPaste] = useState(false);
  const [pasteText, setPasteText] = useState('');
  
  // Preview State
  const [showPreview, setShowPreview] = useState(false);
  const [previewLines, setPreviewLines] = useState<ScriptLine[]>([]);
  const [previewSel, setPreviewSel] = useState(-1);
  const [previewHistory, setPreviewHistory] = useState<ScriptLine[][]>([]);

  const pushPreviewHistory = (newLines: ScriptLine[]) => {
    setPreviewHistory(prev => [...prev.slice(-19), previewLines]);
    setPreviewLines(newLines);
  };

  const undoPreview = () => {
    if (previewHistory.length === 0) return;
    const last = previewHistory[previewHistory.length - 1];
    setPreviewLines(last);
    setPreviewHistory(prev => prev.slice(0, -1));
  };
  
  // Modals
  const [showPaywall, setShowPaywall] = useState(false);
  const [showVoiceModal, setShowVoiceModal] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [copiedPrompt, setCopiedPrompt] = useState(false);
  
  const synth = useRef<SpeechSynthesis | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const currentUtterance = useRef<SpeechSynthesisUtterance | null>(null);
  const scriptViewRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    synth.current = window.speechSynthesis;
    return () => {
      synth.current?.cancel();
      if (audioRef.current) audioRef.current.pause();
    };
  }, []);

  const speed = SPEEDS[speedIdx];

  useEffect(() => {
    const loadVoices = () => {
      if (synth.current) {
        synth.current.getVoices();
      }
    };
    if (window.speechSynthesis) {
      window.speechSynthesis.onvoiceschanged = loadVoices;
      loadVoices();
    }
    return () => {
      if (window.speechSynthesis) {
        window.speechSynthesis.onvoiceschanged = null;
      }
    };
  }, [language]);

  useEffect(() => {
    isPlayingRef.current = isPlaying;
  }, [isPlaying]);

  const stopAudio = useCallback(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    if (audioRef.current) {
      audioRef.current.onended = null;
      audioRef.current.onerror = null;
      audioRef.current.pause();
      audioRef.current = null;
    }
    if (synth.current) {
      if (currentUtterance.current) {
        currentUtterance.current.onend = null;
        currentUtterance.current.onerror = null;
      }
      synth.current.cancel();
    }
  }, []);

  const getVoiceForCharacter = useCallback((narrador: string | null) => {
    if (!synth.current) return null;
    const voices = synth.current.getVoices();
    // Try exact lang match first, then prefix, then all voices
    const exactLang = voices.filter(v => v.lang === language);
    const prefixLang = voices.filter(v => v.lang.startsWith(language.slice(0, 2)));
    const targetVoices = exactLang.length > 0 ? exactLang : prefixLang.length > 0 ? prefixLang : voices;

    // Broader gender detection: includes macOS named voices (pt-BR: Luciana/Felipe; en: Samantha/Alex)
    const MASC_NAMES = ['male','masculin','man','homem','diego','carlos','jorge','daniel','thomas','fred','reed','mark','rodrigo','lucas','victor','felipe','alex','jorge','rishi','luca','reed','arthur'];
    const FEM_NAMES  = ['female','feminina','woman','mulher','luciana','francisca','joana','alice','anna','sara','karen','samantha','victoria','monica','paula','julia','claire','kate','marie','fiona','moira','tessa','veena','ioana','milena'];

    const isMasc = (v: SpeechSynthesisVoice) => MASC_NAMES.some(w => v.name.toLowerCase().includes(w));
    const isFem  = (v: SpeechSynthesisVoice) => FEM_NAMES.some(w  => v.name.toLowerCase().includes(w));

    const mascVoices = targetVoices.filter(isMasc);
    const femVoices  = targetVoices.filter(isFem);
    const neutVoices = targetVoices.filter(v => !isMasc(v) && !isFem(v));

    const pickFrom = (pool: SpeechSynthesisVoice[], idx: number) =>
      pool.length > 0 ? pool[idx % pool.length] : targetVoices[idx % targetVoices.length];

    if (!narrador) {
      const profile = CASTING_PROFILES.find(p => p.id === narratorProfile);
      if (profile?.masc === true)  return pickFrom(mascVoices.length ? mascVoices : neutVoices, 0);
      if (profile?.masc === false) return pickFrom(femVoices.length  ? femVoices  : neutVoices, 0);
      return targetVoices[0];
    }

    if (!characters[narrador]) return targetVoices[0];
    const char = characters[narrador];
    const profile = CASTING_PROFILES.find(p => p.id === char.perfil);
    const charIdx = Object.keys(characters).indexOf(narrador);

    if (!profile) return targetVoices[charIdx % targetVoices.length];
    if (profile.masc === true)  return pickFrom(mascVoices.length ? mascVoices : neutVoices, charIdx);
    if (profile.masc === false) return pickFrom(femVoices.length  ? femVoices  : neutVoices, charIdx);
    return pickFrom(neutVoices, charIdx);
  }, [characters, language, narratorProfile]);

  const speakWithBrowser = (texto: string, narrador: string | null, onEnd: () => void) => {
    if (!synth.current) return onEnd();
    const utt = new SpeechSynthesisUtterance(texto);
    utt.lang = language;
    utt.rate = speed;
    const voice = getVoiceForCharacter(narrador);
    if (voice) utt.voice = voice;
    let done = false;
    const finish = () => {
      if (done) return;
      done = true;
      onEnd();
    };
    utt.onend = finish;
    utt.onerror = finish;
    currentUtterance.current = utt;
    synth.current.speak(utt);
  };

  const speakWithCartesia = (texto: string, voiceId: string, onEnd: () => void) => {
    fetch('https://api.cartesia.ai/tts/bytes', {
      method: 'POST',
      headers: { 'X-API-Key': cartKey, 'Cartesia-Version': '2024-06-10', 'Content-Type': 'application/json' },
      body: JSON.stringify({
        transcript: texto,
        model_id: 'sonic-multilingual',
        voice: { mode: 'id', id: voiceId },
        output_format: { container: 'mp3', encoding: 'mp3', sample_rate: 44100 }
      })
    })
    .then(r => { if (!r.ok) throw new Error(); return r.blob(); })
    .then(blob => {
      if (!isPlayingRef.current) return;
      const url = URL.createObjectURL(blob);
      const audio = new Audio(url);
      audioRef.current = audio;
      audio.onended = () => { URL.revokeObjectURL(url); onEnd(); };
      audio.onerror = () => { URL.revokeObjectURL(url); speakWithBrowser(texto, null, onEnd); };
      audio.play();
    })
    .catch(() => speakWithBrowser(texto, null, onEnd));
  };

  const speakText = useCallback((texto: string, narrador: string | null, onEnd: () => void) => {
    if (!isPlayingRef.current) return;
    stopAudio();

    const charVoiceId = narrador ? characters[narrador]?.elVozId : narratorVoiceId;
    const charCartId  = narrador ? characters[narrador]?.cartVozId : undefined;

    // Cartesia
    if (voiceProvider === 'cartesia' && cartKey && cartVoices.length) {
      const vid = charCartId || (cartVoices[0]?.id);
      if (vid) { speakWithCartesia(texto, vid, onEnd); return; }
    }

    // ElevenLabs — character voice
    if (elKey && elVoices.length && narrador && charVoiceId) {
      fetch(`https://api.elevenlabs.io/v1/text-to-speech/${charVoiceId}`, {
        method: 'POST',
        headers: { 'xi-api-key': elKey, 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: texto, model_id: 'eleven_multilingual_v2', voice_settings: { stability: 0.5, similarity_boost: 0.75 } })
      })
      .then(r => { if (!r.ok) throw new Error(); return r.blob(); })
      .then(blob => {
        if (!isPlayingRef.current) return;
        const url = URL.createObjectURL(blob);
        const audio = new Audio(url);
        audioRef.current = audio;
        audio.onended = () => { URL.revokeObjectURL(url); onEnd(); };
        audio.onerror = () => { URL.revokeObjectURL(url); speakWithBrowser(texto, narrador, onEnd); };
        audio.play();
      })
      .catch(() => speakWithBrowser(texto, narrador, onEnd));
      return;
    }

    // ElevenLabs — narrator voice
    if (elKey && elVoices.length && !narrador && narratorVoiceId) {
      fetch(`https://api.elevenlabs.io/v1/text-to-speech/${narratorVoiceId}`, {
        method: 'POST',
        headers: { 'xi-api-key': elKey, 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: texto, model_id: 'eleven_multilingual_v2' })
      })
      .then(r => r.blob())
      .then(blob => {
        if (!isPlayingRef.current) return;
        const url = URL.createObjectURL(blob);
        const audio = new Audio(url);
        audioRef.current = audio;
        audio.onended = () => { URL.revokeObjectURL(url); onEnd(); };
        audio.play();
      })
      .catch(() => speakWithBrowser(texto, narrador, onEnd));
      return;
    }

    speakWithBrowser(texto, narrador, onEnd);
  }, [elKey, elVoices, cartKey, cartVoices, voiceProvider, characters, stopAudio, language, speed, getVoiceForCharacter, narratorVoiceId]);

  const playLine = useCallback((idx: number) => {
    lastStartedIdx.current = idx;
    if (timerRef.current) clearTimeout(timerRef.current);
    if (!isPlayingRef.current || idx >= lines.length) {
      setIsPlaying(false);
      setIsWaitingForActor(false);
      return;
    }
    if (idx > 0 && idx % 275 === 0) {
      setIsPlaying(false);
      setShowPaywall(true);
      return;
    }
    setCurrentLineIdx(idx);
    const line = lines[idx];
    const el = document.getElementById(`line-${idx}`);
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
    if (line.tipo === 'character') {
      timerRef.current = setTimeout(() => { if (isPlayingRef.current) playLine(idx + 1); }, 100);
      return;
    }
    if (line.tipo === 'scene' || line.tipo === 'transition') {
      timerRef.current = setTimeout(() => { if (isPlayingRef.current) playLine(idx + 1); }, 300);
      return;
    }
    const shouldRead = readMode === 'tudo' || (readMode === 'dialogos' && (line.tipo === 'dialogue' || line.tipo === 'direction')) || (readMode === 'acao' && line.tipo === 'action');
    if (!shouldRead) {
      timerRef.current = setTimeout(() => { if (isPlayingRef.current) playLine(idx + 1); }, 50);
      return;
    }
    if (isActorMode && actorCharacter && line.narrador === actorCharacter && line.tipo === 'dialogue') {
      setIsWaitingForActor(true);
      return;
    }
    // Remove parentheticals like (V.O.), (O.S.), (CONT'D) from spoken text
    const textoLimpo = line.texto.replace(/\(.*?\)/g, '').trim();
    if (!textoLimpo) {
      timerRef.current = setTimeout(() => { if (isPlayingRef.current) playLine(idx + 1); }, 50);
      return;
    }
    speakText(textoLimpo, line.narrador || null, () => {
      if (isPlayingRef.current) {
        lastStartedIdx.current = idx + 1;
        playLine(idx + 1);
      }
    });
  }, [lines, readMode, isActorMode, actorCharacter, speakText]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Space' && isWaitingForActor) {
        e.preventDefault();
        setIsWaitingForActor(false);
        playLine(currentLineIdx + 1);
      } else if (e.code === 'Space' && !showPreview && !showVoiceModal && !showPaste) {
        e.preventDefault();
        setIsPlaying(prev => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isWaitingForActor, currentLineIdx, playLine, showPreview, showVoiceModal, showPaste]);

  const previewVoice = (voiceId: string | null, profileId: string | null) => {
    if (!synth.current) return;
    synth.current.cancel();
    if (elKey && voiceId) {
      fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`, {
        method: 'POST',
        headers: { 'xi-api-key': elKey, 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: lang === 'en' ? "Hello, this is my voice in Scene Partner." : "Olá, esta é a minha voz no Colega de Cena.", model_id: 'eleven_multilingual_v2' })
      })
      .then(r => r.blob())
      .then(blob => { const url = URL.createObjectURL(blob); new Audio(url).play(); });
    } else {
      const utt = new SpeechSynthesisUtterance(lang === 'en' ? "Hello, this is my voice in Scene Partner." : "Olá, esta é a minha voz no Colega de Cena.");
      utt.lang = language;
      const voices = synth.current.getVoices();
      const langVoices = voices.filter(v => v.lang.startsWith(language.slice(0, 2)));
      const targetVoices = langVoices.length > 0 ? langVoices : voices;
      if (profileId) {
        const profile = CASTING_PROFILES.find(p => p.id === profileId);
        const ehMasc = (v: SpeechSynthesisVoice) => v.name.toLowerCase().includes('male') || v.name.toLowerCase().includes('masculin');
        const ehFem = (v: SpeechSynthesisVoice) => v.name.toLowerCase().includes('female') || v.name.toLowerCase().includes('feminina');
        if (profile?.masc === true) utt.voice = targetVoices.find(ehMasc) || targetVoices[0];
        else if (profile?.masc === false) utt.voice = targetVoices.find(ehFem) || targetVoices[0];
        else utt.voice = targetVoices[0];
      } else {
        utt.voice = targetVoices[0];
      }
      synth.current.speak(utt);
    }
  };

  useEffect(() => {
    if (isPlaying && !isWaitingForActor) {
      if (lastStartedIdx.current !== currentLineIdx) {
        lastStartedIdx.current = currentLineIdx;
        playLine(currentLineIdx);
      }
    } else if (!isPlaying) {
      lastStartedIdx.current = -1;
      stopAudio();
    }
  }, [isPlaying, isWaitingForActor, currentLineIdx, playLine, stopAudio]);

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const ext = file.name.split('.').pop()?.toLowerCase();
    setIsLoading(true);
    setLoadingMsg(`${t['common.loading']} ${file.name}...`);
    setScriptName(file.name);
    try {
      let parsedLines: ScriptLine[] = [];
      const reader = new FileReader();
      if (ext === 'fdx') {
        reader.onload = (ev) => { parsedLines = parseFDX(ev.target?.result as string); applyLines(parsedLines, file.name, true); };
        reader.readAsText(file, 'UTF-8');
      } else if (ext === 'fountain' || ext === 'ftn') {
        reader.onload = (ev) => { parsedLines = parseFountain(ev.target?.result as string); applyLines(parsedLines, file.name, true); };
        reader.readAsText(file, 'UTF-8');
      } else if (ext === 'pdf') {
        reader.onload = async (ev) => {
          try {
            const lines = await parsePDF(ev.target?.result as ArrayBuffer);
            if (!lines || lines.length === 0) throw new Error('No lines found');
            openPreview(lines, file.name);
          } catch (err) { alert('Erro ao ler PDF'); setIsLoading(false); }
        };
        reader.onerror = () => { alert('Erro ao carregar arquivo'); setIsLoading(false); };
        reader.readAsArrayBuffer(file);
      } else {
        reader.onload = (ev) => { parsedLines = parseGeneric(ev.target?.result as string); openPreview(parsedLines, file.name); };
        reader.readAsText(file, 'UTF-8');
      }
    } catch (err) { console.error(err); setIsLoading(false); }
  };

  const applyLines = (newLines: ScriptLine[], name: string, skipPreview: boolean) => {
    if (!skipPreview) { openPreview(newLines, name); return; }
    const chars: Record<string, Character> = {};
    let charIdx = 0;
    let lastChar: string | null = null;
    const processedLines = newLines.map(l => {
      if (l.tipo === 'character') {
        const name = l.texto.replace(/\(.*?\)/g, '').trim();
        if (name && !chars[name]) {
          const palette = PALETTE[charIdx % PALETTE.length];
          chars[name] = {
            nome: name, voz: 'neutro', perfil: '', cor: palette.cor, bg: palette.bg,
            iniciais: name.split(' ').slice(0, 2).map(w => w[0]).join(''), elVozId: '', cartVozId: ''
          };
          charIdx++;
        }
        lastChar = name;
      }
      if (l.tipo === 'scene') lastChar = null;
      const narrador = (l.tipo === 'dialogue' || l.tipo === 'direction') ? lastChar : null;
      return { ...l, narrador };
    });
    setLines(processedLines);
    setCharacters(chars);
    setCurrentLineIdx(0);
    setIsLoading(false);
    setScriptName(name);
    setShowPaste(false);
  };

  const openPreview = (lines: ScriptLine[], name: string) => {
    setPreviewLines(lines);
    setScriptName(name);
    setShowPreview(true);
    setIsLoading(false);
  };

  const confirmPreview = () => { applyLines(previewLines, scriptName, true); setShowPreview(false); };
  const togglePlayState = () => {
    if (isWaitingForActor) { setIsWaitingForActor(false); setIsPlaying(true); playLine(currentLineIdx + 1); }
    else { setIsPlaying(!isPlaying); }
  };
  const nextLine = () => { setIsPlaying(false); setCurrentLineIdx(prev => Math.min(prev + 1, lines.length - 1)); };
  const prevLine = () => { setIsPlaying(false); setCurrentLineIdx(prev => Math.max(prev - 1, 0)); };
  const restart = () => { setIsPlaying(false); setCurrentLineIdx(0); stopAudio(); };
  const saveELKey = async () => {
    if (!elKey) return;
    setElStatus('checking');
    try {
      const resp = await fetch('https://api.elevenlabs.io/v1/voices', { headers: { 'xi-api-key': elKey } });
      if (!resp.ok) throw new Error();
      const data = await resp.json();
      setElVoices(data.voices);
      setElStatus('ok');
    } catch { setElStatus('err'); }
  };

  const saveCartKey = async () => {
    if (!cartKey) return;
    setCartStatus('checking');
    try {
      const resp = await fetch('https://api.cartesia.ai/voices', {
        headers: { 'X-API-Key': cartKey, 'Cartesia-Version': '2024-06-10' }
      });
      if (!resp.ok) throw new Error();
      const data = await resp.json();
      setCartVoices(data);
      setCartStatus('ok');
    } catch { setCartStatus('err'); }
  };

  return (
    <div className="flex flex-col h-screen bg-[#0a0a0a] text-[#f0ece4] font-sans overflow-hidden">
      <header className="flex justify-between items-center px-6 py-3 border-b border-[#2a2a2a] bg-[#0a0a0a] z-50">
        <div className="flex items-center gap-3">
          <button onClick={() => setIsSidebarOpen(!isSidebarOpen)} className="md:hidden p-2 hover:bg-[#1e1e1e] rounded-lg text-[#e8d5a3]"><Menu size={20} /></button>
          <div className="font-serif text-xl text-[#e8d5a3] cursor-pointer" onClick={() => onBack()}>{lang === 'pt' ? 'Colega de Cena' : 'Scene Partner'} <small className="text-[0.65rem] text-[#777] font-sans ml-1">v4</small></div>
        </div>
        <div className="flex items-center gap-4">
          <button onClick={switchLang} className="flex items-center gap-1 text-[0.7rem] text-[#777] hover:text-[#e8d5a3] transition-colors"><Languages size={14} />{lang === 'pt' ? 'EN' : 'PT'}</button>
          <span className="text-[0.72rem] text-[#777] hidden sm:inline">{lines.length > 0 ? `${lang === 'pt' ? 'página ' : 'page '}${Math.floor(currentLineIdx / 55) + 1} ${lang === 'pt' ? 'de' : 'of'} ${Math.ceil(lines.length / 55)}` : ''}</span>
          <button onClick={() => setShowPaywall(true)} className="bg-[#e8d5a3] text-[#0a0a0a] px-4 py-1.5 rounded-md text-[0.78rem] font-medium hover:bg-[#c4a87a] transition-colors">{t['app.unlock']}</button>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden relative">
        {isSidebarOpen && <div className="fixed inset-0 bg-black/60 z-40 md:hidden" onClick={() => setIsSidebarOpen(false)} />}
        <aside className={cn("fixed inset-y-0 left-0 w-72 border-r border-[#2a2a2a] flex flex-col shrink-0 overflow-y-auto bg-[#0a0a0a] z-50 transition-transform duration-300 md:relative md:translate-x-0 custom-scrollbar", isSidebarOpen ? "translate-x-0" : "-translate-x-full")}>
          <section className="p-4 border-b border-[#2a2a2a]">
            <div className="text-[0.6rem] tracking-widest uppercase text-[#777] mb-3">{t['sidebar.upload']}</div>
            <div className="grid grid-cols-3 gap-2 mb-3">
              <button onClick={() => document.getElementById('file-fdx')?.click()} className="flex flex-col items-center p-2 bg-[#1e1e1e] border border-[#2a2a2a] rounded-lg hover:border-[#e8d5a3] group transition-all">
                <span className="text-lg mb-1 group-hover:scale-110 transition-transform">⭐</span>
                <span className="text-[0.68rem]">FDX</span>
                <span className="text-[0.55rem] text-[#5cb87a] bg-[#5cb87a]/10 px-1 rounded mt-1">{t['sidebar.recommended']}</span>
                <input type="file" id="file-fdx" accept=".fdx,.fountain,.ftn" className="hidden" onChange={handleFile} />
              </button>
              <button onClick={() => document.getElementById('file-pdf')?.click()} className="flex flex-col items-center p-2 bg-[#1e1e1e] border border-[#2a2a2a] rounded-lg hover:border-[#e8d5a3] group transition-all">
                <span className="text-lg mb-1 group-hover:scale-110 transition-transform">📄</span>
                <span className="text-[0.68rem]">PDF</span>
                <span className="text-[0.55rem] text-[#e05252] bg-[#e05252]/10 px-1 rounded mt-1">{t['sidebar.review']}</span>
                <input type="file" id="file-pdf" accept=".pdf" className="hidden" onChange={handleFile} />
              </button>
              <button onClick={() => setShowPaste(!showPaste)} className="flex flex-col items-center p-2 bg-[#1e1e1e] border border-[#2a2a2a] rounded-lg hover:border-[#e8d5a3] group transition-all">
                <span className="text-lg mb-1 group-hover:scale-110 transition-transform">📋</span>
                <span className="text-[0.68rem]">{t['sidebar.paste']}</span>
                <span className="text-[0.55rem] text-[#e05252] bg-[#e05252]/10 px-1 rounded mt-1">{t['sidebar.review']}</span>
              </button>
            </div>
            {showPaste && (
              <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="mt-2">
                <textarea className="w-full h-24 bg-[#1e1e1e] border border-[#2a2a2a] rounded-lg p-3 text-xs focus:outline-none focus:border-[#e8d5a3] resize-none" placeholder="Cole o texto da cena aqui..." value={pasteText} onChange={(e) => setPasteText(e.target.value)} />
                <div className="flex gap-2 mt-2">
                  <button onClick={() => applyLines(parseGeneric(pasteText), 'Texto Colado', false)} className="flex-1 bg-[#e8d5a3] text-[#0a0a0a] py-2 rounded-lg text-sm font-medium hover:bg-[#c4a87a]">{t['sidebar.process']}</button>
                  <button onClick={() => setPasteText('')} className="px-3 bg-[#1e1e1e] border border-[#2a2a2a] rounded-lg text-[#777] hover:text-white"><Trash2 size={16} /></button>
                </div>
              </motion.div>
            )}
            {lines.length > 0 && (
              <div className="mt-4 p-3 bg-[#1e1e1e] rounded-lg border border-[#2a2a2a]">
                <div className="text-sm font-medium truncate mb-1">{scriptName}</div>
                <div className="text-[0.7rem] text-[#777] mb-2">{lines.length} linhas · {Object.keys(characters).length} personagens</div>
                <button onClick={() => openPreview(lines, scriptName)} className="w-full py-1.5 border border-[#2a2a2a] rounded text-[0.7rem] text-[#777] hover:text-[#e8d5a3] hover:border-[#e8d5a3] transition-colors flex items-center justify-center gap-1"><Edit3 className="w-3 h-3" /> {t['sidebar.editScript']}</button>
              </div>
            )}
          </section>

          {/* Copy prompt button */}
          <section className="px-4 py-3 border-b border-[#2a2a2a]">
            <div className="text-[0.6rem] tracking-widest uppercase text-[#777] mb-2">
              {lang === 'pt' ? 'PDF com problemas?' : 'PDF issues?'}
            </div>
            <button
              onClick={() => {
                const prompt = lang === 'pt' ? PROMPT_PT : PROMPT_EN;
                navigator.clipboard.writeText(prompt).then(() => {
                  setCopiedPrompt(true);
                  setTimeout(() => setCopiedPrompt(false), 2500);
                });
              }}
              className="flex items-center gap-2 w-full py-2 px-3 rounded-lg border border-dashed border-[#2a2a2a] hover:border-[#e8d5a3]/50 text-[#555] hover:text-[#e8d5a3] transition-all group"
            >
              <span className="text-[0.9rem]">{copiedPrompt ? '✓' : '⎘'}</span>
              <div className="flex-1 min-w-0 text-left">
                <div className="text-[0.72rem] font-medium">
                  {copiedPrompt
                    ? (lang === 'pt' ? 'Prompt copiado!' : 'Prompt copied!')
                    : (lang === 'pt' ? 'Copiar prompt de formatação' : 'Copy formatting prompt')}
                </div>
                <div className="text-[0.62rem] text-[#444] group-hover:text-[#777] mt-0.5">
                  {lang === 'pt' ? 'Cole em qualquer IA para reformatar →' : 'Paste into any AI to reformat →'}
                </div>
              </div>
            </button>
          </section>

          <section className="p-4 border-b border-[#2a2a2a]">
            <div className="text-[0.6rem] tracking-widest uppercase text-[#777] mb-3">{t['sidebar.language']}</div>
            <div className="flex gap-1">
              {['pt-BR', 'en-US', 'es-ES'].map(langCode => (
                <button key={langCode} onClick={() => setLanguage(langCode)} className={cn("flex-1 py-1.5 rounded border border-[#2a2a2a] text-[0.7rem] transition-all", language === langCode ? "bg-[#e8d5a3] text-[#0a0a0a] border-[#e8d5a3]" : "text-[#777] hover:border-[#e8d5a3]")}>
                  {langCode === 'pt-BR' ? '🇧🇷 PT' : langCode === 'en-US' ? '🇺🇸 EN' : '🇪🇸 ES'}
                </button>
              ))}
            </div>
          </section>

          <section className="p-4 border-b border-[#2a2a2a]">
            <div className="text-[0.6rem] tracking-widest uppercase text-[#777] mb-3">{t['sidebar.readMode']}</div>
            <div className="flex border border-[#2a2a2a] rounded-lg overflow-hidden">
              {(['tudo', 'dialogos', 'acao'] as const).map(mode => (
                <button key={mode} onClick={() => setReadMode(mode)} className={cn("flex-1 py-2 text-[0.68rem] transition-all capitalize", readMode === mode ? "bg-[#1e1e1e] text-[#f0ece4]" : "text-[#777] hover:text-[#f0ece4]")}>
                  {mode === 'tudo' ? t['sidebar.tudo'] : mode === 'dialogos' ? t['sidebar.dialogos'] : t['sidebar.acao']}
                </button>
              ))}
            </div>
          </section>

          <section className="p-4 border-b border-[#2a2a2a]">
            <div className="text-[0.6rem] tracking-widest uppercase text-[#777] mb-3 flex items-center gap-1"><Mic className="w-3 h-3" /> {lang === 'pt' ? 'Vozes com IA' : 'AI Voices'}</div>
            {/* Provider tabs */}
            <div className="flex gap-1 mb-3">
              {(['elevenlabs', 'cartesia'] as const).map(p => (
                <button key={p} onClick={() => setVoiceProvider(p)} className={cn("flex-1 py-1.5 rounded text-[0.68rem] border transition-all", voiceProvider === p ? "bg-[#e8d5a3] text-[#0a0a0a] border-[#e8d5a3]" : "text-[#777] border-[#2a2a2a] hover:border-[#e8d5a3]")}>
                  {p === 'elevenlabs' ? 'ElevenLabs' : 'Cartesia'}
                </button>
              ))}
            </div>
            {voiceProvider === 'elevenlabs' ? (
              <>
                <div className="flex gap-2 mb-2">
                  <input type="password" className="flex-1 bg-[#1e1e1e] border border-[#2a2a2a] rounded-md px-3 py-1.5 text-xs focus:outline-none focus:border-[#e8d5a3]" placeholder={t['sidebar.apiKeyPlaceholder']} value={elKey} onChange={(e) => setElKey(e.target.value)} />
                  <button onClick={saveELKey} className="bg-[#e8d5a3] text-[#0a0a0a] px-3 py-1.5 rounded-md text-xs font-medium">{t['sidebar.ok']}</button>
                </div>
                <div className={cn("text-[0.65rem] px-2 py-1 rounded border", elStatus === 'ok' ? "bg-[#5cb87a]/10 text-[#5cb87a] border-[#5cb87a]/20" : elStatus === 'err' ? "bg-[#e05252]/10 text-[#e05252] border-[#e05252]/20" : "bg-[#1e1e1e] text-[#777] border-[#2a2a2a]")}>
                  {elStatus === 'ok' ? `✓ ${elVoices.length} ${lang === 'pt' ? 'vozes' : 'voices'}` : elStatus === 'err' ? (lang === 'pt' ? 'API Key inválida' : 'Invalid API Key') : elStatus === 'checking' ? (lang === 'pt' ? 'Verificando...' : 'Checking...') : t['sidebar.noKey']}
                </div>
              </>
            ) : (
              <>
                <div className="flex gap-2 mb-2">
                  <input type="password" className="flex-1 bg-[#1e1e1e] border border-[#2a2a2a] rounded-md px-3 py-1.5 text-xs focus:outline-none focus:border-[#e8d5a3]" placeholder="Cartesia API Key..." value={cartKey} onChange={(e) => setCartKey(e.target.value)} />
                  <button onClick={saveCartKey} className="bg-[#e8d5a3] text-[#0a0a0a] px-3 py-1.5 rounded-md text-xs font-medium">{t['sidebar.ok']}</button>
                </div>
                <div className={cn("text-[0.65rem] px-2 py-1 rounded border", cartStatus === 'ok' ? "bg-[#5cb87a]/10 text-[#5cb87a] border-[#5cb87a]/20" : cartStatus === 'err' ? "bg-[#e05252]/10 text-[#e05252] border-[#e05252]/20" : "bg-[#1e1e1e] text-[#777] border-[#2a2a2a]")}>
                  {cartStatus === 'ok' ? `✓ ${cartVoices.length} ${lang === 'pt' ? 'vozes' : 'voices'}` : cartStatus === 'err' ? (lang === 'pt' ? 'API Key inválida' : 'Invalid API Key') : cartStatus === 'checking' ? (lang === 'pt' ? 'Verificando...' : 'Checking...') : (lang === 'pt' ? 'Sem Key — usando voz do navegador' : 'No Key — using browser voice')}
                </div>
                <a href="https://cartesia.ai" target="_blank" rel="noopener noreferrer" className="text-[0.6rem] text-[#555] hover:text-[#e8d5a3] mt-1 block">cartesia.ai →</a>
              </>
            )}
          </section>

          <section className="p-4 border-b border-[#2a2a2a]">
            <div className="text-[0.6rem] tracking-widest uppercase text-[#777] mb-3">{t['sidebar.actorMode']}</div>
            {lines.length === 0 ? <div className="text-[0.72rem] text-[#777] text-center py-2 italic">{t['sidebar.loadFirst']}</div> : (
              <div className="space-y-3">
                <select className="w-full bg-[#1e1e1e] border border-[#2a2a2a] rounded-lg px-3 py-2 text-[0.78rem] focus:outline-none focus:border-[#e8d5a3]" value={actorCharacter} onChange={(e) => setActorCharacter(e.target.value)}>
                  <option value="">{t['sidebar.selectCharacter']}</option>
                  {Object.keys(characters).map(name => <option key={name} value={name}>{name}</option>)}
                </select>
                <button onClick={() => { if (!actorCharacter) return alert(t['sidebar.selectCharacter']); setIsActorMode(!isActorMode); }} className={cn("w-full py-2 rounded-lg text-[0.78rem] font-medium transition-all", isActorMode ? "bg-[#e05252] text-white" : "bg-[#1e1e1e] border border-[#2a2a2a] text-[#f0ece4] hover:border-[#e8d5a3] hover:text-[#e8d5a3]")}>
                  {isActorMode ? t['sidebar.deactivate'] : t['sidebar.activate']}
                </button>
                {isActorMode && <p className="text-[0.66rem] text-[#777] text-center leading-relaxed" dangerouslySetInnerHTML={{ __html: t['sidebar.actorHint'] }} />}
              </div>
            )}
          </section>

          <section className="p-4 flex-1">
            <div className="text-[0.6rem] tracking-widest uppercase text-[#777] mb-3">{t['sidebar.characters']}</div>
            <div className="space-y-2">
              <div className="flex items-center gap-3 p-2 rounded-lg border border-transparent hover:bg-[#1e1e1e] hover:border-[#2a2a2a] transition-all">
                <div className="w-8 h-8 rounded-full bg-[#2a2a2a] flex items-center justify-center text-[0.65rem] font-bold shrink-0 text-[#777]">NA</div>
                <div className="flex-1 min-w-0">
                  <div className="text-[0.78rem] font-medium truncate">{t['sidebar.narrator']}</div>
                  <div className="text-[0.65rem] text-[#777] truncate">{narratorVoiceId && elVoices.length ? `EL: ${elVoices.find((v: any) => v.voice_id === narratorVoiceId)?.name}` : `${CASTING_PROFILES.find(p => p.id === narratorProfile)?.icon} ${CASTING_PROFILES.find(p => p.id === narratorProfile)?.label}`}</div>
                </div>
                <button onClick={() => setShowVoiceModal('__narrator__')} className="text-[0.7rem] text-[#e8d5a3] border border-[#e8d5a3]/30 rounded-lg px-3 py-1.5 hover:bg-[#e8d5a3] hover:text-[#0a0a0a] transition-all font-medium">{t['sidebar.changeVoice']}</button>
              </div>
              {Object.keys(characters).length === 0 ? <div className="text-[0.72rem] text-[#777] text-center py-4">{t['sidebar.loadFirst']}</div> : Object.entries(characters).map(([name, charData]) => {
                const char = charData as Character;
                const isActor = isActorMode && actorCharacter === name;
                const profile = CASTING_PROFILES.find(p => p.id === char.perfil);
                const voiceLabel = isActor ? '🎭 modo ator' : (char.elVozId && elVoices.length ? `EL: ${elVoices.find((v: any) => v.voice_id === char.elVozId)?.name || '—'}` : (profile ? `${profile.icon} ${profile.label}` : '— definir voz'));
                return (
                  <div key={name} className={cn("flex items-center gap-3 p-2 rounded-lg border border-transparent transition-all", isActor ? "border-[#e8d5a3] bg-[#e8d5a3]/5" : "hover:bg-[#1e1e1e] hover:border-[#2a2a2a]")}>
                    <div className="w-8 h-8 rounded-full flex items-center justify-center text-[0.65rem] font-bold shrink-0" style={{ backgroundColor: char.bg, color: char.cor }}>{char.iniciais}</div>
                    <div className="flex-1 min-w-0"><div className="text-[0.82rem] font-medium truncate flex items-center gap-1">{name}{isActor && <span className="text-[0.6rem] text-[#e8d5a3] border border-[#e8d5a3] rounded px-1.5 py-0.5 ml-1">você</span>}</div><div className="text-[0.7rem] text-[#777] truncate mt-0.5">{voiceLabel}</div></div>
                    {!isActor && <button onClick={() => setShowVoiceModal(name)} className="text-[0.7rem] text-[#e8d5a3] border border-[#e8d5a3]/30 rounded-lg px-3 py-1.5 hover:bg-[#e8d5a3] hover:text-[#0a0a0a] transition-all font-medium whitespace-nowrap">{t['sidebar.changeVoice']}</button>}
                  </div>
                );
              })}
            </div>
          </section>
        </aside>

        <main className="flex-1 flex flex-col bg-[#0a0a0a] relative">
          <div ref={scriptViewRef} className="flex-1 overflow-y-auto px-6 py-12 md:px-24 max-w-3xl mx-auto w-full scroll-smooth">
            {isLoading ? (
              <div className="h-full flex flex-col items-center justify-center text-[#777]"><div className="w-8 h-8 border-2 border-[#2a2a2a] border-t-[#e8d5a3] rounded-full animate-spin mb-4" /><p className="text-sm">{loadingMsg}</p></div>
            ) : lines.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center"><div className="text-5xl mb-6">🎬</div><h3 className="font-serif text-2xl mb-2">{t['sidebar.upload']}</h3><p className="text-[#777] text-sm max-w-xs mb-8">Escolha um arquivo no painel ao lado para começar.</p><div className="bg-[#1e1e1e] border border-[#2a2a2a] rounded-xl p-6 text-left max-w-sm"><div className="text-sm mb-2"><strong>⭐ Melhor qualidade: FDX</strong></div><p className="text-xs text-[#777] leading-relaxed">No Final Draft: <strong>File → Save As → .fdx</strong><br />Leitura 100% fiel ao original, sem necessidade de revisão.</p></div></div>
            ) : (
              <div className="space-y-1">
                {lines.map((line, i) => {
                  const isSpeaking = currentLineIdx === i;
                  const isDimmed = !deveExibir(line, readMode);
                  const isActorTurn = isActorMode && actorCharacter && line.narrador === actorCharacter && line.tipo === 'dialogue';
                  return (
                    <div key={i} id={`line-${i}`} className={cn("text-[0.88rem] leading-relaxed px-2 py-0.5 rounded transition-all duration-300", line.tipo === 'scene' && "text-[0.76rem] text-[#777] font-medium mt-8 mb-2 tracking-wide uppercase", line.tipo === 'character' && "text-[0.76rem] font-bold text-center uppercase mt-6 mb-1", line.tipo === 'direction' && "text-[0.76rem] text-[#777] italic text-center px-[20%] mb-1", line.tipo === 'dialogue' && "px-[17%] mb-1", line.tipo === 'transition' && "text-[0.76rem] text-[#777] text-right mt-4 mb-2 uppercase", line.tipo === 'action' && "mb-2", isSpeaking && "bg-[#e8d5a3]/15 border-l-2 border-[#e8d5a3]", isActorTurn && "bg-[#e05252]/10 border-l-2 border-[#e05252]", isDimmed && "opacity-20 grayscale blur-[0.5px]")} style={line.tipo === 'character' ? { color: characters[line.texto.replace(/\(.*?\)/g, '').trim()]?.cor } : {}}>
                      {line.texto}
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          <AnimatePresence>{isWaitingForActor && (<motion.div initial={{ opacity: 0, y: 20, x: '-50%' }} animate={{ opacity: 1, y: 0, x: '-50%' }} exit={{ opacity: 0, y: 20, x: '-50%' }} className="fixed bottom-32 left-1/2 z-50"><button onClick={() => setIsWaitingForActor(false)} className="bg-[#e05252] text-white px-8 py-4 rounded-full font-serif text-lg shadow-2xl shadow-[#e05252]/40 flex items-center gap-3 hover:scale-105 transition-transform">{t['actor.continue']} <kbd className="bg-white/20 px-2 py-0.5 rounded text-xs font-sans">espaço</kbd></button></motion.div>)}</AnimatePresence>

          <footer className="border-t border-[#2a2a2a] bg-[#141414] p-4 md:px-8">
            <div className="max-w-3xl mx-auto">
              <div className="flex justify-between items-center mb-3"><div className="flex items-center gap-2 min-w-0 flex-1">{isPlaying && (<div className="flex items-center gap-2"><div className="w-1.5 h-1.5 rounded-full bg-[#e8d5a3] animate-pulse" /><span className="text-[0.73rem] text-[#e8d5a3] font-medium truncate">{isWaitingForActor ? `${t['player.yourTurn']} ${actorCharacter}` : (lines[currentLineIdx]?.narrador || t['player.reading'])}</span></div>)}</div><div className="text-[0.7rem] text-[#777] whitespace-nowrap">{t['player.line']} {currentLineIdx + 1} {t['player.of']} {lines.length}</div></div>
              <div className="h-1 bg-[#2a2a2a] rounded-full mb-4 cursor-pointer group relative" onClick={(e) => { const rect = e.currentTarget.getBoundingClientRect(); const pct = (e.clientX - rect.left) / rect.width; setCurrentLineIdx(Math.floor(pct * lines.length)); }}><div className="h-full bg-[#e8d5a3] rounded-full transition-all" style={{ width: `${lines.length > 0 ? (currentLineIdx / lines.length) * 100 : 0}%` }} /><div className="absolute top-1/2 -translate-y-1/2 w-3 h-3 bg-[#e8d5a3] rounded-full opacity-0 group-hover:opacity-100 transition-opacity" style={{ left: `${lines.length > 0 ? (currentLineIdx / lines.length) * 100 : 0}%` }} /></div>
              <div className="flex items-center justify-center gap-6"><button onClick={() => { setSpeedIdx((speedIdx + 1) % SPEEDS.length); }} className="text-[0.7rem] text-[#777] border border-[#2a2a2a] px-2 py-0.5 rounded hover:text-[#e8d5a3] hover:border-[#e8d5a3]">{SPEEDS[speedIdx]}×</button><button onClick={prevLine} className="text-[#777] hover:text-[#f0ece4] transition-colors"><SkipBack className="w-5 h-5" /></button><button onClick={togglePlayState} className="w-12 h-12 bg-[#e8d5a3] text-[#0a0a0a] rounded-full flex items-center justify-center hover:scale-105 transition-all shadow-lg shadow-[#e8d5a3]/10">{isPlaying && !isWaitingForActor ? <Pause className="w-6 h-6 fill-current" /> : <Play className="w-6 h-6 fill-current ml-1" />}</button><button onClick={nextLine} className="text-[#777] hover:text-[#f0ece4] transition-colors"><SkipForward className="w-5 h-5" /></button><button onClick={restart} className="text-[#777] hover:text-[#f0ece4] transition-colors"><RotateCcw className="w-5 h-5" /></button></div>
            </div>
          </footer>
        </main>
      </div>

      {/* ── PREVIEW MODAL ── */}
      <AnimatePresence>
        {showPreview && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/80 z-[200] flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ scale: 0.96, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.96, opacity: 0 }}
              className="bg-[#111] border border-[#2a2a2a] rounded-xl w-full max-w-5xl h-[85vh] flex flex-col overflow-hidden"
            >
              <div className="flex items-center justify-between p-4 border-b border-[#2a2a2a] shrink-0">
                <div>
                  <h2 className="font-serif text-lg text-[#f0ece4]">{t['preview.title']}</h2>
                  <p className="text-[0.7rem] text-[#777] mt-0.5">{t['preview.subtitle']}</p>
                </div>
                <div className="flex items-center gap-2">
                  <button onClick={undoPreview} disabled={previewHistory.length === 0} className="text-[0.72rem] text-[#777] border border-[#2a2a2a] px-3 py-1.5 rounded-lg hover:text-[#f0ece4] disabled:opacity-30 flex items-center gap-1"><Undo2 className="w-3 h-3" /> {t['preview.undo']}</button>
                  <button onClick={() => { setShowPreview(false); setIsLoading(false); }} className="text-[0.72rem] text-[#777] border border-[#2a2a2a] px-3 py-1.5 rounded-lg hover:text-[#f0ece4]">{t['preview.cancel']}</button>
                  <button onClick={confirmPreview} className="bg-[#e8d5a3] text-[#0a0a0a] px-4 py-1.5 rounded-lg text-[0.78rem] font-medium hover:bg-[#c4a87a]">{t['preview.confirm']}</button>
                </div>
              </div>
              <div className="flex flex-1 overflow-hidden">
                {/* Line list */}
                <div className="flex-1 overflow-y-auto p-4 space-y-0.5 custom-scrollbar">
                  {previewLines.map((line, i) => (
                    <div
                      key={i}
                      onClick={() => setPreviewSel(i)}
                      className={cn(
                        "flex items-start gap-3 px-3 py-2 rounded-lg cursor-pointer group transition-all",
                        previewSel === i ? "bg-[#e8d5a3]/10 border border-[#e8d5a3]/30" : "hover:bg-[#1e1e1e] border border-transparent"
                      )}
                    >
                      <span className="text-[0.6rem] text-[#555] w-6 shrink-0 pt-0.5 text-right">{i + 1}</span>
                      <span className={cn(
                        "text-[0.72rem] px-1.5 py-0.5 rounded shrink-0",
                        line.tipo === 'scene' && "bg-[#2a2a2a] text-[#777]",
                        line.tipo === 'action' && "bg-[#1e2a1e] text-[#7ec8a8]",
                        line.tipo === 'character' && "bg-[#2a1f3d] text-[#c4a8ff]",
                        line.tipo === 'dialogue' && "bg-[#1f2535] text-[#90b8e8]",
                        line.tipo === 'direction' && "bg-[#2d2a1f] text-[#e8d090]",
                        line.tipo === 'transition' && "bg-[#2a2a2a] text-[#999]"
                      )}>
                        {line.tipo}
                      </span>
                      <span className={cn(
                        "text-[0.82rem] leading-snug flex-1 min-w-0 truncate",
                        line.tipo === 'character' && "font-bold uppercase",
                        line.tipo === 'scene' && "uppercase text-[#777]",
                        line.tipo === 'direction' && "italic text-[#777]"
                      )}>
                        {line.texto}
                      </span>
                    </div>
                  ))}
                </div>
                {/* Edit panel */}
                <div className="w-72 border-l border-[#2a2a2a] p-4 shrink-0 overflow-y-auto">
                  {previewSel < 0 ? (
                    <p className="text-[0.72rem] text-[#555] text-center pt-8">{t['preview.clickToEdit']}</p>
                  ) : (
                    <div className="space-y-4">
                      <div className="text-[0.65rem] uppercase tracking-widest text-[#777] mb-2">{t['preview.editLine']} #{previewSel + 1}</div>
                      <div>
                        <label className="text-[0.65rem] text-[#777] uppercase tracking-wider block mb-1">{t['preview.type']}</label>
                        <select
                          value={previewLines[previewSel]?.tipo}
                          onChange={e => {
                            const updated = [...previewLines];
                            updated[previewSel] = { ...updated[previewSel], tipo: e.target.value as any };
                            pushPreviewHistory(updated);
                          }}
                          className="w-full bg-[#1e1e1e] border border-[#2a2a2a] rounded-lg px-3 py-2 text-[0.78rem] focus:outline-none focus:border-[#e8d5a3]"
                        >
                          {['scene','action','character','dialogue','direction','transition'].map(t => (
                            <option key={t} value={t}>{t}</option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="text-[0.65rem] text-[#777] uppercase tracking-wider block mb-1">{t['preview.text']}</label>
                        <textarea
                          rows={4}
                          value={previewLines[previewSel]?.texto}
                          onChange={e => {
                            const updated = [...previewLines];
                            updated[previewSel] = { ...updated[previewSel], texto: e.target.value };
                            setPreviewLines(updated);
                          }}
                          className="w-full bg-[#1e1e1e] border border-[#2a2a2a] rounded-lg px-3 py-2 text-[0.78rem] focus:outline-none focus:border-[#e8d5a3] resize-none"
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <button onClick={() => { if (previewSel <= 0) return; const u=[...previewLines]; [u[previewSel-1],u[previewSel]]=[u[previewSel],u[previewSel-1]]; pushPreviewHistory(u); setPreviewSel(previewSel-1); }} className="text-[0.7rem] border border-[#2a2a2a] rounded-lg py-1.5 text-[#777] hover:text-[#f0ece4] hover:border-[#e8d5a3]">↑ {t['preview.up']}</button>
                        <button onClick={() => { if (previewSel >= previewLines.length-1) return; const u=[...previewLines]; [u[previewSel],u[previewSel+1]]=[u[previewSel+1],u[previewSel]]; pushPreviewHistory(u); setPreviewSel(previewSel+1); }} className="text-[0.7rem] border border-[#2a2a2a] rounded-lg py-1.5 text-[#777] hover:text-[#f0ece4] hover:border-[#e8d5a3]">↓ {t['preview.down']}</button>
                        <button onClick={() => { const u=[...previewLines]; u.splice(previewSel,0,{texto:'',tipo:'action'}); pushPreviewHistory(u); }} className="text-[0.7rem] border border-[#2a2a2a] rounded-lg py-1.5 text-[#777] hover:text-[#5cb87a] hover:border-[#5cb87a] col-span-2">+ {t['preview.insertBefore']}</button>
                        <button onClick={() => { const u=[...previewLines]; u.splice(previewSel+1,0,{texto:'',tipo:'action'}); pushPreviewHistory(u); setPreviewSel(previewSel+1); }} className="text-[0.7rem] border border-[#2a2a2a] rounded-lg py-1.5 text-[#777] hover:text-[#5cb87a] hover:border-[#5cb87a] col-span-2">+ {t['preview.insertAfter']}</button>
                        <button onClick={() => { const u=[...previewLines]; u.splice(previewSel,1); pushPreviewHistory(u); setPreviewSel(Math.max(0,previewSel-1)); }} className="text-[0.7rem] border border-[#e05252]/30 rounded-lg py-1.5 text-[#e05252] hover:bg-[#e05252]/10 col-span-2 flex items-center justify-center gap-1"><Trash2 className="w-3 h-3" /> {t['preview.delete']}</button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── VOICE MODAL ── */}
      <AnimatePresence>
        {showVoiceModal !== null && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/80 z-[200] flex items-center justify-center p-4"
            onClick={() => setShowVoiceModal(null)}
          >
            <motion.div
              initial={{ scale: 0.96, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.96, opacity: 0 }}
              className="bg-[#111] border border-[#2a2a2a] rounded-xl w-full max-w-md overflow-hidden"
              onClick={e => e.stopPropagation()}
            >
              <div className="flex items-center justify-between p-4 border-b border-[#2a2a2a]">
                <div>
                  <h2 className="font-serif text-lg text-[#f0ece4]">
                    {showVoiceModal === '__narrator__' ? t['sidebar.narrator'] : `${t['voice.title']} ${showVoiceModal}`}
                  </h2>
                  <p className="text-[0.68rem] text-[#777] mt-0.5">{t['voice.subtitle']}</p>
                </div>
                <button onClick={() => setShowVoiceModal(null)} className="text-[#777] hover:text-[#f0ece4]"><X className="w-5 h-5" /></button>
              </div>
              <div className="p-4 space-y-4 max-h-[70vh] overflow-y-auto custom-scrollbar">
                {/* Search */}
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#555]" />
                  <input
                    type="text"
                    placeholder={t['voice.search']}
                    value={searchTerm}
                    onChange={e => setSearchTerm(e.target.value)}
                    className="w-full bg-[#1e1e1e] border border-[#2a2a2a] rounded-lg pl-9 pr-4 py-2 text-[0.78rem] focus:outline-none focus:border-[#e8d5a3]"
                  />
                </div>
                {/* System / Profile voices */}
                <div>
                  <div className="text-[0.6rem] uppercase tracking-widest text-[#777] mb-2">{t['voice.system']}</div>
                  <div className="space-y-1">
                    {CASTING_PROFILES.filter(p => !searchTerm || p.label.toLowerCase().includes(searchTerm.toLowerCase())).map(profile => {
                      const isSelected = showVoiceModal === '__narrator__'
                        ? narratorProfile === profile.id
                        : characters[showVoiceModal!]?.perfil === profile.id;
                      return (
                        <button
                          key={profile.id}
                          onClick={() => {
                            if (showVoiceModal === '__narrator__') {
                              setNarratorProfile(profile.id);
                              setNarratorVoiceId(null);
                            } else {
                              setCharacters(prev => ({ ...prev, [showVoiceModal!]: { ...prev[showVoiceModal!], perfil: profile.id, elVozId: '' } }));
                            }
                            previewVoice(null, profile.id);
                          }}
                          className={cn(
                            "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left transition-all",
                            isSelected ? "bg-[#e8d5a3]/10 border border-[#e8d5a3]/40" : "hover:bg-[#1e1e1e] border border-transparent"
                          )}
                        >
                          <span className="text-xl">{profile.icon}</span>
                          <span className="text-[0.82rem]">{profile.label}</span>
                          {isSelected && <Check className="w-4 h-4 text-[#e8d5a3] ml-auto" />}
                        </button>
                      );
                    })}
                  </div>
                </div>
                {/* ElevenLabs voices */}
                {elVoices.length > 0 && (
                  <div>
                    <div className="text-[0.6rem] uppercase tracking-widest text-[#777] mb-2">ElevenLabs</div>
                    <div className="space-y-1">
                      {elVoices
                        .filter((v: any) => !searchTerm || v.name.toLowerCase().includes(searchTerm.toLowerCase()))
                        .map((v: any) => {
                          const currentVoiceId = showVoiceModal === '__narrator__' ? narratorVoiceId : characters[showVoiceModal!]?.elVozId;
                          const isSelected = currentVoiceId === v.voice_id;
                          return (
                            <button
                              key={v.voice_id}
                              onClick={() => {
                                if (showVoiceModal === '__narrator__') {
                                  setNarratorVoiceId(v.voice_id);
                                } else {
                                  setCharacters(prev => ({ ...prev, [showVoiceModal!]: { ...prev[showVoiceModal!], elVozId: v.voice_id } }));
                                }
                                previewVoice(v.voice_id, null);
                              }}
                              className={cn(
                                "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left transition-all",
                                isSelected ? "bg-[#e8d5a3]/10 border border-[#e8d5a3]/40" : "hover:bg-[#1e1e1e] border border-transparent"
                              )}
                            >
                              <span className="text-xl">🎙️</span>
                              <div className="flex-1 min-w-0">
                                <div className="text-[0.82rem]">{v.name}</div>
                                {v.labels?.accent && <div className="text-[0.65rem] text-[#555]">{v.labels.accent}</div>}
                              </div>
                              {isSelected && <Check className="w-4 h-4 text-[#e8d5a3]" />}
                            </button>
                          );
                        })}
                    </div>
                  </div>
                )}

                {/* Cartesia voices */}
                {cartVoices.length > 0 && (
                  <div>
                    <div className="text-[0.6rem] uppercase tracking-widest text-[#777] mb-2">Cartesia</div>
                    <div className="space-y-1">
                      {cartVoices
                        .filter((v: any) => !searchTerm || v.name.toLowerCase().includes(searchTerm.toLowerCase()))
                        .map((v: any) => {
                          const currentId = characters[showVoiceModal!]?.cartVozId;
                          const isSelected = currentId === v.id;
                          return (
                            <button
                              key={v.id}
                              onClick={() => {
                                if (showVoiceModal !== '__narrator__') {
                                  setCharacters(prev => ({ ...prev, [showVoiceModal!]: { ...prev[showVoiceModal!], cartVozId: v.id } }));
                                }
                                setVoiceProvider('cartesia');
                              }}
                              className={cn(
                                "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left transition-all",
                                isSelected ? "bg-[#e8d5a3]/10 border border-[#e8d5a3]/40" : "hover:bg-[#1e1e1e] border border-transparent"
                              )}
                            >
                              <span className="text-xl">🔊</span>
                              <div className="flex-1 min-w-0">
                                <div className="text-[0.82rem]">{v.name}</div>
                                {v.language && <div className="text-[0.65rem] text-[#555]">{v.language}</div>}
                              </div>
                              {isSelected && <Check className="w-4 h-4 text-[#e8d5a3]" />}
                            </button>
                          );
                        })}
                    </div>
                  </div>
                )}
              </div>
              <div className="p-4 border-t border-[#2a2a2a]">
                <button onClick={() => setShowVoiceModal(null)} className="w-full py-2 border border-[#2a2a2a] rounded-lg text-[0.78rem] text-[#777] hover:text-[#f0ece4] hover:border-[#e8d5a3]">{t['voice.close']}</button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── DONATION MODAL ── */}
      <AnimatePresence>
        {showPaywall && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/85 z-[200] flex items-center justify-center p-4 backdrop-blur-sm"
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 20 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.95, opacity: 0 }}
              className="bg-[#111] border border-[#2a2a2a] rounded-2xl w-full max-w-sm overflow-hidden text-center"
            >
              <div className="px-8 pt-8 pb-2">
                <div className="text-4xl mb-3">🎬</div>
                <h2 className="font-serif text-2xl text-[#f0ece4] mb-2">
                  {lang === 'pt' ? 'Gostou do Colega de Cena?' : 'Enjoying Scene Partner?'}
                </h2>
                <p className="text-[0.8rem] text-[#777] leading-relaxed mb-5">
                  {lang === 'pt'
                    ? 'Você leu 5 páginas. O app é e sempre será gratuito. Se quiser apoiar o projeto, qualquer valor ajuda.'
                    : "You've read 5 pages. The app is and always will be free. If you'd like to support the project, any amount helps."
                  }
                </p>

                {/* Stripe */}
                <a
                  href="https://buy.stripe.com/00w3cu6QG5Cb07F3LkeQM00"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-3 w-full bg-[#635bff] hover:bg-[#4f49cc] rounded-xl px-4 py-3 transition-all mb-2"
                >
                  <span className="text-lg">💳</span>
                  <div className="flex-1 text-left">
                    <div className="text-[0.82rem] font-medium text-white">Stripe</div>
                    <div className="text-[0.68rem] text-white/70">
                      {lang === 'pt' ? 'A partir de US$ 11 · cartão internacional' : 'From US$ 11 · international card'}
                    </div>
                  </div>
                  <span className="text-white/60 text-sm">→</span>
                </a>

                {/* Ko-fi */}
                <a
                  href="https://ko-fi.com/lucianomello11"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-3 w-full bg-[#ff5e5b] hover:bg-[#e04e4b] rounded-xl px-4 py-3 transition-all mb-2"
                >
                  <span className="text-lg">☕</span>
                  <div className="flex-1 text-left">
                    <div className="text-[0.82rem] font-medium text-white">Ko-fi</div>
                    <div className="text-[0.68rem] text-white/70">
                      {lang === 'pt' ? 'A partir de US$ 11 · cartão e PayPal' : 'From US$ 11 · card & PayPal'}
                    </div>
                  </div>
                  <span className="text-white/60 text-sm">→</span>
                </a>

                {/* PIX */}
                <div className="w-full bg-[#1e1e1e] border border-[#2a2a2a] rounded-xl px-4 py-3 mb-5 text-left">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-lg">🇧🇷</span>
                    <span className="text-[0.82rem] font-medium text-[#f0ece4]">PIX</span>
                    <span className="text-[0.68rem] text-[#777]">
                      {lang === 'pt' ? '· valor livre' : '· any amount'}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <code className="text-[0.72rem] text-[#e8d5a3] bg-[#0a0a0a] px-2 py-1 rounded flex-1 truncate select-all">
                      onze11films@gmail.com
                    </code>
                    <button
                      onClick={() => navigator.clipboard.writeText('onze11films@gmail.com')}
                      className="text-[0.65rem] text-[#777] border border-[#2a2a2a] rounded px-2 py-1 hover:text-[#e8d5a3] hover:border-[#e8d5a3] shrink-0"
                    >
                      {lang === 'pt' ? 'copiar' : 'copy'}
                    </button>
                  </div>
                </div>
              </div>

              <div className="border-t border-[#2a2a2a] px-8 py-4">
                <button
                  onClick={() => { setShowPaywall(false); setIsPlaying(true); }}
                  className="w-full py-2.5 text-[0.75rem] text-[#555] hover:text-[#f0ece4] transition-colors"
                >
                  {lang === 'pt' ? 'Continuar lendo sem apoiar →' : 'Continue reading without supporting →'}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── COPYRIGHT FOOTER ── */}
      <div className="fixed bottom-0 right-0 px-3 py-1 text-[0.55rem] text-[#333] pointer-events-none select-none z-10">
        © {new Date().getFullYear()} Luciano Mello · Colega de Cena / Scene Partner
      </div>
    </div>
  );
}