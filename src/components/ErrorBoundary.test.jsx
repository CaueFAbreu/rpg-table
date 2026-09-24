import { render, screen } from "@testing-library/react";
import ErrorBoundary from "./ErrorBoundary";

function ComponenteQuebrado() {
  throw new Error("falha de teste");
}

describe("ErrorBoundary", () => {
  let consoleError;

  beforeEach(() => {
    // O React e o proprio ErrorBoundary registram o erro no console; silencia no teste.
    consoleError = jest.spyOn(console, "error").mockImplementation(() => {});
  });

  afterEach(() => {
    consoleError.mockRestore();
  });

  test("renderiza os filhos quando nao ha erro", () => {
    render(
      <ErrorBoundary>
        <p>conteudo normal</p>
      </ErrorBoundary>
    );

    expect(screen.getByText("conteudo normal")).toBeInTheDocument();
  });

  test("mostra a tela de recuperacao quando um filho lanca erro", () => {
    render(
      <ErrorBoundary>
        <ComponenteQuebrado />
      </ErrorBoundary>
    );

    expect(screen.getByRole("alert")).toHaveTextContent("Algo deu errado");
    expect(screen.getByRole("button", { name: "Recarregar" })).toBeInTheDocument();
  });
});
