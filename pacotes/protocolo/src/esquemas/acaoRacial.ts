import { z } from 'zod';

export const esquemaAcaoRacial = z.object({
  codigoSessao: z.string().trim().min(1),
  entidadeId: z.string().uuid(),
  tipo: z.literal('sopro-draconico'),
  ponto: z.object({
    coluna: z.number().int().min(1),
    linha: z.number().int().min(1)
  })
});

export type AcaoRacial = z.infer<typeof esquemaAcaoRacial>;
