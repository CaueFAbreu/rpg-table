import { useState, useEffect, useMemo, useRef } from "react";
import { onAuthStateChanged, signInAnonymously } from "firebase/auth";
import { auth, isFirebaseConfigured } from "../firebase";
import { formatFirebaseError } from "../utils/erros";

const USER_NAME_STORAGE_KEY = "rpg-table-player-name";

function getStoredPlayerName() {
  return localStorage.getItem(USER_NAME_STORAGE_KEY) || "Jogador";
}

// Login anonimo do Firebase + nome do jogador (salvo no navegador).
// onErro(mensagem) e chamado se o login anonimo falhar.
export default function useAuth({ onErro } = {}) {
  const [authUser, setAuthUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [playerName, setPlayerName] = useState(getStoredPlayerName);

  // Guarda o callback mais recente sem reinscrever o listener de auth a cada render.
  const onErroRef = useRef(onErro);
  onErroRef.current = onErro;

  const currentUser = useMemo(() => {
    if (!authUser) return null;

    return {
      id: authUser.uid,
      nome: playerName.trim() || `Jogador ${authUser.uid.slice(0, 6)}`,
    };
  }, [authUser, playerName]);

  useEffect(() => {
    localStorage.setItem(USER_NAME_STORAGE_KEY, playerName);
  }, [playerName]);

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
        onErroRef.current?.(formatFirebaseError("Nao foi possivel autenticar no Firebase.", error));
        setAuthLoading(false);
      });
    });

    return () => unsubscribe();
  }, []);

  return { authUser, authLoading, playerName, setPlayerName, currentUser };
}
