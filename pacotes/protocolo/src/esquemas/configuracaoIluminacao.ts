import { z } from 'zod';

export const esquemaConfiguracaoIluminacao = z.object({
  codigoSessao: z.string().min(1),
  nivelIluminacao: z.enum(['luz-plena', 'penumbra', 'escuridao'])
});

export type ConfiguracaoIluminacao = z.infer<typeof esquemaConfiguracaoIluminacao>;
