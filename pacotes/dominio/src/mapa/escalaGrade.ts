import type { TamanhoCriatura } from '../sessao/EstadoSessao.js';

/** Regra padrão da matriz de combate do D&D 5e: cada casa mede 1,5 m de lado. */
export const METROS_POR_CASA = 1.5;

export const TAMANHOS_CRIATURA: Array<{
  id: TamanhoCriatura;
  nome: string;
  espacoMetros: number;
  casasGrade: number;
}> = [
  { id: 'miudo', nome: 'Miúdo', espacoMetros: 0.75, casasGrade: 1 },
  { id: 'pequeno', nome: 'Pequeno', espacoMetros: 1.5, casasGrade: 1 },
  { id: 'medio', nome: 'Médio', espacoMetros: 1.5, casasGrade: 1 },
  { id: 'grande', nome: 'Grande', espacoMetros: 3, casasGrade: 2 },
  { id: 'enorme', nome: 'Enorme', espacoMetros: 4.5, casasGrade: 3 },
  { id: 'imenso', nome: 'Imenso', espacoMetros: 6, casasGrade: 4 }
];

export function tamanhoCriaturaEmCasas(tamanho: TamanhoCriatura): number {
  return TAMANHOS_CRIATURA.find((item) => item.id === tamanho)?.casasGrade ?? 1;
}

export function nomeTamanhoCriatura(tamanho: TamanhoCriatura): string {
  return TAMANHOS_CRIATURA.find((item) => item.id === tamanho)?.nome ?? tamanho;
}
