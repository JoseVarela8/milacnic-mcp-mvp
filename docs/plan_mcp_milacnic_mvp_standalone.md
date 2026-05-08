# Plan de Implementación — Servidor MCP para MiLACNIC

## 1. Resumen ejecutivo

Este documento define el plan de relevamiento, arquitectura e implementación de un servidor MCP para MiLACNIC.

El objetivo final del proyecto es construir un microservicio interno que permita incorporar un asistente conversacional dentro de MiLACNIC, capaz de asistir a los usuarios en consultas y operaciones vinculadas a sus organizaciones y recursos de Internet.

Sin embargo, el **MVP inicial excluye la integración con MiLACNIC**. Esto significa que la primera versión será un prototipo standalone orientado a validar la arquitectura base:

```text
Chat prototipo
  -> Servidor MCP / Orquestador
  -> LLM local/on-premise
  -> API de Registro de LACNIC v3 en modo lectura
```

La implementación se organizará en tres niveles evolutivos:

1. **MVP inicial standalone**
   - Chat prototipo, fuera de MiLACNIC.
   - Configuración de un LLM local/on-premise.
   - Configuración del servidor MCP/orquestador.
   - Comunicación con la API de Registro de LACNIC v3.
   - Lectura de información únicamente.
   - Sin integración con MiLACNIC.
   - Sin sesión MiLACNIC.
   - Sin logger MiLACNIC.
   - Sin escritura sobre Registro.

2. **Punto intermedio**
   - Integra el asistente con MiLACNIC.
   - Usa sesión/contexto de usuario de MiLACNIC.
   - Envía eventos al sistema de logs de MiLACNIC.
   - Mantiene capacidades de lectura.
   - Agrega validaciones y flujo conversacional para subasignaciones.
   - Habilita escritura únicamente para registrar nuevas subasignaciones.
   - No permite modificar ni eliminar subasignaciones.
   - No permite escritura en RPKI, DNS reverso, IRR ni datos de organización.

3. **Versión final objetivo**
   - Amplía capacidades de consulta, análisis, preparación y eventual escritura controlada para:
     - Organizaciones y recursos.
     - RPKI / ROAs.
     - DNS reverso.
     - IRR / route objects.
     - Subasignaciones.
   - Incorpora confirmaciones, permisos, auditoría y controles de riesgo más avanzados.
   - Queda integrada dentro del portal MiLACNIC.

El proyecto se plantea como una iniciativa independiente, sin plazo fijo, por lo que la planificación se organiza por hitos funcionales y técnicos en lugar de fechas rígidas.

---

## 2. Objetivo del proyecto

### 2.1 Objetivo final

Implementar un servidor MCP para MiLACNIC que funcione como una capa de orquestación entre:

- El usuario autenticado en MiLACNIC.
- Un chat o asistente integrado al portal.
- Un LLM on-premise.
- Herramientas internas del MCP.
- La API de Registro de LACNIC/MiLACNIC v3.
- El sistema de logs de MiLACNIC.

### 2.2 Objetivo del MVP inicial

Construir un prototipo standalone que permita validar:

- Chat básico.
- Servidor MCP/orquestador en Node.js/TypeScript.
- Integración con LLM local.
- Detección de intención de consulta.
- Comunicación con API de Registro v3 en modo solo lectura.
- Respuestas controladas al usuario.
- Bloqueo de cualquier operación de escritura.

El MVP inicial no dependerá de MiLACNIC ni requerirá integración con su sesión, frontend, backend o sistema de logs.

---

## 3. Alcance general

### 3.1 Alcance funcional objetivo

La versión final del proyecto contempla los siguientes dominios funcionales:

1. Consulta de organizaciones y recursos.
2. Gestión o diagnóstico de RPKI/ROAs.
3. DNS reverso.
4. IRR / route objects.
5. Subasignaciones.

### 3.2 Alcance del MVP inicial standalone

| Componente | Alcance MVP inicial |
|---|---|
| Chat | Prototipo standalone |
| LLM | LLM local/on-premise configurado para interpretar mensajes en español |
| Servidor MCP | Microservicio/orquestador Node.js/TypeScript |
| Comunicación Chat → MCP | HTTP REST local/interno |
| Comunicación MCP → API Registro | Integración con API de Registro v3 |
| Operaciones sobre Registro | Solo lectura |
| Escritura | No habilitada |
| Integración con MiLACNIC | No incluida |
| Sesión MiLACNIC | No incluida |
| Logger MiLACNIC | No incluido |
| RAG/documentación | No incluido |
| Idioma | Español |

El MVP inicial deberá permitir:

