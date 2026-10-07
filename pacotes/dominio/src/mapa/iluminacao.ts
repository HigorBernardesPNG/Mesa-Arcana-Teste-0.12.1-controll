import type {
  EfeitoMagiaAtivo,
  EntidadeMapaBase,
  FonteLuzAtiva,
  MapaSessao,
  NivelIluminacao,
  PosicaoMapa
} from '../sessao/EstadoSessao.js';
import { METROS_POR_CASA } from './escalaGrade.js';
import { obterAlcanceVisaoEscuroRaca } from '../personagens/racas.js';

export type VisibilidadeCasa = 'claro' | 'penumbra' | 'visao-escuro' | 'escuro' | 'escuridao-magica';

export interface FonteLuzCalculada {
  id: string;
  nome: string;
  posicao: PosicaoMapa;
  raioLuzPlenaMetros: number;
  raioPenumbraAdicionalMetros: number;
  magica: boolean;
  entidadeId?: string;
}

function distanciaMetros(a: PosicaoMapa, b: PosicaoMapa): number {
  return Math.max(Math.abs(a.coluna - b.coluna), Math.abs(a.linha - b.linha)) * METROS_POR_CASA;
}

function centroEfeito(efeito: EfeitoMagiaAtivo, entidades: EntidadeMapaBase[]): PosicaoMapa | undefined {
  const alvo = efeito.alvoIds[0] ? entidades.find((entidade) => entidade.id === efeito.alvoIds[0]) : undefined;
  if (efeito.vinculo === 'alvo' && alvo) return alvo.posicao;
  const conjurador = entidades.find((entidade) => entidade.id === efeito.conjuradorId);
  if (efeito.vinculo === 'pessoal' && conjurador) return conjurador.posicao;
  return efeito.pontoOrigem ?? efeito.casas[0];
}

export function criarFonteTocha(id: string, entidadeId: string, criadoEm = new Date().toISOString()): FonteLuzAtiva {
  return {
    id,
    tipo: 'tocha',
    entidadeId,
    raioLuzPlenaMetros: 6,
    raioPenumbraAdicionalMetros: 6,
    segundosRestantes: 3600,
    criadoEm
  };
}

export function fonteTochaDaEntidade(fontes: FonteLuzAtiva[], entidadeId: string): FonteLuzAtiva | undefined {
  return fontes.find((fonte) => fonte.tipo === 'tocha' && fonte.entidadeId === entidadeId);
}

export function reduzirFontesLuzUmaRodada(fontes: FonteLuzAtiva[], segundos = 6): FonteLuzAtiva[] {
  return fontes
    .map((fonte) => fonte.segundosRestantes === undefined
      ? fonte
      : { ...fonte, segundosRestantes: Math.max(0, fonte.segundosRestantes - segundos) })
    .filter((fonte) => fonte.segundosRestantes === undefined || fonte.segundosRestantes > 0);
}

export function fontesLuzCalculadas(
  fontes: FonteLuzAtiva[],
  efeitos: EfeitoMagiaAtivo[],
  entidades: EntidadeMapaBase[]
): FonteLuzCalculada[] {
  const resultado: FonteLuzCalculada[] = [];

  for (const fonte of fontes) {
    const entidade = entidades.find((item) => item.id === fonte.entidadeId);
    if (!entidade || entidade.presenteNoMapa === false) continue;
    resultado.push({
      id: fonte.id,
      nome: 'Tocha',
      posicao: entidade.posicao,
      raioLuzPlenaMetros: fonte.raioLuzPlenaMetros,
      raioPenumbraAdicionalMetros: fonte.raioPenumbraAdicionalMetros,
      magica: false,
      entidadeId: entidade.id
    });
  }

  const definicoes: Record<string, { nome: string; plena: number; penumbra: number }> = {
    'luz': { nome: 'Luz', plena: 6, penumbra: 6 },
    'luz-do-dia': { nome: 'Luz do Dia', plena: 18, penumbra: 18 },
    'escudo-de-fogo': { nome: 'Escudo de Fogo', plena: 3, penumbra: 3 },
    'criar-chamas': { nome: 'Criar Chamas', plena: 3, penumbra: 3 },
    'chama-continua': { nome: 'Chama Contínua', plena: 6, penumbra: 6 },
    'globos-de-luz': { nome: 'Globos de Luz', plena: 0, penumbra: 3 }
  };

  for (const efeito of efeitos) {
    const definicao = definicoes[efeito.magiaId];
    if (!definicao) continue;
    const posicao = centroEfeito(efeito, entidades);
    if (!posicao) continue;
    resultado.push({
      id: `magia:${efeito.id}`,
      nome: definicao.nome,
      posicao,
      raioLuzPlenaMetros: definicao.plena,
      raioPenumbraAdicionalMetros: definicao.penumbra,
      magica: true,
      ...((efeito.vinculo === 'pessoal' ? efeito.conjuradorId : efeito.alvoIds[0]) ? { entidadeId: efeito.vinculo === 'pessoal' ? efeito.conjuradorId : efeito.alvoIds[0]! } : {})
    });
  }

  return resultado;
}

