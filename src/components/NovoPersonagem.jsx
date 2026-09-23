import { useState } from "react";
import { arquivoParaDataUrlComprimido, AVATAR_MAX_SIZE } from "../utils/imagem";
import { CORES_MARCADOR, gerarIdMarcador, marcadoresPadrao, validarMarcador } from "../utils/marcadores";

export default function NovoPersonagem({ onClose, onSave, sistema }) {
  const [nome, setNome] = useState("");
  const [classe, setClasse] = useState("");
  const [imagem, setImagem] = useState(null);
  
  const [marcadores, setMarcadores] = useState(() => marcadoresPadrao(sistema));
  
  const [nex, setNex] = useState("5%");
  const [peTurno, setPeTurno] = useState(1);
  const [deslocamento, setDeslocamento] = useState("9 m / 6 q");
  
  const [defesa, setDefesa] = useState(10);
  const [bloqueio, setBloqueio] = useState(0);
  const [esquiva, setEsquiva] = useState(0);

  function editarMarcador(id, patch) {
    setMarcadores((prev) => prev.map((m) => (m.id === id ? { ...m, ...patch } : m)));
  }

  function removerMarcador(id) {
    setMarcadores((prev) => prev.filter((m) => m.id !== id));
  }

  function adicionarMarcador() {
    const cor = CORES_MARCADOR[marcadores.length % CORES_MARCADOR.length].valor;
    setMarcadores((prev) => [...prev, { id: gerarIdMarcador(), nome: "Novo", atual: 10, max: 10, cor }]);
  }

  async function handleImageChange(e) {
    const file = e.target.files[0];
    e.target.value = "";
    if (!file) return;

    try {
      setImagem(await arquivoParaDataUrlComprimido(file, AVATAR_MAX_SIZE));
    } catch (error) {
      console.error("Erro ao processar imagem:", error);
      alert("Nao foi possivel usar essa imagem. Tente outra foto.");
    }
  }

  function handleSubmit(e) {
    e.preventDefault();
    if (!nome.trim() || !classe.trim()) {
      alert("Bota o nome do personagem e a classe dele bobão");
      return;
    }

    if (marcadores.length === 0) {
      alert("Adicione pelo menos um marcador, por exemplo Vida.");
      return;
    }

    const marcadoresValidados = [];
    for (const marcador of marcadores) {
      const validado = validarMarcador(marcador);
      if (!validado.ok) {
        alert(validado.erro);
        return;
      }
      marcadoresValidados.push(validado.marcador);
    }

    onSave({
      nome,
      classe,
      imagem,
      marcadores: marcadoresValidados,
      nex,
      peTurno: Number(peTurno),
      deslocamento,
      defesa: Number(defesa),
      bloqueio: Number(bloqueio),
      esquiva: Number(esquiva)
    });
  }

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
      <div className="bg-[#250617] p-6 rounded-xl w-full max-w-lg border-2 border-[#b82870] shadow-[0_0_30px_rgba(184,40,112,0.3)] overflow-y-auto max-h-[95vh] custom-scrollbar">
        <h2 className="text-2xl font-bold text-white mb-6 text-center border-b border-[#b82870]/30 pb-2">
          Criar Novo Personagem
        </h2>
        
        <form onSubmit={handleSubmit} className="flex flex-col gap-5">
          
          <div className="flex gap-4 items-center">
            <div 
              className="relative cursor-pointer group shrink-0"
              onClick={() => document.getElementById("nova-foto-upload").click()}
            >
              {imagem ? (
                <img 
                  src={imagem} 
                  alt="Avatar" 
                  className="w-24 h-24 rounded-xl object-cover border-2 border-[#b82870] shadow-lg"
                />
              ) : (
                <div className="w-24 h-24 rounded-xl bg-black/40 border-2 border-dashed border-gray-600 flex flex-col items-center justify-center group-hover:border-[#b82870] transition text-gray-500 group-hover:text-[#b82870]">
                  <span className="text-2xl">📷</span>
                  <span className="text-xs mt-1 font-bold">Põe uma fotinha</span>
                </div>
              )}
              <input id="nova-foto-upload" type="file" accept="image/*" className="hidden" onChange={handleImageChange} />
            </div>

            <div className="flex flex-col gap-3 flex-1">
              <div>
                <label className="text-gray-400 text-xs font-bold mb-1 block tracking-wider">NOME</label>
                <input type="text" value={nome} onChange={(e) => setNome(e.target.value)} className="w-full bg-black/40 border border-gray-700 focus:border-[#b82870] outline-none transition-colors rounded p-2 text-white text-sm" placeholder="Ex: Alphonse Corleone" />
              </div>
              <div>
                <label className="text-gray-400 text-xs font-bold mb-1 block tracking-wider">CLASSE</label>
                <input type="text" value={classe} onChange={(e) => setClasse(e.target.value)} className="w-full bg-black/40 border border-gray-700 focus:border-[#b82870] outline-none transition-colors rounded p-2 text-white text-sm" placeholder="Ex: Ocultista" />
              </div>
            </div>
          </div>

          <hr className="border-[#b82870]/30" />

          <div>
            <label className="text-gray-400 text-xs font-bold mb-2 block tracking-wider">MARCADORES (Vida, Sanidade, PM...)</label>
            <div className="flex flex-col gap-2">
              {marcadores.map((m) => (
                <div key={m.id} className="flex items-center gap-2">
                  <input
                    value={m.nome}
                    onChange={(e) => editarMarcador(m.id, { nome: e.target.value })}
                    placeholder="Nome"
                    className="flex-1 bg-black/40 border border-gray-700 focus:border-[#b82870] outline-none rounded p-2 text-white text-sm"
                  />
                  <input
                    type="number"
                    value={m.max}
                    onChange={(e) => editarMarcador(m.id, { max: e.target.value, atual: e.target.value })}
                    className="w-20 bg-black/40 border border-gray-700 focus:border-[#b82870] outline-none rounded p-2 text-white text-center text-sm"
                  />
                  <button
                    type="button"
                    onClick={() => removerMarcador(m.id)}
                    className="rounded border border-red-500/40 px-2 py-2 text-xs text-red-300 hover:bg-red-500/10"
                    title="Remover marcador"
                  >
                    ✕
                  </button>
                </div>
              ))}
            </div>
            <button
              type="button"
              onClick={adicionarMarcador}
              className="mt-2 w-full rounded border border-dashed border-gray-600 py-1.5 text-xs font-bold text-gray-400 transition hover:border-[#b82870] hover:text-[#f0a3ca]"
            >
              + Marcador
            </button>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="text-[#b82870] text-xs font-bold mb-1 block tracking-wider">NEX</label>
              <input type="text" value={nex} onChange={(e) => setNex(e.target.value)} className="w-full bg-black/40 border border-gray-700 focus:border-[#b82870] outline-none transition-colors rounded p-2 text-white text-center" placeholder="Ex: 5%" />
            </div>
            <div>
              <label className="text-[#b82870] text-xs font-bold mb-1 block tracking-wider">PE / TURNO</label>
              <input type="number" value={peTurno} onChange={(e) => setPeTurno(e.target.value)} className="w-full bg-black/40 border border-gray-700 focus:border-[#b82870] outline-none transition-colors rounded p-2 text-white text-center" />
            </div>
            <div>
              <label className="text-[#b82870] text-xs font-bold mb-1 block tracking-wider">DESLOCAMENTO</label>
              <input type="text" value={deslocamento} onChange={(e) => setDeslocamento(e.target.value)} className="w-full bg-black/40 border border-gray-700 focus:border-[#b82870] outline-none transition-colors rounded p-2 text-white text-center text-sm" placeholder="Ex: 9 m / 6 q" />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="text-gray-400 text-xs font-bold mb-1 block tracking-wider">🛡️ DEFESA</label>
              <input type="number" value={defesa} onChange={(e) => setDefesa(e.target.value)} className="w-full bg-black/40 border border-gray-700 focus:border-[#b82870] outline-none transition-colors rounded p-2 text-white text-center font-bold" />
            </div>
            <div>
              <label className="text-gray-400 text-xs font-bold mb-1 block tracking-wider">BLOQUEIO</label>
              <input type="number" value={bloqueio} onChange={(e) => setBloqueio(e.target.value)} className="w-full bg-black/40 border border-gray-700 focus:border-[#b82870] outline-none transition-colors rounded p-2 text-white text-center font-bold" />
            </div>
            <div>
              <label className="text-gray-400 text-xs font-bold mb-1 block tracking-wider">ESQUIVA</label>
              <input type="number" value={esquiva} onChange={(e) => setEsquiva(e.target.value)} className="w-full bg-black/40 border border-gray-700 focus:border-[#b82870] outline-none transition-colors rounded p-2 text-white text-center font-bold" />
            </div>
          </div>

          <div className="flex justify-end gap-3 mt-4 pt-4 border-t border-[#b82870]/30">
            <button type="button" onClick={onClose} className="px-6 py-2 bg-black/40 hover:bg-black/60 border border-gray-600 hover:border-gray-500 text-white rounded font-bold transition">
              Cancelar
            </button>
            <button type="submit" className="px-6 py-2 bg-[#b82870] hover:bg-[#9a205d] text-white rounded font-bold transition shadow-lg shadow-[#b82870]/20">
              Criar Personagem
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}