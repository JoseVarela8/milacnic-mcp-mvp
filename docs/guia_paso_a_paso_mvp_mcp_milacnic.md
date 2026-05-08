# Guía Paso a Paso — Inicio del MVP Standalone del Servidor MCP para MiLACNIC

## Objetivo del MVP

Construir un prototipo standalone con la siguiente arquitectura:

```text
Chat prototipo
  -> Servidor MCP / Orquestador
  -> LLM local
  -> API Registro v3 solo lectura
  -> Respuesta al usuario
```

El MVP inicial no incluye:

```text
Integración con MiLACNIC
Sesión MiLACNIC
Logger MiLACNIC
Escritura en Registro
Alta de subasignaciones
```

---

# Hito 0 — Crear el repositorio

## Paso 0.1 — Crear proyecto

```bash
mkdir mcp-milacnic
cd mcp-milacnic
npm init -y
```

---

## Paso 0.2 — Instalar dependencias

```bash
npm install express cors dotenv zod axios
npm install -D typescript ts-node-dev @types/node @types/express @types/cors
```

---

## Paso 0.3 — Crear estructura inicial

```bash
mkdir -p src/routes
mkdir -p src/orchestrator
mkdir -p src/llm
mkdir -p src/tools/organizations
mkdir -p src/tools/resources
mkdir -p src/tools/subassignments
mkdir -p src/adapters/registroApiV3
mkdir -p src/logger
mkdir -p src/types
mkdir -p src/errors
mkdir -p docs
```

Guardar el documento de planificación en:

```text
docs/plan_mcp_milacnic_mvp_standalone.md
```

---

# Hito 1 — Servidor Node.js / TypeScript

## Paso 1.1 — Crear `tsconfig.json`

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "commonjs",
    "rootDir": "src",
    "outDir": "dist",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true
  }
}
```

---

## Paso 1.2 — Agregar scripts en `package.json`

En `package.json`, agregar o reemplazar la sección `scripts`:

```json
{
  "scripts": {
    "dev": "ts-node-dev --respawn --transpile-only src/server.ts",
    "build": "tsc",
    "start": "node dist/server.js"
  }
}
```

---

## Paso 1.3 — Crear `.env.example`

```env
NODE_ENV=development
PORT=3000

REGISTRO_API_BASE_URL=
REGISTRO_API_ACCESS_TOKEN=

LLM_BASE_URL=
LLM_MODEL=
```

---

## Paso 1.4 — Crear servidor base

Crear `src/app.ts`:

```ts
import express from "express";
import cors from "cors";
import { healthRouter } from "./routes/health.routes";

export const app = express();

app.use(cors());
app.use(express.json());

app.use("/health", healthRouter);
```

Crear `src/server.ts`:

```ts
import dotenv from "dotenv";
dotenv.config();

import { app } from "./app";

const port = process.env.PORT || 3000;

app.listen(port, () => {
  console.log(`MCP MiLACNIC MVP running on port ${port}`);
});
```

Crear `src/routes/health.routes.ts`:

```ts
import { Router } from "express";

export const healthRouter = Router();

healthRouter.get("/", (_req, res) => {
  res.json({
    status: "ok",
    service: "mcp-milacnic-mvp"
  });
});
```

---

## Paso 1.5 — Probar healthcheck

Ejecutar:

```bash
npm run dev
```

Abrir:

```text
http://localhost:3000/health
```

Resultado esperado:

```json
{
  "status": "ok",
  "service": "mcp-milacnic-mvp"
}
```

---

# Hito 2 — Endpoint de chat

## Paso 2.1 — Crear tipos

Crear `src/types/chat.ts`:

```ts
export type ChatStatus =
  | "COMPLETED"
  | "ACTION_BLOCKED"
  | "NEEDS_CLARIFICATION"
  | "ERROR";

export interface ChatRequest {
  conversationId?: string;
  message: string;
  locale?: string;
}

export interface ChatResponse {
  conversationId: string;
  status: ChatStatus;
  message: string;
  data?: unknown;
}
```

---

## Paso 2.2 — Crear orquestador inicial

Crear `src/orchestrator/chatOrchestrator.ts`:

```ts
import crypto from "crypto";
import { ChatRequest, ChatResponse } from "../types/chat";

