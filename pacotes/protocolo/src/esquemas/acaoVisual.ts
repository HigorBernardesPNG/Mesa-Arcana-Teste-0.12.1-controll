import { z } from 'zod';

export const esquemaAcaoVisual = z.object({
  codigoSessao: z.string().trim().min(1),
  atacanteId: z.string().uuid(),
  alvoId: z.string().uuid(),
  tipo: z.enum(['espada', 'flecha', 'magia'])
});

export type AcaoVisual = z.infer<typeof esquemaAcaoVisual>;
