import type { DefinicaoMagia, MapaSessao, PosicaoMapa, VarianteRacialPersonagem } from '../sessao/EstadoSessao.js';
import { calcularCasasMagia } from '../magias/regrasMagia.js';
import { danoSoproDraconicoPorNivel, obterAncestralDraconico } from './racas.js';

export interface DefinicaoSoproDraconico {
  id: 'sopro-draconico';
  nome: 'Sopro Dracônico';
  ancestralNome: string;
  tipoDano: string;
  forma: 'cone' | 'linha';
  comprimentoMetros: number;
  larguraMetros?: number;
  teste: 'Destreza' | 'Constituição';
  dano: string;
  resumo: string;
}

export function obterSoproDraconico(
  variante: VarianteRacialPersonagem | undefined,
  nivel: number
): DefinicaoSoproDraconico | undefined {
  const ancestral = obterAncestralDraconico(variante);
  if (!ancestral?.tipoDanoAncestral || !ancestral.formaSopro || !ancestral.comprimentoSoproMetros || !ancestral.testeSopro) return undefined;

  const teste = ancestral.testeSopro === 'destreza' ? 'Destreza' : 'Constituição';
  const dano = danoSoproDraconicoPorNivel(nivel);
  const largura = ancestral.formaSopro === 'linha' ? ancestral.larguraSoproMetros ?? 1.5 : undefined;
  const area = ancestral.formaSopro === 'linha'
    ? `linha de ${largura} m por ${ancestral.comprimentoSoproMetros} m`
    : `cone de ${ancestral.comprimentoSoproMetros} m`;

  return {
    id: 'sopro-draconico',
    nome: 'Sopro Dracônico',
    ancestralNome: ancestral.nome,
    tipoDano: ancestral.tipoDanoAncestral,
    forma: ancestral.formaSopro,
    comprimentoMetros: ancestral.comprimentoSoproMetros,
    ...(largura !== undefined ? { larguraMetros: largura } : {}),
    teste,
    dano,
    resumo: `${ancestral.nome}: ${area}, dano ${ancestral.tipoDanoAncestral}, resistência de ${teste}. Dano base ${dano}.`
  };
}

export function calcularCasasSoproDraconico(
  variante: VarianteRacialPersonagem | undefined,
  nivel: number,
  origem: PosicaoMapa,
  direcao: PosicaoMapa | undefined,
  mapa: MapaSessao
): PosicaoMapa[] {
  const sopro = obterSoproDraconico(variante, nivel);
  if (!sopro || !direcao) return [];

  const adaptador: DefinicaoMagia = {
    id: '__sopro-draconico',
    nome: 'Sopro Dracônico',
    nivel: 0,
    escola: 'racial',
    ritual: false,
    classes: [],
    tempoConjuracao: '1 ação',
    alcanceTexto: sopro.forma === 'linha' ? `${sopro.comprimentoMetros} m` : 'Pessoal',
    duracao: 'Instantânea',
    formaArea: sopro.forma,
    tamanhoAreaMetros: sopro.comprimentoMetros,
    ...(sopro.larguraMetros !== undefined ? { larguraMetros: sopro.larguraMetros } : {}),
    origemArea: 'conjurador',
    resumo: sopro.resumo,
    descricaoBreve: 'Arma de sopro racial do draconato.'
  };

  return calcularCasasMagia(adaptador, origem, direcao, mapa);
}
