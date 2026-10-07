import type {
  ClassePersonagem,
  DefinicaoMagia,
  EntidadeMapaBase,
  MapaSessao,
  PosicaoMapa
} from '../sessao/EstadoSessao.js';
import { CATALOGO_MAGIAS } from './catalogoMagias.js';
import { casasOcupadasEntidade } from '../mapa/movimento.js';
import { METROS_POR_CASA } from '../mapa/escalaGrade.js';

export function nivelMaximoMagia(classe: ClassePersonagem, nivelPersonagem: number): number {
  const nivel = Math.max(1, Math.min(20, Math.trunc(nivelPersonagem)));

  if (classe === 'paladino' || classe === 'patrulheiro') {
    if (nivel < 2) return 0;
    if (nivel < 5) return 1;
    if (nivel < 9) return 2;
    if (nivel < 13) return 3;
    if (nivel < 17) return 4;
    return 5;
  }

  if (['bardo', 'bruxo', 'clerigo', 'druida', 'feiticeiro', 'mago'].includes(classe)) {
    return Math.min(9, Math.ceil(nivel / 2));
  }

  return -1;
}

export function obterMagiasDisponiveis(classe: ClassePersonagem, nivelPersonagem: number): DefinicaoMagia[] {
  const maximo = nivelMaximoMagia(classe, nivelPersonagem);
  if (maximo < 0) return [];

  return CATALOGO_MAGIAS.filter((magia) => {
    if (!magia.classes.includes(classe)) return false;
    if (magia.nivel === 0) return !['paladino', 'patrulheiro'].includes(classe);
    return magia.nivel <= maximo;
  });
}

export function obterMagiaPorId(id: string): DefinicaoMagia | undefined {
  return CATALOGO_MAGIAS.find((magia) => magia.id === id);
}


export function magiaExigeVisao(magia: DefinicaoMagia): boolean {
  // O catálogo preserva no resumo descritivo a formulação do Livro do Jogador.
  // Quando a magia exige que o conjurador "possa ver" o alvo/ponto, a
  // iluminação passa a fazer parte da validação de conjuração.
  const texto = `${magia.descricaoBreve} ${magia.resumo}`.toLocaleLowerCase('pt-BR');
  return texto.includes('possa ver');
}

export function distanciaEmCasas(a: PosicaoMapa, b: PosicaoMapa): number {
  return Math.max(Math.abs(a.coluna - b.coluna), Math.abs(a.linha - b.linha));
}

export function distanciaEmMetros(a: PosicaoMapa, b: PosicaoMapa): number {
  return distanciaEmCasas(a, b) * METROS_POR_CASA;
}

function limitarAoMapa(posicoes: PosicaoMapa[], mapa: MapaSessao): PosicaoMapa[] {
  const vistas = new Set<string>();
  return posicoes.filter((posicao) => {
    if (posicao.coluna < 1 || posicao.coluna > mapa.colunas || posicao.linha < 1 || posicao.linha > mapa.linhas) return false;
    const chave = `${posicao.coluna}:${posicao.linha}`;
    if (vistas.has(chave)) return false;
    vistas.add(chave);
    return true;
  });
}

function casasEmRaio(centro: PosicaoMapa, raioMetros: number, mapa: MapaSessao): PosicaoMapa[] {
  const raioCasas = Math.max(0, raioMetros / METROS_POR_CASA);
  const limite = Math.ceil(raioCasas);
  const casas: PosicaoMapa[] = [];
  for (let dy = -limite; dy <= limite; dy += 1) {
    for (let dx = -limite; dx <= limite; dx += 1) {
      const distancia = Math.sqrt(dx * dx + dy * dy);
      if (distancia <= raioCasas + 0.35) casas.push({ coluna: centro.coluna + dx, linha: centro.linha + dy });
    }
  }
  return limitarAoMapa(casas, mapa);
}

function casasEmCubo(centro: PosicaoMapa, ladoMetros: number, mapa: MapaSessao): PosicaoMapa[] {
  const ladoCasas = Math.max(1, Math.ceil(ladoMetros / METROS_POR_CASA));
  const metade = Math.floor((ladoCasas - 1) / 2);
  const casas: PosicaoMapa[] = [];
  for (let y = 0; y < ladoCasas; y += 1) {
    for (let x = 0; x < ladoCasas; x += 1) casas.push({ coluna: centro.coluna - metade + x, linha: centro.linha - metade + y });
  }
  return limitarAoMapa(casas, mapa);
}

