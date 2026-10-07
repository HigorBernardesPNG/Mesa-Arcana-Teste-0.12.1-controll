import type {
  ClassePersonagem,
  EntidadeMapa,
  EstadoSessao,
  EstadoSessaoJogador,
  PosicaoMapa,
  RacaPersonagem,
  VarianteRacialPersonagem,
  TamanhoCriatura,
  TemaMapa,
  TipoEntidadeMapa
} from '../sessao/EstadoSessao.js';
import { obterDeslocamentoRaca, obterRacaPersonagem } from '../personagens/racas.js';
import { distanciaMovimentoEmMetros, entidadePodeOcuparPosicao, movimentoRestanteMetros } from './movimento.js';

export function criarEntidadeDoJogador(
  id: string,
  jogadorId: string,
  nome: string,
  posicao: PosicaoMapa,
  imagemToken?: string,
  classePersonagem?: ClassePersonagem,
  nivelPersonagem?: number,
  racaPersonagem: RacaPersonagem = 'humano',
  varianteRacialPersonagem?: VarianteRacialPersonagem
): EntidadeMapa {
  const raca = obterRacaPersonagem(racaPersonagem);
  return {
    id,
    nome,
    tipo: 'personagem',
    posicao,
    presenteNoMapa: true,
    controladorJogadorId: jogadorId,
    tamanhoCriatura: raca.tamanho,
    deslocamentoBase: obterDeslocamentoRaca(racaPersonagem, varianteRacialPersonagem),
    deslocamento: obterDeslocamentoRaca(racaPersonagem, varianteRacialPersonagem),
    movimentoGastoRodada: 0,
    racaPersonagem,
    ...(varianteRacialPersonagem ? { varianteRacialPersonagem } : {}),
    ...(imagemToken ? { imagemToken } : {}),
    ...(classePersonagem ? { classePersonagem } : {}),
    ...(nivelPersonagem ? { nivelPersonagem } : {})
  };
}

export function criarEntidadeMapa(
  id: string,
  nome: string,
  tipo: TipoEntidadeMapa,
  posicao: PosicaoMapa,
  imagemToken?: string,
  tamanhoCriatura: TamanhoCriatura = 'medio'
): EntidadeMapa {
  const dadosCombate = tipo === 'personagem'
    ? { deslocamento: 9 }
    : {
        pontosVidaAtual: 10,
        pontosVidaMaximo: 10,
        classeArmadura: tipo === 'monstro' ? 12 : 10,
        deslocamento: 9,
        nomeAtaque: 'Ataque',
        bonusAtaque: tipo === 'monstro' ? 2 : 0,
        danoAtaque: tipo === 'monstro' ? '1d6 + 1' : '1d4'
      };

  return {
    id,
    nome,
    tipo,
    posicao,
    presenteNoMapa: true,
    tamanhoCriatura,
    movimentoGastoRodada: 0,
    ...(imagemToken ? { imagemToken } : {}),
    ...dadosCombate
  };
}

export function moverEntidade(
  estado: EstadoSessao,
  entidadeId: string,
  posicao: PosicaoMapa,
  ignorarLimiteMovimento = false
): { sucesso: boolean; motivo?: 'entidade' | 'posicao' | 'limite'; distanciaMetros?: number; restanteMetros?: number } {
  const entidade = estado.entidades.find((item) => item.id === entidadeId);
  if (!entidade) return { sucesso: false, motivo: 'entidade' };
  if (!entidadePodeOcuparPosicao(entidade, posicao, estado.mapaAtual, estado.entidades)) return { sucesso: false, motivo: 'posicao' };

  const distanciaMetros = distanciaMovimentoEmMetros(entidade.posicao, posicao);
  if (!ignorarLimiteMovimento && entidade.deslocamento !== undefined) {
    const restante = movimentoRestanteMetros(entidade);
    if (distanciaMetros > restante + 0.001) return { sucesso: false, motivo: 'limite', distanciaMetros, restanteMetros: restante };
    entidade.movimentoGastoRodada = Number(((entidade.movimentoGastoRodada ?? 0) + distanciaMetros).toFixed(2));
  }

  entidade.posicao = { ...posicao };
  if (ignorarLimiteMovimento) entidade.movimentoGastoRodada = 0;

  return {
    sucesso: true,
    distanciaMetros,
    restanteMetros: movimentoRestanteMetros(entidade)
  };
}

export function alterarTemaMapa(estado: EstadoSessao, tema: TemaMapa): void {
  estado.mapaAtual.tema = tema;
  if (tema !== 'personalizado') delete estado.mapaAtual.imagemFundo;
}

export function criarVisaoJogador(estado: EstadoSessao): EstadoSessaoJogador {
  return {
    versao: estado.versao,
    codigo: estado.codigo,
    nomeCampanha: estado.nomeCampanha,
    jogadores: estado.jogadores.map((jogador) => ({ ...jogador })),
    historico: estado.historico.map((item) => ({ ...item })),
    mapaAtual: { ...estado.mapaAtual },
    rodadaAtual: estado.rodadaAtual,
    fontesLuzAtivas: estado.fontesLuzAtivas.map((fonte) => ({ ...fonte })),
    efeitosMagiaAtivos: estado.efeitosMagiaAtivos.map((efeito) => ({
      ...efeito,
      casas: efeito.casas.map((casa) => ({ ...casa })),
      alvoIds: [...efeito.alvoIds],
      ...(efeito.pontoOrigem ? { pontoOrigem: { ...efeito.pontoOrigem } } : {})
    })),
    entidades: estado.entidades
      .filter((entidade) => entidade.presenteNoMapa !== false || Boolean(entidade.controladorJogadorId))
      .map((entidade) => ({
      id: entidade.id,
      nome: entidade.nome,
      tipo: entidade.tipo,
      posicao: { ...entidade.posicao },
      presenteNoMapa: entidade.presenteNoMapa !== false,
      tamanhoCriatura: entidade.tamanhoCriatura,
      ...(entidade.controladorJogadorId ? {
        controladorJogadorId: entidade.controladorJogadorId,
        ...(entidade.racaPersonagem ? { racaPersonagem: entidade.racaPersonagem } : {}),
        ...(entidade.varianteRacialPersonagem ? { varianteRacialPersonagem: entidade.varianteRacialPersonagem } : {}),
        ...(entidade.deslocamentoBase !== undefined ? { deslocamentoBase: entidade.deslocamentoBase } : {}),
        ...(entidade.deslocamento !== undefined ? { deslocamento: entidade.deslocamento } : {}),
        ...(entidade.movimentoGastoRodada !== undefined ? { movimentoGastoRodada: entidade.movimentoGastoRodada } : {})
      } : {}),
      ...(entidade.imagemToken ? { imagemToken: entidade.imagemToken } : {}),
      ...(entidade.morto ? { morto: true } : {}),
      ...(entidade.classePersonagem ? { classePersonagem: entidade.classePersonagem } : {}),
      ...(entidade.nivelPersonagem ? { nivelPersonagem: entidade.nivelPersonagem } : {})
    }))
  };
}
