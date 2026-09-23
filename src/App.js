import { useState, useEffect, useMemo, useRef } from "react";
import { auth, db, firebaseConfigMissingKeys, isFirebaseConfigured } from "./firebase";
import { onAuthStateChanged, signInAnonymously } from "firebase/auth";
import {
  collection,
  doc,
  onSnapshot,
  setDoc,
  updateDoc,
  deleteDoc,
  addDoc,
  getDocs,
  writeBatch,
  query,
  orderBy,
  limit
} from "firebase/firestore";
import CharacterCard from "./components/CharacterCard";
import DiceRoller from "./components/DiceRoller";
import NovoPersonagem from "./components/NovoPersonagem";
import IniciativaTracker from "./components/IniciativaTracker";
import PainelMestre from "./components/PainelMestre";
import { generateRoomId, normalizeRoomId } from "./utils/salas";
import { arquivoParaDataUrlComprimido, COVER_MAX_SIZE } from "./utils/imagem";
import { normalizarPontosMedo } from "./utils/medo";
import { SISTEMAS, SISTEMA_PADRAO, regraD20DaSala, sistemaDaSala } from "./utils/sistemas";
import { rolarAtaqueComDano } from "./utils/dados";
import {
  estaOnline,
  PRESENCE_HEARTBEAT_MS,
  PRESENCE_MIN_GAP_MS,
  PRESENCE_NAME_DEBOUNCE_MS
} from "./utils/presenca";

const DEFAULT_CAMPAIGN_NAME = "Nova Campanha";
const ROOM_STORAGE_KEY = "rpg-table-room-id";
const USER_NAME_STORAGE_KEY = "rpg-table-player-name";

function formatFirebaseError(message, error) {
  return error?.code ? `${message} (${error.code})` : message;
}

function getStoredPlayerName() {
  return localStorage.getItem(USER_NAME_STORAGE_KEY) || "Jogador";
}

function getStoredRoomId() {
  return normalizeRoomId(localStorage.getItem(ROOM_STORAGE_KEY)) || null;
}

function getRoomIdFromUrl() {
  const params = new URLSearchParams(window.location.search);
  return normalizeRoomId(params.get("sala")) || null;
}

// Sem sala na URL nem salva no navegador, o jogador cai no lobby (salaId === null).
function getInitialRoomId() {
  return getRoomIdFromUrl() || getStoredRoomId();
}

