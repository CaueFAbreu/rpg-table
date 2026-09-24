import { useState } from "react";
import EditorImagem from "./EditorImagem";
import Inventario from "./Inventario";
import AtaquesFixos from "./AtaquesFixos";
import CondicoesRapidas from "./CondicoesRapidas";
import { CORES_MARCADOR, corClasse, marcadoresDoPersonagem, validarMarcador } from "../utils/marcadores";

function AvatarPlaceholder() {
  return (
    <svg width="192" height="192" viewBox="0 0 192 192" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect width="192" height="192" rx="12" fill="#1a0a12" />
      <circle cx="96" cy="80" r="36" fill="#3a1428" stroke="#b82870" strokeWidth="2" />
      <ellipse cx="96" cy="160" rx="56" ry="36" fill="#3a1428" stroke="#b82870" strokeWidth="2" />
      <circle cx="96" cy="76" r="20" fill="#b82870" opacity="0.3" />
      <text x="96" y="84" textAnchor="middle" fontSize="28" fill="#b82870">?</text>
    </svg>
  );
}

function EditableField({ value, onSave, isOwner, type = "text", className = "" }) {
  const [isEditing, setIsEditing] = useState(false);
  const [tempValue, setTempValue] = useState(value);

  if (!isOwner) return <span className={className}>{value}</span>;

  if (isEditing) {
    return (
      <input
        type={type}
        value={tempValue}
        onChange={(e) => setTempValue(e.target.value)}
        onBlur={() => {
          setIsEditing(false);
          onSave(type === "number" ? Number(tempValue) : tempValue);
        }}
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            setIsEditing(false);
            onSave(type === "number" ? Number(tempValue) : tempValue);
          }
        }}
        autoFocus
        className={`bg-black/40 text-white outline-none border border-[#b82870] rounded px-1 ${className}`}
        onClick={(e) => e.stopPropagation()}
      />
    );
  }

  return (
    <span
      onClick={(e) => {
        e.stopPropagation();
        setIsEditing(true);
        setTempValue(value);
      }}
      className={`cursor-pointer hover:text-[#b82870] hover:bg-white/10 rounded transition ${className}`}
      title="Clique para editar"
    >
      {value}
    </span>
  );
}

