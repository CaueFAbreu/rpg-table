// Utilitarios de identificacao de sala.
// O ID da sala funciona como um "link secreto": sem ele nao ha como descobrir a mesa,
// porque as regras do Firestore nao permitem listar as salas (so ler uma sala pelo ID).

// Sem caracteres ambiguos (i, l, o, 0, 1) para facilitar ditar/digitar o codigo.
export const ROOM_ID_ALPHABET = "abcdefghjkmnpqrstuvwxyz23456789";
export const ROOM_ID_LENGTH = 10;

export function generateRoomId() {
  const bytes = new Uint8Array(ROOM_ID_LENGTH);
  window.crypto.getRandomValues(bytes);

  return Array.from(
    bytes,
    (byte) => ROOM_ID_ALPHABET[byte % ROOM_ID_ALPHABET.length]
  ).join("");
}

// Retorna "" quando o valor nao gera um ID valido.
export function normalizeRoomId(value) {
  return String(value ?? "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9-_]/g, "");
}
