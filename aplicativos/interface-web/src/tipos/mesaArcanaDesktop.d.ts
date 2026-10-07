export {};

declare global {
  interface Window {
    mesaArcana?: {
      plataforma: string;
      aplicativoDesktop: boolean;
      obterDiagnostico: () => Promise<DiagnosticoAplicativoDesktop>;
    };
  }

  interface DiagnosticoAplicativoDesktop {
    coletadoEm: string;
    aplicativo: {
      nome: string;
      versao: string;
      empacotado: boolean;
      executavel: string;
    };
    ambiente: {
      plataforma: string;
      arquitetura: string;
      electron: string;
      node: string;
      chromium: string;
    };
    servicos: {
      interface: { ativo: boolean; porta: number };
      jogo: { ativo: boolean; porta: number };
    };
    rede: {
      enderecosIPv4: string[];
    };
    persistencia: {
      ok: boolean;
      caminho: string;
      mensagem: string;
    };
  }
}
