import { useEffect, useMemo, useState } from 'react';
import {
  obterDisponibilidadesMagiaPersonagem,
  magiaExigeVisao,
  type ClassePersonagem,
  type DefinicaoMagia,
  type DisponibilidadeMagiaPersonagem,
  type RacaPersonagem,
  type VarianteRacialPersonagem
} from '@mesa-rpg/dominio';

interface PropriedadesPainelMagias {
  classe: ClassePersonagem;
  nivel: number;
  raca: RacaPersonagem;
  varianteRacial?: VarianteRacialPersonagem | undefined;
  magiasSelecionadasIds: string[];
  magiaRacialEscolhidaId?: string | undefined;
  magiaSelecionadaId?: string | undefined;
  quantidadeAfetados: number;
  podeConjurar: boolean;
  motivoIndisponivel?: string | undefined;
  aoAlterarMagiasSelecionadas: (ids: string[], magiaRacialEscolhidaId?: string) => void;
  aoSelecionar: (magia: DefinicaoMagia) => void;
  aoConjurar: () => void;
  aoCancelar: () => void;
}

function nivelRotulo(nivel: number): string {
  return nivel === 0 ? 'Truque' : `Magia ${nivel}º`;
}

function areaRotulo(magia: DefinicaoMagia): string {
  if (magia.formaArea === 'alvo') return 'Alvo';
  if (magia.formaArea === 'pessoal') return 'Pessoal';
  if (magia.formaArea === 'aura') return `Aura ${magia.tamanhoAreaMetros ?? '?'} m`;
  if (magia.formaArea === 'esfera' || magia.formaArea === 'cilindro') return `${magia.formaArea} ${magia.tamanhoAreaMetros ?? '?'} m`;
  if (magia.formaArea === 'cubo') return `Cubo ${magia.tamanhoAreaMetros ?? '?'} m`;
  return `${magia.formaArea} ${magia.tamanhoAreaMetros ?? '?'} m`;
}

function ehAcaoBonus(magia: DefinicaoMagia): boolean {
  return magia.tempoConjuracao.toLocaleLowerCase('pt-BR').includes('ação bônus');
}

function MarcadoresMagia({ disponibilidade, racialAtiva = disponibilidade.origemRacial }: { disponibilidade: DisponibilidadeMagiaPersonagem; racialAtiva?: boolean }): React.JSX.Element {
  const { magia } = disponibilidade;
  return (
    <span className="marcadores-magia">
      <span className={magia.nivel === 0 ? 'selo-magia selo-truque' : 'selo-magia selo-nivel'}>{nivelRotulo(magia.nivel)}</span>
      {ehAcaoBonus(magia) ? <span className="selo-magia selo-acao-bonus">Ação bônus</span> : null}
      {racialAtiva ? <span className="selo-magia selo-racial">Racial</span> : null}
    </span>
  );
}

