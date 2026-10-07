import { useEffect, useState } from 'react';
import {
  RACAS_PERSONAGEM,
  nomeRacaCompleto,
  TAMANHOS_CRIATURA,
  movimentoRestanteMetros,
  nomeTamanhoCriatura,
  type EntidadeMapa,
  type TamanhoCriatura
} from '@mesa-rpg/dominio';

export interface DadosPrivadosEntidadeEditados {
  pontosVidaAtual: number;
  pontosVidaMaximo: number;
  classeArmadura: number;
  deslocamento: number;
  tamanhoCriatura: TamanhoCriatura;
  nomeAtaque: string;
  bonusAtaque: number;
  danoAtaque: string;
}

interface PropriedadesPainelEntidadeMestre {
  entidade: EntidadeMapa | undefined;
  aoSalvarDadosPrivados: (dados: DadosPrivadosEntidadeEditados) => void;
  aoAlternarMorte: (entidadeId: string, morto: boolean) => void;
  tochaAcesa: boolean;
  aoAlternarTocha: (entidadeId: string, ativa: boolean) => void;
  aoRetirarDoGrid: () => void;
  aoExcluirDaCampanha: () => void;
  jogadorConectado?: boolean;
}

export function PainelEntidadeMestre({
  entidade,
  aoSalvarDadosPrivados,
  aoAlternarMorte,
  tochaAcesa,
  aoAlternarTocha,
  aoRetirarDoGrid,
  aoExcluirDaCampanha,
  jogadorConectado = false
}: PropriedadesPainelEntidadeMestre): React.JSX.Element {
  const [pontosVidaAtual, setPontosVidaAtual] = useState(10);
  const [pontosVidaMaximo, setPontosVidaMaximo] = useState(10);
  const [classeArmadura, setClasseArmadura] = useState(10);
  const [deslocamento, setDeslocamento] = useState(9);
  const [tamanhoCriatura, setTamanhoCriatura] = useState<TamanhoCriatura>('medio');
  const [nomeAtaque, setNomeAtaque] = useState('Ataque');
  const [bonusAtaque, setBonusAtaque] = useState(0);
  const [danoAtaque, setDanoAtaque] = useState('1d4');

  useEffect(() => {
    if (!entidade) return;
    setPontosVidaAtual(entidade.pontosVidaAtual ?? 10);
    setPontosVidaMaximo(entidade.pontosVidaMaximo ?? 10);
    setClasseArmadura(entidade.classeArmadura ?? 10);
    setDeslocamento(entidade.deslocamento ?? 9);
    setTamanhoCriatura(entidade.tamanhoCriatura);
    setNomeAtaque(entidade.nomeAtaque ?? 'Ataque');
    setBonusAtaque(entidade.bonusAtaque ?? 0);
    setDanoAtaque(entidade.danoAtaque ?? '1d4');
  }, [entidade?.id, entidade?.pontosVidaAtual, entidade?.pontosVidaMaximo, entidade?.classeArmadura, entidade?.deslocamento, entidade?.tamanhoCriatura, entidade?.nomeAtaque, entidade?.bonusAtaque, entidade?.danoAtaque]);

  if (!entidade) return <p className="texto-secundario">Selecione uma peça no mapa.</p>;

  const possuiDadosPrivados = !entidade.controladorJogadorId;
  const nomeRaca = entidade.racaPersonagem
    ? nomeRacaCompleto(entidade.racaPersonagem, entidade.varianteRacialPersonagem)
    : undefined;

  return (
    <>
      <div className="cartao-entidade">
        <span className="retrato-entidade" style={entidade.imagemToken ? { backgroundImage: `url(${entidade.imagemToken})` } : undefined}>
          {entidade.imagemToken ? '' : entidade.nome.slice(0, 1)}
        </span>
        <div><strong>{entidade.nome}</strong><small>{entidade.tipo}{nomeRaca ? ` · ${nomeRaca}` : ''}</small></div>
      </div>

      <div className="linha-dado"><span>Posição</span><b>{entidade.posicao.coluna},{entidade.posicao.linha}</b></div>
      <div className="linha-dado"><span>Tamanho</span><b>{nomeTamanhoCriatura(entidade.tamanhoCriatura)}</b></div>
      {entidade.deslocamento !== undefined ? <div className="linha-dado"><span>Movimento restante</span><b>{movimentoRestanteMetros(entidade)} / {entidade.deslocamento} m</b></div> : null}

      {possuiDadosPrivados ? (
        <>
          <div className="editor-movimento-visual">
            <div className="cabecalho-editor-privado">
              <strong>Representação no mapa</strong>
              <small>Dados que interferem diretamente no grid.</small>
            </div>
            <div className="duas-colunas">
              <label>Deslocamento (m)<input type="number" min="0" step="1.5" value={deslocamento} onChange={(e) => setDeslocamento(Number(e.target.value))} /></label>
              <label>Tamanho
                <select value={tamanhoCriatura} onChange={(e) => setTamanhoCriatura(e.target.value as TamanhoCriatura)}>
                  {TAMANHOS_CRIATURA.map((tamanho) => <option key={tamanho.id} value={tamanho.id}>{tamanho.nome}</option>)}
                </select>
              </label>
            </div>
            <button
              className="botao-compacto"
              type="button"
              onClick={() => aoSalvarDadosPrivados({
                pontosVidaAtual,
                pontosVidaMaximo,
                classeArmadura,
                deslocamento,
                tamanhoCriatura,
                nomeAtaque,
                bonusAtaque,
                danoAtaque
              })}
            >
              Aplicar no mapa
            </button>
          </div>

          <details className="detalhes-ficha-opcional">
            <summary>Dados opcionais da ficha</summary>
            <small>PV, CA e dano ficam disponíveis apenas como apoio do mestre e não são o foco da Mesa Arcana.</small>
            <div className="duas-colunas">
              <label>PV atual<input type="number" min="0" value={pontosVidaAtual} onChange={(e) => setPontosVidaAtual(Number(e.target.value))} /></label>
              <label>PV máximo<input type="number" min="1" value={pontosVidaMaximo} onChange={(e) => setPontosVidaMaximo(Number(e.target.value))} /></label>
            </div>
            <label>CA<input type="number" min="0" value={classeArmadura} onChange={(e) => setClasseArmadura(Number(e.target.value))} /></label>
            <label>Nome do ataque<input value={nomeAtaque} onChange={(e) => setNomeAtaque(e.target.value)} /></label>
            <div className="duas-colunas">
              <label>Bônus<input type="number" value={bonusAtaque} onChange={(e) => setBonusAtaque(Number(e.target.value))} /></label>
              <label>Dano<input value={danoAtaque} onChange={(e) => setDanoAtaque(e.target.value)} placeholder="1d6 + 2" /></label>
            </div>
            <button
              className="botao-compacto"
              type="button"
              onClick={() => aoSalvarDadosPrivados({
                pontosVidaAtual,
                pontosVidaMaximo,
                classeArmadura,
                deslocamento,
                tamanhoCriatura,
                nomeAtaque,
                bonusAtaque,
                danoAtaque
              })}
            >
              Salvar dados opcionais
            </button>
          </details>
        </>
      ) : (
        <p className="texto-secundario">Raça, tamanho e deslocamento são usados apenas para a representação visual e movimento no grid; a ficha continua externa.</p>
      )}

      <button
        className={`botao-tocha ${tochaAcesa ? 'botao-tocha-acesa' : ''}`}
        onClick={() => aoAlternarTocha(entidade.id, !tochaAcesa)}
        type="button"
      >
        {tochaAcesa ? '🔥 Apagar tocha' : '🔥 Acender tocha'}
      </button>

      <button
        className={`botao-estado-morte ${entidade.morto ? 'botao-reanimar' : ''}`}
        onClick={() => aoAlternarMorte(entidade.id, !entidade.morto)}
        type="button"
      >
        {entidade.morto ? 'Remover marca de morte' : '✕ Marcar como morto'}
      </button>

      <div className="acoes-entidade-campanha">
        <button className="botao-secundario" onClick={aoRetirarDoGrid} type="button">Retirar do grid</button>
        {entidade.controladorJogadorId ? (
          <button
            className="botao-perigo"
            disabled={jogadorConectado}
            onClick={aoExcluirDaCampanha}
            title={jogadorConectado ? 'O jogador precisa sair da sessão antes de o personagem ser excluído da campanha.' : 'Exclui definitivamente o token e o personagem salvo desta campanha.'}
            type="button"
          >
            {jogadorConectado ? 'Jogador conectado' : 'Excluir personagem da campanha'}
          </button>
        ) : <button className="botao-perigo" onClick={aoExcluirDaCampanha} type="button">Excluir da campanha</button>}
      </div>
    </>
  );
}
