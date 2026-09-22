// Presets de sistema escolhidos ao criar a sala. Cada preset define as regras iniciais;
// o mestre pode ajustar a regra do d20 depois no Painel do Mestre.

export const SISTEMAS = {
  "ordem-paranormal": { nome: "Ordem Paranormal", regraD20: "maior" },
  "dnd-5e": { nome: "D&D 5e", regraD20: "soma" },
  "tormenta-20": { nome: "Tormenta 20", regraD20: "soma" },
  generico: { nome: "Genérico", regraD20: "soma" }
};

export const SISTEMA_PADRAO = "generico";

export const DESCRICAO_REGRA_D20 = {
  soma: "soma dos dados",
  maior: "maior d20 (Ordem Paranormal)"
};

export function descreverRegraD20(regra) {
  return DESCRICAO_REGRA_D20[regra] || DESCRICAO_REGRA_D20.soma;
}

// Salas criadas antes desta regra existir nao tem o campo: elas jogavam com "maior d20",
// entao esse continua sendo o comportamento delas.
export function regraD20DaSala(sala) {
  return sala?.regraD20 === "soma" ? "soma" : "maior";
}
