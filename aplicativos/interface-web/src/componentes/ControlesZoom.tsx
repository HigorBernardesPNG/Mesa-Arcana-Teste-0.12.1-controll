interface PropriedadesControlesZoom {
  zoom: number;
  aoAlterar: (zoom: number) => void;
}

const ZOOM_MINIMO = 1;
const ZOOM_MAXIMO = 2.5;
const PASSO = 0.25;

export function ControlesZoom({ zoom, aoAlterar }: PropriedadesControlesZoom): React.JSX.Element {
  function limitar(valor: number): number {
    return Math.min(ZOOM_MAXIMO, Math.max(ZOOM_MINIMO, Number(valor.toFixed(2))));
  }

  return (
    <div className="controles-zoom" aria-label="Controles de zoom do mapa">
      <button type="button" onClick={() => aoAlterar(limitar(zoom - PASSO))} disabled={zoom <= ZOOM_MINIMO} aria-label="Diminuir zoom">−</button>
      <button className="zoom-valor" type="button" onClick={() => aoAlterar(1)} title="Voltar para 100%">{Math.round(zoom * 100)}%</button>
      <button type="button" onClick={() => aoAlterar(limitar(zoom + PASSO))} disabled={zoom >= ZOOM_MAXIMO} aria-label="Aumentar zoom">+</button>
    </div>
  );
}
