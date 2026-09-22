import { useEffect, useState } from "react";
import { rolarExpressao } from "../utils/dados";
import { descreverRegraD20 } from "../utils/sistemas";

const DADOS = [4, 6, 8, 10, 12, 20, 100];

function DiceIcon({ tipo, size = 48 }) {
  const s = size;
  const fill = "#b82870";
  const stroke = "#e85fa4";

  return (
    <svg width={s} height={s} viewBox="0 0 100 100">
      <circle cx="50" cy="50" r="45" fill={fill} stroke={stroke} strokeWidth="3" />
      <text x="50" y="58" textAnchor="middle" fontSize="28" fill="white" fontWeight="bold">
        D{tipo}
      </text>
    </svg>
  );
}

// `pedido` (opcional): { expressao, rotulo, chave } vindo de um atalho de ficha (ex.: clicar
// numa pericia). Ao mudar, dispara a rolagem automaticamente com essa expressao.
function DiceRoller({ onRoll, regraD20, pedido }) {
  const [expressao, setExpressao] = useState("1d20");
  const [resultadoFinal, setResultadoFinal] = useState(null);
  const [detalhesRolagem, setDetalhesRolagem] = useState("");
  const [erro, setErro] = useState(null);
  const [rolando, setRolando] = useState(false);
  const [criticoFalha, setCriticoFalha] = useState(null);
  const [rotuloAtual, setRotuloAtual] = useState(null);

  function adicionarDado(faces) {
    setErro(null);
    setExpressao((prev) => {
      const text = prev.trim();
      if (!text) return `1d${faces}`;
      return `${text} + 1d${faces}`;
    });
  }

  function rolar(expressaoAlvo, rotulo) {
    const texto = (expressaoAlvo ?? expressao).trim();
    if (!texto || rolando) return;

    setRolando(true);
    setResultadoFinal(null);
    setDetalhesRolagem("");
    setErro(null);
    setCriticoFalha(null);
    setRotuloAtual(rotulo || null);

    window.setTimeout(() => {
      const resultado = rolarExpressao(texto, { regraD20 });
      setRolando(false);

      if (!resultado.ok) {
        setErro(resultado.erro);
        return;
      }

      setResultadoFinal(resultado.total);
      setDetalhesRolagem(resultado.detalhe);
      setCriticoFalha(resultado.criticoFalha);

      if (onRoll) {
        onRoll({
          expressao: texto,
          rotulo: rotulo || null,
          resultado: resultado.total,
          detalhe: resultado.detalhe,
          criticoFalha: resultado.criticoFalha,
          timestamp: Date.now()
        });
      }
    }, 600);
  }

  // Atalho de ficha: cada clique (mesmo repetindo a mesma pericia) manda uma `chave` nova,
  // para o efeito disparar de novo mesmo com a mesma expressao.
  useEffect(() => {
    if (!pedido) return;
    setExpressao(pedido.expressao);
    rolar(pedido.expressao, pedido.rotulo);
    // O efeito deve rodar so quando `pedido.chave` mudar (cada clique manda uma chave nova),
    // nunca quando `expressao` muda por causa do proprio rolar() (isso causaria loop).
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pedido?.chave]);

  return (
    <div className="bg-black/20 border border-[#b82870]/30 rounded-xl p-4 w-full">
      <div className="mb-3 flex items-center justify-center gap-2">
        <h3 className="text-white font-bold text-center">🎲Dados🎲</h3>
        {regraD20 && (
          <span
            className="rounded border border-gray-600/50 px-1.5 py-0.5 text-[10px] uppercase tracking-widest text-gray-400"
            title={`Regra do d20 desta mesa: ${descreverRegraD20(regraD20)}`}
          >
            {regraD20 === "maior" ? "d20 maior" : "d20 soma"}
          </span>
        )}
      </div>

      <div className="flex gap-2 mb-3">
        <input
          type="text"
          value={expressao}
          onChange={(e) => {
            setExpressao(e.target.value);
            setErro(null);
          }}
          placeholder="Ex: 2d8 + 1d4 + 5"
          className="flex-1 bg-black/40 border border-gray-600/50 rounded px-3 py-2 text-white outline-none focus:border-[#b82870] font-mono text-sm"
          onKeyDown={(e) => e.key === "Enter" && rolar()}
        />
        <button
          onClick={() => { setExpressao(""); setErro(null); }}
          className="bg-black/40 hover:bg-[#b82870] text-gray-300 px-3 py-2 rounded font-bold transition-all"
          title="Limpar Expressão"
        >
          ✕
        </button>
      </div>

      <div className="flex flex-wrap justify-center gap-1 mb-4">
        {DADOS.map((dado) => (
          <button
            key={dado}
            onClick={() => adicionarDado(dado)}
            className="px-2 py-1 rounded text-xs font-bold transition-all bg-black/40 text-gray-300 hover:bg-[#b82870] hover:text-white border border-gray-600/50 hover:border-[#b82870]"
          >
            +D{dado}
          </button>
        ))}
      </div>

      <button
        onClick={() => rolar()}
        disabled={rolando}
        className="w-full bg-[#b82870] hover:bg-[#9a205d] disabled:opacity-50 text-white font-bold py-3 rounded-lg mb-4 transition-all shadow-lg shadow-[#b82870]/20"
      >
        {rolando ? "Rolando..." : "Rolar"}
      </button>

      <div className="h-28 flex flex-col items-center justify-center bg-black/30 border border-gray-700/50 rounded-xl p-3">
        {rolando ? (
          <div className="animate-spin">
            <DiceIcon tipo={20} size={48} />
          </div>
        ) : erro ? (
          <span className="text-red-400 text-xs text-center px-2">{erro}</span>
        ) : resultadoFinal !== null ? (
          <>
            {rotuloAtual && (
              <div className="text-[#f0a3ca] text-xs font-bold mb-0.5 text-center">{rotuloAtual}</div>
            )}
            <div className="text-gray-400 text-xs mb-1 font-mono text-center break-words w-full">
              {detalhesRolagem}
            </div>
            <div className={`text-4xl font-bold ${
              criticoFalha === "critico" ? "text-green-400 drop-shadow-[0_0_8px_rgba(74,222,128,0.5)]"
              : criticoFalha === "falha" ? "text-red-500 drop-shadow-[0_0_8px_rgba(239,68,68,0.5)]"
              : "text-white"
            }`}>
              {resultadoFinal}
            </div>
            {criticoFalha === "critico" && <div className="text-green-400 text-xs font-bold mt-1 uppercase tracking-widest">Sucesso Extremo!</div>}
            {criticoFalha === "falha" && <div className="text-red-500 text-xs font-bold mt-1 uppercase tracking-widest">Falha Crítica!</div>}
          </>
        ) : (
          <span className="text-gray-600 text-sm">Faz seus rolls ai</span>
        )}
      </div>
    </div>
  );
}

export default DiceRoller;
