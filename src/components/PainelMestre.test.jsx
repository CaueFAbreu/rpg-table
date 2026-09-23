import { render, screen, fireEvent } from "@testing-library/react";
import PainelMestre from "./PainelMestre";

function montar(props = {}) {
  const onSetPontosMedo = jest.fn();
  const onReadmitir = jest.fn();

  render(
    <PainelMestre
      pontosMedo={3}
      onSetPontosMedo={onSetPontosMedo}
      removidos={[]}
      onReadmitir={onReadmitir}
      personagens={[]}
      {...props}
    />
  );

  return { onSetPontosMedo, onReadmitir };
}

test("mostra os pontos e ajusta com os botoes", () => {
  const { onSetPontosMedo } = montar();

  expect(screen.getByText("3")).toBeInTheDocument();

  fireEvent.click(screen.getByLabelText("Adicionar 1 ponto de medo"));
  expect(onSetPontosMedo).toHaveBeenLastCalledWith(4);

  fireEvent.click(screen.getByLabelText("Adicionar 5 pontos de medo"));
  expect(onSetPontosMedo).toHaveBeenLastCalledWith(8);

  fireEvent.click(screen.getByLabelText("Remover 5 pontos de medo"));
  expect(onSetPontosMedo).toHaveBeenLastCalledWith(0);
});

test("nao deixa remover pontos quando ja esta em zero", () => {
  montar({ pontosMedo: 0 });

  expect(screen.getByLabelText("Remover 1 ponto de medo")).toBeDisabled();
  expect(screen.getByLabelText("Remover 5 pontos de medo")).toBeDisabled();
});

test("permite digitar um valor direto", () => {
  const { onSetPontosMedo } = montar();

  fireEvent.click(screen.getByLabelText("Editar pontos de medo"));
  const campo = screen.getByLabelText("Novo valor de pontos de medo");
  fireEvent.change(campo, { target: { value: "12" } });
  fireEvent.keyDown(campo, { key: "Enter" });

  expect(onSetPontosMedo).toHaveBeenCalledWith(12);
});

test("lista os removidos e permite readmitir", () => {
  const { onReadmitir } = montar({
    removidos: [{ id: "abc", nome: "Entrou Errado" }]
  });

  expect(screen.getByText("Entrou Errado")).toBeInTheDocument();
  fireEvent.click(screen.getByText("Readmitir"));
  expect(onReadmitir).toHaveBeenCalledWith("abc");
});

test("mostra a tabela de personagens com marcadores e condicoes", () => {
  montar({
    personagens: [
      {
        id: "c1",
        nome: "Alphonse",
        jogador: "Caue",
        marcadores: [{ id: "m1", nome: "Vida", atual: 15, max: 20, cor: "vermelho" }],
        condicoes: ["Sangrando"]
      }
    ]
  });

  expect(screen.getByText("Alphonse")).toBeInTheDocument();
  expect(screen.getByText("Caue")).toBeInTheDocument();
  expect(screen.getByText("15/20")).toBeInTheDocument();
  expect(screen.getByText("Sangrando")).toBeInTheDocument();
});

test("mostra aviso quando nao ha personagens", () => {
  montar({ personagens: [] });
  expect(screen.getByText("Nenhum personagem na sala ainda.")).toBeInTheDocument();
});
