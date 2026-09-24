import { useState } from "react";
import { validarRollFixo, MULTIPLICADOR_PADRAO, MARGEM_CRITICO_PADRAO } from "../utils/rollsFixos";

const FORM_VAZIO = { nome: "", ataque: "", dano: "", multiplicador: MULTIPLICADOR_PADRAO, margemCritico: MARGEM_CRITICO_PADRAO };

function CampoNumero({ label, value, onChange, min, max, title }) {
  return (
    <label className="flex flex-col gap-1 text-[10px] font-bold uppercase tracking-widest text-gray-400" title={title}>
      {label}
      <input
        type="number"
        min={min}
        max={max}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded border border-gray-600/50 bg-black/40 px-2 py-1.5 text-sm font-normal normal-case tracking-normal text-white outline-none focus:border-[#b82870]"
      />
    </label>
  );
}

function FormularioAtaque({ inicial, onCancelar, onSalvar, regraD20 }) {
  const [form, setForm] = useState(inicial);
  const [erro, setErro] = useState(null);

  function campo(nome) {
    return (valor) => setForm((prev) => ({ ...prev, [nome]: valor }));
  }

  function salvar(e) {
    e.preventDefault();
    const resultado = validarRollFixo(form, { regraD20 });
    if (!resultado.ok) {
      setErro(resultado.erro);
      return;
    }
    onSalvar(resultado.roll);
  }

  return (
    <form onSubmit={salvar} className="flex flex-col gap-2 rounded-lg border border-[#b82870]/40 bg-black/30 p-3">
      <input
        value={form.nome}
        onChange={(e) => campo("nome")(e.target.value)}
        placeholder="Nome (ex: Ataque Corrente)"
        maxLength={40}
        autoFocus
        className="w-full rounded border border-gray-600/50 bg-black/40 px-2 py-1.5 text-sm text-white outline-none focus:border-[#b82870]"
      />
      <div className="grid grid-cols-2 gap-2">
        <label className="flex flex-col gap-1 text-[10px] font-bold uppercase tracking-widest text-gray-400">
          Ataque (opcional)
          <input
            value={form.ataque}
            onChange={(e) => campo("ataque")(e.target.value)}
            placeholder="1d20+7"
            className="w-full rounded border border-gray-600/50 bg-black/40 px-2 py-1.5 text-sm font-mono normal-case tracking-normal text-white outline-none focus:border-[#b82870]"
          />
        </label>
        <label className="flex flex-col gap-1 text-[10px] font-bold uppercase tracking-widest text-gray-400">
          Dano
          <input
            value={form.dano}
            onChange={(e) => campo("dano")(e.target.value)}
            placeholder="3d6+2d6"
            className="w-full rounded border border-gray-600/50 bg-black/40 px-2 py-1.5 text-sm font-mono normal-case tracking-normal text-white outline-none focus:border-[#b82870]"
          />
        </label>
      </div>
      <div className="grid grid-cols-2 gap-2">
        <CampoNumero
          label="Margem de crítico"
          title="A partir de qual valor no d20 é crítico. 20 = só natural 20. 18 = 18, 19 ou 20."
          min={1}
          max={20}
          value={form.margemCritico}
          onChange={campo("margemCritico")}
        />
        <CampoNumero
          label="Multiplicador de dano"
          title="Por quanto o dano é multiplicado quando o ataque critica."
          min={1}
          max={10}
          value={form.multiplicador}
          onChange={campo("multiplicador")}
        />
      </div>

      {erro && <p className="text-xs text-red-400">{erro}</p>}

      <div className="flex gap-2">
        <button
          type="submit"
          className="flex-1 rounded bg-[#b82870] py-1.5 text-xs font-bold text-white transition hover:bg-[#9a205d]"
        >
          Salvar
        </button>
        <button
          type="button"
          onClick={onCancelar}
          className="rounded border border-gray-600 px-3 py-1.5 text-xs font-bold text-gray-300 transition hover:bg-white/10"
        >
          Cancelar
        </button>
      </div>
    </form>
  );
}

// Ataques (e outros rolls fixos) salvos na ficha: um clique rola o ataque e o dano juntos,
// multiplicando o dano se o ataque critica. Ver src/utils/dados.js e src/utils/rollsFixos.js.
export default function AtaquesFixos({ rolls = [], regraD20, onSalvarRolls, onRolar }) {
  const [editandoId, setEditandoId] = useState(null); // null = fechado; "novo" = criando
  const [rolando, setRolando] = useState(null);

  function abrirNovo() {
    setEditandoId("novo");
  }

  function salvar(rollValidado) {
    const existe = rolls.some((r) => r.id === rollValidado.id);
    const proximaLista = existe
      ? rolls.map((r) => (r.id === rollValidado.id ? rollValidado : r))
      : [...rolls, rollValidado];

    onSalvarRolls(proximaLista);
    setEditandoId(null);
  }

  function excluir(id) {
    if (!window.confirm("Excluir este ataque da ficha?")) return;
    onSalvarRolls(rolls.filter((r) => r.id !== id));
  }

  async function rolar(roll) {
    if (rolando) return;
    setRolando(roll.id);
    try {
      await onRolar(roll);
    } finally {
      setRolando(null);
    }
  }

  return (
    <div className="mt-6 border-t border-gray-700/50 pt-4">
      <div className="mb-2 flex items-center justify-between">
        <h3 className="font-bold text-sm tracking-widest text-gray-300">ATAQUES</h3>
        {editandoId !== "novo" && (
          <button
            onClick={abrirNovo}
            className="rounded border border-[#b82870]/50 px-2 py-1 text-[10px] font-bold uppercase tracking-widest text-[#f0a3ca] transition hover:bg-[#b82870]/20"
          >
            + Novo
          </button>
        )}
      </div>

      <div className="flex flex-col gap-2">
        {rolls.map((roll) =>
          editandoId === roll.id ? (
            <FormularioAtaque
              key={roll.id}
              inicial={roll}
              regraD20={regraD20}
              onCancelar={() => setEditandoId(null)}
              onSalvar={salvar}
            />
          ) : (
            <div
              key={roll.id}
              className="flex items-center justify-between gap-2 rounded-lg border border-gray-700/50 bg-black/30 px-3 py-2"
            >
              <div className="min-w-0">
                <p className="truncate text-sm font-bold text-white">{roll.nome}</p>
                <p className="truncate font-mono text-[11px] text-gray-400">
                  {roll.ataque ? `${roll.ataque} · ` : ""}{roll.dano}
                  {roll.multiplicador > 1 && ` (crít. x${roll.multiplicador}${roll.margemCritico < 20 ? `, ${roll.margemCritico}+` : ""})`}
                </p>
              </div>
              <div className="flex shrink-0 gap-1">
                <button
                  onClick={() => rolar(roll)}
                  disabled={rolando === roll.id}
                  className="rounded bg-[#b82870] px-3 py-1.5 text-xs font-bold text-white transition hover:bg-[#9a205d] disabled:opacity-50"
                >
                  {rolando === roll.id ? "..." : "Rolar"}
                </button>
                <button
                  onClick={() => setEditandoId(roll.id)}
                  title="Editar"
                  className="rounded border border-gray-600 px-2 py-1.5 text-xs text-gray-300 transition hover:bg-white/10"
                >
                  ✎
                </button>
                <button
                  onClick={() => excluir(roll.id)}
                  title="Excluir"
                  className="rounded border border-red-500/40 px-2 py-1.5 text-xs text-red-300 transition hover:bg-red-500/10"
                >
                  ✕
                </button>
              </div>
            </div>
          )
        )}

        {editandoId === "novo" && (
          <FormularioAtaque
            inicial={FORM_VAZIO}
            regraD20={regraD20}
            onCancelar={() => setEditandoId(null)}
            onSalvar={salvar}
          />
        )}

        {rolls.length === 0 && editandoId !== "novo" && (
          <p className="py-2 text-center text-xs text-gray-500">Nenhum ataque salvo ainda.</p>
        )}
      </div>
    </div>
  );
}
