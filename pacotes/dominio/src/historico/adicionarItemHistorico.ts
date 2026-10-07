import type { EstadoSessao, ItemHistorico } from '../sessao/EstadoSessao.js';

function gerarIdentificador(): string {
  const cryptoDisponivel = globalThis.crypto;
  if (cryptoDisponivel && typeof cryptoDisponivel.randomUUID === 'function') {
    return cryptoDisponivel.randomUUID();
  }

  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}

export function adicionarItemHistorico(
  estado: EstadoSessao,
  item: Omit<ItemHistorico, 'id' | 'criadoEm'>
): ItemHistorico {
  const novoItem: ItemHistorico = {
    id: gerarIdentificador(),
    criadoEm: new Date().toISOString(),
    ...item
  };

  estado.historico.push(novoItem);

  if (estado.historico.length > 200) {
    estado.historico.splice(0, estado.historico.length - 200);
  }

  return novoItem;
}
