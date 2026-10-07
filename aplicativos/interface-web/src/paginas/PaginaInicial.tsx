function navegar(caminho: string): void {
  window.location.href = caminho;
}

export function PaginaInicial(): React.JSX.Element {
  return (
    <main className="pagina-centralizada pagina-inicial-arcana">
      <section className="cartao-inicial">
        <div className="marca"><span className="marca-simbolo marca-simbolo-grande" aria-hidden="true">✦</span>Mesa Arcana</div>
        <p className="subtitulo">Dê forma visual às suas aventuras em rede local.</p>
        <button className="selo-inicial-mvp" type="button" onClick={() => navegar('/sobre')}>MVP 0.1 · RC2 · {__MESA_ARCANA_VERSION__}</button>
        <div className="acoes-iniciais">
          <button className="botao-principal" onClick={() => navegar('/mestre?nova=1')}>Nova campanha</button>
          <button className="botao-secundario" onClick={() => navegar('/mestre?carregar=1')}>Carregar campanha</button>
          <button className="botao-secundario" onClick={() => navegar('/entrar')}>Entrar em sessão</button>
        </div>
        <small>Campanhas podem ser salvas localmente e exportadas para outro computador.</small>
      </section>
    </main>
  );
}
