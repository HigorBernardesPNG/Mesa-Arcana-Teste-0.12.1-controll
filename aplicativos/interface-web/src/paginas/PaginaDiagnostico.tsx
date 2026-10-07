import { useCallback, useEffect, useMemo, useState } from 'react';
import { enderecoServidor } from '../comunicacao/socket';

interface ResultadoHttp {
  ok: boolean;
  tempoMs?: number;
  mensagem: string;
  dados?: unknown;
}

interface RelatorioDiagnostico {
  geradoEm: string;
  desktop: DiagnosticoAplicativoDesktop | null;
  servidorJogo: ResultadoHttp;
  sessao: ResultadoHttp;
}

async function testarEndpoint(url: string): Promise<ResultadoHttp> {
  const inicio = performance.now();
  try {
    const resposta = await fetch(url, { cache: 'no-store' });
    const dados = await resposta.json().catch(() => null);
    const tempoMs = Math.round(performance.now() - inicio);
    return {
      ok: resposta.ok,
      tempoMs,
      mensagem: resposta.ok ? 'Respondendo normalmente.' : `Resposta HTTP ${resposta.status}.`,
      dados
    };
  } catch (erro) {
    return {
      ok: false,
      mensagem: erro instanceof Error ? erro.message : 'Falha de comunicação.'
    };
  }
}

function Status({ ok }: { ok: boolean }): React.JSX.Element {
  return <span className={ok ? 'status-diagnostico status-ok' : 'status-diagnostico status-falha'}>{ok ? 'OK' : 'Falha'}</span>;
}

