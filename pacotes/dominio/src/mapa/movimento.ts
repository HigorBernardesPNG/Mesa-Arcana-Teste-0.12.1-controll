import type { EntidadeMapaBase, MapaSessao, PosicaoMapa } from '../sessao/EstadoSessao.js';
import { METROS_POR_CASA, tamanhoCriaturaEmCasas } from './escalaGrade.js';

export function distanciaMovimentoEmCasas(a: PosicaoMapa, b: PosicaoMapa): number {
  // Na matriz padrão, uma casa diagonal consome o mesmo segmento de movimento.
  return Math.max(Math.abs(a.coluna - b.coluna), Math.abs(a.linha - b.linha));
}

export function distanciaMovimentoEmMetros(a: PosicaoMapa, b: PosicaoMapa): number {
  return distanciaMovimentoEmCasas(a, b) * METROS_POR_CASA;
}

export function movimentoRestanteMetros(entidade: EntidadeMapaBase): number {
  const maximo = entidade.deslocamento ?? 0;
  const gasto = entidade.movimentoGastoRodada ?? 0;
  return Math.max(0, Number((maximo - gasto).toFixed(2)));
}

export function casasOcupadasEntidade(
  entidade: Pick<EntidadeMapaBase, 'tamanhoCriatura' | 'posicao'>,
  posicao = entidade.posicao
): PosicaoMapa[] {
  const tamanho = tamanhoCriaturaEmCasas(entidade.tamanhoCriatura);
  const casas: PosicaoMapa[] = [];
  for (let y = 0; y < tamanho; y += 1) {
    for (let x = 0; x < tamanho; x += 1) {
      casas.push({ coluna: posicao.coluna + x, linha: posicao.linha + y });
    }
  }
  return casas;
}

export function entidadePodeOcuparPosicao(
  entidade: EntidadeMapaBase,
  posicao: PosicaoMapa,
  mapa: MapaSessao,
  entidades: EntidadeMapaBase[]
): boolean {
  const destino = casasOcupadasEntidade(entidade, posicao);
  if (destino.some((casa) => casa.coluna < 1 || casa.coluna > mapa.colunas || casa.linha < 1 || casa.linha > mapa.linhas)) {
    return false;
  }

  const ocupadasPorOutros = new Set(
    entidades
      .filter((item) => item.id !== entidade.id && item.presenteNoMapa !== false)
      .flatMap((item) => casasOcupadasEntidade(item))
      .map((casa) => `${casa.coluna}:${casa.linha}`)
  );

  return destino.every((casa) => !ocupadasPorOutros.has(`${casa.coluna}:${casa.linha}`));
}

export function calcularCasasMovimentoDisponiveis(
  entidade: EntidadeMapaBase,
  mapa: MapaSessao,
  entidades: EntidadeMapaBase[]
): PosicaoMapa[] {
  if (entidade.morto || entidade.presenteNoMapa === false) return [];
  const restante = movimentoRestanteMetros(entidade);
  const limiteCasas = Math.floor(restante / METROS_POR_CASA + 1e-6);
  if (limiteCasas <= 0) return [];

  const casas: PosicaoMapa[] = [];
  for (let linha = 1; linha <= mapa.linhas; linha += 1) {
    for (let coluna = 1; coluna <= mapa.colunas; coluna += 1) {
      const posicao = { coluna, linha };
      if (distanciaMovimentoEmCasas(entidade.posicao, posicao) > limiteCasas) continue;
      if (!entidadePodeOcuparPosicao(entidade, posicao, mapa, entidades)) continue;
      casas.push(posicao);
    }
  }
  return casas;
}
