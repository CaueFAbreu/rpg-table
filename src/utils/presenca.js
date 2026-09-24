// Presenca dos jogadores na sala.
//
// Cada gravacao em `jogadores/{uid}` e entregue a TODOS os jogadores conectados, e cada entrega
// conta como uma leitura no Firestore. Com N jogadores, gravar a cada minuto custa ~N*N leituras
// por minuto, o que esgota a cota gratuita (50 mil leituras/dia) rapido numa demo com plateia.
// Por isso a presenca e "preguicosa": batimento espacado, so com a aba visivel e sem gravar
// a cada tecla digitada no campo de nome.

export const PRESENCE_HEARTBEAT_MS = 4 * 60 * 1000; // batimento enquanto a aba esta visivel
export const PRESENCE_ONLINE_WINDOW_MS = 9 * 60 * 1000; // "online" = visto ha menos que isso
export const PRESENCE_NAME_DEBOUNCE_MS = 800; // espera parar de digitar o nome antes de gravar
export const PRESENCE_MIN_GAP_MS = 30 * 1000; // ao voltar para a aba, nao regrava se foi ha pouco

export function estaOnline(lastSeen, agora = Date.now()) {
  if (!lastSeen) return false;
  return agora - lastSeen < PRESENCE_ONLINE_WINDOW_MS;
}
