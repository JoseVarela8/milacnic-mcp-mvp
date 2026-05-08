# Mejoras conversacionales

## Objetivo

Mejorar la comprension del asistente durante una conversacion continua sin cambiar el principio de seguridad del MVP:

```text
El LLM interpreta. El MCP valida y ejecuta.
```

## Cambios implementados

- Estado conversacional en memoria por `conversationId`.
- Reutilizacion de contexto sanitizado:
  - ultimo OrgID;
  - ultimo recurso;
  - ultimo contacto;
  - ultima intencion.
- El prototipo web conserva el `conversationId` en `localStorage`.
- El usuario puede hacer follow-ups como:
  - `y los ROAs?`
  - `ROAs que involucren el ASN 28001`
  - `ROAs del prefijo 200.3.13.0/24`
  - `ROAs del ASN 28001 para 200.3.13.0/24`
  - `solo IPv4`
  - `que ASN tiene esta organizacion`
  - `que bloques tiene`
  - `ahora los contactos`
  - `subasignaciones de ese recurso`
  - `recursos IPv4 sin subasignaciones`
  - `diagnostico de subasignaciones`
  - `contacto administrativo`
  - `geofeeds IPv6`
  - `AS-SET de AS28001 en IRR`
  - `cuotas de API`
- Las consultas de ROAs pueden filtrarse localmente por ASN, prefix o ambos sin cambiar la API de Registro.
- Las consultas de recursos pueden filtrarse localmente por IPv4, IPv6, ASN o bloques IP sin cambiar la API de Registro.
- Las consultas de subasignaciones pueden reutilizar el ultimo recurso o diagnosticar cobertura por organizacion sin habilitar escritura.
- Las consultas de contactos pueden filtrarse por rol.
- Las consultas de Geofeeds pueden filtrarse por recurso, IPv4 o IPv6.
- Las consultas de IRR pueden filtrarse por ASN o AS-SET.
- Las intenciones de escritura reconocen mas verbos y se bloquean antes de llamar a Registro.
- Si el usuario pide `otra organizacion` u `otro recurso` sin identificador, el MCP pide aclaracion y no reutiliza el contexto anterior.
- El schema de intencion ahora soporta:
  - `confidence`;
  - `missingFields`;
  - `clarificationQuestion`;
  - `referencedPreviousContext`;
  - `isWriteAttempt`.
- Las respuestas de lectura agregan resumen controlado y sugerencias acotadas.

## Datos enviados al LLM

Permitido:

- Mensaje del usuario.
- Contexto conversacional minimo y sanitizado.

No permitido:

- Credenciales.
- Tokens.
- API keys.
- Respuestas completas de Registro API para redaccion libre.

## Pruebas agregadas

- Follow-up con `conversationId` para consultar ROAs de la organizacion previa.
- Filtro local de ROAs por ASN manteniendo la misma llamada de lectura a Registro.
- Filtro local de ROAs por prefix sin confundir el primer octeto IPv4 con ASN.
- Filtro local combinado de ROAs por ASN + prefix.
- Filtro local de recursos por IPv4, IPv6, ASN y bloques IP.
- Diagnostico de subasignaciones IPv4 sin ejecutar escrituras.
- Follow-up sobre subasignaciones usando el recurso previo.
- Filtro de contactos por rol administrativo.
- Filtro local de Geofeeds por IPv6.
- Filtro local de objetos IRR por ASN.
- Interpretacion de cuotas de API como rate limits.
- Bloqueo de acciones de actualizacion antes de llamar a Registro.
- Pedido ambiguo de `otra organizacion` sin OrgID pide aclaracion.

Comando:

```bash
npm test
```
