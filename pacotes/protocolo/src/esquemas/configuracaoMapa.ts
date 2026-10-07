import { z } from 'zod';

export const esquemaConfiguracaoMapa = z.object({
  codigoSessao: z.string().length(6),
  nome: z.string().trim().min(1).max(80),
  colunas: z.number().int().min(4).max(50),
  linhas: z.number().int().min(4).max(50),
  opacidadeGrade: z.number().min(0.15).max(1),
  imagemFundo: z.string().max(8_000_000).refine((valor) => valor.startsWith('data:image/'), 'Imagem invalida').optional()
});

export type ConfiguracaoMapa = z.infer<typeof esquemaConfiguracaoMapa>;