export async function handleChatMessage(
  request: ChatRequest
): Promise<ChatResponse> {
  const conversationId = request.conversationId || crypto.randomUUID();

  return {
    conversationId,
    status: "COMPLETED",
    message: `Recibí tu consulta: "${request.message}"`
  };
}
```

---

## Paso 2.3 — Crear ruta de chat

Crear `src/routes/chat.routes.ts`:

```ts
import { Router } from "express";
import { handleChatMessage } from "../orchestrator/chatOrchestrator";

export const chatRouter = Router();

chatRouter.post("/message", async (req, res) => {
  try {
    if (!req.body.message) {
      return res.status(400).json({
        status: "ERROR",
        message: "El mensaje es obligatorio."
      });
    }

    const response = await handleChatMessage(req.body);
    return res.json(response);
  } catch (error) {
    console.error(error);

    return res.status(500).json({
      status: "ERROR",
      message: "Ocurrió un error procesando el mensaje."
    });
  }
});
```

Modificar `src/app.ts` para importar y usar la ruta de chat:

```ts
import express from "express";
import cors from "cors";
import { healthRouter } from "./routes/health.routes";
import { chatRouter } from "./routes/chat.routes";

export const app = express();

app.use(cors());
app.use(express.json());

app.use("/health", healthRouter);
app.use("/mcp/chat", chatRouter);
```

---

## Paso 2.4 — Probar endpoint

```bash
curl -X POST http://localhost:3000/mcp/chat/message \
  -H "Content-Type: application/json" \
  -d '{
    "message": "Mostrame los recursos de la organización UY-TEST-LACNIC",
    "locale": "es"
  }'
```

Resultado esperado:

```json
{
  "conversationId": "...",
  "status": "COMPLETED",
  "message": "Recibí tu consulta: \"Mostrame los recursos de la organización UY-TEST-LACNIC\""
}
```

---

# Hito 3 — Detector de intención

Primero se implementa un detector simple, sin LLM real. Esto permite validar el flujo completo antes de integrar el modelo local.

## Paso 3.1 — Crear detector

Crear `src/llm/llmClient.ts`:

```ts
export type IntentName =
  | "get_organization"
  | "get_organization_resources"
  | "get_subassignments"
  | "unsupported_write_action"
  | "unknown";

export interface LlmIntentResult {
  intent: IntentName;
  entities: {
    orgId?: string;
    resource?: string;
  };
}

export async function detectIntent(message: string): Promise<LlmIntentResult> {
  const lower = message.toLowerCase();

  const orgIdMatch = message.match(/[A-Z]{2}-[A-Z0-9]+-LACNIC/i);

  if (
    lower.includes("registr") ||
    lower.includes("crear") ||
    lower.includes("modificar") ||
    lower.includes("eliminar") ||
    lower.includes("borrar")
  ) {
    return {
      intent: "unsupported_write_action",
      entities: {
        orgId: orgIdMatch?.[0]
      }
    };
  }

  if (lower.includes("recurso") || lower.includes("bloque")) {
    return {
      intent: "get_organization_resources",
      entities: {
        orgId: orgIdMatch?.[0]
      }
    };
  }

  if (lower.includes("subasign")) {
    return {
      intent: "get_subassignments",
      entities: {
        orgId: orgIdMatch?.[0]
      }
    };
  }

  if (lower.includes("organización") || lower.includes("organizacion")) {
    return {
      intent: "get_organization",
      entities: {
        orgId: orgIdMatch?.[0]
      }
    };
  }

  return {
    intent: "unknown",
    entities: {}
  };
}
```

---

## Paso 3.2 — Conectar detector al orquestador

Modificar `src/orchestrator/chatOrchestrator.ts`:

```ts
import crypto from "crypto";
import { ChatRequest, ChatResponse } from "../types/chat";
import { detectIntent } from "../llm/llmClient";

