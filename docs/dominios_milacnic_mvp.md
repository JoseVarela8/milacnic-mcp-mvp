# Dominios funcionales incorporados al MVP

## ROAs / RPKI

Estado: implementado.

Opciones de la matriz cubiertas:

- 1 - Filtrar ROAs por `prefix`.
- 3 - Filtrar ROAs por ASN + prefix combinados.

Intencion LLM:

```text
get_roas_by_org
```

Entidades soportadas:

```json
{
  "orgId": "UY-LACN-LACNIC",
  "asn": "28001",
  "resource": "200.3.13.0/24"
}
```

Tool MCP:

```text
getRoasByOrganizationTool
```

Comportamiento:

- El MCP consulta ROAs por organizacion con la tool existente.
- El filtro por ASN se aplica localmente.
- El filtro por prefix se aplica localmente.
- Si vienen ASN y prefix, ambos filtros se combinan localmente.
- No se agregan operaciones de escritura.
- No cambia la API de Registro.

Ejemplos:

```text
Mostrame los ROAs de esta organizacion
ROAs que involucren el ASN 28001
ROAs del prefijo 200.3.13.0/24
ROAs del ASN 28001 para 200.3.13.0/24
```

Pruebas:

- `filtra ROAs por ASN sin cambiar la llamada a Registro`
- `filtra ROAs por prefix sin confundir el prefix con ASN`
- `filtra ROAs por ASN y prefix combinados`

## Recursos

Estado: implementado.

Opciones de la matriz cubiertas:

- 5 - Consultar recursos de una organizacion y separar IPv4, IPv6 y ASN.
- 6 - Preguntar `solo IPv4` o `solo IPv6` sobre recursos.
- 7 - Preguntar que ASN tiene una organizacion.
- 8 - Preguntar que bloques tiene una organizacion.

Intencion LLM:

```text
get_organization_resources
```

Entidades soportadas:

```json
{
  "orgId": "UY-LACN-LACNIC",
  "resourceType": "all | ip | ipv4 | ipv6 | asn"
}
```

Tool MCP:

```text
getOrganizationResourcesTool
```

Comportamiento:

- El MCP consulta recursos por organizacion con la tool existente.
- El filtro por tipo de recurso se aplica localmente.
- `resourceType=asn` devuelve solo `asNumbers`.
- `resourceType=ip` devuelve bloques IPv4 e IPv6 y excluye ASN.
- `resourceType=ipv4` devuelve solo bloques IPv4.
- `resourceType=ipv6` devuelve solo bloques IPv6.
- No se agregan operaciones de escritura.
- No cambia la API de Registro.

Ejemplos:

```text
Mostrame los recursos de UY-LACN-LACNIC
Mostrame solo IPv4 de UY-LACN-LACNIC
Que bloques IPv6 tiene UY-LACN-LACNIC?
Que ASN tiene la organizacion UY-LACN-LACNIC?
Que bloques tiene la organizacion UY-LACN-LACNIC?
```

Pruebas:

- `filtra recursos de organización para mostrar solo IPv4`
- `filtra recursos de organización para mostrar solo IPv6`
- `filtra recursos de organización para mostrar solo ASN`
- `filtra recursos de organización para mostrar solo bloques IP`

## Subasignaciones

Estado: implementado.

Opciones de la matriz cubiertas:

- 11 - Consultar subasignaciones existentes por recurso.
- 13 - Diagnosticar recursos con o sin subasignaciones, si la lectura de `ipnetwork_child` esta disponible.

Intenciones LLM:

```text
get_subassignments_by_org
get_subassignments_by_resource
```

Entidades soportadas:

```json
{
  "orgId": "UY-LACN-LACNIC",
  "resource": "200.3.12.0/24",
  "resourceType": "all | ip | ipv4 | ipv6",
  "subassignmentView": "with_subassignments | without_subassignments | coverage"
}
```

Tools MCP:

```text
getSubassignmentsByOrgTool
getSubassignmentsByResourceTool
```

Comportamiento:

- El MCP consulta los recursos de la organizacion con la tool existente.
- Para cada bloque IP revisado, consulta el detalle del recurso y lee `ipnetwork_child`.
- Para cada bloque hijo detectado, consulta su detalle para obtener `assignedOrgId`.
- `resourceType=ipv4` revisa solo bloques IPv4.
- `resourceType=ipv6` revisa solo bloques IPv6.
- `subassignmentView=with_subassignments` devuelve recursos con subasignaciones.
- `subassignmentView=without_subassignments` devuelve recursos sin subasignaciones.
- `subassignmentView=coverage` devuelve todos los recursos revisados con resumen de cobertura.
- No se agregan operaciones de escritura.
- No cambia la API de Registro.

Evidencia de API:

