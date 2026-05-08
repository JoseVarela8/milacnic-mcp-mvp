# Relevamiento de subasignaciones en API Registro v3

Fecha: 2026-05-08.

## Resultado

La API permite detectar bloques subasignados y obtener la organizacion destino con un flujo de lectura en dos pasos:

1. Consultar el detalle del bloque padre:

```text
GET /ips/{prefix}/{prefixLength}
```

2. Leer `ipnetwork_child` y consultar el detalle de cada bloque hijo:

```text
GET /ips/{childPrefix}/{childPrefixLength}
```

El detalle del bloque hijo devuelve `orgId`, que identifica la organizacion asignada.

## Evidencia en ambiente demo

Base usada:

```text
https://registro-demo.api.lacnic.net/lacnic/v3
```

Caso probado:

```text
GET /entity/resources/UY-LACN-LACNIC
GET /ips/170.247.168.0/22
GET /ips/170.247.170.0/23
```

Resultado observado:

```json
{
  "parent": {
    "cidr": "170.247.168.0/22",
    "orgId": "UY-LACN-LACNIC",
    "children": 1
  },
  "child": {
    "cidr": "170.247.170.0/23",
    "orgId": "US-BROP-LACNIC",
    "allocationType": "assignment",
    "parent": "170.247.168.0/22"
  }
}
```

## Impacto en el MCP

Se actualizo `getSubassignmentsByResource` para enriquecer cada bloque hijo con:

- `cidr`
- `assignedOrgId`
- `allocationType`
- `asn`
- `detail.ipnetwork_parent`
- contactos tecnicos o de abuso si vienen en la respuesta

Si el detalle del hijo no puede consultarse, la tool conserva el hijo detectado y agrega `detailLookupError`.

## Limites

- `ipnetwork_child` no trae directamente la organizacion destino; solo trae el rango hijo.
- La organizacion destino se obtiene con una consulta adicional por cada hijo.
- El flujo sigue siendo solo lectura.
