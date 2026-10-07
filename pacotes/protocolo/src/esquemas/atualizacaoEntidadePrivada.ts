import { z } from 'zod';

const tamanhos = ['miudo', 'pequeno', 'medio', 'grande', 'enorme', 'imenso'] as const;

export const esquemaAtualizacaoEntidadePrivada = z.object({
  codigoSessao: z.string().length(6),
  entidadeId: z.string().min(1),
  pontosVidaAtual: z.number().int().min(0).max(99999),
  pontosVidaMaximo: z.number().int().min(1).max(99999),
  classeArmadura: z.number().int().min(0).max(100),
  deslocamento: z.number().min(0).max(1000),
  tamanhoCriatura: z.enum(tamanhos),
  nomeAtaque: z.string().trim().min(1).max(80),
  bonusAtaque: z.number().int().min(-50).max(100),
  danoAtaque: z.string().trim().min(1).max(40)
}).superRefine((dados, contexto) => {
  if (dados.pontosVidaAtual > dados.pontosVidaMaximo) {
    contexto.addIssue({
      code: 'custom',
      path: ['pontosVidaAtual'],
      message: 'PV atual nao pode ser maior que o PV maximo.'
    });
  }
});

export type AtualizacaoEntidadePrivada = z.infer<typeof esquemaAtualizacaoEntidadePrivada>;
