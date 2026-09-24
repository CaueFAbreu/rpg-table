import { useState, useEffect } from "react";
import {
  collection,
  onSnapshot,
  addDoc,
  getDocs,
  writeBatch,
  query,
  orderBy,
  limit
} from "firebase/firestore";
import { db, isFirebaseConfigured } from "../firebase";
import { regraD20DaSala } from "../utils/sistemas";
import { rolarAtaqueComDano } from "../utils/dados";
import { formatFirebaseError } from "../utils/erros";

// Historico de rolagens da sala (salas/{salaId}/rolls): listener das 50 mais recentes,
// rolagem simples (DiceRoller), ataque fixo da ficha e limpar historico (mestre).
// setErro e o setState do aviso de erro do App (identidade estavel).
export default function useRolls({
  authUser,
  currentUser,
  salaId,
  bloqueado,
  campanha,
  isMestre,
  activeCharacter,
  setErro
}) {
  const [rolls, setRolls] = useState([]);

  // Trocou de sala: limpa o historico da sala anterior.
  useEffect(() => {
    if (!salaId) return;

    setRolls([]);
  }, [salaId]);

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
        setErro(formatFirebaseError("Nao foi possivel carregar o historico de rolls no Firebase.", error));
      }
    );
    return () => unsub();
  }, [authUser, salaId, bloqueado, setErro]);

  async function handleNewRoll(rollData) {
    if (!currentUser) return;
    try {
      await addDoc(collection(db, "salas", salaId, "rolls"), {
        ...rollData,
        personagem: activeCharacter ? activeCharacter.nome : currentUser.nome,
        personagemId: activeCharacter ? activeCharacter.id : null,
        jogador: currentUser.nome,
        userId: currentUser.id,
        timestamp: Date.now()
      });
    } catch (error) {
      console.error("Erro ao registrar roll:", error);
      setErro(formatFirebaseError("Nao foi possivel registrar a rolagem no Firebase.", error));
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
      setErro(formatFirebaseError("Nao foi possivel registrar o ataque no Firebase.", error));
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
      setErro(formatFirebaseError("Nao foi possivel limpar o historico de rolls.", error));
    }
  }

  return { rolls, handleNewRoll, handleRolarAtaque, handleClearRolls };
}
