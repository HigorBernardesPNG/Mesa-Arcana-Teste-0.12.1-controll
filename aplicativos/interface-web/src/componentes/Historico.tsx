import type { ItemHistorico } from '@mesa-rpg/dominio';

interface PropriedadesHistorico {
  itens: ItemHistorico[];
}

export function Historico({ itens }: PropriedadesHistorico): React.JSX.Element {
  return (
    <section className="painel historico">
      <h2>Histórico</h2>
      <div className="lista-historico">
        {itens.length === 0 ? (
          <p className="texto-secundario">As ações confirmadas da sessão aparecerão aqui.</p>
        ) : (
          [...itens].reverse().map((item) => (
            <div className={`item-historico item-historico-${item.tipo}`} key={item.id}>
              <time>{new Date(item.criadoEm).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}</time>
              <div className="conteudo-item-historico">
                <span>{item.mensagem}</span>
                {item.detalhes && item.detalhes.length > 0 ? (
                  <details className="detalhes-historico">
                    <summary>Ver detalhes</summary>
                    {item.detalhes.map((detalhe, indice) => <small key={`${item.id}-${indice}`}>{detalhe}</small>)}
                  </details>
                ) : null}
              </div>
            </div>
          ))
        )}
      </div>
    </section>
  );
}