function normalizarLinkFicha(valor) {
  const limpo = String(valor ?? "").trim();
  if (!limpo) return "";
  if (/^https?:\/\//i.test(limpo)) return limpo;
  if (/^[a-z][a-z0-9+.-]*:/i.test(limpo)) return ""; // outro esquema (ex: javascript:) nao e aceito
  return `https://${limpo}`;
}

function LinkFicha({ value, onSave }) {
  const [editando, setEditando] = useState(false);
  const [rascunho, setRascunho] = useState(value || "");

  function salvar() {
    setEditando(false);
    onSave(normalizarLinkFicha(rascunho));
  }

  if (editando) {
    return (
      <input
        value={rascunho}
        onChange={(e) => setRascunho(e.target.value)}
        onBlur={salvar}
        onKeyDown={(e) => {
          if (e.key === "Enter") salvar();
          if (e.key === "Escape") { setRascunho(value || ""); setEditando(false); }
        }}
        onClick={(e) => e.stopPropagation()}
        placeholder="https://..."
        autoFocus
        className="w-44 rounded border border-[#b82870] bg-black/50 px-2 py-0.5 text-xs text-white outline-none"
      />
    );
  }

  return (
    <div className="mt-1 flex items-center justify-center gap-1.5 text-xs">
      {value ? (
        <a
          href={value}
          target="_blank"
          rel="noopener noreferrer"
          onClick={(e) => e.stopPropagation()}
          className="max-w-[160px] truncate text-gray-400 underline hover:text-[#f0a3ca]"
        >
          🔗 Ficha completa
        </a>
      ) : (
        <span className="text-gray-600">Sem link da ficha completa</span>
      )}
      <button
        type="button"
        onClick={(e) => { e.stopPropagation(); setRascunho(value || ""); setEditando(true); }}
        title="Editar link da ficha completa"
        className="text-gray-600 hover:text-gray-300"
      >
        ✎
      </button>
    </div>
  );
}

function StatusBar({
  label, current, max, colorClass, cor,
  onChangeAmount, onEditCurrent, onEditMax, onRename, onChangeCor, onRemove,
  isOwner
}) {
  const [editando, setEditando] = useState(false);
  const percent = Math.min(100, Math.max(0, (current / (max || 1)) * 100)) + "%";

  return (
    <div className="mb-4 w-full">
      <div className="flex items-center justify-center gap-1 mb-1">
        {editando ? (
          <input
            value={label}
            onChange={(e) => onRename(e.target.value)}
            onBlur={() => setEditando(false)}
            onKeyDown={(e) => e.key === "Enter" && setEditando(false)}
            autoFocus
            className="w-28 bg-black/40 border border-[#b82870] rounded px-1 text-center text-sm font-bold tracking-widest text-white outline-none"
          />
        ) : (
          <span className="text-center font-bold text-gray-400 text-sm tracking-widest">{label}</span>
        )}
        {isOwner && (
          <button
            type="button"
            onClick={() => setEditando((v) => !v)}
            title="Renomear, mudar cor ou remover"
            className="text-gray-600 hover:text-gray-300 text-xs leading-none"
          >
            ⚙
          </button>
        )}
      </div>
      {editando && (
        <div className="mb-2 flex items-center justify-center gap-1.5">
          {CORES_MARCADOR.map((c) => (
            <button
              key={c.valor}
              type="button"
              onClick={() => onChangeCor(c.valor)}
              title={c.valor}
              className={`h-4 w-4 rounded-full ${c.classe} ${cor === c.valor ? "ring-2 ring-white" : "opacity-60 hover:opacity-100"}`}
            />
          ))}
          <button
            type="button"
            onClick={onRemove}
            title="Remover este marcador"
            className="ml-1 rounded border border-red-500/40 px-1.5 text-[10px] font-bold text-red-300 hover:bg-red-500/10"
          >
            Remover
          </button>
        </div>
      )}
      <div className="relative h-8 bg-black/40 border border-gray-600 flex items-center justify-between px-3 select-none">
        <div className={`absolute top-0 left-0 h-full ${colorClass} transition-all duration-300`} style={{ width: percent }}></div>
        <div className="relative z-10 flex gap-4 text-white font-bold cursor-pointer text-lg">
          <span className="hover:text-gray-300" onClick={(e) => { e.stopPropagation(); onChangeAmount(-5); }}>{'<<'}</span>
          <span className="hover:text-gray-300" onClick={(e) => { e.stopPropagation(); onChangeAmount(-1); }}>{'<'}</span>
        </div>
        <div className="relative z-10 text-white font-normal text-lg tracking-widest flex items-center justify-center gap-1 min-w-[80px]">
          <EditableField value={current} onSave={onEditCurrent} isOwner={isOwner} type="number" className="w-12 text-right bg-transparent border-none" />
          <span>/</span>
          <EditableField value={max} onSave={onEditMax} isOwner={isOwner} type="number" className="w-12 text-left bg-transparent border-none" />
        </div>
        <div className="relative z-10 flex gap-4 text-white font-bold cursor-pointer text-lg">
          <span className="hover:text-gray-300" onClick={(e) => { e.stopPropagation(); onChangeAmount(1); }}>{'>'}</span>
          <span className="hover:text-gray-300" onClick={(e) => { e.stopPropagation(); onChangeAmount(5); }}>{'>>'}</span>
        </div>
      </div>
    </div>
  );
}

export default function CharacterCard({
  character,
  currentUser,
  isActive,
  isMestre,
  onSelect,
  onUpdateCharacter,
  onDeleteCharacter,
  regraD20,
  onRolarAtaque
}) {
  const [isEditingImage, setIsEditingImage] = useState(false);
  const [tempImage, setTempImage] = useState(null);

  const isOwner = character.ownerId === currentUser.id;

  function handleImageChange(e) {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      setTempImage(reader.result);
      setIsEditingImage(true);
    };
    reader.readAsDataURL(file);
  }

  function handleSaveImage(croppedImage) {
    onUpdateCharacter({ ...character, imagem: croppedImage });
    setIsEditingImage(false);
    setTempImage(null);
  }

  function handleDelete(e) {
    e.stopPropagation();
    if (window.confirm(`Tem certeza que deseja excluir ${character.nome}?`)) {
      onDeleteCharacter(character.id);
    }
  }

  function handleDirectEdit(field, value) {
    if (!isOwner) return;
    onUpdateCharacter({ ...character, [field]: value });
  }

  function handleUpdateInventario(novosItens) {
    onUpdateCharacter({ ...character, inventario: novosItens });
  }

  const marcadores = marcadoresDoPersonagem(character);

  function salvarMarcadores(lista) {
    onUpdateCharacter({ ...character, marcadores: lista });
  }

  function changeMarcadorAmount(id, delta) {
    if (!isOwner) return;
    salvarMarcadores(marcadores.map((m) =>
      m.id === id ? { ...m, atual: Math.min(m.max, Math.max(0, m.atual + delta)) } : m
    ));
  }

  function editarMarcador(id, patch) {
    if (!isOwner) return;
    salvarMarcadores(marcadores.map((m) => {
      if (m.id !== id) return m;
      const validado = validarMarcador({ ...m, ...patch });
      return validado.ok ? validado.marcador : m;
    }));
  }

  function removerMarcador(id) {
    if (!isOwner) return;
    if (marcadores.length <= 1) {
      alert("A ficha precisa de pelo menos um marcador.");
      return;
    }
    if (!window.confirm("Remover este marcador?")) return;
    salvarMarcadores(marcadores.filter((m) => m.id !== id));
  }

  function adicionarMarcador() {
    if (!isOwner) return;
    const cor = CORES_MARCADOR[marcadores.length % CORES_MARCADOR.length].valor;
    const validado = validarMarcador({ nome: "Novo Marcador", max: 10, cor });
    if (validado.ok) salvarMarcadores([...marcadores, validado.marcador]);
  }

  function handleSalvarAtaques(novaLista) {
    onUpdateCharacter({ ...character, rollsFixos: novaLista });
  }

  function handleSalvarCondicoes(novaLista) {
    onUpdateCharacter({ ...character, condicoes: novaLista });
  }

  function handleRolarAtaque(roll) {
    return onRolarAtaque(character, roll);
  }

  return (
    <>
      <div
        className={`relative bg-black/20 border rounded-xl p-6 transition flex flex-col items-center backdrop-blur-sm
          ${isActive ? "border-[#b82870] shadow-[0_0_20px_rgba(184,40,112,0.4)]" : "border-gray-700/50 hover:border-gray-500"}
        `}
      >
        {isOwner && (
          <button
            onClick={handleDelete}
            className="absolute top-3 right-3 text-red-500 hover:text-red-400 bg-black/40 hover:bg-black/60 w-8 h-8 rounded-full flex items-center justify-center transition border border-red-500/30 z-20"
            title="Excluir Personagem"
          >
            ✕
          </button>
        )}

        <div className="flex flex-col items-center w-full cursor-pointer" onClick={onSelect}>
          <div
            className="relative"
            onClick={(e) => {
              if (isOwner) {
                e.stopPropagation();
                document.getElementById(`file-${character.id}`).click();
              }
            }}
          >
            {character.imagem ? (
              <img src={character.imagem} alt={character.nome} className="w-48 h-48 rounded-xl object-cover border-2 border-gray-700" />
            ) : (
              <div className="w-48 h-48 rounded-xl overflow-hidden border-2 border-gray-700">
                <AvatarPlaceholder />
              </div>
            )}
            {isOwner && (
              <div className="absolute inset-0 rounded-xl bg-black/50 flex items-center justify-center opacity-0 hover:opacity-100 transition">
                <span className="text-white text-sm font-bold">📷 Trocar foto</span>
              </div>
            )}
            <input id={`file-${character.id}`} type="file" accept="image/*" className="hidden" onChange={handleImageChange} />
          </div>

          <div className="mt-4 text-center">
            <h2 className="text-xl font-bold">
              <EditableField value={character.nome} onSave={(val) => handleDirectEdit("nome", val)} isOwner={isOwner} />
            </h2>
            <p className="text-[#b82870]">
              <EditableField value={character.classe} onSave={(val) => handleDirectEdit("classe", val)} isOwner={isOwner} />
            </p>
            {isOwner ? (
              <LinkFicha value={character.linkFicha} onSave={(val) => handleDirectEdit("linkFicha", val)} />
            ) : (
              character.linkFicha && (
                <a
                  href={character.linkFicha}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={(e) => e.stopPropagation()}
                  className="mt-1 inline-block text-xs text-gray-400 underline hover:text-[#f0a3ca]"
                >
                  🔗 Ficha completa
                </a>
              )
            )}
          </div>
        </div>

        <CondicoesRapidas
          condicoes={character.condicoes || []}
          podeEditar={isOwner || isMestre}
          onChange={handleSalvarCondicoes}
        />

        <div className="w-full mt-6 bg-black/40 p-4 rounded-lg border border-gray-700/50 font-sans cursor-default">

          <div className="flex flex-wrap justify-between items-start gap-3 mb-6 text-sm font-bold">
            <div className="flex items-center gap-2">
              <span className="text-gray-400 tracking-widest text-xs">NEX</span>
              <div className="border border-[#b82870]/50 px-3 py-1 text-white bg-black/60">
                <EditableField value={character.nex || "5%"} onSave={(val) => handleDirectEdit("nex", val)} isOwner={isOwner} className="w-12 text-center" />
              </div>
            </div>
            <div className="flex flex-col items-center">
              <div className="border border-[#b82870]/50 px-4 py-1 text-white bg-black/60 mb-1 text-base">
                <EditableField value={character.peTurno || 1} onSave={(val) => handleDirectEdit("peTurno", val)} isOwner={isOwner} type="number" className="w-8 text-center" />
              </div>
              <span className="text-gray-400 text-[10px] tracking-widest">PE / TURNO</span>
            </div>
            <div className="flex flex-col items-end">
              <div className="border border-[#b82870]/50 px-4 py-1 text-white bg-black/60 mb-1 text-base">
                <EditableField value={character.deslocamento || "9 m / 6 q"} onSave={(val) => handleDirectEdit("deslocamento", val)} isOwner={isOwner} className="w-24 text-center" />
              </div>
              <span className="text-gray-400 text-[10px] tracking-widest">DESLOCAMENTO</span>
            </div>
          </div>

          {marcadores.map((m) => (
            <StatusBar
              key={m.id}
              label={m.nome}
              current={m.atual}
              max={m.max}
              cor={m.cor}
              colorClass={corClasse(m.cor)}
              onChangeAmount={(val) => changeMarcadorAmount(m.id, val)}
              onEditCurrent={(val) => editarMarcador(m.id, { atual: val })}
              onEditMax={(val) => editarMarcador(m.id, { max: val })}
              onRename={(val) => editarMarcador(m.id, { nome: val })}
              onChangeCor={(cor) => editarMarcador(m.id, { cor })}
              onRemove={() => removerMarcador(m.id)}
              isOwner={isOwner}
            />
          ))}
          {isOwner && (
            <button
              type="button"
              onClick={adicionarMarcador}
              className="mb-4 w-full rounded border border-dashed border-gray-600 py-1.5 text-xs font-bold text-gray-400 transition hover:border-[#b82870] hover:text-[#f0a3ca]"
            >
              + Marcador
            </button>
          )}

          <div className="flex flex-wrap justify-between items-end gap-3 mt-6">
            <div className="flex items-center gap-2">
              <div className="relative w-12 h-14 border-2 border-[#b82870] flex items-center justify-center rounded-b-[24px] bg-black/40">
                <span className="text-xl font-bold text-white">
                  <EditableField value={character.defesa || 10} onSave={(val) => handleDirectEdit("defesa", val)} isOwner={isOwner} type="number" className="w-8 text-center" />
                </span>
              </div>
              <div className="flex flex-col justify-end h-full pb-1">
                <div className="font-bold text-gray-400 tracking-widest text-sm leading-none mb-1">DEFESA</div>
                <div className="text-[10px] text-gray-400 font-bold flex items-center gap-1">
                  = 10 + AGI + <span className="border-b border-gray-400 text-white w-4 text-center">0</span> + <span className="border-b border-gray-400 text-white w-4 text-center">0</span>
                </div>
                <div className="text-[8px] text-gray-500 flex gap-4 ml-14 mt-1"><span>Equip.</span><span>Outros.</span></div>
              </div>
            </div>
            <div className="flex flex-col items-center">
              <span className="font-bold text-gray-400 tracking-widest text-xs mb-1">BLOQUEIO</span>
              <span className="border-b-2 border-[#b82870] px-3 text-white text-lg font-bold leading-none pb-1">
                <EditableField value={character.bloqueio || 0} onSave={(val) => handleDirectEdit("bloqueio", val)} isOwner={isOwner} type="number" className="w-8 text-center" />
              </span>
            </div>
            <div className="flex flex-col items-center">
              <span className="font-bold text-gray-400 tracking-widest text-xs mb-1">ESQUIVA</span>
              <span className="border-b-2 border-[#b82870] px-3 text-white text-lg font-bold leading-none pb-1">
                <EditableField value={character.esquiva || 0} onSave={(val) => handleDirectEdit("esquiva", val)} isOwner={isOwner} type="number" className="w-8 text-center" />
              </span>
            </div>
          </div>

          {isOwner && (
            <Inventario
              itens={character.inventario || []}
              onUpdateInventario={handleUpdateInventario}
            />
          )}

          {isOwner && (
            <AtaquesFixos
              rolls={character.rollsFixos || []}
              regraD20={regraD20}
              onSalvarRolls={handleSalvarAtaques}
              onRolar={handleRolarAtaque}
            />
          )}

        </div>
      </div>

      {isEditingImage && (
        <EditorImagem
          image={tempImage}
          onClose={() => { setIsEditingImage(false); setTempImage(null); }}
          onSave={handleSaveImage}
        />
      )}
    </>
  );
}