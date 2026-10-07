import type { PointerEvent } from 'react';

type DirecaoDivisor = 'vertical' | 'horizontal';

interface PropriedadesDivisorLayout {
  direcao: DirecaoDivisor;
  titulo: string;
  aoIniciar: (evento: PointerEvent<HTMLDivElement>) => void;
}

export function DivisorLayout({ direcao, titulo, aoIniciar }: PropriedadesDivisorLayout): React.JSX.Element {
  return (
    <div
      aria-label={titulo}
      className={`divisor-layout divisor-layout-${direcao}`}
      onPointerDown={aoIniciar}
      role="separator"
      title={titulo}
    >
      <span />
    </div>
  );
}
