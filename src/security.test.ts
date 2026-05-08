import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";

process.env.REGISTRO_API_BASE_URL = "https://registro.test/lacnic/v3";
process.env.REGISTRO_API_ACCESS_TOKEN = "test-registro-token";

type RegistroGetCall = {
  url: string;
  config?: {
    headers?: Record<string, string>;
  };
};

const { handleChatMessage } = require("./orchestrator/chatOrchestrator") as typeof import("./orchestrator/chatOrchestrator");
const { resetConversationState } = require("./conversation/conversationStateStore") as typeof import("./conversation/conversationStateStore");
const { detectIntent } = require("./llm/llmClient") as typeof import("./llm/llmClient");
const { registroApiClient } = require("./adapters/registroApiV3/registroApiClient") as typeof import("./adapters/registroApiV3/registroApiClient");
const axiosModule = require("axios") as typeof import("axios") & {
  default?: typeof import("axios");
};
const axiosClient = axiosModule.default ?? axiosModule;

const originalRegistroGet = registroApiClient.get.bind(registroApiClient);
const originalAxiosPost = axiosClient.post.bind(axiosClient);

test.afterEach(() => {
  (registroApiClient as any).get = originalRegistroGet;
  (axiosClient as any).post = originalAxiosPost;
  delete process.env.LLM_BASE_URL;
  delete process.env.LLM_MODEL;
  delete process.env.LLM_API_KEY;
  process.env.REGISTRO_API_ACCESS_TOKEN = "test-registro-token";
  resetConversationState();
});

test("consulta por OrgID ejecuta una tool de lectura y devuelve datos", async () => {
  const calls: RegistroGetCall[] = [];

  (registroApiClient as any).get = async (url: string, config: any) => {
    calls.push({ url, config });

    return {
      data: {
        id: "UY-LACN-LACNIC",
        name: "LACNIC"
      }
    };
  };

  const response = await handleChatMessage({
    message: "Mostrame información de la organización UY-LACN-LACNIC",
    locale: "es"
  });

  assert.equal(response.status, "COMPLETED");
  assert.equal(calls.length, 1);
  assert.equal(calls[0].url, "/entity/organizations/UY-LACN-LACNIC");
  assert.equal(calls[0].config?.headers?.Authorization, "Bearer test-registro-token");
});

test("consulta por recurso ejecuta solo GET sobre el recurso solicitado", async () => {
  const calls: RegistroGetCall[] = [];

  (registroApiClient as any).get = async (url: string, config: any) => {
    calls.push({ url, config });

    return {
      data: {
        address: "200.3.12.0",
        prefixLength: 24
      }
    };
  };

  const response = await handleChatMessage({
    message: "Necesito el detalle de 200.3.12.0/24",
    locale: "es"
  });

  assert.equal(response.status, "COMPLETED");
  assert.equal(calls.length, 1);
  assert.equal(calls[0].url, "/ips/200.3.12.0/24");
});

test("filtra recursos de organización para mostrar solo IPv4", async () => {
  (registroApiClient as any).get = async () => ({
    data: {
      asNumbers: [{ asn: 28001 }],
      ipRanges: [
        { start_address: "200.3.12.0", prefixLength: 24 },
        { start_address: "2801:13c:1000::", prefixLength: 48 }
      ]
    }
  });

  const response = await handleChatMessage({
    message: "Mostrame solo IPv4 de la organización UY-LACN-LACNIC",
    locale: "es"
  });

  assert.equal(response.status, "COMPLETED");
  assert.deepEqual(response.data, {
    asNumbers: [],
    ipRanges: [{ start_address: "200.3.12.0", prefixLength: 24 }]
  });
});

test("filtra recursos de organización para mostrar solo IPv6", async () => {
  (registroApiClient as any).get = async () => ({
    data: {
      asNumbers: [{ asn: 28001 }],
      ipRanges: [
        { start_address: "200.3.12.0", prefixLength: 24 },
        { start_address: "2801:13c:1000::", prefixLength: 48 }
      ]
    }
  });

  const response = await handleChatMessage({
    message: "Qué bloques IPv6 tiene UY-LACN-LACNIC?",
    locale: "es"
  });

  assert.equal(response.status, "COMPLETED");
  assert.deepEqual(response.data, {
    asNumbers: [],
    ipRanges: [{ start_address: "2801:13c:1000::", prefixLength: 48 }]
  });
});

