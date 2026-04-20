# Colega de Cena / Scene Partner

**Leitor de roteiros com voz para roteiristas e atores.**  
Um app web gratuito que lê seu roteiro em voz alta, com uma voz distinta por personagem, modo de ensaio para atores e suporte a múltiplos formatos.

🌐 **[colegadecenav4.vercel.app](https://colegadecenav4.vercel.app)**  
▶ **[Tutoriais no YouTube](https://youtube.com/playlist?list=PL7sThU9gIoMec2EQ9ZB_KZv888x5bAzy6)**

---

## O que faz

- **Lê seu roteiro em voz alta** com uma voz distinta para cada personagem
- **Modo Ator** — o app lê todos os outros personagens e pausa nas suas falas, ideal para decorar texto
- **Suporte a Final Draft FDX** — leitura 100% fiel, sem necessidade de revisão
- **Suporte a PDF e texto colado** — com página de revisão para corrigir a formatação antes de carregar
- **Vozes de IA** via ElevenLabs ou Cartesia (com sua própria API key)
- **Vozes do navegador** sem necessidade de conta em nenhum serviço
- **Três idiomas** — Português, Inglês, Espanhol
- **Privacidade total** — seu roteiro nunca sai do seu navegador

---

## Formatos suportados

| Formato | Extensão | Qualidade |
|---|---|---|
| Final Draft | `.fdx` | ⭐ Melhor — sem necessidade de revisão |
| Fountain | `.fountain` `.ftn` | ✓ Boa |
| PDF | `.pdf` | Revisão recomendada |
| Texto colado | — | Revisão recomendada |

**PDF com formatação corrompida?** Use o prompt de formatação disponível no app para reformatar em qualquer IA (ChatGPT, Claude, Gemini) antes de carregar.

---

## Vozes

### Vozes do navegador (gratuito, sem conta)
O app usa a síntese de voz nativa do Chrome, Firefox ou Safari. A qualidade varia por sistema operacional. No macOS, as vozes Luciana (PT) e Samantha (EN) oferecem boa qualidade.

### ElevenLabs (opcional)
1. Crie conta em [elevenlabs.io](https://elevenlabs.io)
2. Copie sua API Key no painel
3. Cole no campo ElevenLabs no sidebar do app
4. Atribua vozes individuais a cada personagem

### Cartesia (opcional)
1. Crie conta em [cartesia.ai](https://cartesia.ai)
2. Copie sua API Key
3. Cole no campo Cartesia no sidebar do app
4. Selecione a aba Cartesia e atribua vozes

---

## Como usar

### 1. Carregar o roteiro
Abra o app e escolha uma das opções no painel lateral:
- **FDX** — arraste ou clique para selecionar seu arquivo Final Draft
- **PDF** — carregue e revise as linhas detectadas antes de confirmar
- **Texto** — cole diretamente e revise na página de prévia

### 2. Configurar vozes (opcional)
Clique em **Trocar voz** ao lado de cada personagem para escolher o perfil (homem, mulher, jovem, idoso) ou uma voz do ElevenLabs / Cartesia.

### 3. Dar play
Use os controles no rodapé. A linha sendo lida fica destacada e rola automaticamente.

**Atalhos de teclado:**
- `Espaço` — play / pausa
- `Espaço` (modo ator) — continuar após sua fala

### 4. Modo Ator
1. Selecione seu personagem no sidebar
2. Clique em **Ativar modo ator**
3. O app lê todos os outros e pausa nas suas falas
4. Pressione `Espaço` ou clique no botão vermelho para continuar

---

## Apoie o projeto

O app é e sempre será gratuito. Se quiser apoiar:

- ☕ **Ko-fi:** [ko-fi.com/lucianomello11](https://ko-fi.com/lucianomello11)
- 💳 **Stripe:** [buy.stripe.com/00w3cu6QG5Cb07F3LkeQM00](https://buy.stripe.com/00w3cu6QG5Cb07F3LkeQM00)
- 🇧🇷 **PIX:** `onze11films@gmail.com`

---

## Stack técnica

- **React 19** + **TypeScript**
- **Vite 6** + **Tailwind CSS 4**
- **Motion** (animações)
- **PDF.js** (extração de texto de PDFs)
- **Web Speech API** (vozes do navegador)
- **ElevenLabs API** + **Cartesia API** (vozes de IA)
- Deploy via **Vercel**

---

## Rodar localmente

```bash
git clone https://github.com/tototau-ai/colegadecenav4.git
cd colegadecenav4
npm install
npm run dev
```

Acesse `http://localhost:3000`

---

## Estrutura do projeto

```
colegadecenav4/
├── src/
│   ├── components/
│   │   ├── LandingPage.tsx   # Página inicial
│   │   └── ScriptReader.tsx  # App principal
│   ├── lib/
│   │   ├── fdx-parser.ts     # Parser Final Draft
│   │   ├── pdf-parser.ts     # Parser PDF
│   │   ├── fountain-parser.ts
│   │   └── generic-parser.ts
│   ├── locales/
│   │   ├── pt.ts             # Strings em português
│   │   └── en.ts             # Strings em inglês
│   └── types.ts
├── public/
│   └── formatar.html         # Reformatador de PDFs (standalone)
└── api/
    └── format.js             # Serverless proxy (Vercel Edge)
```

---

## Créditos

Criado por **Luciano Mello** — cineasta e roteirista.

[site]([https://stage32.com](https://lucianomello.46graus.com/)).

© 2026 Luciano Mello · Colega de Cena / Scene Partner
