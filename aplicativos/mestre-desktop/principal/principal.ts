import { app, BrowserWindow, dialog, ipcMain, Menu, shell } from 'electron';
import { createServer, type Server as ServidorHttp } from 'node:http';
import { mkdir, readFile, stat, unlink, writeFile } from 'node:fs/promises';
import { extname, join, normalize, relative, resolve, sep } from 'node:path';
import { networkInterfaces } from 'node:os';
import { iniciarServidorLocal } from '@mesa-rpg/servidor-local';

app.setName('Mesa Arcana Teste');

const URL_CONTROLE_REMOTO = 'https://mesa-arcana-controle.vercel.app/controle.json';
const TEMPO_LIMITE_VALIDACAO_MS = 8_000;

const PORTA_INTERFACE = 5173;
let janelaPrincipal: BrowserWindow | null = null;
let servidorInterface: ServidorHttp | null = null;
let servidorJogo: ServidorHttp | null = null;



type ControleVersaoRemoto = {
  ativo?: boolean;
  mensagem?: string;
};

type ControleRemoto = {
  aplicativoAtivo?: boolean;
  mensagemGlobal?: string;
  versoes?: Record<string, ControleVersaoRemoto>;
};

type ResultadoValidacaoRemota = {
  permitido: boolean;
  mensagem: string;
};

async function validarDisponibilidadeRemota(): Promise<ResultadoValidacaoRemota> {
  const versao = app.getVersion();
  const abortador = new AbortController();
  const temporizador = setTimeout(() => abortador.abort(), TEMPO_LIMITE_VALIDACAO_MS);

  try {
    const separador = URL_CONTROLE_REMOTO.includes('?') ? '&' : '?';
    const url = `${URL_CONTROLE_REMOTO}${separador}versao=${encodeURIComponent(versao)}&agora=${Date.now()}`;
    const resposta = await fetch(url, {
      method: 'GET',
      signal: abortador.signal,
      headers: {
        Accept: 'application/json',
        'Cache-Control': 'no-cache, no-store, max-age=0',
        Pragma: 'no-cache',
        'User-Agent': `MesaArcanaTeste/${versao}`
      }
    });

    if (!resposta.ok) {
      throw new Error(`Servidor de controle respondeu HTTP ${resposta.status}.`);
    }

    const controle = await resposta.json() as ControleRemoto;

    if (controle.aplicativoAtivo !== true) {
      return {
        permitido: false,
        mensagem: controle.mensagemGlobal?.trim() || 'Esta distribuição de teste da Mesa Arcana foi desativada.'
      };
    }

    const controleVersao = controle.versoes?.[versao];
    if (!controleVersao) {
      return {
        permitido: false,
        mensagem: `A versão ${versao} não está autorizada para uso.`
      };
    }

    if (controleVersao.ativo !== true) {
      return {
        permitido: false,
        mensagem: controleVersao.mensagem?.trim() || `A versão ${versao} foi desativada pelo responsável pela Mesa Arcana.`
      };
    }

    return { permitido: true, mensagem: 'Versão autorizada.' };
  } catch (erro) {
    const detalhe = erro instanceof Error ? erro.message : String(erro);
    return {
      permitido: false,
      mensagem: `Não foi possível validar esta versão pela internet. Verifique sua conexão e tente novamente.\n\nDetalhe: ${detalhe}`
    };
  } finally {
    clearTimeout(temporizador);
  }
}

function enderecosRedeLocais(): string[] {
  const redes = networkInterfaces();
  const enderecos = new Set<string>();
  for (const interfaces of Object.values(redes)) {
    for (const interfaceRede of interfaces ?? []) {
      if (interfaceRede.family !== 'IPv4' || interfaceRede.internal) continue;
      enderecos.add(interfaceRede.address);
    }
  }
  return [...enderecos];
}

