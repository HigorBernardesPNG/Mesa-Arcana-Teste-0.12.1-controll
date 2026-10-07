import { z } from 'zod';

export const esquemaConfiguracaoDeslocamentoJogador = z.object({
  codigoSessao: z.string().trim().min(4).max(12).transform((valor) => valor.toUpperCase()),
  entidadeId: z.string().trim().min(1),
  deslocamentoEfetivo: z.number().min(0).max(300).refine(
    (valor) => Math.abs(valor / 1.5 - Math.round(valor / 1.5)) < 0.0001,
    'O deslocamento deve respeitar segmentos de 1,5 metro.'
  )
});

export type ConfiguracaoDeslocamentoJogador = z.infer<typeof esquemaConfiguracaoDeslocamentoJogador>;
