// Config separada do Jest so pra este teste, porque o CRA (react-scripts test) so enxerga
// arquivos dentro de src/. Esses testes rodam num Node puro, contra o emulador do Firestore,
// nao no navegador: por isso ficam fora de src/ e tem sua propria config.
module.exports = {
  testEnvironment: "node",
  testMatch: ["<rootDir>/tests/**/*.test.js"],
  setupFiles: ["<rootDir>/jest.rules.setup.js"],
  testTimeout: 20000
};
