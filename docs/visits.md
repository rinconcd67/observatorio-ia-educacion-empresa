# Contador de páginas vistas — GoatCounter

Estado de entrega: adaptador local probado, configuración desactivada, cuenta pendiente de alta manual. No se han enviado visitas, creado cuentas ni aceptado términos durante estas pruebas. El widget permanece oculto mientras `enabled` sea `false`.

## Integración

Cargar `src/public/assets/visits-config.js` antes de `visits.js`. Ambos son scripts clásicos, utilizables como archivos externos con `defer` en ese orden o incorporados por los empaquetadores. El adaptador espera a `DOMContentLoaded` si hace falta.

Marcado mínimo (traducir rótulos para inglés):

```html
<section data-visits-widget hidden aria-label="Páginas vistas">
  <p>Total de páginas vistas: <strong data-visits-total></strong></p>
  <p>Este mes: <strong data-visits-month></strong></p>
  <p data-visits-period></p>
  <p data-visits-status role="status" aria-live="polite"></p>
</section>
```

Se admite más de un widget; una única carga de documento sigue generando una sola petición de conteo. Los cambios de filtros/vistas y el retorno desde caché de navegación no generan conteos adicionales. Recargar una página sí cuenta como otra página vista. No se mide personas únicas.

## Contrato de red

Fuentes oficiales revisadas el 2026-11-02:

- [Integración de navegador y parámetros estables de `/count`](https://www.goatcounter.com/help/pixel).
- [API JavaScript: `no_session`](https://www.goatcounter.com/help/js).
- [Cliente oficial actual](https://gc.zgo.at/count.js): `get_data()` traduce `no_session` a `ns`; `count()` utiliza POST mediante `sendBeacon` y GET como respaldo. Nuestro adaptador usa un único POST con `fetch`, sin respaldo ni reintento que pueda duplicar una aceptación incierta.
- [Contador público JSON](https://www.goatcounter.com/help/visitor-counter): `TOTAL`, parámetro `start`, respuesta `count` como cadena con separadores de miles, permiso explícito en ajustes y caché hasta cuatro horas.
- [Código del contador público](https://github.com/arp242/goatcounter/blob/main/handlers/vcounter.go), blob revisado `2db29db14a0bfc3cf500ae70dc789e5f00cd683c`: permite CORS en JSON y parsea las fechas como `AAAA-MM-DD`.
- [Consulta total en UTC](https://github.com/arp242/goatcounter/blob/main/hit_list.go): `SiteTotalUTC` suma desde `hour >= start`, hasta `hour <= end` cuando existe `end`.

Peticiones al subdominio configurado:

```text
POST https://CODIGO.goatcounter.com/count?p=RUTA_CANONICA&ns=true
GET  https://CODIGO.goatcounter.com/counter/TOTAL.json
GET  https://CODIGO.goatcounter.com/counter/TOTAL.json?start=AAAA-MM-01
```

El mes empieza a las 00:00 UTC del primer día y llega hasta la agregación disponible. Se **omite `end` deliberadamente**: `end=fecha-de-hoy` se interpreta como las 00:00 UTC inclusivas, excluyendo casi todo el día; poner el primer día siguiente podría incluir su hora inicial. La etiqueta muestra mes/año UTC; no se presenta como rango histórico cerrado.

El POST sólo contiene ruta canónica y `ns=true`. No incorpora query, fragmento, título, referrer ni pantalla. Se usa `credentials: omit` y `referrerPolicy: no-referrer` en todas las peticiones. Las respuestas JSON se validan antes de escribir mediante `textContent`; un fallo queda como «No disponible», nunca como cero. Un cero recibido y validado sí es una cifra real.

La respuesta opaca del POST no demuestra recepción. El frontend no intenta certificarla; el panel del servicio y la prueba posterior de producción deben comprobar el registro. Los GET y la lectura de su cuerpo tienen un plazo de seis segundos. No hay sondeo periódico ni reintentos automáticos.

## Condiciones previas a la activación

1. El propietario crea manualmente una cuenta de GoatCounter y comunica únicamente su código/subdominio público. Los [términos](https://www.goatcounter.com/help/terms) requieren que el alta inicial la haga una persona.
2. Usar un sitio dedicado exclusivamente al Observatorio. `TOTAL` incluye todas las rutas y eventos del sitio GoatCounter; no mezclar otras webs ni introducir eventos para que el rótulo «páginas vistas» conserve su significado.
3. Activar «Allow adding visitor counts on your website». Desactivar Sessions para coherencia con `no_session=true`, y desactivar métricas accesorias innecesarias (ubicación, idioma, navegador/sistema, pantalla, campañas/referrer y filas individuales). Comprobar los ajustes que el servicio ofrece realmente antes de marcarlos como realizados.
4. El contador `TOTAL` opera en UTC en el código oficial; establecer también la visualización del panel en UTC facilita la comparación. El formato del panel puede usar miles con coma, punto o espacio; nuestro adaptador valida y localiza la cifra.
5. Cambiar sólo `siteCode` y `enabled` en `visits-config.js`, reconstruir, probar la configuración y publicar dentro del alcance autorizado. No existe token privado en esta integración.
6. Abrir una página de producción y verificar el registro en el panel; los contadores públicos pueden tardar hasta cuatro horas. No inventar cifras anteriores a la fecha de activación ni exigir un incremento visible inmediato.

## Exclusiones y límites concretos

Sólo se activa en el origen exacto `https://rinconcd67.github.io` bajo `/observatorio-ia-educacion-empresa/`, en las familias de páginas públicas ES/EN conocidas. Localhost, otros repositorios, activos, descargas y 404 no se cuentan. DNT, Global Privacy Control, marcos y navegadores automatizados detectados se excluyen antes de cualquier petición; los documentos ocultos esperan a ser visibles. No usa cookies, almacenamiento local ni almacenamiento de sesión.

El proveedor recibe necesariamente la conexión de red. Su [política](https://www.goatcounter.com/help/privacy) explica las agregaciones y opciones de recogida. Bloqueadores y bots pueden afectar las cifras; no son personas únicas ni un censo completo. No se afirma que una petición aceptada equivalga a una persona. Este adaptador no añade protección contra manipulación del endpoint público por terceros.

## Validación local

```sh
node --test test/visits.test.mjs
```

Once pruebas, sin acceso a la red, comprueban configuración desactivada, restricción de origen/rutas, DNT/GPC, minimización de parámetros, una sola petición por documento, carga/visibilidad, mes UTC, formato de números, errores y timeout. La activación y recepción real siguen pendientes hasta disponer de la cuenta.
