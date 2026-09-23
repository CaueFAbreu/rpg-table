import {
  corClasse,
  marcadoresDoPersonagem,
  marcadoresPadrao,
  validarMarcador
} from "./marcadores";

describe("marcadoresPadrao", () => {
  test("Ordem Paranormal traz Vida, Sanidade e Esforço", () => {
    const lista = marcadoresPadrao("ordem-paranormal");
    expect(lista.map((m) => m.nome)).toEqual(["Vida", "Sanidade", "Esforço"]);
    lista.forEach((m) => expect(m.atual).toBe(m.max));
  });

  test("sistema desconhecido cai no genérico", () => {
    expect(marcadoresPadrao("nao-existe").map((m) => m.nome)).toEqual(["Vida"]);
  });

  test("cada marcador tem um id proprio", () => {
    const [a, b] = marcadoresPadrao("tormenta-20");
    expect(a.id).not.toBe(b.id);
  });
});

describe("marcadoresDoPersonagem", () => {
  test("usa a lista salva quando ja existe", () => {
    const lista = [{ id: "1", nome: "PV", atual: 5, max: 10, cor: "azul" }];
    expect(marcadoresDoPersonagem({ marcadores: lista })).toBe(lista);
  });

  test("converte personagem antigo (vida/sanidade/esforco fixos)", () => {
    const legado = marcadoresDoPersonagem({
      vida: 40, vidaMax: 60,
      sanidade: 20, sanidadeMax: 20,
      esforco: 1, esforcoMax: 2
    });

    expect(legado).toEqual([
      { id: "legado-vida", nome: "Vida", atual: 40, max: 60, cor: "vermelho" },
      { id: "legado-sanidade", nome: "Sanidade", atual: 20, max: 20, cor: "roxo" },
      { id: "legado-esforco", nome: "Esforço", atual: 1, max: 2, cor: "laranja" }
    ]);
  });

  test("personagem sem nada cai no marcador padrao generico", () => {
    expect(marcadoresDoPersonagem({}).map((m) => m.nome)).toEqual(["Vida"]);
  });
});

describe("validarMarcador", () => {
  test("normaliza e clampa o valor atual dentro do novo maximo", () => {
    const r = validarMarcador({ nome: "Vida", atual: 15, max: 10, cor: "azul" });
    expect(r.ok).toBe(true);
    expect(r.marcador).toMatchObject({ nome: "Vida", atual: 10, max: 10, cor: "azul" });
  });

  test("exige nome", () => {
    expect(validarMarcador({ nome: "  ", max: 10 }).ok).toBe(false);
  });

  test("usa maximo padrao quando invalido, e cor padrao quando desconhecida", () => {
    const r = validarMarcador({ nome: "Foco", max: -5, cor: "rosa-choque" });
    expect(r.marcador.max).toBe(10);
    expect(r.marcador.cor).toBe("vermelho");
  });

  test("sem atual informado, comeca cheio", () => {
    expect(validarMarcador({ nome: "Vida", max: 30 }).marcador.atual).toBe(30);
  });
});

test("corClasse devolve uma classe valida mesmo para cor desconhecida", () => {
  expect(corClasse("nao-existe")).toBe(corClasse("vermelho"));
});