export async function handleChatMessage(
  request: ChatRequest
): Promise<ChatResponse> {
  const conversationId = request.conversationId || crypto.randomUUID();

  const intent = await detectIntent(request.message);

  if (intent.intent === "unsupported_write_action") {
    return {
      conversationId,
      status: "ACTION_BLOCKED",
      message:
        "Esta acción todavía no está habilitada en el asistente. En esta primera versión solo puedo consultar información desde la API de Registro.",
      data: intent
    };
  }

  if (intent.intent === "unknown") {
    return {
      conversationId,
      status: "NEEDS_CLARIFICATION",
      message:
        "No pude identificar claramente la consulta. Probá indicando una organización, un recurso o una subasignación.",
      data: intent
    };
  }

  return {
    conversationId,
    status: "COMPLETED",
    message: `Intención detectada: ${intent.intent}`,
    data: intent
  };
}
```

---

## Paso 3.3 — Probar bloqueo de escritura

```bash
curl -X POST http://localhost:3000/mcp/chat/message \
  -H "Content-Type: application/json" \
  -d '{
    "message": "Registrá una subasignación para 200.3.12.0/24"
  }'
```

Resultado esperado:

```json
{
  "status": "ACTION_BLOCKED",
  "message": "Esta acción todavía no está habilitada en el asistente. En esta primera versión solo puedo consultar información desde la API de Registro."
}
```

---

# Hito 4 — Adapter API Registro v3 solo lectura

## Paso 4.1 — Crear cliente HTTP

Crear `src/adapters/registroApiV3/registroApiClient.ts`:

```ts
import axios from "axios";

export const registroApiClient = axios.create({
  baseURL: process.env.REGISTRO_API_BASE_URL,
  timeout: 15000
});
```

---

## Paso 4.2 — Crear auth simple

Crear `src/adapters/registroApiV3/auth.ts`:

```ts
export async function getRegistroApiAccessToken(): Promise<string> {
  const token = process.env.REGISTRO_API_ACCESS_TOKEN;

  if (!token) {
    throw new Error("REGISTRO_API_ACCESS_TOKEN is not configured");
  }

  return token;
}
```

---

## Paso 4.3 — Crear API de organizaciones

Crear `src/adapters/registroApiV3/organizationsApi.ts`:

```ts
import { registroApiClient } from "./registroApiClient";
import { getRegistroApiAccessToken } from "./auth";

export async function getOrganization(orgId: string) {
  const token = await getRegistroApiAccessToken();

  const response = await registroApiClient.get(`/organizations/${orgId}`, {
    headers: {
      Authorization: `Bearer ${token}`
    }
  });

  return response.data;
}
```

---

## Paso 4.4 — Crear API de recursos

Crear `src/adapters/registroApiV3/resourcesApi.ts`:

```ts
import { registroApiClient } from "./registroApiClient";
import { getRegistroApiAccessToken } from "./auth";

export async function getOrganizationResources(orgId: string) {
  const token = await getRegistroApiAccessToken();

  const response = await registroApiClient.get(
    `/organizations/${orgId}/resources`,
    {
      headers: {
        Authorization: `Bearer ${token}`
      }
    }
  );

  return response.data;
}
```

> Nota: los endpoints `/organizations/${orgId}` y `/organizations/${orgId}/resources` son placeholders. Deben ajustarse al path real de la API Registro v3.

---

# Hito 5 — Tools de lectura

## Paso 5.1 — Tool organización

Crear `src/tools/organizations/getOrganizationTool.ts`:

```ts
import { getOrganization } from "../../adapters/registroApiV3/organizationsApi";

export async function getOrganizationTool(orgId: string) {
  return getOrganization(orgId);
}
```

---

## Paso 5.2 — Tool recursos

Crear `src/tools/resources/getOrganizationResourcesTool.ts`:

```ts
import { getOrganizationResources } from "../../adapters/registroApiV3/resourcesApi";

export async function getOrganizationResourcesTool(orgId: string) {
  return getOrganizationResources(orgId);
}
```

---

## Paso 5.3 — Conectar tools al orquestador

Modificar `src/orchestrator/chatOrchestrator.ts`:

```ts
import crypto from "crypto";
import { ChatRequest, ChatResponse } from "../types/chat";
import { detectIntent } from "../llm/llmClient";
import { getOrganizationTool } from "../tools/organizations/getOrganizationTool";
import { getOrganizationResourcesTool } from "../tools/resources/getOrganizationResourcesTool";

