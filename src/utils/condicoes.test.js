import {
  adicionarCondicao,
  removerCondicao,
  MAX_CONDICOES,
  NOME_MAX_LENGTH
} from "./condicoes";

describe("adicionarCondicao", () => {
  test("adiciona texto normalizado (espacos nas pontas, espacos duplos)", () => {
    expect(adicionarCondicao([], "  Sangrando   muito  ")).toEqual(["Sangrando muito"]);
  });

  test("nao duplica, ignorando maiusculas/minusculas", () => {
    const lista = adicionarCondicao([], "Sangrando");
    expect(adicionarCondicao(lista, "sangrando")).toEqual(["Sangrando"]);
  });

  test("ignora texto vazio", () => {
    expect(adicionarCondicao(["Caído"], "   ")).toEqual(["Caído"]);
  });

  test("corta nomes muito longos", () => {
    const longo = "a".repeat(NOME_MAX_LENGTH + 10);
    expect(adicionarCondicao([], longo)[0]).toHaveLength(NOME_MAX_LENGTH);
  });

  test("respeita o limite maximo de condicoes", () => {
    const cheia = Array.from({ length: MAX_CONDICOES }, (_, i) => `Condição ${i}`);
    expect(adicionarCondicao(cheia, "Nova")).toEqual(cheia);
  });
});

describe("removerCondicao", () => {
  test("remove pelo texto exato", () => {
    expect(removerCondicao(["Sangrando", "Caído"], "Sangrando")).toEqual(["Caído"]);
  });

  test("nao remove nada se o texto nao existir", () => {
    const lista = ["Sangrando"];
    expect(removerCondicao(lista, "Caído")).toEqual(lista);
  });
});
