import { useState } from "react";
import { normalizarPontosMedo, PONTOS_MEDO_MAX } from "../utils/medo";
import { corClasse, marcadoresDoPersonagem } from "../utils/marcadores";

function BotaoMedo({ children, onClick, disabled, label }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={label}
      className="h-9 min-w-9 rounded border border-purple-500/40 bg-black/40 px-2 text-sm font-bold text-purple-100 transition hover:bg-purple-500/20 disabled:cursor-not-allowed disabled:opacity-30"
    >
      {children}
    </button>
  );
}

// Uma linha por personagem: nome, dono, o valor atual de cada marcador (Vida, Sanidade...) e
// as condicoes ativas. Para o mestre ver a mesa inteira sem abrir ficha por ficha.
function TabelaPersonagens({ personagens }) {
  if (personagens.length === 0) {
    return <p className="py-2 text-center text-xs text-gray-500">Nenhum personagem na sala ainda.</p>;
  }

  return (
    <div className="flex flex-col gap-2">
      {personagens.map((char) => (
        <div key={char.id} className="rounded-lg border border-gray-700/50 bg-black/30 px-3 py-2">
          <div className="mb-1.5 flex items-baseline justify-between gap-2">
            <span className="truncate text-sm font-bold text-white">{char.nome}</span>
            {char.jogador && <span className="shrink-0 text-[10px] text-gray-500">{char.jogador}</span>}
          </div>

          <div className="flex flex-wrap gap-x-3 gap-y-1">
            {marcadoresDoPersonagem(char).map((m) => (
              <span key={m.id} className="flex items-center gap-1 text-xs">
                <span className={`h-2 w-2 rounded-full ${corClasse(m.cor)}`} />
                <span className="text-gray-400">{m.nome}</span>
                <span className="font-bold text-white">{m.atual}/{m.max}</span>
              </span>
            ))}
          </div>

          {(char.condicoes || []).length > 0 && (
            <div className="mt-1.5 flex flex-wrap gap-1">
              {char.condicoes.map((c) => (
                <span
                  key={c}
                  className="rounded-full border border-amber-500/40 bg-amber-950/40 px-2 py-0.5 text-[10px] font-bold text-amber-200"
                >
                  {c}
                </span>
              ))}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

export default function PainelMestre({
  pontosMedo, onSetPontosMedo, removidos = [], onReadmitir, personagens = []
}) {
  const [editando, setEditando] = useState(false);
  const [rascunho, setRascunho] = useState("");

  function ajustar(delta) {
    const proximo = normalizarPontosMedo(pontosMedo + delta);
    if (proximo !== null) onSetPontosMedo(proximo);
  }

  function iniciarEdicao() {
    setRascunho(String(pontosMedo));
    setEditando(true);
  }

  function confirmarEdicao() {
    setEditando(false);
    const proximo = normalizarPontosMedo(rascunho);
    if (proximo !== null && proximo !== pontosMedo) onSetPontosMedo(proximo);
  }

  return (
    <div className="bg-black/20 border border-purple-500/40 rounded-xl p-4">
      <div className="mb-3 flex items-center justify-between gap-2">
        <h3 className="text-sm font-bold tracking-widest">PAINEL DO MESTRE</h3>
        <span className="text-[10px] uppercase tracking-widest text-gray-500">so voce ve</span>
      </div>

      <div className="rounded-lg border border-purple-500/30 bg-black/30 p-3">
        <p className="mb-2 text-center text-xs font-bold tracking-widest text-purple-300">
          PONTOS DE MEDO
        </p>

        <div className="flex items-center justify-between gap-1">
          <BotaoMedo label="Remover 5 pontos de medo" onClick={() => ajustar(-5)} disabled={pontosMedo <= 0}>
            -5
          </BotaoMedo>
          <BotaoMedo label="Remover 1 ponto de medo" onClick={() => ajustar(-1)} disabled={pontosMedo <= 0}>
            -1
          </BotaoMedo>

          {editando ? (
            <input
              type="number"
              min={0}
              max={PONTOS_MEDO_MAX}
              value={rascunho}
              onChange={(e) => setRascunho(e.target.value)}
              onBlur={confirmarEdicao}
              onKeyDown={(e) => {
                if (e.key === "Enter") confirmarEdicao();
                if (e.key === "Escape") setEditando(false);
              }}
              autoFocus
              aria-label="Novo valor de pontos de medo"
              className="w-16 rounded border border-purple-400 bg-black/60 px-1 text-center text-2xl font-bold text-white outline-none"
            />
          ) : (
            <button
              type="button"
              onClick={iniciarEdicao}
              aria-label="Editar pontos de medo"
              title="Clique para digitar um valor"
              className="min-w-16 rounded text-center text-4xl font-bold text-purple-200 transition hover:bg-white/10"
            >
              {pontosMedo}
            </button>
          )}

          <BotaoMedo label="Adicionar 1 ponto de medo" onClick={() => ajustar(1)} disabled={pontosMedo >= PONTOS_MEDO_MAX}>
            +1
          </BotaoMedo>
          <BotaoMedo label="Adicionar 5 pontos de medo" onClick={() => ajustar(5)} disabled={pontosMedo >= PONTOS_MEDO_MAX}>
            +5
          </BotaoMedo>
        </div>

        <button
          type="button"
          onClick={() => onSetPontosMedo(0)}
          disabled={pontosMedo === 0}
          className="mt-3 w-full rounded border border-gray-700 py-1 text-[10px] font-bold uppercase tracking-widest text-gray-400 transition hover:border-red-500 hover:text-red-300 disabled:cursor-not-allowed disabled:opacity-30"
        >
          Zerar
        </button>
      </div>

      <div className="mt-3">
        <p className="mb-2 text-[10px] font-bold uppercase tracking-widest text-gray-500">
          Personagens
        </p>
        <TabelaPersonagens personagens={personagens} />
      </div>

      {removidos.length > 0 && (
        <div className="mt-3">
          <p className="mb-2 text-[10px] font-bold uppercase tracking-widest text-gray-500">
            Removidos da campanha
          </p>
          <div className="flex flex-col gap-2">
            {removidos.map((removido) => (
              <div
                key={removido.id}
                className="flex items-center justify-between gap-2 rounded-lg border border-gray-700/50 bg-black/30 px-3 py-2 text-sm"
              >
                <span className="min-w-0 truncate text-gray-300">{removido.nome || "Jogador"}</span>
                <button
                  type="button"
                  onClick={() => onReadmitir(removido.id)}
                  className="shrink-0 rounded border border-green-500/40 px-2 py-1 text-[10px] font-bold uppercase tracking-widest text-green-300 transition hover:bg-green-500/10"
                >
                  Readmitir
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
