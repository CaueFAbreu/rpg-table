import { useState, useEffect } from "react";
import {
  collection,
  doc,
  onSnapshot,
  setDoc,
  deleteDoc,
  writeBatch
} from "firebase/firestore";
import { db, isFirebaseConfigured } from "../firebase";
import { normalizarPontosMedo } from "../utils/medo";
import { formatFirebaseError } from "../utils/erros";

// Ferramentas do mestre: Pontos de Medo (salas/{salaId}/mestre/medo), lista de jogadores
// removidos (salas/{salaId}/bloqueados), remover e readmitir jogador.
// So escuta/escreve quando isMestre (as regras do Firestore negam para os demais).
// setErro e o setState do aviso de erro do App (identidade estavel).
export default function useMestre({ authUser, currentUser, salaId, isMestre, characters, setErro }) {
  const [pontosMedo, setPontosMedo] = useState(0);
  const [removidos, setRemovidos] = useState([]);

  // Trocou de sala: limpa os dados do mestre da sala anterior.
  useEffect(() => {
    if (!salaId) return;

    setPontosMedo(0);
    setRemovidos([]);
  }, [salaId]);

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
        setErro(formatFirebaseError("Nao foi possivel carregar os jogadores removidos.", error));
      }
    );
    return () => unsub();
  }, [authUser, salaId, isMestre, setErro]);

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
        setErro(formatFirebaseError("Nao foi possivel carregar os pontos de medo.", error));
      }
    );
    return () => unsub();
  }, [authUser, salaId, isMestre, setErro]);

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
      setErro(formatFirebaseError("Nao foi possivel atualizar os pontos de medo.", error));
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
      setErro(formatFirebaseError("Nao foi possivel remover o jogador.", error));
    }
  }

  async function handleReadmitirJogador(playerId) {
    if (!currentUser || !isMestre || !playerId) return;

    try {
      await deleteDoc(doc(db, "salas", salaId, "bloqueados", playerId));
    } catch (error) {
      console.error("Erro ao readmitir jogador:", error);
      setErro(formatFirebaseError("Nao foi possivel readmitir o jogador.", error));
    }
  }

  return {
    pontosMedo,
    removidos,
    handleSetPontosMedo,
    handleRemovePlayer,
    handleReadmitirJogador
  };
}
