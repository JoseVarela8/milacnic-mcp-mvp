# Hito 8 - Seguridad y pruebas del MVP inicial

Fuente de referencia: `docs/plan_mcp_milacnic_mvp_standalone.md`.

## Estado

Completado.

## Suite de pruebas

Comando:

```bash
npm test
```

La suite compila el proyecto y ejecuta las pruebas con `node:test`:

```bash
npm run build && node --test dist/**/*.test.js
```

Archivo principal:

- `src/security.test.ts`

## Casos cubiertos

- Consulta por OrgID.
- Consulta por recurso CIDR.
- Filtro local de recursos por IPv4.
- Filtro local de recursos por IPv6.
- Filtro local de recursos por ASN.
- Filtro local de recursos por bloques IP.
- Diagnóstico de subasignaciones IPv4 sin ejecutar escrituras.
- Reutilización de recurso previo para consultar subasignaciones y detectar organización asignada del bloque hijo.
- Filtro de contactos por rol administrativo.
- Filtro local de Geofeeds por IPv6.
- Filtro local de objetos IRR por ASN.
- Interpretación de cuotas de API como rate limits.
- Error 404 de API Registro transformado en respuesta controlada.
- Acción de escritura bloqueada antes de llamar a Registro.
- Acción de actualización bloqueada antes de llamar a Registro.
- Verificación de que tokens y credenciales de Registro no se envían al LLM.
- Verificación estática de que no hay `POST`, `PUT`, `PATCH` ni `DELETE` hacia Registro API, salvo OAuth en `auth.ts`.
- Follow-up conversacional con `conversationId` para reutilizar OrgID previo.
- Filtro local de ROAs por ASN sin cambiar la llamada a Registro.
- Filtro local de ROAs por prefix sin cambiar la llamada a Registro.
- Filtro local de ROAs por ASN + prefix sin cambiar la llamada a Registro.
- Aclaración obligatoria cuando el usuario pide otra organización sin indicar OrgID.

## Checklist de seguridad

- [x] El MCP no ejecuta escritura.
- [x] Las tools activas son solo lectura.
- [x] Las acciones de escritura se bloquean.
- [x] Los errores de API se controlan.
- [x] Los logs locales registran intención y resultado.
- [x] No se envían tokens al LLM.
- [x] No se envían credenciales al LLM.
- [x] No existen llamadas `POST`, `PUT`, `PATCH` ni `DELETE` hacia API Registro, salvo autenticación OAuth.

## Criterios de aceptación

- El flujo de consulta por organización responde con estado `COMPLETED`.
- El flujo de consulta por recurso responde con estado `COMPLETED`.
- Las consultas de recursos pueden limitarse a IPv4, IPv6, ASN o bloques IP sin cambiar la llamada a Registro.
- Las consultas de subasignaciones pueden hacerse por organización, por recurso o como diagnóstico de cobertura sin escrituras.
- Cuando `ipnetwork_child` devuelve hijos, el MCP consulta cada hijo para enriquecerlo con `assignedOrgId`.
- Las consultas de contactos pueden limitarse por rol cuando la API devuelve referencias de contacto.
- Las consultas de Geofeeds e IRR pueden filtrarse localmente cuando el usuario indica familia IP, recurso, ASN o AS-SET.
- Un recurso inexistente o error 404 de Registro responde con estado `ERROR` y mensaje controlado.
- Una intención de escritura responde con estado `ACTION_BLOCKED`.
- Un follow-up como `y los ROAs?` puede usar el OrgID previo de la conversación.
- Una consulta como `ROAs que involucren el ASN 28001` filtra resultados en el MCP.
- Una consulta como `ROAs del prefijo 200.3.13.0/24` filtra por prefix en el MCP.
- Una consulta como `ROAs del ASN 28001 para 200.3.13.0/24` combina filtros locales.
- Una referencia a `otra organización` sin OrgID no reutiliza el contexto anterior.
- El payload enviado al LLM contiene solo el mensaje del usuario, el prompt de extracción y parámetros del modelo.
- Las credenciales de Registro se usan únicamente en la capa de autenticación/adaptador de Registro.
