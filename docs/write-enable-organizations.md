# Habilitacion futura de escritura - Organizaciones

Estado: documentacion preparatoria. No habilitado en el MVP inicial.

## Tools a habilitar

- `prepare_update_organization`
- `update_organization`

## Endpoints API v3 necesarios

- Endpoint real de actualizacion de organizacion: pendiente de confirmar.
- Endpoint de lectura de organizacion para comparar estado previo y posterior.

## Permisos requeridos

- Usuario autenticado en MiLACNIC.
- Rol administrativo o permiso explicito sobre la organizacion.

## Validaciones obligatorias

- Organizacion existente.
- Campos modificables confirmados por API Registro v3.
- Diferencias claramente presentadas antes de confirmar.
- Bloqueo de cambios sobre campos criticos no soportados.

## Nivel de riesgo

Nivel 5 - Escritura critica.

## Tipo de confirmacion

Confirmacion explicita reforzada antes de ejecutar.

## Auditoria requerida

- Usuario.
- Organizacion.
- Campos anteriores.
- Campos nuevos.
- Confirmacion.
- Respuesta de API Registro.

## Pruebas minimas

- Actualizacion valida.
- Campo no permitido.
- Permiso insuficiente.
- Organizacion inexistente.
- Cancelacion antes de confirmar.

## Errores esperados

- Permiso insuficiente.
- Campo invalido.
- Organizacion no encontrada.
- Conflicto de datos.
- Error de validacion de API.

## Criterios para pasar a produccion

- Lista cerrada de campos modificables.
- Auditoria completa.
- Confirmacion reforzada.
- Pruebas aprobadas.
- Permisos confirmados con MiLACNIC.
