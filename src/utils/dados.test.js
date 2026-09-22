import {
  interpretarExpressao,
  rolarExpressao,
  REGRA_D20_MAIOR,
  REGRA_D20_SOMA
} from "./dados";

// Dado "viciado": devolve os valores na ordem, ignorando o numero de faces.
function sequencia(...valores) {
  let posicao = 0;
  return () => valores[posicao++ % valores.length];
}

function rolar(texto, valores, regraD20 = REGRA_D20_SOMA) {
  return rolarExpressao(texto, { regraD20, rolarDado: sequencia(...valores) });
}

describe("regra de soma (padrao)", () => {
  test("soma dados e constantes", () => {
    const r = rolar("2d6+3", [4, 5]);
    expect(r).toMatchObject({ ok: true, total: 12, detalhe: "2d6 [4, 5] +3" });
  });

  test("aceita subtracao", () => {
    expect(rolar("1d8-2", [6]).total).toBe(4);
  });

  test("ignora espacos e maiusculas", () => {
    expect(rolar(" 2D6 + 3 ", [1, 1]).total).toBe(5);
  });

  test("2d20 soma os dois dados", () => {
    const r = rolar("2d20", [7, 15]);
    expect(r.total).toBe(22);
    expect(r.detalhe).toBe("2d20 [7, 15]");
  });

  test("kh1 mantem o maior (vantagem) e kl1 o menor (desvantagem)", () => {
    expect(rolar("2d20kh1+5", [7, 15]).total).toBe(20);
    expect(rolar("2d20kl1", [7, 15]).total).toBe(7);
    expect(rolar("2d20kh1", [7, 15]).detalhe).toBe("2d20kh1 [(7), 15] → 15");
  });

  test("4d6kh3 descarta o menor dado", () => {
    const r = rolar("4d6kh3", [1, 6, 3, 4]);
    expect(r.total).toBe(13);
    expect(r.detalhe).toBe("4d6kh3 [(1), 6, 3, 4] → 13");
  });

  test("0d20 nao e aceito fora da regra de Ordem Paranormal", () => {
    expect(rolar("0d20", [5, 12]).ok).toBe(false);
  });
});

describe("regra do maior d20 (Ordem Paranormal)", () => {
  test("grupo de d20 mantem o maior valor", () => {
    const r = rolar("3d20+5", [7, 15, 3], REGRA_D20_MAIOR);
    expect(r.total).toBe(20);
    expect(r.detalhe).toBe("3d20 [(7), 15, (3)] → 15 +5");
  });

  test("0d20 rola dois dados e mantem o menor", () => {
    const r = rolar("0d20", [12, 5], REGRA_D20_MAIOR);
    expect(r.total).toBe(5);
    expect(r.detalhe).toBe("0d20 [(12), 5] → 5");
  });

  test("outros dados continuam somando", () => {
    expect(rolar("2d6", [3, 4], REGRA_D20_MAIOR).total).toBe(7);
  });

  test("kh/kl explicito vale mais que a regra da sala", () => {
    expect(rolar("2d20kl1", [7, 15], REGRA_D20_MAIOR).total).toBe(7);
  });
});

describe("critico e falha critica", () => {
  test("20 natural no d20 e critico; 1 e falha", () => {
    expect(rolar("1d20", [20]).criticoFalha).toBe("critico");
    expect(rolar("1d20", [1]).criticoFalha).toBe("falha");
    expect(rolar("1d20", [10]).criticoFalha).toBeNull();
  });

  test("com vantagem, so conta o dado que ficou", () => {
    expect(rolar("2d20kh1", [1, 15]).criticoFalha).toBeNull();
    expect(rolar("2d20kh1", [20, 1]).criticoFalha).toBe("critico");
    expect(rolar("2d20kl1", [20, 1]).criticoFalha).toBe("falha");
  });

  test("um 20 e um 1 mantidos se anulam", () => {
    expect(rolar("2d20", [20, 1]).criticoFalha).toBeNull();
  });

  test("d20 subtraido nao conta como critico", () => {
    const r = rolar("5-1d20", [20]);
    expect(r.total).toBe(-15);
    expect(r.criticoFalha).toBeNull();
  });
});

describe("validacao", () => {
  test.each([
    "",
    "   ",
    "abc",
    "2d",
    "1d20++5",
    "d0",
    "1d2000",
    "3d6kh5",
    "3d6kh0",
    "101d6",
    "100d6+100d6+100d6",
    "1d20+"
  ])("recusa %p", (texto) => {
    const r = interpretarExpressao(texto);
    expect(r.ok).toBe(false);
    expect(typeof r.erro).toBe("string");
  });

  test("d20 sem quantidade vale 1 dado", () => {
    expect(rolar("d20", [9]).total).toBe(9);
  });

  test("rolagem real fica dentro dos limites", () => {
    for (let i = 0; i < 200; i += 1) {
      const r = rolarExpressao("1d6");
      expect(r.total).toBeGreaterThanOrEqual(1);
      expect(r.total).toBeLessThanOrEqual(6);
    }
  });
});