- Enviar mensajes desde un chat prototipo al MCP.
- Identificar intenciones de consulta.
- Consultar información en la API de Registro de LACNIC.
- Responder al usuario con información obtenida desde la API.
- Bloquear cualquier intención de escritura.

El MVP inicial no deberá permitir:

- Registrar subasignaciones.
- Modificar datos de organización.
- Modificar contactos.
- Crear, modificar o eliminar ROAs.
- Modificar DNS reverso.
- Crear, modificar o eliminar objetos IRR.
- Ejecutar cualquier operación de escritura sobre Registro.
- Usar sesión real de MiLACNIC.
- Escribir eventos en el logger real de MiLACNIC.

### 3.3 Alcance del punto intermedio

En el punto intermedio se integrará el prototipo con MiLACNIC y se agregará la primera operación de escritura real, limitada exclusivamente al alta de nuevas subasignaciones.

| Dominio | Consulta | Análisis | Preparación de cambios | Escritura real |
|---|---:|---:|---:|---:|
| Organizaciones y recursos | Sí | Sí | Sí | No |
| RPKI / ROAs | Sí | Sí | Sí | No |
| DNS reverso | Sí | Sí | Sí | No |
| IRR / route objects | Sí | Sí | Sí | No |
| Subasignaciones | Sí | Sí | Sí | Sí, solo alta |

La única escritura real del punto intermedio será:

```text
Registrar nuevas subasignaciones individuales.
```

Quedan fuera del punto intermedio:

- Modificar datos de organización.
- Modificar contactos.
- Crear, modificar o eliminar ROAs.
- Modificar DNS reverso.
- Crear, modificar o eliminar objetos IRR.
- Modificar subasignaciones.
- Eliminar subasignaciones.
- Registrar múltiples subasignaciones en una única operación.

### 3.4 Alcance de la versión final objetivo

La versión final podrá ampliar el alcance hacia:

- Escritura controlada sobre RPKI/ROAs.
- Escritura controlada sobre DNS reverso.
- Escritura controlada sobre IRR.
- Edición controlada de determinados datos de organización o recursos.
- Operaciones más completas sobre subasignaciones.
- Soporte multilingüe en español, inglés y portugués.
- Eventual incorporación de RAG o documentación autorizada.
- Eventual conexión directa o semi-directa con base de datos o réplicas, si se decide a futuro.

---

## 4. Usuarios y contexto de uso

### 4.1 MVP inicial

El MVP inicial será utilizado como prototipo técnico por el desarrollador o equipo de prueba.

No habrá usuarios reales de MiLACNIC.

No habrá sesión MiLACNIC.

No habrá validación real de roles de usuario.

Las consultas podrán realizarse mediante:

- OrgID ingresado manualmente.
- Recurso ingresado manualmente.
- Datos de prueba configurados en variables o mocks.

### 4.2 Punto intermedio y versión final

El usuario final objetivo será un usuario de MiLACNIC que actúa sobre sus propias organizaciones y recursos.

Aunque las primeras pruebas integradas serán realizadas por staff de LACNIC, el diseño debe modelarse desde el inicio como una funcionalidad destinada a clientes/usuarios de MiLACNIC.

---

## 5. Decisiones arquitectónicas principales

| Tema | MVP inicial | Punto intermedio / final |
|---|---|---|
| Tipo de servicio | Microservicio standalone | Microservicio interno |
| Stack tecnológico | Node.js / TypeScript | Node.js / TypeScript |
| Chat | Prototipo standalone | Chat integrado en MiLACNIC |
| Integración con MiLACNIC | No | Sí |
| Comunicación Chat → MCP | HTTP REST | HTTP REST interno |
| Modelo de orquestación | Chat → MCP Orchestrator → LLM + tools | Chat MiLACNIC → MCP Orchestrator → LLM + tools |
| LLM | On-premise/local | On-premise/local |
| Idioma del MVP | Español | Español |
| Idiomas objetivo | Español, inglés y portugués | Español, inglés y portugués |
| Fuente inicial de datos | API de Registro v3 | API de Registro v3 |
| Operaciones API en MVP inicial | Solo lectura | Lectura y luego escritura controlada |
| Escritura MVP inicial | No habilitada | N/A |
| Escritura punto intermedio | N/A | Solo alta inmediata de subasignaciones |
| Acceso a API | Credencial técnica o token de prueba | Credencial técnica del MCP |
| Identidad del usuario | Mock/manual | Sesión MiLACNIC |
| Validación de permisos | Mock/manual | Contexto de sesión MiLACNIC + validación propia del MCP |
| Logs | Consola / archivo local | Sistema de logs de MiLACNIC |
| Estado conversacional | Memoria o store simple | Almacenamiento temporal propio del MCP |
| Entornos | local | local, test, production |
| RAG/documentación | No incluido | No incluido inicialmente |

