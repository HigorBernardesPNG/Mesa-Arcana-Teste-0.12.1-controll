import { contextBridge, ipcRenderer } from 'electron';

contextBridge.exposeInMainWorld('mesaArcana', {
  plataforma: process.platform,
  aplicativoDesktop: true,
  obterDiagnostico: () => ipcRenderer.invoke('mesa-arcana:obter-diagnostico')
});
