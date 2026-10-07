import type { RacaPersonagem, TamanhoCriatura, VarianteRacialPersonagem } from '../sessao/EstadoSessao.js';

export type TipoVarianteRacial = 'subraca' | 'ancestral-draconico';
export type TipoDanoAncestralDraconico = 'acido' | 'eletrico' | 'fogo' | 'frio' | 'veneno';
export type FormaSoproDraconico = 'cone' | 'linha';
export type TesteSoproDraconico = 'destreza' | 'constituicao';

export interface DefinicaoVarianteRacial {
  id: VarianteRacialPersonagem;
  nome: string;
  tipo: TipoVarianteRacial;
  deslocamentoMetros?: number;
  alcanceVisaoEscuroMetros?: number;
  tipoDanoAncestral?: TipoDanoAncestralDraconico;
  formaSopro?: FormaSoproDraconico;
  comprimentoSoproMetros?: number;
  larguraSoproMetros?: number;
  testeSopro?: TesteSoproDraconico;
}

export interface DefinicaoRacaPersonagem {
  id: RacaPersonagem;
  nome: string;
  deslocamentoMetros: number;
  tamanho: TamanhoCriatura;
  alcanceVisaoEscuroMetros?: number;
  variantes?: DefinicaoVarianteRacial[];
}

const ANCESTRAIS_DRACONICOS: DefinicaoVarianteRacial[] = [
  { id: 'draconato-azul', nome: 'Azul', tipo: 'ancestral-draconico', tipoDanoAncestral: 'eletrico', formaSopro: 'linha', comprimentoSoproMetros: 9, larguraSoproMetros: 1.5, testeSopro: 'destreza' },
  { id: 'draconato-branco', nome: 'Branco', tipo: 'ancestral-draconico', tipoDanoAncestral: 'frio', formaSopro: 'cone', comprimentoSoproMetros: 4.5, testeSopro: 'constituicao' },
  { id: 'draconato-bronze', nome: 'Bronze', tipo: 'ancestral-draconico', tipoDanoAncestral: 'eletrico', formaSopro: 'linha', comprimentoSoproMetros: 9, larguraSoproMetros: 1.5, testeSopro: 'destreza' },
  { id: 'draconato-cobre', nome: 'Cobre', tipo: 'ancestral-draconico', tipoDanoAncestral: 'acido', formaSopro: 'linha', comprimentoSoproMetros: 9, larguraSoproMetros: 1.5, testeSopro: 'destreza' },
  { id: 'draconato-latao', nome: 'Latão', tipo: 'ancestral-draconico', tipoDanoAncestral: 'fogo', formaSopro: 'linha', comprimentoSoproMetros: 9, larguraSoproMetros: 1.5, testeSopro: 'destreza' },
  { id: 'draconato-negro', nome: 'Negro', tipo: 'ancestral-draconico', tipoDanoAncestral: 'acido', formaSopro: 'linha', comprimentoSoproMetros: 9, larguraSoproMetros: 1.5, testeSopro: 'destreza' },
  { id: 'draconato-ouro', nome: 'Ouro', tipo: 'ancestral-draconico', tipoDanoAncestral: 'fogo', formaSopro: 'cone', comprimentoSoproMetros: 4.5, testeSopro: 'destreza' },
  { id: 'draconato-prata', nome: 'Prata', tipo: 'ancestral-draconico', tipoDanoAncestral: 'frio', formaSopro: 'cone', comprimentoSoproMetros: 4.5, testeSopro: 'constituicao' },
  { id: 'draconato-verde', nome: 'Verde', tipo: 'ancestral-draconico', tipoDanoAncestral: 'veneno', formaSopro: 'cone', comprimentoSoproMetros: 4.5, testeSopro: 'constituicao' },
  { id: 'draconato-vermelho', nome: 'Vermelho', tipo: 'ancestral-draconico', tipoDanoAncestral: 'fogo', formaSopro: 'cone', comprimentoSoproMetros: 4.5, testeSopro: 'destreza' }
];