---

## 6. Arquitectura propuesta

### 6.1 Arquitectura del MVP inicial

```text
Usuario de prueba / desarrollador
   |
   v
Chat prototipo standalone
   |
   | HTTP REST
   v
MCP Orchestrator / MCP Server
   |
   +-- Conversation State Store simple
   |
   +-- LLM Adapter
   |      LLM local/on-premise
   |      Interpretación de intención
   |      Extracción de campos
   |
   +-- Tool Router
   |      Decide qué tool de lectura ejecutar
   |
   +-- Read-only Guard
   |      Bloquea cualquier intento de escritura
   |
   +-- Registro API v3 Adapter
   |      Ejecuta consultas de lectura
   |
   +-- Local Logger
          Consola o archivo local
```

### 6.2 Arquitectura del punto intermedio/final

```text
Usuario MiLACNIC
   |
   v
Portal MiLACNIC
   |
   v
Chat integrado en MiLACNIC
   |
   | HTTP REST interno
   v
MCP Orchestrator / MCP Server
   |
   +-- Session Context Adapter
   |      Valida o consulta contexto de sesión MiLACNIC
   |      Obtiene usuario, roles, organizaciones y permisos
   |
   +-- Conversation State Store
   |      Guarda estado temporal de conversación
   |      En el punto intermedio guardará borradores de subasignación
   |
   +-- LLM Adapter
   |      LLM on-premise/local
   |      Interpretación de intención
   |      Extracción de campos
   |
   +-- Tool Router
   |      Decide qué tool ejecutar
   |
   +-- Authorization Guard
   |      Valida rol y permisos
   |
   +-- Validation Engine
   |      Valida recursos, permisos y reglas técnicas
   |
   +-- Risk Engine
   |      Clasifica acciones por nivel de riesgo
   |
   +-- Registro API v3 Adapter
   |      Usa credenciales técnicas del MCP
   |
   +-- MiLACNIC Logger Adapter
          Envía eventos al sistema de logs existente
```

### 6.3 Principio de desacoplamiento

El MCP no debe acoplar las tools directamente a endpoints específicos de la API.

Se recomienda implementar una capa de abstracción mediante adapters:

```text
MCP Tools
   |
   v
Data Access Layer
   |
   +-- RegistroApiV3Adapter
   +-- Futuro RegistryDatabaseAdapter
   +-- Futuro RdapAdapter
   +-- Futuro RpkiAdapter
   +-- Futuro IrrAdapter
```

Esto permite que en el futuro el MCP pueda incorporar otra fuente de datos, como una réplica o conexión controlada a base de datos, sin reescribir la lógica de las tools.

---

## 7. Modelo de identidad y permisos

### 7.1 MVP inicial

El MVP inicial no se integrará con MiLACNIC, por lo tanto:

- No habrá sesión real de MiLACNIC.
- No habrá roles reales de MiLACNIC.
- No habrá validación real por organización asociada al usuario.
- Se podrá usar OrgID o recurso ingresado manualmente.
- Se podrán usar mocks para simular contexto de usuario.

El objetivo del MVP inicial no es validar permisos reales, sino validar:

- Chat.
- Orquestador.
- LLM local.
- Tools de lectura.
- API Registro v3 en modo lectura.
- Bloqueo de escritura.

### 7.2 Punto intermedio/final

El usuario se autenticará en MiLACNIC mediante el mecanismo existente.

MiLACNIC utiliza sesión Java propia, no JWT. Al iniciar sesión, MiLACNIC consulta la base de Registro y agrega a la sesión los roles, organizaciones y permisos correspondientes.

El MCP recibirá o consultará un contexto confiable asociado a la sesión del usuario.

```text
Usuario MiLACNIC
   |
   v
Sesión MiLACNIC
   |
   v
Chat integrado
   |
   v
MCP
   |
   v
API Registro v3 con credencial técnica del MCP
```

---

## 8. Modelo de riesgo

Se define una clasificación de riesgo para las acciones del asistente.

