# Habilitacion futura de escritura - Subasignaciones

Estado: documentacion preparatoria. No habilitado en el MVP inicial.

## Tools a habilitar

- `validate_subassignment_candidate`
- `prepare_create_subassignment`
- `create_subassignment`
- `cancel_subassignment_draft`

## Endpoints API v3 necesarios

- Endpoint real de alta de subasignaciones: pendiente de confirmar con la API Registro v3.
- Endpoints de lectura de recurso padre y subasignaciones existentes.

## Permisos requeridos

- Usuario autenticado en MiLACNIC.
- Usuario asociado a la organizacion dueña del recurso padre.
- Rol autorizado para administrar recursos o subasignaciones.

## Validaciones obligatorias

- Organizacion asociada al usuario.
- Recurso padre existente.
- Estado del recurso padre compatible con subasignacion.
- CIDR valido IPv4 o IPv6.
- Subasignacion dentro del recurso padre.
- Sin solapamiento con subasignaciones existentes.
- Campos obligatorios completos.

## Nivel de riesgo

Nivel 4 - Escritura controlada.

## Tipo de confirmacion

Confirmacion explicita tipo B antes de ejecutar el alta.

## Auditoria requerida

- Usuario.
- Organizacion.
- Recurso padre.
- Datos propuestos.
- Resultado de validaciones.
- Confirmacion del usuario.
- Respuesta de API Registro.

## Pruebas minimas

- Alta valida.
- Rechazo por recurso padre invalido.
- Rechazo por solapamiento.
- Rechazo por falta de permisos.
- Cancelacion antes de confirmar.
- Error controlado de API Registro.

## Errores esperados

- Permiso insuficiente.
- Recurso no encontrado.
- CIDR invalido.
- Rango fuera del recurso padre.
- Solapamiento.
- Error de validacion de API.

## Criterios para pasar a produccion

- Confirmacion obligatoria implementada.
- Auditoria completa.
- Pruebas automatizadas aprobadas.
- Reglas de permisos confirmadas con MiLACNIC.
- Endpoint real confirmado con API Registro v3.
