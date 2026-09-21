import {
  estaOnline,
  PRESENCE_HEARTBEAT_MS,
  PRESENCE_ONLINE_WINDOW_MS
} from "./presenca";

describe("estaOnline", () => {
  const agora = 1_000_000_000;

  test("visto agora ha pouco esta online", () => {
    expect(estaOnline(agora - 1000, agora)).toBe(true);
  });

  test("passou da janela fica inativo", () => {
    expect(estaOnline(agora - PRESENCE_ONLINE_WINDOW_MS - 1, agora)).toBe(false);
  });

  test("sem registro de presenca fica inativo", () => {
    expect(estaOnline(undefined, agora)).toBe(false);
    expect(estaOnline(0, agora)).toBe(false);
  });

  test("a janela tolera pelo menos dois batimentos perdidos", () => {
    expect(PRESENCE_ONLINE_WINDOW_MS).toBeGreaterThanOrEqual(PRESENCE_HEARTBEAT_MS * 2);
  });
});