| Nivel | Tipo | Ejemplo | MVP inicial | Punto intermedio | Versión final |
|---|---|---|---:|---:|---:|
| 0 | Consulta pública | Consultar datos públicos | Permitido | Permitido | Permitido |
| 1 | Consulta autorizada | Consultar recursos de una organización | Permitido de forma manual/mock | Permitido | Permitido |
| 2 | Análisis | Detectar inconsistencia de RPKI, DNS o IRR | Limitado | Permitido | Permitido |
| 3 | Preparación de cambio | Preparar un cambio sin ejecutarlo | No permitido | Permitido | Permitido |
| 4 | Escritura controlada | Registrar nueva subasignación | No permitido | Permitido con confirmación | Permitido |
| 5 | Escritura crítica | Modificar ROAs, DNS, IRR, contactos, eliminar datos | No permitido | No permitido | Evaluar |

En el MVP inicial toda operación de escritura debe quedar bloqueada.

---

## 9. Capacidades del MVP inicial

### 9.1 Capacidades mínimas

El MVP inicial deberá permitir:

1. Abrir un chat prototipo.
2. Enviar un mensaje desde el chat al MCP por HTTP REST.
3. Procesar el mensaje con un LLM local/on-premise.
4. Detectar intenciones de consulta.
5. Consultar información en la API de Registro v3.
6. Devolver una respuesta al usuario.
7. Registrar eventos en consola o logger local.
8. Bloquear cualquier intención de escritura.

### 9.2 Consultas iniciales sugeridas

El MVP inicial puede comenzar con consultas simples como:

- Consultar datos generales de una organización por OrgID.
- Consultar recursos IPv4 de una organización.
- Consultar recursos IPv6 de una organización.
- Consultar ASN de una organización.
- Consultar datos básicos de un recurso.
- Consultar subasignaciones existentes, solo lectura, si el endpoint está disponible.

### 9.3 Mensaje para acciones no habilitadas

Si el usuario pide una operación de escritura en el MVP inicial, el asistente debe responder:

```text
Esta acción todavía no está habilitada en el asistente. En esta primera versión solo puedo consultar información desde la API de Registro.
```

---

## 10. Punto intermedio: subasignaciones

Esta sección describe el punto intermedio, no el MVP inicial.

### 10.1 Definición funcional

El punto intermedio permitirá registrar nuevas subasignaciones individuales.

Características:

- Tipo funcional: `RE-ALLOCATED`.
- Estado resultante esperado: `reallocated`.
- Recursos soportados: IPv4 e IPv6.
- Alta inmediata en Registro.
- Una subasignación por operación.
- Sin modificación ni eliminación de subasignaciones.

### 10.2 Reglas funcionales

1. Solo usuarios autorizados pueden iniciar el flujo.
2. Solo Contacto administrativo, Contacto técnico y Co-Administrador pueden registrar.
3. Contacto de membresía y facturación no pueden registrar.
4. Solo organizaciones ISP pueden registrar subasignaciones.
5. El recurso padre debe ser `ALLOCATED`.
6. Los End Users no pueden realizar subasignaciones en MiLACNIC.
7. La subasignación resultante queda con `status: reallocated`.
8. Se aceptan IPv4 e IPv6.
9. Solo se permite una subasignación por operación.
10. La propuesta incompleta vence con la sesión o puede cancelarse.
11. El alta es inmediata.
12. Todo queda registrado en logs MiLACNIC.

---

## 11. Flujo conversacional del MVP inicial

### 11.1 Flujo de consulta

```text
1. Usuario envía una consulta desde el chat prototipo.

2. El chat envía el mensaje al MCP por HTTP REST.

3. MCP registra evento local MESSAGE_RECEIVED.

4. LLM local interpreta intención de consulta.

5. MCP valida que la intención sea de lectura.

6. MCP identifica la tool de consulta correspondiente.

7. MCP consulta API Registro v3.

8. MCP construye respuesta controlada.

9. MCP registra resultado en logs locales.

10. MCP responde al chat.
```

### 11.2 Acción de escritura en MVP inicial

Si el usuario pide una escritura:

```text
Crear una subasignación.
Modificar un ROA.
Cambiar DNS reverso.
Crear un objeto IRR.
Modificar contactos.
```

El MCP debe rechazar la operación.

Ejemplo:

```text
Esta acción todavía no está habilitada en el asistente. En esta primera versión solo puedo consultar información desde la API de Registro.
```

---

## 12. LLM on-premise

### 12.1 Estado actual

Existe infraestructura disponible, pero falta seleccionar el modelo.

Para el MVP inicial también puede usarse, si es más práctico para desarrollo local, un runtime local tipo Ollama, vLLM, llama.cpp u otro equivalente definido por el equipo.

### 12.2 Idiomas

Para el MVP inicial:

```text
Español.
```

Objetivo final:

```text
Español, inglés y portugués.
```

### 12.3 Rol del LLM

El LLM puede:

