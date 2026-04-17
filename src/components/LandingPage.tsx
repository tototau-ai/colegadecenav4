import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Play, Users, Globe, Shield, CheckCircle, ArrowRight, Mic, Languages } from 'lucide-react';
import pt from '../locales/pt';
import en from '../locales/en';

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
            <a href="/formatar.html" target="_blank" rel="noopener noreferrer" className="hover:text-[#e8c97a] transition-colors">
              {lang === 'pt' ? '✦ Reformatar PDF' : '✦ Reformat PDF'}
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

      {/* PDF Formatter Banner */}
      <section className="py-16 px-6 md:px-16 border-t border-[#222] bg-[#0d0d0d]">
        <div className="max-w-4xl mx-auto flex flex-col md:flex-row items-center gap-10">
          <div className="max-w-2xl">
            <div className="text-[0.68rem] tracking-[0.15em] uppercase text-[#c4a052] mb-3">
              {lang === 'pt' ? 'Problema com PDF?' : 'PDF not formatting well?'}
            </div>
            <h2 className="font-['Playfair_Display'] text-3xl md:text-4xl mb-4 leading-snug">
              {lang === 'pt' ? <>Reformate seu roteiro <em>com inteligência artificial</em></> : <>Reformat your script <em>with artificial intelligence</em></>}
            </h2>
            <p className="text-[#666] text-sm leading-relaxed mb-4">
              {lang === 'pt'
                ? 'PDFs de roteiro costumam ter espaços entre letras, quebras erradas e formatação corrompida. Nosso reformatador com IA lê o texto bruto, identifica cenas, personagens e diálogos, e devolve um texto limpo pronto para usar no app.'
                : 'Screenplay PDFs often have spaces between letters, wrong line breaks, and corrupted formatting. Our AI reformatter reads the raw text, identifies scenes, characters and dialogue, and returns clean text ready to use in the app.'}
            </p>
            <p className="text-[#555] text-xs leading-relaxed mb-6">
              {lang === 'pt'
                ? 'Funciona também com roteiros de teatro, transcrições de table read, formatos europeus e qualquer texto dramático — a IA entende o contexto e aplica a formatação correta.'
                : 'Also works with stage plays, table read transcripts, European formats and any dramatic text — the AI understands context and applies the correct formatting.'}
            </p>
            <a
              href="/formatar.html"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 bg-transparent border border-[#e8c97a] text-[#e8c97a] px-7 py-3 rounded-lg text-sm font-medium hover:bg-[#e8c97a] hover:text-[#080808] transition-all"
            >
              {lang === 'pt' ? '✦ Abrir reformatador de roteiros' : '✦ Open script reformatter'}
            </a>
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
          <a href="/formatar.html" target="_blank" rel="noopener noreferrer" className="hover:text-[#e8c97a] transition-colors">
            {lang === 'pt' ? 'Reformatar PDF' : 'Reformat PDF'}
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