function casasEmLinha(origem: PosicaoMapa, destino: PosicaoMapa, comprimentoMetros: number, larguraMetros: number, mapa: MapaSessao): PosicaoMapa[] {
  const comprimentoCasas = Math.max(1, comprimentoMetros / METROS_POR_CASA);
  const larguraCasas = Math.max(0.6, larguraMetros / METROS_POR_CASA);
  let vx = destino.coluna - origem.coluna;
  let vy = destino.linha - origem.linha;
  const modulo = Math.sqrt(vx * vx + vy * vy) || 1;
  vx /= modulo;
  vy /= modulo;

  const casas: PosicaoMapa[] = [];
  for (let linha = 1; linha <= mapa.linhas; linha += 1) {
    for (let coluna = 1; coluna <= mapa.colunas; coluna += 1) {
      const px = coluna - origem.coluna;
      const py = linha - origem.linha;
      const projecao = px * vx + py * vy;
      if (projecao <= 0 || projecao > comprimentoCasas + 0.45) continue;
      const perpendicular = Math.abs(px * vy - py * vx);
      if (perpendicular <= larguraCasas / 2 + 0.45) casas.push({ coluna, linha });
    }
  }
  return limitarAoMapa(casas, mapa);
}

function casasEmCone(origem: PosicaoMapa, destino: PosicaoMapa, comprimentoMetros: number, mapa: MapaSessao): PosicaoMapa[] {
  const comprimentoCasas = Math.max(1, comprimentoMetros / METROS_POR_CASA);
  let vx = destino.coluna - origem.coluna;
  let vy = destino.linha - origem.linha;
  const modulo = Math.sqrt(vx * vx + vy * vy) || 1;
  vx /= modulo;
  vy /= modulo;

  const casas: PosicaoMapa[] = [];
  for (let linha = 1; linha <= mapa.linhas; linha += 1) {
    for (let coluna = 1; coluna <= mapa.colunas; coluna += 1) {
      const px = coluna - origem.coluna;
      const py = linha - origem.linha;
      const distancia = Math.sqrt(px * px + py * py);
      if (distancia <= 0 || distancia > comprimentoCasas + 0.35) continue;
      const projecao = px * vx + py * vy;
      if (projecao <= 0) continue;
      const lateral = Math.abs(px * vy - py * vx);
      if (lateral <= projecao / 2 + 0.5) casas.push({ coluna, linha });
    }
  }
  return limitarAoMapa(casas, mapa);
}

export function calcularCasasMagia(magia: DefinicaoMagia, conjurador: PosicaoMapa, ponto: PosicaoMapa | undefined, mapa: MapaSessao): PosicaoMapa[] {
  const tamanho = magia.tamanhoAreaMetros ?? 0;
  if (magia.formaArea === 'pessoal') return [conjurador];
  if (magia.formaArea === 'aura') return casasEmRaio(conjurador, tamanho, mapa);
  if (!ponto) return [];
  if (magia.formaArea === 'esfera' || magia.formaArea === 'cilindro') return casasEmRaio(ponto, tamanho, mapa);
  if (magia.formaArea === 'cubo') return casasEmCubo(ponto, tamanho || METROS_POR_CASA, mapa);
  if (magia.formaArea === 'linha') return casasEmLinha(conjurador, ponto, tamanho, magia.larguraMetros ?? METROS_POR_CASA, mapa);
  if (magia.formaArea === 'cone') return casasEmCone(conjurador, ponto, tamanho, mapa);
  return [ponto];
}

export function pontoDentroDoAlcance(magia: DefinicaoMagia, conjurador: PosicaoMapa, ponto: PosicaoMapa): boolean {
  if (magia.origemArea === 'conjurador' || magia.formaArea === 'aura' || magia.formaArea === 'pessoal') return true;
  if (magia.alcanceMetros === undefined) return true;
  return distanciaEmMetros(conjurador, ponto) <= magia.alcanceMetros + 0.001;
}

export function entidadesNasCasas(entidades: EntidadeMapaBase[], casas: PosicaoMapa[]): EntidadeMapaBase[] {
  const chaves = new Set(casas.map((casa) => `${casa.coluna}:${casa.linha}`));
  return entidades.filter((entidade) =>
    entidade.presenteNoMapa !== false
    && casasOcupadasEntidade(entidade).some((casa) => chaves.has(`${casa.coluna}:${casa.linha}`))
  );
}
