import { useState, useEffect } from "react";
import {
  collection,
  doc,
  onSnapshot,
  updateDoc,
  deleteDoc,
  addDoc
} from "firebase/firestore";
import { db, isFirebaseConfigured } from "../firebase";
import { formatFirebaseError } from "../utils/erros";

// Personagens da sala (salas/{salaId}/personagens): listener em tempo real, personagem ativo
// do jogador e criar/editar/excluir/iniciativa.
// setErro e setCarregando sao os setState do App (identidade estavel). O primeiro snapshot
// de personagens e o que tira a mesa da tela de "Carregando mesa...".
export default function usePersonagens({ authUser, currentUser, salaId, bloqueado, setErro, setCarregando }) {
  const [characters, setCharacters] = useState([]);
  const [activeCharacterId, setActiveCharacterId] = useState(null);

  // Trocou de sala: limpa os personagens da sala anterior.
  useEffect(() => {
    if (!salaId) return;

    setCharacters([]);
    setActiveCharacterId(null);
  }, [salaId]);

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
        setErro(formatFirebaseError("Nao foi possivel carregar os personagens no Firebase.", error));
        setCarregando(false);
      }
    );
    return () => unsub();
  }, [authUser, salaId, bloqueado, setErro, setCarregando]);

  useEffect(() => {
    if (!currentUser) return;

    if (!activeCharacterId && characters.length > 0) {
      const primeiro = characters.find((c) => c.ownerId === currentUser.id);
      if (primeiro) setActiveCharacterId(primeiro.id);
    }
  }, [characters, currentUser, activeCharacterId]);

  const activeCharacter = characters.find((c) => c.id === activeCharacterId);

  async function updateCharacter(updatedChar) {
    if (!currentUser) return;

    const { id, ...dados } = updatedChar;
    try {
      await updateDoc(doc(db, "salas", salaId, "personagens", id), dados);
    } catch (error) {
      console.error("Erro ao atualizar personagem:", error);
      setErro(formatFirebaseError("Nao foi possivel salvar as alteracoes do personagem.", error));
    }
  }

  // Retorna true se criou (o App usa isso pra fechar o modal).
  async function criarPersonagem(novosDados) {
    if (!currentUser) return false;

    try {
      await addDoc(collection(db, "salas", salaId, "personagens"), {
        ...novosDados,
        ownerId: currentUser.id,
        imagem: novosDados.imagem || null
      });
      return true;
    } catch (error) {
      console.error("Erro ao criar personagem:", error);
      setErro(formatFirebaseError("Nao foi possivel criar o personagem no Firebase.", error));
      return false;
    }
  }

  async function deleteCharacter(idParaDeletar) {
    if (!currentUser) return;

    try {
      await deleteDoc(doc(db, "salas", salaId, "personagens", idParaDeletar));
      if (activeCharacterId === idParaDeletar) setActiveCharacterId(null);
    } catch (error) {
      console.error("Erro ao excluir personagem:", error);
      setErro(formatFirebaseError("Nao foi possivel excluir o personagem no Firebase.", error));
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
      setErro(formatFirebaseError("Nao foi possivel atualizar a iniciativa no Firebase.", error));
    }
  }

  return {
    characters,
    activeCharacterId,
    setActiveCharacterId,
    activeCharacter,
    updateCharacter,
    criarPersonagem,
    deleteCharacter,
    handleUpdateIniciativa
  };
}
