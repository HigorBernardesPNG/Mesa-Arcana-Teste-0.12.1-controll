import { type ChangeEvent, type FormEvent, useEffect, useMemo, useState } from 'react';
import {
  CLASSES_PERSONAGEM,
  RACAS_PERSONAGEM,
  obterVariantesRaciais,
  rotuloVarianteRacial,
  nomeRacaCompleto,
  obterSoproDraconico,
  calcularCasasSoproDraconico,
  METROS_POR_CASA,
  movimentoRestanteMetros,
  obterAlcanceVisaoEscuroRaca,
  fonteTochaDaEntidade,
  formatarTempoJogo,
  nomeNivelIluminacao,
  nomeTamanhoCriatura,
  calcularCasasMagia,
  entidadesNasCasas,
  obterMagiaPorId,
  magiaExigeVisao,
  obterVisibilidadeCasa,
  pontoDentroDoAlcance,
  type ClassePersonagem,
  type RacaPersonagem,
  type VarianteRacialPersonagem,
  type EfeitoVisualCombate,
  type EfeitoVisualMagia,
  type EntidadeMapaJogador,
  type EstadoSessaoJogador,
  type PosicaoMapa,
  type TipoAcaoVisual
} from '@mesa-rpg/dominio';
import { ControlesZoom } from '../componentes/ControlesZoom';
import { DivisorLayout } from '../componentes/DivisorLayout';
import { GradeMesa } from '../componentes/GradeMesa';
import { Historico } from '../componentes/Historico';
import { PainelAcoesVisuais } from '../componentes/PainelAcoesVisuais';
import { PainelMagias } from '../componentes/PainelMagias';
import { PainelEfeitosAtivos } from '../componentes/PainelEfeitosAtivos';
import { socket } from '../comunicacao/socket';
import { processarImagem } from '../utilitarios/processarImagem';
import { useLayoutRedimensionavel } from '../funcionalidades/useLayoutRedimensionavel';
import type { ResumoPersonagemSalvo } from '@mesa-rpg/protocolo';