- Interpretar intención.
- Extraer campos desde lenguaje natural.
- Redactar aclaraciones simples.
- Reformular errores técnicos sanitizados.

El LLM no puede:

- Validar permisos.
- Decidir si una acción se ejecuta.
- Ejecutar escritura.
- Validar propiedad de recursos.
- Llamar directamente a la API de Registro.
- Construir payloads de escritura.

Regla central:

```text
El LLM interpreta. El MCP valida y ejecuta.
```

En el MVP inicial, el LLM solo se utilizará para consultas y procesamiento conversacional de lectura.

### 12.4 Datos enviados al LLM

Permitido:

- Mensaje del usuario.
- Campos necesarios para la consulta.
- Estado conversacional sanitizado.
- Errores técnicos sanitizados.

No permitido:

- Credenciales.
- Tokens.
- API keys.
- Datos internos innecesarios.
- Payloads completos con información sensible.
- Documentación confidencial.

En el MVP inicial no existe sessionId real de MiLACNIC, pero igualmente se debe mantener la regla de no enviar identificadores sensibles al LLM.

### 12.5 RAG

El MVP inicial no utilizará RAG ni consulta documental.

---

## 13. API REST interna del MCP

### 13.1 Enviar mensaje

```http
POST /mcp/chat/message
```

Payload conceptual:

```json
{
  "conversationId": "optional-conversation-id",
  "message": "Mostrame los recursos de la organización UY-TEST-LACNIC",
  "locale": "es"
}
```

Respuesta conceptual:

```json
{
  "conversationId": "abc123",
  "status": "COMPLETED",
  "message": "Estos son los recursos asociados a la organización..."
}
```

### 13.2 Healthcheck

```http
GET /health
```

### 13.3 Endpoints futuros

No son necesarios para el MVP inicial, pero se dejan previstos para el punto intermedio:

```http
POST /mcp/chat/confirm
POST /mcp/chat/cancel
```

---

## 14. Estado conversacional

En el MVP inicial, el estado conversacional puede ser simple.

Opciones:

- Memoria del proceso.
- Archivo local.
- Store temporal simple.
- Redis o base relacional si ya existe infraestructura.

Para el MVP inicial no se requieren drafts de escritura.

En el punto intermedio, el almacenamiento deberá soportar drafts de subasignación.

---

## 15. Logs

### 15.1 MVP inicial

En el MVP inicial se usará logging local:

- Consola.
- Archivo.
- Logger de aplicación.

Eventos mínimos:

```text
MCP_MESSAGE_RECEIVED
MCP_INTENT_DETECTED
MCP_READ_TOOL_SELECTED
MCP_API_READ_STARTED
MCP_API_READ_SUCCEEDED
MCP_API_READ_FAILED
MCP_RESPONSE_SENT
MCP_ACTION_BLOCKED
```

### 15.2 Punto intermedio/final

En etapas posteriores, el MCP deberá enviar eventos al sistema de logs de MiLACNIC.

---

## 16. Tools del MVP inicial y evolución

### 16.1 Tools activas del MVP inicial

```text
get_organization
get_organization_contacts
get_organization_resources
get_resource_detail
get_subassignments_by_org
get_subassignments_by_resource
```

Todas estas tools serán de solo lectura.

### 16.2 Tools bloqueadas en el MVP inicial

```text
prepare_create_subassignment
create_subassignment
update_organization
update_contact
create_roa
update_roa
delete_roa
update_reverse_dns
create_irr_object
update_irr_object
delete_irr_object
update_subassignment
delete_subassignment
bulk_create_subassignments
```

### 16.3 Tools a habilitar en el punto intermedio

```text
validate_subassignment_candidate
prepare_create_subassignment
create_subassignment
cancel_subassignment_draft
```

---

## 17. Estructura sugerida del proyecto

```text
mcp-milacnic/
  src/
    app.ts
    server.ts

    config/
      env.ts
      api.ts

    routes/
      chat.routes.ts
      health.routes.ts

    orchestrator/
      chatOrchestrator.ts
      intentDetector.ts
      responseBuilder.ts

    llm/
      llmClient.ts
      promptTemplates.ts
      extractionSchemas.ts

    tools/
      organizations/
      resources/
      subassignments/

    adapters/
      registroApiV3/
        registroApiClient.ts
        organizationsApi.ts
        resourcesApi.ts
        subassignmentsApi.ts

    state/
      conversationStore.ts

    logger/
      localLogger.ts

    types/
      organization.ts
      resource.ts
      subassignment.ts
      chat.ts
      tool.ts

    errors/
      AppError.ts
      ApiErrorMapper.ts

    tests/
      unit/
      integration/
```

