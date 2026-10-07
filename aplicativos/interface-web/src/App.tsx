import { PaginaDiagnostico } from './paginas/PaginaDiagnostico';
import { PaginaEntrar } from './paginas/PaginaEntrar';
import { PaginaInicial } from './paginas/PaginaInicial';
import { PaginaMestre } from './paginas/PaginaMestre';
import { PaginaSobre } from './paginas/PaginaSobre';

export function App(): React.JSX.Element {
  const caminho = window.location.pathname;
  if (caminho.startsWith('/sobre')) return <PaginaSobre />;
  if (caminho.startsWith('/diagnostico')) return <PaginaDiagnostico />;
  if (caminho.startsWith('/mestre')) return <PaginaMestre />;
  if (caminho.startsWith('/entrar')) return <PaginaEntrar />;
  return <PaginaInicial />;
}
