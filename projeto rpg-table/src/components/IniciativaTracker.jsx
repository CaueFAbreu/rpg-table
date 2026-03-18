import { useState } from "react";

export default function IniciativaTracker({ characters, currentUser, onUpdateIniciativa }) {
  const [editandoId, setEditandoId] = useState(null);
  const [tempValor, setTempValor] = useState("");
  const [turnoAtualIndex, setTurnoAtualIndex] = useState(null);

  // Extras são inimigos/NPCs adicionados manualmente
  const [extras, setExtras] = useState([]);
  const [adicionandoExtra, setAdicionandoExtra] = useState(false);
  const [novoExtraNome, setNovoExtraNome] = useState("");
  const [novoExtraIniciativa, setNovoExtraIniciativa] = useState("");

  // Junta personagens reais com extras
  const todos = [
    ...characters.map(c => ({ ...c, _tipo: "personagem" })),
    ...extras.map(e => ({ ...e, _tipo: "extra" }))
  ];

  const ordenados = [...todos].sort((a, b) => {
    const ia = a.iniciativa ?? -Infinity;
    const ib = b.iniciativa ?? -Infinity;
    return ib - ia;
  });

  const temIniciativas = ordenados.some(c => c.iniciativa !== undefined && c.iniciativa !== null);

  function handleClick(char) {
    if (char._tipo === "extra") {
      setEditandoId(char.id);
      setTempValor(char.iniciativa ?? "");
      return;
    }
    if (char.ownerId !== currentUser.id) return;
    setEditandoId(char.id);
    setTempValor(char.iniciativa ?? "");
  }

  function handleSalvar(char) {
    const valor = Number(tempValor);
    if (!isNaN(valor)) {
      if (char._tipo === "extra") {
        setExtras(prev => prev.map(e => e.id === char.id ? { ...e, iniciativa: valor } : e));
      } else {
        onUpdateIniciativa(char.id, valor);
      }
    }
    setEditandoId(null);
    setTempValor("");
  }

  function handleAdicionarExtra() {
    if (!novoExtraNome.trim()) return;
    const novoExtra = {
      id: `extra-${Date.now()}`,
      nome: novoExtraNome.trim(),
      classe: "Inimigo",
      iniciativa: novoExtraIniciativa !== "" ? Number(novoExtraIniciativa) : null,
      imagem: null,
      _tipo: "extra"
    };
    setExtras(prev => [...prev, novoExtra]);
    setNovoExtraNome("");
    setNovoExtraIniciativa("");
    setAdicionandoExtra(false);
  }

  function handleRemoverExtra(id) {
    setExtras(prev => prev.filter(e => e.id !== id));
    if (turnoAtualIndex !== null) setTurnoAtualIndex(0);
  }

  function handleIniciarCombate() {
    setTurnoAtualIndex(0);
  }

  function handlePassarTurno() {
    if (turnoAtualIndex === null || ordenados.length === 0) return;
    setTurnoAtualIndex((prev) => (prev + 1) % ordenados.length);
  }

  function handleEncerrarCombate() {
    setTurnoAtualIndex(null);
  }

  const charDoTurnoAtual = turnoAtualIndex !== null ? ordenados[turnoAtualIndex] : null;

  return (
    <div className="bg-black/20 border border-[#b82870]/30 rounded-xl p-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-bold tracking-widest text-sm">⚔️ INICIATIVA</h3>
        <button
          onClick={() => setAdicionandoExtra(true)}
          className="w-6 h-6 rounded-full bg-[#b82870] hover:bg-[#9a205d] text-white font-bold text-sm flex items-center justify-center transition"
          title="Adicionar inimigo / NPC"
        >
          +
        </button>
      </div>

      {/* FORMULÁRIO DE PERSONAGEM EXTRA */}
      {adicionandoExtra && (
        <div className="mb-3 bg-black/40 border border-[#b82870]/50 rounded-lg p-3 flex flex-col gap-2">
          <input
            type="text"
            value={novoExtraNome}
            onChange={(e) => setNovoExtraNome(e.target.value)}
            placeholder="Nome (ex: zumbi de sangue)"
            autoFocus
            onKeyDown={(e) => e.key === "Enter" && handleAdicionarExtra()}
            className="w-full bg-black/50 border border-gray-700 focus:border-[#b82870] text-white text-sm rounded px-3 py-1.5 outline-none"
          />
          <input
            type="number"
            value={novoExtraIniciativa}
            onChange={(e) => setNovoExtraIniciativa(e.target.value)}
            placeholder="Iniciativa"
            onKeyDown={(e) => e.key === "Enter" && handleAdicionarExtra()}
            className="w-full bg-black/50 border border-gray-700 focus:border-[#b82870] text-white text-sm rounded px-3 py-1.5 outline-none"
          />
          <div className="flex gap-2">
            <button
              onClick={handleAdicionarExtra}
              className="flex-1 bg-[#b82870] hover:bg-[#9a205d] text-white text-sm font-bold py-1.5 rounded transition"
            >
              Adicionar
            </button>
            <button
              onClick={() => { setAdicionandoExtra(false); setNovoExtraNome(""); setNovoExtraIniciativa(""); }}
              className="flex-1 bg-black/40 hover:bg-black/60 border border-gray-700 text-gray-400 text-sm py-1.5 rounded transition"
            >
              Cancelar
            </button>
          </div>
        </div>
      )}

      <div className="flex flex-col gap-2 mb-4">
        {ordenados.map((char, index) => {
          const isOwner = char._tipo === "extra" || char.ownerId === currentUser.id;
          const isEditando = editandoId === char.id;
          const temIniciativa = char.iniciativa !== undefined && char.iniciativa !== null;
          const isVezDele = charDoTurnoAtual?.id === char.id;

          return (
            <div
              key={char.id}
              onClick={() => handleClick(char)}
              className={`flex items-center gap-3 rounded-lg px-3 py-2 border transition-all
                ${isOwner ? "cursor-pointer" : "cursor-default"}
                ${isVezDele
                  ? "border-yellow-400 bg-yellow-400/10 shadow-[0_0_12px_rgba(250,204,21,0.2)]"
                  : isEditando
                    ? "border-[#b82870] bg-black/50"
                    : "border-gray-700/50 bg-black/30 hover:border-[#b82870]/40"
                }
              `}
            >
              {/* Posição */}
              <span className={`text-xs font-bold w-5 text-center
                ${index === 0 ? "text-yellow-400" : index === 1 ? "text-gray-300" : index === 2 ? "text-orange-400" : "text-gray-600"}
              `}>
                {temIniciativa ? `${index + 1}º` : "—"}
              </span>

              {/* Avatar */}
              {char.imagem ? (
                <img src={char.imagem} alt={char.nome} className="w-8 h-8 rounded-full object-cover border border-gray-700" />
              ) : (
                <div className={`w-8 h-8 rounded-full border flex items-center justify-center text-xs font-bold
                  ${char._tipo === "extra"
                    ? "bg-gray-800 border-gray-600 text-gray-400"
                    : "bg-[#3a1428] border-gray-700 text-[#b82870]"
                  }`}
                >
                  {char._tipo === "extra" ? "💀" : char.nome?.[0]?.toUpperCase()}
                </div>
              )}

              {/* Nome + Tipo */}
              <div className="flex-1 min-w-0">
                <p className={`text-sm font-bold truncate ${isVezDele ? "text-yellow-300" : char._tipo === "extra" ? "text-gray-300" : "text-white"}`}>
                  {char.nome}
                  {isVezDele && <span className="ml-2 text-[10px] text-yellow-400 font-bold tracking-widest">● VEZ</span>}
                </p>
                <p className={`text-xs truncate ${char._tipo === "extra" ? "text-gray-500" : "text-[#b82870]"}`}>
                  {char.classe}
                </p>
              </div>

              {/* Valor + remover (extras) */}
              <div className="shrink-0 flex items-center gap-1">
                {isEditando ? (
                  <input
                    type="number"
                    value={tempValor}
                    onChange={(e) => setTempValor(e.target.value)}
                    onBlur={() => handleSalvar(char)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") handleSalvar(char);
                      if (e.key === "Escape") setEditandoId(null);
                    }}
                    autoFocus
                    onClick={(e) => e.stopPropagation()}
                    className="w-14 text-center bg-black/60 border border-[#b82870] text-white font-bold rounded px-1 py-0.5 outline-none text-sm"
                  />
                ) : (
                  <div className={`w-14 text-center font-bold text-lg border rounded px-2 py-0.5 transition-all
                    ${isVezDele
                      ? "text-yellow-400 border-yellow-400 bg-yellow-400/20"
                      : temIniciativa
                        ? index === 0
                          ? "text-yellow-400 border-yellow-400/50 bg-yellow-400/10"
                          : "text-white border-gray-700 bg-black/40"
                        : "text-gray-600 border-gray-800 bg-black/20 text-sm"
                    }`}
                  >
                    {temIniciativa ? char.iniciativa : isOwner ? "clique" : "—"}
                  </div>
                )}

                {char._tipo === "extra" && (
                  <button
                    onClick={(e) => { e.stopPropagation(); handleRemoverExtra(char.id); }}
                    className="text-gray-600 hover:text-red-400 text-xs font-bold ml-1 transition"
                    title="Remover"
                  >
                    ✕
                  </button>
                )}
              </div>
            </div>
          );
        })}

        {todos.length === 0 && (
          <p className="text-gray-500 text-sm text-center py-4">Nenhum personagem ainda...</p>
        )}
      </div>

      {/* BOTÕES DE COMBATE */}
      {temIniciativas && (
        <div className="flex gap-2 mt-2">
          {turnoAtualIndex === null ? (
            <button
              onClick={handleIniciarCombate}
              className="flex-1 bg-[#b82870] hover:bg-[#9a205d] text-white text-sm font-bold py-2 rounded-lg transition shadow-lg shadow-[#b82870]/20"
            >
              ⚔️ Iniciar Combate
            </button>
          ) : (
            <>
              <button
                onClick={handlePassarTurno}
                className="flex-1 bg-yellow-500 hover:bg-yellow-400 text-black text-sm font-bold py-2 rounded-lg transition shadow-lg shadow-yellow-500/20"
              >
                ▶ Passar Turno
              </button>
              <button
                onClick={handleEncerrarCombate}
                className="bg-black/40 hover:bg-red-900/40 border border-gray-700 hover:border-red-500 text-gray-400 hover:text-red-400 text-sm font-bold px-3 py-2 rounded-lg transition"
                title="Encerrar Combate"
              >
                ✕
              </button>
            </>
          )}
        </div>
      )}
    </div>
  );
}