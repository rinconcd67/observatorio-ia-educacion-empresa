# Automatización con CI nativo del pull request

Estado: candidato local del 2 de noviembre de 2026. No activa credenciales ni publica contenido.

## Causa y cambio

Los workflows de actualización utilizaban `GITHUB_TOKEN` para enviar ramas y crear o actualizar PR. GitHub exige aprobación para los eventos `pull_request` originados por ese token. Un `workflow_dispatch` exitoso y un check manual llamado `validate` no eliminan ese bloqueo.

La corrección utiliza una GitHub App para los pushes y las operaciones de PR. CI se ejecuta por `pull_request`; los pushes a `main` siguen ejecutando CI. Se retiran el dispatch duplicado y los checks sintéticos. El guard comprueba el job nativo `validate`, el evento, el SHA actual y que el PR no haya cambiado durante la espera. No concede aprobación editorial ni autoriza merge o publicación.

Referencias verificadas:

- https://docs.github.com/en/actions/concepts/security/github_token
- https://github.com/actions/create-github-app-token (acción v3 fijada al commit `64ab729a6294000f5aa4a4bc0b73d1f32bc45510`).

## Preparación antes de integrar

1. Registrar o seleccionar una GitHub App dedicada a este repositorio. Permisos de repositorio: **Contents: Read and write**, **Pull requests: Read and write**; Metadata read implícito. No conceder administración, bypass de reglas, aprobación de workflows, ni permisos sobre otros repositorios.
2. Instalarla únicamente en `rinconcd67/observatorio-ia-educacion-empresa`.
3. Guardar su Client ID como variable de Actions `OBSERVATORY_APP_CLIENT_ID`; guardar la clave privada como secret de Actions `OBSERVATORY_APP_PRIVATE_KEY`. Nunca incluir la clave en Git, informes o mensajes.
4. Revisar e integrar el cambio siguiendo las reglas actuales de `main`. No debilitar el check requerido `validate` ni las aprobaciones de revisión.

La acción solicita un token temporal limitado al repositorio actual y a Contents/PR write, y lo revoca al terminar. `actions/checkout` usa ese token, por lo que los pushes tampoco usan accidentalmente `GITHUB_TOKEN`. Este último queda con permisos read y se usa únicamente para observar el CI. Falta de configuración detiene la rutina con un error explícito; no hay fallback al token que causó el incidente.

## Migración del PR #61

El PR existente fue creado por `github-actions[bot]`; no debe suponerse que cambiar la identidad de las futuras operaciones borra una aprobación pendiente histórica.

- Un mantenedor puede aprobar el workflow nativo pendiente del SHA actual y comprobar que `validate` termina correctamente. Esa aprobación de ejecución **no** es aprobación editorial para publicar titulares.
- Si se decide recrear la propuesta bajo la nueva App, hacerlo como una operación separada y revisada, preservando la trazabilidad del PR anterior. Este candidato no cierra ni recrea automáticamente el PR #61 para evadir su aprobación.
- Si no cambian los titulares, la rutina conserva la propuesta existente y verifica su CI. Un bloqueo histórico se informa aunque no haya novedades. No crea commits vacíos ni declara recuperación ficticia.

## Estados y aceptación

El guard admite hasta 120 observaciones espaciadas 10 segundos: 20 minutos de espera más latencia de API, frente a los 15 minutos máximos del job CI. Los jobs de actualización disponen de 40 minutos (titulares) y 45 (datos). Una cola excepcional puede agotar este presupuesto; se informa como **pendiente**, con salida no exitosa y sin fabricar un check fallido.

- `SIN_PR`: ninguna propuesta que validar; permitido para noticias sin novedades. En datos, tras crear el PR se exige su existencia.
- `SIN_EJECUCION` / `PENDIENTE_*`: falta CI del SHA o sigue en cola/ejecución; no es evidencia de pruebas fallidas.
- `ACTION_REQUIRED`: requiere intervención del mantenedor.
- `CI_TERMINADO_*`: conclusión nativa no exitosa.
- `SIN_VALIDATE_NATIVO`: falta el job exitoso esperado, o evento/SHA no coinciden.
- `PR_CAMBIO`: el PR cambió durante la observación; volver a verificar.
- `CI_NATIVO_APROBADO`: job `validate` exitoso del SHA actual, PR aún abierto e inalterado. Protecciones y revisión editorial permanecen separadas.

Prueba de aceptación remota posterior a configurar e integrar: una actualización sustantiva creada por la App debe producir un run `pull_request` nativo, sin `action_required`, y `validate` exitoso; comprobar el PR y sus reglas antes de cualquier merge. Repetir con titulares equivalentes y confirmar que no se genera un commit artificial. No confundir pruebas locales con esta aceptación remota pendiente.

La actualización mensual conserva sus puertas de integridad y cobertura. Errores de fuentes, fallos de validación o incapacidad de abrir el PR dejan la ejecución no exitosa; no se publican snapshots degradados.
