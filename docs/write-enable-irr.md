# Habilitacion futura de escritura - IRR

Estado: documentacion preparatoria. No habilitado en el MVP inicial.

## Tools a habilitar

- `prepare_create_irr_object`
- `create_irr_object`
- `prepare_update_irr_object`
- `update_irr_object`
- `prepare_delete_irr_object`
- `delete_irr_object`

## Endpoints API v3 necesarios

- Endpoints reales de creacion, actualizacion y eliminacion IRR: pendientes de confirmar.
- Endpoint de lectura de objetos IRR existentes.

## Permisos requeridos

- Usuario autenticado en MiLACNIC.
- Permiso de administracion IRR sobre la organizacion o recurso.

## Validaciones obligatorias

- Tipo de objeto permitido.
- Sintaxis IRR valida.
- Recurso u organizacion asociados al usuario.
- No duplicar objetos existentes.
- Confirmar impacto antes de eliminar.

## Nivel de riesgo

Nivel 5 - Escritura critica.

## Tipo de confirmacion

Confirmacion explicita reforzada.

## Auditoria requerida

- Usuario.
- Organizacion.
- Objeto IRR.
- Accion solicitada.
- Estado anterior.
- Estado nuevo.
- Confirmacion.
- Respuesta de API Registro.

## Pruebas minimas

- Crear objeto valido.
- Rechazar sintaxis invalida.
- Rechazar recurso no autorizado.
- Actualizar objeto valido.
- Eliminar objeto con confirmacion.
- Error de API.

## Errores esperados

- Sintaxis invalida.
- Objeto duplicado.
- Objeto no encontrado.
- Permiso insuficiente.
- Error de API.

## Criterios para pasar a produccion

- Tipos de objeto soportados definidos.
- Validaciones confirmadas con el dominio IRR.
- Confirmacion reforzada.
- Auditoria completa.
- Pruebas aprobadas.