async function testarPersistencia(): Promise<{ ok: boolean; caminho: string; mensagem: string }> {
  const caminho = join(app.getPath('userData'), 'campanhas');
  const arquivoTeste = join(caminho, `.diagnostico-${process.pid}.tmp`);
  try {
    await mkdir(caminho, { recursive: true });
    await writeFile(arquivoTeste, `Mesa Arcana ${new Date().toISOString()}`, 'utf8');
    await unlink(arquivoTeste);
    return { ok: true, caminho, mensagem: 'Leitura e escrita disponíveis.' };
  } catch (erro) {
    return {
      ok: false,
      caminho,
      mensagem: erro instanceof Error ? erro.message : 'Falha desconhecida ao testar persistência.'
    };
  }
}

async function obterDiagnosticoAplicativo(): Promise<Record<string, unknown>> {
  const persistencia = await testarPersistencia();
  return {
    coletadoEm: new Date().toISOString(),
    aplicativo: {
      nome: app.getName(),
      versao: app.getVersion(),
      empacotado: app.isPackaged,
      executavel: app.getPath('exe')
    },
    ambiente: {
      plataforma: process.platform,
      arquitetura: process.arch,
      electron: process.versions.electron,
      node: process.versions.node,
      chromium: process.versions.chrome
    },
    servicos: {
      interface: { ativo: Boolean(servidorInterface?.listening), porta: PORTA_INTERFACE },
      jogo: { ativo: Boolean(servidorJogo?.listening), porta: Number(process.env.PORTA_MESA_RPG ?? 3210) }
    },
    rede: {
      enderecosIPv4: enderecosRedeLocais()
    },
    persistencia,
    controleRemoto: {
      obrigatorio: true,
      url: URL_CONTROLE_REMOTO
    }
  };
}

ipcMain.handle('mesa-arcana:obter-diagnostico', async () => obterDiagnosticoAplicativo());

const tiposConteudo: Record<string, string> = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
  '.ico': 'image/x-icon',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2'
};

function diretorioInterface(): string {
  if (process.env.DIRETORIO_INTERFACE_MESA_ARCANA) return resolve(process.env.DIRETORIO_INTERFACE_MESA_ARCANA);
  if (app.isPackaged) return join(process.resourcesPath, 'web');
  return resolve(__dirname, '../../../interface-web/dist');
}

function estaDentroDoDiretorio(base: string, candidato: string): boolean {
  const caminhoRelativo = relative(base, candidato);
  return caminhoRelativo === '' || (!caminhoRelativo.startsWith(`..${sep}`) && caminhoRelativo !== '..' && !caminhoRelativo.includes(`..${sep}`));
}

async function arquivoExiste(caminho: string): Promise<boolean> {
  try {
    return (await stat(caminho)).isFile();
  } catch {
    return false;
  }
}

async function iniciarServidorDaInterface(): Promise<ServidorHttp> {
  const base = diretorioInterface();
  const index = join(base, 'index.html');

  if (!(await arquivoExiste(index))) {
    throw new Error(`Interface compilada não encontrada em: ${base}`);
  }

  const servidor = createServer(async (requisicao, resposta) => {
    try {
      const url = new URL(requisicao.url ?? '/', `http://${requisicao.headers.host ?? 'localhost'}`);
      const caminhoUrl = decodeURIComponent(url.pathname);
      const solicitado = caminhoUrl === '/' ? '/index.html' : caminhoUrl;
      const candidato = normalize(join(base, solicitado));

      let caminhoArquivo = candidato;
      if (!estaDentroDoDiretorio(base, caminhoArquivo) || !(await arquivoExiste(caminhoArquivo))) {
        caminhoArquivo = index;
      }

      const conteudo = await readFile(caminhoArquivo);
      resposta.writeHead(200, {
        'Content-Type': tiposConteudo[extname(caminhoArquivo).toLowerCase()] ?? 'application/octet-stream',
        'Cache-Control': extname(caminhoArquivo) === '.html' ? 'no-cache' : 'public, max-age=3600'
      });
      resposta.end(conteudo);
    } catch (erro) {
      resposta.writeHead(500, { 'Content-Type': 'text/plain; charset=utf-8' });
      resposta.end(`Falha ao carregar a Mesa Arcana: ${erro instanceof Error ? erro.message : 'erro desconhecido'}`);
    }
  });

  await new Promise<void>((resolverPromessa, rejeitar) => {
    servidor.once('error', rejeitar);
    servidor.listen(PORTA_INTERFACE, '0.0.0.0', () => {
      servidor.off('error', rejeitar);
      resolverPromessa();
    });
  });

  return servidor;
}

