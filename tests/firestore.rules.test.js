// Testa firestore.rules de verdade, contra o emulador do Firestore (nao mocka nada).
// Como rodar: ver o script "test:rules" no package.json (precisa de Java instalado, que o
// emulador usa por baixo dos panos).
//
// Isto roda no Node, fora do navegador, entao fica fora de src/ (o CRA so testa o que esta
// la dentro). Ver jest.rules.config.js.

const fs = require("fs");
const path = require("path");
const {
  initializeTestEnvironment,
  assertSucceeds,
  assertFails
} = require("@firebase/rules-unit-testing");
const { doc, getDoc, setDoc, updateDoc, deleteDoc, collection, getDocs, addDoc } = require("firebase/firestore");

const PROJECT_ID = "rpg-table-regras-teste";

let testEnv;

beforeAll(async () => {
  testEnv = await initializeTestEnvironment({
    projectId: PROJECT_ID,
    firestore: {
      rules: fs.readFileSync(path.resolve(__dirname, "..", "firestore.rules"), "utf8"),
      host: "127.0.0.1",
      port: 8080
    }
  });
});

afterAll(async () => {
  await testEnv.cleanup();
});

afterEach(async () => {
  await testEnv.clearFirestore();
});

// Cria a sala direto, sem passar pelas regras (mestre = uid "mestre").
async function criarSala(salaId, dados = {}) {
  await testEnv.withSecurityRulesDisabled(async (ctx) => {
    await setDoc(doc(ctx.firestore(), "salas", salaId), {
      nome: "Sala de teste",
      mestreId: "mestre",
      mestreNome: "Mestre",
      createdAt: Date.now(),
      updatedAt: Date.now(),
      ...dados
    });
  });
}

function db(uid) {
  return uid ? testEnv.authenticatedContext(uid).firestore() : testEnv.unauthenticatedContext().firestore();
}

describe("salas", () => {
  test("visitante nao autenticado nao le nem cria sala", async () => {
    await criarSala("sala-1");
    await assertFails(getDoc(doc(db(null), "salas", "sala-1")));
  });

  test("qualquer usuario autenticado le uma sala pelo ID", async () => {
    await criarSala("sala-1");
    await assertSucceeds(getDoc(doc(db("jogador-a"), "salas", "sala-1")));
  });

  test("ninguem consegue listar todas as salas (o ID e o convite)", async () => {
    await criarSala("sala-1");
    await criarSala("sala-2");
    await assertFails(getDocs(collection(db("jogador-a"), "salas")));
  });

  test("criar sala exige que o mestreId seja o proprio usuario", async () => {
    await assertSucceeds(setDoc(doc(db("mestre"), "salas", "sala-nova"), {
      nome: "Nova", mestreId: "mestre", mestreNome: "Mestre", createdAt: Date.now(), updatedAt: Date.now()
    }));
    await assertFails(setDoc(doc(db("mestre"), "salas", "sala-fraude"), {
      nome: "Fraude", mestreId: "outra-pessoa", mestreNome: "Mestre", createdAt: Date.now(), updatedAt: Date.now()
    }));
  });

  test("jogador removido (bloqueado) nao consegue mais ler a sala", async () => {
    await criarSala("sala-1");
    await testEnv.withSecurityRulesDisabled(async (ctx) => {
      await setDoc(doc(ctx.firestore(), "salas", "sala-1", "bloqueados", "jogador-b"), {
        nome: "Jogador B", bloqueadoPor: "mestre", bloqueadoEm: Date.now()
      });
    });
    await assertFails(getDoc(doc(db("jogador-b"), "salas", "sala-1")));
  });

  test("visitante nao autenticado nao cria sala", async () => {
    await assertFails(setDoc(doc(db(null), "salas", "sala-nova"), {
      nome: "Nova", mestreId: "mestre", mestreNome: "Mestre", createdAt: Date.now(), updatedAt: Date.now()
    }));
  });

  test("mestre atualiza a propria sala", async () => {
    await criarSala("sala-1");
    await assertSucceeds(updateDoc(doc(db("mestre"), "salas", "sala-1"), {
      nome: "Nome novo", updatedAt: Date.now()
    }));
  });

  test("outra pessoa autenticada nao atualiza a sala", async () => {
    await criarSala("sala-1");
    await assertFails(updateDoc(doc(db("jogador-a"), "salas", "sala-1"), {
      nome: "Sala sequestrada", updatedAt: Date.now()
    }));
  });
});