Los módulos de sesión MiLACNIC, authorization guard avanzado y logger MiLACNIC quedan para etapas posteriores.

---

## 18. Backlog del MVP inicial standalone

### Hito 0 — Relevamiento técnico base

Objetivo: completar datos técnicos necesarios para el MVP inicial.

Tareas:

- Confirmar endpoints de lectura disponibles en API Registro v3.
- Confirmar mecanismo de credenciales técnicas o token de prueba para API Registro.
- Definir modelo LLM local a utilizar.
- Definir si el chat inicial será una app web simple, CLI o componente separado.
- Definir formato de respuesta esperado para consultas de organización y recursos.

Entregables:

- Matriz endpoint de lectura → tool.
- ADR de selección de modelo LLM.
- ADR de estrategia de credenciales de API.
- Lista de consultas soportadas en MVP.

---

### Hito 1 — Base del microservicio

Objetivo: crear el microservicio Node.js/TypeScript.

Tareas:

- Inicializar proyecto.
- Configurar TypeScript.
- Crear servidor HTTP.
- Crear endpoint `/health`.
- Crear estructura base de carpetas.
- Configurar variables de entorno.
- Implementar manejo centralizado de errores.
- Implementar logging técnico mínimo.

Entregables:

- Microservicio ejecutable localmente.
- Healthcheck operativo.
- Estructura base versionada.

---

### Hito 2 — API REST del MCP

Objetivo: exponer API REST del MCP para el chat prototipo.

Tareas:

- Implementar `POST /mcp/chat/message`.
- Definir contrato de request/response.
- Implementar manejo de acciones bloqueadas.
- Implementar validación básica del request.

Entregables:

- API REST funcional.
- Contratos documentados.
- Pruebas básicas de endpoints.

---

### Hito 3 — Chat prototipo

Objetivo: construir una interfaz conversacional mínima.

Tareas:

- Crear chat web simple o CLI.
- Enviar mensajes a API REST del MCP.
- Mostrar respuestas.
- Manejar estados de carga y error.
- Mostrar acciones bloqueadas cuando corresponda.

Entregables:

- Chat prototipo operativo.
- Flujo básico usuario → chat → MCP → respuesta.

---

### Hito 4 — Adaptador LLM local

Objetivo: integrar el LLM local/on-premise.

Tareas:

- Seleccionar modelo candidato.
- Implementar `llmClient`.
- Definir prompt de intención para consultas.
- Definir schema JSON de salida.
- Validar extracción de intención de lectura.
- Manejar respuestas inválidas del LLM.
- Evitar envío de tokens o credenciales al LLM.

Entregables:

- LLM integrado.
- Extracción de intención funcionando.
- Tests con ejemplos en español.

---

### Hito 5 — Adapter API Registro v3 solo lectura

Objetivo: integrar la API de Registro v3 en modo lectura.

Tareas:

- Implementar cliente HTTP.
- Configurar credencial/token para API.
- Implementar consulta de organización.
- Implementar consulta de contactos, si corresponde.
- Implementar consulta de recursos IPv4, IPv6 y ASN.
- Implementar consulta de subasignaciones existentes, si el endpoint está disponible.
- Implementar normalización de errores.

Entregables:

- Adapter API v3 de lectura funcional.
- Pruebas contra ambiente disponible.
- Mapeo de errores técnicos a mensajes de usuario.

---

### Hito 6 — Tools de lectura

Objetivo: implementar tools activas del MVP inicial.

Tareas:

- Implementar `get_organization`.
- Implementar `get_organization_contacts`.
- Implementar `get_organization_resources`.
- Implementar `get_resource_detail`.
- Implementar `get_subassignments_by_org`.
- Implementar `get_subassignments_by_resource`.
- Validar que ninguna tool ejecute escritura.

Entregables:

- Tools de lectura implementadas.
- Pruebas unitarias.
- Pruebas de integración con API.

---

### Hito 7 — Orquestación conversacional de lectura

Objetivo: unir chat, LLM, tools y API en un flujo completo de consulta.

Tareas:

- Detectar intención de consulta.
- Seleccionar tool de lectura.
- Ejecutar consulta en API Registro v3.
- Construir respuesta controlada.
- Bloquear intenciones de escritura.
- Registrar eventos en logs locales.

Entregables:

- Flujo end-to-end de consulta.
- Flujo de acción bloqueada.
- Casos de éxito y error documentados.

---

### Hito 8 — Seguridad y pruebas del MVP inicial

Objetivo: validar seguridad antes de avanzar al punto intermedio.

Tareas:

