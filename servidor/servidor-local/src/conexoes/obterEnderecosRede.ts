import { networkInterfaces } from 'node:os';

const PADRAO_INTERFACE_VIRTUAL = /virtual|vethernet|hyper-v|vmware|virtualbox|docker|wsl|tailscale|zerotier|hamachi|vpn|loopback|bluetooth/i;
const PADRAO_INTERFACE_FISICA = /wi-?fi|wireless|wlan|ethernet|rede local|lan/i;

function prioridadeIp(ip: string): number {
  if (ip.startsWith('192.168.')) return 0;
  if (ip.startsWith('10.')) return 1;
  const partes = ip.split('.').map(Number);
  if (partes[0] === 172 && (partes[1] ?? 0) >= 16 && (partes[1] ?? 0) <= 31) return 2;
  return 3;
}

function prioridadeInterface(nome: string, ip: string): number {
  let prioridade = prioridadeIp(ip) * 10;
  if (PADRAO_INTERFACE_FISICA.test(nome)) prioridade -= 5;
  if (PADRAO_INTERFACE_VIRTUAL.test(nome)) prioridade += 100;
  return prioridade;
}

export function obterEnderecosRede(porta: number): string[] {
  const interfaces = networkInterfaces();
  const enderecos: Array<{ ip: string; interface: string }> = [];

  for (const nomeInterface of Object.keys(interfaces)) {
    const enderecosInterface = interfaces[nomeInterface] ?? [];
    for (const endereco of enderecosInterface) {
      if (
        endereco.family === 'IPv4' &&
        !endereco.internal &&
        !endereco.address.startsWith('169.254.')
      ) {
        enderecos.push({ ip: endereco.address, interface: nomeInterface });
      }
    }
  }

  const unicos = new Map<string, { ip: string; interface: string }>();
  for (const endereco of enderecos) {
    if (!unicos.has(endereco.ip)) unicos.set(endereco.ip, endereco);
  }

  return [...unicos.values()]
    .sort((a, b) => prioridadeInterface(a.interface, a.ip) - prioridadeInterface(b.interface, b.ip))
    .map(({ ip }) => `http://${ip}:${porta}`);
}
