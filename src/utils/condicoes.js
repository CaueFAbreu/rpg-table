// Condicoes rapidas: etiquetas curtas que ficam visiveis no personagem para o grupo lembrar
// do que esta afetando ele (ex.: "Sangrando", "Apavorado"). Guardadas como lista de texto no
// proprio personagem; sem estado por tras (duracao, origem) de proposito, para servir a
// qualquer sistema.

export const NOME_MAX_LENGTH = 24;
export const MAX_CONDICOES = 12;

// Sugestoes comuns; o campo tambem aceita qualquer texto digitado.
export const SUGESTOES_CONDICOES = [
  "Sangrando",
  "Apavorado",
  "Enlouquecido",
  "Agarrado",
  "Caído",
  "Envenenado",
  "Atordoado",
  "Inconsciente"
];

function normalizarTexto(valor) {
  return String(valor ?? "").trim().replace(/\s+/g, " ").slice(0, NOME_MAX_LENGTH);
}

// Adiciona uma condicao (sem duplicar, comparando sem diferenciar maiusculas/minusculas).
// Retorna a mesma lista se o texto for vazio, repetido ou se o limite ja foi atingido.
export function adicionarCondicao(lista, texto) {
  const nome = normalizarTexto(texto);
  if (!nome) return lista;
  if (lista.length >= MAX_CONDICOES) return lista;

  const jaTem = lista.some((c) => c.toLowerCase() === nome.toLowerCase());
  if (jaTem) return lista;

  return [...lista, nome];
}

export function removerCondicao(lista, texto) {
  return lista.filter((c) => c !== texto);
}
