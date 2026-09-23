import { useState } from "react";
import { adicionarCondicao, removerCondicao, SUGESTOES_CONDICOES } from "../utils/condicoes";

// Etiquetas curtas visíveis a todos ("Sangrando", "Apavorado"...). Dono e mestre podem editar;
// os demais só veem. Ver src/utils/condicoes.js.
export default function CondicoesRapidas({ condicoes = [], podeEditar, onChange }) {
  const [adicionando, setAdicionando] = useState(false);
  const [texto, setTexto] = useState("");

  function salvarNova(valor) {
    const proxima = adicionarCondicao(condicoes, valor);
    if (proxima !== condicoes) onChange(proxima);
    setTexto("");
    setAdicionando(false);
  }

  function remover(nome) {
    onChange(removerCondicao(condicoes, nome));
  }

  if (condicoes.length === 0 && !podeEditar) return null;

  return (
    <div className="mb-4 flex flex-wrap items-center justify-center gap-1.5">
      {condicoes.map((nome) => (
        <span
          key={nome}
          className="flex items-center gap-1 rounded-full border border-amber-500/40 bg-amber-950/40 px-2.5 py-0.5 text-[11px] font-bold text-amber-200"
        >
          {nome}
          {podeEditar && (
            <button
              type="button"
              onClick={() => remover(nome)}
              aria-label={`Remover condição ${nome}`}
              className="text-amber-300/70 hover:text-white"
            >
              ×
            </button>
          )}
        </span>
      ))}

      {podeEditar && (
        adicionando ? (
          <input
            list="condicoes-sugestoes"
            value={texto}
            onChange={(e) => setTexto(e.target.value)}
            onBlur={() => (texto.trim() ? salvarNova(texto) : setAdicionando(false))}
            onKeyDown={(e) => {
              if (e.key === "Enter") salvarNova(texto);
              if (e.key === "Escape") { setTexto(""); setAdicionando(false); }
            }}
            placeholder="Condição..."
            autoFocus
            className="w-28 rounded-full border border-amber-500/50 bg-black/50 px-2.5 py-0.5 text-[11px] text-white outline-none"
          />
        ) : (
          <button
            type="button"
            onClick={() => setAdicionando(true)}
            className="rounded-full border border-dashed border-gray-600 px-2.5 py-0.5 text-[11px] font-bold text-gray-400 transition hover:border-amber-500/60 hover:text-amber-200"
          >
            + Condição
          </button>
        )
      )}

      <datalist id="condicoes-sugestoes">
        {SUGESTOES_CONDICOES.map((s) => (
          <option key={s} value={s} />
        ))}
      </datalist>
    </div>
  );
}
