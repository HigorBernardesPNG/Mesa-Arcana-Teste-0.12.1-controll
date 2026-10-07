import type { ClassePersonagem, EfeitoVisualCombate, EfeitoVisualMagia, EstadoSessao, EstadoSessaoJogador, ItemHistorico, RacaPersonagem, VarianteRacialPersonagem } from '@mesa-rpg/dominio';
import type { AcaoVisual } from '../esquemas/acaoVisual.js';
import type { AcaoRacial } from '../esquemas/acaoRacial.js';
import type { AvancoRodada } from '../esquemas/avancoRodada.js';
import type { AlteracaoMapa } from '../esquemas/alteracaoMapa.js';
import type { AtualizacaoEntidadePrivada } from '../esquemas/atualizacaoEntidadePrivada.js';
import type { ConfiguracaoDeslocamentoJogador } from '../esquemas/configuracaoDeslocamentoJogador.js';
import type { ConfiguracaoCampanha } from '../esquemas/configuracaoCampanha.js';
import type { ConfiguracaoMapa } from '../esquemas/configuracaoMapa.js';
import type { ConfiguracaoIluminacao } from '../esquemas/configuracaoIluminacao.js';
import type { ConfiguracaoMagiasJogador } from '../esquemas/configuracaoMagiasJogador.js';
import type { FonteLuz } from '../esquemas/fonteLuz.js';
import type { ConjuracaoMagia } from '../esquemas/conjuracaoMagia.js';
import type { CriacaoEntidade } from '../esquemas/criacaoEntidade.js';
import type { EntradaSessao } from '../esquemas/entradaSessao.js';
import type { EstadoMorteEntidade } from '../esquemas/estadoMorteEntidade.js';
import type { EncerramentoEfeitoMagia } from '../esquemas/encerramentoEfeitoMagia.js';
import type { MovimentoEntidade } from '../esquemas/movimentoEntidade.js';
import type { PresencaEntidade } from '../esquemas/presencaEntidade.js';

export interface RespostaEntradaSessao {
  sucesso: boolean;
  mensagem?: string;
  jogadorId?: string;
  estado?: EstadoSessaoJogador;
}

export interface RespostaAcaoSessao {
  sucesso: boolean;
  mensagem?: string;
}

export interface ResumoPersonagemSalvo {
  jogadorId: string;
  nome: string;
  conectado: boolean;
  classePersonagem: ClassePersonagem;
  nivelPersonagem: number;
  racaPersonagem: RacaPersonagem;
  varianteRacialPersonagem?: VarianteRacialPersonagem;
  imagemToken?: string;
}

export interface RespostaPersonagensSalvos extends RespostaAcaoSessao {
  personagens: ResumoPersonagemSalvo[];
}

export interface ResumoCampanhaPersistida {
  arquivo: string;
  nomeCampanha: string;
  salvoEm: string;
  tamanhoBytes: number;
}

export interface RespostaPersistenciaCampanha extends RespostaAcaoSessao {
  arquivo?: string;
  salvoEm?: string;
  nomeArquivo?: string;
  conteudo?: string;
  campanhas?: ResumoCampanhaPersistida[];
}

