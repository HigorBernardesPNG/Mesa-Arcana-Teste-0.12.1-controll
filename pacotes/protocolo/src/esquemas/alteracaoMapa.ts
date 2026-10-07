import { z } from 'zod';

export const esquemaAlteracaoMapa = z.object({
  codigoSessao: z.string().trim().min(4).max(12).transform((valor) => valor.toUpperCase()),
  tema: z.enum(['ruinas', 'floresta', 'masmorra'])
});

export type AlteracaoMapa = z.infer<typeof esquemaAlteracaoMapa>;
