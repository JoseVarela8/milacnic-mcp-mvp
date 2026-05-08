# Habilitacion futura de escritura - DNS reverso

Estado: documentacion preparatoria. No habilitado en el MVP inicial.

## Tools a habilitar

- `prepare_update_reverse_dns`
- `update_reverse_dns`

## Endpoints API v3 necesarios

- Endpoints reales de actualizacion de DNS reverso: pendientes de confirmar.
- Endpoint de lectura de configuracion actual.

## Permisos requeridos

- Usuario autenticado en MiLACNIC.
- Permiso de administracion DNS sobre el recurso.

## Validaciones obligatorias

- Recurso asociado a la organizacion del usuario.
- Nameservers validos.
- Formato DNS correcto.
- No borrar configuracion existente sin confirmacion.
- Verificar cambios contra estado actual.

## Nivel de riesgo

Nivel 5 - Escritura critica.

## Tipo de confirmacion

Confirmacion explicita reforzada.

## Auditoria requerida

- Usuario.
- Organizacion.
- Recurso.
- Configuracion anterior.
- Configuracion nueva.
- Confirmacion.
- Respuesta de API Registro.

## Pruebas minimas

- Actualizacion valida.
- Nameserver invalido.
- Recurso no autorizado.
- Cancelacion antes de confirmar.
- Error de API.

## Errores esperados

- Recurso no encontrado.
- Permiso insuficiente.
- Nameserver invalido.
- Error de validacion DNS.
- Error de API.

## Criterios para pasar a produccion

- Validaciones DNS confirmadas.
- Confirmacion reforzada.
- Auditoria completa.
- Pruebas aprobadas.
- Procedimiento operativo definido.
