import { z } from 'zod';

export const esquemaConfiguracaoCampanha = z.object({
  codigoSessao: z.string().length(6),
  nomeCampanha: z.string().trim().min(1).max(80)
});

export type ConfiguracaoCampanha = z.infer<typeof esquemaConfiguracaoCampanha>;
