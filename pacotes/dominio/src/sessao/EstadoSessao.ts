export type PerfilParticipante = 'mestre' | 'jogador';
export type TipoEntidadeMapa = 'personagem' | 'npc' | 'monstro';
export type TemaMapa = 'ruinas' | 'floresta' | 'masmorra' | 'personalizado';
export type TipoAcaoVisual = 'espada' | 'flecha' | 'magia';
export type TamanhoCriatura = 'miudo' | 'pequeno' | 'medio' | 'grande' | 'enorme' | 'imenso';
export type RacaPersonagem =
  | 'anao'
  | 'elfo'
  | 'halfling'
  | 'humano'
  | 'draconato'
  | 'gnomo'
  | 'meio-elfo'
  | 'meio-orc'
  | 'tiefling';

export type VarianteRacialPersonagem =
  | 'anao-colina'
  | 'anao-montanha'
  | 'alto-elfo'
  | 'elfo-floresta'
  | 'drow'
  | 'halfling-pes-leves'
  | 'halfling-robusto'
  | 'gnomo-floresta'
  | 'gnomo-rochas'
  | 'draconato-azul'
  | 'draconato-branco'
  | 'draconato-bronze'
  | 'draconato-cobre'
  | 'draconato-latao'
  | 'draconato-negro'
  | 'draconato-ouro'
  | 'draconato-prata'
  | 'draconato-verde'
  | 'draconato-vermelho';
export type ClassePersonagem =
  | 'barbaro'
  | 'bardo'
  | 'bruxo'
  | 'clerigo'
  | 'druida'
  | 'feiticeiro'
  | 'guerreiro'
  | 'ladino'
  | 'mago'
  | 'monge'
  | 'paladino'
  | 'patrulheiro';
export type FormaAreaMagia = 'alvo' | 'pessoal' | 'aura' | 'esfera' | 'cone' | 'linha' | 'cubo' | 'cilindro';
export type VinculoEfeitoMagia = 'area' | 'alvo' | 'pessoal';
export type NivelIluminacao = 'luz-plena' | 'penumbra' | 'escuridao';
export type TipoFonteLuz = 'tocha';

export interface JogadorSessao {
  id: string;
  nome: string;
  conectado: boolean;
  perfil: PerfilParticipante;
  classePersonagem: ClassePersonagem;
  nivelPersonagem: number;
  racaPersonagem: RacaPersonagem;
  varianteRacialPersonagem?: VarianteRacialPersonagem;
  magiasSelecionadasIds: string[];
  magiaRacialEscolhidaId?: string;
}

export interface ItemHistorico {
  id: string;
  tipo: 'sistema' | 'conexao' | 'movimento' | 'rolagem' | 'combate' | 'mapa' | 'magia';
  mensagem: string;
  detalhes?: string[];
  criadoEm: string;
}

export interface PosicaoMapa {
  coluna: number;
  linha: number;
}

export interface MapaSessao {
  id: string;
  nome: string;
  colunas: number;
  linhas: number;
  tema: TemaMapa;
  imagemFundo?: string;
  opacidadeGrade: number;
  iluminacaoAmbiente: NivelIluminacao;
}

export interface DefinicaoMagia {
  id: string;
  nome: string;
  nivel: number;
  escola: string;
  ritual: boolean;
  classes: ClassePersonagem[];
  tempoConjuracao: string;
  alcanceTexto: string;
  alcanceMetros?: number;
  duracao: string;
  formaArea: FormaAreaMagia;
  tamanhoAreaMetros?: number;
  larguraMetros?: number;
  origemArea: 'conjurador' | 'ponto';
  resumo: string;
  descricaoBreve: string;
}

export interface EntidadeMapaBase {
  id: string;
  nome: string;
  tipo: TipoEntidadeMapa;
  posicao: PosicaoMapa;
  /** Ausente em campanhas antigas significa que a entidade está no grid. */
  presenteNoMapa?: boolean;
  controladorJogadorId?: string;
  imagemToken?: string;
  morto?: boolean;
  classePersonagem?: ClassePersonagem;
  nivelPersonagem?: number;
  racaPersonagem?: RacaPersonagem;
  varianteRacialPersonagem?: VarianteRacialPersonagem;
  tamanhoCriatura: TamanhoCriatura;
  deslocamentoBase?: number;
  deslocamento?: number;
  movimentoGastoRodada?: number;
}

export interface EntidadeMapa extends EntidadeMapaBase {
  pontosVidaAtual?: number;
  pontosVidaMaximo?: number;
  classeArmadura?: number;
  nomeAtaque?: string;
  bonusAtaque?: number;
  danoAtaque?: string;
}

export interface EntidadeMapaJogador extends EntidadeMapaBase {}


export interface FonteLuzAtiva {
  id: string;
  tipo: TipoFonteLuz;
  entidadeId: string;
  raioLuzPlenaMetros: number;
  raioPenumbraAdicionalMetros: number;
  segundosRestantes?: number;
  criadoEm: string;
}

export interface EfeitoVisualCombate {
  id: string;
  tipo: TipoAcaoVisual;
  atacanteId: string;
  alvoId: string;
  criadoEm: string;
}

export interface EfeitoVisualMagia {
  id: string;
  magiaId: string;
  nomeMagia: string;
  conjuradorId: string;
  casas: PosicaoMapa[];
  criadoEm: string;
}

export interface EfeitoMagiaAtivo {
  id: string;
  magiaId: string;
  nomeMagia: string;
  conjuradorId: string;
  alvoIds: string[];
  casas: PosicaoMapa[];
  pontoOrigem?: PosicaoMapa;
  vinculo: VinculoEfeitoMagia;
  duracaoTexto: string;
  concentracao: boolean;
  segundosRestantes?: number;
  criadoEm: string;
}

export interface EstadoSessaoJogador {
  versao: 12;
  codigo: string;
  nomeCampanha: string;
  jogadores: JogadorSessao[];
  historico: ItemHistorico[];
  mapaAtual: MapaSessao;
  entidades: EntidadeMapaJogador[];
  rodadaAtual: number;
  efeitosMagiaAtivos: EfeitoMagiaAtivo[];
  fontesLuzAtivas: FonteLuzAtiva[];
}

export interface EstadoSessao extends Omit<EstadoSessaoJogador, 'entidades'> {
  entidades: EntidadeMapa[];
}
