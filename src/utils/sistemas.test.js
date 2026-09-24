import { descreverRegraD20, regraD20DaSala, sistemaDaSala, SISTEMAS, SISTEMA_PADRAO } from "./sistemas";

test("salas antigas, sem o campo, mantem a regra do maior d20", () => {
  expect(regraD20DaSala({})).toBe("maior");
  expect(regraD20DaSala(undefined)).toBe("maior");
});

test("salas novas usam a regra definida", () => {
  expect(regraD20DaSala({ regraD20: "soma" })).toBe("soma");
  expect(regraD20DaSala({ regraD20: "maior" })).toBe("maior");
});

test("o sistema padrao existe e todos os presets tem regra valida", () => {
  expect(SISTEMAS[SISTEMA_PADRAO]).toBeDefined();
  Object.values(SISTEMAS).forEach((sistema) => {
    expect(["soma", "maior"]).toContain(sistema.regraD20);
  });
});

test("descreve as regras em texto", () => {
  expect(descreverRegraD20("maior")).toMatch(/maior/);
  expect(descreverRegraD20("qualquer")).toMatch(/soma/);
});

test("sistemaDaSala usa o campo salvo quando existe", () => {
  expect(sistemaDaSala({ sistema: "dnd-5e" })).toBe("dnd-5e");
  expect(sistemaDaSala({ sistema: "chave-invalida", regraD20: "soma" })).toBe(SISTEMA_PADRAO);
});

test("sistemaDaSala infere pelo regraD20 em salas antigas, sem o campo", () => {
  expect(sistemaDaSala({})).toBe("ordem-paranormal");
  expect(sistemaDaSala({ regraD20: "soma" })).toBe(SISTEMA_PADRAO);
});
