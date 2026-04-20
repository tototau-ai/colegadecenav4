import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Play, Users, Globe, Shield, CheckCircle, ArrowRight, Mic, Languages } from 'lucide-react';
import pt from '../locales/pt';
import en from '../locales/en';

const PROMPT_PT = `Formate o texto abaixo seguindo EXATAMENTE estas regras:

MANTER APENAS:
- Cabeçalhos de cena no formato: INT. ou EXT. + LOCAL + PERÍODO DO DIA
- Ações em texto simples e direto
- Nome de personagem
- Diálogo

REMOVER COMPLETAMENTE:
- Títulos da obra, nome de autor, lista de personagens
- Indicação de ato, cena, numeração ou estrutura teatral
- Códigos, siglas ou marcações técnicas
- Indicações como CONT'D, MORE, etc.
- Comentários editoriais ou literários

AÇÃO:
- Converter qualquer rubrica, parênteses ou descrição em ação simples
- Não interpretar, não expandir e não resumir
- Manter apenas o que for visível ou executável em cena

DIÁLOGO:
- Nome do personagem em MAIÚSCULO
- Linha abaixo com o diálogo
- Remover indicações como "(emocionado)", "(à parte)" etc.
- Não reescrever falas, apenas corrigir gramática

FORMATAÇÃO:
- Texto limpo, sem explicações
- Sem comentários fora do roteiro
- Sem adicionar conteúdo novo
- Manter ordem original do texto

LINGUAGEM:
- Corrigir ortografia e pontuação
- Não alterar estilo ou intenção

Retorne apenas o roteiro formatado.

TEXTO: [cole aqui]`;

const PROMPT_EN = `Format the text below following EXACTLY these rules:

KEEP ONLY:
- Scene headings in format: INT. or EXT. + LOCATION + TIME OF DAY
- Action in plain, direct text
- Character names
- Dialogue

REMOVE COMPLETELY:
- Title, author name, character list
- Act/scene numbers or theatrical structure
- Technical codes or markings
- CONT'D, MORE, etc.
- Editorial or literary comments

ACTION:
- Convert any stage directions, parentheses or descriptions into simple action
- Do not interpret, expand or summarize
- Keep only what is visible or executable on screen

DIALOGUE:
- Character name in UPPERCASE
- Dialogue on the line below
- Remove directions like "(emotional)", "(aside)" etc.
- Do not rewrite lines, only correct grammar

FORMATTING:
- Clean text, no explanations
- No comments outside the script
- No added content
- Keep original order

LANGUAGE:
- Fix spelling and punctuation
- Do not alter style or intent

Return only the formatted script.

TEXT: [paste here]`;

function CopyPromptButton({ lang }: { lang: 'pt' | 'en' }) {
  const [copied, setCopied] = useState(false);
  const copy = () => {
    navigator.clipboard.writeText(lang === 'pt' ? PROMPT_PT : PROMPT_EN).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    });
  };
  return (
    <button
      onClick={copy}
      className="flex items-center gap-2 text-[0.7rem] border border-[#333] rounded-lg px-4 py-1.5 transition-all hover:border-[#e8c97a] hover:text-[#e8c97a] text-[#666]"
    >
      {copied
        ? (lang === 'pt' ? '✓ Copiado!' : '✓ Copied!')
        : (lang === 'pt' ? '⎘ Copiar prompt' : '⎘ Copy prompt')}
    </button>
  );
}

interface LandingPageProps {
  onStart: () => void;
}