function aguardarServidor(servidor: ServidorHttp): Promise<void> {
  if (servidor.listening) return Promise.resolve();
  return new Promise<void>((resolverPromessa, rejeitar) => {
    servidor.once('listening', resolverPromessa);
    servidor.once('error', rejeitar);
  });
}

function focarJanelaPrincipal(): void {
  if (!janelaPrincipal) return;
  if (janelaPrincipal.isMinimized()) janelaPrincipal.restore();
  janelaPrincipal.show();
  janelaPrincipal.focus();
}

function criarJanela(): void {
  const icone = app.isPackaged
    ? join(process.resourcesPath, 'icone.png')
    : resolve(__dirname, '../../recursos/icone.png');

  janelaPrincipal = new BrowserWindow({
    width: 1540,
    height: 940,
    minWidth: 1100,
    minHeight: 700,
    backgroundColor: '#071019',
    autoHideMenuBar: true,
    title: 'Mesa Arcana Teste',
    icon: icone,
    webPreferences: {
      preload: join(__dirname, '../preload/preload.cjs'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true
    }
  });

  Menu.setApplicationMenu(null);

  janelaPrincipal.webContents.setWindowOpenHandler(({ url }) => {
    void shell.openExternal(url);
    return { action: 'deny' };
  });

  janelaPrincipal.on('closed', () => {
    janelaPrincipal = null;
  });

  void janelaPrincipal.loadURL(`http://localhost:${PORTA_INTERFACE}/mestre`);
}

async function iniciarAplicacao(): Promise<void> {
  const validacaoRemota = await validarDisponibilidadeRemota();
  if (!validacaoRemota.permitido) {
    await dialog.showMessageBox({
      type: 'warning',
      title: 'Mesa Arcana Teste',
      message: 'Esta versão não pôde ser autorizada.',
      detail: validacaoRemota.mensagem
    });
    app.quit();
    return;
  }

  process.env.PORTA_MESA_RPG = process.env.PORTA_MESA_RPG ?? '3210';
  process.env.PORTA_INTERFACE_MESA_RPG = String(PORTA_INTERFACE);
  process.env.DIRETORIO_DADOS_MESA_ARCANA = join(app.getPath('userData'), 'campanhas');

  try {
    servidorJogo = iniciarServidorLocal();
    await aguardarServidor(servidorJogo);
    servidorInterface = await iniciarServidorDaInterface();
    criarJanela();
  } catch (erro) {
    const mensagem = erro instanceof Error ? erro.message : String(erro);
    await dialog.showMessageBox({
      type: 'error',
      title: 'Mesa Arcana Teste',
      message: 'Não foi possível iniciar a Mesa Arcana.',
      detail: `${mensagem}\n\nFeche outra instância do aplicativo ou qualquer programa que esteja usando as portas 3210 ou 5173 e tente novamente.`
    });
    app.quit();
  }
}

const instanciaUnica = app.requestSingleInstanceLock();

if (!instanciaUnica) {
  app.quit();
} else {
  app.on('second-instance', () => focarJanelaPrincipal());

  app.whenReady().then(async () => {
    await iniciarAplicacao();
    app.on('activate', () => {
      if (BrowserWindow.getAllWindows().length === 0) criarJanela();
      else focarJanelaPrincipal();
    });
  });
}

app.on('before-quit', () => {
  servidorInterface?.close();
  servidorJogo?.close();
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});
