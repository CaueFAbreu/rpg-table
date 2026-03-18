import { useState } from "react";

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

function DiceRoller({ onRoll }) {
  const [expressao, setExpressao] = useState("1d20");
  const [resultadoFinal, setResultadoFinal] = useState(null);
  const [detalhesRolagem, setDetalhesRolagem] = useState("");
  const [rolando, setRolando] = useState(false);
  const [criticoFalha, setCriticoFalha] = useState(null);

  function adicionarDado(faces) {
    setExpressao((prev) => {
      const text = prev.trim();
      if (!text) return `1d${faces}`;
      return `${text} + 1d${faces}`;
    });
  }

  function rolarDados() {
    if (!expressao.trim()) return;
    setRolando(true);
    setResultadoFinal(null);
    setDetalhesRolagem("");
    setCriticoFalha(null);

    setTimeout(() => {
      const limpo = expressao.replace(/\s+/g, "").toLowerCase();
      const partes = limpo.replace(/-/g, "+-").split("+").filter(p => p !== "");

      let total = 0;
      let detalhes = [];
      let isCritico = false;
      let isFalha = false;

      for (const parte of partes) {
        let isNegativo = parte.startsWith("-");
        const termoLimpo = parte.replace(/^[+-]/, "");

        if (termoLimpo.includes("d")) {
          const [qtdStr, facesStr] = termoLimpo.split("d");
          const qtd = parseInt(qtdStr) || 1; 
          const faces = parseInt(facesStr);

          if (!faces) continue;

          let valoresRolados = [];
          for (let i = 0; i < qtd; i++) {
            const r = Math.floor(Math.random() * faces) + 1;
            valoresRolados.push(r);
            
            if (faces === 20 && r === 20) isCritico = true;
            if (faces === 20 && r === 1) isFalha = true;
          }

          let valorFinal;
          let detalheExtra = "";

        if (faces === 20) {
        // D20: pega apenas o maior valor
        valorFinal = Math.max(...valoresRolados);
        detalheExtra = ` → maior: ${valorFinal}`;
        } else {
        // Outros dados: soma normalmente
        valorFinal = valoresRolados.reduce((a, b) => a + b, 0);
        }

total += isNegativo ? -valorFinal : valorFinal;

const sinal = isNegativo ? "-" : "+";
detalhes.push(`${sinal}${qtd}d${faces} [${valoresRolados.join(", ")}]${detalheExtra}`);
        } 
        else {
          const valor = parseInt(termoLimpo);
          if (!isNaN(valor)) {
            total += isNegativo ? -valor : valor;
            detalhes.push(`${isNegativo ? "-" : "+"}${valor}`);
          }
        }
      }

      const detalheTexto = detalhes.join(" ").replace(/^\+/, "").trim();

      setResultadoFinal(total);
      setDetalhesRolagem(detalheTexto);
      
      if (isCritico && !isFalha) setCriticoFalha("critico");
      else if (isFalha && !isCritico) setCriticoFalha("falha");

      setRolando(false);

      if (onRoll) {
        onRoll({
          expressao: expressao,
          resultado: total,
          detalhe: detalheTexto,
          criticoFalha: isCritico ? "critico" : isFalha ? "falha" : null,
          timestamp: Date.now(),
        });
      }
    }, 600);
  }

  return (
    <div className="bg-black/20 border border-[#b82870]/30 rounded-xl p-4 w-80">
      <h3 className="text-white font-bold mb-3 text-center">🎲Dados🎲</h3>

      <div className="flex gap-2 mb-3">
        <input
          type="text"
          value={expressao}
          onChange={(e) => setExpressao(e.target.value)}
          placeholder="Ex: 2d8 + 1d4 + 5"
          className="flex-1 bg-black/40 border border-gray-600/50 rounded px-3 py-2 text-white outline-none focus:border-[#b82870] font-mono text-sm"
          onKeyDown={(e) => e.key === "Enter" && rolarDados()}
        />
        <button
          onClick={() => setExpressao("")}
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
        onClick={rolarDados}
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
        ) : resultadoFinal !== null ? (
          <>
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