export default function LandingPage({ onStart }: LandingPageProps) {
  const [lang, setLang] = useState<'pt' | 'en'>('pt');
  const t = lang === 'pt' ? pt : en;

  useEffect(() => {
    // Persist language choice in localStorage
    const saved = localStorage.getItem('colega-lang') as 'pt' | 'en' | null;
    if (saved) setLang(saved);
  }, []);

  const switchLang = () => {
    const newLang = lang === 'pt' ? 'en' : 'pt';
    setLang(newLang);
    localStorage.setItem('colega-lang', newLang);
  };

  return (
    <div className="min-h-screen bg-[#080808] text-[#f0ece4] font-['Outfit'] selection:bg-[#e8c97a] selection:text-[#080808]">
      {/* Grain Overlay */}
      <div className="fixed inset-0 pointer-events-none z-[1000] opacity-40 mix-blend-overlay">
        <svg viewBox="0 0 256 256" xmlns="http://www.w3.org/2000/svg">
          <filter id="noise">
            <feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="4" stitchTiles="stitch" />
          </filter>
          <rect width="100%" height="100%" filter="url(#noise)" opacity="0.04" />
        </svg>
      </div>

      {/* Nav */}
      <nav className="flex justify-between items-center px-6 md:px-16 py-6 border-b border-[#222] sticky top-0 bg-[#080808]/90 backdrop-blur-xl z-[100]">
        <div className="font-['Playfair_Display'] text-xl text-[#e8c97a] tracking-tight">
          Colega de <span>Cena</span>
        </div>
        <div className="flex items-center gap-4">
          <button
            onClick={switchLang}
            className="flex items-center gap-1 text-sm text-[#666] hover:text-[#e8c97a] transition-colors"
          >
            <Languages size={16} />
            {lang === 'pt' ? 'EN' : 'PT'}
          </button>
          <div className="hidden md:flex items-center gap-8 text-sm text-[#666]">
            <a href="#como-funciona" className="hover:text-[#f0ece4] transition-colors">
              {lang === 'pt' ? 'Como funciona' : 'How it works'}
            </a>
            <a href="#recursos" className="hover:text-[#f0ece4] transition-colors">
              {lang === 'pt' ? 'Recursos' : 'Features'}
            </a>
            <a
              href="https://youtube.com/playlist?list=PL7sThU9gIoMec2EQ9ZB_KZv888x5bAzy6&si=0-aSpwPj7a25L-GR"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-[#e8c97a] transition-colors flex items-center gap-1"
            >
              ▶ {lang === 'pt' ? 'Tutoriais' : 'Tutorials'}
            </a>
            <button onClick={onStart} className="bg-[#e8c97a] text-[#080808] px-5 py-2 rounded-md font-medium hover:bg-[#c4a052] transition-all transform hover:-translate-y-0.5">
              {lang === 'pt' ? 'Experimentar Grátis →' : 'Try for Free →'}
            </button>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="min-h-[90vh] flex flex-col items-center justify-center text-center px-6 py-16 relative overflow-hidden">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-[0.72rem] tracking-[0.18em] uppercase text-[#c4a052] mb-6 flex items-center gap-3">
          <div className="h-px w-10 bg-[#c4a052]/50" />
          {t['landing.tagline']}
          <div className="h-px w-10 bg-[#c4a052]/50" />
        </motion.div>
        <motion.h1 initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="font-['Playfair_Display'] text-5xl md:text-8xl leading-[1.05] max-w-4xl mb-6 tracking-tight"
          dangerouslySetInnerHTML={{ __html: t['landing.title'] }} />
        <motion.p initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="text-lg text-[#666] max-w-xl leading-relaxed mb-12 font-light">
          {t['landing.subtitle']}
        </motion.p>
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="flex flex-col sm:flex-row gap-4 justify-center">
          <button onClick={onStart} className="bg-[#e8c97a] text-[#080808] px-9 py-4 rounded-lg text-lg font-medium hover:bg-[#c4a052] transition-all transform hover:-translate-y-1">
            {t['landing.cta']}
          </button>
          <a href="#como-funciona" className="bg-transparent text-[#f0ece4] px-9 py-4 rounded-lg text-lg border border-[#222] hover:border-[#e8c97a] hover:text-[#e8c97a] transition-all">
            {t['landing.how']}
          </a>
        </motion.div>
        <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.4 }} className="text-xs text-[#666] mt-6" dangerouslySetInnerHTML={{ __html: t['landing.free'] }} />
      </section>

      {/* Film Strip */}
      <div className="w-full overflow-hidden py-8 border-y border-[#222] bg-[#111] relative">
        <div className="flex gap-12 animate-marquee whitespace-nowrap">
          {[...Array(4)].map((_, i) => (
            <React.Fragment key={i}>
              <span className="text-[#e8c97a] text-[0.72rem] tracking-[0.15em] uppercase">Colega de Cena</span>
              <span className="text-[#666] text-[0.72rem] tracking-[0.15em] uppercase">Scene Partner</span>
              <span className="text-[0.72rem]">🎬</span>
              <span className="text-[#666] text-[0.72rem] tracking-[0.15em] uppercase">Ouça seu roteiro</span>
              <span className="text-[#e8c97a] text-[0.72rem] tracking-[0.15em] uppercase">Modo Ator</span>
              <span className="text-[#666] text-[0.72rem] tracking-[0.15em] uppercase">Vozes de personagens</span>
              <span className="text-[0.72rem]">🎭</span>
              <span className="text-[#666] text-[0.72rem] tracking-[0.15em] uppercase">Final Draft FDX</span>
              <span className="text-[#e8c97a] text-[0.72rem] tracking-[0.15em] uppercase">Multi-idioma</span>
              <span className="text-[0.72rem]">🎙️</span>
            </React.Fragment>
          ))}
        </div>
      </div>

      {/* Steps */}
      <section id="como-funciona" className="py-20 px-6 md:px-16 border-t border-[#222]">
        <div className="text-center mb-16">
          <div className="text-[0.68rem] tracking-[0.15em] uppercase text-[#c4a052] mb-4">Simples por design</div>
          <h2 className="font-['Playfair_Display'] text-4xl md:text-5xl mb-4">{lang === 'pt' ? 'Como funciona' : 'How it works'}</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-px bg-[#222] border border-[#222] rounded-xl overflow-hidden max-w-6xl mx-auto">
          {[
            { num: '01', title: t['step1.title'], desc: t['step1.desc'] },
            { num: '02', title: t['step2.title'], desc: t['step2.desc'] },
            { num: '03', title: t['step3.title'], desc: t['step3.desc'] },
            { num: '04', title: t['step4.title'], desc: t['step4.desc'] }
          ].map((step, i) => (
            <div key={i} className="bg-[#080808] p-10">
              <div className="font-['Playfair_Display'] text-4xl text-[#222] mb-4 leading-none">{step.num}</div>
              <h3 className="text-base font-medium mb-2">{step.title}</h3>
              <p className="text-sm text-[#666] leading-relaxed" dangerouslySetInnerHTML={{ __html: step.desc }} />
            </div>
          ))}
        </div>
      </section>

      {/* Features */}
      <section id="recursos" className="py-20 px-6 md:px-16 border-t border-[#222]">
        <div className="flex flex-col items-center text-center mb-16">
          <div className="text-[0.68rem] tracking-[0.15em] uppercase text-[#c4a052] mb-4">{lang === 'pt' ? 'O que você recebe' : 'What you get'}</div>
          <h2 className="font-['Playfair_Display'] text-4xl md:text-5xl mb-4">{lang === 'pt' ? 'Tudo que um autor precisa ouvir' : 'Everything a writer needs to hear'}</h2>
          <p className="text-[#666] max-w-lg leading-relaxed">{lang === 'pt' ? 'Criado por roteiristas, para roteiristas e atores.' : 'Made by screenwriters, for screenwriters and actors.'}</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
          {[
            { icon: <Users className="w-6 h-6 text-[#e8c97a]" />, title: t['feature1.title'], desc: t['feature1.desc'] },
            { icon: <CheckCircle className="w-6 h-6 text-[#e8c97a]" />, title: t['feature2.title'], desc: t['feature2.desc'], badge: t['feature2.badge'] },
            { icon: <Mic className="w-6 h-6 text-[#e8c97a]" />, title: t['feature3.title'], desc: t['feature3.desc'] },
            { icon: <Globe className="w-6 h-6 text-[#e8c97a]" />, title: t['feature4.title'], desc: t['feature4.desc'] },
            { icon: <ArrowRight className="w-6 h-6 text-[#e8c97a]" />, title: t['feature5.title'], desc: t['feature5.desc'] },
            { icon: <Shield className="w-6 h-6 text-[#e8c97a]" />, title: t['feature6.title'], desc: t['feature6.desc'] }
          ].map((feature, i) => (
            <div key={i} className="bg-[#111] border border-[#222] rounded-xl p-8 hover:border-[#c4a052] transition-colors">
              <div className="mb-4">{feature.icon}</div>
              <h3 className="text-base font-medium mb-2">{feature.title}</h3>
              <p className="text-sm text-[#666] leading-relaxed">{feature.desc}</p>
              {feature.badge && (
                <span className="inline-block text-[0.62rem] bg-[#e8c97a]/10 text-[#e8c97a] border border-[#e8c97a]/20 rounded px-2 py-0.5 mt-4 uppercase tracking-wider">
                  {feature.badge}
                </span>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* Prompt Section */}
      <section className="py-16 px-6 md:px-16 border-t border-[#222] bg-[#0d0d0d]">
        <div className="max-w-3xl mx-auto">
          <div className="text-[0.68rem] tracking-[0.15em] uppercase text-[#c4a052] mb-3">
            {lang === 'pt' ? 'PDF com formatação incorreta?' : 'PDF not formatting well?'}
          </div>
          <h2 className="font-['Playfair_Display'] text-3xl md:text-4xl mb-4 leading-snug">
            {lang === 'pt'
              ? <>Formate com a <em>IA da sua escolha</em></>
              : <>Format with the <em>AI of your choice</em></>}
          </h2>
          <p className="text-[#666] text-sm leading-relaxed mb-8 max-w-xl">
            {lang === 'pt'
              ? 'Se o seu PDF chegou com espaços, quebras erradas ou formatação corrompida, use o prompt abaixo em qualquer IA (ChatGPT, Claude, Gemini...) para reformatar antes de carregar no app.'
              : 'If your PDF has extra spaces, wrong line breaks or corrupted formatting, use the prompt below in any AI (ChatGPT, Claude, Gemini...) to reformat before loading into the app.'}
          </p>
          <div className="bg-[#111] border border-[#222] rounded-xl overflow-hidden">
            <div className="flex items-center justify-between px-5 py-3 border-b border-[#222]">
              <span className="text-[0.65rem] tracking-widest uppercase text-[#555]">
                {lang === 'pt' ? 'Prompt de formatação' : 'Formatting prompt'}
              </span>
              <CopyPromptButton lang={lang} />
            </div>
            <div className="px-5 py-4 font-mono text-[0.7rem] text-[#666] leading-relaxed max-h-48 overflow-y-auto">
              <span className="text-[#444]">{lang === 'pt' ? '// Cole em qualquer IA, depois adicione seu texto no final' : '// Paste into any AI, then add your text at the end'}</span>{'\n\n'}
              <span className="text-[#c4a052]">Formate o texto abaixo seguindo EXATAMENTE estas regras:</span>{'\n\n'}
              <span className="text-[#888]">Manter: cabeçalhos de cena (INT./EXT.), ações, nomes e diálogos.{'\n'}Remover: títulos, autores, numerações, CONT'D, MORE, comentários.{'\n'}Ações: converter rubricas em ação simples, sem interpretar.{'\n'}Diálogo: nome em MAIÚSCULO, fala na linha abaixo, sem direções.{'\n'}Retorne apenas o roteiro formatado, sem explicações.</span>{'\n\n'}
              <span className="text-[#555]">TEXTO: [cole aqui]</span>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Final */}
      <section className="py-24 px-6 md:px-16 border-t border-[#222] text-center">
        <h2 className="font-['Playfair_Display'] text-4xl md:text-6xl mb-6" dangerouslySetInnerHTML={{ __html: t['final.title'] }} />
        <p className="text-[#666] mb-10 text-lg">{t['final.sub']}</p>
        <button onClick={onStart} className="bg-[#e8c97a] text-[#080808] px-10 py-4 rounded-lg text-lg font-medium hover:bg-[#c4a052] transition-all transform hover:-translate-y-1">
          {t['final.button']}
        </button>
      </section>

      <footer className="py-8 px-6 md:px-16 border-t border-[#222] flex flex-col md:flex-row justify-between items-center gap-4 text-[#666] text-xs">
        <div className="font-['Playfair_Display'] text-sm text-[#e8c97a]">Colega de Cena</div>
        <p>{t['footer.created']}</p>
        <div className="flex items-center gap-4">
          <a
            href="https://youtube.com/playlist?list=PL7sThU9gIoMec2EQ9ZB_KZv888x5bAzy6&si=0-aSpwPj7a25L-GR"
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-[#e8c97a] transition-colors"
          >
            ▶ {lang === 'pt' ? 'Tutoriais' : 'Tutorials'}
          </a>
          <span className="text-[#333]">·</span>
          <p>© 2026 Luciano Mello · <button onClick={onStart} className="hover:text-[#f0ece4]">{lang === 'pt' ? 'Abrir App' : 'Open App'}</button></p>
        </div>
      </footer>

      <style>{`
        @keyframes marquee { 0% { transform: translateX(0); } 100% { transform: translateX(-50%); } }
        .animate-marquee { display: flex; animation: marquee 30s linear infinite; }
      `}</style>
    </div>
  );
}