describe("personagens", () => {
  beforeEach(async () => {
    await criarSala("sala-1");
  });

  test("dono cria o proprio personagem", async () => {
    await assertSucceeds(setDoc(doc(db("jogador-a"), "salas", "sala-1", "personagens", "p1"), {
      nome: "Fulano", ownerId: "jogador-a", marcadores: []
    }));
  });

  test("nao pode criar personagem em nome de outra pessoa", async () => {
    await assertFails(setDoc(doc(db("jogador-a"), "salas", "sala-1", "personagens", "p1"), {
      nome: "Fulano", ownerId: "outra-pessoa", marcadores: []
    }));
  });

  test("dono edita o proprio personagem livremente", async () => {
    await testEnv.withSecurityRulesDisabled(async (ctx) => {
      await setDoc(doc(ctx.firestore(), "salas", "sala-1", "personagens", "p1"), {
        nome: "Fulano", ownerId: "jogador-a", marcadores: []
      });
    });
    await assertSucceeds(updateDoc(doc(db("jogador-a"), "salas", "sala-1", "personagens", "p1"), {
      nome: "Fulano Editado"
    }));
  });

  test("outro jogador nao edita a ficha alheia", async () => {
    await testEnv.withSecurityRulesDisabled(async (ctx) => {
      await setDoc(doc(ctx.firestore(), "salas", "sala-1", "personagens", "p1"), {
        nome: "Fulano", ownerId: "jogador-a", marcadores: []
      });
    });
    await assertFails(updateDoc(doc(db("jogador-b"), "salas", "sala-1", "personagens", "p1"), {
      nome: "Hackeado"
    }));
  });

  test("mestre so pode mexer em iniciativa e condicoes na ficha alheia", async () => {
    await testEnv.withSecurityRulesDisabled(async (ctx) => {
      await setDoc(doc(ctx.firestore(), "salas", "sala-1", "personagens", "p1"), {
        nome: "Fulano", ownerId: "jogador-a", marcadores: [], iniciativa: null, condicoes: []
      });
    });
    await assertSucceeds(updateDoc(doc(db("mestre"), "salas", "sala-1", "personagens", "p1"), {
      iniciativa: 15, condicoes: ["Sangrando"]
    }));
    await assertFails(updateDoc(doc(db("mestre"), "salas", "sala-1", "personagens", "p1"), {
      nome: "Nome trocado pelo mestre"
    }));
  });

  test("mestre pode excluir a ficha de um jogador removido", async () => {
    await testEnv.withSecurityRulesDisabled(async (ctx) => {
      await setDoc(doc(ctx.firestore(), "salas", "sala-1", "personagens", "p1"), {
        nome: "Fulano", ownerId: "jogador-a", marcadores: []
      });
      await setDoc(doc(ctx.firestore(), "salas", "sala-1", "bloqueados", "jogador-a"), {
        nome: "Jogador A", bloqueadoPor: "mestre", bloqueadoEm: Date.now()
      });
    });
    await assertSucceeds(deleteDoc(doc(db("mestre"), "salas", "sala-1", "personagens", "p1")));
  });
});

describe("rolls (historico de rolagens)", () => {
  beforeEach(async () => {
    await criarSala("sala-1");
  });

  test("membro registra a propria rolagem", async () => {
    await assertSucceeds(addDoc(collection(db("jogador-a"), "salas", "sala-1", "rolls"), {
      userId: "jogador-a", jogador: "Jogador A", expressao: "1d20", resultado: 12, timestamp: Date.now()
    }));
  });

  test("nao pode registrar rolagem em nome de outra pessoa", async () => {
    await assertFails(addDoc(collection(db("jogador-a"), "salas", "sala-1", "rolls"), {
      userId: "outra-pessoa", jogador: "Jogador A", expressao: "1d20", resultado: 12, timestamp: Date.now()
    }));
  });

  test("ninguem edita uma rolagem depois de criada", async () => {
    let rollRef;
    await testEnv.withSecurityRulesDisabled(async (ctx) => {
      rollRef = doc(ctx.firestore(), "salas", "sala-1", "rolls", "roll-1");
      await setDoc(rollRef, { userId: "jogador-a", expressao: "1d20", resultado: 12 });
    });
    await assertFails(updateDoc(doc(db("jogador-a"), "salas", "sala-1", "rolls", "roll-1"), { resultado: 20 }));
  });
});

describe("area privada do mestre (pontos de medo)", () => {
  beforeEach(async () => {
    await criarSala("sala-1");
  });

  test("mestre le e escreve os pontos de medo", async () => {
    await assertSucceeds(setDoc(doc(db("mestre"), "salas", "sala-1", "mestre", "medo"), {
      pontos: 5, updatedAt: Date.now()
    }));
    await assertSucceeds(getDoc(doc(db("mestre"), "salas", "sala-1", "mestre", "medo")));
  });

  test("jogador comum nao le nem escreve os pontos de medo", async () => {
    await testEnv.withSecurityRulesDisabled(async (ctx) => {
      await setDoc(doc(ctx.firestore(), "salas", "sala-1", "mestre", "medo"), { pontos: 5, updatedAt: Date.now() });
    });
    await assertFails(getDoc(doc(db("jogador-a"), "salas", "sala-1", "mestre", "medo")));
    await assertFails(setDoc(doc(db("jogador-a"), "salas", "sala-1", "mestre", "medo"), { pontos: 999, updatedAt: Date.now() }));
  });

  test("pontos fora do intervalo 0-999 sao recusados", async () => {
    await assertFails(setDoc(doc(db("mestre"), "salas", "sala-1", "mestre", "medo"), {
      pontos: 1000, updatedAt: Date.now()
    }));
    await assertFails(setDoc(doc(db("mestre"), "salas", "sala-1", "mestre", "medo"), {
      pontos: -1, updatedAt: Date.now()
    }));
  });
});

