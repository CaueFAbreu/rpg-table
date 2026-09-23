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

// Chave do sistema (ver SISTEMAS acima) para escolher os marcadores padrao de um personagem
// novo. Salas criadas antes deste campo existir nao tem `sala.sistema`: como todas jogavam
// com a regra do maior d20, tratamos como Ordem Paranormal; as demais caem no generico.
export function sistemaDaSala(sala) {
  if (sala?.sistema && SISTEMAS[sala.sistema]) return sala.sistema;
  return regraD20DaSala(sala) === "maior" ? "ordem-paranormal" : SISTEMA_PADRAO;
}
