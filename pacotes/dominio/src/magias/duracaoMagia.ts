import type { DefinicaoMagia, EfeitoMagiaAtivo } from '../sessao/EstadoSessao.js';

const SEGUNDOS_POR_RODADA = 6;

export interface DuracaoInterpretadaMagia {
  instantanea: boolean;
  concentracao: boolean;
  segundosJogo?: number;
}

export function interpretarDuracaoMagia(magia: Pick<DefinicaoMagia, 'duracao'>): DuracaoInterpretadaMagia {
  const textoOriginal = magia.duracao.trim();
  const texto = textoOriginal.toLocaleLowerCase('pt-BR');
  const concentracao = texto.includes('concentra');

  if (texto.includes('instant')) {
    return { instantanea: true, concentracao: false };
  }

  const correspondencia = texto.match(/(?:até\s+)?(\d+)\s*(rodada|rodadas|minuto|minutos|hora|horas|dia|dias|ano|anos)/i);
  if (!correspondencia) {
    return { instantanea: false, concentracao };
  }

  const quantidade = Number(correspondencia[1]);
  const unidade = correspondencia[2]?.toLocaleLowerCase('pt-BR') ?? '';
  let segundosJogo: number | undefined;

  if (unidade.startsWith('rodada')) segundosJogo = quantidade * SEGUNDOS_POR_RODADA;
  else if (unidade.startsWith('minuto')) segundosJogo = quantidade * 60;
  else if (unidade.startsWith('hora')) segundosJogo = quantidade * 60 * 60;
  else if (unidade.startsWith('dia')) segundosJogo = quantidade * 24 * 60 * 60;
  else if (unidade.startsWith('ano')) segundosJogo = quantidade * 365 * 24 * 60 * 60;

  return { instantanea: false, concentracao, ...(segundosJogo !== undefined ? { segundosJogo } : {}) };
}

export function formatarTempoJogo(segundos?: number): string {
  if (segundos === undefined) return 'até ser encerrada';
  if (segundos <= 0) return 'encerrada';

  const rodadas = Math.ceil(segundos / SEGUNDOS_POR_RODADA);
  if (segundos < 60) return `${rodadas} rodada${rodadas === 1 ? '' : 's'}`;

  const dias = Math.floor(segundos / 86_400);
  const horas = Math.floor((segundos % 86_400) / 3_600);
  const minutos = Math.floor((segundos % 3_600) / 60);
  const segundosRestantes = segundos % 60;

  if (dias > 0) return `${dias}d${horas > 0 ? ` ${horas}h` : ''}`;
  if (horas > 0) return `${horas}h${minutos > 0 ? ` ${minutos}min` : ''}`;
  if (minutos > 0) return `${minutos}min${segundosRestantes > 0 ? ` ${segundosRestantes}s` : ''}`;
  return `${rodadas} rodada${rodadas === 1 ? '' : 's'}`;
}

export function efeitoMagiaEhPersistente(magia: Pick<DefinicaoMagia, 'duracao'>): boolean {
  return !interpretarDuracaoMagia(magia).instantanea;
}

export function reduzirUmaRodada(efeito: EfeitoMagiaAtivo): EfeitoMagiaAtivo {
  if (efeito.segundosRestantes === undefined) return efeito;
  return {
    ...efeito,
    segundosRestantes: Math.max(0, efeito.segundosRestantes - SEGUNDOS_POR_RODADA)
  };
}

export { SEGUNDOS_POR_RODADA };
