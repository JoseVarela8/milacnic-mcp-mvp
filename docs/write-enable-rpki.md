# Habilitacion futura de escritura - RPKI / ROAs

Estado: documentacion preparatoria. No habilitado en el MVP inicial.

## Tools a habilitar

- `prepare_create_roa`
- `create_roa`
- `prepare_update_roa`
- `update_roa`
- `prepare_delete_roa`
- `delete_roa`

## Endpoints API v3 necesarios

- Endpoints reales de creacion, actualizacion y eliminacion de ROAs: pendientes de confirmar.
- Endpoint de lectura de ROAs por organizacion o recurso.

## Permisos requeridos

- Usuario autenticado en MiLACNIC.
- Permiso explicito de administracion RPKI sobre el recurso.

## Validaciones obligatorias

- Recurso asociado a la organizacion del usuario.
- Prefijo valido.
- ASN valido.
- `maxLength` valido.
- No generar ROAs inconsistentes o conflictivos.
- Confirmar impacto operacional antes de escribir.

## Nivel de riesgo

Nivel 5 - Escritura critica.

## Tipo de confirmacion

Confirmacion explicita reforzada con resumen de impacto.

## Auditoria requerida

- Usuario.
- Organizacion.
- Prefijo.
- ASN.
- `maxLength`.
- Accion solicitada.
- Confirmacion.
- Respuesta de API Registro.

## Pruebas minimas

- Crear ROA valido.
- Rechazar prefijo fuera de la organizacion.
- Rechazar ASN invalido.
- Actualizar ROA valido.
- Eliminar ROA con confirmacion.
- Bloquear cambios sin permisos.

## Errores esperados

- Prefijo invalido.
- ASN invalido.
- Permiso insuficiente.
- ROA no encontrado.
- Conflicto RPKI.
- Error de API.

## Criterios para pasar a produccion

- Validaciones RPKI confirmadas con expertos del dominio.
- Confirmacion reforzada.
- Auditoria completa.
- Pruebas automatizadas y manuales aprobadas.
- Rollback o procedimiento operativo definido.
