// Rolls fixos: ataques (ou outras rolagens) que o jogador salva na ficha para usar com um
// clique, sem digitar a expressao de novo. Ver src/utils/dados.js (rolarAtaqueComDano) para
// como o ataque e o dano sao rolados juntos e como o critico multiplica o dano.

import { interpretarExpressao } from "./dados";

export const NOME_MAX_LENGTH = 40;
export const MULTIPLICADOR_PADRAO = 2;
export const MARGEM_CRITICO_PADRAO = 20;

export function gerarIdRollFixo() {
  return `rf-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

function erro(mensagem) {
  return { ok: false, erro: mensagem };
}

// Confere nome e as expressoes de ataque/dano, e normaliza multiplicador e margem de critico
// para numeros validos. `regraD20` (opcional) valida as expressoes com a regra da sala.
export function validarRollFixo(dados, { regraD20 } = {}) {
  const nome = String(dados?.nome ?? "").trim().slice(0, NOME_MAX_LENGTH);
  if (!nome) return erro("Dê um nome para o ataque, por exemplo \"Ataque Corrente\".");

  const dano = String(dados?.dano ?? "").trim();
  if (!dano) return erro("Informe a expressão de dano, por exemplo 3d6+2d6.");

  const danoValido = interpretarExpressao(dano, { regraD20 });
  if (!danoValido.ok) return erro(`Dano inválido: ${danoValido.erro}`);

  const ataque = String(dados?.ataque ?? "").trim();
  if (ataque) {
    const ataqueValido = interpretarExpressao(ataque, { regraD20 });
    if (!ataqueValido.ok) return erro(`Ataque inválido: ${ataqueValido.erro}`);
  }

  const multiplicadorNum = Math.floor(Number(dados?.multiplicador));
  const multiplicador = Number.isFinite(multiplicadorNum) && multiplicadorNum >= 1 && multiplicadorNum <= 10
    ? multiplicadorNum
    : MULTIPLICADOR_PADRAO;

  const margemNum = Math.floor(Number(dados?.margemCritico));
  const margemCritico = Number.isFinite(margemNum) && margemNum >= 1 && margemNum <= 20
    ? margemNum
    : MARGEM_CRITICO_PADRAO;

  return {
    ok: true,
    roll: {
      id: dados?.id || gerarIdRollFixo(),
      nome,
      ataque,
      dano,
      multiplicador,
      margemCritico
    }
  };
}
