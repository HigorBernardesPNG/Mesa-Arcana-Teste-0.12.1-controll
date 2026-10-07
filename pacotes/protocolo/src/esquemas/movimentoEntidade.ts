import { z } from 'zod';

export const esquemaMovimentoEntidade = z.object({
  codigoSessao: z.string().trim().min(4).max(12).transform((valor) => valor.toUpperCase()),
  entidadeId: z.string().trim().min(1),
  coluna: z.number().int().positive(),
  linha: z.number().int().positive(),
  ignorarLimiteMovimento: z.boolean().optional()
});

export type MovimentoEntidade = z.infer<typeof esquemaMovimentoEntidade>;
