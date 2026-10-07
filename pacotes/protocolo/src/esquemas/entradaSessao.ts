import { z } from 'zod';

const classes = ['barbaro','bardo','bruxo','clerigo','druida','feiticeiro','guerreiro','ladino','mago','monge','paladino','patrulheiro'] as const;
const racas = ['anao','elfo','halfling','humano','draconato','gnomo','meio-elfo','meio-orc','tiefling'] as const;
const variantesRaciais = [
  'anao-colina','anao-montanha','alto-elfo','elfo-floresta','drow','halfling-pes-leves','halfling-robusto',
  'gnomo-floresta','gnomo-rochas','draconato-azul','draconato-branco','draconato-bronze','draconato-cobre',
  'draconato-latao','draconato-negro','draconato-ouro','draconato-prata','draconato-verde','draconato-vermelho'
] as const;

export const esquemaEntradaSessao = z.object({
  codigoSessao: z.string().trim().min(4).max(12).transform((valor) => valor.toUpperCase()),
  personagemSalvoId: z.string().uuid().optional(),
  nomeJogador: z.string().trim().min(2).max(40),
  classePersonagem: z.enum(classes),
  nivelPersonagem: z.number().int().min(1).max(20),
  racaPersonagem: z.enum(racas),
  varianteRacialPersonagem: z.enum(variantesRaciais).optional(),
  imagemToken: z.string().max(2_000_000).refine((valor) => valor.startsWith('data:image/'), 'Imagem invalida').optional()
});

export type EntradaSessao = z.infer<typeof esquemaEntradaSessao>;
