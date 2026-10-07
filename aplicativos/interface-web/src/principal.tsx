import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { App } from './App';
import './estilos/global.css';

const elementoRaiz = document.getElementById('root');
if (!elementoRaiz) throw new Error('Elemento raiz da aplicacao nao encontrado.');

createRoot(elementoRaiz).render(
  <StrictMode>
    <App />
  </StrictMode>
);
