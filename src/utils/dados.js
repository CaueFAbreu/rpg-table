// Motor de rolagem de dados (funcoes puras, sem React).
//
// Notacao aceita (maiusculas/minusculas e espacos sao ignorados):
//   2d8+1d4+5      soma de dados e numeros
//   2d20kh1        rola 2d20 e mantem o MAIOR (vantagem)
//   2d20kl1        rola 2d20 e mantem o MENOR (desvantagem)
//   4d6kh3         rola 4d6 e soma os 3 maiores
//
// A regra do d20 vem da sala (preset do sistema):
//   "soma"   dados somam normalmente (D&D, Tormenta, generico)
//   "maior"  Ordem Paranormal: um grupo de d20 sem kh/kl mantem o maior valor,
//            e 0d20 rola 2d20 e mantem o menor.

export const REGRA_D20_SOMA = "soma";
export const REGRA_D20_MAIOR = "maior";

const MAX_DADOS_POR_TERMO = 100;
const MAX_DADOS_TOTAL = 200;
const MAX_FACES = 1000;

// sinal, (qtd)d(faces)[kh|kl[n]]  ou  sinal, constante
const TERMO = /^([+-]?)(?:(\d*)d(\d+)(?:(kh|kl)(\d*))?|(\d+))$/;

function erro(mensagem) {
  return { ok: false, erro: mensagem };
}

function dividirTermos(texto) {
  const termos = texto.match(/[+-]?[^+-]+/g);
  if (!termos || termos.join("") !== texto) return null;
  return termos;
}

export function interpretarExpressao(texto, { regraD20 = REGRA_D20_SOMA } = {}) {
  const limpo = String(texto ?? "").replace(/\s+/g, "").toLowerCase();

  if (!limpo) return erro("Digite uma expressão, por exemplo 2d8+3.");

  const pedacos = dividirTermos(limpo);
  if (!pedacos) {
    return erro("Expressão inválida. Use dados e números separados por + ou -, por exemplo 2d20kh1+5.");
  }

  const termos = [];
  let totalDados = 0;

  for (const pedaco of pedacos) {
    const rotulo = pedaco.replace(/^[+-]/, "");
    const partes = pedaco.match(TERMO);
    if (!partes) return erro(`Não entendi "${rotulo}".`);

    const sinal = partes[1] === "-" ? -1 : 1;

    if (partes[6] !== undefined) {
      termos.push({ tipo: "constante", sinal, valor: Number(partes[6]) });
      continue;
    }

    const faces = Number(partes[3]);
    let quantidade = partes[2] === "" ? 1 : Number(partes[2]);
    let manter = partes[4]
      ? { tipo: partes[4], quantidade: partes[5] === "" ? 1 : Number(partes[5]) }
      : null;

    if (faces < 1 || faces > MAX_FACES) {
      return erro(`O dado d${faces} não existe (use de d1 a d${MAX_FACES}).`);
    }

    const d20SemManter = regraD20 === REGRA_D20_MAIOR && faces === 20 && !manter;

    if (quantidade === 0) {
      if (!d20SemManter) return erro(`Quantidade de dados inválida em "${rotulo}".`);
      // Ordem Paranormal: atributo 0 rola 2 dados e fica com o menor.
      quantidade = 2;
      manter = { tipo: "kl", quantidade: 1 };
    } else if (d20SemManter) {
      manter = { tipo: "kh", quantidade: 1 };
    }

    if (quantidade > MAX_DADOS_POR_TERMO) {
      return erro(`Dados demais em "${rotulo}" (máximo ${MAX_DADOS_POR_TERMO} por termo).`);
    }

    if (manter && (manter.quantidade < 1 || manter.quantidade > quantidade)) {
      return erro(`Não dá para manter ${manter.quantidade} de ${quantidade} dados em "${rotulo}".`);
    }

    totalDados += quantidade;
    if (totalDados > MAX_DADOS_TOTAL) {
      return erro(`Dados demais na expressão (máximo ${MAX_DADOS_TOTAL}).`);
    }

    termos.push({ tipo: "dados", sinal, quantidade, faces, manter, rotulo });
  }

  return { ok: true, termos };
}

function rolarDadoAleatorio(faces) {
  return Math.floor(Math.random() * faces) + 1;
}

// Indices (dos valores rolados) que entram na soma.
function escolherMantidos(valores, manter) {
  const todos = valores.map((_, indice) => indice);
  if (!manter) return todos;

  const ordenados = [...todos].sort((a, b) => {
    const diferenca = manter.tipo === "kh" ? valores[b] - valores[a] : valores[a] - valores[b];
    return diferenca || a - b;
  });

  return ordenados.slice(0, manter.quantidade);
}

function checarCriticoFalha(valores, mantidos) {
  let vinte = false;
  let um = false;
  for (const indice of mantidos) {
    if (valores[indice] === 20) vinte = true;
    if (valores[indice] === 1) um = true;
  }
  return { vinte, um };
}

// `rolarDado(faces)` pode ser injetado nos testes para resultados previsiveis.
export function rolarExpressao(
  texto,
  { regraD20 = REGRA_D20_SOMA, rolarDado = rolarDadoAleatorio } = {}
) {
  const interpretada = interpretarExpressao(texto, { regraD20 });
  if (!interpretada.ok) return interpretada;

  let total = 0;
  let vinteMantido = false;
  let umMantido = false;
  const partes = [];

  for (const termo of interpretada.termos) {
    const marca = termo.sinal < 0 ? "-" : "+";

    if (termo.tipo === "constante") {
      total += termo.sinal * termo.valor;
      partes.push(`${marca}${termo.valor}`);
      continue;
    }

    const valores = Array.from({ length: termo.quantidade }, () => rolarDado(termo.faces));
    const mantidos = escolherMantidos(valores, termo.manter);
    const somaMantida = mantidos.reduce((soma, indice) => soma + valores[indice], 0);

    total += termo.sinal * somaMantida;

    // Critico e falha critica valem so para d20 somados, olhando os dados que ficaram.
    if (termo.faces === 20 && termo.sinal > 0) {
      const achado = checarCriticoFalha(valores, mantidos);
      if (achado.vinte) vinteMantido = true;
      if (achado.um) umMantido = true;
    }

    const mostrados = valores
      .map((valor, indice) => (mantidos.includes(indice) ? String(valor) : `(${valor})`))
      .join(", ");
    const houveDescarte = mantidos.length < valores.length;

    partes.push(`${marca}${termo.rotulo} [${mostrados}]${houveDescarte ? ` → ${somaMantida}` : ""}`);
  }

  let criticoFalha = null;
  if (vinteMantido && !umMantido) criticoFalha = "critico";
  else if (umMantido && !vinteMantido) criticoFalha = "falha";

  return {
    ok: true,
    total,
    detalhe: partes.join(" ").replace(/^\+/, "").trim(),
    criticoFalha
  };
}