export async function handleChatMessage(
  request: ChatRequest
): Promise<ChatResponse> {
  const conversationId = request.conversationId || crypto.randomUUID();

  const intent = await detectIntent(request.message);

  if (intent.intent === "unsupported_write_action") {
    return {
      conversationId,
      status: "ACTION_BLOCKED",
      message:
        "Esta acción todavía no está habilitada en el asistente. En esta primera versión solo puedo consultar información desde la API de Registro.",
      data: intent
    };
  }

  if (intent.intent === "unknown") {
    return {
      conversationId,
      status: "NEEDS_CLARIFICATION",
      message:
        "No pude identificar claramente la consulta. Probá indicando una organización, un recurso o una subasignación.",
      data: intent
    };
  }

  if (intent.intent === "get_organization") {
    const orgId = intent.entities.orgId;

    if (!orgId) {
      return {
        conversationId,
        status: "NEEDS_CLARIFICATION",
        message: "Necesito que indiques el OrgID de la organización."
      };
    }

    const organization = await getOrganizationTool(orgId);

    return {
      conversationId,
      status: "COMPLETED",
      message: "Encontré la información de la organización.",
      data: organization
    };
  }

  if (intent.intent === "get_organization_resources") {
    const orgId = intent.entities.orgId;

    if (!orgId) {
      return {
        conversationId,
        status: "NEEDS_CLARIFICATION",
        message: "Necesito que indiques el OrgID para consultar los recursos."
      };
    }

    const resources = await getOrganizationResourcesTool(orgId);

    return {
      conversationId,
      status: "COMPLETED",
      message: "Estos son los recursos asociados a la organización.",
      data: resources
    };
  }

  return {
    conversationId,
    status: "COMPLETED",
    message: `Intención detectada: ${intent.intent}`,
    data: intent
  };
}
```

---

# Hito 6 — Logger local

## Paso 6.1 — Crear logger

Crear `src/logger/localLogger.ts`:

```ts
export type LocalLogEvent =
  | "MCP_MESSAGE_RECEIVED"
  | "MCP_INTENT_DETECTED"
  | "MCP_READ_TOOL_SELECTED"
  | "MCP_API_READ_STARTED"
  | "MCP_API_READ_SUCCEEDED"
  | "MCP_API_READ_FAILED"
  | "MCP_RESPONSE_SENT"
  | "MCP_ACTION_BLOCKED";

export async function logEvent(event: LocalLogEvent, details?: unknown) {
  console.log(
    JSON.stringify(
      {
        timestamp: new Date().toISOString(),
        event,
        details
      },
      null,
      2
    )
  );
}
```

---

## Paso 6.2 — Usarlo en el orquestador

Importar en `chatOrchestrator.ts`:

```ts
import { logEvent } from "../logger/localLogger";
```

Al inicio de `handleChatMessage`:

```ts
await logEvent("MCP_MESSAGE_RECEIVED", {
  messageLength: request.message.length
});
```

Después de detectar intención:

```ts
await logEvent("MCP_INTENT_DETECTED", intent);
```

Cuando se bloquea una escritura:

```ts
await logEvent("MCP_ACTION_BLOCKED", intent);
```

---

# Hito 7 — Chat prototipo

## Paso 7.1 — Crear carpeta del prototipo

```bash
mkdir -p prototype-chat
```

---

## Paso 7.2 — Crear HTML simple

Crear `prototype-chat/index.html`:

```html
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8" />
  <title>MCP MiLACNIC MVP Chat</title>
  <style>
    body {
      font-family: Arial, sans-serif;
      max-width: 800px;
      margin: 40px auto;
    }

    #messages {
      border: 1px solid #ccc;
      padding: 16px;
      min-height: 300px;
      margin-bottom: 16px;
    }

    .user {
      font-weight: bold;
      margin-top: 12px;
    }

    .assistant {
      margin-bottom: 12px;
    }

    input {
      width: 75%;
      padding: 8px;
    }

    button {
      padding: 8px 16px;
    }

    pre {
      background: #f5f5f5;
      padding: 8px;
      overflow-x: auto;
    }
  </style>