- Probar consulta por OrgID.
- Probar consulta por recurso.
- Probar error de API.
- Probar acción de escritura bloqueada.
- Probar que no se envíen tokens ni credenciales al LLM.
- Probar que el MCP no ejecuta ninguna operación de escritura.
- Revisar que no existan llamadas POST/PUT/PATCH/DELETE hacia API Registro, salvo autenticación si aplica.

Entregables:

- Suite de pruebas.
- Checklist de seguridad.
- Criterios de aceptación del MVP inicial cumplidos.

---

## 19. Backlog del punto intermedio

Este backlog se ejecutará después del MVP inicial.

### Hito PI-1 — Integración con MiLACNIC

Tareas:

- Integrar chat dentro de MiLACNIC.
- Recibir o consultar contexto de sesión.
- Validar roles y organizaciones.
- Integrar logger MiLACNIC.

### Hito PI-2 — Contrato real de subasignaciones

Tareas:

- Relevar endpoint exacto de alta de subasignaciones en API v3.
- Obtener body requerido.
- Confirmar campos obligatorios.
- Confirmar errores esperados.
- Confirmar reglas de tamaño de subasignaciones.

### Hito PI-3 — Estado conversacional avanzado

Tareas:

- Implementar drafts de subasignación.
- Implementar expiración.
- Implementar cancelación.
- Implementar estados `AWAITING_MISSING_FIELDS`, `AWAITING_CONFIRMATION`, `EXECUTED`, `FAILED`.

### Hito PI-4 — Validaciones de subasignación

Tareas:

- Validar roles.
- Validar organización asociada.
- Validar recurso padre.
- Validar `ALLOCATED`.
- Validar `RE-ALLOCATED`.
- Validar estado esperado `reallocated`.
- Validar IPv4 e IPv6.
- Validar CIDR y rangos.
- Validar solapamientos.
- Validar campos obligatorios.

### Hito PI-5 — Flujo de alta de subasignación

Tareas:

- Implementar `validate_subassignment_candidate`.
- Implementar `prepare_create_subassignment`.
- Implementar `create_subassignment`.
- Implementar confirmación tipo B.
- Implementar error handling de API.
- Registrar auditoría completa.

---

## 20. Riesgos principales

| Riesgo | Impacto | Mitigación |
|---|---:|---|
| API v3 no expone toda la información de lectura requerida | Medio | Ajustar alcance de tools de lectura |
| Credenciales de API con permisos de escritura disponibles desde el MVP | Alto | Bloquear escritura en código y revisar métodos HTTP permitidos |
| El LLM interpreta mal una solicitud | Medio/Alto | Validaciones determinísticas y plantillas controladas |
| El LLM inventa datos | Alto | No aceptar datos no provistos; extracción con schema |
| El usuario intenta acción fuera del MVP inicial | Medio | Rechazo controlado |
| No hay chat integrado actualmente | Bajo en MVP | Usar chat prototipo standalone |
| Exposición de credenciales al LLM | Alto | Sanitización y política estricta de datos |
| Dificultad para elegir modelo on-premise | Medio | Evaluación comparativa de modelos candidatos |
| Se confunde MVP inicial con punto intermedio | Medio | Documentar explícitamente la evolución por etapas |

---

## 21. Criterios de aceptación del MVP inicial

### 21.1 Funcionales

El MVP inicial será aceptable si:

- Un usuario puede interactuar con un chat prototipo.
- El chat envía mensajes al MCP por HTTP REST.
- El MCP utiliza un LLM local para interpretar consultas en español.
- El MCP identifica intenciones de lectura.
- El MCP consulta información en API Registro v3.
- El MCP devuelve respuestas entendibles al usuario.
- El MCP bloquea cualquier intento de escritura.
- El MCP informa claramente cuando una acción no está habilitada.
- El MCP registra eventos en consola o logger local.

### 21.2 Técnicos

El MVP inicial será aceptable si:

- El microservicio corre localmente.
- La integración HTTP REST funciona.
- El LLM local está integrado.
- El adapter API v3 funciona en modo lectura.
- Los errores son controlados.
- No se envían credenciales ni tokens al LLM.
- No existe ningún flujo activo que ejecute escritura.

### 21.3 Seguridad

El MVP inicial será aceptable si:

- El MCP no ejecuta acciones de escritura.
- Toda acción fuera de alcance queda bloqueada.
- Las credenciales técnicas no se exponen al usuario ni al LLM.
- Los datos enviados al LLM están sanitizados.
- Toda consulta queda registrada localmente.

---

## 22. Criterios de aceptación del punto intermedio

