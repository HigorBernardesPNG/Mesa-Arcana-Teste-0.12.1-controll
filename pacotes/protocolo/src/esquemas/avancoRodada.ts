import { z } from 'zod';

export const esquemaAvancoRodada = z.object({
  codigoSessao: z.string().trim().min(4).max(12).transform((valor) => valor.toUpperCase())
});

export type AvancoRodada = z.infer<typeof esquemaAvancoRodada>;