export const RACAS_PERSONAGEM: DefinicaoRacaPersonagem[] = [
  {
    id: 'anao', nome: 'Anão', deslocamentoMetros: 7.5, tamanho: 'medio', alcanceVisaoEscuroMetros: 18,
    variantes: [
      { id: 'anao-colina', nome: 'Anão da Colina', tipo: 'subraca' },
      { id: 'anao-montanha', nome: 'Anão da Montanha', tipo: 'subraca' }
    ]
  },
  {
    id: 'elfo', nome: 'Elfo', deslocamentoMetros: 9, tamanho: 'medio', alcanceVisaoEscuroMetros: 18,
    variantes: [
      { id: 'alto-elfo', nome: 'Alto Elfo', tipo: 'subraca' },
      { id: 'elfo-floresta', nome: 'Elfo da Floresta', tipo: 'subraca', deslocamentoMetros: 10.5 },
      { id: 'drow', nome: 'Drow', tipo: 'subraca', alcanceVisaoEscuroMetros: 36 }
    ]
  },
  {
    id: 'halfling', nome: 'Halfling', deslocamentoMetros: 7.5, tamanho: 'pequeno',
    variantes: [
      { id: 'halfling-pes-leves', nome: 'Pés-Leves', tipo: 'subraca' },
      { id: 'halfling-robusto', nome: 'Robusto', tipo: 'subraca' }
    ]
  },
  { id: 'humano', nome: 'Humano', deslocamentoMetros: 9, tamanho: 'medio' },
  { id: 'draconato', nome: 'Draconato', deslocamentoMetros: 9, tamanho: 'medio', variantes: ANCESTRAIS_DRACONICOS },
  {
    id: 'gnomo', nome: 'Gnomo', deslocamentoMetros: 7.5, tamanho: 'pequeno', alcanceVisaoEscuroMetros: 18,
    variantes: [
      { id: 'gnomo-floresta', nome: 'Gnomo da Floresta', tipo: 'subraca' },
      { id: 'gnomo-rochas', nome: 'Gnomo das Rochas', tipo: 'subraca' }
    ]
  },
  { id: 'meio-elfo', nome: 'Meio-Elfo', deslocamentoMetros: 9, tamanho: 'medio', alcanceVisaoEscuroMetros: 18 },
  { id: 'meio-orc', nome: 'Meio-Orc', deslocamentoMetros: 9, tamanho: 'medio', alcanceVisaoEscuroMetros: 18 },
  { id: 'tiefling', nome: 'Tiefling', deslocamentoMetros: 9, tamanho: 'medio', alcanceVisaoEscuroMetros: 18 }
];

export function obterRacaPersonagem(id: RacaPersonagem): DefinicaoRacaPersonagem {
  return RACAS_PERSONAGEM.find((raca) => raca.id === id) ?? RACAS_PERSONAGEM[3]!;
}

export function obterVariantesRaciais(id: RacaPersonagem): DefinicaoVarianteRacial[] {
  return obterRacaPersonagem(id).variantes ?? [];
}

export function obterVarianteRacial(id?: VarianteRacialPersonagem): DefinicaoVarianteRacial | undefined {
  if (!id) return undefined;
  return RACAS_PERSONAGEM.flatMap((raca) => raca.variantes ?? []).find((variante) => variante.id === id);
}

export function variantePertenceARaca(raca: RacaPersonagem, variante?: VarianteRacialPersonagem): boolean {
  const variantes = obterVariantesRaciais(raca);
  if (variantes.length === 0) return variante === undefined;
  return Boolean(variante && variantes.some((item) => item.id === variante));
}

export function rotuloVarianteRacial(raca: RacaPersonagem): string | undefined {
  if (raca === 'draconato') return 'Ancestral dracônico';
  return obterVariantesRaciais(raca).length > 0 ? 'Sub-raça' : undefined;
}

export function nomeRacaCompleto(raca: RacaPersonagem, variante?: VarianteRacialPersonagem): string {
  const nomeRaca = obterRacaPersonagem(raca).nome;
  const definicaoVariante = obterVarianteRacial(variante);
  if (!definicaoVariante) return nomeRaca;
  if (raca === 'draconato') return `${nomeRaca} (${definicaoVariante.nome})`;
  return definicaoVariante.nome;
}

export function obterDeslocamentoRaca(raca: RacaPersonagem, variante?: VarianteRacialPersonagem): number {
  const definicao = obterRacaPersonagem(raca);
  return obterVarianteRacial(variante)?.deslocamentoMetros ?? definicao.deslocamentoMetros;
}

export function obterAlcanceVisaoEscuroRaca(raca: RacaPersonagem, variante?: VarianteRacialPersonagem): number {
  const definicao = obterRacaPersonagem(raca);
  return obterVarianteRacial(variante)?.alcanceVisaoEscuroMetros ?? definicao.alcanceVisaoEscuroMetros ?? 0;
}

export function obterAncestralDraconico(variante?: VarianteRacialPersonagem): DefinicaoVarianteRacial | undefined {
  const definicao = obterVarianteRacial(variante);
  return definicao?.tipo === 'ancestral-draconico' ? definicao : undefined;
}

export function danoSoproDraconicoPorNivel(nivel: number): string {
  if (nivel >= 16) return '5d6';
  if (nivel >= 11) return '4d6';
  if (nivel >= 6) return '3d6';
  return '2d6';
}
