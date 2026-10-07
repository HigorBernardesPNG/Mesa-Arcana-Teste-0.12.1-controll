export async function processarImagem(
  arquivo: File,
  tamanhoMaximo: number,
  qualidade = 0.86
): Promise<string> {
  if (!arquivo.type.startsWith('image/')) throw new Error('Selecione um arquivo de imagem.');

  const url = URL.createObjectURL(arquivo);
  try {
    const imagem = new Image();
    await new Promise<void>((resolver, rejeitar) => {
      imagem.onload = () => resolver();
      imagem.onerror = () => rejeitar(new Error('Nao foi possivel ler a imagem.'));
      imagem.src = url;
    });

    const escala = Math.min(1, tamanhoMaximo / Math.max(imagem.naturalWidth, imagem.naturalHeight));
    const largura = Math.max(1, Math.round(imagem.naturalWidth * escala));
    const altura = Math.max(1, Math.round(imagem.naturalHeight * escala));
    const canvas = document.createElement('canvas');
    canvas.width = largura;
    canvas.height = altura;

    const contexto = canvas.getContext('2d');
    if (!contexto) throw new Error('Canvas indisponivel.');
    contexto.drawImage(imagem, 0, 0, largura, altura);
    return canvas.toDataURL('image/jpeg', qualidade);
  } finally {
    URL.revokeObjectURL(url);
  }
}