export function PaginaDiagnostico(): React.JSX.Element {
  const [relatorio, setRelatorio] = useState<RelatorioDiagnostico | null>(null);
  const [executando, setExecutando] = useState(false);

  const executarDiagnostico = useCallback(async (): Promise<void> => {
    setExecutando(true);
    const [servidorJogo, sessao, desktop] = await Promise.all([
      testarEndpoint(`${enderecoServidor}/api/saude`),
      testarEndpoint(`${enderecoServidor}/api/sessao`),
      window.mesaArcana?.obterDiagnostico().catch(() => null) ?? Promise.resolve(null)
    ]);
    setRelatorio({ geradoEm: new Date().toISOString(), desktop, servidorJogo, sessao });
    setExecutando(false);
  }, []);

  useEffect(() => { void executarDiagnostico(); }, [executarDiagnostico]);

  const tudoOk = useMemo(() => Boolean(
    relatorio?.desktop?.servicos.interface.ativo &&
    relatorio?.desktop?.servicos.jogo.ativo &&
    relatorio?.desktop?.persistencia.ok &&
    relatorio?.servidorJogo.ok &&
    relatorio?.sessao.ok
  ), [relatorio]);

  function baixarRelatorio(): void {
    if (!relatorio) return;
    const blob = new Blob([JSON.stringify(relatorio, null, 2)], { type: 'application/json;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `mesa-arcana-diagnostico-${new Date().toISOString().replace(/[:.]/g, '-')}.json`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
  }

  return (
    <main className="pagina-diagnostico">
      <header className="cabecalho-diagnostico">
        <div>
          <strong className="marca-menor"><span className="marca-simbolo" aria-hidden="true">✦</span>Mesa Arcana</strong>
          <h1>Diagnóstico do aplicativo</h1>
          <p>Verificação local para confirmar se os componentes necessários à sessão estão funcionando.</p>
        </div>
        <div className="acoes-diagnostico">
          <button type="button" onClick={() => { window.location.href = '/mestre'; }}>Voltar ao Mestre</button>
          <button type="button" className="botao-principal-diagnostico" onClick={() => void executarDiagnostico()} disabled={executando}>{executando ? 'Verificando...' : 'Executar novamente'}</button>
        </div>
      </header>

      {!window.mesaArcana?.aplicativoDesktop ? (
        <div className="aviso-diagnostico">Esta tela foi criada para validar o aplicativo desktop do Mestre. Você está acessando pelo navegador.</div>
      ) : null}

      <section className={`resumo-diagnostico ${tudoOk ? 'resumo-ok' : 'resumo-atencao'}`}>
        <div>
          <span>Estado geral</span>
          <strong>{executando ? 'Verificando...' : tudoOk ? 'Mesa Arcana pronta para a sessão' : 'Há um item que precisa de atenção'}</strong>
        </div>
        <Status ok={tudoOk} />
      </section>

      <div className="grade-diagnostico">
        <article className="cartao-diagnostico">
          <header><h2>Aplicativo</h2><Status ok={Boolean(relatorio?.desktop)} /></header>
          <dl>
            <div><dt>Versão</dt><dd>{relatorio?.desktop?.aplicativo.versao ?? 'indisponível'}</dd></div>
            <div><dt>Modo</dt><dd>{relatorio?.desktop?.aplicativo.empacotado ? 'Instalado/empacotado' : 'Desenvolvimento'}</dd></div>
            <div><dt>Plataforma</dt><dd>{relatorio?.desktop ? `${relatorio.desktop.ambiente.plataforma} · ${relatorio.desktop.ambiente.arquitetura}` : 'indisponível'}</dd></div>
          </dl>
        </article>

        <article className="cartao-diagnostico">
          <header><h2>Servidor da sessão</h2><Status ok={Boolean(relatorio?.servidorJogo.ok && relatorio?.desktop?.servicos.jogo.ativo)} /></header>
          <dl>
            <div><dt>Porta</dt><dd>{relatorio?.desktop?.servicos.jogo.porta ?? 3210}</dd></div>
            <div><dt>Resposta</dt><dd>{relatorio?.servidorJogo.mensagem ?? 'aguardando'}</dd></div>
            <div><dt>Latência local</dt><dd>{relatorio?.servidorJogo.tempoMs != null ? `${relatorio.servidorJogo.tempoMs} ms` : '—'}</dd></div>
          </dl>
        </article>

        <article className="cartao-diagnostico">
          <header><h2>Interface do Mestre</h2><Status ok={Boolean(relatorio?.desktop?.servicos.interface.ativo)} /></header>
          <dl>
            <div><dt>Porta</dt><dd>{relatorio?.desktop?.servicos.interface.porta ?? 5173}</dd></div>
            <div><dt>Electron</dt><dd>{relatorio?.desktop?.ambiente.electron ?? '—'}</dd></div>
            <div><dt>Chromium</dt><dd>{relatorio?.desktop?.ambiente.chromium ?? '—'}</dd></div>
          </dl>
        </article>

        <article className="cartao-diagnostico">
          <header><h2>Campanhas e persistência</h2><Status ok={Boolean(relatorio?.desktop?.persistencia.ok)} /></header>
          <dl>
            <div><dt>Teste</dt><dd>{relatorio?.desktop?.persistencia.mensagem ?? 'aguardando'}</dd></div>
            <div className="linha-diagnostico-longa"><dt>Diretório</dt><dd>{relatorio?.desktop?.persistencia.caminho ?? '—'}</dd></div>
          </dl>
        </article>

        <article className="cartao-diagnostico cartao-diagnostico-largo">
          <header><h2>Rede local</h2><Status ok={Boolean(relatorio?.desktop?.rede.enderecosIPv4.length)} /></header>
          <p className="texto-diagnostico">Endereços detectados para conexão dos jogadores:</p>
          <div className="lista-enderecos-diagnostico">
            {(relatorio?.desktop?.rede.enderecosIPv4 ?? []).map((endereco) => <code key={endereco}>http://{endereco}:5173</code>)}
            {relatorio?.desktop && relatorio.desktop.rede.enderecosIPv4.length === 0 ? <span>Nenhum IPv4 de rede local detectado.</span> : null}
          </div>
        </article>

        <article className="cartao-diagnostico cartao-diagnostico-largo">
          <header><h2>Sessão atual</h2><Status ok={Boolean(relatorio?.sessao.ok)} /></header>
          <p className="texto-diagnostico">{relatorio?.sessao.mensagem ?? 'Aguardando teste.'}</p>
        </article>
      </div>

      <footer className="rodape-diagnostico">
        <span>Se houver um problema futuro, este relatório ajuda a comparar versão, ambiente e serviços sem depender do terminal.</span>
        <button type="button" onClick={baixarRelatorio} disabled={!relatorio}>Baixar relatório JSON</button>
      </footer>
    </main>
  );
}
