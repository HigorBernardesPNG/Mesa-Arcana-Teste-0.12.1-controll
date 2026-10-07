const pecas = [
  { nome: 'Heroi', classe: 'peca peca-azul', coluna: 4, linha: 5 },
  { nome: 'Luna', classe: 'peca peca-verde', coluna: 6, linha: 5 },
  { nome: 'Goblin', classe: 'peca peca-vermelha', coluna: 7, linha: 2 },
  { nome: 'Mago', classe: 'peca peca-roxa', coluna: 9, linha: 7 }
];

export function GradeDemonstracao(): React.JSX.Element {
  return (
    <div className="mapa-demonstracao" aria-label="Mapa de demonstracao">
      <div className="grade" />
      {pecas.map((peca) => (
        <div
          className={peca.classe}
          key={peca.nome}
          title={peca.nome}
          style={{
            left: `calc(${peca.coluna} * 8.333% - 24px)`,
            top: `calc(${peca.linha} * 10% - 24px)`
          }}
        >
          {peca.nome.slice(0, 1)}
        </div>
      ))}
    </div>
  );
}
