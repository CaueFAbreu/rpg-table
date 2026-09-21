// Utilitarios de imagem.
// O Firestore rejeita campos maiores que ~1 MiB, e as imagens sao salvas como texto base64
// dentro do documento. Por isso toda imagem e reduzida e comprimida ANTES de salvar.
// Alem de evitar o erro, documentos leves poupam banda: o documento inteiro do personagem
// e reenviado a todos os jogadores a cada alteracao (ex.: PV).

export const AVATAR_MAX_SIZE = 384; // exibido a 192px; 384px cobre telas retina
export const COVER_MAX_SIZE = 256; // exibido a 48px
export const MAX_IMAGE_BYTES = 200 * 1024; // margem grande abaixo do limite de 1 MiB

// Mantem a proporcao e limita o maior lado a `max` (nunca aumenta a imagem).
export function calcularDimensoes(width, height, max) {
  const escala = Math.min(1, max / Math.max(width, height));

  return {
    width: Math.max(1, Math.round(width * escala)),
    height: Math.max(1, Math.round(height * escala))
  };
}

// Tamanho aproximado, em bytes, do conteudo de um data URL base64.
export function estimarBytesDataUrl(dataUrl) {
  const base64 = String(dataUrl).split(",")[1] || "";
  return Math.ceil((base64.length * 3) / 4);
}

export function carregarImagem(src) {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.crossOrigin = "anonymous";
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error("Nao foi possivel carregar a imagem."));
    image.src = src;
  });
}

// WebP quando o navegador sabe gerar; caso contrario JPEG.
// (Safari ignora o pedido de WebP e devolveria um PNG bem maior.)
function canvasParaDataUrl(canvas, qualidade) {
  const webp = canvas.toDataURL("image/webp", qualidade);
  if (webp.startsWith("data:image/webp")) return webp;

  return canvas.toDataURL("image/jpeg", qualidade);
}

function reduzirCanvas(canvas, fator) {
  const menor = document.createElement("canvas");
  menor.width = Math.max(1, Math.round(canvas.width * fator));
  menor.height = Math.max(1, Math.round(canvas.height * fator));
  menor.getContext("2d").drawImage(canvas, 0, 0, menor.width, menor.height);
  return menor;
}

// Gera o data URL final. Se ainda passar do limite, baixa a qualidade e o tamanho.
export function codificarCanvas(canvas) {
  let atual = canvas;
  let qualidade = 0.82;

  for (let tentativa = 0; tentativa < 5; tentativa += 1) {
    const dataUrl = canvasParaDataUrl(atual, qualidade);
    if (estimarBytesDataUrl(dataUrl) <= MAX_IMAGE_BYTES) return dataUrl;

    qualidade = Math.max(0.3, qualidade - 0.15);
    atual = reduzirCanvas(atual, 0.8);
  }

  throw new Error("Imagem grande demais, mesmo depois de comprimir.");
}

// Le um arquivo escolhido pelo usuario, reduz e devolve o data URL pronto para salvar.
// Usa URL temporaria em vez de FileReader para nao carregar a foto original em base64.
export async function arquivoParaDataUrlComprimido(file, maxSize) {
  const url = URL.createObjectURL(file);

  try {
    const image = await carregarImagem(url);
    const { width, height } = calcularDimensoes(
      image.naturalWidth,
      image.naturalHeight,
      maxSize
    );

    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    canvas.getContext("2d").drawImage(image, 0, 0, width, height);

    return codificarCanvas(canvas);
  } finally {
    URL.revokeObjectURL(url);
  }
}
