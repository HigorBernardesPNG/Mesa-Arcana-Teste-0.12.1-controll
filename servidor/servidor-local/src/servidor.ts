import { createServer, type IncomingMessage, type ServerResponse } from 'node:http';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { randomUUID } from 'node:crypto';
import { Server } from 'socket.io';
import {
  adicionarItemHistorico,
  alterarTemaMapa,
  criarEntidadeDoJogador,
  criarEntidadeMapa,
  criarEstadoSessao,
  criarVisaoJogador,
  criarFonteTocha,
  fonteTochaDaEntidade,
  reduzirFontesLuzUmaRodada,
  nomeNivelIluminacao,
  obterVisibilidadeCasa,
  efeitoMagiaEhPersistente,
  formatarTempoJogo,
  interpretarDuracaoMagia,
  reduzirUmaRodada,
  moverEntidade,
  calcularCasasMagia,
  entidadesNasCasas,
  fontesLuzCalculadas,
  distanciaEmMetros,
  obterMagiaPorId,
  magiaExigeVisao,
  magiaEstaDisponivelParaPersonagem,
  obterMagiasRaciaisDisponiveis,
  validarSelecaoMagiasPersonagem,
  pontoDentroDoAlcance,
  entidadePodeOcuparPosicao,
  variantePertenceARaca,
  calcularCasasSoproDraconico,
  obterSoproDraconico,
  nomeRacaCompleto,
  type EfeitoMagiaAtivo,
  type EntidadeMapa,
  type EfeitoVisualCombate,
  type EfeitoVisualMagia,
  type EstadoSessao,
  type PosicaoMapa,
  type TipoAcaoVisual
} from '@mesa-rpg/dominio';
import {
  esquemaAcaoRacial,
  esquemaAcaoVisual,
  esquemaAvancoRodada,
  esquemaAlteracaoMapa,
  esquemaAtualizacaoEntidadePrivada,
  esquemaConfiguracaoCampanha,
  esquemaConfiguracaoDeslocamentoJogador,
  esquemaConfiguracaoMapa,
  esquemaConfiguracaoIluminacao,
  esquemaConfiguracaoMagiasJogador,
  esquemaFonteLuz,
  esquemaConjuracaoMagia,
  esquemaCriacaoEntidade,
  esquemaEntradaSessao,
  esquemaEncerramentoEfeitoMagia,
  esquemaEstadoMorteEntidade,
  esquemaMovimentoEntidade,
  esquemaPresencaEntidade,
  type EventosClienteParaServidor,
  type EventosServidorParaCliente
} from '@mesa-rpg/protocolo';
import { obterEnderecosRede } from './conexoes/obterEnderecosRede.js';
import {
  carregarCampanhaLocal,
  desserializarCampanha,
  listarCampanhasLocais,
  restaurarEstadoCampanha,
  salvarCampanhaLocal,
  serializarCampanha
} from './persistencia/persistenciaCampanha.js';

const PORTA_PADRAO = 3210;
const PORTA_INTERFACE_PADRAO = 5173;
const porta = Number(process.env.PORTA_MESA_RPG ?? PORTA_PADRAO);
const portaInterface = Number(process.env.PORTA_INTERFACE_MESA_RPG ?? PORTA_INTERFACE_PADRAO);
let estado: EstadoSessao = criarEstadoSessao('Nova campanha');
let arquivoCampanhaAtual: string | null = null;
let temporizadorSalvamentoAutomatico: NodeJS.Timeout | null = null;

const salaJogadores = `${estado.codigo}:jogadores`;
const salaMestres = `${estado.codigo}:mestres`;

function responderJson(resposta: ServerResponse, status: number, dados: unknown): void {
  resposta.writeHead(status, {
    'Content-Type': 'application/json; charset=utf-8',
    'Access-Control-Allow-Origin': '*'
  });
  resposta.end(JSON.stringify(dados));
}

function obterLinksEntrada(): string[] {
  return obterEnderecosRede(portaInterface).map(
    (endereco) => `${endereco}/entrar?codigo=${encodeURIComponent(estado.codigo)}`
  );
}

function tratarHttp(requisicao: IncomingMessage, resposta: ServerResponse): void {
  if (requisicao.method === 'GET' && requisicao.url === '/api/saude') {
    responderJson(resposta, 200, { ativo: true, porta });
    return;
  }

  if (requisicao.method === 'GET' && requisicao.url === '/api/sessao') {
    responderJson(resposta, 200, {
      codigo: estado.codigo,
      nomeCampanha: estado.nomeCampanha,
      jogadoresConectados: estado.jogadores.filter((jogador) => jogador.conectado).length,
      linksEntrada: obterLinksEntrada()
    });
    return;
  }

  responderJson(resposta, 404, { mensagem: 'Recurso nao encontrado.' });
}

function obterPosicaoLivreParaEntidade(entidade: EntidadeMapa, preferida?: PosicaoMapa): PosicaoMapa | null {
  const testar = (posicao: PosicaoMapa): boolean =>
    entidadePodeOcuparPosicao(entidade, posicao, estado.mapaAtual, estado.entidades.filter((item) => item.presenteNoMapa !== false));

  if (preferida && testar(preferida)) return preferida;

  for (let linha = 1; linha <= estado.mapaAtual.linhas; linha += 1) {
    for (let coluna = 1; coluna <= estado.mapaAtual.colunas; coluna += 1) {
      const posicao = { coluna, linha };
      if (testar(posicao)) return posicao;
    }
  }

  return null;
}

function reorganizarEntidadesAposRedimensionar(): void {
  for (const entidade of estado.entidades) {
    if (entidade.presenteNoMapa === false) continue;
    const preferida = {
      coluna: Math.min(Math.max(entidade.posicao.coluna, 1), estado.mapaAtual.colunas),
      linha: Math.min(Math.max(entidade.posicao.linha, 1), estado.mapaAtual.linhas)
    };
    const posicao = obterPosicaoLivreParaEntidade(entidade, preferida);
    if (posicao) entidade.posicao = posicao;
  }
}

function nomeColuna(numero: number): string {
  let valor = numero;
  let resultado = '';
  while (valor > 0) {
    valor -= 1;
    resultado = String.fromCharCode(65 + (valor % 26)) + resultado;
    valor = Math.floor(valor / 26);
  }
  return resultado;
}

function nomeCasa(posicao: PosicaoMapa): string {
  return `${nomeColuna(posicao.coluna)}${posicao.linha}`;
}

function descricaoAreaMagia(forma: string, tamanho?: number, largura?: number): string {
  if (forma === 'alvo') return 'alvo direto';
  if (forma === 'pessoal') return 'pessoal';
  if (forma === 'aura') return `aura${tamanho ? ` de ${tamanho} m` : ''}`;
  if (forma === 'linha') return `linha${tamanho ? ` de ${tamanho} m` : ''}${largura ? ` x ${largura} m` : ''}`;
  if (forma === 'cone') return `cone${tamanho ? ` de ${tamanho} m` : ''}`;
  if (forma === 'cubo') return `cubo${tamanho ? ` de ${tamanho} m` : ''}`;
  if (forma === 'cilindro') return `cilindro${tamanho ? ` de ${tamanho} m` : ''}`;
  return `esfera${tamanho ? ` de ${tamanho} m` : ''}`;
}

function atualizarEfeitosAposMovimento(entidadeId: string): void {
  const entidade = estado.entidades.find((item) => item.id === entidadeId);
  if (!entidade) return;

  for (const efeito of estado.efeitosMagiaAtivos) {
    const magia = obterMagiaPorId(efeito.magiaId);
    if (!magia) continue;

    if (efeito.vinculo === 'alvo' && efeito.alvoIds.includes(entidadeId)) {
      efeito.casas = [{ ...entidade.posicao }];
      continue;
    }

    if (efeito.conjuradorId === entidadeId && (magia.formaArea === 'pessoal' || magia.formaArea === 'aura')) {
      efeito.casas = calcularCasasMagia(magia, entidade.posicao, undefined, estado.mapaAtual);
    }
  }
}

