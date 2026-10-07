import { z } from 'zod';

export const esquemaConjuracaoMagia = z.object({
  codigoSessao: z.string().trim().min(4).max(12).transform((valor) => valor.toUpperCase()),
  conjuradorId: z.string().uuid(),
  magiaId: z.string().trim().min(1).max(120),
  alvoId: z.string().uuid().optional(),
  ponto: z.object({
    coluna: z.number().int().min(1).max(200),
    linha: z.number().int().min(1).max(200)
  }).optional()
});

export type ConjuracaoMagia = z.infer<typeof esquemaConjuracaoMagia>;