test("filtra recursos de organización para mostrar solo ASN", async () => {
  (registroApiClient as any).get = async () => ({
    data: {
      asNumbers: [{ asn: 28001 }, { asn: 28002 }],
      ipRanges: [{ start_address: "200.3.12.0", prefixLength: 24 }]
    }
  });

  const response = await handleChatMessage({
    message: "Qué ASN tiene la organización UY-LACN-LACNIC?",
    locale: "es"
  });

  assert.equal(response.status, "COMPLETED");
  assert.deepEqual(response.data, {
    asNumbers: [{ asn: 28001 }, { asn: 28002 }],
    ipRanges: []
  });
});

test("filtra recursos de organización para mostrar solo bloques IP", async () => {
  (registroApiClient as any).get = async () => ({
    data: {
      asNumbers: [{ asn: 28001 }],
      ipRanges: [
        { start_address: "200.3.12.0", prefixLength: 24 },
        { start_address: "2801:13c:1000::", prefixLength: 48 }
      ]
    }
  });

  const response = await handleChatMessage({
    message: "Qué bloques tiene la organización UY-LACN-LACNIC?",
    locale: "es"
  });

  assert.equal(response.status, "COMPLETED");
  assert.deepEqual(response.data, {
    asNumbers: [],
    ipRanges: [
      { start_address: "200.3.12.0", prefixLength: 24 },
      { start_address: "2801:13c:1000::", prefixLength: 48 }
    ]
  });
});

test("diagnostica subasignaciones IPv4 sin ejecutar escrituras", async () => {
  const calls: RegistroGetCall[] = [];

  (registroApiClient as any).get = async (url: string, config: any) => {
    calls.push({ url, config });

    if (url === "/entity/resources/UY-LACN-LACNIC") {
      return {
        data: {
          ipRanges: [
            { start_address: "200.3.12.0", prefixLength: 24 },
            { start_address: "2801:13c:1000::", prefixLength: 48 }
          ]
        }
      };
    }

    if (url === "/ips/200.3.12.0/24") {
      return {
        data: {
          ipnetwork_child: []
        }
      };
    }

    if (url === "/ips/2801%3A13c%3A1000%3A%3A/48") {
      return {
        data: {
          ipnetwork_child: [{ prefix: "2801:13c:1000::/56" }]
        }
      };
    }

    return { data: {} };
  };

  const response = await handleChatMessage({
    message: "Mostrame recursos IPv4 sin subasignaciones de UY-LACN-LACNIC",
    locale: "es"
  });

  assert.equal(response.status, "COMPLETED");
  assert.deepEqual(
    calls.map((call) => call.url),
    ["/entity/resources/UY-LACN-LACNIC", "/ips/200.3.12.0/24"]
  );
  assert.deepEqual(response.data, {
    orgId: "UY-LACN-LACNIC",
    resourceType: "ipv4",
    view: "without_subassignments",
    resources: [{ cidr: "200.3.12.0/24", subassignments: [] }],
    summary: {
      totalResourcesChecked: 1,
      resourcesWithSubassignments: 0,
      resourcesWithoutSubassignments: 1,
      totalSubassignments: 0
    }
  });
});

test("usa el recurso previo para consultar subasignaciones", async () => {
  const calls: RegistroGetCall[] = [];

  (registroApiClient as any).get = async (url: string, config: any) => {
    calls.push({ url, config });

    if (url === "/ips/200.3.12.0/24") {
      return {
        data: {
          address: "200.3.12.0",
          prefixLength: 24,
          ipnetwork_child: [
            {
              ipnetwork_range: {
                start_address: "200.3.12.128",
                end_address: "200.3.12.255",
                prefixLength: 25,
                version: "v4"
              }
            }
          ]
        }
      };
    }

    if (url === "/ips/200.3.12.128/25") {
      return {
        data: {
          orgId: "UY-CLIENTE-LACNIC",
          allocationType: "assignment",
          asn: 0,
          ipnetwork_parent: {
            ipnetwork_range: {
              start_address: "200.3.12.0",
              prefixLength: 24
            }
          }
        }
      };
    }

    return { data: {} };
  };

  const firstResponse = await handleChatMessage({
    message: "Necesito el detalle de 200.3.12.0/24",
    locale: "es"
  });

  const secondResponse = await handleChatMessage({
    conversationId: firstResponse.conversationId,
    message: "y sus subasignaciones?",
    locale: "es"
  });

  assert.equal(firstResponse.status, "COMPLETED");
  assert.equal(secondResponse.status, "COMPLETED");
  assert.deepEqual(
    calls.map((call) => call.url),
    [
      "/ips/200.3.12.0/24",
      "/ips/200.3.12.0/24",
      "/ips/200.3.12.128/25"
    ]
  );
  assert.deepEqual(secondResponse.data, [
    {
      ipnetwork_range: {
        start_address: "200.3.12.128",
        end_address: "200.3.12.255",
        prefixLength: 25,
        version: "v4"
      },
      cidr: "200.3.12.128/25",
      assignedOrgId: "UY-CLIENTE-LACNIC",
      allocationType: "assignment",
      asn: 0,
      detail: {
        abuseContact: undefined,
        techContact: undefined,
        ipnetwork_parent: {
          ipnetwork_range: {
            start_address: "200.3.12.0",
            prefixLength: 24
          }
        }
      }
    }
  ]);
});

