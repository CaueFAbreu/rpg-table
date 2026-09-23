// Marcadores configuraveis (Vida, Sanidade, Esforco, PM, e o que mais a mesa precisar) no
// lugar de barras fixas. Cada personagem guarda a propria lista; a sala so sugere um ponto de
// partida, de acordo com o sistema escolhido ao criar a sala.

export const CORES_MARCADOR = [
  { valor: "vermelho", classe: "bg-[#b91c1c]" },
  { valor: "roxo", classe: "bg-[#5a2c91]" },
  { valor: "laranja", classe: "bg-[#f97316]" },
  { valor: "azul", classe: "bg-[#1d4ed8]" },
  { valor: "verde", classe: "bg-[#15803d]" },
  { valor: "amarelo", classe: "bg-[#a16207]" }
];

const NOME_MAX_LENGTH = 20;
const MAX_VALOR = 999;

export function corClasse(cor) {
  return (CORES_MARCADOR.find((c) => c.valor === cor) || CORES_MARCADOR[0]).classe;
}

export function gerarIdMarcador() {
  return `mk-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

// Presets por sistema (ver src/utils/sistemas.js para as chaves).
const PRESETS = {
  "ordem-paranormal": [
    { nome: "Vida", max: 20, cor: "vermelho" },
    { nome: "Sanidade", max: 20, cor: "roxo" },
    { nome: "Esforço", max: 2, cor: "laranja" }
  ],
  "dnd-5e": [{ nome: "Vida", max: 10, cor: "vermelho" }],
  "tormenta-20": [
    { nome: "Vida", max: 10, cor: "vermelho" },
    { nome: "Mana", max: 5, cor: "azul" }
  ],
  generico: [{ nome: "Vida", max: 10, cor: "vermelho" }]
};

export function marcadoresPadrao(sistemaChave) {
  const lista = PRESETS[sistemaChave] || PRESETS.generico;
  return lista.map((m) => ({ id: gerarIdMarcador(), nome: m.nome, atual: m.max, max: m.max, cor: m.cor }));
}

// Personagens criados antes dos marcadores configuraveis guardavam vida/sanidade/esforco
// como campos fixos no documento. Convertidos aqui so para exibir; o documento so muda de
// fato quando o dono edita algum marcador (ver handleSalvarMarcadores em CharacterCard).
export function marcadoresDoPersonagem(character) {
  if (Array.isArray(character?.marcadores)) return character.marcadores;

  const legado = [];
  if (character?.vida !== undefined) {
    legado.push({ id: "legado-vida", nome: "Vida", atual: character.vida, max: character.vidaMax ?? character.vida, cor: "vermelho" });
  }
  if (character?.sanidade !== undefined) {
    legado.push({ id: "legado-sanidade", nome: "Sanidade", atual: character.sanidade, max: character.sanidadeMax ?? character.sanidade, cor: "roxo" });
  }
  if (character?.esforco !== undefined) {
    legado.push({ id: "legado-esforco", nome: "Esforço", atual: character.esforco, max: character.esforcoMax ?? character.esforco, cor: "laranja" });
  }

  return legado.length > 0 ? legado : marcadoresPadrao("generico");
}

// Confere nome/max/cor e ajusta "atual" para dentro do novo limite. Retorna {ok:false, erro}
// se faltar nome.
export function validarMarcador(dados) {
  const nome = String(dados?.nome ?? "").trim().slice(0, NOME_MAX_LENGTH);
  if (!nome) return { ok: false, erro: "Dê um nome para o marcador, por exemplo Vida." };

  const maxNum = Math.floor(Number(dados?.max));
  const max = Number.isFinite(maxNum) && maxNum >= 1 && maxNum <= MAX_VALOR ? maxNum : 10;

  const atualNum = Math.floor(Number(dados?.atual));
  const atualBase = Number.isFinite(atualNum) ? atualNum : max;
  const atual = Math.min(max, Math.max(0, atualBase));

  const cor = CORES_MARCADOR.some((c) => c.valor === dados?.cor) ? dados.cor : "vermelho";

  return {
    ok: true,
    marcador: { id: dados?.id || gerarIdMarcador(), nome, atual, max, cor }
  };
}
