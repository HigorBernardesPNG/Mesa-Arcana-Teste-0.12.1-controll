import { io, type Socket } from 'socket.io-client';
import type {
  EventosClienteParaServidor,
  EventosServidorParaCliente
} from '@mesa-rpg/protocolo';

function obterEnderecoServidor(): string {
  const host = window.location.hostname || 'localhost';
  return `http://${host}:3210`;
}

export const socket: Socket<EventosServidorParaCliente, EventosClienteParaServidor> = io(
  obterEnderecoServidor(),
  { autoConnect: true }
);

export const enderecoServidor = obterEnderecoServidor();