export interface EventosClienteParaServidor {
  'sessao:listar-personagens-salvos': (codigoSessao: string, responder: (resposta: RespostaPersonagensSalvos) => void) => void;
  'sessao:entrar': (dados: EntradaSessao, responder: (resposta: RespostaEntradaSessao) => void) => void;
  'sessao:sincronizar-jogador': (codigoSessao: string, responder: (estado: EstadoSessaoJogador | null) => void) => void;
  'sessao:sincronizar-mestre': (codigoSessao: string, responder: (estado: EstadoSessao | null) => void) => void;
  'sessao:mestre-configurar-campanha': (dados: ConfiguracaoCampanha, responder: (resposta: RespostaAcaoSessao) => void) => void;
  'campanha:mestre-nova': (responder: (resposta: RespostaPersistenciaCampanha) => void) => void;
  'campanha:mestre-salvar': (responder: (resposta: RespostaPersistenciaCampanha) => void) => void;
  'campanha:mestre-listar': (responder: (resposta: RespostaPersistenciaCampanha) => void) => void;
  'campanha:mestre-carregar': (dados: { arquivo: string }, responder: (resposta: RespostaPersistenciaCampanha) => void) => void;
  'campanha:mestre-exportar': (responder: (resposta: RespostaPersistenciaCampanha) => void) => void;
  'campanha:mestre-importar': (dados: { conteudo: string }, responder: (resposta: RespostaPersistenciaCampanha) => void) => void;
  'personagem:configurar-deslocamento': (dados: ConfiguracaoDeslocamentoJogador, responder: (resposta: RespostaAcaoSessao) => void) => void;
  'mapa:mover-entidade': (dados: MovimentoEntidade, responder: (resposta: RespostaAcaoSessao) => void) => void;
  'mapa:mestre-mover-entidade': (dados: MovimentoEntidade, responder: (resposta: RespostaAcaoSessao) => void) => void;
  'mapa:mestre-alterar-tema': (dados: AlteracaoMapa, responder: (resposta: RespostaAcaoSessao) => void) => void;
  'mapa:mestre-configurar': (dados: ConfiguracaoMapa, responder: (resposta: RespostaAcaoSessao) => void) => void;
  'mapa:mestre-definir-iluminacao': (dados: ConfiguracaoIluminacao, responder: (resposta: RespostaAcaoSessao) => void) => void;
  'iluminacao:alternar-tocha': (dados: FonteLuz, responder: (resposta: RespostaAcaoSessao) => void) => void;
  'iluminacao:mestre-alternar-tocha': (dados: FonteLuz, responder: (resposta: RespostaAcaoSessao) => void) => void;
  'mapa:mestre-adicionar-entidade': (dados: CriacaoEntidade, responder: (resposta: RespostaAcaoSessao) => void) => void;
  'mapa:mestre-atualizar-entidade-privada': (dados: AtualizacaoEntidadePrivada, responder: (resposta: RespostaAcaoSessao) => void) => void;
  'mapa:mestre-definir-presenca-entidade': (dados: PresencaEntidade, responder: (resposta: RespostaAcaoSessao) => void) => void;
  'mapa:mestre-remover-entidade': (dados: { codigoSessao: string; entidadeId: string }, responder: (resposta: RespostaAcaoSessao) => void) => void;
  'combate:executar-acao': (dados: AcaoVisual, responder: (resposta: RespostaAcaoSessao) => void) => void;
  'combate:executar-acao-racial': (dados: AcaoRacial, responder: (resposta: RespostaAcaoSessao) => void) => void;
  'combate:mestre-executar-acao': (dados: AcaoVisual, responder: (resposta: RespostaAcaoSessao) => void) => void;
  'magia:configurar-selecao': (dados: ConfiguracaoMagiasJogador, responder: (resposta: RespostaAcaoSessao) => void) => void;
  'magia:conjurar': (dados: ConjuracaoMagia, responder: (resposta: RespostaAcaoSessao) => void) => void;
  'magia:encerrar-efeito': (dados: EncerramentoEfeitoMagia, responder: (resposta: RespostaAcaoSessao) => void) => void;
  'sessao:mestre-avancar-rodada': (dados: AvancoRodada, responder: (resposta: RespostaAcaoSessao) => void) => void;
  'mapa:mestre-definir-morte': (dados: EstadoMorteEntidade, responder: (resposta: RespostaAcaoSessao) => void) => void;
}

export interface EventosServidorParaCliente {
  'sessao:estado-jogador-atualizado': (estado: EstadoSessaoJogador) => void;
  'sessao:estado-mestre-atualizado': (estado: EstadoSessao) => void;
  'historico:item-adicionado': (item: ItemHistorico) => void;
  'combate:efeito-visual': (efeito: EfeitoVisualCombate) => void;
  'magia:efeito-visual': (efeito: EfeitoVisualMagia) => void;
}
