import { useMemo, useState, type CSSProperties, type PointerEvent as ReactPointerEvent } from 'react';

type DimensaoLayout = 'esquerda' | 'direita' | 'rodape' | 'acoes';

interface TamanhosLayout {
  esquerda: number;
  direita: number;
  rodape: number;
  acoes: number;
}

const PADRAO: TamanhosLayout = { esquerda: 244, direita: 270, rodape: 242, acoes: 600 };

function limitar(valor: number, minimo: number, maximo: number): number {
  return Math.max(minimo, Math.min(maximo, valor));
}

function carregar(chave: string): TamanhosLayout {
  try {
    const salvo = window.localStorage.getItem(chave);
    if (!salvo) return PADRAO;
    const dados = JSON.parse(salvo) as Partial<TamanhosLayout>;
    return {
      esquerda: limitar(Number(dados.esquerda ?? PADRAO.esquerda), 180, 420),
      direita: limitar(Number(dados.direita ?? PADRAO.direita), 190, 420),
      rodape: limitar(Number(dados.rodape ?? PADRAO.rodape), 120, 360),
      acoes: limitar(Number(dados.acoes ?? PADRAO.acoes), 280, 760)
    };
  } catch {
    return PADRAO;
  }
}

export function useLayoutRedimensionavel(chave: string) {
  const [tamanhos, setTamanhos] = useState<TamanhosLayout>(() => carregar(chave));

  function salvar(novos: TamanhosLayout): void {
    setTamanhos(novos);
    try {
      window.localStorage.setItem(chave, JSON.stringify(novos));
    } catch {
      // O layout continua funcional mesmo se o navegador bloquear armazenamento local.
    }
  }

  function iniciar(dimensao: DimensaoLayout, evento: ReactPointerEvent<HTMLDivElement>): void {
    if (window.innerWidth <= 760) return;
    evento.preventDefault();
    const inicial = { ...tamanhos };
    const xInicial = evento.clientX;
    const yInicial = evento.clientY;

    const mover = (movimento: PointerEvent): void => {
      setTamanhos((atual) => {
        const base = { ...atual };
        const larguraMinimaCentro = 430;
        const espacosFixos = 54;

        if (dimensao === 'esquerda') {
          const maximo = Math.max(180, window.innerWidth - base.direita - larguraMinimaCentro - espacosFixos);
          base.esquerda = limitar(inicial.esquerda + (movimento.clientX - xInicial), 180, maximo);
        } else if (dimensao === 'direita') {
          const maximo = Math.max(190, window.innerWidth - base.esquerda - larguraMinimaCentro - espacosFixos);
          base.direita = limitar(inicial.direita - (movimento.clientX - xInicial), 190, maximo);
        } else if (dimensao === 'rodape') {
          const maximo = Math.max(140, window.innerHeight - 330);
          base.rodape = limitar(inicial.rodape - (movimento.clientY - yInicial), 120, maximo);
        } else {
          const maximo = Math.max(320, window.innerWidth - 430);
          base.acoes = limitar(inicial.acoes + (movimento.clientX - xInicial), 280, maximo);
        }
        return base;
      });
    };

    const terminar = (): void => {
      window.removeEventListener('pointermove', mover);
      window.removeEventListener('pointerup', terminar);
      setTamanhos((atuais) => {
        try { window.localStorage.setItem(chave, JSON.stringify(atuais)); } catch { /* sem persistência */ }
        return atuais;
      });
      document.body.classList.remove('redimensionando-layout');
    };

    document.body.classList.add('redimensionando-layout');
    window.addEventListener('pointermove', mover);
    window.addEventListener('pointerup', terminar, { once: true });
  }

  const estilo = useMemo(() => ({
    '--largura-painel-esquerdo': `${tamanhos.esquerda}px`,
    '--largura-painel-direito': `${tamanhos.direita}px`,
    '--altura-rodape-mesa': `${tamanhos.rodape}px`,
    '--largura-painel-acoes': `${tamanhos.acoes}px`
  }) as CSSProperties, [tamanhos]);

  function restaurar(): void {
    salvar(PADRAO);
  }

  return { tamanhos, estilo, iniciar, restaurar };
}
