import { formatarTempoJogo, type EfeitoMagiaAtivo, type EntidadeMapaBase } from '@mesa-rpg/dominio';

interface PropriedadesPainelEfeitosAtivos {
  efeitos: EfeitoMagiaAtivo[];
  entidades: EntidadeMapaBase[];
  rodadaAtual: number;
  perfil: 'mestre' | 'jogador';
  entidadeJogadorId?: string | undefined;
  aoAvancarRodada?: (() => void) | undefined;
  aoEncerrar: (efeitoId: string) => void;
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

function nomeCasa(coluna: number, linha: number): string {
  return `${nomeColuna(coluna)}${linha}`;
}

function afetaEntidade(efeito: EfeitoMagiaAtivo, entidade: EntidadeMapaBase): boolean {
  if (efeito.alvoIds.includes(entidade.id)) return true;
  return efeito.casas.some((casa) => casa.coluna === entidade.posicao.coluna && casa.linha === entidade.posicao.linha);
}

export function PainelEfeitosAtivos({
  efeitos,
  entidades,
  rodadaAtual,
  perfil,
  entidadeJogadorId,
  aoAvancarRodada,
  aoEncerrar
}: PropriedadesPainelEfeitosAtivos): React.JSX.Element {
  const entidadeJogador = entidadeJogadorId ? entidades.find((entidade) => entidade.id === entidadeJogadorId) : undefined;
  const visiveis = perfil === 'mestre'
    ? efeitos
    : efeitos.filter((efeito) => {
        if (!entidadeJogador) return false;
        return efeito.conjuradorId === entidadeJogador.id || afetaEntidade(efeito, entidadeJogador);
      });

  return (
    <section className={`painel-efeitos-ativos ${perfil}`}>
      <div className="cabecalho-efeitos-ativos">
        <div><strong>Efeitos ativos</strong><small>Rodada {rodadaAtual}</small></div>
        {perfil === 'mestre' && aoAvancarRodada ? (
          <button className="botao-avancar-rodada" type="button" onClick={aoAvancarRodada}>Avançar rodada</button>
        ) : null}
      </div>

      {visiveis.length === 0 ? (
        <small className="texto-secundario">Nenhum efeito persistente relevante.</small>
      ) : (
        <div className="lista-efeitos-ativos">
          {visiveis.map((efeito) => {
            const conjurador = entidades.find((entidade) => entidade.id === efeito.conjuradorId);
            const alvos = efeito.alvoIds
              .map((id) => entidades.find((entidade) => entidade.id === id)?.nome)
              .filter((nome): nome is string => Boolean(nome));
            const podeEncerrar = perfil === 'mestre' || efeito.conjuradorId === entidadeJogadorId;
            return (
              <article className="item-efeito-ativo" key={efeito.id}>
                <div className="linha-efeito-ativo">
                  <span className="icone-efeito-ativo">✦</span>
                  <div><b>{efeito.nomeMagia}</b><small>{efeito.concentracao ? 'Concentração · ' : ''}{formatarTempoJogo(efeito.segundosRestantes)}</small></div>
                  {podeEncerrar ? <button type="button" onClick={() => aoEncerrar(efeito.id)}>Encerrar</button> : null}
                </div>
                <small>
                  {efeito.vinculo === 'area'
                    ? `Área persistente${efeito.pontoOrigem ? ` · origem ${nomeCasa(efeito.pontoOrigem.coluna, efeito.pontoOrigem.linha)}` : ''} · ${efeito.casas.length} casa${efeito.casas.length === 1 ? '' : 's'}`
                    : `Aplicada em: ${alvos.length > 0 ? alvos.join(', ') : conjurador?.nome ?? 'efeito pessoal'}`}
                </small>
              </article>
            );
          })}
        </div>
      )}
    </section>
  );
}
