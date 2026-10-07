import { z } from 'zod';

const tamanhos = ['miudo', 'pequeno', 'medio', 'grande', 'enorme', 'imenso'] as const;

export const esquemaCriacaoEntidade = z.object({
  codigoSessao: z.string().length(6),
  nome: z.string().trim().min(1).max(50),
  tipo: z.enum(['personagem', 'npc', 'monstro']),
  tamanhoCriatura: z.enum(tamanhos).default('medio'),
  quantidade: z.number().int().min(1).max(20).default(1),
  imagemToken: z.string().max(2_000_000).refine((valor) => valor.startsWith('data:image/'), 'Imagem invalida').optional()
});

export type CriacaoEntidade = z.infer<typeof esquemaCriacaoEntidade>;