test("filtra contactos de organización por rol administrativo", async () => {
  const calls: RegistroGetCall[] = [];

  (registroApiClient as any).get = async (url: string, config: any) => {
    calls.push({ url, config });

    if (url === "/entity/organizations/UY-LACN-LACNIC") {
      return {
        data: {
          admin_contact: "ADM123",
          cob_contact: "COB123",
          mem_contact: "MEM123"
        }
      };
    }

    if (url === "/entity/users/ADM123") {
      return {
        data: {
          id: "ADM123",
          name: "Admin Contact"
        }
      };
    }

    return { data: {} };
  };

  const response = await handleChatMessage({
    message: "Mostrame el contacto administrativo de UY-LACN-LACNIC",
    locale: "es"
  });

  assert.equal(response.status, "COMPLETED");
  assert.deepEqual(
    calls.map((call) => call.url),
    ["/entity/organizations/UY-LACN-LACNIC", "/entity/users/ADM123"]
  );
  assert.deepEqual(response.data, {
    orgId: "UY-LACN-LACNIC",
    role: "admin",
    contacts: {
      admin: {
        id: "ADM123",
        name: "Admin Contact"
      },
      billing: undefined,
      membership: undefined
    }
  });
});

test("filtra Geofeeds por IPv6 sin cambiar la llamada a Registro", async () => {
  const calls: RegistroGetCall[] = [];

  (registroApiClient as any).get = async (url: string, config: any) => {
    calls.push({ url, config });

    return {
      data: [
        { ip: "200.3.12.0/24", country: "UY" },
        { cidr: "2801:13c:1000::/48", country: "UY" }
      ]
    };
  };

  const response = await handleChatMessage({
    message: "Mostrame Geofeeds IPv6 de UY-LACN-LACNIC",
    locale: "es"
  });

  assert.equal(response.status, "COMPLETED");
  assert.deepEqual(calls.map((call) => call.url), ["/geofeeds"]);
  assert.deepEqual(response.data, [
    { cidr: "2801:13c:1000::/48", country: "UY" }
  ]);
});

test("filtra objetos IRR por ASN localmente", async () => {
  const calls: RegistroGetCall[] = [];

  (registroApiClient as any).get = async (url: string, config: any) => {
    calls.push({ url, config });

    return {
      data: [
        { name: "AS-LACNIC", members: ["AS28001", "AS28002"] },
        { name: "AS-OTHER", members: ["AS65000"] }
      ]
    };
  };

  const response = await handleChatMessage({
    message: "Mostrame AS-SET de AS28001 en IRR",
    locale: "es"
  });

  assert.equal(response.status, "COMPLETED");
  assert.deepEqual(calls.map((call) => call.url), ["/irr/assets"]);
  assert.deepEqual(response.data, [
    { name: "AS-LACNIC", members: ["AS28001", "AS28002"] }
  ]);
});

test("interpreta cuotas de API como rate limits", async () => {
  const calls: RegistroGetCall[] = [];

  (registroApiClient as any).get = async (url: string, config: any) => {
    calls.push({ url, config });

    return {
      data: {
        remaining: 100,
        limit: 120
      }
    };
  };

  const response = await handleChatMessage({
    message: "Mostrame las cuotas de API disponibles",
    locale: "es"
  });

  assert.equal(response.status, "COMPLETED");
  assert.deepEqual(calls.map((call) => call.url), ["/ratelimits"]);
});

test("error 404 de Registro se transforma en respuesta controlada", async () => {
  (registroApiClient as any).get = async () => {
    throw {
      isAxiosError: true,
      message: "not found",
      response: {
        status: 404
      }
    };
  };

  const response = await handleChatMessage({
    message: "Mostrame información de la organización UY-NOEXISTE-LACNIC",
    locale: "es"
  });

  assert.equal(response.status, "ERROR");
  assert.equal(response.message, "No encontré esa información en la API de Registro.");
  assert.deepEqual(response.data, {
    source: "registro-api",
    statusCode: 404
  });
});