</head>
<body>
  <h1>MCP MiLACNIC MVP Chat</h1>

  <div id="messages"></div>

  <input id="messageInput" placeholder="Escribí tu consulta..." />
  <button onclick="sendMessage()">Enviar</button>

  <script>
    async function sendMessage() {
      const input = document.getElementById("messageInput");
      const messages = document.getElementById("messages");

      const text = input.value.trim();

      if (!text) return;

      messages.innerHTML += `<div class="user">Usuario:</div><div>${text}</div>`;

      input.value = "";

      const response = await fetch("http://localhost:3000/mcp/chat/message", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          message: text,
          locale: "es"
        })
      });

      const data = await response.json();

      messages.innerHTML += `
        <div class="user">Asistente:</div>
        <div class="assistant">${data.message}</div>
        <pre>${JSON.stringify(data.data || {}, null, 2)}</pre>
      `;
    }
  </script>
</body>
</html>
```

Abrir el archivo directamente en el navegador o servirlo con una extensión tipo Live Server.

---

# Hito 8 — Integrar LLM real

Cuando el flujo ya funcione con el detector simple, se reemplaza `detectIntent()` por una llamada real al LLM local.

La función debe seguir devolviendo este formato:

```ts
{
  intent: "get_organization_resources",
  entities: {
    orgId: "UY-TEST-LACNIC"
  }
}
```

Esto permite cambiar el motor de intención sin modificar el resto del sistema.

---

## Paso 8.1 — Prompt base sugerido

```text
Sos un extractor de intención para el asistente de MiLACNIC.

Tu tarea es:
1. Identificar si el usuario quiere consultar información de organizaciones, recursos o subasignaciones.
2. Extraer los campos relevantes para la consulta.
3. Detectar si pide una acción fuera del alcance del MVP inicial.

No ejecutes acciones.
No inventes datos.
No asumas permisos.
No afirmes que una operación fue completada.

Respondé únicamente en JSON válido siguiendo este schema:

{
  "intent": "get_organization | get_organization_resources | get_subassignments | unsupported_write_action | unknown",
  "entities": {
    "orgId": "string opcional",
    "resource": "string opcional"
  }
}
```

---

# Hito 9 — Pruebas obligatorias del MVP

## Casos mínimos

```text
1. Consulta de organización con OrgID.
2. Consulta de recursos con OrgID.
3. Consulta sin OrgID.
4. Pedido de escritura.
5. API Registro devuelve 401.
6. API Registro devuelve 404.
7. LLM/detector devuelve intención unknown.
8. Verificar que no exista ninguna llamada POST/PUT/PATCH/DELETE a API Registro.
```

---

## Checklist de seguridad MVP

```text
[ ] El MCP no ejecuta escritura.
[ ] Las tools activas son solo lectura.
[ ] No se envían tokens al LLM.
[ ] No se envían credenciales al LLM.
[ ] Las acciones de escritura se bloquean.
[ ] Los errores de API se controlan.
[ ] Los logs locales registran intención y resultado.
```

---

# Orden exacto recomendado

```text
1. Hito 0 — Crear repo y estructura.
2. Hito 1 — Servidor con healthcheck.
3. Hito 2 — Endpoint /mcp/chat/message.
4. Hito 3 — Detector de intención simple y bloqueo de escritura.
5. Hito 6 — Logger local.
6. Hito 4 — Adapter API Registro v3 solo lectura.
7. Hito 5 — Tools de lectura.
8. Hito 7 — Chat prototipo.
9. Hito 8 — LLM real.
10. Hito 9 — Pruebas.
```

---

# Cómo pedir ayuda durante el desarrollo

Cuando surja un problema, conviene referenciarlo con hito y paso.

Ejemplos:

```text
Estoy en el Hito 4, Paso 4.4. La consulta de recursos me devuelve 404.
```

```text
Estoy en el Hito 3, Paso 3.3. No me bloquea el pedido de registrar subasignación.
```

```text
Estoy en el Hito 1, Paso 1.5. El healthcheck no levanta.
```

```text
Estoy en el Hito 8. El LLM me devuelve JSON inválido.
```

De esa forma se puede ubicar rápidamente el contexto y corregir el problema sin repasar todo el proyecto.
