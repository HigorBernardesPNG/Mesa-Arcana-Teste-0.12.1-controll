import type { ClassePersonagem, DefinicaoMagia, RacaPersonagem, VarianteRacialPersonagem } from '../sessao/EstadoSessao.js';
import { CATALOGO_MAGIAS } from './catalogoMagias.js';
import { obterMagiasDisponiveis } from './regrasMagia.js';

export interface DisponibilidadeMagiaPersonagem {
  magia: DefinicaoMagia;
  origemClasse: boolean;
  origemRacial: boolean;
}

function idsMagiasRaciaisFixas(raca: RacaPersonagem, variante: VarianteRacialPersonagem | undefined, nivel: number): string[] {
  if (variante === 'drow') {
    return [
      'globos-de-luz',
      ...(nivel >= 3 ? ['fogo-das-fadas'] : []),
      ...(nivel >= 5 ? ['escuridao'] : [])
    ];
  }

  if (variante === 'gnomo-floresta') return ['ilusao-menor'];

  if (raca === 'tiefling') {
    return [
      'taumaturgia',
      ...(nivel >= 3 ? ['repreensao-infernal'] : []),
      ...(nivel >= 5 ? ['escuridao'] : [])
    ];
  }

  return [];
}

export function obterMagiasRaciaisDisponiveis(
  raca: RacaPersonagem,
  nivelPersonagem: number,
  variante?: VarianteRacialPersonagem
): DefinicaoMagia[] {
  const nivel = Math.max(1, Math.min(20, Math.trunc(nivelPersonagem)));

  if (variante === 'alto-elfo') {
    return CATALOGO_MAGIAS.filter((magia) => magia.nivel === 0 && magia.classes.includes('mago'));
  }

  const ids = new Set(idsMagiasRaciaisFixas(raca, variante, nivel));
  return CATALOGO_MAGIAS.filter((magia) => ids.has(magia.id));
}

export function obterDisponibilidadesMagiaPersonagem(
  classe: ClassePersonagem,
  nivelPersonagem: number,
  raca: RacaPersonagem,
  variante?: VarianteRacialPersonagem
): DisponibilidadeMagiaPersonagem[] {
  const magiasClasse = obterMagiasDisponiveis(classe, nivelPersonagem);
  const magiasRaciais = obterMagiasRaciaisDisponiveis(raca, nivelPersonagem, variante);
  const idsClasse = new Set(magiasClasse.map((magia) => magia.id));
  const idsRaciais = new Set(magiasRaciais.map((magia) => magia.id));
  const porId = new Map<string, DefinicaoMagia>();

  for (const magia of [...magiasClasse, ...magiasRaciais]) porId.set(magia.id, magia);

  return [...porId.values()]
    .map((magia) => ({
      magia,
      origemClasse: idsClasse.has(magia.id),
      origemRacial: idsRaciais.has(magia.id)
    }))
    .sort((a, b) => a.magia.nivel - b.magia.nivel || a.magia.nome.localeCompare(b.magia.nome, 'pt-BR'));
}

export function validarSelecaoMagiasPersonagem(
  classe: ClassePersonagem,
  nivelPersonagem: number,
  raca: RacaPersonagem,
  idsSelecionados: string[],
  variante?: VarianteRacialPersonagem
): { valido: boolean; mensagem?: string; idsNormalizados: string[] } {
  const disponibilidades = obterDisponibilidadesMagiaPersonagem(classe, nivelPersonagem, raca, variante);
  const porId = new Map(disponibilidades.map((item) => [item.magia.id, item]));
  const idsNormalizados = [...new Set(idsSelecionados)].filter((id) => porId.has(id));

  if (idsNormalizados.length !== new Set(idsSelecionados).size) {
    return { valido: false, mensagem: 'A seleção contém uma magia indisponível para a raça, classe, sub-raça/ancestral ou nível.', idsNormalizados };
  }

  if (variante === 'alto-elfo') {
    const magiasClasse = new Set(obterMagiasDisponiveis(classe, nivelPersonagem).map((magia) => magia.id));
    const raciaisExclusivasSelecionadas = idsNormalizados.filter((id) => {
      const item = porId.get(id);
      return Boolean(item?.origemRacial && !magiasClasse.has(id));
    });
    if (raciaisExclusivasSelecionadas.length > 1) {
      return {
        valido: false,
        mensagem: 'Alto Elfo pode escolher apenas um truque racial da lista de Mago.',
        idsNormalizados
      };
    }
  }

  return { valido: true, idsNormalizados };
}

export function magiaEstaDisponivelParaPersonagem(
  magiaId: string,
  classe: ClassePersonagem,
  nivelPersonagem: number,
  raca: RacaPersonagem,
  variante?: VarianteRacialPersonagem
): boolean {
  return obterDisponibilidadesMagiaPersonagem(classe, nivelPersonagem, raca, variante)
    .some((item) => item.magia.id === magiaId);
}
