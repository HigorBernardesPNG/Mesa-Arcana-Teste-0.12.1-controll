import { z } from 'zod';

export const esquemaConfiguracaoMagiasJogador = z.object({
  codigoSessao: z.string().trim().min(4).max(12).transform((valor) => valor.toUpperCase()),
  magiasSelecionadasIds: z.array(z.string().trim().min(1).max(120)).max(400),
  magiaRacialEscolhidaId: z.string().trim().min(1).max(120).optional()
});

export type ConfiguracaoMagiasJogador = z.infer<typeof esquemaConfiguracaoMagiasJogador>;
