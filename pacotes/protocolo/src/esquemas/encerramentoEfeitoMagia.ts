import { z } from 'zod';

export const esquemaEncerramentoEfeitoMagia = z.object({
  codigoSessao: z.string().trim().min(4).max(12).transform((valor) => valor.toUpperCase()),
  efeitoId: z.string().uuid()
});

export type EncerramentoEfeitoMagia = z.infer<typeof esquemaEncerramentoEfeitoMagia>;
