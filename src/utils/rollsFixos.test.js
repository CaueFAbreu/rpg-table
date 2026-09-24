import { validarRollFixo, MULTIPLICADOR_PADRAO, MARGEM_CRITICO_PADRAO } from "./rollsFixos";

describe("validarRollFixo", () => {
  test("aceita um ataque completo e normaliza os numeros", () => {
    const r = validarRollFixo({
      nome: "Ataque Corrente",
      ataque: "1d20+7",
      dano: "3d6+2d6",
      multiplicador: 3,
      margemCritico: 19
    });

    expect(r.ok).toBe(true);
    expect(r.roll).toMatchObject({
      nome: "Ataque Corrente",
      ataque: "1d20+7",
      dano: "3d6+2d6",
      multiplicador: 3,
      margemCritico: 19
    });
    expect(typeof r.roll.id).toBe("string");
  });

  test("aceita um roll so de dano, sem ataque", () => {
    const r = validarRollFixo({ nome: "Dano de queda", dano: "2d6" });
    expect(r.ok).toBe(true);
    expect(r.roll.ataque).toBe("");
  });

  test("usa multiplicador e margem padrao quando nao informados ou invalidos", () => {
    const r = validarRollFixo({ nome: "Soco", dano: "1d4", multiplicador: 0, margemCritico: 99 });
    expect(r.roll.multiplicador).toBe(MULTIPLICADOR_PADRAO);
    expect(r.roll.margemCritico).toBe(MARGEM_CRITICO_PADRAO);
  });

  test("exige nome", () => {
    expect(validarRollFixo({ nome: "  ", dano: "1d6" }).ok).toBe(false);
  });

  test("exige dano", () => {
    expect(validarRollFixo({ nome: "Ataque", dano: "" }).ok).toBe(false);
  });

  test("recusa expressao de dano invalida", () => {
    const r = validarRollFixo({ nome: "Ataque", dano: "3d6kh9" });
    expect(r.ok).toBe(false);
    expect(r.erro).toMatch(/Dano/);
  });

  test("recusa expressao de ataque invalida", () => {
    const r = validarRollFixo({ nome: "Ataque", ataque: "d0", dano: "1d6" });
    expect(r.ok).toBe(false);
    expect(r.erro).toMatch(/Ataque/);
  });

  test("mantem o id existente ao editar", () => {
    const r = validarRollFixo({ id: "rf-fixo-123", nome: "Ataque", dano: "1d6" });
    expect(r.roll.id).toBe("rf-fixo-123");
  });
});