test("acciones de escritura quedan bloqueadas antes de llamar a Registro", async () => {
  let registroWasCalled = false;

  (registroApiClient as any).get = async () => {
    registroWasCalled = true;
    return { data: {} };
  };

  const response = await handleChatMessage({
    message: "Crear una subasignación para UY-LACN-LACNIC",
    locale: "es"
  });

  assert.equal(response.status, "ACTION_BLOCKED");
  assert.equal(registroWasCalled, false);
});

test("acciones de actualización quedan bloqueadas antes de llamar a Registro", async () => {
  let registroWasCalled = false;

  (registroApiClient as any).get = async () => {
    registroWasCalled = true;
    return { data: {} };
  };

  const response = await handleChatMessage({
    message: "Actualizar el ROA del ASN 28001 para 200.3.12.0/24",
    locale: "es"
  });

  assert.equal(response.status, "ACTION_BLOCKED");
  assert.equal(registroWasCalled, false);
});

test("usa contexto conversacional para consultar ROAs de la organización previa", async () => {
  const calls: RegistroGetCall[] = [];

  (registroApiClient as any).get = async (url: string, config: any) => {
    calls.push({ url, config });

    if (url === "/entity/resources/UY-LACN-LACNIC") {
      return {
        data: {
          asNumbers: [{ asn: 28000 }],
          ipRanges: [{ start_address: "200.3.12.0", prefixLength: 24 }]
        }
      };
    }

    if (url === "/rpki/roas/UY-LACN-LACNIC") {
      return {
        data: []
      };
    }

    return { data: {} };
  };

  const firstResponse = await handleChatMessage({
    message: "Mostrame los recursos de la organización UY-LACN-LACNIC",
    locale: "es"
  });

  const secondResponse = await handleChatMessage({
    conversationId: firstResponse.conversationId,
    message: "y los ROAs?",
    locale: "es"
  });

  assert.equal(firstResponse.status, "COMPLETED");
  assert.equal(secondResponse.status, "COMPLETED");
  assert.deepEqual(
    calls.map((call) => call.url),
    ["/entity/resources/UY-LACN-LACNIC", "/rpki/roas/UY-LACN-LACNIC"]
  );
});

test("filtra ROAs por ASN sin cambiar la llamada a Registro", async () => {
  const calls: RegistroGetCall[] = [];

  (registroApiClient as any).get = async (url: string, config: any) => {
    calls.push({ url, config });

    if (url === "/entity/resources/UY-LACN-LACNIC") {
      return {
        data: {
          asNumbers: [{ asn: 28001 }],
          ipRanges: [{ start_address: "200.3.12.0", prefixLength: 24 }]
        }
      };
    }

    if (url === "/rpki/roas/UY-LACN-LACNIC") {
      return {
        data: [
          { prefix: "200.3.12.0/24", asn: 28000 },
          { prefix: "200.3.13.0/24", asn: "AS28001" },
          { prefix: "200.3.14.0/24", originAsn: 28001 }
        ]
      };
    }

    return { data: {} };
  };

  const firstResponse = await handleChatMessage({
    message: "Mostrame los recursos de la organización UY-LACN-LACNIC",
    locale: "es"
  });

  const secondResponse = await handleChatMessage({
    conversationId: firstResponse.conversationId,
    message: "mostrame los ROA que solo involucren el ASN 28001",
    locale: "es"
  });

  assert.equal(secondResponse.status, "COMPLETED");
  assert.equal(
    calls.filter((call) => call.url === "/rpki/roas/UY-LACN-LACNIC").length,
    1
  );
  assert.deepEqual(secondResponse.data, [
    { prefix: "200.3.13.0/24", asn: "AS28001" },
    { prefix: "200.3.14.0/24", originAsn: 28001 }
  ]);
});

test("filtra ROAs por prefix sin confundir el prefix con ASN", async () => {
  (registroApiClient as any).get = async (url: string) => {
    if (url === "/entity/resources/UY-LACN-LACNIC") {
      return {
        data: {
          ipRanges: [{ start_address: "200.3.13.0", prefixLength: 24 }]
        }
      };
    }

    if (url === "/rpki/roas/UY-LACN-LACNIC") {
      return {
        data: [
          { prefix: "200.3.12.0/24", asn: 28001 },
          { prefix: "200.3.13.0/24", asn: 28002 },
          { roaPrefix: "200.3.13.0/24", originAsn: 28003 }
        ]
      };
    }

    return { data: {} };
  };

  const firstResponse = await handleChatMessage({
    message: "Mostrame los recursos de la organización UY-LACN-LACNIC",
    locale: "es"
  });

  const secondResponse = await handleChatMessage({
    conversationId: firstResponse.conversationId,
    message: "mostrame los ROAs del prefijo 200.3.13.0/24",
    locale: "es"
  });

  assert.equal(secondResponse.status, "COMPLETED");
  assert.deepEqual(secondResponse.data, [
    { prefix: "200.3.13.0/24", asn: 28002 },
    { roaPrefix: "200.3.13.0/24", originAsn: 28003 }
  ]);
});

