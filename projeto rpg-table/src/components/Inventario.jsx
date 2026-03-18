import { useState } from 'react';

// Agora ele recebe o array de itens do personagem e a função para salvar!
export default function Inventario({ itens = [], onUpdateInventario }) {
  const [novoItem, setNovoItem] = useState('');

  function adicionarItem() {
    if (novoItem.trim() === '') return;
    const novosItens = [...itens, novoItem];
    onUpdateInventario(novosItens);
    setNovoItem('');
  }

  function removerItem(index) {
    const novosItens = itens.filter((_, i) => i !== index);
    onUpdateInventario(novosItens);
  }

  return (
    <div className="mt-6 w-full bg-black/40 p-4 rounded-lg border border-gray-700/50">
      <h3 className="text-[#b82870] text-sm font-bold mb-3 tracking-widest">🎒 INVENTÁRIO</h3>

      <ul className="space-y-2 mb-3 max-h-40 overflow-y-auto custom-scrollbar pr-1">
        {itens.length === 0 && (
          <p className="text-gray-500 text-xs italic text-center py-2">Mochila vazia...</p>
        )}
        
        {itens.map((item, index) => (
          <li key={index} className="flex justify-between items-center bg-black/50 border border-gray-700 rounded px-3 py-2 text-sm text-gray-300">
            <span>{item}</span>
            <button
              onClick={() => removerItem(index)}
              className="text-red-500 hover:text-red-400 font-bold transition-colors"
              title="Remover item"
            >✕</button>
          </li>
        ))}
      </ul>

      <div className="flex gap-2">
        <input
          type="text"
          value={novoItem}
          onChange={(e) => setNovoItem(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && adicionarItem()}
          placeholder="Novo item..."
          className="flex-1 bg-black/50 border border-gray-600 focus:border-[#b82870] text-white text-sm rounded px-3 py-2 outline-none transition-colors"
        />
        <button
          onClick={adicionarItem}
          className="bg-[#b82870] hover:bg-[#9a205d] text-white px-4 rounded font-bold shadow-lg transition-colors"
        >+</button>
      </div>
    </div>
  );
}