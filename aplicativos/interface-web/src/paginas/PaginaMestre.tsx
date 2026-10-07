import { type ChangeEvent, useEffect, useMemo, useRef, useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { CLASSES_PERSONAGEM, RACAS_PERSONAGEM, nomeRacaCompleto, METROS_POR_CASA, TAMANHOS_CRIATURA, movimentoRestanteMetros, nomeTamanhoCriatura, nomeNivelIluminacao, fonteTochaDaEntidade, type EfeitoVisualCombate, type EfeitoVisualMagia, type EntidadeMapa, type EstadoSessao, type NivelIluminacao, type TemaMapa, type TipoAcaoVisual, type TipoEntidadeMapa, type TamanhoCriatura } from '@mesa-rpg/dominio';
import { ControlesZoom } from '../componentes/ControlesZoom';
import { DivisorLayout } from '../componentes/DivisorLayout';
import { GradeMesa } from '../componentes/GradeMesa';
import { Historico } from '../componentes/Historico';
import { PainelAcoesVisuais } from '../componentes/PainelAcoesVisuais';
import { PainelEntidadeMestre, type DadosPrivadosEntidadeEditados } from '../componentes/PainelEntidadeMestre';
import { PainelEfeitosAtivos } from '../componentes/PainelEfeitosAtivos';
import { enderecoServidor, socket } from '../comunicacao/socket';
import { processarImagem } from '../utilitarios/processarImagem';
import type { ResumoCampanhaPersistida } from '@mesa-rpg/protocolo';
import { useLayoutRedimensionavel } from '../funcionalidades/useLayoutRedimensionavel';

interface ResumoSessao {
  codigo: string;
  nomeCampanha: string;
  jogadoresConectados: number;
  linksEntrada: string[];
}

export function PaginaMestre(): React.JSX.Element {
  const [resumo, setResumo] = useState<ResumoSessao | null>(null);
  const [estado, setEstado] = useState<EstadoSessao | null>(null);
  const [entidadeSelecionadaId, setEntidadeSelecionadaId] = useState<string | null>(null);
  const [erro, setErro] = useState<string | null>(null);
  const [mensagemLink, setMensagemLink] = useState('Copiar link');
  const [linkEntradaSelecionado, setLinkEntradaSelecionado] = useState('');
  const [nomeCampanha, setNomeCampanha] = useState('');
  const [nomeMapa, setNomeMapa] = useState('Mapa inicial');
  const [colunas, setColunas] = useState(12);
  const [linhas, setLinhas] = useState(10);
  const [opacidadeGrade, setOpacidadeGrade] = useState(0.58);
  const [modoAlinhamento, setModoAlinhamento] = useState(false);
  const [zoom, setZoom] = useState(1);
  const [nomeEntidade, setNomeEntidade] = useState('');
  const [tipoEntidade, setTipoEntidade] = useState<TipoEntidadeMapa>('monstro');
  const [tamanhoEntidade, setTamanhoEntidade] = useState<TamanhoCriatura>('medio');
  const [quantidadeEntidade, setQuantidadeEntidade] = useState(1);
  const [movimentoLivreMestre, setMovimentoLivreMestre] = useState(false);
  const [imagemToken, setImagemToken] = useState<string | undefined>();
  const [atacanteAcaoId, setAtacanteAcaoId] = useState<string>('');
  const [alvoAcaoId, setAlvoAcaoId] = useState<string>('');
  const [efeitosVisuais, setEfeitosVisuais] = useState<EfeitoVisualCombate[]>([]);
  const [efeitosMagia, setEfeitosMagia] = useState<EfeitoVisualMagia[]>([]);
  const [previsualizarIluminacao, setPrevisualizarIluminacao] = useState(false);
  const [campanhasSalvas, setCampanhasSalvas] = useState<ResumoCampanhaPersistida[]>([]);
  const [modalCampanhasAberto, setModalCampanhasAberto] = useState(false);
  const [mensagemPersistencia, setMensagemPersistencia] = useState<string | null>(null);
  const [operacaoPersistencia, setOperacaoPersistencia] = useState(false);
  const inputImportacaoRef = useRef<HTMLInputElement>(null);
  const layout = useLayoutRedimensionavel('mesa-arcana-layout-mestre-v2');

  useEffect(() => {
    fetch(`${enderecoServidor}/api/sessao`)
      .then((resposta) => {
        if (!resposta.ok) throw new Error('Servidor indisponivel');
        return resposta.json() as Promise<ResumoSessao>;
      })
      .then((dados) => {
        setResumo(dados);
        setLinkEntradaSelecionado(dados.linksEntrada[0] ?? '');
        socket.emit('sessao:sincronizar-mestre', dados.codigo, (estadoSincronizado) => {
          setEstado(estadoSincronizado);
          if (!estadoSincronizado) return;

          const parametros = new URLSearchParams(window.location.search);
          if (parametros.get('nova') === '1') {
            socket.emit('campanha:mestre-nova', (resposta) => {
              setMensagemPersistencia(resposta.mensagem ?? null);
              window.history.replaceState({}, '', '/mestre');
            });
          } else if (parametros.get('carregar') === '1') {
            setModalCampanhasAberto(true);
            socket.emit('campanha:mestre-listar', (resposta) => {
              if (resposta.sucesso) setCampanhasSalvas(resposta.campanhas ?? []);
              else setMensagemPersistencia(resposta.mensagem ?? 'Não foi possível listar as campanhas.');
              window.history.replaceState({}, '', '/mestre');
            });
          }
        });
      })
      .catch(() => setErro('Não foi possível acessar o servidor local.'));

    const atualizar = (novoEstado: EstadoSessao): void => setEstado({ ...novoEstado });
    const receberEfeito = (efeito: EfeitoVisualCombate): void => {
      setEfeitosVisuais((atuais) => [...atuais.filter((item) => item.id !== efeito.id), efeito]);
      window.setTimeout(() => {
        setEfeitosVisuais((atuais) => atuais.filter((item) => item.id !== efeito.id));
      }, 1200);
    };
    const receberMagia = (efeito: EfeitoVisualMagia): void => {
      setEfeitosMagia((atuais) => [...atuais.filter((item) => item.id !== efeito.id), efeito]);
      window.setTimeout(() => setEfeitosMagia((atuais) => atuais.filter((item) => item.id !== efeito.id)), 1500);
    };
    socket.on('sessao:estado-mestre-atualizado', atualizar);
    socket.on('combate:efeito-visual', receberEfeito);
    socket.on('magia:efeito-visual', receberMagia);
    return () => {
      socket.off('sessao:estado-mestre-atualizado', atualizar);
      socket.off('combate:efeito-visual', receberEfeito);
      socket.off('magia:efeito-visual', receberMagia);
    };
  }, []);

  useEffect(() => {
    if (!estado) return;
    setNomeCampanha(estado.nomeCampanha);
    setNomeMapa(estado.mapaAtual.nome);
    setColunas(estado.mapaAtual.colunas);
    setLinhas(estado.mapaAtual.linhas);
    setOpacidadeGrade(estado.mapaAtual.opacidadeGrade);
  }, [estado?.codigo, estado?.mapaAtual.nome, estado?.mapaAtual.colunas, estado?.mapaAtual.linhas, estado?.mapaAtual.opacidadeGrade, estado?.nomeCampanha]);

  const conectados = useMemo(
    () => estado?.jogadores.filter((jogador) => jogador.conectado) ?? [],
    [estado]
  );

  const entidadesForaDoGrid = useMemo(
    () => estado?.entidades.filter((entidade) => entidade.presenteNoMapa === false) ?? [],
    [estado]
  );

  const entidadeSelecionada: EntidadeMapa | undefined = estado?.entidades.find(
    (entidade) => entidade.id === entidadeSelecionadaId
  );

  const jogadorDaEntidadeSelecionada = entidadeSelecionada?.controladorJogadorId
    ? estado?.jogadores.find((jogador) => jogador.id === entidadeSelecionada.controladorJogadorId)
    : undefined;

  useEffect(() => {
    if (!estado || !atacanteAcaoId) return;
    const atacante = estado.entidades.find((entidade) => entidade.id === atacanteAcaoId);
    if (!atacante || atacante.controladorJogadorId || (atacante.tipo !== 'npc' && atacante.tipo !== 'monstro')) {
      setAtacanteAcaoId('');
    }
  }, [estado, atacanteAcaoId]);

  async function copiarLink(): Promise<void> {
    if (!linkEntradaSelecionado) return;
    await navigator.clipboard.writeText(linkEntradaSelecionado);
    setMensagemLink('Link copiado');
    window.setTimeout(() => setMensagemLink('Copiar link'), 1800);
  }

  async function compartilharLink(): Promise<void> {
    if (!linkEntradaSelecionado) return;
    if (navigator.share) {
      await navigator.share({ title: 'Mesa Arcana', text: 'Entre na minha sessão de RPG', url: linkEntradaSelecionado });
      return;
    }
    await copiarLink();
  }

  function salvarCampanhaLocal(): void {
    setOperacaoPersistencia(true);
    socket.emit('campanha:mestre-salvar', (resposta) => {
      setOperacaoPersistencia(false);
      setMensagemPersistencia(resposta.sucesso
        ? `Campanha salva${resposta.arquivo ? ` em ${resposta.arquivo}` : ''}.`
        : resposta.mensagem ?? 'Não foi possível salvar a campanha.');
    });
  }

  function listarCampanhasSalvas(): void {
    setModalCampanhasAberto(true);
    setOperacaoPersistencia(true);
    socket.emit('campanha:mestre-listar', (resposta) => {
      setOperacaoPersistencia(false);
      if (resposta.sucesso) {
        setCampanhasSalvas(resposta.campanhas ?? []);
        setMensagemPersistencia(null);
      } else {
        setMensagemPersistencia(resposta.mensagem ?? 'Não foi possível listar as campanhas.');
      }
    });
  }

  function carregarCampanha(arquivo: string): void {
    setOperacaoPersistencia(true);
    socket.emit('campanha:mestre-carregar', { arquivo }, (resposta) => {
      setOperacaoPersistencia(false);
      setMensagemPersistencia(resposta.mensagem ?? (resposta.sucesso ? 'Campanha carregada.' : 'Não foi possível carregar a campanha.'));
      if (resposta.sucesso) setModalCampanhasAberto(false);
    });
  }

  function exportarCampanha(): void {
    setOperacaoPersistencia(true);
    socket.emit('campanha:mestre-exportar', (resposta) => {
      setOperacaoPersistencia(false);
      if (!resposta.sucesso || !resposta.conteudo || !resposta.nomeArquivo) {
        setMensagemPersistencia(resposta.mensagem ?? 'Não foi possível exportar a campanha.');
        return;
      }
      const blob = new Blob([resposta.conteudo], { type: 'application/json;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = resposta.nomeArquivo;
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(url);
      setMensagemPersistencia(`Campanha exportada como ${resposta.nomeArquivo}.`);
    });
  }

  async function importarCampanha(evento: ChangeEvent<HTMLInputElement>): Promise<void> {
    const arquivo = evento.target.files?.[0];
    if (!arquivo) return;
    setOperacaoPersistencia(true);
    try {
      const conteudo = await arquivo.text();
      socket.emit('campanha:mestre-importar', { conteudo }, (resposta) => {
        setOperacaoPersistencia(false);
        setMensagemPersistencia(resposta.mensagem ?? (resposta.sucesso ? 'Campanha importada.' : 'Não foi possível importar a campanha.'));
      });
    } catch {
      setOperacaoPersistencia(false);
      setMensagemPersistencia('Não foi possível ler o arquivo selecionado.');
    } finally {
      evento.target.value = '';
    }
  }

  function formatarDataSalvamento(valor: string): string {
    try {
      return new Intl.DateTimeFormat('pt-BR', { dateStyle: 'short', timeStyle: 'short' }).format(new Date(valor));
    } catch {
      return valor;
    }
  }

  function moverEntidade(entidadeId: string, coluna: number, linha: number): void {
    if (!estado) return;
    socket.emit('mapa:mestre-mover-entidade', { codigoSessao: estado.codigo, entidadeId, coluna, linha, ignorarLimiteMovimento: movimentoLivreMestre }, (resposta) => {
      setErro(resposta.sucesso ? null : resposta.mensagem ?? 'Movimento não realizado.');
    });
  }

  function alterarTema(tema: Exclude<TemaMapa, 'personalizado'>): void {
    if (!estado) return;
    socket.emit('mapa:mestre-alterar-tema', { codigoSessao: estado.codigo, tema }, (resposta) => {
      if (!resposta.sucesso) setErro(resposta.mensagem ?? 'Não foi possível alterar o mapa.');
    });
  }

  function salvarNomeCampanha(): void {
    if (!estado) return;
    socket.emit('sessao:mestre-configurar-campanha', { codigoSessao: estado.codigo, nomeCampanha }, (resposta) => {
      setErro(resposta.sucesso ? null : resposta.mensagem ?? 'Não foi possível salvar a campanha.');
    });
  }

  function salvarConfiguracaoMapa(imagemFundo?: string): void {
    if (!estado) return;
    socket.emit('mapa:mestre-configurar', {
      codigoSessao: estado.codigo,
      nome: nomeMapa,
      colunas,
      linhas,
      opacidadeGrade,
      ...(imagemFundo ? { imagemFundo } : {})
    }, (resposta) => {
      setErro(resposta.sucesso ? null : resposta.mensagem ?? 'Não foi possível configurar o mapa.');
    });
  }

  async function importarMapa(evento: ChangeEvent<HTMLInputElement>): Promise<void> {
    const arquivo = evento.target.files?.[0];
    if (!arquivo) return;
    try {
      const imagem = await processarImagem(arquivo, 1920, 0.88);
      const nomeSemExtensao = arquivo.name.replace(/\.[^.]+$/, '');
      setNomeMapa(nomeSemExtensao);
      if (!estado) return;
      socket.emit('mapa:mestre-configurar', {
        codigoSessao: estado.codigo,
        nome: nomeSemExtensao,
        colunas,
        linhas,
        opacidadeGrade,
        imagemFundo: imagem
      }, (resposta) => setErro(resposta.sucesso ? null : resposta.mensagem ?? 'Não foi possível importar o mapa.'));
    } catch (falha) {
      setErro(falha instanceof Error ? falha.message : 'Não foi possível importar o mapa.');
    } finally {
      evento.target.value = '';
    }
  }

  async function selecionarImagemToken(evento: ChangeEvent<HTMLInputElement>): Promise<void> {
    const arquivo = evento.target.files?.[0];
    if (!arquivo) return;
    try {
      setImagemToken(await processarImagem(arquivo, 512, 0.9));
      setErro(null);
    } catch (falha) {
      setErro(falha instanceof Error ? falha.message : 'Não foi possível ler a imagem.');
    }
  }

  function adicionarEntidade(): void {
    if (!estado || !nomeEntidade.trim()) return;
    socket.emit('mapa:mestre-adicionar-entidade', {
      codigoSessao: estado.codigo,
      nome: nomeEntidade.trim(),
      tipo: tipoEntidade,
      tamanhoCriatura: tamanhoEntidade,
      quantidade: tipoEntidade === 'personagem' ? 1 : quantidadeEntidade,
      ...(imagemToken ? { imagemToken } : {})
    }, (resposta) => {
      if (!resposta.sucesso) {
        setErro(resposta.mensagem ?? 'Não foi possível adicionar a peça.');
        return;
      }
      setNomeEntidade('');
      setImagemToken(undefined);
      setQuantidadeEntidade(1);
      setErro(null);
    });
  }

  function salvarDadosPrivadosEntidade(dados: DadosPrivadosEntidadeEditados): void {
    if (!estado || !entidadeSelecionada) return;
    socket.emit('mapa:mestre-atualizar-entidade-privada', {
      codigoSessao: estado.codigo,
      entidadeId: entidadeSelecionada.id,
      ...dados
    }, (resposta) => {
      setErro(resposta.sucesso ? null : resposta.mensagem ?? 'Não foi possível atualizar a peça.');
    });
  }

  function definirPresencaEntidade(entidadeId: string, presenteNoMapa: boolean): void {
    if (!estado) return;
    socket.emit('mapa:mestre-definir-presenca-entidade', { codigoSessao: estado.codigo, entidadeId, presenteNoMapa }, (resposta) => {
      if (!resposta.sucesso) {
        setErro(resposta.mensagem ?? 'Não foi possível alterar a presença da entidade no grid.');
        return;
      }
      if (!presenteNoMapa && entidadeSelecionadaId === entidadeId) setEntidadeSelecionadaId(null);
      setErro(null);
    });
  }

  function excluirEntidadeDaCampanha(entidadeId: string): void {
    if (!estado) return;
    socket.emit('mapa:mestre-remover-entidade', { codigoSessao: estado.codigo, entidadeId }, (resposta) => {
      if (!resposta.sucesso) setErro(resposta.mensagem ?? 'Não foi possível excluir a entidade da campanha.');
      else {
        if (entidadeSelecionadaId === entidadeId) setEntidadeSelecionadaId(null);
        setErro(null);
      }
    });
  }

  function executarAcaoVisual(tipo: TipoAcaoVisual): void {
    if (!estado || !atacanteAcaoId || !alvoAcaoId) return;
    socket.emit('combate:mestre-executar-acao', {
      codigoSessao: estado.codigo,
      atacanteId: atacanteAcaoId,
      alvoId: alvoAcaoId,
      tipo
    }, (resposta) => {
      setErro(resposta.sucesso ? null : resposta.mensagem ?? 'Não foi possível executar a ação visual.');
    });
  }

  function alternarMorteEntidade(entidadeId: string, morto: boolean): void {
    if (!estado) return;
    socket.emit('mapa:mestre-definir-morte', { codigoSessao: estado.codigo, entidadeId, morto }, (resposta) => {
      setErro(resposta.sucesso ? null : resposta.mensagem ?? 'Não foi possível alterar o estado da peça.');
    });
  }

  function avancarRodada(): void {
    if (!estado) return;
    socket.emit('sessao:mestre-avancar-rodada', { codigoSessao: estado.codigo }, (resposta) => {
      setErro(resposta.sucesso ? null : resposta.mensagem ?? 'Não foi possível avançar a rodada.');
    });
  }

  function encerrarEfeitoMagia(efeitoId: string): void {
    if (!estado) return;
    socket.emit('magia:encerrar-efeito', { codigoSessao: estado.codigo, efeitoId }, (resposta) => {
      setErro(resposta.sucesso ? null : resposta.mensagem ?? 'Não foi possível encerrar o efeito.');
    });
  }

  function definirIluminacao(nivelIluminacao: NivelIluminacao): void {
    if (!estado) return;
    socket.emit('mapa:mestre-definir-iluminacao', { codigoSessao: estado.codigo, nivelIluminacao }, (resposta) => {
      setErro(resposta.sucesso ? null : resposta.mensagem ?? 'Não foi possível alterar a iluminação.');
    });
  }

  function alternarTochaMestre(entidadeId: string, ativa: boolean): void {
    if (!estado) return;
    socket.emit('iluminacao:mestre-alternar-tocha', { codigoSessao: estado.codigo, entidadeId, ativa }, (resposta) => {
      setErro(resposta.sucesso ? null : resposta.mensagem ?? 'Não foi possível alterar a tocha.');
    });
  }

  function selecionarEntidadeNoMapa(entidadeId: string): void {
    setEntidadeSelecionadaId(entidadeId);
    setAlvoAcaoId(entidadeId);
  }

  return (
    <main className="aplicacao aplicacao-mestre">
      <header className="barra-superior">
        <strong className="marca-menor"><span className="marca-simbolo" aria-hidden="true">✦</span>Mesa Arcana</strong>
        <span className="identidade-sessao">Sessão: <b>{estado?.nomeCampanha ?? resumo?.nomeCampanha ?? '...'}</b></span>
        <span className="espacador" />
        <span className="selo-cabecalho">Código: <b>{resumo?.codigo ?? '------'}</b></span>
        <span className="selo-cabecalho">Jogadores: <b>{conectados.length}</b></span>
        <div className="acoes-persistencia-topo">
          <button type="button" onClick={salvarCampanhaLocal} disabled={operacaoPersistencia}>Salvar</button>
          <button type="button" onClick={listarCampanhasSalvas} disabled={operacaoPersistencia}>Carregar</button>
          <button type="button" onClick={exportarCampanha} disabled={operacaoPersistencia}>Exportar</button>
          <button type="button" onClick={() => inputImportacaoRef.current?.click()} disabled={operacaoPersistencia}>Importar</button>
          <input ref={inputImportacaoRef} className="input-arquivo-oculto" type="file" accept=".mesaarcana,application/json" onChange={importarCampanha} />
        </div>
        <button className="botao-layout" onClick={layout.restaurar} title="Restaurar proporções do layout" type="button">↺ Layout</button>
        <button className="botao-sobre-topo" type="button" onClick={() => { window.location.href = '/sobre'; }} title={`Mesa Arcana ${__MESA_ARCANA_VERSION__}`}>MVP RC</button>
        {window.mesaArcana?.aplicativoDesktop ? <button className="botao-diagnostico-topo" type="button" onClick={() => { window.location.href = '/diagnostico'; }} title="Validar funcionamento do aplicativo">Diagnóstico</button> : null}
        <span className="indicador-online">Servidor ativo</span>
      </header>

      {erro ? <div className="aviso-erro">{erro}</div> : null}
      {mensagemPersistencia ? (
        <div className="aviso-persistencia">
          <span>{mensagemPersistencia}</span>
          <button type="button" onClick={() => setMensagemPersistencia(null)} aria-label="Fechar aviso">×</button>
        </div>
      ) : null}

      <div className="corpo-mesa-redimensionavel" style={layout.estilo}>
      <div className="layout-mestre">
        <aside className="painel lateral">
          <h2>Campanha</h2>
          <div className="formulario-compacto">
            <input value={nomeCampanha} onChange={(e) => setNomeCampanha(e.target.value)} placeholder="Nome da campanha" />
            <button className="botao-compacto" onClick={salvarNomeCampanha}>Salvar nome</button>
          </div>

          <details className="bloco-sessao secao-recolhivel" open>
            <summary>Convidar jogadores</summary>
            <strong className="codigo-sessao">{resumo?.codigo ?? '------'}</strong>
            {linkEntradaSelecionado ? (
              <div className="qr-sessao">
                <QRCodeSVG value={linkEntradaSelecionado} size={180} level="M" marginSize={2} bgColor="#ffffff" fgColor="#000000" title="QR Code para entrar na sessão" />
              </div>
            ) : null}
            <small className="texto-centralizado">Leia com a câmera do celular</small>
            {resumo && resumo.linksEntrada.length > 1 ? (
              <label className="seletor-rede">Rede detectada
                <select value={linkEntradaSelecionado} onChange={(e) => setLinkEntradaSelecionado(e.target.value)}>
                  {resumo.linksEntrada.map((link, indice) => <option value={link} key={link}>Rede {indice + 1} — {new URL(link).hostname}</option>)}
                </select>
              </label>
            ) : null}
            {linkEntradaSelecionado ? <small className="link-sessao">{linkEntradaSelecionado}</small> : null}
            <div className="acoes-convite">
              <button className="botao-compacto" disabled={!linkEntradaSelecionado} onClick={copiarLink}>{mensagemLink}</button>
              <button className="botao-compacto" disabled={!linkEntradaSelecionado} onClick={compartilharLink}>Compartilhar</button>
            </div>
          </details>

          <details className="bloco-sessao secao-recolhivel" open>
            <summary>Mapa e grid</summary>
            <input value={nomeMapa} onChange={(e) => setNomeMapa(e.target.value)} placeholder="Nome do mapa" />
            <small className="texto-escala-grid">Escala oficial: 1 casa = {METROS_POR_CASA.toLocaleString('pt-BR')} m</small>
            <div className="duas-colunas">
              <label>Colunas<input type="number" min="4" max="50" value={colunas} onChange={(e) => setColunas(Number(e.target.value))} /></label>
              <label>Linhas<input type="number" min="4" max="50" value={linhas} onChange={(e) => setLinhas(Number(e.target.value))} /></label>
            </div>
            <label className="controle-faixa">Visibilidade do grid <input type="range" min="0.15" max="1" step="0.05" value={opacidadeGrade} onChange={(e) => setOpacidadeGrade(Number(e.target.value))} /></label>
            <button className={`botao-compacto ${modoAlinhamento ? 'botao-ativo' : ''}`} onClick={() => setModoAlinhamento((ativo) => !ativo)}>
              {modoAlinhamento ? 'Desativar modo de alinhamento' : 'Realçar grid para alinhamento'}
            </button>
            <button className="botao-compacto" onClick={() => salvarConfiguracaoMapa()}>Aplicar grid</button>
            <label className="botao-arquivo">Importar imagem do mapa<input accept="image/*" type="file" onChange={importarMapa} /></label>
            <div className="acoes-tema">
              <button onClick={() => alterarTema('ruinas')}>Ruínas</button>
              <button onClick={() => alterarTema('floresta')}>Floresta</button>
              <button onClick={() => alterarTema('masmorra')}>Masmorra</button>
            </div>
          </details>

          <details className="bloco-sessao secao-recolhivel" open>
            <summary>Iluminação</summary>
            <label>Nível do ambiente
              <select
                value={estado?.mapaAtual.iluminacaoAmbiente ?? 'luz-plena'}
                onChange={(e) => definirIluminacao(e.target.value as NivelIluminacao)}
              >
                <option value="luz-plena">Luz plena</option>
                <option value="penumbra">Penumbra</option>
                <option value="escuridao">Escuridão</option>
              </select>
            </label>
            <small className="texto-escala-grid">Ambiente atual: {nomeNivelIluminacao(estado?.mapaAtual.iluminacaoAmbiente ?? 'luz-plena')}</small>
            <button
              className={`botao-compacto ${previsualizarIluminacao ? 'botao-ativo' : ''}`}
              onClick={() => setPrevisualizarIluminacao((ativo) => !ativo)}
              type="button"
            >
              {previsualizarIluminacao ? 'Ocultar prévia de luz' : 'Pré-visualizar iluminação'}
            </button>
            <small>A prévia do mestre mostra o ambiente sem limitar a visão administrativa. Cada jogador recebe sua própria visão conforme raça e efeitos.</small>
          </details>

          <details className="bloco-sessao secao-recolhivel">
            <summary>Adicionar peça</summary>
            <input value={nomeEntidade} onChange={(e) => setNomeEntidade(e.target.value)} placeholder="Nome" />
            <div className="duas-colunas">
              <select value={tipoEntidade} onChange={(e) => { const tipo = e.target.value as TipoEntidadeMapa; setTipoEntidade(tipo); if (tipo === 'personagem') setQuantidadeEntidade(1); }}>
                <option value="personagem">Personagem</option>
                <option value="npc">NPC</option>
                <option value="monstro">Monstro</option>
              </select>
              <select value={tamanhoEntidade} onChange={(e) => setTamanhoEntidade(e.target.value as TamanhoCriatura)}>
                {TAMANHOS_CRIATURA.map((tamanho) => <option key={tamanho.id} value={tamanho.id}>{tamanho.nome}</option>)}
              </select>
            </div>
            {tipoEntidade !== 'personagem' ? (
              <label>Quantidade
                <input type="number" min="1" max="20" value={quantidadeEntidade} onChange={(e) => setQuantidadeEntidade(Math.min(20, Math.max(1, Number(e.target.value) || 1)))} />
                <small>Todos reutilizam o mesmo token. Se não houver espaço, os excedentes ficam na biblioteca.</small>
              </label>
            ) : null}
            <label className="botao-arquivo">Imagem do token<input accept="image/*" type="file" onChange={selecionarImagemToken} /></label>
            {imagemToken ? <img className="preview-token" src={imagemToken} alt="Prévia do token" /> : null}
            <button className="botao-compacto" onClick={adicionarEntidade}>Adicionar ao mapa</button>
          </details>

          <details className="bloco-sessao secao-recolhivel" open={entidadesForaDoGrid.length > 0}>
            <summary>Biblioteca da campanha ({entidadesForaDoGrid.length})</summary>
            <small>Entidades fora do grid continuam salvas e podem voltar ao mapa a qualquer momento.</small>
            <div className="lista-biblioteca-entidades">
              {entidadesForaDoGrid.length === 0 ? <small>Nenhuma entidade guardada.</small> : entidadesForaDoGrid.map((entidade) => {
                const jogador = entidade.controladorJogadorId ? estado?.jogadores.find((item) => item.id === entidade.controladorJogadorId) : undefined;
                return (
                  <article className="item-biblioteca-entidade" key={entidade.id}>
                    <span className="mini-token-biblioteca" style={entidade.imagemToken ? { backgroundImage: `url(${entidade.imagemToken})` } : undefined}>{entidade.imagemToken ? '' : entidade.nome.slice(0, 1).toUpperCase()}</span>
                    <span className="dados-biblioteca-entidade"><b>{entidade.nome}</b><small>{entidade.tipo}{jogador?.conectado ? ' · jogador conectado' : ''}</small></span>
                    <button type="button" onClick={() => definirPresencaEntidade(entidade.id, true)}>Colocar no grid</button>
                    <button className="botao-perigo-minimo" type="button" disabled={Boolean(jogador?.conectado)} onClick={() => excluirEntidadeDaCampanha(entidade.id)} title={jogador?.conectado ? 'O jogador precisa sair antes da exclusão.' : 'Excluir definitivamente da campanha'}>Excluir</button>
                  </article>
                );
              })}
            </div>
          </details>

          <details className="jogadores-conectados secao-recolhivel">
            <summary>Conectados ({conectados.length})</summary>
            <div className="lista-conectados">
              {conectados.length === 0 ? <small>Nenhum jogador ainda.</small> : conectados.map((jogador) => <small key={jogador.id}>● {jogador.nome} · {nomeRacaCompleto(jogador.racaPersonagem, jogador.varianteRacialPersonagem)} · {CLASSES_PERSONAGEM.find((classe) => classe.id === jogador.classePersonagem)?.nome ?? jogador.classePersonagem} {jogador.nivelPersonagem}</small>)}
            </div>
          </details>

          {estado ? (
            <details className="bloco-sessao secao-recolhivel" open>
              <summary>Efeitos e rodada</summary>
              <PainelEfeitosAtivos
                efeitos={estado.efeitosMagiaAtivos}
                entidades={estado.entidades}
                rodadaAtual={estado.rodadaAtual}
                perfil="mestre"
                aoAvancarRodada={avancarRodada}
                aoEncerrar={encerrarEfeitoMagia}
              />
            </details>
          ) : null}
        </aside>

        <DivisorLayout direcao="vertical" titulo="Redimensionar painel esquerdo" aoIniciar={(evento) => layout.iniciar('esquerda', evento)} />

        <section className="centro-mesa">
          <div className="barra-ferramentas barra-ferramentas-movimento">
            <span>{movimentoLivreMestre ? 'Reposicionamento livre ativo' : entidadeSelecionada ? `Movimento restante: ${movimentoRestanteMetros(entidadeSelecionada)} m · ${nomeTamanhoCriatura(entidadeSelecionada.tamanhoCriatura)}` : 'Selecione uma peça e clique na casa de destino'}</span>
          </div>
          {estado ? <div className="nome-mapa-flutuante">{estado.mapaAtual.nome}</div> : null}
          <ControlesZoom zoom={zoom} aoAlterar={setZoom} />
          {estado ? (
            <GradeMesa
              aoMover={moverEntidade}
              aoSelecionarEntidade={selecionarEntidadeNoMapa}
              entidadeSelecionadaId={entidadeSelecionadaId}
              entidades={estado.entidades}
              efeitosMagia={efeitosMagia}
              efeitosMagiaAtivos={estado.efeitosMagiaAtivos}
              fontesLuzAtivas={estado.fontesLuzAtivas}
              efeitosVisuais={efeitosVisuais}
              mapa={estado.mapaAtual}
              modoAlinhamento={modoAlinhamento}
              movimentoLivreMestre={movimentoLivreMestre}
              previsualizarIluminacaoMestre={previsualizarIluminacao}
              perfil="mestre"
              zoom={zoom}
            />
          ) : null}
        </section>

        <DivisorLayout direcao="vertical" titulo="Redimensionar painel direito" aoIniciar={(evento) => layout.iniciar('direita', evento)} />

        <aside className="painel lateral-direita">
          <h2>Elemento selecionado</h2>
          <PainelEntidadeMestre
            entidade={entidadeSelecionada}
            aoSalvarDadosPrivados={salvarDadosPrivadosEntidade}
            aoAlternarMorte={alternarMorteEntidade}
            tochaAcesa={Boolean(entidadeSelecionada && estado && fonteTochaDaEntidade(estado.fontesLuzAtivas, entidadeSelecionada.id))}
            aoAlternarTocha={alternarTochaMestre}
            aoRetirarDoGrid={() => entidadeSelecionada && definirPresencaEntidade(entidadeSelecionada.id, false)}
            aoExcluirDaCampanha={() => entidadeSelecionada && excluirEntidadeDaCampanha(entidadeSelecionada.id)}
            jogadorConectado={Boolean(jogadorDaEntidadeSelecionada?.conectado)}
          />
        </aside>
      </div>

      <DivisorLayout direcao="horizontal" titulo="Redimensionar área inferior" aoIniciar={(evento) => layout.iniciar('rodape', evento)} />

      <div className="rodape-mesa">
        <PainelAcoesVisuais
          perfil="mestre"
          entidades={estado?.entidades ?? []}
          atacanteId={atacanteAcaoId}
          alvoId={alvoAcaoId}
          aoAlterarAtacante={setAtacanteAcaoId}
          aoAlterarAlvo={setAlvoAcaoId}
          aoExecutar={executarAcaoVisual}
          movimentoLivreMestre={movimentoLivreMestre}
          aoAlternarMovimentoLivreMestre={() => setMovimentoLivreMestre((ativo) => !ativo)}
        />
        <DivisorLayout direcao="vertical" titulo="Redimensionar ações e histórico" aoIniciar={(evento) => layout.iniciar('acoes', evento)} />
        <Historico itens={estado?.historico ?? []} />
      </div>
      </div>

      {modalCampanhasAberto ? (
        <div className="fundo-modal-campanhas" role="presentation" onMouseDown={() => setModalCampanhasAberto(false)}>
          <section className="modal-campanhas" role="dialog" aria-modal="true" aria-labelledby="titulo-carregar-campanha" onMouseDown={(evento) => evento.stopPropagation()}>
            <header>
              <div>
                <small>Salvamentos locais</small>
                <h2 id="titulo-carregar-campanha">Carregar campanha</h2>
              </div>
              <button type="button" className="botao-fechar-modal" onClick={() => setModalCampanhasAberto(false)}>×</button>
            </header>
            <p className="texto-modal-campanhas">Os salvamentos ficam no computador do Mestre. Para levar uma campanha para outra máquina, use Exportar e Importar.</p>
            <div className="lista-campanhas-salvas">
              {operacaoPersistencia ? <p>Carregando...</p> : null}
              {!operacaoPersistencia && campanhasSalvas.length === 0 ? <p>Nenhuma campanha salva neste computador.</p> : null}
              {campanhasSalvas.map((campanha) => (
                <article className="item-campanha-salva" key={campanha.arquivo}>
                  <div>
                    <strong>{campanha.nomeCampanha}</strong>
                    <small>{formatarDataSalvamento(campanha.salvoEm)} · {(campanha.tamanhoBytes / 1024 / 1024).toFixed(1)} MB</small>
                  </div>
                  <button type="button" onClick={() => carregarCampanha(campanha.arquivo)} disabled={operacaoPersistencia}>Carregar</button>
                </article>
              ))}
            </div>
          </section>
        </div>
      ) : null}
    </main>
  );
}
