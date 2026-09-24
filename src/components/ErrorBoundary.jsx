import { Component } from "react";

// Captura erros de renderizacao em qualquer parte do app e mostra uma tela de recuperacao
// no lugar da pagina em branco. Os dados da sala ficam no Firestore, entao recarregar e seguro.
export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { erro: null };
  }

  static getDerivedStateFromError(erro) {
    return { erro };
  }

  componentDidCatch(erro, info) {
    console.error("Erro nao tratado na interface:", erro, info.componentStack);
  }

  render() {
    if (!this.state.erro) return this.props.children;

    return (
      <div className="min-h-screen bg-[#250617] flex items-center justify-center p-6 text-white">
        <div role="alert" className="max-w-xl w-full bg-black/30 border border-[#b82870]/40 rounded-xl p-6">
          <h1 className="text-2xl font-bold mb-3">Algo deu errado</h1>
          <p className="text-gray-300 mb-4">
            A mesa encontrou um erro inesperado. Seus personagens e rolagens estão salvos:
            recarregar a página deve resolver.
          </p>
          <button
            type="button"
            onClick={() => window.location.reload()}
            className="rounded-lg bg-[#b82870] px-4 py-2 font-bold text-white transition hover:bg-[#9a205d]"
          >
            Recarregar
          </button>
        </div>
      </div>
    );
  }
}
