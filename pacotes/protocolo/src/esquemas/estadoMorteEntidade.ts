import { z } from 'zod';

export const esquemaEstadoMorteEntidade = z.object({
  codigoSessao: z.string().trim().min(1),
  entidadeId: z.string().uuid(),
  morto: z.boolean()
});

export type EstadoMorteEntidade = z.infer<typeof esquemaEstadoMorteEntidade>;