function grauAmbiente(nivel: NivelIluminacao): 0 | 1 | 2 {
  if (nivel === 'luz-plena') return 2;
  if (nivel === 'penumbra') return 1;
  return 0;
}

function grauLuzCasa(mapa: MapaSessao, casa: PosicaoMapa, fontes: FonteLuzCalculada[]): 0 | 1 | 2 {
  let grau = grauAmbiente(mapa.iluminacaoAmbiente);
  for (const fonte of fontes) {
    const distancia = distanciaMetros(fonte.posicao, casa);
    if (fonte.raioLuzPlenaMetros > 0 && distancia <= fonte.raioLuzPlenaMetros + 0.001) grau = 2;
    else if (distancia <= fonte.raioLuzPlenaMetros + fonte.raioPenumbraAdicionalMetros + 0.001) grau = Math.max(grau, 1) as 1 | 2;
  }
  return grau;
}

export function obterVisibilidadeCasa(params: {
  mapa: MapaSessao;
  casa: PosicaoMapa;
  entidades: EntidadeMapaBase[];
  efeitos: EfeitoMagiaAtivo[];
  fontes: FonteLuzAtiva[];
  observador?: EntidadeMapaBase;
  previsualizacaoMestre?: boolean;
}): VisibilidadeCasa {
  const { mapa, casa, entidades, efeitos, fontes, observador, previsualizacaoMestre = false } = params;
  const escuridaoMagica = efeitos.some((efeito) => efeito.magiaId === 'escuridao' && efeito.casas.some((item) => item.coluna === casa.coluna && item.linha === casa.linha));
  if (escuridaoMagica) return 'escuridao-magica';

  const luzes = fontesLuzCalculadas(fontes, efeitos, entidades);
  const grau = grauLuzCasa(mapa, casa, luzes);
  if (!observador) {
    if (!previsualizacaoMestre) return 'claro';
    return grau === 2 ? 'claro' : grau === 1 ? 'penumbra' : 'escuro';
  }

  if (grau === 2) return 'claro';

  const efeitoVisaoEscuro = efeitos.some((efeito) => efeito.magiaId === 'visao-no-escuro' && efeito.alvoIds.includes(observador.id));
  const alcanceRacial = observador.racaPersonagem ? obterAlcanceVisaoEscuroRaca(observador.racaPersonagem, observador.varianteRacialPersonagem) : 0;
  const alcanceVisaoEscuro = Math.max(alcanceRacial, efeitoVisaoEscuro ? 18 : 0);
  const dentroVisaoEscuro = alcanceVisaoEscuro > 0 && distanciaMetros(observador.posicao, casa) <= alcanceVisaoEscuro + 0.001;

  if (grau === 1) return dentroVisaoEscuro ? 'claro' : 'penumbra';
  return dentroVisaoEscuro ? 'visao-escuro' : 'escuro';
}

export function nomeNivelIluminacao(nivel: NivelIluminacao): string {
  if (nivel === 'luz-plena') return 'Luz plena';
  if (nivel === 'penumbra') return 'Penumbra';
  return 'Escuridão';
}
