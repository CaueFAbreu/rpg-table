import {
  calcularDimensoes,
  estimarBytesDataUrl,
  MAX_IMAGE_BYTES
} from "./imagem";

describe("calcularDimensoes", () => {
  test("reduz mantendo a proporcao pelo maior lado", () => {
    expect(calcularDimensoes(4000, 3000, 400)).toEqual({ width: 400, height: 300 });
    expect(calcularDimensoes(3000, 4000, 400)).toEqual({ width: 300, height: 400 });
  });

  test("nunca aumenta imagens pequenas", () => {
    expect(calcularDimensoes(100, 50, 384)).toEqual({ width: 100, height: 50 });
  });

  test("nunca devolve dimensao zero", () => {
    expect(calcularDimensoes(10000, 1, 384).height).toBe(1);
  });
});

describe("estimarBytesDataUrl", () => {
  test("estima o tamanho do conteudo base64", () => {
    // "aGVsbG8=" e "hello" (5 bytes) em base64
    expect(estimarBytesDataUrl("data:text/plain;base64,aGVsbG8=")).toBe(6);
  });

  test("retorna 0 para valores sem conteudo", () => {
    expect(estimarBytesDataUrl("")).toBe(0);
  });

  test("o limite interno fica bem abaixo de 1 MiB do Firestore", () => {
    expect(MAX_IMAGE_BYTES).toBeLessThan(1048487 / 4);
  });
});
