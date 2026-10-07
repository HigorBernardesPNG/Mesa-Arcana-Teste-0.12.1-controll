import type { EstadoSessao } from './EstadoSessao.js';

const CARACTERES_CODIGO = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';

export function gerarCodigoSessao(tamanho = 6): string {
  return Array.from({ length: tamanho }, () => {
    const indice = Math.floor(Math.random() * CARACTERES_CODIGO.length);
    return CARACTERES_CODIGO[indice] ?? 'X';
  }).join('');
}

export function criarEstadoSessao(nomeCampanha = 'Nova campanha'): EstadoSessao {
  return {
    versao: 12,
    codigo: gerarCodigoSessao(),
    nomeCampanha,
    jogadores: [],
    historico: [],
    mapaAtual: {
      id: 'mapa-inicial',
      nome: 'Mapa inicial',
      colunas: 12,
      linhas: 10,
      tema: 'ruinas',
      opacidadeGrade: 0.58,
      iluminacaoAmbiente: 'luz-plena'
    },
    entidades: [],
    rodadaAtual: 1,
    efeitosMagiaAtivos: [],
    fontesLuzAtivas: []
  };
}
