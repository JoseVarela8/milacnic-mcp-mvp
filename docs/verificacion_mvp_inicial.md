# Verificacion del MVP inicial standalone

Fuente de referencia: `docs/plan_mcp_milacnic_mvp_standalone.md`.

Fecha de verificacion: 2026-05-08.

## Resultado general

El MVP inicial standalone cumple con el alcance, hitos y criterios de aceptacion definidos para la etapa inicial.

El punto intermedio no forma parte de esta verificacion.

## Evidencia ejecutada

```bash
npm test
```

Resultado:

```text
tests 22
pass 22
fail 0
```

La suite ejecuta:

```bash
npm run build && node --test dist/**/*.test.js
```

## Matriz por alcance MVP

| Requisito | Estado | Evidencia |
|---|---|---|
| Chat prototipo standalone | Cumple | `prototype-chat/index.html` |
| LLM local/on-premise | Cumple | `src/llm/llmClient.ts`, `.env.example` con Ollama/Qwen |
| Microservicio Node.js/TypeScript | Cumple | `src/server.ts`, `src/app.ts`, `tsconfig.json` |
| Comunicacion Chat -> MCP por HTTP REST | Cumple | `POST /mcp/chat/message`, `prototype-chat/index.html` |
| Comunicacion MCP -> API Registro v3 | Cumple | `src/adapters/registroApiV3/*` |
| Operaciones sobre Registro solo lectura | Cumple | Tests y revision estatica sin `POST/PUT/PATCH/DELETE` salvo OAuth |
| Escritura no habilitada | Cumple | `unsupported_write_action`, estado `ACTION_BLOCKED` |
| Integracion con MiLACNIC no incluida | Cumple | MVP standalone sin sesion real ni logger real |
| Sesion MiLACNIC no incluida | Cumple | `ChatRequest` no requiere sesion |
| Logger MiLACNIC no incluido | Cumple | `src/logger/localLogger.ts` |
| RAG/documentacion no incluido | Cumple | No hay flujo RAG activo |
| Idioma espanol | Cumple | Prompt, mensajes y prototipo en espanol |

## Matriz por hitos

| Hito | Estado | Evidencia |
|---|---|---|
| Hito 0 - Relevamiento tecnico base | Cumple | `docs/hito0_relevamiento_tecnico_base.md` |
| Hito 1 - Base del microservicio | Cumple | `src/server.ts`, `src/app.ts`, `GET /health`, `npm run build` |
| Hito 2 - API REST del MCP | Cumple | `src/routes/chat.routes.ts`, `src/types/chat.ts` |
| Hito 3 - Chat prototipo | Cumple | `prototype-chat/index.html` |
| Hito 4 - Adaptador LLM local | Cumple | `src/llm/llmClient.ts`, `LLM_*` en `.env.example` |
| Hito 5 - Adapter API Registro v3 solo lectura | Cumple | `src/adapters/registroApiV3/*` |
| Hito 6 - Tools de lectura | Cumple | `src/tools/*` |
| Hito 7 - Orquestacion conversacional de lectura | Cumple | `src/orchestrator/chatOrchestrator.ts` |
| Hito 8 - Seguridad y pruebas del MVP inicial | Cumple | `src/security.test.ts`, `docs/hito8_seguridad_pruebas_mvp_inicial.md` |

## Mejoras conversacionales

El MVP incluye memoria conversacional en memoria por `conversationId`.

- El prototipo conserva el `conversationId` entre mensajes.
- El MCP reutiliza OrgID o recurso previo para follow-ups cuando corresponde.
- El MCP filtra ROAs por ASN, prefix o combinación ASN + prefix localmente cuando el usuario lo pide.
- El MCP filtra recursos por IPv4, IPv6, ASN o bloques IP localmente cuando el usuario lo pide.
- El MCP consulta y diagnostica subasignaciones por organización o recurso en modo solo lectura.
- El MCP puede enriquecer bloques subasignados consultando el detalle del hijo para obtener la organización asignada.
- El MCP filtra contactos por rol, Geofeeds por familia IP/recurso e IRR por ASN/AS-SET en modo solo lectura.
- El MCP interpreta rate limits, limites, cuotas y cupos como diagnostico de consumo de API.
- El MCP bloquea mas verbos de escritura como actualizar, cambiar, publicar, activar, desactivar, revocar, delegar, transferir y configurar.
- El MCP pide aclaracion si el usuario solicita otra organizacion u otro recurso sin dar identificador.
- La documentacion especifica esta capa en `docs/mejoras_conversacionales.md`.