test("filtra ROAs por ASN y prefix combinados", async () => {
  (registroApiClient as any).get = async (url: string) => {
    if (url === "/entity/resources/UY-LACN-LACNIC") {
      return {
        data: {
          asNumbers: [{ asn: 28001 }],
          ipRanges: [{ start_address: "200.3.13.0", prefixLength: 24 }]
        }
      };
    }

    if (url === "/rpki/roas/UY-LACN-LACNIC") {
      return {
        data: [
          { prefix: "200.3.13.0/24", asn: 28000 },
          { prefix: "200.3.13.0/24", asn: "AS28001" },
          { prefix: "200.3.14.0/24", asn: "AS28001" }
        ]
      };
    }

    return { data: {} };
  };

  const firstResponse = await handleChatMessage({
    message: "Mostrame los recursos de la organización UY-LACN-LACNIC",
    locale: "es"
  });

  const secondResponse = await handleChatMessage({
    conversationId: firstResponse.conversationId,
    message: "mostrame los ROAs del ASN 28001 para 200.3.13.0/24",
    locale: "es"
  });

  assert.equal(secondResponse.status, "COMPLETED");
  assert.deepEqual(secondResponse.data, [
    { prefix: "200.3.13.0/24", asn: "AS28001" }
  ]);
});

test("pide aclaración si el usuario menciona otra organización sin OrgID", async () => {
  const calls: RegistroGetCall[] = [];

  (registroApiClient as any).get = async (url: string, config: any) => {
    calls.push({ url, config });

    return {
      data: {
        id: "UY-LACN-LACNIC"
      }
    };
  };

  const firstResponse = await handleChatMessage({
    message: "Mostrame información de la organización UY-LACN-LACNIC",
    locale: "es"
  });

  const secondResponse = await handleChatMessage({
    conversationId: firstResponse.conversationId,
    message: "y de otra organización?",
    locale: "es"
  });

  assert.equal(firstResponse.status, "COMPLETED");
  assert.equal(secondResponse.status, "NEEDS_CLARIFICATION");
  assert.equal(calls.length, 1);
});

test("el payload enviado al LLM no contiene tokens ni credenciales de Registro", async () => {
  process.env.LLM_BASE_URL = "http://localhost:11434/v1";
  process.env.LLM_MODEL = "qwen2.5:14b-instruct";
  process.env.LLM_API_KEY = "test-llm-key";
  process.env.REGISTRO_API_CLIENT_ID = "secret-client-id";
  process.env.REGISTRO_API_CLIENT_SECRET = "secret-client-secret";
  process.env.REGISTRO_API_ACCESS_TOKEN = "secret-registro-token";

  let llmBody: unknown;

  (axiosClient as any).post = async (_url: string, body: unknown) => {
    llmBody = body;

    return {
      data: {
        choices: [
          {
            message: {
              content:
                '{"intent":"get_organization_resources","entities":{"orgId":"UY-LACN-LACNIC"}}'
            }
          }
        ]
      }
    };
  };

  const result = await detectIntent(
    "Mostrame los recursos de la organización UY-LACN-LACNIC"
  );
  const serializedPayload = JSON.stringify(llmBody);

  assert.equal(result.intent, "get_organization_resources");
  assert.ok(!serializedPayload.includes("secret-client-id"));
  assert.ok(!serializedPayload.includes("secret-client-secret"));
  assert.ok(!serializedPayload.includes("secret-registro-token"));
});

test("no existen operaciones de escritura hacia Registro API salvo OAuth", () => {
  const adapterDir = path.join(process.cwd(), "src", "adapters", "registroApiV3");
  const files = fs
    .readdirSync(adapterDir)
    .filter((file) => file.endsWith(".ts") && file !== "auth.ts")
    .map((file) => path.join(adapterDir, file));

  const forbiddenCalls = /\b(?:registroApiClient|axios)\.(?:post|put|patch|delete)\s*\(/;
  const offenders = files.filter((file) => forbiddenCalls.test(fs.readFileSync(file, "utf8")));

  assert.deepEqual(offenders, []);
});
