export type LineType = 'scene' | 'action' | 'character' | 'dialogue' | 'direction' | 'transition';

export interface ScriptLine {
  texto: string;
  tipo: LineType;
  narrador?: string | null;
}

export interface Character {
  nome: string;
  voz: string;
  perfil: string;
  cor: string;
  bg: string;
  iniciais: string;
  elVozId: string;
  cartVozId: string;
}

export interface CastingProfile {
  id: string;
  label: string;
  icon: string;
  masc: boolean | null;
  jovem: boolean;
  idoso: boolean;
}