- `docs/relevamiento_subasignaciones_api_registro.md`

Ejemplos:

```text
Mostrame las subasignaciones de UY-LACN-LACNIC
Subasignaciones de 200.3.12.0/24
Recursos IPv4 sin subasignaciones de UY-LACN-LACNIC
Diagnostico de subasignaciones de UY-LACN-LACNIC
Y sus subasignaciones?
```

Pruebas:

- `diagnostica subasignaciones IPv4 sin ejecutar escrituras`
- `usa el recurso previo para consultar subasignaciones`

## Organizaciones y contactos

Estado: implementado.

Intenciones LLM:

```text
get_organization
get_organization_contacts
get_contact
```

Entidades soportadas:

```json
{
  "orgId": "UY-LACN-LACNIC",
  "contactId": "ABC123",
  "contactRole": "all | admin | billing | membership"
}
```

Tools MCP:

```text
getOrganizationTool
getOrganizationContactsTool
getContactTool
```

Comportamiento:

- El MCP consulta datos de una organizacion por OrgID.
- El MCP consulta contactos asociados a la organizacion.
- Si el usuario pide un rol especifico, consulta solo ese contacto.
- Roles soportados: administrativo, facturacion/cobranza y membresia.
- No se agregan operaciones de escritura.

Ejemplos:

```text
Mostrame informacion de UY-LACN-LACNIC
Mostrame los contactos de UY-LACN-LACNIC
Mostrame el contacto administrativo de UY-LACN-LACNIC
```

Pruebas:

- `consulta por OrgID ejecuta una tool de lectura y devuelve datos`
- `filtra contactos de organización por rol administrativo`

## Geofeeds

Estado: implementado.

Intencion LLM:

```text
get_geofeeds_by_org
```

Entidades soportadas:

```json
{
  "orgId": "UY-LACN-LACNIC",
  "resource": "200.3.12.0/24",
  "resourceType": "ipv4 | ipv6"
}
```

Tool MCP:

```text
getGeofeedsByOrganizationTool
```

Comportamiento:

- El MCP consulta Geofeeds por organizacion con la tool existente.
- El filtro por recurso se aplica localmente cuando la respuesta incluye `ip`, `cidr`, `prefix` o `resource`.
- El filtro IPv4/IPv6 se aplica localmente.
- No se agregan operaciones de escritura.

Ejemplos:

```text
Mostrame Geofeeds de UY-LACN-LACNIC
Mostrame Geofeeds IPv6 de UY-LACN-LACNIC
Geofeeds del recurso 200.3.12.0/24
```

Pruebas:

- `filtra Geofeeds por IPv6 sin cambiar la llamada a Registro`

## IRR

Estado: implementado.

Intencion LLM:

```text
get_irr_assets
```

Entidades soportadas:

```json
{
  "asn": "28001",
  "resource": "AS-LACNIC"
}
```

Tool MCP:

```text
getIrrAssetsTool
```

Comportamiento:

- El MCP consulta los objetos IRR disponibles con la tool existente.
- El filtro por ASN o AS-SET se aplica localmente.
- No se agregan operaciones de escritura.

Ejemplos:

```text
Mostrame los AS-SETs de IRR
Mostrame AS-SET de AS28001 en IRR
```

Pruebas:

- `filtra objetos IRR por ASN localmente`

## Rate limits

Estado: implementado.

Intencion LLM:

```text
get_rate_limits
```

Tool MCP:

```text
getRateLimitsTool
```

Comportamiento:

- El MCP interpreta `rate limits`, limites, cuotas, cupos o throttling como consulta de limites de API.
- No se agregan operaciones de escritura.

Ejemplos:

```text
Mostrame los rate limits
Mostrame las cuotas de API disponibles
```

Pruebas:

- `interpreta cuotas de API como rate limits`

## Escrituras fuera del MVP

Estado: bloqueado.

Intencion LLM:

```text
unsupported_write_action
```

Comportamiento:

- Crear, registrar, modificar, actualizar, cambiar, eliminar, borrar, publicar, activar, desactivar, revocar, delegar, transferir o configurar datos se bloquea antes de llamar a Registro.
- La respuesta usa estado `ACTION_BLOCKED`.
- No se ejecutan `POST`, `PUT`, `PATCH` ni `DELETE` hacia Registro API, salvo OAuth en `auth.ts`.

Ejemplos:

```text
Crear una subasignacion
Actualizar el ROA del ASN 28001
Eliminar un Geofeed
Configurar DNS reverso
```

Pruebas:

- `acciones de escritura quedan bloqueadas antes de llamar a Registro`
- `acciones de actualización quedan bloqueadas antes de llamar a Registro`
- `no existen operaciones de escritura hacia Registro API salvo OAuth`
