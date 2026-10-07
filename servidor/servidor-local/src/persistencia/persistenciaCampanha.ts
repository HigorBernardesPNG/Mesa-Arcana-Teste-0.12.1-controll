import { mkdir, readFile, readdir, stat, writeFile, copyFile } from 'node:fs/promises';
import { homedir } from 'node:os';
import { basename, join } from 'node:path';
import type { EstadoSessao } from '@mesa-rpg/dominio';

export const VERSAO_FORMATO_CAMPANHA = 1;
export const EXTENSAO_CAMPANHA = '.mesaarcana';

export interface ArquivoCampanhaMesaArcana {
  formato: 'mesa-arcana';
  versaoFormato: 1;
  salvoEm: string;
  estado: EstadoSessao;
}

export interface ResumoCampanhaSalva {
  arquivo: string;
  nomeCampanha: string;
  salvoEm: string;
  tamanhoBytes: number;
}

function diretorioPadrao(): string {
  return process.env.DIRETORIO_DADOS_MESA_ARCANA
    ?? join(homedir(), '.mesa-arcana', 'campanhas');
}

export function obterDiretorioCampanhas(): string {
  return diretorioPadrao();
}

function nomeSeguro(valor: string): string {
  const limpo = valor
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-zA-Z0-9_-]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .toLowerCase();
  return limpo.slice(0, 60) || 'campanha';
}

function criarNomeArquivo(nomeCampanha: string): string {
  return `${nomeSeguro(nomeCampanha)}${EXTENSAO_CAMPANHA}`;
}

function clonarEstadoParaPersistencia(estado: EstadoSessao): EstadoSessao {
  return {
    ...structuredClone(estado),
    jogadores: estado.jogadores.map((jogador) => ({ ...structuredClone(jogador), conectado: false }))
  };
}

export function serializarCampanha(estado: EstadoSessao): string {
  const arquivo: ArquivoCampanhaMesaArcana = {
    formato: 'mesa-arcana',
    versaoFormato: VERSAO_FORMATO_CAMPANHA,
    salvoEm: new Date().toISOString(),
    estado: clonarEstadoParaPersistencia(estado)
  };
  return JSON.stringify(arquivo, null, 2);
}

function validarArquivoCampanha(valor: unknown): ArquivoCampanhaMesaArcana {
  if (!valor || typeof valor !== 'object') throw new Error('Arquivo de campanha inválido.');
  const candidato = valor as Partial<ArquivoCampanhaMesaArcana>;
  if (candidato.formato !== 'mesa-arcana' || candidato.versaoFormato !== VERSAO_FORMATO_CAMPANHA) {
    throw new Error('Formato ou versão de campanha não suportado.');
  }
  if (!candidato.estado || typeof candidato.estado !== 'object') throw new Error('Estado da campanha ausente.');
  const estado = candidato.estado as EstadoSessao;
  if (estado.versao !== 12 || !estado.mapaAtual || !Array.isArray(estado.entidades) || !Array.isArray(estado.jogadores)) {
    throw new Error('A campanha não é compatível com esta versão da Mesa Arcana.');
  }
  return candidato as ArquivoCampanhaMesaArcana;
}

export function desserializarCampanha(conteudo: string): ArquivoCampanhaMesaArcana {
  let valor: unknown;
  try {
    valor = JSON.parse(conteudo);
  } catch {
    throw new Error('O arquivo selecionado não contém uma campanha válida.');
  }
  return validarArquivoCampanha(valor);
}

export function restaurarEstadoCampanha(arquivo: ArquivoCampanhaMesaArcana, codigoSessaoAtual: string): EstadoSessao {
  const restaurado = structuredClone(arquivo.estado);
  restaurado.codigo = codigoSessaoAtual;
  restaurado.jogadores = restaurado.jogadores.map((jogador) => ({ ...jogador, conectado: false }));
  return restaurado;
}

export async function salvarCampanhaLocal(
  estado: EstadoSessao,
  arquivoAtual?: string | null
): Promise<{ arquivo: string; caminho: string; salvoEm: string }> {
  const diretorio = obterDiretorioCampanhas();
  await mkdir(diretorio, { recursive: true });
  let arquivo = arquivoAtual ? basename(arquivoAtual) : criarNomeArquivo(estado.nomeCampanha);
  let caminho = join(diretorio, arquivo);
  const conteudo = serializarCampanha(estado);

  if (!arquivoAtual) {
    try {
      await stat(caminho);
      const marcaTempo = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
      arquivo = `${arquivo.slice(0, -EXTENSAO_CAMPANHA.length)}-${marcaTempo}${EXTENSAO_CAMPANHA}`;
      caminho = join(diretorio, arquivo);
    } catch {
      // O nome está livre e pode ser usado normalmente.
    }
  } else {
    try {
      await stat(caminho);
      await copyFile(caminho, `${caminho}.backup`);
    } catch {
      // O arquivo foi movido ou este é o primeiro salvamento nesse caminho.
    }
  }

  await writeFile(caminho, conteudo, 'utf8');
  const salvoEm = JSON.parse(conteudo).salvoEm as string;
  return { arquivo, caminho, salvoEm };
}

export async function listarCampanhasLocais(): Promise<ResumoCampanhaSalva[]> {
  const diretorio = obterDiretorioCampanhas();
  await mkdir(diretorio, { recursive: true });
  const arquivos = (await readdir(diretorio)).filter((arquivo) => arquivo.endsWith(EXTENSAO_CAMPANHA));
  const resumos: ResumoCampanhaSalva[] = [];

  for (const arquivo of arquivos) {
    const caminho = join(diretorio, arquivo);
    try {
      const [conteudo, informacoes] = await Promise.all([readFile(caminho, 'utf8'), stat(caminho)]);
      const campanha = desserializarCampanha(conteudo);
      resumos.push({
        arquivo,
        nomeCampanha: campanha.estado.nomeCampanha,
        salvoEm: campanha.salvoEm,
        tamanhoBytes: informacoes.size
      });
    } catch {
      // Arquivo inválido é ignorado na listagem para não bloquear os demais salvamentos.
    }
  }

  return resumos.sort((a, b) => b.salvoEm.localeCompare(a.salvoEm));
}

export async function carregarCampanhaLocal(arquivo: string): Promise<ArquivoCampanhaMesaArcana> {
  const nome = basename(arquivo);
  if (!nome.endsWith(EXTENSAO_CAMPANHA)) throw new Error('Arquivo de campanha inválido.');
  const caminho = join(obterDiretorioCampanhas(), nome);
  return desserializarCampanha(await readFile(caminho, 'utf8'));
}
