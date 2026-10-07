import { z } from 'zod';

export const esquemaPresencaEntidade = z.object({
  codigoSessao: z.string().length(6),
  entidadeId: z.string().min(1),
  presenteNoMapa: z.boolean()
});

export type PresencaEntidade = z.infer<typeof esquemaPresencaEntidade>;
