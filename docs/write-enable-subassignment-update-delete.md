# Habilitacion futura de escritura - Modificacion y baja de subasignaciones

Estado: documentacion preparatoria. No habilitado en el MVP inicial.

## Tools a habilitar

- `prepare_update_subassignment`
- `update_subassignment`
- `prepare_delete_subassignment`
- `delete_subassignment`

## Endpoints API v3 necesarios

- Endpoints reales de actualizacion y baja de subasignaciones: pendientes de confirmar.
- Endpoints de lectura de subasignacion y recurso padre.

## Permisos requeridos

- Usuario autenticado en MiLACNIC.
- Permiso de administracion sobre la organizacion dueña del recurso padre.

## Validaciones obligatorias

- Subasignacion existente.
- Recurso padre asociado al usuario.
- Cambios permitidos por estado.
- No generar solapamientos.
- No eliminar sin mostrar impacto.

## Nivel de riesgo

Nivel 5 - Escritura critica.

## Tipo de confirmacion

Confirmacion explicita reforzada, especialmente para baja.

## Auditoria requerida

- Usuario.
- Organizacion.
- Recurso padre.
- Subasignacion.
- Estado anterior.
- Estado nuevo o baja solicitada.
- Confirmacion.
- Respuesta de API Registro.

## Pruebas minimas

- Modificacion valida.
- Baja valida con confirmacion.
- Rechazo por permisos.
- Rechazo por estado no permitido.
- Rechazo por solapamiento.
- Error de API.

## Errores esperados

- Subasignacion no encontrada.
- Permiso insuficiente.
- Estado no permitido.
- Solapamiento.
- Error de validacion.
- Error de API.

## Criterios para pasar a produccion

- Estados permitidos confirmados.
- Confirmacion reforzada.
- Auditoria completa.
- Pruebas aprobadas.
- Procedimiento operativo y rollback definidos.
