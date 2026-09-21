// Pontos de Medo: regra da casa. Reserva da mesa, gerenciada so pelo mestre.
// Fica em salas/{salaId}/mestre/medo (subcolecao legivel apenas pelo mestre, ver firestore.rules).

export const PONTOS_MEDO_MAX = 999;

// Devolve um inteiro entre 0 e PONTOS_MEDO_MAX, ou null se o valor nao for um numero.
export function normalizarPontosMedo(valor) {
  if (valor === "" || valor === null || valor === undefined) return null;

  const numero = Math.floor(Number(valor));
  if (!Number.isFinite(numero)) return null;

  return Math.min(PONTOS_MEDO_MAX, Math.max(0, numero));
}
