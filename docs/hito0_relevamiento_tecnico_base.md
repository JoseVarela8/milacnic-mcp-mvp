# Hito 0 - Relevamiento tecnico base

Fuente de referencia: `docs/plan_mcp_milacnic_mvp_standalone.md`.

## Estado

Completado.

## Matriz endpoint de lectura -> tool

| Tool | Adapter | Endpoint Registro v3 | Estado |
|---|---|---|---|
| `get_organization` | `getOrganization` | `GET /entity/organizations/{orgId}` | Implementado |
| `get_organization_contacts` | `getOrganization` | `GET /entity/organizations/{orgId}` y extraccion de contactos | Implementado |
| `get_organization_resources` | `getOrganizationResources` | `GET /entity/resources/{orgId}` | Implementado |
| `get_resource_detail` | `getAsn` / `getIp` | `GET /asns/{asn}` o `GET /ips/{address}/{prefix}` | Implementado |
| `get_subassignments_by_org` | `getOrganizationResources` + `getSubassignmentsByResource` | Derivado desde recursos de la organizacion | Implementado |
| `get_subassignments_by_resource` | `getIp` | Derivado de `ipnetwork_child` en detalle de IP | Implementado |
| `get_roas_by_org` | `getRoasByOrganization` | `GET /rpki/roas` con filtro de organizacion | Implementado |
| `get_geofeeds_by_org` | `getGeofeedsByOrganization` | `GET /geofeeds` con filtro de organizacion | Implementado |
| `get_irr_assets` | `getIrrAssets` | `GET /irr/assets` | Implementado |
| `get_rate_limits` | `getRateLimits` | `GET /ratelimits` | Implementado |

## ADR - Modelo LLM local

Decision: usar Qwen 2.5 14B Instruct ejecutado localmente con Ollama.

Motivos:

- Buen rendimiento para espanol y extraccion de intenciones.
- Disponible localmente sin enviar datos a proveedores externos.
- Compatible con endpoint estilo OpenAI `/chat/completions`, lo que desacopla el MVP del runtime.
- Tamano razonable para el MVP y suficientemente cercano a una opcion on-premise futura.

Configuracion:

```env
LLM_BASE_URL=http://localhost:11434/v1
LLM_MODEL=qwen2.5:14b-instruct
LLM_API_KEY=ollama
LLM_TIMEOUT_MS=60000
```

## ADR - Credenciales API Registro

Decision: soportar OAuth client credentials y token estatico opcional.

Motivos:

- El flujo client credentials evita mantener tokens manuales si se cuenta con `client_id` y `client_secret`.
- `REGISTRO_API_ACCESS_TOKEN` queda como fallback operativo.
- El token se obtiene en `src/adapters/registroApiV3/auth.ts` y se cachea hasta antes de expirar.
- Las credenciales no se envian al LLM.

Configuracion:

```env
REGISTRO_API_BASE_URL=https://registro-demo.api.lacnic.net/lacnic/v3
REGISTRO_API_AUTH_TOKEN_URL=https://demo-lacnic.us.auth0.com/oauth/token
REGISTRO_API_CLIENT_ID=your-client-id
REGISTRO_API_CLIENT_SECRET=your-client-secret
```

## Chat inicial

Decision: chat web standalone en `prototype-chat/index.html`.

Motivos:

- Permite validar el flujo usuario -> chat -> MCP sin depender de MiLACNIC.
- Mantiene el MVP aislado del frontend real.
- Consume `POST /mcp/chat/message` por HTTP REST.

## Consultas soportadas en el MVP

- Datos generales de organizacion por OrgID.
- Contactos asociados a organizacion.
- Recursos de organizacion: IPv4, IPv6 y ASN segun respuesta de API.
- Detalle de recurso por ASN o CIDR.
- Subasignaciones existentes por organizacion o por recurso, en modo lectura.
- ROAs por organizacion.
- Geofeeds por organizacion.
- AS-SETs IRR disponibles.
- Rate limits de la API.

## Formato general de respuesta

```json
{
  "conversationId": "uuid",
  "status": "COMPLETED | ACTION_BLOCKED | NEEDS_CLARIFICATION | ERROR",
  "message": "Respuesta controlada para el usuario",
  "data": {}
}
```
