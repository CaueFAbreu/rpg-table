import { useState, useEffect } from "react";
import CharacterCard from "./components/CharacterCard";
import DiceRoller from "./components/DiceRoller";
import NovoPersonagem from "./components/NovoPersonagem";
import IniciativaTracker from "./components/IniciativaTracker";

function App() {

  const [currentUser] = useState(() => {
    const saved = localStorage.getItem("currentUser");
    return saved ? JSON.parse(saved) : {
      id: "user-1",
      nome: "Caue"
    };
  });

  const [campanha, setCampanha] = useState(() => {
    const saved = localStorage.getItem("campanha");
    return saved ? JSON.parse(saved) : {
      id: "camp-1",
      nome: "Ordem Paranormal Dissonância",
      mestreId: "user-2"
    };
  });

  const [characters, setCharacters] = useState(() => {
    const saved = localStorage.getItem("characters");
    return saved ? JSON.parse(saved) : [
      {
        id: "char-1",
        ownerId: "user-1",
        nome: "Adel",
        classe: "Ocultista",
        vida: 50,
        sanidade: 45,
        esforco: 31,
        vidaMax: 52,
        sanidadeMax: 45,
        esforcoMax: 54,
        nex: "30%",
        peTurno: 6,
        deslocamento: "9 m / 6 q",
        defesa: 11,
        bloqueio: 5,
        esquiva: 16
      }
    ];
  });

  const [rolls, setRolls] = useState(() => {
    const saved = localStorage.getItem("rolls");
    return saved ? JSON.parse(saved) : [];
  });

  const [activeCharacterId, setActiveCharacterId] = useState(() => {
    return localStorage.getItem("activeCharacterId");
  });

  const [isModalOpen, setIsModalOpen] = useState(false);

  // ==============================
  // SALVAR AUTOMATICAMENTE
  // ==============================

  useEffect(() => {
    localStorage.setItem("currentUser", JSON.stringify(currentUser));
  }, [currentUser]);

  useEffect(() => {
    localStorage.setItem("campanha", JSON.stringify(campanha));
  }, [campanha]);

  useEffect(() => {
    localStorage.setItem("characters", JSON.stringify(characters));
  }, [characters]);

  useEffect(() => {
    localStorage.setItem("rolls", JSON.stringify(rolls));
  }, [rolls]);

  useEffect(() => {
    if (activeCharacterId) {
      localStorage.setItem("activeCharacterId", activeCharacterId);
    }
  }, [activeCharacterId]);

  // ==============================
  // SELEÇÃO AUTOMÁTICA
  // ==============================

  useEffect(() => {
    if (!activeCharacterId && characters.length > 0) {
      const primeiroDoUsuario = characters.find(
        (char) => char.ownerId === currentUser.id
      );
      if (primeiroDoUsuario) {
        setActiveCharacterId(primeiroDoUsuario.id);
      }
    }
  }, [characters, currentUser, activeCharacterId]);

  const activeCharacter = characters.find(
    (char) => char.id === activeCharacterId
  );

  // ==============================
  // FUNÇÕES
  // ==============================

  function updateCharacter(updatedChar) {
    setCharacters((prev) =>
      prev.map((char) =>
        char.id === updatedChar.id ? updatedChar : char
      )
    );
  }

  function handleNewRoll(rollData) {
    if (!activeCharacter) return;
    const rollComDados = {
      ...rollData,
      personagem: activeCharacter.nome,
      personagemId: activeCharacter.id,
      jogador: currentUser.nome,
      userId: currentUser.id,
      id: Date.now()
    };
    setRolls((prev) => [rollComDados, ...prev]);
  }

  function handleCampanhaImageChange(e) {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      setCampanha(prev => ({ ...prev, imagem: reader.result }));
    };
    reader.readAsDataURL(file);
  }

  function handleCriarPersonagem(novosDados) {
    const novoPersonagem = {
      ...novosDados,
      id: `char-${Date.now()}`,
      ownerId: currentUser.id,
      imagem: novosDados.imagem || null,
      vidaMax: novosDados.vida,
      sanidadeMax: novosDados.sanidade,
      esforcoMax: novosDados.esforco
    };
    setCharacters(prev => [...prev, novoPersonagem]);
    setIsModalOpen(false);
  }

  function deleteCharacter(idParaDeletar) {
    setCharacters(prev => prev.filter(char => char.id !== idParaDeletar));
    if (activeCharacterId === idParaDeletar) {
      setActiveCharacterId(null);
    }
  }

  function handleUpdateIniciativa(charId, valor) {
    setCharacters(prev =>
      prev.map(char =>
        char.id === charId ? { ...char, iniciativa: valor } : char
      )
    );
  }

  return (
    <div className="min-h-screen bg-[#250617] p-8 text-white relative">

      {/* CABEÇALHO */}
      <div className="flex items-center justify-center gap-4 mb-6">
        <div
          className="relative cursor-pointer group"
          onClick={() => document.getElementById("campanha-imagem-upload").click()}
        >
          {campanha.imagem ? (
            <img
              src={campanha.imagem}
              alt="Capa da Campanha"
              className="w-12 h-12 rounded-full object-cover border-2 border-[#b82870]"
            />
          ) : (
            <div className="w-12 h-12 rounded-full bg-black/20 border-2 border-gray-600 flex items-center justify-center group-hover:border-[#b82870] transition">
              <span className="text-xl">📷</span>
            </div>
          )}
          <input
            id="campanha-imagem-upload"
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleCampanhaImageChange}
          />
        </div>

        <h1 className="text-3xl font-bold text-center">
          {campanha.nome}
        </h1>
      </div>

      <div className="flex gap-8">

        {/* GRID DE PERSONAGENS */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 flex-1 items-start">
          {characters.map((char) => (
            <CharacterCard
              key={char.id}
              character={char}
              currentUser={currentUser}
              isActive={char.id === activeCharacterId}
              onSelect={() => {
                if (char.ownerId === currentUser.id) {
                  setActiveCharacterId(char.id);
                }
              }}
              onUpdateCharacter={updateCharacter}
              onDeleteCharacter={deleteCharacter}
            />
          ))}

          <div
            onClick={() => setIsModalOpen(true)}
            className="bg-black/20 border-2 border-dashed border-gray-600 hover:border-[#b82870] rounded-xl p-6 flex flex-col items-center justify-center cursor-pointer transition min-h-[290px] text-gray-500 hover:text-[#b82870]"
          >
            <span className="text-8xl font-light mb-4">+</span>
            <span className="text-lg font-bold">Criar Personagem</span>
          </div>
        </div>

        {/* LATERAL */}
        <div className="w-80 flex flex-col gap-6">

          <DiceRoller
            onRoll={handleNewRoll}
            activeCharacter={activeCharacter}
          />

          <IniciativaTracker
            characters={characters}
            currentUser={currentUser}
            onUpdateIniciativa={handleUpdateIniciativa}
          />

          <div className="bg-black/20 border border-[#b82870]/30 rounded-xl p-4">
            <h3 className="font-bold mb-3">📜 Histórico de Rolls</h3>

            <div className="flex flex-col gap-2 max-h-96 overflow-y-auto custom-scrollbar pr-1">
              {rolls.length === 0 && (
                <p className="text-gray-400 text-sm text-center py-4">
                  Nenhuma rolagem ainda...
                </p>
              )}

              {rolls.map((roll) => (
                <div
                  key={roll.id}
                  className="bg-black/30 border border-gray-700/50 rounded-lg p-3 text-sm flex flex-col"
                >
                  <div className="flex justify-between items-start mb-1">
                    <span className="font-bold text-[#b82870]">{roll.personagem}</span>
                    <span className="text-gray-500 text-[10px]">{roll.expressao}</span>
                  </div>
                  <span className="text-gray-400 text-xs font-mono mb-2 break-words">
                    {roll.detalhe}
                  </span>
                  <div className="flex justify-between items-center border-t border-gray-700/50 pt-2 mt-auto">
                    <span className="text-gray-500 text-xs">Total:</span>
                    <span className={`font-bold text-xl ${
                      roll.criticoFalha === "critico" ? "text-green-400" :
                      roll.criticoFalha === "falha" ? "text-red-500" : "text-white"
                    }`}>
                      {roll.resultado}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>
      </div>

      {/* MODAL */}
      {isModalOpen && (
        <NovoPersonagem
          onClose={() => setIsModalOpen(false)}
          onSave={handleCriarPersonagem}
        />
      )}

    </div>
  );
}

export default App;