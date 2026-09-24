import { useEffect } from "react";
import { doc, setDoc } from "firebase/firestore";
import { db, isFirebaseConfigured } from "../firebase";
import {
  PRESENCE_HEARTBEAT_MS,
  PRESENCE_MIN_GAP_MS,
  PRESENCE_NAME_DEBOUNCE_MS
} from "../utils/presenca";

// Presenca "preguicosa": ver src/utils/presenca.js para o motivo.
// Grava salas/{salaId}/jogadores/{userId} enquanto o jogador esta na sala (nao grava para
// visitante nem para jogador removido).
export default function usePresenca({ salaId, userId, nome, isMestre, bloqueado, isVisitante }) {
  useEffect(() => {
    if (!isFirebaseConfigured || !userId || !salaId || bloqueado || isVisitante) return undefined;

    const playerRef = doc(db, "salas", salaId, "jogadores", userId);
    let lastWrite = 0;

    function syncPresence() {
      lastWrite = Date.now();

      return setDoc(playerRef, {
        nome,
        userId,
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
  }, [userId, nome, isMestre, salaId, bloqueado, isVisitante]);
}
