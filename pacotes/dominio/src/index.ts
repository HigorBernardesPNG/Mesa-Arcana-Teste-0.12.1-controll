export type {
  ClassePersonagem,
  DefinicaoMagia,
  EfeitoVisualCombate,
  EfeitoMagiaAtivo,
  EfeitoVisualMagia,
  EntidadeMapa,
  EntidadeMapaBase,
  EntidadeMapaJogador,
  EstadoSessao,
  EstadoSessaoJogador,
  FormaAreaMagia,
  FonteLuzAtiva,
  ItemHistorico,
  JogadorSessao,
  NivelIluminacao,
  MapaSessao,
  PerfilParticipante,
  RacaPersonagem,
  VarianteRacialPersonagem,
  PosicaoMapa,
  TemaMapa,
  TipoAcaoVisual,
  TipoEntidadeMapa,
  TipoFonteLuz,
  TamanhoCriatura,
  VinculoEfeitoMagia
} from './sessao/EstadoSessao.js';
export { criarEstadoSessao, gerarCodigoSessao } from './sessao/criarEstadoSessao.js';
export { adicionarItemHistorico } from './historico/adicionarItemHistorico.js';
export {
  alterarTemaMapa,
  criarEntidadeDoJogador,
  criarEntidadeMapa,
  criarVisaoJogador,
  moverEntidade
} from './mapa/estadoMapa.js';
export { CATALOGO_MAGIAS, CLASSES_PERSONAGEM } from './magias/catalogoMagias.js';
export {
  obterMagiasRaciaisDisponiveis,
  obterDisponibilidadesMagiaPersonagem,
  validarSelecaoMagiasPersonagem,
  magiaEstaDisponivelParaPersonagem
} from './magias/disponibilidadeMagia.js';
export type { DisponibilidadeMagiaPersonagem } from './magias/disponibilidadeMagia.js';

export {
  RACAS_PERSONAGEM,
  obterRacaPersonagem,
  obterVariantesRaciais,
  obterVarianteRacial,
  variantePertenceARaca,
  rotuloVarianteRacial,
  nomeRacaCompleto,
  obterDeslocamentoRaca,
  obterAlcanceVisaoEscuroRaca,
  obterAncestralDraconico,
  danoSoproDraconicoPorNivel
} from './personagens/racas.js';
export type { DefinicaoRacaPersonagem, DefinicaoVarianteRacial, TipoVarianteRacial, TipoDanoAncestralDraconico, FormaSoproDraconico, TesteSoproDraconico } from './personagens/racas.js';
export { METROS_POR_CASA, TAMANHOS_CRIATURA, nomeTamanhoCriatura, tamanhoCriaturaEmCasas } from './mapa/escalaGrade.js';
export {
  calcularCasasMovimentoDisponiveis,
  casasOcupadasEntidade,
  distanciaMovimentoEmCasas,
  distanciaMovimentoEmMetros,
  entidadePodeOcuparPosicao,
  movimentoRestanteMetros
} from './mapa/movimento.js';
export {
  calcularCasasMagia,
  distanciaEmCasas,
  distanciaEmMetros,
  entidadesNasCasas,
  nivelMaximoMagia,
  obterMagiaPorId,
  obterMagiasDisponiveis,
  magiaExigeVisao,
  pontoDentroDoAlcance
} from './magias/regrasMagia.js';

export {
  SEGUNDOS_POR_RODADA,
  efeitoMagiaEhPersistente,
  formatarTempoJogo,
  interpretarDuracaoMagia,
  reduzirUmaRodada
} from './magias/duracaoMagia.js';

export {
  criarFonteTocha,
  fontesLuzCalculadas,
  reduzirFontesLuzUmaRodada,
  obterVisibilidadeCasa,
  nomeNivelIluminacao,
  fonteTochaDaEntidade
} from './mapa/iluminacao.js';

export { obterSoproDraconico, calcularCasasSoproDraconico } from './personagens/acoesRaciais.js';
export type { DefinicaoSoproDraconico } from './personagens/acoesRaciais.js';
