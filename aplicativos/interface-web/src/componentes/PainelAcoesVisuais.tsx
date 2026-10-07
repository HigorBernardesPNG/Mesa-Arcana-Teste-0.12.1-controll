import type { DefinicaoSoproDraconico, EntidadeMapaBase, TipoAcaoVisual } from '@mesa-rpg/dominio';

interface PropriedadesPainelAcoesVisuais {
  perfil: 'mestre' | 'jogador';
  entidades: EntidadeMapaBase[];
  atacanteId?: string | undefined;
  alvoId?: string | undefined;
  aoAlterarAtacante?: (id: string) => void;
  aoAlterarAlvo?: (id: string) => void;
  aoExecutar: (tipo: TipoAcaoVisual) => void;
  movimentoLivreMestre?: boolean;
  aoAlternarMovimentoLivreMestre?: () => void;
  soproDraconico?: DefinicaoSoproDraconico | undefined;
  soproSelecionado?: boolean;
  soproPronto?: boolean;
  aoPrepararSopro?: () => void;
  aoExecutarSopro?: () => void;
  aoCancelarSopro?: () => void;
}

const ACOES: Array<{ tipo: TipoAcaoVisual; icone: string; rotulo: string }> = [
  { tipo: 'espada', icone: '⚔', rotulo: 'Espada' },
  { tipo: 'flecha', icone: '➶', rotulo: 'Flecha' },
  { tipo: 'magia', icone: '✦', rotulo: 'Magia' }
];

export function PainelAcoesVisuais({
  perfil,
  entidades,
  atacanteId,
  alvoId,
  aoAlterarAtacante,
  aoAlterarAlvo,
  aoExecutar,
  movimentoLivreMestre = false,
  aoAlternarMovimentoLivreMestre,
  soproDraconico,
  soproSelecionado = false,
  soproPronto = false,
  aoPrepararSopro,
  aoExecutarSopro,
  aoCancelarSopro
}: PropriedadesPainelAcoesVisuais): React.JSX.Element {
  const entidadesNoMapa = entidades.filter((entidade) => entidade.presenteNoMapa !== false);
  const atacantesMestre = entidadesNoMapa.filter(
    (entidade) => (entidade.tipo === 'npc' || entidade.tipo === 'monstro') && !entidade.controladorJogadorId
  );
  const atacante = entidadesNoMapa.find((entidade) => entidade.id === atacanteId);
  const alvo = entidadesNoMapa.find((entidade) => entidade.id === alvoId);
  const podeAtacar = Boolean(atacante && alvo && atacante.id !== alvo.id && !atacante.morto);

  return (
    <section className={`painel acoes-combate acoes-combate-${perfil}`}>
      <div className="cabecalho-acoes-combate">
        <h2>{perfil === 'mestre' ? 'Ações de combate' : 'Ações do personagem'}</h2>
        <small>{perfil === 'mestre' ? 'Controle visual da cena' : 'Ações visuais da sua peça'}</small>
      </div>

      {perfil === 'mestre' ? (
        <div className="seletores-combate">
          <label>
            Atacante
            <select value={atacanteId ?? ''} onChange={(evento) => aoAlterarAtacante?.(evento.target.value)}>
              <option value="">Selecionar</option>
              {atacantesMestre.map((entidade) => <option key={entidade.id} value={entidade.id}>{entidade.nome}</option>)}
            </select>
          </label>
          <label>
            Alvo
            <select value={alvoId ?? ''} onChange={(evento) => aoAlterarAlvo?.(evento.target.value)}>
              <option value="">Selecionar</option>
              {entidadesNoMapa.map((entidade) => <option key={entidade.id} value={entidade.id}>{entidade.nome}</option>)}
            </select>
          </label>
        </div>
      ) : (
        <div className="resumo-acao-jogador">
          <span><small>Origem</small><b>{atacante?.nome ?? 'Sua peça'}</b></span>
          <span><small>Alvo</small><b>{alvo?.nome ?? 'Selecione no mapa'}</b></span>
        </div>
      )}

      {perfil === 'jogador' && !alvo && !soproSelecionado ? <small className="dica-acao-jogador">Selecione no mapa a peça que deseja atingir.</small> : null}
      {perfil === 'mestre' && atacantesMestre.length === 0 ? <small className="dica-acao-jogador">Adicione um NPC ou monstro para usar ações do mestre.</small> : null}

      <div className={`botoes-acoes-visuais ${perfil === 'jogador' ? 'duas-acoes' : 'acoes-mestre-grandes'}`}>
        {perfil === 'mestre' ? (
          <button
            className={`acao-visual acao-mover ${movimentoLivreMestre ? 'acao-visual-ativa' : ''}`}
            onClick={aoAlternarMovimentoLivreMestre}
            type="button"
          >
            <span>✥</span>
            <b>Movimentar</b>
            <small>{movimentoLivreMestre ? 'Reposicionamento livre' : 'Respeitando deslocamento'}</small>
          </button>
        ) : null}
        {(perfil === 'jogador' ? ACOES.filter((acao) => acao.tipo !== 'magia') : ACOES).map((acao) => (
          <button
            className={`acao-visual acao-${acao.tipo}`}
            disabled={!podeAtacar}
            key={acao.tipo}
            onClick={() => aoExecutar(acao.tipo)}
            type="button"
          >
            <span>{acao.icone}</span>
            <b>{acao.rotulo}</b>
            <small>{acao.tipo === 'espada' ? 'Ataque corpo a corpo' : acao.tipo === 'flecha' ? 'Ataque à distância' : 'Efeito mágico genérico'}</small>
          </button>
        ))}
      </div>

      {perfil === 'jogador' && soproDraconico ? (
        <div className={`acao-racial-draconato ${soproSelecionado ? 'acao-racial-ativa' : ''}`}>
          <button className="botao-acao-racial" onClick={aoPrepararSopro} type="button">
            <span className="icone-acao-racial">🔥</span>
            <span><b>Sopro Dracônico</b><small>{soproDraconico.ancestralNome} · {soproDraconico.tipoDano} · {soproDraconico.forma === 'cone' ? `cone ${soproDraconico.comprimentoMetros} m` : `linha ${soproDraconico.larguraMetros ?? 1.5} × ${soproDraconico.comprimentoMetros} m`}</small></span>
            <span className="selo-acao-racial">Ação racial</span>
          </button>
          {soproSelecionado ? (
            <div className="preparacao-acao-racial">
              <small>{soproPronto ? 'Área definida. Confirme para exibir o sopro.' : 'Clique no grid para escolher a direção do sopro.'}</small>
              <div>
                <button className="botao-cancelar-magia" onClick={aoCancelarSopro} type="button">Cancelar</button>
                <button className="botao-conjurar-magia" disabled={!soproPronto} onClick={aoExecutarSopro} type="button">Executar sopro</button>
              </div>
            </div>
          ) : null}
          <small className="observacao-acao-racial">Área visual: {soproDraconico.forma === 'cone' ? `cone de ${soproDraconico.comprimentoMetros} m` : `linha de ${soproDraconico.larguraMetros ?? 1.5} × ${soproDraconico.comprimentoMetros} m`}. A resolução das regras continua na mesa.</small>
        </div>
      ) : null}
    </section>
  );
}
