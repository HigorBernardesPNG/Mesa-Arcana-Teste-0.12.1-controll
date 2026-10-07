import {
  calcularCasasMovimentoDisponiveis,
  formatarTempoJogo,
  obterVisibilidadeCasa,
  movimentoRestanteMetros,
  tamanhoCriaturaEmCasas,
  type EfeitoMagiaAtivo,
  type EfeitoVisualCombate,
  type EfeitoVisualMagia,
  type FonteLuzAtiva,
  type EntidadeMapaBase,
  type MapaSessao,
  type PosicaoMapa
} from '@mesa-rpg/dominio';

interface PropriedadesGradeMesa {
  mapa: MapaSessao;
  entidades: EntidadeMapaBase[];
  efeitosVisuais?: EfeitoVisualCombate[];
  efeitosMagia?: EfeitoVisualMagia[];
  efeitosMagiaAtivos?: EfeitoMagiaAtivo[];
  fontesLuzAtivas?: FonteLuzAtiva[];
  casasDestaque?: PosicaoMapa[];
  perfil: 'mestre' | 'jogador';
  jogadorId?: string;
  entidadeSelecionadaId?: string | null;
  modoAlinhamento?: boolean;
  modoSelecaoCasa?: boolean;
  movimentoLivreMestre?: boolean;
  previsualizarIluminacaoMestre?: boolean;
  zoom?: number;
  aoSelecionarEntidade: (entidadeId: string) => void;
  aoSelecionarCasa?: (coluna: number, linha: number) => void;
  aoMover: (entidadeId: string, coluna: number, linha: number) => void;
}