export function PainelMagias({
  classe,
  nivel,
  raca,
  varianteRacial,
  magiasSelecionadasIds,
  magiaRacialEscolhidaId,
  magiaSelecionadaId,
  quantidadeAfetados,
  podeConjurar,
  motivoIndisponivel,
  aoAlterarMagiasSelecionadas,
  aoSelecionar,
  aoConjurar,
  aoCancelar
}: PropriedadesPainelMagias): React.JSX.Element {
  const disponibilidades = useMemo(
    () => obterDisponibilidadesMagiaPersonagem(classe, nivel, raca, varianteRacial),
    [classe, nivel, raca, varianteRacial]
  );
  const mapaDisponibilidades = useMemo(
    () => new Map(disponibilidades.map((item) => [item.magia.id, item])),
    [disponibilidades]
  );
  const magiasSelecionadas = useMemo(
    () => magiasSelecionadasIds.map((id) => mapaDisponibilidades.get(id)).filter((item): item is DisponibilidadeMagiaPersonagem => Boolean(item)),
    [magiasSelecionadasIds, mapaDisponibilidades]
  );
  const selecionada = magiaSelecionadaId ? mapaDisponibilidades.get(magiaSelecionadaId)?.magia : undefined;
  const [tooltip, setTooltip] = useState<{ item: DisponibilidadeMagiaPersonagem; x: number; y: number } | null>(null);
  const [configurando, setConfigurando] = useState(false);
  const [pesquisa, setPesquisa] = useState('');
  const [rascunho, setRascunho] = useState<string[]>(magiasSelecionadasIds);
  const [racialRascunho, setRacialRascunho] = useState<string | undefined>(magiaRacialEscolhidaId);

  useEffect(() => setRascunho(magiasSelecionadasIds), [magiasSelecionadasIds]);
  useEffect(() => setRacialRascunho(magiaRacialEscolhidaId), [magiaRacialEscolhidaId]);

  const candidatasFiltradas = useMemo(() => {
    const termo = pesquisa.trim().toLocaleLowerCase('pt-BR');
    if (!termo) return disponibilidades;
    return disponibilidades.filter(({ magia }) => magia.nome.toLocaleLowerCase('pt-BR').includes(termo));
  }, [disponibilidades, pesquisa]);

  function mostrarTooltip(item: DisponibilidadeMagiaPersonagem, x: number, y: number): void {
    const largura = 300;
    const alturaEstimada = 150;
    setTooltip({
      item,
      x: Math.max(10, Math.min(x + 14, window.innerWidth - largura)),
      y: Math.max(10, Math.min(y + 10, window.innerHeight - alturaEstimada))
    });
  }

  function alternarMagia(item: DisponibilidadeMagiaPersonagem): void {
    setRascunho((atuais) => {
      if (atuais.includes(item.magia.id)) {
        if (racialRascunho === item.magia.id) setRacialRascunho(undefined);
        return atuais.filter((id) => id !== item.magia.id);
      }

      // O Alto Elfo conhece um único truque racial da lista de Mago. Para classes
      // que não teriam esse truque por si só, a escolha já é tratada como racial.
      if (varianteRacial === 'alto-elfo' && item.origemRacial && !item.origemClasse) {
        const semOutroTruqueRacialExclusivo = atuais.filter((id) => {
          const existente = mapaDisponibilidades.get(id);
          return !(existente?.origemRacial && !existente.origemClasse);
        });
        setRacialRascunho(item.magia.id);
        return [...semOutroTruqueRacialExclusivo, item.magia.id];
      }

      return [...atuais, item.magia.id];
    });
  }

  function abrirConfiguracao(): void {
    setRascunho(magiasSelecionadasIds);
    setRacialRascunho(magiaRacialEscolhidaId);
    setPesquisa('');
    setConfigurando(true);
  }

  function salvarConfiguracao(): void {
    aoAlterarMagiasSelecionadas(rascunho, varianteRacial === 'alto-elfo' ? racialRascunho : undefined);
    setConfigurando(false);
  }

  return (
    <div className="painel-magias">
      <div className="cabecalho-magias">
        <div>
          <strong>Magias disponíveis</strong>
          <small>{magiasSelecionadas.length} selecionadas · {disponibilidades.length} elegíveis</small>
        </div>
        <button className="botao-gerenciar-magias" onClick={abrirConfiguracao} type="button">Gerenciar</button>
      </div>

      {magiasSelecionadas.length === 0 ? (
        <button className="estado-vazio-magias" onClick={abrirConfiguracao} type="button">
          <b>Escolher magias</b>
          <small>Selecione apenas as que deseja manter visíveis durante a sessão.</small>
        </button>
      ) : (
        <div className="lista-magias">
          {magiasSelecionadas.map((item) => (
            <button
              className={`item-magia ${item.magia.id === magiaSelecionadaId ? 'item-magia-selecionada' : ''}`}
              key={item.magia.id}
              onClick={() => aoSelecionar(item.magia)}
              onMouseEnter={(evento) => mostrarTooltip(item, evento.clientX, evento.clientY)}
              onMouseMove={(evento) => mostrarTooltip(item, evento.clientX, evento.clientY)}
              onMouseLeave={() => setTooltip(null)}
              onFocus={(evento) => {
                const caixa = evento.currentTarget.getBoundingClientRect();
                mostrarTooltip(item, caixa.right, caixa.top);
              }}
              onBlur={() => setTooltip(null)}
              type="button"
            >
              <span className="icone-magia">✦</span>
              <span className="nome-magia">
                <b>{item.magia.nome}</b>
                <MarcadoresMagia disponibilidade={item} racialAtiva={varianteRacial === 'alto-elfo' ? racialRascunho === item.magia.id : item.origemRacial} />
              </span>
            </button>
          ))}
        </div>
      )}

      {selecionada ? (
        <div className="magia-selecionada-resumo">
          <div><b>{selecionada.nome}</b><small>{selecionada.descricaoBreve}</small><small>{selecionada.resumo}</small></div>
          <div className="magia-metricas">
            <span>Área <b>{areaRotulo(selecionada)}</b></span>
            <span>Peças na área <b>{quantidadeAfetados}</b></span>
            <span>Visão <b>{magiaExigeVisao(selecionada) ? 'necessária' : 'não exigida'}</b></span>
          </div>
          <small className="dica-magia">
            {selecionada.formaArea === 'alvo'
              ? 'Selecione o alvo no mapa.'
              : selecionada.formaArea === 'aura' || selecionada.formaArea === 'pessoal'
                ? 'A área parte automaticamente do personagem.'
                : 'Clique no grid para posicionar ou direcionar a magia.'}
          </small>
          {motivoIndisponivel ? <small className="aviso-magia-bloqueada">{motivoIndisponivel}</small> : null}
          <div className="acoes-magia-selecionada">
            <button className="botao-cancelar-magia" onClick={aoCancelar} type="button">Cancelar</button>
            <button className="botao-conjurar-magia" disabled={!podeConjurar} onClick={aoConjurar} type="button">Conjurar</button>
          </div>
        </div>
      ) : null}

      {tooltip ? (
        <div className="tooltip-magia-flutuante" style={{ left: tooltip.x, top: tooltip.y }} role="tooltip">
          <b>{tooltip.item.magia.nome}</b>
          <MarcadoresMagia disponibilidade={tooltip.item} racialAtiva={varianteRacial === 'alto-elfo' ? racialRascunho === tooltip.item.magia.id : tooltip.item.origemRacial} />
          <small>{tooltip.item.magia.descricaoBreve}</small>
          <small>{tooltip.item.magia.resumo}</small>
          <small>Conjuração: {tooltip.item.magia.tempoConjuracao || 'especial'}</small>
          <small>Visão do alvo/ponto: {magiaExigeVisao(tooltip.item.magia) ? 'necessária' : 'não exigida pela descrição'}</small>
        </div>
      ) : null}

      {configurando ? (
        <div className="sobreposicao-modal-magias" role="presentation" onMouseDown={(evento) => { if (evento.target === evento.currentTarget) setConfigurando(false); }}>
          <section className="modal-magias" role="dialog" aria-modal="true" aria-label="Escolher magias visíveis">
            <header>
              <div><b>Escolher magias visíveis</b><small>Classe, nível e origem racial já limitam o catálogo.</small></div>
              <button onClick={() => setConfigurando(false)} type="button" aria-label="Fechar">×</button>
            </header>
            <input
              autoFocus
              className="pesquisa-magias"
              onChange={(evento) => setPesquisa(evento.target.value)}
              placeholder="Pesquisar pelo nome da magia..."
              type="search"
              value={pesquisa}
            />
            {varianteRacial === 'alto-elfo' ? <small className="aviso-regra-racial">Alto Elfo: entre os truques raciais exclusivos da lista de Mago, apenas um pode ser escolhido.</small> : null}
            <div className="lista-selecao-magias">
              {candidatasFiltradas.map((item) => {
                const marcada = rascunho.includes(item.magia.id);
                return (
                  <label className={`opcao-selecao-magia ${marcada ? 'opcao-selecao-magia-ativa' : ''}`} key={item.magia.id}>
                    <input checked={marcada} onChange={() => alternarMagia(item)} type="checkbox" />
                    <span className="conteudo-opcao-magia">
                      <b>{item.magia.nome}</b>
                      <MarcadoresMagia disponibilidade={item} racialAtiva={varianteRacial === 'alto-elfo' ? racialRascunho === item.magia.id : item.origemRacial} />
                      {varianteRacial === 'alto-elfo' && item.origemRacial ? (
                        <button
                          className={`botao-definir-racial ${racialRascunho === item.magia.id ? 'botao-definir-racial-ativo' : ''}`}
                          onClick={(evento) => {
                            evento.preventDefault();
                            evento.stopPropagation();
                            setRascunho((atuais) => atuais.includes(item.magia.id) ? atuais : [...atuais, item.magia.id]);
                            setRacialRascunho(item.magia.id);
                          }}
                          type="button"
                        >
                          {racialRascunho === item.magia.id ? '★ Truque racial escolhido' : '☆ Definir como truque racial'}
                        </button>
                      ) : null}
                      <small>{item.magia.alcanceTexto} · {item.magia.tempoConjuracao}</small>
                    </span>
                  </label>
                );
              })}
              {candidatasFiltradas.length === 0 ? <p className="texto-secundario">Nenhuma magia encontrada.</p> : null}
            </div>
            <footer>
              <span><b>{rascunho.length}</b> selecionadas</span>
              <div>
                <button className="botao-cancelar-magia" onClick={() => setConfigurando(false)} type="button">Cancelar</button>
                <button className="botao-conjurar-magia" onClick={salvarConfiguracao} type="button">Salvar seleção</button>
              </div>
            </footer>
          </section>
        </div>
      ) : null}
    </div>
  );
}
