export function PaginaSobre(): React.JSX.Element {
  return (
    <main className="pagina-sobre">
      <section className="cartao-sobre">
        <div className="marca-sobre">
          <span className="marca-simbolo marca-simbolo-grande" aria-hidden="true">✦</span>
          <div>
            <h1>Mesa Arcana</h1>
            <p>Apoio visual para RPG de mesa em rede local.</p>
          </div>
        </div>

        <div className="selo-versao-mvp">MVP 0.12 · Distribuição de teste</div>
        <dl className="informacoes-sobre">
          <div><dt>Versão técnica</dt><dd>{__MESA_ARCANA_VERSION__}</dd></div>
          <div><dt>Estado</dt><dd>Teste controlado com validação remota</dd></div>
          <div><dt>Distribuição atual</dt><dd>Teste · disponibilidade controlada remotamente</dd></div>
        </dl>

        <div className="grade-sobre">
          <article>
            <h2>O que o MVP entrega</h2>
            <p>Mapa e grid, movimentação, alcance e áreas, entidades, efeitos visuais, magias, iluminação, histórico, sessão LAN e campanhas persistentes.</p>
          </article>
          <article>
            <h2>O que ele não tenta substituir</h2>
            <p>Ficha completa, rolagens presenciais, interpretação do Mestre, paredes/cobertura e automação integral das regras.</p>
          </article>
        </div>

        <div className="acoes-sobre">
          <button type="button" onClick={() => { window.location.href = '/mestre'; }}>Voltar ao Mestre</button>
          {window.mesaArcana?.aplicativoDesktop ? (
            <button type="button" onClick={() => { window.location.href = '/diagnostico'; }}>Executar diagnóstico</button>
          ) : null}
        </div>
      </section>
    </main>
  );
}
