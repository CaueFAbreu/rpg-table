// O Jest vendido dentro do react-scripts (v27) e anterior ao "fetch" global do Node, e nao o
// repassa para dentro do ambiente de teste. A @firebase/rules-unit-testing precisa de "fetch"
// pra falar com o emulador. Este arquivo cola um polyfill antes dos testes rodarem.
const fetch = require("node-fetch");

if (typeof global.fetch === "undefined") {
  global.fetch = fetch;
  global.Headers = fetch.Headers;
  global.Request = fetch.Request;
  global.Response = fetch.Response;
}