El punto intermedio será aceptable si:

- El asistente se integra con MiLACNIC.
- El asistente usa contexto de sesión MiLACNIC.
- El asistente registra eventos en logs MiLACNIC.
- El usuario puede registrar una nueva subasignación individual.
- El asistente solicita datos faltantes agrupados.
- El asistente acepta CIDR y rangos convertibles a un único CIDR.
- El asistente rechaza rangos no convertibles a un único CIDR.
- El asistente valida que el usuario tenga rol autorizado.
- El asistente valida que la organización pertenezca al usuario.
- El asistente valida que el recurso padre sea `ALLOCATED`.
- El asistente valida contención del prefijo.
- El asistente valida ausencia de solapamiento.
- El asistente muestra resumen antes de ejecutar.
- El asistente solicita confirmación.
- El asistente registra la subasignación vía API v3.
- El estado resultante es `reallocated`.

---

## 23. Documentación para escritura futura

Aunque el MVP inicial no habilita escritura, se deberá dejar documentación para habilitar escritura futura en otros dominios.

Documentos sugeridos:

```text
docs/write-enable-subassignments.md
docs/write-enable-organizations.md
docs/write-enable-rpki.md
docs/write-enable-reverse-dns.md
docs/write-enable-irr.md
docs/write-enable-subassignment-update-delete.md
```

Cada documento deberá incluir:

1. Tools a habilitar.
2. Endpoints API v3 necesarios.
3. Permisos requeridos.
4. Validaciones obligatorias.
5. Nivel de riesgo.
6. Tipo de confirmación.
7. Auditoría requerida.
8. Pruebas mínimas.
9. Errores esperados.
10. Criterios para pasar a producción.

---

## 24. Preguntas técnicas pendientes

Estas preguntas deben resolverse con pruebas o con documentación técnica:

1. ¿Qué endpoints de lectura exactos estarán disponibles en API Registro v3 para el MVP inicial?
2. ¿Qué formato exacto devuelven los endpoints de organizaciones, recursos y subasignaciones?
3. ¿Cómo se autentica técnicamente la credencial del MCP contra API v3?
4. ¿Qué modelo LLM local se usará?
5. ¿Qué infraestructura exacta tendrá disponible el modelo?
6. ¿Qué store temporal se usará para estado conversacional?
7. ¿Cuál será el primer set mínimo de consultas soportadas?
8. ¿Cuál es el body exacto del endpoint de alta de subasignaciones para el punto intermedio?
9. ¿Qué campos son obligatorios para una subasignación?
10. ¿Qué formato exacto espera la API para IPv4 e IPv6 en subasignaciones?
11. ¿Qué reglas exactas de tamaño aplica MiLACNIC/API para subasignaciones?
12. ¿Qué errores devuelve API v3 para solapamiento, permisos, formato y tamaño?

---

## 25. Anexos

### 25.1 Prompt base para intención de lectura en MVP inicial

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
Respondé únicamente en JSON válido siguiendo el schema.
```

### 25.2 Ejemplo esperado de extracción para MVP inicial

Mensaje del usuario:

```text
Mostrame los recursos de la organización UY-TEST-LACNIC.
```

Salida esperada:

```json
{
  "intent": "get_organization_resources",
  "orgId": "UY-TEST-LACNIC",
  "missingFields": []
}
```

### 25.3 Ejemplo de acción bloqueada

Mensaje del usuario:

```text
Registrá una subasignación para 200.3.12.0/24.
```

Salida esperada:

```json
{
  "intent": "unsupported_write_action",
  "reason": "WRITE_NOT_ENABLED_IN_MVP"
}
```

Respuesta al usuario:

```text
Esta acción todavía no está habilitada en el asistente. En esta primera versión solo puedo consultar información desde la API de Registro.
```

---

## 26. Conclusión

El MVP inicial se enfoca en validar la base técnica del proyecto sin depender de MiLACNIC:

```text
chat prototipo
  -> MCP Orchestrator
  -> LLM local
  -> tools de lectura
  -> API Registro v3
  -> logs locales
```

Este enfoque reduce el riesgo inicial al eliminar:

- Integración con MiLACNIC.
- Sesión de usuario.
- Logger institucional.
- Cualquier operación de escritura sobre Registro.

El punto intermedio incorporará la integración con MiLACNIC y la primera escritura real, limitada al alta inmediata de nuevas subasignaciones.

La versión final quedará preparada para ampliar capacidades sobre RPKI, DNS reverso, IRR, organizaciones y subasignaciones, siempre bajo validaciones determinísticas, control de permisos, confirmaciones y auditoría.