function classeEntidade(entidade: EntidadeMapaBase, jogadorId?: string): string {
  if (jogadorId && entidade.controladorJogadorId === jogadorId) return 'peca peca-propria';
  if (entidade.tipo === 'monstro') return 'peca peca-monstro';
  if (entidade.tipo === 'npc') return 'peca peca-npc';
  return 'peca peca-personagem';
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

function simboloEfeito(tipo: EfeitoVisualCombate['tipo']): string {
  if (tipo === 'espada') return '⚔';
  if (tipo === 'flecha') return '➶';
  return '✦';
}

function geometriaEntidade(entidade: EntidadeMapaBase, mapa: MapaSessao): { left: string; top: string; width: string; height: string; centroX: number; centroY: number } {
  const casas = tamanhoCriaturaEmCasas(entidade.tamanhoCriatura);
  const proporcaoVisual = entidade.tamanhoCriatura === 'miudo' ? 0.52 : casas === 1 ? 0.76 : 0.88;
  const margem = casas * (1 - proporcaoVisual) / 2;
  const left = ((entidade.posicao.coluna - 1 + margem) / mapa.colunas) * 100;
  const top = ((entidade.posicao.linha - 1 + margem) / mapa.linhas) * 100;
  const width = (casas * proporcaoVisual / mapa.colunas) * 100;
  const height = (casas * proporcaoVisual / mapa.linhas) * 100;
  const centroX = ((entidade.posicao.coluna - 1 + casas / 2) / mapa.colunas) * 100;
  const centroY = ((entidade.posicao.linha - 1 + casas / 2) / mapa.linhas) * 100;
  return { left: `${left}%`, top: `${top}%`, width: `${width}%`, height: `${height}%`, centroX, centroY };
}

export function GradeMesa({
  mapa,
  entidades,
  efeitosVisuais = [],
  efeitosMagia = [],
  efeitosMagiaAtivos = [],
  fontesLuzAtivas = [],
  casasDestaque = [],
  perfil,
  jogadorId,
  entidadeSelecionadaId,
  modoAlinhamento = false,
  modoSelecaoCasa = false,
  movimentoLivreMestre = false,
  previsualizarIluminacaoMestre = false,
  zoom = 1,
  aoSelecionarEntidade,
  aoSelecionarCasa,
  aoMover
}: PropriedadesGradeMesa): React.JSX.Element {
  const entidadesNoMapa = entidades.filter((entidade) => entidade.presenteNoMapa !== false);
  const entidadeDoJogador = entidades.find((entidade) => entidade.controladorJogadorId === jogadorId);
  const entidadeParaMover = perfil === 'mestre'
    ? entidadesNoMapa.find((entidade) => entidade.id === entidadeSelecionadaId)
    : entidadeDoJogador;

  const celulas = Array.from({ length: mapa.colunas * mapa.linhas }, (_, indice) => ({
    coluna: (indice % mapa.colunas) + 1,
    linha: Math.floor(indice / mapa.colunas) + 1
  }));
  const casasDestaqueSet = new Set(casasDestaque.map((casa) => `${casa.coluna}:${casa.linha}`));
  const casasEfeitoSet = new Set(efeitosMagia.flatMap((efeito) => efeito.casas.map((casa) => `${casa.coluna}:${casa.linha}`)));
  const casasEfeitoAtivoSet = new Set(efeitosMagiaAtivos.flatMap((efeito) => efeito.vinculo === 'area' ? efeito.casas.map((casa) => `${casa.coluna}:${casa.linha}`) : []));
  const casasMovimento = entidadeParaMover && !modoSelecaoCasa && !(perfil === 'mestre' && movimentoLivreMestre)
    ? calcularCasasMovimentoDisponiveis(entidadeParaMover, mapa, entidadesNoMapa)
    : [];
  const casasMovimentoSet = new Set(casasMovimento.map((casa) => `${casa.coluna}:${casa.linha}`));
  const observador = perfil === 'jogador' && entidadeDoJogador?.presenteNoMapa !== false ? entidadeDoJogador : undefined;
  const jogadorForaDoGrid = perfil === 'jogador' && Boolean(entidadeDoJogador) && entidadeDoJogador?.presenteNoMapa === false;
  const mostrarIluminacao = perfil === 'jogador' || previsualizarIluminacaoMestre;
  const visibilidadePorCasa = new Map(celulas.map((casa) => [
    `${casa.coluna}:${casa.linha}`,
    jogadorForaDoGrid
      ? 'escuro' as const
      : obterVisibilidadeCasa({
          mapa,
          casa,
          entidades: entidadesNoMapa,
          efeitos: efeitosMagiaAtivos,
          fontes: fontesLuzAtivas,
          ...(observador ? { observador } : {}),
          previsualizacaoMestre: previsualizarIluminacaoMestre
        })
  ]));

  return (
    <div className="viewport-mapa">
      <div
        className={`mapa-mesa tema-${mapa.tema} ${modoAlinhamento ? 'modo-alinhamento-grid' : ''} ${modoSelecaoCasa ? 'modo-selecao-magia' : ''}`}
        style={{
          width: `${zoom * 100}%`,
          height: `${zoom * 100}%`,
          ...(mapa.imagemFundo ? { backgroundImage: `url(${mapa.imagemFundo})` } : {})
        }}
      >
        <div
          className="grade-interativa"
          style={{
            gridTemplateColumns: `repeat(${mapa.colunas}, 1fr)`,
            gridTemplateRows: `repeat(${mapa.linhas}, 1fr)`,
            opacity: modoAlinhamento || modoSelecaoCasa ? 1 : mapa.opacidadeGrade
          }}
        >
          {celulas.map((celula) => {
            const exibirRotulo = modoAlinhamento && (celula.linha === 1 || celula.coluna === 1);
            const marco = celula.coluna % 5 === 0 || celula.linha % 5 === 0;
            const chave = `${celula.coluna}:${celula.linha}`;
            return (
              <button
                aria-label={`Casa ${celula.coluna},${celula.linha}`}
                className={`celula-grade ${marco ? 'marco-grade' : ''} ${casasMovimentoSet.has(chave) ? 'celula-alcance-movimento' : ''} ${casasDestaqueSet.has(chave) ? 'celula-area-magia' : ''} ${casasEfeitoSet.has(chave) ? 'celula-efeito-magia' : ''} ${casasEfeitoAtivoSet.has(chave) ? 'celula-efeito-magia-ativo' : ''}`}
                key={`${celula.coluna}-${celula.linha}`}
                onClick={() => {
                  if (modoSelecaoCasa && aoSelecionarCasa) {
                    aoSelecionarCasa(celula.coluna, celula.linha);
                    return;
                  }
                  if (entidadeParaMover) aoMover(entidadeParaMover.id, celula.coluna, celula.linha);
                }}
                type="button"
              >
                {exibirRotulo ? (
                  <span className="rotulo-grade">
                    {celula.linha === 1 ? nomeColuna(celula.coluna) : celula.linha}
                  </span>
                ) : null}
              </button>
            );
          })}
        </div>

        {mostrarIluminacao ? (
          <div
            className="camada-iluminacao"
            style={{
              gridTemplateColumns: `repeat(${mapa.colunas}, 1fr)`,
              gridTemplateRows: `repeat(${mapa.linhas}, 1fr)`
            }}
            aria-hidden="true"
          >
            {celulas.map((casa) => (
              <span
                className={`celula-iluminacao iluminacao-${visibilidadePorCasa.get(`${casa.coluna}:${casa.linha}`) ?? 'claro'}`}
                key={`luz-${casa.coluna}-${casa.linha}`}
              />
            ))}
          </div>
        ) : null}

        {entidadesNoMapa.map((entidade) => {
          const estaAtacando = efeitosVisuais.some((efeito) => efeito.atacanteId === entidade.id);
          const estaSendoAtingida = efeitosVisuais.some((efeito) => efeito.alvoId === entidade.id);
          const estaConjurando = efeitosMagia.some((efeito) => efeito.conjuradorId === entidade.id);
          const efeitosVinculados = efeitosMagiaAtivos.filter((efeito) =>
            efeito.vinculo !== 'area' && (efeito.alvoIds.includes(entidade.id) || (efeito.vinculo === 'pessoal' && efeito.conjuradorId === entidade.id))
          );
          const geometria = geometriaEntidade(entidade, mapa);
          const movimentoRestante = entidade.deslocamento !== undefined ? movimentoRestanteMetros(entidade) : undefined;
          const visibilidadeEntidade = perfil === 'jogador'
            ? visibilidadePorCasa.get(`${entidade.posicao.coluna}:${entidade.posicao.linha}`) ?? 'claro'
            : 'claro';
          const propriaPeca = Boolean(jogadorId && entidade.controladorJogadorId === jogadorId);
          const classeVisibilidade = !propriaPeca && (visibilidadeEntidade === 'escuro' || visibilidadeEntidade === 'escuridao-magica')
            ? 'peca-oculta-escuridao'
            : visibilidadeEntidade === 'visao-escuro'
              ? 'peca-visao-escuro'
              : '';
          const possuiTocha = fontesLuzAtivas.some((fonte) => fonte.entidadeId === entidade.id);
          return (
            <button
              className={`${classeEntidade(entidade, jogadorId)} ${entidade.id === entidadeSelecionadaId ? 'peca-selecionada' : ''} ${estaAtacando || estaConjurando ? 'peca-atacando' : ''} ${estaSendoAtingida ? 'peca-impactada' : ''} ${entidade.morto ? 'peca-morta' : ''} ${classeVisibilidade}`}
              key={entidade.id}
              onClick={(evento) => {
                evento.stopPropagation();
                aoSelecionarEntidade(entidade.id);
              }}
              style={{
                left: geometria.left,
                top: geometria.top,
                width: geometria.width,
                height: geometria.height,
                ...(entidade.imagemToken ? { backgroundImage: `url(${entidade.imagemToken})` } : {})
              }}
              title={`${entidade.nome}${movimentoRestante !== undefined ? ` · movimento restante ${movimentoRestante} m` : ''}`}
              type="button"
            >
              {entidade.imagemToken ? <span className="texto-token-acessivel">{entidade.nome}</span> : entidade.nome.slice(0, 1).toUpperCase()}
              {entidade.morto ? <span className="marcador-morte" aria-label="Morto">✕</span> : null}
              {possuiTocha ? <span className="marcador-tocha" title="Tocha acesa">🔥</span> : null}
              {efeitosVinculados.length > 0 ? (
                <span
                  className="marcador-efeito-token"
                  title={efeitosVinculados.map((efeito) => `${efeito.nomeMagia}: ${formatarTempoJogo(efeito.segundosRestantes)}`).join(' · ')}
                >
                  ✦ {efeitosVinculados.length > 1 ? efeitosVinculados.length : formatarTempoJogo(efeitosVinculados[0]?.segundosRestantes)}
                </span>
              ) : null}
            </button>
          );
        })}

        {efeitosVisuais.map((efeito) => {
          const alvo = entidadesNoMapa.find((entidade) => entidade.id === efeito.alvoId);
          if (!alvo) return null;
          const geometria = geometriaEntidade(alvo, mapa);
          return (
            <div
              aria-hidden="true"
              className={`efeito-combate efeito-${efeito.tipo}`}
              key={efeito.id}
              style={{ left: `${geometria.centroX}%`, top: `${geometria.centroY}%` }}
            >
              <span className="simbolo-efeito">{simboloEfeito(efeito.tipo)}</span>
              <span className="impacto-efeito" />
            </div>
          );
        })}

        {efeitosMagiaAtivos.filter((efeito) => efeito.vinculo === 'area' && efeito.casas.length > 0).map((efeito) => {
          const referencia = efeito.pontoOrigem ?? efeito.casas[Math.floor(efeito.casas.length / 2)];
          if (!referencia) return null;
          return (
            <div
              className="rotulo-efeito-magia-ativo"
              key={`ativo-${efeito.id}`}
              style={{
                left: `${((referencia.coluna - 0.5) / mapa.colunas) * 100}%`,
                top: `${((referencia.linha - 0.5) / mapa.linhas) * 100}%`
              }}
            >
              <b>{efeito.nomeMagia}</b>
              <small>{formatarTempoJogo(efeito.segundosRestantes)}</small>
            </div>
          );
        })}
      </div>
    </div>
  );
}
