import { useState, useEffect, useMemo, useRef } from "react";
import { doc, onSnapshot, setDoc } from "firebase/firestore";
import { db, isFirebaseConfigured } from "../firebase";
import { generateRoomId, normalizeRoomId } from "../utils/salas";
import { SISTEMAS, SISTEMA_PADRAO } from "../utils/sistemas";
import { formatFirebaseError } from "../utils/erros";

export const DEFAULT_CAMPAIGN_NAME = "Nova Campanha";
const ROOM_STORAGE_KEY = "rpg-table-room-id";

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

// "Visitante": entra pra assistir e rolar dados, sem registrar presenca (ver o motivo em
// src/utils/presenca.js) e sem criar personagem. Pensado pra plateia entrando via QR code.
function getInitialVisitante() {
  const params = new URLSearchParams(window.location.search);
  return params.get("visitante") === "1";
}

// Sala atual: de onde vem (URL/localStorage), criar, entrar, sair, link de convite,
// dados da campanha (documento salas/{salaId}) e se este jogador foi removido dela.
// setErro(mensagem | null) e o setState do aviso de erro do App (identidade estavel).
export default function useSala({ authUser, currentUser, setErro }) {
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
  const [bloqueado, setBloqueado] = useState(false);
  const [isVisitante, setIsVisitante] = useState(getInitialVisitante);
  const [entrarComoVisitante, setEntrarComoVisitante] = useState(false); // checkbox do lobby
  const wasBlockedRef = useRef(false);

  const isMestre = Boolean(currentUser && campanha.mestreId === currentUser.id);
  const salaShareUrl = useMemo(() => {
    if (!salaId) return "";

    const url = new URL(window.location.href);
    url.searchParams.set("sala", salaId);
    return url.toString();
  }, [salaId]);
  // Link pra plateia: mesma sala, marcado como visitante (sem presenca, sem criar personagem).
  // E o link que vira QR code na tela do mestre.
  const salaVisitanteUrl = useMemo(() => {
    if (!salaId) return "";

    const url = new URL(window.location.href);
    url.searchParams.set("sala", salaId);
    url.searchParams.set("visitante", "1");
    return url.toString();
  }, [salaId]);

  useEffect(() => {
    const url = new URL(window.location.href);

    if (!salaId) {
      localStorage.removeItem(ROOM_STORAGE_KEY);
      if (url.searchParams.has("sala") || url.searchParams.has("visitante")) {
        url.searchParams.delete("sala");
        url.searchParams.delete("visitante");
        window.history.replaceState(null, "", url.toString());
      }
      return;
    }

    localStorage.setItem(ROOM_STORAGE_KEY, salaId);

    let precisaAtualizar = url.searchParams.get("sala") !== salaId;

    if (isVisitante && url.searchParams.get("visitante") !== "1") {
      url.searchParams.set("visitante", "1");
      precisaAtualizar = true;
    } else if (!isVisitante && url.searchParams.has("visitante")) {
      url.searchParams.delete("visitante");
      precisaAtualizar = true;
    }

    if (precisaAtualizar) {
      url.searchParams.set("sala", salaId);
      window.history.replaceState(null, "", url.toString());
    }
  }, [salaId, isVisitante]);

  // Trocou de sala: volta a campanha e o bloqueio ao estado inicial.
  useEffect(() => {
    if (!salaId) return;

    setCampanha({
      id: "camp-1",
      nome: DEFAULT_CAMPAIGN_NAME,
    });
    setBloqueado(false);
    wasBlockedRef.current = false;
  }, [salaId]);

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
        setErro(formatFirebaseError("Nao foi possivel carregar os dados da campanha no Firebase.", error));
      }
    );
    return () => unsub();
  }, [authUser, salaId, bloqueado, setErro]);

  // Este jogador foi removido pelo mestre? (documento salas/{sala}/bloqueados/{meuId})
  useEffect(() => {
    if (!isFirebaseConfigured || !authUser || !salaId) return undefined;

    const unsub = onSnapshot(
      doc(db, "salas", salaId, "bloqueados", authUser.uid),
      (snapshot) => {
        const foiRemovido = snapshot.exists();

        // Foi readmitido: limpa os avisos de acesso negado da fase em que estava fora.
        if (!foiRemovido && wasBlockedRef.current) setErro(null);

        wasBlockedRef.current = foiRemovido;
        setBloqueado(foiRemovido);
      },
      (error) => {
        console.warn("Nao foi possivel verificar se o jogador foi removido:", error);
      }
    );
    return () => unsub();
  }, [authUser, salaId, setErro]);

  async function handleCreateRoom(e) {
    e.preventDefault();
    if (!currentUser || creatingRoom) return;

    const nextSalaId = generateRoomId();
    const nome = newRoomName.trim() || DEFAULT_CAMPAIGN_NAME;
    const sistemaEscolhido = SISTEMAS[novoSistema] ? novoSistema : SISTEMA_PADRAO;
    const { regraD20 } = SISTEMAS[sistemaEscolhido];
    setCreatingRoom(true);
    setErro(null);

    try {
      setIsVisitante(false); // quem cria a sala e o mestre, nunca visitante
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
      setErro(formatFirebaseError("Nao foi possivel criar a sala.", error));
    } finally {
      setCreatingRoom(false);
    }
  }

  function handleRoomSubmit(e) {
    e.preventDefault();
    const nextSalaId = normalizeRoomId(salaInput);
    if (!nextSalaId) return;

    setErro(null);
    setSalaInput(nextSalaId);
    setIsVisitante(entrarComoVisitante);
    setSalaId(nextSalaId);
  }

  function handleLeaveRoom() {
    setSalaInput("");
    setSalaId(null);
    setIsVisitante(false);
    setEntrarComoVisitante(false);
  }

  async function handleCopyRoomLink() {
    try {
      await navigator.clipboard.writeText(salaShareUrl);
      setRoomLinkCopied(true);
      window.setTimeout(() => setRoomLinkCopied(false), 1800);
    } catch (error) {
      console.error("Erro ao copiar link da sala:", error);
      setErro("Nao foi possivel copiar o link da sala automaticamente.");
    }
  }

  return {
    salaId,
    salaInput,
    setSalaInput,
    newRoomName,
    setNewRoomName,
    novoSistema,
    setNovoSistema,
    creatingRoom,
    roomLinkCopied,
    campanha,
    isMestre,
    bloqueado,
    isVisitante,
    entrarComoVisitante,
    setEntrarComoVisitante,
    salaShareUrl,
    salaVisitanteUrl,
    handleCreateRoom,
    handleRoomSubmit,
    handleLeaveRoom,
    handleCopyRoomLink
  };
}