function App() {
  const [authUser, setAuthUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [playerName, setPlayerName] = useState(getStoredPlayerName);
  const [salaId, setSalaId] = useState(getInitialRoomId);
  const [salaInput, setSalaInput] = useState(() => getInitialRoomId() || "");
  const [newRoomName, setNewRoomName] = useState("");
  const [novoSistema, setNovoSistema] = useState(SISTEMA_PADRAO);
  const [creatingRoom, setCreatingRoom] = useState(false);
  const [roomLinkCopied, setRoomLinkCopied] = useState(false);
  const [campanha, setCampanha] = useState({
    id: "camp-1",
    nome: DEFAULT_CAMPAIGN_NAME,
  });
  const [characters, setCharacters] = useState([]);
  const [extras, setExtras] = useState([]);
  const [players, setPlayers] = useState([]);
  const [rolls, setRolls] = useState([]);
  const [activeCharacterId, setActiveCharacterId] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditingCampaignName, setIsEditingCampaignName] = useState(false);
  const [campaignNameDraft, setCampaignNameDraft] = useState("");
  const [carregando, setCarregando] = useState(true);
  const [pontosMedo, setPontosMedo] = useState(0);
  const [removidos, setRemovidos] = useState([]);
  const [bloqueado, setBloqueado] = useState(false);
  const wasBlockedRef = useRef(false);
  const [firebaseErro, setFirebaseErro] = useState(null);

  const currentUser = useMemo(() => {
    if (!authUser) return null;

    return {
      id: authUser.uid,
      nome: playerName.trim() || `Jogador ${authUser.uid.slice(0, 6)}`,
    };
  }, [authUser, playerName]);
  const isMestre = Boolean(currentUser && campanha.mestreId === currentUser.id);
  const salaShareUrl = useMemo(() => {
    if (!salaId) return "";

    const url = new URL(window.location.href);
    url.searchParams.set("sala", salaId);
    return url.toString();
  }, [salaId]);

  useEffect(() => {
    localStorage.setItem(USER_NAME_STORAGE_KEY, playerName);
  }, [playerName]);

  useEffect(() => {
    const url = new URL(window.location.href);

    if (!salaId) {
      localStorage.removeItem(ROOM_STORAGE_KEY);
      if (url.searchParams.has("sala")) {
        url.searchParams.delete("sala");
        window.history.replaceState(null, "", url.toString());
      }
      return;
    }

    localStorage.setItem(ROOM_STORAGE_KEY, salaId);

    if (url.searchParams.get("sala") !== salaId) {
      url.searchParams.set("sala", salaId);
      window.history.replaceState(null, "", url.toString());
    }
  }, [salaId]);

  useEffect(() => {
    if (!salaId) return;

    setCampanha({
      id: "camp-1",
      nome: DEFAULT_CAMPAIGN_NAME,
    });
    setCharacters([]);
    setExtras([]);
    setPlayers([]);
    setRolls([]);
    setActiveCharacterId(null);
    setPontosMedo(0);
    setRemovidos([]);
    setBloqueado(false);
    wasBlockedRef.current = false;
    setCarregando(true);
    setFirebaseErro(null);
  }, [salaId]);

  useEffect(() => {
    if (!isFirebaseConfigured) return undefined;

    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        setAuthUser(user);
        setAuthLoading(false);
        return;
      }

      signInAnonymously(auth).catch((error) => {
        console.error("Erro ao autenticar anonimamente:", error);
        setFirebaseErro(formatFirebaseError("Nao foi possivel autenticar no Firebase.", error));
        setAuthLoading(false);
        setCarregando(false);
      });
    });

    return () => unsubscribe();
  }, []);

  
  useEffect(() => {
    if (!isFirebaseConfigured || !authUser || !salaId || bloqueado) return undefined;

    const unsub = onSnapshot(
      collection(db, "salas", salaId, "personagens"),
      (snapshot) => {
        const dados = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
        setCharacters(dados);
        setCarregando(false);
      },
      (error) => {
        console.error("Erro ao carregar personagens:", error);
        setFirebaseErro(formatFirebaseError("Nao foi possivel carregar os personagens no Firebase.", error));
        setCarregando(false);
      }
    );
    return () => unsub();
  }, [authUser, salaId, bloqueado]);

 
  useEffect(() => {
    if (!isFirebaseConfigured || !authUser || !salaId || bloqueado) return undefined;

    const unsub = onSnapshot(
      collection(db, "salas", salaId, "extras"),
      (snapshot) => {
        const dados = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
        setExtras(dados);
      },
      (error) => {
        console.error("Erro ao carregar NPCs:", error);
        setFirebaseErro(formatFirebaseError("Nao foi possivel carregar os NPCs no Firebase.", error));
      }
    );
    return () => unsub();
  }, [authUser, salaId, bloqueado]);

 
  useEffect(() => {
    if (!isFirebaseConfigured || !authUser || !salaId || bloqueado) return undefined;

    const unsub = onSnapshot(
      collection(db, "salas", salaId, "jogadores"),
      (snapshot) => {
        const dados = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
        setPlayers(dados);
      },
      (error) => {
        console.error("Erro ao carregar jogadores:", error);
        setFirebaseErro(formatFirebaseError("Nao foi possivel carregar os jogadores da sala.", error));
      }
    );
    return () => unsub();
  }, [authUser, salaId, bloqueado]);

 
  const presenceUserId = currentUser?.id;
  const presenceName = currentUser?.nome;

  // Presenca "preguicosa": ver src/utils/presenca.js para o motivo.
  useEffect(() => {
    if (!isFirebaseConfigured || !presenceUserId || !salaId || bloqueado) return undefined;

    const playerRef = doc(db, "salas", salaId, "jogadores", presenceUserId);
    let lastWrite = 0;

    function syncPresence() {
      lastWrite = Date.now();

      return setDoc(playerRef, {
        nome: presenceName,
        userId: presenceUserId,
        isMestre,
        lastSeen: lastWrite
      }, { merge: true }).catch((error) => {
        console.error("Erro ao atualizar presenca:", error);
      });
    }

    // Espera o jogador parar de digitar o nome antes de gravar (evita uma gravacao por tecla).
    const debounceId = window.setTimeout(syncPresence, PRESENCE_NAME_DEBOUNCE_MS);

    // Batimento so com a aba visivel: celular no bolso nao gasta cota.
    const intervalId = window.setInterval(() => {
      if (document.visibilityState === "visible") syncPresence();
    }, PRESENCE_HEARTBEAT_MS);

    function handleVisibilityChange() {
      if (
        document.visibilityState === "visible" &&
        Date.now() - lastWrite > PRESENCE_MIN_GAP_MS
      ) {
        syncPresence();
      }
    }

    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      window.clearTimeout(debounceId);
      window.clearInterval(intervalId);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [presenceUserId, presenceName, isMestre, salaId, bloqueado]);

 
  useEffect(() => {
    if (!isFirebaseConfigured || !authUser || !salaId || bloqueado) return undefined;

    const q = query(
      collection(db, "salas", salaId, "rolls"),
      orderBy("timestamp", "desc"),
      limit(50)
    );
    const unsub = onSnapshot(
      q,
      (snapshot) => {
        const dados = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
        setRolls(dados);
      },
      (error) => {
        console.error("Erro ao carregar historico de rolls:", error);
        setFirebaseErro(formatFirebaseError("Nao foi possivel carregar o historico de rolls no Firebase.", error));
      }
    );
    return () => unsub();
  }, [authUser, salaId, bloqueado]);

  
  useEffect(() => {
    if (!isFirebaseConfigured || !authUser || !salaId || bloqueado) return undefined;

    const unsub = onSnapshot(
      doc(db, "salas", salaId),
      (snapshot) => {
        if (snapshot.exists()) {
          setCampanha((prev) => ({ ...prev, ...snapshot.data() }));
        }
      },
      (error) => {
        console.error("Erro ao carregar campanha:", error);
        setFirebaseErro(formatFirebaseError("Nao foi possivel carregar os dados da campanha no Firebase.", error));
      }
    );
    return () => unsub();
  }, [authUser, salaId, bloqueado]);

 
  // Este jogador foi removido pelo mestre? (documento salas/{sala}/bloqueados/{meuId})
  useEffect(() => {
    if (!isFirebaseConfigured || !authUser || !salaId) return undefined;

    const unsub = onSnapshot(
      doc(db, "salas", salaId, "bloqueados", authUser.uid),
      (snapshot) => {
        const foiRemovido = snapshot.exists();

        // Foi readmitido: limpa os avisos de acesso negado da fase em que estava fora.
        if (!foiRemovido && wasBlockedRef.current) setFirebaseErro(null);

        wasBlockedRef.current = foiRemovido;
        setBloqueado(foiRemovido);
      },
      (error) => {
        console.warn("Nao foi possivel verificar se o jogador foi removido:", error);
      }
    );
    return () => unsub();
  }, [authUser, salaId]);

  // Lista de removidos (somente o mestre le).
  useEffect(() => {
    if (!isFirebaseConfigured || !authUser || !salaId || !isMestre) return undefined;

    const unsub = onSnapshot(
      collection(db, "salas", salaId, "bloqueados"),
      (snapshot) => {
        setRemovidos(snapshot.docs.map((d) => ({ id: d.id, ...d.data() })));
      },
      (error) => {
        if (error?.code === "permission-denied") return;
        console.error("Erro ao carregar removidos:", error);
        setFirebaseErro(formatFirebaseError("Nao foi possivel carregar os jogadores removidos.", error));
      }
    );
    return () => unsub();
  }, [authUser, salaId, isMestre]);

  // Pontos de Medo (somente o mestre le).
  useEffect(() => {
    if (!isFirebaseConfigured || !authUser || !salaId || !isMestre) return undefined;

    const unsub = onSnapshot(
      doc(db, "salas", salaId, "mestre", "medo"),
      (snapshot) => {
        setPontosMedo(snapshot.exists() ? snapshot.data().pontos ?? 0 : 0);
      },
      (error) => {
        if (error?.code === "permission-denied") return;
        console.error("Erro ao carregar pontos de medo:", error);
        setFirebaseErro(formatFirebaseError("Nao foi possivel carregar os pontos de medo.", error));
      }
    );
    return () => unsub();
  }, [authUser, salaId, isMestre]);

  useEffect(() => {
    if (!currentUser) return;

    if (!activeCharacterId && characters.length > 0) {
      const primeiro = characters.find((c) => c.ownerId === currentUser.id);
      if (primeiro) setActiveCharacterId(primeiro.id);
    }
  }, [characters, currentUser, activeCharacterId]);

  const activeCharacter = characters.find((c) => c.id === activeCharacterId);
  const combatState = campanha.combate || {
    ativo: false,
    turnoAtualId: null,
    rodada: 1
  };

  

  async function updateCharacter(updatedChar) {
    if (!currentUser) return;

    const { id, ...dados } = updatedChar;
    try {
      await updateDoc(doc(db, "salas", salaId, "personagens", id), dados);
    } catch (error) {
      console.error("Erro ao atualizar personagem:", error);
      setFirebaseErro(formatFirebaseError("Nao foi possivel salvar as alteracoes do personagem.", error));
    }
  }

  async function handleNewRoll(rollData) {
    if (!activeCharacter || !currentUser) return;
    try {
      await addDoc(collection(db, "salas", salaId, "rolls"), {
        ...rollData,
        personagem: activeCharacter.nome,
        personagemId: activeCharacter.id,
        jogador: currentUser.nome,
        userId: currentUser.id,
        timestamp: Date.now()
      });
    } catch (error) {
      console.error("Erro ao registrar roll:", error);
      setFirebaseErro(formatFirebaseError("Nao foi possivel registrar a rolagem no Firebase.", error));
    }
  }

  // Ataque fixo salvo na ficha ("Ataque Corrente: 3d6+2d6"): rola ataque + dano juntos e
  // multiplica o dano se critar (ver src/utils/dados.js).
  async function handleRolarAtaque(personagem, roll) {
    if (!currentUser) return;

    const resultado = rolarAtaqueComDano({
      ataque: roll.ataque,
      dano: roll.dano,
      multiplicador: roll.multiplicador,
      margemCritico: roll.margemCritico,
      regraD20: regraD20DaSala(campanha)
    });

    if (!resultado.ok) {
      window.alert(resultado.erro);
      return;
    }

    try {
      await addDoc(collection(db, "salas", salaId, "rolls"), {
        tipo: "ataque",
        rotulo: roll.nome,
        ataque: resultado.ataque,
        dano: resultado.dano,
        criticoFalha: resultado.critico ? "critico" : resultado.falha ? "falha" : null,
        personagem: personagem.nome,
        personagemId: personagem.id,
        jogador: currentUser.nome,
        userId: currentUser.id,
        timestamp: Date.now()
      });
    } catch (error) {
      console.error("Erro ao registrar ataque:", error);
      setFirebaseErro(formatFirebaseError("Nao foi possivel registrar o ataque no Firebase.", error));
    }
  }

  async function handleCampanhaImageChange(e) {
    if (!currentUser || !isMestre) return;

    const file = e.target.files[0];
    e.target.value = "";
    if (!file) return;

    try {
      const imagem = await arquivoParaDataUrlComprimido(file, COVER_MAX_SIZE);
      await setDoc(doc(db, "salas", salaId), { imagem }, { merge: true });
    } catch (error) {
      console.error("Erro ao atualizar imagem da campanha:", error);
      setFirebaseErro(formatFirebaseError("Nao foi possivel salvar a imagem da campanha.", error));
    }
  }

  async function handleCriarPersonagem(novosDados) {
    if (!currentUser) return;

    try {
      await addDoc(collection(db, "salas", salaId, "personagens"), {
        ...novosDados,
        ownerId: currentUser.id,
        imagem: novosDados.imagem || null
      });
      setIsModalOpen(false);
    } catch (error) {
      console.error("Erro ao criar personagem:", error);
      setFirebaseErro(formatFirebaseError("Nao foi possivel criar o personagem no Firebase.", error));
    }
  }

  async function deleteCharacter(idParaDeletar) {
    if (!currentUser) return;

    try {
      await deleteDoc(doc(db, "salas", salaId, "personagens", idParaDeletar));
      if (activeCharacterId === idParaDeletar) setActiveCharacterId(null);
    } catch (error) {
      console.error("Erro ao excluir personagem:", error);
      setFirebaseErro(formatFirebaseError("Nao foi possivel excluir o personagem no Firebase.", error));
    }
  }

  async function handleUpdateIniciativa(charId, valor) {
    if (!currentUser) return;

    try {
      await updateDoc(doc(db, "salas", salaId, "personagens", charId), {
        iniciativa: valor
      });
    } catch (error) {
      console.error("Erro ao atualizar iniciativa:", error);
      setFirebaseErro(formatFirebaseError("Nao foi possivel atualizar a iniciativa no Firebase.", error));
    }
  }

  async function handleCreateExtra(extraData) {
    if (!currentUser || !isMestre) return;

    try {
      await addDoc(collection(db, "salas", salaId, "extras"), {
        ...extraData,
        createdBy: currentUser.id,
        createdByName: currentUser.nome,
        createdAt: Date.now(),
        updatedAt: Date.now()
      });
    } catch (error) {
      console.error("Erro ao criar NPC:", error);
      setFirebaseErro(formatFirebaseError("Nao foi possivel criar o NPC no Firebase.", error));
    }
  }

  async function handleUpdateExtra(extraId, dados) {
    if (!currentUser || !isMestre) return;

    try {
      await updateDoc(doc(db, "salas", salaId, "extras", extraId), {
        ...dados,
        updatedAt: Date.now()
      });
    } catch (error) {
      console.error("Erro ao atualizar NPC:", error);
      setFirebaseErro(formatFirebaseError("Nao foi possivel atualizar o NPC no Firebase.", error));
    }
  }

  async function handleDeleteExtra(extraId) {
    if (!currentUser || !isMestre) return;

    try {
      await deleteDoc(doc(db, "salas", salaId, "extras", extraId));
    } catch (error) {
      console.error("Erro ao remover NPC:", error);
      setFirebaseErro(formatFirebaseError("Nao foi possivel remover o NPC no Firebase.", error));
    }
  }

  async function handleClaimMestre() {
    if (!currentUser) return;

    try {
      await setDoc(doc(db, "salas", salaId), {
        nome: campanha.nome,
        mestreId: currentUser.id,
        mestreNome: currentUser.nome,
        updatedAt: Date.now()
      }, { merge: true });
    } catch (error) {
      console.error("Erro ao assumir mestre:", error);
      setFirebaseErro(formatFirebaseError("Nao foi possivel assumir o papel de mestre.", error));
    }
  }

  async function handleTransferMestre(player) {
    if (!currentUser || !isMestre || !player?.id) return;

    const confirmed = window.confirm(`Transferir mestre para ${player.nome || "Jogador"}?`);
    if (!confirmed) return;

    try {
      await setDoc(doc(db, "salas", salaId), {
        mestreId: player.id,
        mestreNome: player.nome || "Jogador",
        updatedAt: Date.now()
      }, { merge: true });
    } catch (error) {
      console.error("Erro ao transferir mestre:", error);
      setFirebaseErro(formatFirebaseError("Nao foi possivel transferir o papel de mestre.", error));
    }
  }

  function startEditingCampaignName() {
    if (!isMestre) return;
    setCampaignNameDraft(campanha.nome || "");
    setIsEditingCampaignName(true);
  }

  async function handleSaveCampaignName() {
    if (!currentUser || !isMestre) return;

    const nextName = campaignNameDraft.trim();
    if (!nextName) {
      setIsEditingCampaignName(false);
      return;
    }

    try {
      await setDoc(doc(db, "salas", salaId), {
        nome: nextName,
        updatedAt: Date.now()
      }, { merge: true });
      setIsEditingCampaignName(false);
    } catch (error) {
      console.error("Erro ao atualizar nome da campanha:", error);
      setFirebaseErro(formatFirebaseError("Nao foi possivel atualizar o nome da campanha.", error));
    }
  }

  async function handleStartCombat(firstTurnId) {
    if (!currentUser || !isMestre || !firstTurnId) return;

    try {
      await setDoc(doc(db, "salas", salaId), {
        combate: {
          ativo: true,
          turnoAtualId: firstTurnId,
          rodada: 1,
          updatedAt: Date.now()
        },
        updatedAt: Date.now()
      }, { merge: true });
    } catch (error) {
      console.error("Erro ao iniciar combate:", error);
      setFirebaseErro(formatFirebaseError("Nao foi possivel iniciar o combate.", error));
    }
  }

  async function handleNextTurn(nextTurnId, rodada) {
    if (!currentUser || !isMestre || !nextTurnId) return;

    try {
      await setDoc(doc(db, "salas", salaId), {
        combate: {
          ativo: true,
          turnoAtualId: nextTurnId,
          rodada,
          updatedAt: Date.now()
        },
        updatedAt: Date.now()
      }, { merge: true });
    } catch (error) {
      console.error("Erro ao passar turno:", error);
      setFirebaseErro(formatFirebaseError("Nao foi possivel passar o turno.", error));
    }
  }

  async function handleEndCombat() {
    if (!currentUser || !isMestre) return;

    try {
      await setDoc(doc(db, "salas", salaId), {
        combate: {
          ativo: false,
          turnoAtualId: null,
          rodada: 1,
          updatedAt: Date.now()
        },
        updatedAt: Date.now()
      }, { merge: true });
    } catch (error) {
      console.error("Erro ao encerrar combate:", error);
      setFirebaseErro(formatFirebaseError("Nao foi possivel encerrar o combate.", error));
    }
  }

  async function handleResetInitiatives() {
    if (!currentUser || !isMestre) return;

    const confirmed = window.confirm("Limpar todas as iniciativas e encerrar o combate?");
    if (!confirmed) return;

    try {
      const batch = writeBatch(db);

      characters.forEach((char) => {
        batch.update(doc(db, "salas", salaId, "personagens", char.id), {
          iniciativa: null
        });
      });

      extras.forEach((extra) => {
        batch.update(doc(db, "salas", salaId, "extras", extra.id), {
          iniciativa: null,
          updatedAt: Date.now()
        });
      });

      batch.set(doc(db, "salas", salaId), {
        combate: {
          ativo: false,
          turnoAtualId: null,
          rodada: 1,
          updatedAt: Date.now()
        },
        updatedAt: Date.now()
      }, { merge: true });

      await batch.commit();
    } catch (error) {
      console.error("Erro ao limpar iniciativas:", error);
      setFirebaseErro(formatFirebaseError("Nao foi possivel limpar as iniciativas.", error));
    }
  }

  async function handleClearRolls() {
    if (!currentUser || !isMestre) return;

    const confirmed = window.confirm("Limpar todo o historico de rolls desta sala?");
    if (!confirmed) return;

    try {
      const snapshot = await getDocs(collection(db, "salas", salaId, "rolls"));
      const batch = writeBatch(db);

      snapshot.docs.forEach((rollDoc) => {
        batch.delete(rollDoc.ref);
      });

      await batch.commit();
    } catch (error) {
      console.error("Erro ao limpar historico de rolls:", error);
      setFirebaseErro(formatFirebaseError("Nao foi possivel limpar o historico de rolls.", error));
    }
  }

  async function handleSetPontosMedo(valor) {
    if (!currentUser || !isMestre) return;

    const pontos = normalizarPontosMedo(valor);
    if (pontos === null) return;

    try {
      await setDoc(doc(db, "salas", salaId, "mestre", "medo"), {
        pontos,
        updatedAt: Date.now()
      }, { merge: true });
    } catch (error) {
      console.error("Erro ao atualizar pontos de medo:", error);
      setFirebaseErro(formatFirebaseError("Nao foi possivel atualizar os pontos de medo.", error));
    }
  }

  async function handleRemovePlayer(player) {
    if (!currentUser || !isMestre || !player?.id || player.id === currentUser.id) return;

    const nome = player.nome || "Jogador";
    const personagensDele = characters.filter((char) => char.ownerId === player.id);
    const total = personagensDele.length;

    const aviso = total === 0
      ? `Remover ${nome} da campanha?`
      : `Remover ${nome} da campanha? ${total === 1 ? "O personagem dele tambem sera excluido" : `Os ${total} personagens dele tambem serao excluidos`}.`;

    if (!window.confirm(aviso)) return;

    try {
      const batch = writeBatch(db);

      batch.set(doc(db, "salas", salaId, "bloqueados", player.id), {
        nome,
        bloqueadoPor: currentUser.id,
        bloqueadoEm: Date.now()
      });
      batch.delete(doc(db, "salas", salaId, "jogadores", player.id));
      personagensDele.forEach((char) => {
        batch.delete(doc(db, "salas", salaId, "personagens", char.id));
      });

      await batch.commit();
    } catch (error) {
      console.error("Erro ao remover jogador:", error);
      setFirebaseErro(formatFirebaseError("Nao foi possivel remover o jogador.", error));
    }
  }

  async function handleReadmitirJogador(playerId) {
    if (!currentUser || !isMestre || !playerId) return;

    try {
      await deleteDoc(doc(db, "salas", salaId, "bloqueados", playerId));
    } catch (error) {
      console.error("Erro ao readmitir jogador:", error);
      setFirebaseErro(formatFirebaseError("Nao foi possivel readmitir o jogador.", error));
    }
  }

  async function handleCreateRoom(e) {
    e.preventDefault();
    if (!currentUser || creatingRoom) return;

    const nextSalaId = generateRoomId();
    const nome = newRoomName.trim() || DEFAULT_CAMPAIGN_NAME;
    const sistemaEscolhido = SISTEMAS[novoSistema] ? novoSistema : SISTEMA_PADRAO;
    const { regraD20 } = SISTEMAS[sistemaEscolhido];
    setCreatingRoom(true);
    setFirebaseErro(null);

    try {
      // Quem cria a sala ja nasce como mestre (permitido por firestore.rules).
      await setDoc(doc(db, "salas", nextSalaId), {
        nome,
        mestreId: currentUser.id,
        mestreNome: currentUser.nome,
        sistema: sistemaEscolhido,
        regraD20,
        createdAt: Date.now(),
        updatedAt: Date.now()
      });
      setNewRoomName("");
      setSalaInput(nextSalaId);
      setSalaId(nextSalaId);
    } catch (error) {
      console.error("Erro ao criar sala:", error);
      setFirebaseErro(formatFirebaseError("Nao foi possivel criar a sala.", error));
    } finally {
      setCreatingRoom(false);
    }
  }

  function handleRoomSubmit(e) {
    e.preventDefault();
    const nextSalaId = normalizeRoomId(salaInput);
    if (!nextSalaId) return;

    setFirebaseErro(null);
    setSalaInput(nextSalaId);
    setSalaId(nextSalaId);
  }

  function handleLeaveRoom() {
    setSalaInput("");
    setSalaId(null);
  }

  async function handleCopyRoomLink() {
    try {
      await navigator.clipboard.writeText(salaShareUrl);
      setRoomLinkCopied(true);
      window.setTimeout(() => setRoomLinkCopied(false), 1800);
    } catch (error) {
      console.error("Erro ao copiar link da sala:", error);
      setFirebaseErro("Nao foi possivel copiar o link da sala automaticamente.");
    }
  }

  if (!isFirebaseConfigured) {
    return (
      <div className="min-h-screen bg-[#250617] flex items-center justify-center p-6 text-white">
        <div className="max-w-xl w-full bg-black/30 border border-[#b82870]/40 rounded-xl p-6">
          <h1 className="text-2xl font-bold mb-3">Configurar Firebase</h1>
          <p className="text-gray-300 mb-4">
            Crie um arquivo .env.local na raiz do projeto com as variaveis do Firebase.
          </p>
          <div className="bg-black/40 border border-gray-700 rounded-lg p-4 text-sm font-mono text-gray-200 break-words">
            {firebaseConfigMissingKeys.map((key) => (
              <div key={key}>Faltando: {key}</div>
            ))}
          </div>
          <p className="text-gray-400 text-sm mt-4">
            Use o arquivo .env.example como modelo e reinicie o servidor depois de preencher.
          </p>
        </div>
      </div>
    );
  }

  if (authLoading) {
    return (
      <div className="min-h-screen bg-[#250617] flex items-center justify-center">
        <div className="text-center">
          <div className="text-4xl mb-4 animate-spin">D20</div>
          <p className="text-[#b82870] font-bold tracking-widest">Conectando jogador...</p>
        </div>
      </div>
    );
  }

  if (!currentUser) {
    return (
      <div className="min-h-screen bg-[#250617] flex items-center justify-center p-6 text-white">
        <div className="max-w-xl w-full bg-black/30 border border-[#b82870]/40 rounded-xl p-6">
          <h1 className="text-2xl font-bold mb-3">Ativar autenticacao anonima</h1>
          <p className="text-gray-300 mb-4">
            O app precisa do login anonimo do Firebase para separar os personagens por jogador.
          </p>
          {firebaseErro && (
            <div className="bg-red-950/60 border border-red-500/40 rounded-lg p-3 text-sm text-red-100">
              {firebaseErro}
            </div>
          )}
          <p className="text-gray-400 text-sm mt-4">
            No Firebase Console, va em Authentication, Sign-in method e habilite Anonymous.
          </p>
        </div>
      </div>
    );
  }

  if (!salaId) {
    return (
      <div className="min-h-screen bg-[#250617] flex items-center justify-center p-4 text-white">
        <div className="w-full max-w-md rounded-xl border border-[#b82870]/40 bg-black/30 p-6">
          <h1 className="text-center text-3xl font-bold">RPG Table</h1>
          <p className="mb-6 mt-1 text-center text-sm text-gray-400">
            Mesa virtual de RPG em tempo real
          </p>

          {firebaseErro && (
            <div className="mb-4 rounded-lg border border-red-500/40 bg-red-950/60 p-3 text-sm text-red-100">
              {firebaseErro}
            </div>
          )}

          <label className="text-xs font-bold uppercase tracking-widest text-gray-400" htmlFor="lobby-nome-jogador">
            Seu nome
          </label>
          <input
            id="lobby-nome-jogador"
            value={playerName}
            onChange={(e) => setPlayerName(e.target.value)}
            maxLength={30}
            className="mb-6 mt-1 w-full rounded border border-gray-700 bg-black/50 px-3 py-2 text-sm text-white outline-none focus:border-[#b82870]"
          />

          <form onSubmit={handleCreateRoom} className="mb-6 flex flex-col gap-2">
            <label className="text-xs font-bold uppercase tracking-widest text-gray-400" htmlFor="lobby-nome-campanha">
              Nova mesa
            </label>
            <input
              id="lobby-nome-campanha"
              value={newRoomName}
              onChange={(e) => setNewRoomName(e.target.value)}
              placeholder="Nome da campanha"
              maxLength={60}
              className="w-full rounded border border-gray-700 bg-black/50 px-3 py-2 text-sm text-white outline-none focus:border-[#b82870]"
            />
            <select
              value={novoSistema}
              onChange={(e) => setNovoSistema(e.target.value)}
              className="w-full rounded border border-gray-700 bg-black/50 px-3 py-2 text-sm text-white outline-none focus:border-[#b82870]"
            >
              {Object.entries(SISTEMAS).map(([chave, sistema]) => (
                <option key={chave} value={chave}>{sistema.nome}</option>
              ))}
            </select>
            <button
              type="submit"
              disabled={creatingRoom}
              className="w-full rounded-lg bg-[#b82870] py-2.5 font-bold text-white shadow-lg shadow-[#b82870]/20 transition hover:bg-[#9a205d] disabled:opacity-50"
            >
              {creatingRoom ? "Criando..." : "Criar sala"}
            </button>
            <p className="text-xs text-gray-500">
              Voce sera o mestre. O link da sala e gerado aleatoriamente: so entra quem receber o link ou o codigo.
            </p>
          </form>

          <form onSubmit={handleRoomSubmit} className="flex flex-col gap-2 border-t border-gray-700/50 pt-5">
            <label className="text-xs font-bold uppercase tracking-widest text-gray-400" htmlFor="lobby-codigo-sala">
              Entrar com codigo
            </label>
            <div className="flex gap-2">
              <input
                id="lobby-codigo-sala"
                value={salaInput}
                onChange={(e) => setSalaInput(e.target.value)}
                placeholder="Codigo da sala"
                className="min-w-0 flex-1 rounded border border-gray-700 bg-black/50 px-3 py-2 text-sm text-white outline-none focus:border-[#b82870]"
              />
              <button
                type="submit"
                className="rounded-lg border border-[#b82870]/60 px-4 py-2 text-sm font-bold text-[#f0a3ca] transition hover:bg-[#b82870]/20"
              >
                Entrar
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  }

  if (bloqueado) {
    return (
      <div className="min-h-screen bg-[#250617] flex items-center justify-center p-4 text-white">
        <div className="w-full max-w-md rounded-xl border border-red-500/40 bg-black/30 p-6 text-center">
          <h1 className="mb-2 text-2xl font-bold">Voce foi removido desta sala</h1>
          <p className="mb-6 text-sm text-gray-400">
            O mestre removeu voce desta campanha. Se foi engano, peca para ele readmitir voce:
            a sala volta sozinha, sem precisar recarregar.
          </p>
          <button
            onClick={handleLeaveRoom}
            className="w-full rounded-lg border border-[#b82870]/60 py-2.5 font-bold text-[#f0a3ca] transition hover:bg-[#b82870]/20"
          >
            Voltar ao lobby
          </button>
        </div>
      </div>
    );
  }

  if (carregando) {
    return (
      <div className="min-h-screen bg-[#250617] flex items-center justify-center">
        <div className="text-center">
          <div className="text-4xl mb-4 animate-spin">D20</div>
          <p className="text-[#b82870] font-bold tracking-widest">Carregando mesa...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#250617] p-4 md:p-8 text-white relative">
      {firebaseErro && (
        <div className="fixed top-4 left-1/2 z-50 w-[min(92vw,560px)] -translate-x-1/2 rounded-lg border border-red-500/50 bg-red-950/95 px-4 py-3 text-sm text-red-100 shadow-lg">
          <div className="flex items-start justify-between gap-4">
            <span>{firebaseErro}</span>
            <button
              onClick={() => setFirebaseErro(null)}
              className="shrink-0 text-red-200 hover:text-white"
              title="Fechar aviso"
            >
              x
            </button>
          </div>
        </div>
      )}

      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <form
          onSubmit={handleRoomSubmit}
          className="flex flex-wrap items-center gap-2 rounded-lg border border-[#b82870]/30 bg-black/20 px-3 py-2"
        >
          <span className="text-xs text-gray-400">Sala</span>
          <input
            value={salaInput}
            onChange={(e) => setSalaInput(e.target.value)}
            className="w-36 bg-transparent text-sm font-bold text-white outline-none focus:text-[#e85fa4]"
            aria-label="ID da sala"
          />
          <button
            type="submit"
            className="rounded bg-[#b82870] px-2 py-1 text-xs font-bold text-white hover:bg-[#9a205d] transition"
          >
            Entrar
          </button>
          <button
            type="button"
            onClick={handleCopyRoomLink}
            className="rounded border border-[#b82870]/50 px-2 py-1 text-xs font-bold text-[#f0a3ca] hover:bg-[#b82870]/20 transition"
            title={salaShareUrl}
          >
            {roomLinkCopied ? "Copiado" : "Link"}
          </button>
          <button
            type="button"
            onClick={handleLeaveRoom}
            className="rounded border border-gray-600/60 px-2 py-1 text-xs font-bold text-gray-300 hover:bg-white/10 transition"
            title="Sair desta sala e voltar ao lobby"
          >
            Sair
          </button>
        </form>
        <div className="flex items-center gap-2 rounded-lg border border-[#b82870]/30 bg-black/20 px-3 py-2">
          <span
            className={`text-xs ${isMestre ? "text-yellow-300" : "text-gray-400"}`}
            title={currentUser.id}
          >
            {isMestre ? "Mestre" : "Jogador"}
          </span>
          <input
            value={playerName}
            onChange={(e) => setPlayerName(e.target.value)}
            className="w-32 bg-transparent text-sm font-bold text-white outline-none focus:text-[#e85fa4]"
            aria-label="Nome do jogador"
          />
        </div>
      </div>

      {/* CABECALHO */}
      <div className="flex flex-wrap items-center justify-center gap-4 mb-6">
        <div
          className={`relative group ${isMestre ? "cursor-pointer" : "cursor-default"}`}
          onClick={() => {
            if (isMestre) document.getElementById("campanha-imagem-upload").click();
          }}
          title={isMestre ? "Trocar capa da campanha" : "Apenas o mestre pode trocar a capa"}
        >
          {campanha.imagem ? (
            <img
              src={campanha.imagem}
              alt="Capa da Campanha"
              className="w-12 h-12 rounded-full object-cover border-2 border-[#b82870]"
            />
          ) : (
            <div className="w-12 h-12 rounded-full bg-black/20 border-2 border-gray-600 flex items-center justify-center group-hover:border-[#b82870] transition">
              <span className="text-sm font-bold">Foto</span>
            </div>
          )}
          {isMestre && (
            <input
              id="campanha-imagem-upload"
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleCampanhaImageChange}
            />
          )}
        </div>

        {isEditingCampaignName ? (
          <input
            value={campaignNameDraft}
            onChange={(e) => setCampaignNameDraft(e.target.value)}
            onBlur={handleSaveCampaignName}
            onKeyDown={(e) => {
              if (e.key === "Enter") handleSaveCampaignName();
              if (e.key === "Escape") setIsEditingCampaignName(false);
            }}
            autoFocus
            className="w-[min(520px,80vw)] rounded-lg border border-[#b82870] bg-black/40 px-3 py-2 text-center text-3xl font-bold text-white outline-none"
            aria-label="Nome da campanha"
          />
        ) : (
          <h1
            onClick={startEditingCampaignName}
            className={`text-2xl md:text-3xl font-bold text-center ${isMestre ? "cursor-pointer hover:text-[#e85fa4]" : ""}`}
            title={isMestre ? "Clique para editar o nome da campanha" : undefined}
          >
            {campanha.nome}
          </h1>
        )}

        {!campanha.mestreId && (
          <button
            onClick={handleClaimMestre}
            className="rounded-lg border border-yellow-400/50 bg-yellow-400/10 px-3 py-2 text-xs font-bold uppercase tracking-widest text-yellow-200 hover:bg-yellow-400/20 transition"
          >
            Assumir Mestre
          </button>
        )}
      </div>

      <div className="flex flex-col lg:flex-row gap-6 lg:gap-8">

        {/* GRID DE PERSONAGENS */}
        <div className="grid grid-cols-1 md:grid-cols-2 2xl:grid-cols-3 gap-6 flex-1 min-w-0 items-start">
          {characters.map((char) => (
            <CharacterCard
              key={char.id}
              character={char}
              currentUser={currentUser}
              isActive={char.id === activeCharacterId}
              onSelect={() => {
                if (char.ownerId === currentUser.id) setActiveCharacterId(char.id);
              }}
              onUpdateCharacter={updateCharacter}
              onDeleteCharacter={deleteCharacter}
              regraD20={regraD20DaSala(campanha)}
              onRolarAtaque={handleRolarAtaque}
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
        <div className="w-full lg:w-80 lg:shrink-0 flex flex-col gap-6">

          <DiceRoller onRoll={handleNewRoll} regraD20={regraD20DaSala(campanha)} />

          <IniciativaTracker
            characters={characters}
            extras={extras}
            combatState={combatState}
            currentUser={currentUser}
            isMestre={isMestre}
            onUpdateIniciativa={handleUpdateIniciativa}
            onCreateExtra={handleCreateExtra}
            onUpdateExtra={handleUpdateExtra}
            onDeleteExtra={handleDeleteExtra}
            onStartCombat={handleStartCombat}
            onNextTurn={handleNextTurn}
            onEndCombat={handleEndCombat}
            onResetInitiatives={handleResetInitiatives}
          />

          {isMestre && (
            <PainelMestre
              pontosMedo={pontosMedo}
              onSetPontosMedo={handleSetPontosMedo}
              removidos={removidos}
              onReadmitir={handleReadmitirJogador}
            />
          )}

          <div className="bg-black/20 border border-[#b82870]/30 rounded-xl p-4">
            <h3 className="font-bold mb-3">Jogadores</h3>
            <div className="flex flex-col gap-2">
              {[...players].sort((a, b) => (b.isMestre ? 1 : 0) - (a.isMestre ? 1 : 0)).map((player) => {
                const isRecent = estaOnline(player.lastSeen);

                return (
                  <div
                    key={player.id}
                    className="flex items-center justify-between rounded-lg border border-gray-700/50 bg-black/30 px-3 py-2 text-sm"
                  >
                    <div className="min-w-0">
                      <p className="truncate font-bold text-white">
                        {player.nome || "Jogador"}
                      </p>
                      <p className={`text-xs ${player.isMestre ? "text-yellow-300" : "text-gray-500"}`}>
                        {player.isMestre ? "Mestre" : "Jogador"}
                      </p>
                    </div>
                    <div className="flex shrink-0 items-center gap-2">
                      {isMestre && player.id !== currentUser.id && (
                        <>
                        <button
                          onClick={() => handleTransferMestre(player)}
                          className="rounded border border-yellow-400/40 px-2 py-1 text-[10px] font-bold uppercase tracking-widest text-yellow-200 hover:bg-yellow-400/10 transition"
                          title={`Transferir mestre para ${player.nome || "Jogador"}`}
                        >
                          Mestre
                        </button>
                        <button
                          onClick={() => handleRemovePlayer(player)}
                          className="rounded border border-red-500/40 px-2 py-1 text-[10px] font-bold uppercase tracking-widest text-red-300 hover:bg-red-500/10 transition"
                          title={`Remover ${player.nome || "Jogador"} da campanha`}
                        >
                          Remover
                        </button>
                        </>
                      )}
                      <span className={`h-2 w-2 rounded-full ${isRecent ? "bg-green-400" : "bg-gray-600"}`} title={isRecent ? "Online" : "Inativo"} />
                    </div>
                  </div>
                );
              })}

              {players.length === 0 && (
                <p className="text-gray-500 text-sm text-center py-3">Nenhum jogador listado...</p>
              )}
            </div>
          </div>

          <div className="bg-black/20 border border-[#b82870]/30 rounded-xl p-4">
            <div className="mb-3 flex items-center justify-between gap-2">
              <h3 className="font-bold">Historico de Rolls</h3>
              {isMestre && rolls.length > 0 && (
                <button
                  onClick={handleClearRolls}
                  className="rounded border border-red-500/40 px-2 py-1 text-[10px] font-bold uppercase tracking-widest text-red-300 hover:bg-red-500/10 transition"
                >
                  Limpar
                </button>
              )}
            </div>
            <div className="flex flex-col gap-2 max-h-96 overflow-y-auto custom-scrollbar pr-1">
              {rolls.length === 0 && (
                <p className="text-gray-400 text-sm text-center py-4">Nenhuma rolagem ainda...</p>
              )}
              {rolls.map((roll) =>
                roll.tipo === "ataque" ? (
                  <div key={roll.id} className="bg-black/30 border border-gray-700/50 rounded-lg p-3 text-sm flex flex-col gap-2">
                    <div className="flex justify-between items-start">
                      <span className="font-bold text-[#b82870]">{roll.personagem}</span>
                      <span className="text-gray-500 text-[10px]">{roll.rotulo}</span>
                    </div>

                    {roll.ataque && (
                      <div className="flex items-center justify-between gap-2">
                        <div className="min-w-0">
                          <span className="text-gray-500 text-[10px] uppercase tracking-widest mr-1">Ataque</span>
                          <span className="text-gray-400 text-xs font-mono break-words">{roll.ataque.detalhe}</span>
                        </div>
                        <span className={`shrink-0 font-bold text-lg ${
                          roll.criticoFalha === "critico" ? "text-green-400" :
                          roll.criticoFalha === "falha" ? "text-red-500" : "text-white"
                        }`}>
                          {roll.ataque.total}
                        </span>
                      </div>
                    )}

                    <div className="flex items-center justify-between gap-2 border-t border-gray-700/50 pt-2">
                      <div className="min-w-0">
                        <span className="text-gray-500 text-[10px] uppercase tracking-widest mr-1">Dano</span>
                        <span className="text-gray-400 text-xs font-mono break-words">
                          {roll.dano.detalhe}
                          {roll.dano.multiplicado && ` ×${roll.dano.multiplicador}`}
                        </span>
                      </div>
                      <span className={`shrink-0 font-bold text-xl ${roll.dano.multiplicado ? "text-green-400" : "text-white"}`}>
                        {roll.dano.total}
                      </span>
                    </div>

                    {roll.criticoFalha === "critico" && (
                      <div className="text-green-400 text-[10px] font-bold uppercase tracking-widest text-center">Crítico!</div>
                    )}
                    {roll.criticoFalha === "falha" && (
                      <div className="text-red-500 text-[10px] font-bold uppercase tracking-widest text-center">Falha crítica!</div>
                    )}
                  </div>
                ) : (
                  <div key={roll.id} className="bg-black/30 border border-gray-700/50 rounded-lg p-3 text-sm flex flex-col">
                    <div className="flex justify-between items-start mb-1">
                      <span className="font-bold text-[#b82870]">{roll.personagem}</span>
                      <span className="text-gray-500 text-[10px]">{roll.expressao}</span>
                    </div>
                    <span className="text-gray-400 text-xs font-mono mb-2 break-words">{roll.detalhe}</span>
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
                )
              )}
            </div>
          </div>

        </div>
      </div>

      {isModalOpen && (
        <NovoPersonagem
          onClose={() => setIsModalOpen(false)}
          onSave={handleCriarPersonagem}
          sistema={sistemaDaSala(campanha)}
        />
      )}

    </div>
  );
}

export default App;
