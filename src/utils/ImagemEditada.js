import { AVATAR_MAX_SIZE, calcularDimensoes, carregarImagem, codificarCanvas } from "./imagem";

// Recorta a imagem e ja devolve o resultado reduzido e comprimido (cabe com folga no Firestore).
export default async function ImagemEditada(imageSrc, crop) {
  const image = await carregarImagem(imageSrc);
  const { width, height } = calcularDimensoes(crop.width, crop.height, AVATAR_MAX_SIZE);

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;

  canvas
    .getContext("2d")
    .drawImage(image, crop.x, crop.y, crop.width, crop.height, 0, 0, width, height);

  return codificarCanvas(canvas);
}
