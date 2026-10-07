import { z } from 'zod';

export const esquemaFonteLuz = z.object({
  codigoSessao: z.string().min(1),
  entidadeId: z.string().min(1),
  ativa: z.boolean()
});

export type FonteLuz = z.infer<typeof esquemaFonteLuz>;