export function iniciarServidorLocal(): ReturnType<typeof createServer> {
  const servidorHttp = createServer(tratarHttp);
  const io = new Server<EventosClienteParaServidor, EventosServidorParaCliente>(servidorHttp, {
    cors: { origin: true, credentials: false },
    maxHttpBufferSize: 50_000_000
  });

  function agendarSalvamentoAutomatico(): void {
    if (!arquivoCampanhaAtual) return;
    if (temporizadorSalvamentoAutomatico) clearTimeout(temporizadorSalvamentoAutomatico);
    temporizadorSalvamentoAutomatico = setTimeout(() => {
      void salvarCampanhaLocal(estado, arquivoCampanhaAtual).catch((falha) => {
        console.error('Mesa Arcana - falha no salvamento automático:', falha);
      });
    }, 8_000);
  }

  function publicarEstado(): void {
    io.to(salaJogadores).emit('sessao:estado-jogador-atualizado', criarVisaoJogador(estado));
    io.to(salaMestres).emit('sessao:estado-mestre-atualizado', estado);
    agendarSalvamentoAutomatico();
  }

  function publicarHistorico(item: ReturnType<typeof adicionarItemHistorico>): void {
    io.to(salaJogadores).emit('historico:item-adicionado', item);
    io.to(salaMestres).emit('historico:item-adicionado', item);
  }

  function publicarEfeitoVisual(efeito: EfeitoVisualCombate): void {
    io.to(salaJogadores).emit('combate:efeito-visual', efeito);
    io.to(salaMestres).emit('combate:efeito-visual', efeito);
  }

  function publicarEfeitoMagia(efeito: EfeitoVisualMagia): void {
    io.to(salaJogadores).emit('magia:efeito-visual', efeito);
    io.to(salaMestres).emit('magia:efeito-visual', efeito);
  }

  function nomeAcaoVisual(tipo: TipoAcaoVisual): string {
    if (tipo === 'espada') return 'golpe de espada';
    if (tipo === 'flecha') return 'flecha';
    return 'magia';
  }

  function criarEfeitoVisual(tipo: TipoAcaoVisual, atacanteId: string, alvoId: string): EfeitoVisualCombate {
    return {
      id: randomUUID(),
      tipo,
      atacanteId,
      alvoId,
      criadoEm: new Date().toISOString()
    };
  }

  function removerEfeitoMagia(efeitoId: string, motivo: string, responsavel?: string): EfeitoMagiaAtivo | undefined {
    const indice = estado.efeitosMagiaAtivos.findIndex((efeito) => efeito.id === efeitoId);
    if (indice < 0) return undefined;
    const [efeito] = estado.efeitosMagiaAtivos.splice(indice, 1);
    if (!efeito) return undefined;

    const conjurador = estado.entidades.find((entidade) => entidade.id === efeito.conjuradorId);
    const item = adicionarItemHistorico(estado, {
      tipo: 'magia',
      mensagem: `${efeito.nomeMagia} terminou.`,
      detalhes: [
        `Conjurador: ${conjurador?.nome ?? 'desconhecido'}`,
        `Motivo: ${motivo}`,
        ...(responsavel ? [`Encerrado por: ${responsavel}`] : [])
      ]
    });
    publicarHistorico(item);
    return efeito;
  }

  function encerrarConcentracaoAnterior(conjuradorId: string): void {
    const anteriores = estado.efeitosMagiaAtivos.filter((efeito) => efeito.conjuradorId === conjuradorId && efeito.concentracao);
    for (const efeito of anteriores) removerEfeitoMagia(efeito.id, 'nova magia de concentração conjurada');
  }

  function descreverDestinoMagia(efeito: Pick<EfeitoMagiaAtivo, 'vinculo' | 'pontoOrigem' | 'alvoIds' | 'casas'>): string {
    if (efeito.vinculo === 'alvo') {
      const nomes = efeito.alvoIds.map((id) => estado.entidades.find((entidade) => entidade.id === id)?.nome).filter(Boolean);
      return nomes.length > 0 ? nomes.join(', ') : 'alvo direto';
    }
    if (efeito.pontoOrigem) return `casa ${nomeCasa(efeito.pontoOrigem)}`;
    if (efeito.casas[0]) return `casa ${nomeCasa(efeito.casas[0])}`;
    return 'origem pessoal';
  }

  io.on('connection', (socket) => {
    const enderecoRemoto = socket.handshake.address;
    const conexaoLocal = enderecoRemoto === '127.0.0.1' || enderecoRemoto === '::1' || enderecoRemoto === '::ffff:127.0.0.1';

    socket.on('sessao:sincronizar-jogador', (codigoSessao, responder) => {
      if (codigoSessao.toUpperCase() !== estado.codigo) return responder(null);
      socket.join(salaJogadores);
      responder(criarVisaoJogador(estado));
    });

    socket.on('sessao:sincronizar-mestre', (codigoSessao, responder) => {
      if (!conexaoLocal || codigoSessao.toUpperCase() !== estado.codigo) return responder(null);
      socket.data.perfil = 'mestre';
      socket.join(salaMestres);
      responder(estado);
    });

    socket.on('campanha:mestre-nova', (responder) => {
      if (socket.data.perfil !== 'mestre') return responder({ sucesso: false, mensagem: 'Apenas o Mestre local pode iniciar uma nova campanha.' });
      if (estado.jogadores.some((jogador) => jogador.conectado)) {
        return responder({ sucesso: false, mensagem: 'Desconecte os jogadores antes de iniciar uma nova campanha.' });
      }

      const codigoAtual = estado.codigo;
      estado = criarEstadoSessao('Nova campanha');
      estado.codigo = codigoAtual;
      arquivoCampanhaAtual = null;
      const item = adicionarItemHistorico(estado, { tipo: 'sistema', mensagem: 'Nova campanha iniciada.' });
      responder({ sucesso: true, mensagem: 'Nova campanha criada.' });
      publicarHistorico(item);
      publicarEstado();
    });

    socket.on('campanha:mestre-salvar', async (responder) => {
      if (socket.data.perfil !== 'mestre') return responder({ sucesso: false, mensagem: 'Apenas o Mestre local pode salvar a campanha.' });
      try {
        if (temporizadorSalvamentoAutomatico) clearTimeout(temporizadorSalvamentoAutomatico);
        const salvo = await salvarCampanhaLocal(estado, arquivoCampanhaAtual);
        arquivoCampanhaAtual = salvo.arquivo;
        responder({ sucesso: true, mensagem: 'Campanha salva no computador do Mestre.', arquivo: salvo.arquivo, salvoEm: salvo.salvoEm });
      } catch (falha) {
        responder({ sucesso: false, mensagem: falha instanceof Error ? falha.message : 'Não foi possível salvar a campanha.' });
      }
    });

    socket.on('campanha:mestre-listar', async (responder) => {
      if (socket.data.perfil !== 'mestre') return responder({ sucesso: false, mensagem: 'Apenas o Mestre local pode acessar os salvamentos.' });
      try {
        responder({ sucesso: true, campanhas: await listarCampanhasLocais() });
      } catch (falha) {
        responder({ sucesso: false, mensagem: falha instanceof Error ? falha.message : 'Não foi possível listar as campanhas.' });
      }
    });

    socket.on('campanha:mestre-carregar', async (dados, responder) => {
      if (socket.data.perfil !== 'mestre') return responder({ sucesso: false, mensagem: 'Apenas o Mestre local pode carregar uma campanha.' });
      if (estado.jogadores.some((jogador) => jogador.conectado)) {
        return responder({ sucesso: false, mensagem: 'Desconecte os jogadores antes de carregar outra campanha.' });
      }
      try {
        const campanha = await carregarCampanhaLocal(dados.arquivo);
        estado = restaurarEstadoCampanha(campanha, estado.codigo);
        arquivoCampanhaAtual = dados.arquivo;
        const item = adicionarItemHistorico(estado, { tipo: 'sistema', mensagem: `Campanha ${estado.nomeCampanha} carregada do computador do Mestre.` });
        responder({ sucesso: true, mensagem: 'Campanha carregada.', arquivo: dados.arquivo, salvoEm: campanha.salvoEm });
        publicarHistorico(item);
        publicarEstado();
      } catch (falha) {
        responder({ sucesso: false, mensagem: falha instanceof Error ? falha.message : 'Não foi possível carregar a campanha.' });
      }
    });

    socket.on('campanha:mestre-exportar', (responder) => {
      if (socket.data.perfil !== 'mestre') return responder({ sucesso: false, mensagem: 'Apenas o Mestre local pode exportar a campanha.' });
      try {
        const conteudo = serializarCampanha(estado);
        const nomeSeguro = estado.nomeCampanha
          .normalize('NFD')
          .replace(/[\u0300-\u036f]/g, '')
          .replace(/[^a-zA-Z0-9_-]+/g, '-')
          .replace(/^-+|-+$/g, '')
          .toLowerCase() || 'campanha';
        responder({ sucesso: true, nomeArquivo: `${nomeSeguro}.mesaarcana`, conteudo });
      } catch (falha) {
        responder({ sucesso: false, mensagem: falha instanceof Error ? falha.message : 'Não foi possível exportar a campanha.' });
      }
    });

    socket.on('campanha:mestre-importar', async (dados, responder) => {
      if (socket.data.perfil !== 'mestre') return responder({ sucesso: false, mensagem: 'Apenas o Mestre local pode importar uma campanha.' });
      if (estado.jogadores.some((jogador) => jogador.conectado)) {
        return responder({ sucesso: false, mensagem: 'Desconecte os jogadores antes de importar outra campanha.' });
      }
      try {
        const campanha = desserializarCampanha(dados.conteudo);
        estado = restaurarEstadoCampanha(campanha, estado.codigo);
        arquivoCampanhaAtual = null;
        const salvo = await salvarCampanhaLocal(estado, null);
        arquivoCampanhaAtual = salvo.arquivo;
        const item = adicionarItemHistorico(estado, { tipo: 'sistema', mensagem: `Campanha ${estado.nomeCampanha} importada para este computador.` });
        responder({ sucesso: true, mensagem: 'Campanha importada e salva localmente.', arquivo: salvo.arquivo, salvoEm: salvo.salvoEm });
        publicarHistorico(item);
        publicarEstado();
      } catch (falha) {
        responder({ sucesso: false, mensagem: falha instanceof Error ? falha.message : 'Não foi possível importar a campanha.' });
      }
    });

    socket.on('sessao:mestre-configurar-campanha', (dadosBrutos, responder) => {
      const resultado = esquemaConfiguracaoCampanha.safeParse(dadosBrutos);
      if (!resultado.success || socket.data.perfil !== 'mestre') {
        responder({ sucesso: false, mensagem: 'Configuracao invalida.' });
        return;
      }
      if (resultado.data.codigoSessao !== estado.codigo) {
        responder({ sucesso: false, mensagem: 'Sessao invalida.' });
        return;
      }
      estado.nomeCampanha = resultado.data.nomeCampanha;
      const item = adicionarItemHistorico(estado, { tipo: 'sistema', mensagem: `Campanha definida como ${estado.nomeCampanha}.` });
      responder({ sucesso: true });
      publicarHistorico(item);
      publicarEstado();
    });

    socket.on('sessao:listar-personagens-salvos', (codigoSessao, responder) => {
      if (codigoSessao.trim().toUpperCase() !== estado.codigo) {
        responder({ sucesso: false, mensagem: 'Codigo da sessao invalido.', personagens: [] });
        return;
      }

      const personagens = estado.jogadores
        .filter((jogador) => jogador.perfil === 'jogador')
        .map((jogador) => {
          const entidade = estado.entidades.find((item) => item.controladorJogadorId === jogador.id);
          return {
            jogadorId: jogador.id,
            nome: jogador.nome,
            conectado: jogador.conectado,
            classePersonagem: jogador.classePersonagem,
            nivelPersonagem: jogador.nivelPersonagem,
            racaPersonagem: jogador.racaPersonagem,
            ...(jogador.varianteRacialPersonagem ? { varianteRacialPersonagem: jogador.varianteRacialPersonagem } : {}),
            ...(entidade?.imagemToken ? { imagemToken: entidade.imagemToken } : {})
          };
        });

      responder({ sucesso: true, personagens });
    });

    socket.on('sessao:entrar', (dadosBrutos, responder) => {
      const resultado = esquemaEntradaSessao.safeParse(dadosBrutos);
      if (!resultado.success) {
        responder({ sucesso: false, mensagem: 'Dados de entrada invalidos.' });
        return;
      }

      const { codigoSessao, personagemSalvoId, nomeJogador, imagemToken, classePersonagem, nivelPersonagem, racaPersonagem, varianteRacialPersonagem } = resultado.data;
      if (codigoSessao !== estado.codigo) {
        responder({ sucesso: false, mensagem: 'Codigo da sessao invalido.' });
        return;
      }
      if (personagemSalvoId) {
        const jogadorExistente = estado.jogadores.find((jogador) => jogador.id === personagemSalvoId && jogador.perfil === 'jogador');
        if (!jogadorExistente) {
          responder({ sucesso: false, mensagem: 'Personagem salvo nao encontrado nesta campanha.' });
          return;
        }
        if (jogadorExistente.conectado) {
          responder({ sucesso: false, mensagem: 'Esse personagem ja esta sendo usado por outro jogador.' });
          return;
        }

        const entidadeExistente = estado.entidades.find((entidade) => entidade.controladorJogadorId === jogadorExistente.id);
        if (!entidadeExistente) {
          responder({ sucesso: false, mensagem: 'O token salvo desse personagem nao foi encontrado.' });
          return;
        }

        if (entidadeExistente.presenteNoMapa === false) {
          const posicaoRetorno = obterPosicaoLivreParaEntidade(entidadeExistente, entidadeExistente.posicao);
          if (!posicaoRetorno) {
            responder({ sucesso: false, mensagem: 'O mapa nao possui espaco livre para recolocar este personagem. O Mestre precisa liberar uma area primeiro.' });
            return;
          }
          entidadeExistente.posicao = posicaoRetorno;
          entidadeExistente.presenteNoMapa = true;
          entidadeExistente.movimentoGastoRodada = 0;
        }

        jogadorExistente.conectado = true;
        if (imagemToken) entidadeExistente.imagemToken = imagemToken;
        socket.data.jogadorId = jogadorExistente.id;
        socket.data.perfil = 'jogador';
        socket.join(salaJogadores);

        const itemHistorico = adicionarItemHistorico(estado, {
          tipo: 'conexao',
          mensagem: `${jogadorExistente.nome} retornou à sessão com um personagem salvo.`,
          detalhes: ['Personagem, token, magias e configurações anteriores foram restaurados a partir da campanha.']
        });
        responder({ sucesso: true, jogadorId: jogadorExistente.id, estado: criarVisaoJogador(estado) });
        publicarHistorico(itemHistorico);
        publicarEstado();
        return;
      }

      if (!variantePertenceARaca(racaPersonagem, varianteRacialPersonagem)) {
        responder({ sucesso: false, mensagem: 'Sub-raça ou ancestral dracônico incompatível com a raça escolhida.' });
        return;
      }

      const jogadorId = randomUUID();
      const entidadeJogador = criarEntidadeDoJogador(
        randomUUID(),
        jogadorId,
        nomeJogador,
        { coluna: 1, linha: 1 },
        imagemToken,
        classePersonagem,
        nivelPersonagem,
        racaPersonagem,
        varianteRacialPersonagem
      );
      const posicaoInicial = obterPosicaoLivreParaEntidade(entidadeJogador, { coluna: 2, linha: Math.max(1, estado.mapaAtual.linhas - 1) });
      if (!posicaoInicial) {
        responder({ sucesso: false, mensagem: 'O mapa nao possui espaco livre para uma nova peca.' });
        return;
      }
      entidadeJogador.posicao = posicaoInicial;

      estado.jogadores.push({ id: jogadorId, nome: nomeJogador, conectado: true, perfil: 'jogador', classePersonagem, nivelPersonagem, racaPersonagem, ...(varianteRacialPersonagem ? { varianteRacialPersonagem } : {}), magiasSelecionadasIds: [] });
      estado.entidades.push(entidadeJogador);

      socket.data.jogadorId = jogadorId;
      socket.data.perfil = 'jogador';
      socket.join(salaJogadores);

      const itemHistorico = adicionarItemHistorico(estado, {
        tipo: 'conexao',
        mensagem: `${nomeJogador} entrou na sessao.`,
        detalhes: [
          `Raça: ${nomeRacaCompleto(racaPersonagem, varianteRacialPersonagem)}`,
          `Classe: ${classePersonagem}`,
          `Nível: ${nivelPersonagem}`
        ]
      });
      responder({ sucesso: true, jogadorId, estado: criarVisaoJogador(estado) });
      publicarHistorico(itemHistorico);
      publicarEstado();
    });

    socket.on('personagem:configurar-deslocamento', (dadosBrutos, responder) => {
      const resultado = esquemaConfiguracaoDeslocamentoJogador.safeParse(dadosBrutos);
      if (!resultado.success) return responder({ sucesso: false, mensagem: 'Deslocamento invalido. Use valores em segmentos de 1,5 m.' });

      const jogadorId = socket.data.jogadorId as string | undefined;
      if (!jogadorId) return responder({ sucesso: false, mensagem: 'Jogador nao identificado.' });
      if (resultado.data.codigoSessao !== estado.codigo) return responder({ sucesso: false, mensagem: 'Sessao invalida.' });

      const entidade = estado.entidades.find((item) => item.id === resultado.data.entidadeId);
      if (!entidade || entidade.controladorJogadorId !== jogadorId || entidade.tipo !== 'personagem') {
        return responder({ sucesso: false, mensagem: 'Voce nao pode alterar o deslocamento desta peca.' });
      }

      const anterior = entidade.deslocamento ?? entidade.deslocamentoBase ?? 0;
      entidade.deslocamento = resultado.data.deslocamentoEfetivo;
      // O gasto da rodada é preservado. Reduzir temporariamente o limite não deve
      // devolver movimento caso o valor seja aumentado novamente na mesma rodada.
      const jogador = estado.jogadores.find((item) => item.id === jogadorId);
      const itemHistorico = adicionarItemHistorico(estado, {
        tipo: 'movimento',
        mensagem: `${jogador?.nome ?? entidade.nome} ajustou o deslocamento efetivo para ${entidade.deslocamento} m.`,
        detalhes: [
          `Valor anterior: ${anterior} m`,
          `Deslocamento base racial: ${entidade.deslocamentoBase ?? entidade.deslocamento} m`,
          `Movimento restante nesta rodada: ${Math.max(0, entidade.deslocamento - (entidade.movimentoGastoRodada ?? 0))} m`
        ]
      });
      responder({ sucesso: true });
      publicarHistorico(itemHistorico);
      publicarEstado();
    });

    socket.on('mapa:mover-entidade', (dadosBrutos, responder) => {
      const resultado = esquemaMovimentoEntidade.safeParse(dadosBrutos);
      if (!resultado.success) return responder({ sucesso: false, mensagem: 'Movimento invalido.' });

      const jogadorId = socket.data.jogadorId as string | undefined;
      if (!jogadorId) return responder({ sucesso: false, mensagem: 'Jogador nao identificado.' });

      const { codigoSessao, entidadeId, coluna, linha } = resultado.data;
      if (codigoSessao !== estado.codigo) return responder({ sucesso: false, mensagem: 'Sessao invalida.' });

      const entidade = estado.entidades.find((item) => item.id === entidadeId);
      if (!entidade || entidade.controladorJogadorId !== jogadorId) {
        responder({ sucesso: false, mensagem: 'Voce nao controla esta peca.' });
        return;
      }
      if (entidade.presenteNoMapa === false) {
        responder({ sucesso: false, mensagem: 'Seu personagem esta fora do grid. O Mestre precisa recoloca-lo no mapa.' });
        return;
      }

      const movimento = moverEntidade(estado, entidadeId, { coluna, linha }, false);
      if (!movimento.sucesso) {
        const mensagem = movimento.motivo === 'limite'
          ? `Destino fora do movimento restante (${movimento.restanteMetros ?? 0} m).`
          : movimento.motivo === 'posicao'
            ? 'A peça não cabe nessa posição ou a área está ocupada.'
            : 'Não foi possível mover esta peça.';
        responder({ sucesso: false, mensagem });
        return;
      }
      atualizarEfeitosAposMovimento(entidadeId);

      const jogador = estado.jogadores.find((item) => item.id === jogadorId);
      const itemHistorico = adicionarItemHistorico(estado, {
        tipo: 'movimento',
        mensagem: `${jogador?.nome ?? 'Jogador'} moveu ${entidade.nome} para ${nomeCasa({ coluna, linha })}.`,
        detalhes: [`Deslocamento usado: ${movimento.distanciaMetros ?? 0} m`, `Restante na rodada: ${movimento.restanteMetros ?? 0} m`]
      });
      responder({ sucesso: true });
      publicarHistorico(itemHistorico);
      publicarEstado();
    });

    socket.on('mapa:mestre-mover-entidade', (dadosBrutos, responder) => {
      const resultado = esquemaMovimentoEntidade.safeParse(dadosBrutos);
      if (!resultado.success || socket.data.perfil !== 'mestre') return responder({ sucesso: false, mensagem: 'Movimento invalido.' });

      const { codigoSessao, entidadeId, coluna, linha } = resultado.data;
      if (codigoSessao !== estado.codigo) return responder({ sucesso: false, mensagem: 'Sessao invalida.' });

      const entidade = estado.entidades.find((item) => item.id === entidadeId);
      if (!entidade) return responder({ sucesso: false, mensagem: 'Peca nao encontrada.' });
      if (entidade.presenteNoMapa === false) return responder({ sucesso: false, mensagem: 'Esta entidade esta guardada na biblioteca da campanha.' });
      const modoLivre = resultado.data.ignorarLimiteMovimento === true;
      const movimento = moverEntidade(estado, entidadeId, { coluna, linha }, modoLivre);
      if (!movimento.sucesso) {
        const mensagem = movimento.motivo === 'limite'
          ? `Destino fora do movimento restante (${movimento.restanteMetros ?? 0} m). Ative o reposicionamento livre para ignorar o limite.`
          : movimento.motivo === 'posicao'
            ? 'A peça não cabe nessa posição ou a área está ocupada.'
            : 'Não foi possível mover esta peça.';
        responder({ sucesso: false, mensagem });
        return;
      }
      atualizarEfeitosAposMovimento(entidadeId);

      const itemHistorico = adicionarItemHistorico(estado, {
        tipo: 'movimento',
        mensagem: modoLivre ? `Mestre reposicionou ${entidade.nome} para ${nomeCasa({ coluna, linha })}.` : `Mestre moveu ${entidade.nome} para ${nomeCasa({ coluna, linha })}.`,
        detalhes: modoLivre ? ['Reposicionamento livre do mestre.'] : [`Deslocamento usado: ${movimento.distanciaMetros ?? 0} m`, `Restante na rodada: ${movimento.restanteMetros ?? 0} m`]
      });
      responder({ sucesso: true });
      publicarHistorico(itemHistorico);
      publicarEstado();
    });

    socket.on('mapa:mestre-alterar-tema', (dadosBrutos, responder) => {
      const resultado = esquemaAlteracaoMapa.safeParse(dadosBrutos);
      if (!resultado.success || socket.data.perfil !== 'mestre') return responder({ sucesso: false, mensagem: 'Alteracao invalida.' });
      if (resultado.data.codigoSessao !== estado.codigo) return responder({ sucesso: false, mensagem: 'Sessao invalida.' });

      alterarTemaMapa(estado, resultado.data.tema);
      const itemHistorico = adicionarItemHistorico(estado, { tipo: 'mapa', mensagem: `Mestre alterou o cenario para ${resultado.data.tema}.` });
      responder({ sucesso: true });
      publicarHistorico(itemHistorico);
      publicarEstado();
    });

    socket.on('mapa:mestre-configurar', (dadosBrutos, responder) => {
      const resultado = esquemaConfiguracaoMapa.safeParse(dadosBrutos);
      if (!resultado.success || socket.data.perfil !== 'mestre') return responder({ sucesso: false, mensagem: 'Configuracao do mapa invalida.' });
      if (resultado.data.codigoSessao !== estado.codigo) return responder({ sucesso: false, mensagem: 'Sessao invalida.' });

      estado.mapaAtual.nome = resultado.data.nome;
      estado.mapaAtual.colunas = resultado.data.colunas;
      estado.mapaAtual.linhas = resultado.data.linhas;
      estado.mapaAtual.opacidadeGrade = resultado.data.opacidadeGrade;
      if (resultado.data.imagemFundo) {
        estado.mapaAtual.imagemFundo = resultado.data.imagemFundo;
        estado.mapaAtual.tema = 'personalizado';
      }
      reorganizarEntidadesAposRedimensionar();

      const itemHistorico = adicionarItemHistorico(estado, { tipo: 'mapa', mensagem: `Mestre configurou o mapa ${estado.mapaAtual.nome} (${estado.mapaAtual.colunas}x${estado.mapaAtual.linhas}).` });
      responder({ sucesso: true });
      publicarHistorico(itemHistorico);
      publicarEstado();
    });

    socket.on('mapa:mestre-definir-iluminacao', (dadosBrutos, responder) => {
      const resultado = esquemaConfiguracaoIluminacao.safeParse(dadosBrutos);
      if (!resultado.success || socket.data.perfil !== 'mestre' || resultado.data.codigoSessao !== estado.codigo) {
        return responder({ sucesso: false, mensagem: 'Iluminacao invalida.' });
      }

      estado.mapaAtual.iluminacaoAmbiente = resultado.data.nivelIluminacao;
      const itemHistorico = adicionarItemHistorico(estado, {
        tipo: 'mapa',
        mensagem: `Mestre alterou a iluminacao do ambiente para ${nomeNivelIluminacao(resultado.data.nivelIluminacao)}.`,
        detalhes: ['Fontes de luz locais, tochas e magias continuam podendo iluminar partes do mapa.']
      });
      responder({ sucesso: true });
      publicarHistorico(itemHistorico);
      publicarEstado();
    });

    socket.on('iluminacao:alternar-tocha', (dadosBrutos, responder) => {
      const resultado = esquemaFonteLuz.safeParse(dadosBrutos);
      if (!resultado.success || resultado.data.codigoSessao !== estado.codigo) {
        return responder({ sucesso: false, mensagem: 'Acao de iluminacao invalida.' });
      }
      const jogadorId = socket.data.jogadorId as string | undefined;
      if (!jogadorId) return responder({ sucesso: false, mensagem: 'Jogador nao identificado.' });
      const entidade = estado.entidades.find((item) => item.id === resultado.data.entidadeId);
      if (!entidade || entidade.controladorJogadorId !== jogadorId) {
        return responder({ sucesso: false, mensagem: 'Voce nao controla esta peca.' });
      }
      if (entidade.presenteNoMapa === false) return responder({ sucesso: false, mensagem: 'Seu personagem esta fora do grid.' });
      if (entidade.morto && resultado.data.ativa) return responder({ sucesso: false, mensagem: 'Uma peca marcada como morta nao pode acender uma tocha.' });

      const atual = fonteTochaDaEntidade(estado.fontesLuzAtivas, entidade.id);
      if (resultado.data.ativa && !atual) estado.fontesLuzAtivas.push(criarFonteTocha(randomUUID(), entidade.id));
      if (!resultado.data.ativa && atual) estado.fontesLuzAtivas = estado.fontesLuzAtivas.filter((fonte) => fonte.id !== atual.id);

      const jogador = estado.jogadores.find((item) => item.id === jogadorId);
      const itemHistorico = adicionarItemHistorico(estado, {
        tipo: 'sistema',
        mensagem: `${jogador?.nome ?? entidade.nome} ${resultado.data.ativa ? 'acendeu' : 'apagou'} uma tocha.`,
        detalhes: resultado.data.ativa
          ? ['Luz plena: 6 m', 'Penumbra adicional: 6 m', 'Duracao de jogo: 1 hora']
          : [`Fonte de luz removida de ${entidade.nome}.`]
      });
      responder({ sucesso: true });
      publicarHistorico(itemHistorico);
      publicarEstado();
    });

    socket.on('iluminacao:mestre-alternar-tocha', (dadosBrutos, responder) => {
      const resultado = esquemaFonteLuz.safeParse(dadosBrutos);
      if (!resultado.success || socket.data.perfil !== 'mestre' || resultado.data.codigoSessao !== estado.codigo) {
        return responder({ sucesso: false, mensagem: 'Acao de iluminacao invalida.' });
      }
      const entidade = estado.entidades.find((item) => item.id === resultado.data.entidadeId);
      if (!entidade) return responder({ sucesso: false, mensagem: 'Peca nao encontrada.' });
      if (entidade.presenteNoMapa === false) return responder({ sucesso: false, mensagem: 'Recoloque a entidade no grid antes de usar uma fonte de luz.' });
      const atual = fonteTochaDaEntidade(estado.fontesLuzAtivas, entidade.id);
      if (resultado.data.ativa && !atual) estado.fontesLuzAtivas.push(criarFonteTocha(randomUUID(), entidade.id));
      if (!resultado.data.ativa && atual) estado.fontesLuzAtivas = estado.fontesLuzAtivas.filter((fonte) => fonte.id !== atual.id);

      const itemHistorico = adicionarItemHistorico(estado, {
        tipo: 'sistema',
        mensagem: `Mestre ${resultado.data.ativa ? 'acendeu' : 'apagou'} uma tocha em ${entidade.nome}.`,
        ...(resultado.data.ativa ? { detalhes: ['Luz plena: 6 m', 'Penumbra adicional: 6 m', 'Duracao de jogo: 1 hora'] } : {})
      });
      responder({ sucesso: true });
      publicarHistorico(itemHistorico);
      publicarEstado();
    });

    socket.on('mapa:mestre-adicionar-entidade', (dadosBrutos, responder) => {
      const resultado = esquemaCriacaoEntidade.safeParse(dadosBrutos);
      if (!resultado.success || socket.data.perfil !== 'mestre') return responder({ sucesso: false, mensagem: 'Dados da peca invalidos.' });
      if (resultado.data.codigoSessao !== estado.codigo) return responder({ sucesso: false, mensagem: 'Sessao invalida.' });

      const quantidade = resultado.data.tipo === 'personagem' ? 1 : resultado.data.quantidade;
      const criadas: EntidadeMapa[] = [];
      let colocadasNoGrid = 0;

      for (let indice = 0; indice < quantidade; indice += 1) {
        const nome = quantidade > 1 ? `${resultado.data.nome} ${indice + 1}` : resultado.data.nome;
        const entidade = criarEntidadeMapa(
          randomUUID(),
          nome,
          resultado.data.tipo,
          { coluna: 1, linha: 1 },
          resultado.data.imagemToken,
          resultado.data.tamanhoCriatura
        );
        const posicao = obterPosicaoLivreParaEntidade(entidade, { coluna: 1, linha: 1 });
        if (posicao) {
          entidade.posicao = posicao;
          entidade.presenteNoMapa = true;
          colocadasNoGrid += 1;
        } else {
          entidade.presenteNoMapa = false;
        }
        estado.entidades.push(entidade);
        criadas.push(entidade);
      }

      const guardadas = criadas.length - colocadasNoGrid;
      const itemHistorico = adicionarItemHistorico(estado, {
        tipo: 'mapa',
        mensagem: quantidade > 1
          ? `Mestre criou ${quantidade} entidades de ${resultado.data.nome}.`
          : `Mestre adicionou ${criadas[0]?.nome ?? resultado.data.nome} à campanha.`,
        detalhes: [
          `No grid: ${colocadasNoGrid}`,
          ...(guardadas > 0 ? [`Na biblioteca: ${guardadas} (sem espaço livre no mapa)`] : [])
        ]
      });
      responder({
        sucesso: true,
        mensagem: guardadas > 0
          ? `${colocadasNoGrid} colocada(s) no grid e ${guardadas} guardada(s) na biblioteca.`
          : `${quantidade} entidade(s) criada(s) e colocada(s) no grid.`
      });
      publicarHistorico(itemHistorico);
      publicarEstado();
    });

    socket.on('mapa:mestre-atualizar-entidade-privada', (dadosBrutos, responder) => {
      const resultado = esquemaAtualizacaoEntidadePrivada.safeParse(dadosBrutos);
      if (!resultado.success || socket.data.perfil !== 'mestre') {
        responder({ sucesso: false, mensagem: 'Dados privados invalidos.' });
        return;
      }
      if (resultado.data.codigoSessao !== estado.codigo) {
        responder({ sucesso: false, mensagem: 'Sessao invalida.' });
        return;
      }

      const entidade = estado.entidades.find((item) => item.id === resultado.data.entidadeId);
      if (!entidade || entidade.controladorJogadorId) {
        responder({ sucesso: false, mensagem: 'Esta peca nao possui dados privados editaveis.' });
        return;
      }

      entidade.pontosVidaAtual = resultado.data.pontosVidaAtual;
      entidade.pontosVidaMaximo = resultado.data.pontosVidaMaximo;
      const entidadeComNovoTamanho = { ...entidade, tamanhoCriatura: resultado.data.tamanhoCriatura };
      if (entidade.presenteNoMapa !== false && !entidadePodeOcuparPosicao(entidadeComNovoTamanho, entidade.posicao, estado.mapaAtual, estado.entidades.filter((item) => item.presenteNoMapa !== false))) {
        responder({ sucesso: false, mensagem: 'A peca nao cabe nessa posicao com o tamanho selecionado. Reposicione-a primeiro.' });
        return;
      }

      entidade.classeArmadura = resultado.data.classeArmadura;
      entidade.deslocamento = resultado.data.deslocamento;
      entidade.tamanhoCriatura = resultado.data.tamanhoCriatura;
      entidade.movimentoGastoRodada = Math.min(entidade.movimentoGastoRodada ?? 0, resultado.data.deslocamento);
      entidade.nomeAtaque = resultado.data.nomeAtaque;
      entidade.bonusAtaque = resultado.data.bonusAtaque;
      entidade.danoAtaque = resultado.data.danoAtaque;

      responder({ sucesso: true });
      publicarEstado();
    });

    socket.on('combate:executar-acao', (dadosBrutos, responder) => {
      const resultado = esquemaAcaoVisual.safeParse(dadosBrutos);
      if (!resultado.success) return responder({ sucesso: false, mensagem: 'Acao visual invalida.' });

      const jogadorId = socket.data.jogadorId as string | undefined;
      if (!jogadorId) return responder({ sucesso: false, mensagem: 'Jogador nao identificado.' });
      if (resultado.data.codigoSessao !== estado.codigo) return responder({ sucesso: false, mensagem: 'Sessao invalida.' });

      const atacante = estado.entidades.find((item) => item.id === resultado.data.atacanteId);
      const alvo = estado.entidades.find((item) => item.id === resultado.data.alvoId);
      if (!atacante || atacante.controladorJogadorId !== jogadorId || atacante.tipo !== 'personagem') {
        return responder({ sucesso: false, mensagem: 'Voce nao controla a peca atacante.' });
      }
      if (atacante.presenteNoMapa === false) return responder({ sucesso: false, mensagem: 'Sua peca esta fora do grid.' });
      if (atacante.morto) return responder({ sucesso: false, mensagem: 'Uma peca marcada como morta nao pode atacar.' });
      if (!alvo || alvo.id === atacante.id || alvo.presenteNoMapa === false) return responder({ sucesso: false, mensagem: 'Selecione outro alvo presente no grid.' });

      const efeito = criarEfeitoVisual(resultado.data.tipo, atacante.id, alvo.id);
      const itemHistorico = adicionarItemHistorico(estado, {
        tipo: 'combate',
        mensagem: `${atacante.nome} usou ${nomeAcaoVisual(resultado.data.tipo)} em ${alvo.nome}.`
      });
      responder({ sucesso: true });
      publicarEfeitoVisual(efeito);
      publicarHistorico(itemHistorico);
      publicarEstado();
    });

    socket.on('combate:executar-acao-racial', (dadosBrutos, responder) => {
      const resultado = esquemaAcaoRacial.safeParse(dadosBrutos);
      if (!resultado.success) return responder({ sucesso: false, mensagem: 'Acao racial invalida.' });

      const jogadorId = socket.data.jogadorId as string | undefined;
      if (!jogadorId) return responder({ sucesso: false, mensagem: 'Jogador nao identificado.' });
      if (resultado.data.codigoSessao !== estado.codigo) return responder({ sucesso: false, mensagem: 'Sessao invalida.' });

      const jogador = estado.jogadores.find((item) => item.id === jogadorId);
      const entidade = estado.entidades.find((item) => item.id === resultado.data.entidadeId);
      if (!jogador || !entidade || entidade.controladorJogadorId !== jogadorId || entidade.tipo !== 'personagem') {
        return responder({ sucesso: false, mensagem: 'Voce nao controla a peca que executa a acao racial.' });
      }
      if (entidade.presenteNoMapa === false) return responder({ sucesso: false, mensagem: 'Sua peca esta fora do grid.' });
      if (entidade.morto) return responder({ sucesso: false, mensagem: 'Uma peca marcada como morta nao pode executar a acao racial.' });
      if (jogador.racaPersonagem !== 'draconato') return responder({ sucesso: false, mensagem: 'Essa acao racial pertence a Draconatos.' });

      const sopro = obterSoproDraconico(jogador.varianteRacialPersonagem, jogador.nivelPersonagem);
      if (!sopro) return responder({ sucesso: false, mensagem: 'Escolha um ancestral draconico valido antes de usar o sopro.' });

      const casas = calcularCasasSoproDraconico(
        jogador.varianteRacialPersonagem,
        jogador.nivelPersonagem,
        entidade.posicao,
        resultado.data.ponto,
        estado.mapaAtual
      );
      if (casas.length === 0) return responder({ sucesso: false, mensagem: 'Escolha uma direcao valida para o Sopro Draconico.' });

      const afetados = entidadesNasCasas(estado.entidades, casas).filter((item) => item.id !== entidade.id);
      const efeitoVisual: EfeitoVisualMagia = {
        id: randomUUID(),
        magiaId: 'acao-racial:sopro-draconico',
        nomeMagia: 'Sopro Dracônico',
        conjuradorId: entidade.id,
        casas,
        criadoEm: new Date().toISOString()
      };
      const itemHistorico = adicionarItemHistorico(estado, {
        tipo: 'combate',
        mensagem: `${entidade.nome} usou Sopro Dracônico (${sopro.ancestralNome}).`,
        detalhes: [
          `Tipo de dano: ${sopro.tipoDano}`,
          `Área: ${sopro.forma === 'linha' ? `linha de ${sopro.larguraMetros ?? 1.5} m por ${sopro.comprimentoMetros} m` : `cone de ${sopro.comprimentoMetros} m`}`,
          `Teste indicado: ${sopro.teste}`,
          `Dano de referência: ${sopro.dano}`,
          `Peças na área: ${afetados.length}${afetados.length ? ` (${afetados.map((item) => item.nome).join(', ')})` : ''}`
        ]
      });

      responder({ sucesso: true });
      publicarEfeitoMagia(efeitoVisual);
      publicarHistorico(itemHistorico);
      publicarEstado();
    });

    socket.on('combate:mestre-executar-acao', (dadosBrutos, responder) => {
      const resultado = esquemaAcaoVisual.safeParse(dadosBrutos);
      if (!resultado.success || socket.data.perfil !== 'mestre') {
        return responder({ sucesso: false, mensagem: 'Acao visual invalida.' });
      }
      if (resultado.data.codigoSessao !== estado.codigo) return responder({ sucesso: false, mensagem: 'Sessao invalida.' });

      const atacante = estado.entidades.find((item) => item.id === resultado.data.atacanteId);
      const alvo = estado.entidades.find((item) => item.id === resultado.data.alvoId);
      if (!atacante || !alvo || atacante.id === alvo.id || atacante.presenteNoMapa === false || alvo.presenteNoMapa === false) {
        return responder({ sucesso: false, mensagem: 'Selecione atacante e alvo diferentes e presentes no grid.' });
      }
      if (atacante.controladorJogadorId || (atacante.tipo !== 'npc' && atacante.tipo !== 'monstro')) {
        return responder({ sucesso: false, mensagem: 'O mestre executa ataques apenas de NPCs e monstros.' });
      }
      if (atacante.morto) return responder({ sucesso: false, mensagem: 'Uma peca marcada como morta nao pode atacar.' });

      const efeito = criarEfeitoVisual(resultado.data.tipo, atacante.id, alvo.id);
      const itemHistorico = adicionarItemHistorico(estado, {
        tipo: 'combate',
        mensagem: `${atacante.nome} usou ${nomeAcaoVisual(resultado.data.tipo)} em ${alvo.nome}.`
      });
      responder({ sucesso: true });
      publicarEfeitoVisual(efeito);
      publicarHistorico(itemHistorico);
      publicarEstado();
    });


    socket.on('magia:configurar-selecao', (dadosBrutos, responder) => {
      const resultado = esquemaConfiguracaoMagiasJogador.safeParse(dadosBrutos);
      if (!resultado.success) return responder({ sucesso: false, mensagem: 'Selecao de magias invalida.' });

      const jogadorId = socket.data.jogadorId as string | undefined;
      if (!jogadorId) return responder({ sucesso: false, mensagem: 'Jogador nao identificado.' });
      if (resultado.data.codigoSessao !== estado.codigo) return responder({ sucesso: false, mensagem: 'Sessao invalida.' });

      const jogador = estado.jogadores.find((item) => item.id === jogadorId);
      if (!jogador) return responder({ sucesso: false, mensagem: 'Jogador nao encontrado.' });

      const validacao = validarSelecaoMagiasPersonagem(
        jogador.classePersonagem,
        jogador.nivelPersonagem,
        jogador.racaPersonagem,
        resultado.data.magiasSelecionadasIds,
        jogador.varianteRacialPersonagem
      );
      if (!validacao.valido) return responder({ sucesso: false, mensagem: validacao.mensagem ?? 'Selecao de magias invalida.' });

      const magiaRacialEscolhidaId = resultado.data.magiaRacialEscolhidaId;
      if (jogador.varianteRacialPersonagem === 'alto-elfo' && magiaRacialEscolhidaId) {
        const racialValida = obterMagiasRaciaisDisponiveis(jogador.racaPersonagem, jogador.nivelPersonagem, jogador.varianteRacialPersonagem)
          .some((magia) => magia.id === magiaRacialEscolhidaId);
        if (!racialValida || !validacao.idsNormalizados.includes(magiaRacialEscolhidaId)) {
          return responder({ sucesso: false, mensagem: 'O truque racial do Alto Elfo precisa estar entre as magias selecionadas.' });
        }
        jogador.magiaRacialEscolhidaId = magiaRacialEscolhidaId;
      } else {
        delete jogador.magiaRacialEscolhidaId;
      }

      jogador.magiasSelecionadasIds = validacao.idsNormalizados;
      responder({ sucesso: true });
      publicarEstado();
    });

    socket.on('magia:conjurar', (dadosBrutos, responder) => {
      const resultado = esquemaConjuracaoMagia.safeParse(dadosBrutos);
      if (!resultado.success) return responder({ sucesso: false, mensagem: 'Conjuracao invalida.' });

      const jogadorId = socket.data.jogadorId as string | undefined;
      if (!jogadorId) return responder({ sucesso: false, mensagem: 'Jogador nao identificado.' });
      if (resultado.data.codigoSessao !== estado.codigo) return responder({ sucesso: false, mensagem: 'Sessao invalida.' });

      const jogador = estado.jogadores.find((item) => item.id === jogadorId);
      const conjurador = estado.entidades.find((item) => item.id === resultado.data.conjuradorId);
      const magia = obterMagiaPorId(resultado.data.magiaId);
      if (!jogador || !conjurador || conjurador.controladorJogadorId !== jogadorId || conjurador.morto) {
        return responder({ sucesso: false, mensagem: 'Voce nao controla o conjurador.' });
      }
      if (conjurador.presenteNoMapa === false) return responder({ sucesso: false, mensagem: 'Seu personagem esta fora do grid.' });
      if (!magia || !magiaEstaDisponivelParaPersonagem(magia.id, jogador.classePersonagem, jogador.nivelPersonagem, jogador.racaPersonagem, jogador.varianteRacialPersonagem)) {
        return responder({ sucesso: false, mensagem: 'Magia indisponivel para sua raça, classe ou nível.' });
      }
      if (!jogador.magiasSelecionadasIds.includes(magia.id)) {
        return responder({ sucesso: false, mensagem: 'Adicione essa magia às suas magias disponíveis antes de conjurá-la.' });
      }

      let ponto = resultado.data.ponto;
      let alvoDireto = resultado.data.alvoId ? estado.entidades.find((item) => item.id === resultado.data.alvoId) : undefined;
      if (alvoDireto?.presenteNoMapa === false) alvoDireto = undefined;
      if (magia.formaArea === 'alvo') {
        if (!alvoDireto) return responder({ sucesso: false, mensagem: 'Selecione um alvo valido.' });
        ponto = alvoDireto.posicao;
      }

      if (ponto && !pontoDentroDoAlcance(magia, conjurador.posicao, ponto)) {
        return responder({ sucesso: false, mensagem: 'O ponto escolhido esta fora do alcance da magia.' });
      }

      const pontoParaVisao = alvoDireto?.id === conjurador.id ? undefined : (alvoDireto?.posicao ?? ponto);
      if (pontoParaVisao && magiaExigeVisao(magia)) {
        const visibilidade = obterVisibilidadeCasa({
          mapa: estado.mapaAtual,
          casa: pontoParaVisao,
          entidades: estado.entidades.filter((entidade) => entidade.presenteNoMapa !== false),
          efeitos: estado.efeitosMagiaAtivos,
          fontes: estado.fontesLuzAtivas,
          observador: conjurador
        });
        if (visibilidade === 'escuro' || visibilidade === 'escuridao-magica') {
          return responder({ sucesso: false, mensagem: 'Esta magia exige que voce veja o alvo ou ponto escolhido, mas ele nao esta visivel para seu personagem.' });
        }
      }

      const casas = calcularCasasMagia(magia, conjurador.posicao, ponto, estado.mapaAtual);
      if (casas.length === 0) return responder({ sucesso: false, mensagem: 'Escolha uma area valida para a magia.' });

      const interacoesIluminacao: string[] = [];
      let magiaNeutralizadaPorIluminacao = false;
      if (magia.id === 'luz-do-dia') {
        const origem = ponto ?? conjurador.posicao;
        const escuridoes = estado.efeitosMagiaAtivos.filter((efeito) => efeito.magiaId === 'escuridao');
        for (const efeito of escuridoes) {
          if (efeito.casas.some((casa) => distanciaEmMetros(origem, casa) <= 36.001)) {
            removerEfeitoMagia(efeito.id, 'dissipada pela magia Luz do Dia');
            interacoesIluminacao.push('Escuridão mágica sobreposta foi dissipada por Luz do Dia.');
          }
        }
      }
      if (magia.id === 'escuridao') {
        const luzesDia = estado.efeitosMagiaAtivos.filter((efeito) => efeito.magiaId === 'luz-do-dia');
        const sobrepoeLuzDoDia = luzesDia.some((efeito) => {
          const fonte = fontesLuzCalculadas([], [efeito], estado.entidades)[0];
          return Boolean(fonte && casas.some((casa) => distanciaEmMetros(fonte.posicao, casa) <= fonte.raioLuzPlenaMetros + fonte.raioPenumbraAdicionalMetros + 0.001));
        });
        if (sobrepoeLuzDoDia) {
          magiaNeutralizadaPorIluminacao = true;
          interacoesIluminacao.push('A Escuridão foi imediatamente dissipada por uma área ativa de Luz do Dia.');
        } else {
          const luzesBaixoNivel = estado.efeitosMagiaAtivos.filter((efeito) => ['luz', 'globos-de-luz', 'criar-chamas', 'chama-continua'].includes(efeito.magiaId));
          for (const efeito of luzesBaixoNivel) {
            const fonte = fontesLuzCalculadas([], [efeito], estado.entidades)[0];
            if (fonte && casas.some((casa) => distanciaEmMetros(fonte.posicao, casa) <= fonte.raioLuzPlenaMetros + fonte.raioPenumbraAdicionalMetros + 0.001)) {
              removerEfeitoMagia(efeito.id, 'dissipada pela magia Escuridão');
              interacoesIluminacao.push(`${efeito.nomeMagia} foi dissipada pela Escuridão.`);
            }
          }
        }
      }

      const pecasNaArea = entidadesNasCasas(estado.entidades, casas);
      const outrosAfetados = pecasNaArea.filter((entidade) => entidade.id !== conjurador.id);
      const duracao = interpretarDuracaoMagia(magia);
      const vinculo: EfeitoMagiaAtivo['vinculo'] = magia.formaArea === 'alvo'
        ? 'alvo'
        : magia.formaArea === 'pessoal'
          ? 'pessoal'
          : 'area';
      const alvoIds = magia.formaArea === 'alvo' && alvoDireto
        ? [alvoDireto.id]
        : magia.formaArea === 'pessoal'
          ? [conjurador.id]
          : outrosAfetados.map((entidade) => entidade.id);

      const efeitoVisual: EfeitoVisualMagia = {
        id: randomUUID(),
        magiaId: magia.id,
        nomeMagia: magia.nome,
        conjuradorId: conjurador.id,
        casas,
        criadoEm: new Date().toISOString()
      };

      let efeitoAtivo: EfeitoMagiaAtivo | undefined;
      if (efeitoMagiaEhPersistente(magia) && !magiaNeutralizadaPorIluminacao) {
        if (duracao.concentracao) encerrarConcentracaoAnterior(conjurador.id);

        efeitoAtivo = {
          id: randomUUID(),
          magiaId: magia.id,
          nomeMagia: magia.nome,
          conjuradorId: conjurador.id,
          alvoIds,
          casas: casas.map((casa) => ({ ...casa })),
          ...(ponto ? { pontoOrigem: { ...ponto } } : { pontoOrigem: { ...conjurador.posicao } }),
          vinculo,
          duracaoTexto: magia.duracao,
          concentracao: duracao.concentracao,
          ...(duracao.segundosJogo !== undefined ? { segundosRestantes: duracao.segundosJogo } : {}),
          criadoEm: new Date().toISOString()
        };
        estado.efeitosMagiaAtivos.push(efeitoAtivo);
      }

      const destino = efeitoAtivo
        ? descreverDestinoMagia(efeitoAtivo)
        : magia.formaArea === 'alvo' && alvoDireto
          ? `${alvoDireto.nome} (${nomeCasa(alvoDireto.posicao)})`
          : ponto
            ? `casa ${nomeCasa(ponto)}`
            : `${conjurador.nome} (${nomeCasa(conjurador.posicao)})`;
      const nomesAfetados = outrosAfetados.map((entidade) => entidade.nome);
      const detalhes = [
        `Conjurador: ${conjurador.nome} (${nomeCasa(conjurador.posicao)})`,
        `Destino/origem do efeito: ${destino}`,
        `Área: ${descricaoAreaMagia(magia.formaArea, magia.tamanhoAreaMetros, magia.larguraMetros)} · ${casas.length} casa${casas.length === 1 ? '' : 's'}`,
        `Duração: ${magia.duracao}`,
        `Alcance: ${magia.alcanceTexto}${magiaExigeVisao(magia) ? ' · exige visão do alvo/ponto' : ''}`,
        ...(efeitoAtivo ? [`Tempo restante: ${formatarTempoJogo(efeitoAtivo.segundosRestantes)}`] : []),
        ...(duracao.concentracao ? ['Concentração: sim'] : []),
        ...interacoesIluminacao,
        `Peças presentes na área/alvo ao conjurar: ${nomesAfetados.length > 0 ? nomesAfetados.join(', ') : 'nenhuma'}`
      ];
      const itemHistorico = adicionarItemHistorico(estado, {
        tipo: 'magia',
        mensagem: `${conjurador.nome} conjurou ${magia.nome}.`,
        detalhes
      });

      responder({ sucesso: true });
      publicarEfeitoMagia(efeitoVisual);
      publicarHistorico(itemHistorico);
      publicarEstado();
    });

    socket.on('magia:encerrar-efeito', (dadosBrutos, responder) => {
      const resultado = esquemaEncerramentoEfeitoMagia.safeParse(dadosBrutos);
      if (!resultado.success || resultado.data.codigoSessao !== estado.codigo) {
        return responder({ sucesso: false, mensagem: 'Efeito invalido.' });
      }

      const efeito = estado.efeitosMagiaAtivos.find((item) => item.id === resultado.data.efeitoId);
      if (!efeito) return responder({ sucesso: false, mensagem: 'Efeito nao encontrado.' });

      const jogadorId = socket.data.jogadorId as string | undefined;
      const conjurador = estado.entidades.find((entidade) => entidade.id === efeito.conjuradorId);
      const jogadorPodeEncerrar = Boolean(jogadorId && conjurador?.controladorJogadorId === jogadorId);
      const mestrePodeEncerrar = socket.data.perfil === 'mestre';
      if (!jogadorPodeEncerrar && !mestrePodeEncerrar) {
        return responder({ sucesso: false, mensagem: 'Voce nao pode encerrar este efeito.' });
      }

      const responsavel = mestrePodeEncerrar
        ? 'Mestre'
        : estado.jogadores.find((jogador) => jogador.id === jogadorId)?.nome ?? 'Jogador';
      removerEfeitoMagia(efeito.id, efeito.concentracao ? 'concentração encerrada' : 'efeito encerrado manualmente', responsavel);
      responder({ sucesso: true });
      publicarEstado();
    });

    socket.on('sessao:mestre-avancar-rodada', (dadosBrutos, responder) => {
      const resultado = esquemaAvancoRodada.safeParse(dadosBrutos);
      if (!resultado.success || socket.data.perfil !== 'mestre' || resultado.data.codigoSessao !== estado.codigo) {
        return responder({ sucesso: false, mensagem: 'Nao foi possivel avancar a rodada.' });
      }

      estado.rodadaAtual += 1;
      for (const entidade of estado.entidades) entidade.movimentoGastoRodada = 0;
      const fontesAntes = [...estado.fontesLuzAtivas];
      estado.fontesLuzAtivas = reduzirFontesLuzUmaRodada(estado.fontesLuzAtivas);
      const tochasExpiradas = fontesAntes.filter((fonte) => !estado.fontesLuzAtivas.some((ativa) => ativa.id === fonte.id));
      for (const fonte of tochasExpiradas) {
        const entidade = estado.entidades.find((item) => item.id === fonte.entidadeId);
        const itemTocha = adicionarItemHistorico(estado, {
          tipo: 'sistema',
          mensagem: `A tocha de ${entidade?.nome ?? 'uma peca'} se apagou.`,
          detalhes: ['A duracao de 1 hora de jogo foi concluida.']
        });
        publicarHistorico(itemTocha);
      }
      estado.efeitosMagiaAtivos = estado.efeitosMagiaAtivos.map(reduzirUmaRodada);
      const expirados = estado.efeitosMagiaAtivos.filter((efeito) => efeito.segundosRestantes !== undefined && efeito.segundosRestantes <= 0);
      for (const efeito of expirados) removerEfeitoMagia(efeito.id, 'duração concluída');

      const itemRodada = adicionarItemHistorico(estado, {
        tipo: 'sistema',
        mensagem: `Rodada ${estado.rodadaAtual} iniciada.`,
        detalhes: [`Efeitos persistentes ativos: ${estado.efeitosMagiaAtivos.length}`, `Fontes de luz ativas: ${estado.fontesLuzAtivas.length}`]
      });
      responder({ sucesso: true });
      publicarHistorico(itemRodada);
      publicarEstado();
    });

    socket.on('mapa:mestre-definir-morte', (dadosBrutos, responder) => {
      const resultado = esquemaEstadoMorteEntidade.safeParse(dadosBrutos);
      if (!resultado.success || socket.data.perfil !== 'mestre') {
        return responder({ sucesso: false, mensagem: 'Alteracao de estado invalida.' });
      }
      if (resultado.data.codigoSessao !== estado.codigo) return responder({ sucesso: false, mensagem: 'Sessao invalida.' });

      const entidade = estado.entidades.find((item) => item.id === resultado.data.entidadeId);
      if (!entidade) return responder({ sucesso: false, mensagem: 'Peca nao encontrada.' });

      entidade.morto = resultado.data.morto;
      if (resultado.data.morto) {
        const concentracoes = estado.efeitosMagiaAtivos.filter((efeito) => efeito.conjuradorId === entidade.id && efeito.concentracao);
        for (const efeito of concentracoes) removerEfeitoMagia(efeito.id, 'conjurador marcado como morto');
      }
      const itemHistorico = adicionarItemHistorico(estado, {
        tipo: 'combate',
        mensagem: resultado.data.morto
          ? `${entidade.nome} foi marcado como morto.`
          : `${entidade.nome} voltou a ficar ativo no mapa.`
      });
      responder({ sucesso: true });
      publicarHistorico(itemHistorico);
      publicarEstado();
    });

    socket.on('mapa:mestre-definir-presenca-entidade', (dadosBrutos, responder) => {
      const resultado = esquemaPresencaEntidade.safeParse(dadosBrutos);
      if (!resultado.success || socket.data.perfil !== 'mestre') return responder({ sucesso: false, mensagem: 'Alteracao de presenca invalida.' });
      if (resultado.data.codigoSessao !== estado.codigo) return responder({ sucesso: false, mensagem: 'Sessao invalida.' });

      const entidade = estado.entidades.find((item) => item.id === resultado.data.entidadeId);
      if (!entidade) return responder({ sucesso: false, mensagem: 'Entidade nao encontrada.' });

      if (resultado.data.presenteNoMapa) {
        if (entidade.presenteNoMapa !== false) return responder({ sucesso: true, mensagem: 'A entidade ja esta no grid.' });
        const posicao = obterPosicaoLivreParaEntidade(entidade, entidade.posicao);
        if (!posicao) return responder({ sucesso: false, mensagem: 'O mapa nao possui espaco livre para esta entidade.' });
        entidade.posicao = posicao;
        entidade.presenteNoMapa = true;
        entidade.movimentoGastoRodada = 0;
      } else {
        if (entidade.presenteNoMapa === false) return responder({ sucesso: true, mensagem: 'A entidade ja esta fora do grid.' });
        entidade.presenteNoMapa = false;
        entidade.movimentoGastoRodada = 0;
        estado.fontesLuzAtivas = estado.fontesLuzAtivas.filter((fonte) => fonte.entidadeId !== entidade.id);
        estado.efeitosMagiaAtivos = estado.efeitosMagiaAtivos
          .filter((efeito) => efeito.conjuradorId !== entidade.id)
          .map((efeito) => ({ ...efeito, alvoIds: efeito.alvoIds.filter((id) => id !== entidade.id) }))
          .filter((efeito) => efeito.vinculo !== 'alvo' || efeito.alvoIds.length > 0);
      }

      const itemHistorico = adicionarItemHistorico(estado, {
        tipo: 'mapa',
        mensagem: resultado.data.presenteNoMapa
          ? `Mestre recolocou ${entidade.nome} no grid.`
          : `Mestre retirou ${entidade.nome} do grid e manteve a entidade na biblioteca da campanha.`
      });
      responder({ sucesso: true });
      publicarHistorico(itemHistorico);
      publicarEstado();
    });

    socket.on('mapa:mestre-remover-entidade', (dados, responder) => {
      if (socket.data.perfil !== 'mestre' || dados.codigoSessao !== estado.codigo) return responder({ sucesso: false, mensagem: 'Acao invalida.' });
      const indice = estado.entidades.findIndex((entidade) => entidade.id === dados.entidadeId);
      if (indice < 0) return responder({ sucesso: false, mensagem: 'Peca nao encontrada.' });
      const entidade = estado.entidades[indice];
      if (!entidade) return responder({ sucesso: false, mensagem: 'Peca nao encontrada.' });

      const jogadorVinculado = entidade.controladorJogadorId
        ? estado.jogadores.find((jogador) => jogador.id === entidade.controladorJogadorId)
        : undefined;
      if (jogadorVinculado?.conectado) {
        return responder({ sucesso: false, mensagem: 'Desconecte esse jogador antes de remover o personagem salvo da campanha.' });
      }

      estado.entidades.splice(indice, 1);
      estado.fontesLuzAtivas = estado.fontesLuzAtivas.filter((fonte) => fonte.entidadeId !== entidade.id);
      estado.efeitosMagiaAtivos = estado.efeitosMagiaAtivos
        .filter((efeito) => efeito.conjuradorId !== entidade.id)
        .map((efeito) => ({ ...efeito, alvoIds: efeito.alvoIds.filter((id) => id !== entidade.id) }))
        .filter((efeito) => efeito.vinculo !== 'alvo' || efeito.alvoIds.length > 0);

      if (jogadorVinculado) {
        estado.jogadores = estado.jogadores.filter((jogador) => jogador.id !== jogadorVinculado.id);
      }

      const itemHistorico = adicionarItemHistorico(estado, {
        tipo: 'mapa',
        mensagem: jogadorVinculado
          ? `Mestre excluiu o personagem salvo ${entidade.nome} da campanha.`
          : `Mestre excluiu ${entidade.nome} da campanha.`
      });
      responder({ sucesso: true });
      publicarHistorico(itemHistorico);
      publicarEstado();
    });

    socket.on('disconnect', () => {
      const jogadorId = socket.data.jogadorId as string | undefined;
      if (!jogadorId) return;
      const jogador = estado.jogadores.find((item) => item.id === jogadorId);
      if (!jogador || !jogador.conectado) return;

      jogador.conectado = false;
      const itemHistorico = adicionarItemHistorico(estado, { tipo: 'conexao', mensagem: `${jogador.nome} saiu da sessao.` });
      publicarHistorico(itemHistorico);
      publicarEstado();
    });
  });

  servidorHttp.listen(porta, '0.0.0.0', () => {
    const linksEntrada = obterLinksEntrada();
    console.log('');
    console.log('Mesa RPG - servidor local ativo');
    console.log(`Codigo da sessao: ${estado.codigo}`);
    console.log(`Local: http://localhost:${portaInterface}/mestre`);
    for (const link of linksEntrada) console.log(`Jogador: ${link}`);
    console.log('');
  });

  return servidorHttp;
}

const executadoDiretamente = (() => {
  const argumento = process.argv[1];
  if (!argumento) return false;
  try {
    return resolve(argumento) === fileURLToPath(import.meta.url);
  } catch {
    return false;
  }
})();

if (process.env.NODE_ENV !== 'test' && executadoDiretamente) iniciarServidorLocal();