export function PaginaEntrar(): React.JSX.Element {
  const parametros = new URLSearchParams(window.location.search);
  const [codigoSessao, setCodigoSessao] = useState(parametros.get('codigo') ?? '');
  const [nomeJogador, setNomeJogador] = useState('');
  const [personagemSalvoId, setPersonagemSalvoId] = useState('');
  const [personagensSalvos, setPersonagensSalvos] = useState<ResumoPersonagemSalvo[]>([]);
  const [carregandoPersonagensSalvos, setCarregandoPersonagensSalvos] = useState(false);
  const [classePersonagem, setClassePersonagem] = useState<ClassePersonagem>('guerreiro');
  const [racaPersonagem, setRacaPersonagem] = useState<RacaPersonagem>('humano');
  const [varianteRacialPersonagem, setVarianteRacialPersonagem] = useState<VarianteRacialPersonagem | undefined>();
  const [nivelPersonagem, setNivelPersonagem] = useState(1);
  const [imagemToken, setImagemToken] = useState<string | undefined>();
  const [jogadorId, setJogadorId] = useState<string | null>(null);
  const [estado, setEstado] = useState<EstadoSessaoJogador | null>(null);
  const [entidadeSelecionadaId, setEntidadeSelecionadaId] = useState<string | null>(null);
  const [mensagemErro, setMensagemErro] = useState<string | null>(null);
  const [zoom, setZoom] = useState(1);
  const [efeitosVisuais, setEfeitosVisuais] = useState<EfeitoVisualCombate[]>([]);
  const [efeitosMagia, setEfeitosMagia] = useState<EfeitoVisualMagia[]>([]);
  const [magiaSelecionadaId, setMagiaSelecionadaId] = useState<string | undefined>();
  const [pontoMagia, setPontoMagia] = useState<PosicaoMapa | undefined>();
  const [soproSelecionado, setSoproSelecionado] = useState(false);
  const [pontoSopro, setPontoSopro] = useState<PosicaoMapa | undefined>();
  const [deslocamentoRascunho, setDeslocamentoRascunho] = useState(9);
  const layout = useLayoutRedimensionavel('mesa-arcana-layout-jogador-v2');
  const [abaPainelJogador, setAbaPainelJogador] = useState<'acoes' | 'magias'>('magias');

  useEffect(() => {
    const atualizar = (novoEstado: EstadoSessaoJogador): void => setEstado({ ...novoEstado });
    const receberEfeito = (efeito: EfeitoVisualCombate): void => {
      setEfeitosVisuais((atuais) => [...atuais.filter((item) => item.id !== efeito.id), efeito]);
      window.setTimeout(() => setEfeitosVisuais((atuais) => atuais.filter((item) => item.id !== efeito.id)), 1200);
    };
    const receberMagia = (efeito: EfeitoVisualMagia): void => {
      setEfeitosMagia((atuais) => [...atuais.filter((item) => item.id !== efeito.id), efeito]);
      window.setTimeout(() => setEfeitosMagia((atuais) => atuais.filter((item) => item.id !== efeito.id)), 1500);
    };
    socket.on('sessao:estado-jogador-atualizado', atualizar);
    socket.on('combate:efeito-visual', receberEfeito);
    socket.on('magia:efeito-visual', receberMagia);
    return () => {
      socket.off('sessao:estado-jogador-atualizado', atualizar);
      socket.off('combate:efeito-visual', receberEfeito);
      socket.off('magia:efeito-visual', receberMagia);
    };
  }, []);

  useEffect(() => {
    if (jogadorId) return;
    const codigo = codigoSessao.trim().toUpperCase();
    if (codigo.length < 4) {
      setPersonagensSalvos([]);
      setPersonagemSalvoId('');
      return;
    }

    setCarregandoPersonagensSalvos(true);
    const temporizador = window.setTimeout(() => {
      socket.emit('sessao:listar-personagens-salvos', codigo, (resposta) => {
        setCarregandoPersonagensSalvos(false);
        if (!resposta.sucesso) {
          setPersonagensSalvos([]);
          setPersonagemSalvoId('');
          return;
        }
        setPersonagensSalvos(resposta.personagens);
        setPersonagemSalvoId((atual) => resposta.personagens.some((personagem) => personagem.jogadorId === atual && !personagem.conectado) ? atual : '');
      });
    }, 250);
    return () => window.clearTimeout(temporizador);
  }, [codigoSessao, jogadorId]);

  const personagemSalvoSelecionado = useMemo(
    () => personagensSalvos.find((personagem) => personagem.jogadorId === personagemSalvoId),
    [personagensSalvos, personagemSalvoId]
  );

  function selecionarPersonagemSalvo(id: string): void {
    setPersonagemSalvoId(id);
    const personagem = personagensSalvos.find((item) => item.jogadorId === id);
    if (!personagem) {
      setNomeJogador('');
      setClassePersonagem('guerreiro');
      setNivelPersonagem(1);
      setRacaPersonagem('humano');
      setVarianteRacialPersonagem(undefined);
      setImagemToken(undefined);
      setMensagemErro(null);
      return;
    }
    setNomeJogador(personagem.nome);
    setClassePersonagem(personagem.classePersonagem);
    setNivelPersonagem(personagem.nivelPersonagem);
    setRacaPersonagem(personagem.racaPersonagem);
    setVarianteRacialPersonagem(personagem.varianteRacialPersonagem);
    setImagemToken(personagem.imagemToken);
    setMensagemErro(null);
  }

  const minhaPeca = useMemo(
    () => estado?.entidades.find((entidade) => entidade.controladorJogadorId === jogadorId),
    [estado, jogadorId]
  );
  const meuPerfil = useMemo(
    () => estado?.jogadores.find((jogador) => jogador.id === jogadorId),
    [estado, jogadorId]
  );
  useEffect(() => {
    if (minhaPeca?.deslocamento !== undefined) setDeslocamentoRascunho(minhaPeca.deslocamento);
  }, [minhaPeca?.deslocamento]);
  const variantesRacaSelecionada = useMemo(() => obterVariantesRaciais(racaPersonagem), [racaPersonagem]);
  const alvo: EntidadeMapaJogador | undefined = estado?.entidades.find((entidade) => entidade.id === entidadeSelecionadaId);
  const magiaSelecionada = magiaSelecionadaId ? obterMagiaPorId(magiaSelecionadaId) : undefined;
  const tochaAtiva = estado && minhaPeca ? fonteTochaDaEntidade(estado.fontesLuzAtivas, minhaPeca.id) : undefined;
  const soproDraconico = meuPerfil ? obterSoproDraconico(meuPerfil.varianteRacialPersonagem, meuPerfil.nivelPersonagem) : undefined;
  const alcanceVisaoEscuro = Math.max(
    meuPerfil ? obterAlcanceVisaoEscuroRaca(meuPerfil.racaPersonagem, meuPerfil.varianteRacialPersonagem) : 0,
    estado && minhaPeca && estado.efeitosMagiaAtivos.some((efeito) => efeito.magiaId === 'visao-no-escuro' && efeito.alvoIds.includes(minhaPeca.id)) ? 18 : 0
  );

  const magiaExigePonto = Boolean(
    magiaSelecionada && ['esfera', 'cubo', 'cilindro', 'cone', 'linha'].includes(magiaSelecionada.formaArea)
  );

  const casasMagia = useMemo(() => {
    if (!estado || !minhaPeca || !magiaSelecionada) return [];
    if (magiaSelecionada.formaArea === 'alvo') return alvo ? [alvo.posicao] : [];
    return calcularCasasMagia(magiaSelecionada, minhaPeca.posicao, pontoMagia, estado.mapaAtual);
  }, [estado, minhaPeca, magiaSelecionada, alvo, pontoMagia]);

  const casasSopro = useMemo(() => {
    if (!estado || !minhaPeca || !meuPerfil || !soproSelecionado) return [];
    return calcularCasasSoproDraconico(
      meuPerfil.varianteRacialPersonagem,
      meuPerfil.nivelPersonagem,
      minhaPeca.posicao,
      pontoSopro,
      estado.mapaAtual
    );
  }, [estado, minhaPeca, meuPerfil, soproSelecionado, pontoSopro]);

  const casasDestaque = soproSelecionado ? casasSopro : casasMagia;

  const quantidadeAfetados = useMemo(() => {
    if (!estado || !minhaPeca) return 0;
    return entidadesNasCasas(estado.entidades, casasMagia).filter((entidade) => entidade.id !== minhaPeca.id).length;
  }, [estado, minhaPeca, casasMagia]);

  function casaVisivelParaMagia(casa: PosicaoMapa): boolean {
    if (!estado || !minhaPeca || !magiaSelecionada || !magiaExigeVisao(magiaSelecionada)) return true;
    if (casa.coluna === minhaPeca.posicao.coluna && casa.linha === minhaPeca.posicao.linha) return true;
    const visibilidade = obterVisibilidadeCasa({
      mapa: estado.mapaAtual,
      casa,
      entidades: estado.entidades,
      efeitos: estado.efeitosMagiaAtivos,
      fontes: estado.fontesLuzAtivas,
      observador: minhaPeca
    });
    return visibilidade !== 'escuro' && visibilidade !== 'escuridao-magica';
  }

  const motivoBloqueioMagia = useMemo(() => {
    if (!estado || !minhaPeca || !magiaSelecionada) return undefined;
    if (minhaPeca.morto) return 'Uma peça marcada como morta não pode conjurar.';

    if (magiaSelecionada.formaArea === 'alvo') {
      if (!alvo) return 'Selecione um alvo.';
      if (!pontoDentroDoAlcance(magiaSelecionada, minhaPeca.posicao, alvo.posicao)) return 'O alvo está fora do alcance da magia.';
      if (alvo.id !== minhaPeca.id && magiaExigeVisao(magiaSelecionada) && !casaVisivelParaMagia(alvo.posicao)) {
        return 'Essa magia exige visão, mas o alvo não está visível para seu personagem.';
      }
      return undefined;
    }

    if (magiaSelecionada.formaArea === 'aura' || magiaSelecionada.formaArea === 'pessoal') return undefined;
    if (!pontoMagia) return 'Escolha um ponto no grid.';
    if (!pontoDentroDoAlcance(magiaSelecionada, minhaPeca.posicao, pontoMagia)) return 'O ponto está fora do alcance da magia.';
    if (magiaExigeVisao(magiaSelecionada) && !casaVisivelParaMagia(pontoMagia)) {
      return 'Essa magia exige visão, mas o ponto escolhido não está visível para seu personagem.';
    }
    return undefined;
  }, [estado, minhaPeca, magiaSelecionada, alvo, pontoMagia]);

  const podeConjurar = Boolean(magiaSelecionada && !motivoBloqueioMagia);

  async function escolherToken(evento: ChangeEvent<HTMLInputElement>): Promise<void> {
    const arquivo = evento.target.files?.[0];
    if (!arquivo) return;
    try {
      setImagemToken(await processarImagem(arquivo, 512, 0.9));
      setMensagemErro(null);
    } catch (falha) {
      setMensagemErro(falha instanceof Error ? falha.message : 'Não foi possível ler a imagem.');
    }
  }

  function entrar(evento: FormEvent): void {
    evento.preventDefault();
    setMensagemErro(null);
    socket.emit('sessao:entrar', {
      codigoSessao,
      ...(personagemSalvoId ? { personagemSalvoId } : {}),
      nomeJogador,
      classePersonagem,
      nivelPersonagem,
      racaPersonagem,
      ...(varianteRacialPersonagem ? { varianteRacialPersonagem } : {}),
      ...(imagemToken ? { imagemToken } : {})
    }, (resposta) => {
      if (!resposta.sucesso || !resposta.estado || !resposta.jogadorId) {
        setMensagemErro(resposta.mensagem ?? 'Não foi possível entrar na sessão.');
        return;
      }
      setJogadorId(resposta.jogadorId);
      setEstado(resposta.estado);
    });
  }

  function moverMinhaPeca(entidadeId: string, coluna: number, linha: number): void {
    if (!estado || magiaExigePonto || soproSelecionado) return;
    socket.emit('mapa:mover-entidade', { codigoSessao: estado.codigo, entidadeId, coluna, linha }, (resposta) => {
      setMensagemErro(resposta.sucesso ? null : resposta.mensagem ?? 'Movimento não realizado.');
    });
  }

  function selecionarAlvoJogador(entidadeId: string): void {
    if (!minhaPeca) return;
    if (entidadeId === minhaPeca.id) {
      if (magiaSelecionada?.formaArea === 'alvo') setEntidadeSelecionadaId(entidadeId);
      else setEntidadeSelecionadaId(null);
      return;
    }
    setEntidadeSelecionadaId(entidadeId);
    setMensagemErro(null);
  }

  function executarAcaoVisual(tipo: TipoAcaoVisual): void {
    if (!estado || !minhaPeca || !alvo || alvo.id === minhaPeca.id) return;
    socket.emit('combate:executar-acao', {
      codigoSessao: estado.codigo,
      atacanteId: minhaPeca.id,
      alvoId: alvo.id,
      tipo
    }, (resposta) => setMensagemErro(resposta.sucesso ? null : resposta.mensagem ?? 'Não foi possível executar a ação visual.'));
  }

  function selecionarMagia(magia: NonNullable<typeof magiaSelecionada>): void {
    setSoproSelecionado(false);
    setPontoSopro(undefined);
    setMagiaSelecionadaId(magia.id);
    setPontoMagia(undefined);
    if (magia.formaArea !== 'alvo') setEntidadeSelecionadaId(null);
    setMensagemErro(null);
  }

  function selecionarPontoMagia(coluna: number, linha: number): void {
    if (!minhaPeca || !magiaSelecionada) return;
    const ponto = { coluna, linha };
    if (!pontoDentroDoAlcance(magiaSelecionada, minhaPeca.posicao, ponto)) {
      setMensagemErro('Esse ponto está fora do alcance da magia.');
      return;
    }
    if (magiaExigeVisao(magiaSelecionada) && !casaVisivelParaMagia(ponto)) {
      setMensagemErro('Essa magia exige visão, mas esse ponto não está visível para seu personagem.');
      return;
    }
    setPontoMagia(ponto);
    setMensagemErro(null);
  }

  function cancelarMagia(): void {
    setMagiaSelecionadaId(undefined);
    setPontoMagia(undefined);
  }

  function conjurarMagia(): void {
    if (!estado || !minhaPeca || !magiaSelecionada || !podeConjurar) return;
    socket.emit('magia:conjurar', {
      codigoSessao: estado.codigo,
      conjuradorId: minhaPeca.id,
      magiaId: magiaSelecionada.id,
      ...(magiaSelecionada.formaArea === 'alvo' && alvo ? { alvoId: alvo.id } : {}),
      ...(pontoMagia ? { ponto: pontoMagia } : {})
    }, (resposta) => {
      setMensagemErro(resposta.sucesso ? null : resposta.mensagem ?? 'Não foi possível conjurar a magia.');
      if (resposta.sucesso) setPontoMagia(undefined);
    });
  }

  function prepararSoproDraconico(): void {
    if (!soproDraconico || !minhaPeca) return;
    cancelarMagia();
    setEntidadeSelecionadaId(null);
    setSoproSelecionado(true);
    setPontoSopro(undefined);
    setMensagemErro(null);
  }

  function selecionarPontoSopro(coluna: number, linha: number): void {
    if (!minhaPeca || !soproSelecionado) return;
    if (minhaPeca.posicao.coluna === coluna && minhaPeca.posicao.linha === linha) {
      setMensagemErro('Escolha uma casa na direção em que o sopro será lançado.');
      return;
    }
    setPontoSopro({ coluna, linha });
    setMensagemErro(null);
  }

  function executarSoproDraconico(): void {
    if (!estado || !minhaPeca || !pontoSopro || !soproDraconico) return;
    socket.emit('combate:executar-acao-racial', {
      codigoSessao: estado.codigo,
      entidadeId: minhaPeca.id,
      tipo: 'sopro-draconico',
      ponto: pontoSopro
    }, (resposta) => {
      if (!resposta.sucesso) {
        setMensagemErro(resposta.mensagem ?? 'Não foi possível executar o Sopro Dracônico.');
        return;
      }
      setSoproSelecionado(false);
      setPontoSopro(undefined);
      setMensagemErro(null);
    });
  }

  function cancelarSoproDraconico(): void {
    setSoproSelecionado(false);
    setPontoSopro(undefined);
    setMensagemErro(null);
  }

  function selecionarCasaEspecial(coluna: number, linha: number): void {
    if (soproSelecionado) selecionarPontoSopro(coluna, linha);
    else selecionarPontoMagia(coluna, linha);
  }

  function alterarMagiasSelecionadas(ids: string[], magiaRacialEscolhidaId?: string): void {
    if (!estado) return;
    socket.emit('magia:configurar-selecao', { codigoSessao: estado.codigo, magiasSelecionadasIds: ids, ...(magiaRacialEscolhidaId ? { magiaRacialEscolhidaId } : {}) }, (resposta) => {
      if (!resposta.sucesso) {
        setMensagemErro(resposta.mensagem ?? 'Não foi possível salvar a seleção de magias.');
        return;
      }
      if (magiaSelecionadaId && !ids.includes(magiaSelecionadaId)) cancelarMagia();
      setMensagemErro(null);
    });
  }

  function salvarDeslocamentoEfetivo(valor = deslocamentoRascunho): void {
    if (!estado || !minhaPeca) return;
    const normalizado = Math.max(0, Math.round(valor / METROS_POR_CASA) * METROS_POR_CASA);
    setDeslocamentoRascunho(normalizado);
    socket.emit('personagem:configurar-deslocamento', {
      codigoSessao: estado.codigo,
      entidadeId: minhaPeca.id,
      deslocamentoEfetivo: normalizado
    }, (resposta) => {
      setMensagemErro(resposta.sucesso ? null : resposta.mensagem ?? 'Não foi possível alterar o deslocamento.');
    });
  }

  function alternarTocha(ativa: boolean): void {
    if (!estado || !minhaPeca) return;
    socket.emit('iluminacao:alternar-tocha', { codigoSessao: estado.codigo, entidadeId: minhaPeca.id, ativa }, (resposta) => {
      setMensagemErro(resposta.sucesso ? null : resposta.mensagem ?? 'Não foi possível alterar a tocha.');
    });
  }

  function encerrarEfeitoMagia(efeitoId: string): void {
    if (!estado) return;
    socket.emit('magia:encerrar-efeito', { codigoSessao: estado.codigo, efeitoId }, (resposta) => {
      setMensagemErro(resposta.sucesso ? null : resposta.mensagem ?? 'Não foi possível encerrar o efeito.');
    });
  }

  if (!estado || !jogadorId) {
    return (
      <main className="pagina-centralizada pagina-entrada-arcana">
        <div className="entrada-atmosfera" aria-hidden="true" />
        <form className="cartao-inicial formulario-entrada cartao-entrada-arcana" onSubmit={entrar}>
          <div className="marca marca-entrada"><span className="marca-simbolo marca-simbolo-grande" aria-hidden="true">✦</span>Mesa Arcana</div>
          <p className="titulo-entrada-sessao">Entre em uma sessão de RPG</p>
          <p className="subtitulo">Use o código enviado pelo Mestre. A configuração abaixo serve somente para a representação visual do seu personagem na mesa.</p>
          <div className="aviso-entrada-link"><span aria-hidden="true">⌁</span><div><b>Recebeu um link ou QR Code?</b><small>O código da sessão já pode vir preenchido automaticamente.</small></div></div>
          <label>Código da sessão<input value={codigoSessao} onChange={(e) => setCodigoSessao(e.target.value.toUpperCase())} placeholder="Ex.: ABC123" /></label>

          {carregandoPersonagensSalvos ? <small className="texto-secundario">Procurando personagens salvos...</small> : null}
          {personagensSalvos.length > 0 ? (
            <label>Personagem da campanha
              <select value={personagemSalvoId} onChange={(e) => selecionarPersonagemSalvo(e.target.value)}>
                <option value="">Criar novo personagem</option>
                {personagensSalvos.map((personagem) => (
                  <option key={personagem.jogadorId} value={personagem.jogadorId} disabled={personagem.conectado}>
                    {personagem.nome} · {nomeRacaCompleto(personagem.racaPersonagem, personagem.varianteRacialPersonagem)} · {CLASSES_PERSONAGEM.find((classe) => classe.id === personagem.classePersonagem)?.nome ?? personagem.classePersonagem} · Nv {personagem.nivelPersonagem}{personagem.conectado ? ' · em uso' : ''}
                  </option>
                ))}
              </select>
            </label>
          ) : null}

          {personagemSalvoSelecionado ? (
            <div className="cartao-personagem-salvo">
              <div className="avatar-personagem-salvo" style={personagemSalvoSelecionado.imagemToken ? { backgroundImage: `url(${personagemSalvoSelecionado.imagemToken})` } : undefined}>
                {personagemSalvoSelecionado.imagemToken ? '' : personagemSalvoSelecionado.nome.slice(0, 1).toUpperCase()}
              </div>
              <div>
                <strong>{personagemSalvoSelecionado.nome}</strong>
                <small>{nomeRacaCompleto(personagemSalvoSelecionado.racaPersonagem, personagemSalvoSelecionado.varianteRacialPersonagem)} · {CLASSES_PERSONAGEM.find((classe) => classe.id === personagemSalvoSelecionado.classePersonagem)?.nome ?? personagemSalvoSelecionado.classePersonagem} · Nível {personagemSalvoSelecionado.nivelPersonagem}</small>
                <small>Token, magias e configurações serão recuperados da campanha.</small>
              </div>
            </div>
          ) : (
            <>
              <label>Seu nome<input value={nomeJogador} onChange={(e) => setNomeJogador(e.target.value)} placeholder="Ex.: Higor" /></label>
              <div className="separador-formulario"><span>Representação do personagem</span></div>
              <div className="tres-colunas-formulario">
                <label>Raça
                  <select value={racaPersonagem} onChange={(e) => {
                    const novaRaca = e.target.value as RacaPersonagem;
                    setRacaPersonagem(novaRaca);
                    setVarianteRacialPersonagem(obterVariantesRaciais(novaRaca)[0]?.id);
                  }}>
                    {RACAS_PERSONAGEM.map((raca) => <option key={raca.id} value={raca.id}>{raca.nome}</option>)}
                  </select>
                </label>
                <label>Classe
                  <select value={classePersonagem} onChange={(e) => setClassePersonagem(e.target.value as ClassePersonagem)}>
                    {CLASSES_PERSONAGEM.map((classe) => <option key={classe.id} value={classe.id}>{classe.nome}</option>)}
                  </select>
                </label>
                <label>Nível<input type="number" min="1" max="20" value={nivelPersonagem} onChange={(e) => setNivelPersonagem(Math.max(1, Math.min(20, Number(e.target.value))))} /></label>
              </div>
              {variantesRacaSelecionada.length > 0 ? (
                <label>{rotuloVarianteRacial(racaPersonagem) ?? 'Variação racial'}
                  <select value={varianteRacialPersonagem ?? ''} onChange={(e) => setVarianteRacialPersonagem(e.target.value as VarianteRacialPersonagem)}>
                    {variantesRacaSelecionada.map((variante) => <option key={variante.id} value={variante.id}>{variante.nome}</option>)}
                  </select>
                </label>
              ) : null}
              <label className="botao-arquivo">Imagem do personagem (opcional)<input accept="image/*" type="file" onChange={escolherToken} /></label>
              {imagemToken ? <img className="preview-token preview-token-jogador" src={imagemToken} alt="Prévia da peça" /> : null}
            </>
          )}
          {mensagemErro ? <p className="aviso-erro">{mensagemErro}</p> : null}
          <button className="botao-principal" type="submit">Entrar</button>
        </form>
      </main>
    );
  }

  return (
    <main className="aplicacao aplicacao-jogador">
      <header className="barra-superior">
        <strong className="marca-menor"><span className="marca-simbolo" aria-hidden="true">✦</span>Mesa Arcana</strong>
        <span className="identidade-sessao">Sessão: <b>{estado.nomeCampanha}</b></span>
        <span className="espacador" />
        <button className="botao-layout" onClick={layout.restaurar} title="Restaurar proporções do layout" type="button">↺ Layout</button>
        <span className="selo-cabecalho">Jogador: <b>{nomeJogador}</b></span>
      </header>

      {mensagemErro ? <div className="aviso-erro">{mensagemErro}</div> : null}

      <div className="corpo-mesa-redimensionavel" style={layout.estilo}>
      <div className="layout-jogador">
        <aside className="painel lateral painel-jogador-simples">
          <div className="avatar-jogador" style={minhaPeca?.imagemToken ? { backgroundImage: `url(${minhaPeca.imagemToken})` } : undefined}>
            {minhaPeca?.imagemToken ? '' : nomeJogador.slice(0, 1).toUpperCase()}
          </div>
          <h2>{nomeJogador}</h2>
          <small>{meuPerfil ? nomeRacaCompleto(meuPerfil.racaPersonagem, meuPerfil.varianteRacialPersonagem) : 'Raça'} · {CLASSES_PERSONAGEM.find((item) => item.id === meuPerfil?.classePersonagem)?.nome ?? 'Classe'} · Nível {meuPerfil?.nivelPersonagem ?? 1}</small>
          <div className="linha-dado"><span>Posição</span><b>{minhaPeca ? `${minhaPeca.posicao.coluna},${minhaPeca.posicao.linha}` : '--'}</b></div>
          <div className="linha-dado"><span>Tamanho</span><b>{minhaPeca ? nomeTamanhoCriatura(minhaPeca.tamanhoCriatura) : '--'}</b></div>
          <div className="linha-dado"><span>Movimento</span><b>{minhaPeca ? `${movimentoRestanteMetros(minhaPeca)} / ${minhaPeca.deslocamento ?? 0} m` : '--'}</b></div>
          {minhaPeca ? (
            <div className="controle-deslocamento-jogador">
              <div className="controle-deslocamento-cabecalho">
                <span>Deslocamento efetivo</span>
                <small>Base racial: {minhaPeca.deslocamentoBase ?? minhaPeca.deslocamento ?? 0} m</small>
              </div>
              <div className="controle-deslocamento-acoes">
                <input
                  aria-label="Deslocamento efetivo em metros"
                  min="0"
                  max="300"
                  step={METROS_POR_CASA}
                  type="number"
                  value={deslocamentoRascunho}
                  onChange={(evento) => setDeslocamentoRascunho(Number(evento.target.value))}
                />
                <button onClick={() => salvarDeslocamentoEfetivo()} type="button">Aplicar</button>
                <button
                  className="botao-secundario-compacto"
                  onClick={() => salvarDeslocamentoEfetivo(minhaPeca.deslocamentoBase ?? minhaPeca.deslocamento ?? 0)}
                  type="button"
                >Padrão</button>
              </div>
              <small>Use para armadura, condições, classe ou outros modificadores da mesa.</small>
            </div>
          ) : null}
          <div className="linha-dado"><span>Visão no escuro</span><b>{alcanceVisaoEscuro > 0 ? `${alcanceVisaoEscuro} m` : 'Não possui'}</b></div>
          {soproDraconico ? <>
            <div className="linha-dado"><span>Ancestral</span><b>{soproDraconico.ancestralNome}</b></div>
            <div className="linha-dado"><span>Resistência</span><b>{soproDraconico.tipoDano}</b></div>
          </> : null}
          <div className="linha-dado"><span>Ambiente</span><b>{nomeNivelIluminacao(estado.mapaAtual.iluminacaoAmbiente)}</b></div>
          <div className="controle-tocha-jogador">
            <button className={`botao-tocha ${tochaAtiva ? 'botao-tocha-acesa' : ''}`} onClick={() => alternarTocha(!tochaAtiva)} type="button">
              {tochaAtiva ? '🔥 Apagar tocha' : '🔥 Acender tocha'}
            </button>
            {tochaAtiva ? <small>Tempo restante: {formatarTempoJogo(tochaAtiva.segundosRestantes)}</small> : null}
          </div>
          <small className="texto-escala-grid">1 casa = {METROS_POR_CASA.toLocaleString('pt-BR')} m</small>
          <p className="texto-secundario">As casas em verde mostram até onde sua peça ainda pode se mover nesta rodada. Ao selecionar uma magia de área, o clique passa a posicionar o efeito.</p>
          <small>A plataforma continua visual; ficha, espaços de magia e rolagens permanecem fora dela.</small>
          <PainelEfeitosAtivos
            efeitos={estado.efeitosMagiaAtivos}
            entidades={estado.entidades}
            rodadaAtual={estado.rodadaAtual}
            perfil="jogador"
            entidadeJogadorId={minhaPeca?.id}
            aoEncerrar={encerrarEfeitoMagia}
          />
        </aside>

        <DivisorLayout direcao="vertical" titulo="Redimensionar painel esquerdo" aoIniciar={(evento) => layout.iniciar('esquerda', evento)} />

        <section className="centro-mesa">
          {soproSelecionado ? <div className="barra-ferramentas barra-magia">Clique no grid para direcionar o Sopro Dracônico.</div> : magiaExigePonto ? <div className="barra-ferramentas barra-magia">Clique no grid para posicionar {magiaSelecionada?.nome}.</div> : null}
          <div className="nome-mapa-flutuante">{estado.mapaAtual.nome}</div>
          <ControlesZoom zoom={zoom} aoAlterar={setZoom} />
          <GradeMesa
            aoMover={moverMinhaPeca}
            aoSelecionarCasa={selecionarCasaEspecial}
            aoSelecionarEntidade={selecionarAlvoJogador}
            casasDestaque={casasDestaque}
            entidadeSelecionadaId={entidadeSelecionadaId}
            entidades={estado.entidades}
            efeitosMagia={efeitosMagia}
            efeitosMagiaAtivos={estado.efeitosMagiaAtivos}
            fontesLuzAtivas={estado.fontesLuzAtivas}
            efeitosVisuais={efeitosVisuais}
            jogadorId={jogadorId}
            mapa={estado.mapaAtual}
            modoSelecaoCasa={magiaExigePonto || soproSelecionado}
            perfil="jogador"
            zoom={zoom}
          />
        </section>

        <DivisorLayout direcao="vertical" titulo="Redimensionar painel direito" aoIniciar={(evento) => layout.iniciar('direita', evento)} />

        <aside className="painel lateral-direita">
          <h2>Alvo selecionado</h2>
          {alvo ? (
            <>
              <div className="cartao-entidade">
                <span className="retrato-entidade" style={alvo.imagemToken ? { backgroundImage: `url(${alvo.imagemToken})` } : undefined}>{alvo.imagemToken ? '' : alvo.nome.slice(0, 1)}</span>
                <div><strong>{alvo.nome}</strong><small>{alvo.tipo}</small></div>
              </div>
              <div className="linha-dado"><span>Posição</span><b>{alvo.posicao.coluna},{alvo.posicao.linha}</b></div>
              {alvo.tipo === 'monstro' ? <p className="texto-secundario">O estado exato do monstro permanece sob controle do mestre.</p> : null}
            </>
          ) : <p className="texto-secundario">Selecione uma entidade no mapa.</p>}
        </aside>
      </div>

      <DivisorLayout direcao="horizontal" titulo="Redimensionar área inferior" aoIniciar={(evento) => layout.iniciar('rodape', evento)} />

      <div className="rodape-mesa">
        <section className="painel painel-acoes-completas painel-acoes-jogador-prototipo">
          <header className="cabecalho-painel-jogador">
            <div>
              <h2>Ações e Magias</h2>
              <small>Use apenas o que interfere na representação visual da mesa.</small>
            </div>
            <nav className="abas-painel-jogador" aria-label="Ações e magias">
              <button className={abaPainelJogador === 'acoes' ? 'aba-ativa' : ''} onClick={() => setAbaPainelJogador('acoes')} type="button">Ações</button>
              <button className={abaPainelJogador === 'magias' ? 'aba-ativa' : ''} onClick={() => setAbaPainelJogador('magias')} type="button">Magias</button>
            </nav>
          </header>
          <div className="conteudo-painel-jogador">
            {abaPainelJogador === 'acoes' ? (
              <PainelAcoesVisuais
                perfil="jogador"
                entidades={estado.entidades}
                atacanteId={minhaPeca?.id}
                alvoId={alvo?.id}
                aoExecutar={executarAcaoVisual}
                soproDraconico={soproDraconico}
                soproSelecionado={soproSelecionado}
                soproPronto={casasSopro.length > 0}
                aoPrepararSopro={prepararSoproDraconico}
                aoExecutarSopro={executarSoproDraconico}
                aoCancelarSopro={cancelarSoproDraconico}
              />
            ) : (
              <PainelMagias
                classe={meuPerfil?.classePersonagem ?? 'guerreiro'}
                nivel={meuPerfil?.nivelPersonagem ?? 1}
                raca={meuPerfil?.racaPersonagem ?? 'humano'}
                varianteRacial={meuPerfil?.varianteRacialPersonagem}
                magiasSelecionadasIds={meuPerfil?.magiasSelecionadasIds ?? []}
                magiaRacialEscolhidaId={meuPerfil?.magiaRacialEscolhidaId}
                magiaSelecionadaId={magiaSelecionadaId}
                quantidadeAfetados={quantidadeAfetados}
                podeConjurar={podeConjurar}
                motivoIndisponivel={motivoBloqueioMagia}
                aoAlterarMagiasSelecionadas={alterarMagiasSelecionadas}
                aoSelecionar={selecionarMagia}
                aoConjurar={conjurarMagia}
                aoCancelar={cancelarMagia}
              />
            )}
          </div>
        </section>
        <DivisorLayout direcao="vertical" titulo="Redimensionar ações e histórico" aoIniciar={(evento) => layout.iniciar('acoes', evento)} />
        <Historico itens={estado.historico} />
      </div>
      </div>
    </main>
  );
}