## Criterios funcionales

| Criterio | Estado | Evidencia |
|---|---|---|
| Un usuario puede interactuar con un chat prototipo | Cumple | `prototype-chat/index.html` |
| El chat envia mensajes al MCP por HTTP REST | Cumple | `fetch("http://localhost:3000/mcp/chat/message")` |
| El MCP utiliza un LLM local para interpretar consultas en espanol | Cumple | Qwen 2.5 14B via Ollama, `llmClient` |
| El MCP identifica intenciones de lectura | Cumple | `detectIntent`, tests de OrgID y recurso |
| El MCP consulta informacion en API Registro v3 | Cumple | adapters Registro v3 y prueba end-to-end previa contra ambiente demo |
| El MCP devuelve respuestas entendibles al usuario | Cumple | mensajes controlados en `chatOrchestrator` |
| El MCP bloquea cualquier intento de escritura | Cumple | test `acciones de escritura quedan bloqueadas` |
| El MCP informa claramente cuando una accion no esta habilitada | Cumple | mensaje requerido del plan implementado |
| El MCP registra eventos en consola o logger local | Cumple | `localLogger`, eventos `MCP_*` |

## Criterios tecnicos

| Criterio | Estado | Evidencia |
|---|---|---|
| El microservicio corre localmente | Cumple | scripts `dev`, `build`, `start` |
| La integracion HTTP REST funciona | Cumple | rutas Express y prototipo |
| El LLM local esta integrado | Cumple | endpoint OpenAI-compatible local |
| El adapter API v3 funciona en modo lectura | Cumple | solo metodos `get` en adapters, salvo OAuth |
| Los errores son controlados | Cumple | `RegistroApiError`, test 404 |
| No se envian credenciales ni tokens al LLM | Cumple | test de payload LLM |
| No existe flujo activo que ejecute escritura | Cumple | test estatico sobre adapters |

## Criterios de seguridad

| Criterio | Estado | Evidencia |
|---|---|---|
| El MCP no ejecuta acciones de escritura | Cumple | no hay tools de escritura activas |
| Toda accion fuera de alcance queda bloqueada | Cumple | `ACTION_BLOCKED` |
| Credenciales tecnicas no se exponen al usuario ni al LLM | Cumple | `.env` ignorado, `.env.example` sin secretos, test LLM |
| Datos enviados al LLM estan sanitizados | Cumple | solo mensaje del usuario y prompt de extraccion |
| Toda consulta queda registrada localmente | Cumple | eventos `MCP_MESSAGE_RECEIVED`, `MCP_RESPONSE_SENT`, etc. |

## Documentacion de escritura futura

La seccion 23 del plan queda cubierta por:

- `docs/write-enable-subassignments.md`
- `docs/relevamiento_subasignaciones_api_registro.md`
- `docs/write-enable-organizations.md`
- `docs/write-enable-rpki.md`
- `docs/write-enable-reverse-dns.md`
- `docs/write-enable-irr.md`
- `docs/write-enable-subassignment-update-delete.md`

Estos documentos son preparatorios y no habilitan escritura en el MVP inicial.

## Observaciones

- La integracion real con MiLACNIC, sesion real, logger institucional y validaciones reales de roles pertenecen al punto intermedio, no al MVP inicial.
- Las pruebas automatizadas no dependen de credenciales reales ni de la API externa; usan mocks para ser reproducibles.
- Ya se probo previamente el flujo con Qwen local y API Registro demo. Para una entrega formal, conviene ejecutar una prueba manual final desde `prototype-chat/index.html`.
