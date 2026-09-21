import { webcrypto } from "crypto";
import {
  generateRoomId,
  normalizeRoomId,
  ROOM_ID_ALPHABET,
  ROOM_ID_LENGTH
} from "./salas";

beforeAll(() => {
  if (!window.crypto) {
    Object.defineProperty(window, "crypto", { value: webcrypto });
  }
});

describe("generateRoomId", () => {
  test("gera IDs com o tamanho e o alfabeto esperados", () => {
    const id = generateRoomId();
    expect(id).toHaveLength(ROOM_ID_LENGTH);
    for (const char of id) {
      expect(ROOM_ID_ALPHABET).toContain(char);
    }
  });

  test("gera IDs diferentes a cada chamada", () => {
    const ids = new Set(Array.from({ length: 200 }, () => generateRoomId()));
    expect(ids.size).toBe(200);
  });

  test("o ID gerado ja e um ID normalizado valido", () => {
    const id = generateRoomId();
    expect(normalizeRoomId(id)).toBe(id);
  });
});

describe("normalizeRoomId", () => {
  test("remove espacos nas pontas e converte para minusculas", () => {
    expect(normalizeRoomId("  Mesa Do Cae  ")).toBe("mesa-do-cae");
  });

  test("remove caracteres invalidos", () => {
    expect(normalizeRoomId("sala/../#1!")).toBe("sala1");
  });

  test("retorna string vazia quando nao sobra nada valido", () => {
    expect(normalizeRoomId("   ")).toBe("");
    expect(normalizeRoomId("###")).toBe("");
    expect(normalizeRoomId(null)).toBe("");
  });
});