describe("bloqueados (jogadores removidos)", () => {
  beforeEach(async () => {
    await criarSala("sala-1");
  });

  test("mestre remove um jogador", async () => {
    await assertSucceeds(setDoc(doc(db("mestre"), "salas", "sala-1", "bloqueados", "jogador-b"), {
      nome: "Jogador B", bloqueadoPor: "mestre", bloqueadoEm: Date.now()
    }));
  });

  test("jogador comum nao remove outro jogador", async () => {
    await assertFails(setDoc(doc(db("jogador-a"), "salas", "sala-1", "bloqueados", "jogador-b"), {
      nome: "Jogador B", bloqueadoPor: "jogador-a", bloqueadoEm: Date.now()
    }));
  });

  test("o proprio jogador removido consegue ler o registro (pra saber que foi removido)", async () => {
    await testEnv.withSecurityRulesDisabled(async (ctx) => {
      await setDoc(doc(ctx.firestore(), "salas", "sala-1", "bloqueados", "jogador-b"), {
        nome: "Jogador B", bloqueadoPor: "mestre", bloqueadoEm: Date.now()
      });
    });
    await assertSucceeds(getDoc(doc(db("jogador-b"), "salas", "sala-1", "bloqueados", "jogador-b")));
  });

  test("mestre readmite (apaga o bloqueio)", async () => {
    await testEnv.withSecurityRulesDisabled(async (ctx) => {
      await setDoc(doc(ctx.firestore(), "salas", "sala-1", "bloqueados", "jogador-b"), {
        nome: "Jogador B", bloqueadoPor: "mestre", bloqueadoEm: Date.now()
      });
    });
    await assertSucceeds(deleteDoc(doc(db("mestre"), "salas", "sala-1", "bloqueados", "jogador-b")));
  });
});

describe("extras", () => {
  beforeEach(async () => {
    await criarSala("sala-1");
  });

  async function criarExtra() {
    await testEnv.withSecurityRulesDisabled(async (ctx) => {
      await setDoc(doc(ctx.firestore(), "salas", "sala-1", "extras", "e1"), {
        nome: "Goblin", createdBy: "mestre"
      });
    });
  }

  test("mestre cria, edita e apaga um item", async () => {
    const ref = doc(db("mestre"), "salas", "sala-1", "extras", "e1");
    await assertSucceeds(setDoc(ref, { nome: "Goblin", createdBy: "mestre" }));
    await assertSucceeds(updateDoc(ref, { nome: "Goblin Chefe" }));
    await assertSucceeds(deleteDoc(ref));
  });

  test("jogador comum nao cria item", async () => {
    await assertFails(setDoc(doc(db("jogador-a"), "salas", "sala-1", "extras", "e1"), {
      nome: "Goblin", createdBy: "jogador-a"
    }));
  });

  test("jogador comum nao edita item", async () => {
    await criarExtra();
    await assertFails(updateDoc(doc(db("jogador-a"), "salas", "sala-1", "extras", "e1"), {
      nome: "Goblin Hackeado"
    }));
  });

  test("jogador comum le os itens", async () => {
    await criarExtra();
    await assertSucceeds(getDoc(doc(db("jogador-a"), "salas", "sala-1", "extras", "e1")));
    await assertSucceeds(getDocs(collection(db("jogador-a"), "salas", "sala-1", "extras")));
  });
});

describe("jogadores (presenca)", () => {
  beforeEach(async () => {
    await criarSala("sala-1");
  });

  test("jogador cria e atualiza o proprio documento de presenca", async () => {
    const ref = doc(db("jogador-a"), "salas", "sala-1", "jogadores", "jogador-a");
    await assertSucceeds(setDoc(ref, { userId: "jogador-a", nome: "Jogador A" }));
    await assertSucceeds(updateDoc(ref, { nome: "Jogador A (online)" }));
  });

  test("jogador nao cria o documento de presenca de outro", async () => {
    await assertFails(setDoc(doc(db("jogador-a"), "salas", "sala-1", "jogadores", "jogador-b"), {
      userId: "jogador-b", nome: "Jogador B"
    }));
  });

  test("jogador nao atualiza o documento de presenca de outro", async () => {
    await testEnv.withSecurityRulesDisabled(async (ctx) => {
      await setDoc(doc(ctx.firestore(), "salas", "sala-1", "jogadores", "jogador-b"), {
        userId: "jogador-b", nome: "Jogador B"
      });
    });
    await assertFails(updateDoc(doc(db("jogador-a"), "salas", "sala-1", "jogadores", "jogador-b"), {
      nome: "Trocado"
    }));
  });

  test("qualquer membro le a lista de presenca", async () => {
    await testEnv.withSecurityRulesDisabled(async (ctx) => {
      await setDoc(doc(ctx.firestore(), "salas", "sala-1", "jogadores", "jogador-b"), {
        userId: "jogador-b", nome: "Jogador B"
      });
    });
    await assertSucceeds(getDocs(collection(db("jogador-a"), "salas", "sala-1", "jogadores")));
  });
});
