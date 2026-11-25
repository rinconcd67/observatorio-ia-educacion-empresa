# Recorrido inicial de IA — revisión local

Fecha: 24 de noviembre de 2026. Estado: implementado y comprobado localmente; no publicado.

## Alcance

Recorrido bilingüe `empieza/` / `en/start/`: Entiende (3 min), Observa (3 min), Prueba (6 min), Verifica (3 min). Duraciones orientativas. Caso ficticio, dos inferencias sin respaldo, revisión escrita opcional, modelo de corrección y tres preguntas. Cierre con guías para docentes, empresas e investigación. No certificación ni evaluación automática del texto libre.

Accesos desde CTA de portada, tarjeta Quiero aprender, buscador y navegación de Biblioteca/Temas/Skills. La consulta «qué es la IA» devuelve el recorrido en primer lugar. Alternancia ES/EN y rutas relativas conservan el subdirectorio de GitHub Pages.

## Verificación

- `npm run build`: correcto; 136 URL en sitemap, 53 publicaciones y 4 fichas Skills.
- `npm run check`: 154 pruebas aprobadas, 0 fallos, 1 omitida por fuente raw no disponible; validación de datos aprobada. La ejecución comenzó antes de añadirse el archivo de seis pruebas del recorrido.
- Tras ajustes finales, `npm run package:library` y `node --test test/journey.test.mjs`: 6/6 aprobadas. Incluyen puertas de avance, respuestas incompletas/incorrectas, invalidación al editar y ausencia de almacenamiento/red en la actividad.
- Auditor independiente: 20/20 pruebas focales (recorrido, búsqueda y fallback) y revisión de contenido/rutas. Corregida atribución de escritura realizada cuando el campo es opcional.
- Navegador: recorrido completo ES y EN; casos vacíos e incorrectos ES, dos errores correctos, tres respuestas correctas, cierre, regreso, reinicio y recarga. Reinicio confirmado con cero inputs seleccionados y textarea vacío.
- Teclado: Continuar activado con Enter y foco transferido al encabezado del paso. No constituye auditoría WCAG completa.
- Vista de escritorio 1280 px y emulación 390 px: sin desbordamiento horizontal. Inspección visual de inicio ES/escritorio y EN/estrecho; actividad EN a 390 px comprobada mediante controles y dimensiones. No prueba en dispositivo físico.
- Consola del recorrido: sin errores ni advertencias observadas.
- Snapshot, baseline publicado y dashboard/artifact.json sin cambios respecto a Git. No se actualizaron cifras estadísticas.

## Evidencia visual

- `01-inicio.jpg`: captura completa del inicio ES (1280 px).
- `02-movil-en.jpg`: captura completa del inicio EN (390 px).
- `03-practica-movil-en.jpg`: actividad EN a 390 px, registro auxiliar.
- `vista-previa.jpg`: encuadre de portada del recorrido ES para revisión en pantalla.

La propuesta aprobada era un mapa conceptual. Se implementó su secuencia y sus rutas finales conservando la identidad del sitio; no se trató como una maqueta de página a reproducir píxel por píxel.

## Límites y siguiente paso

La duración de 15 minutos y los objetivos son estimaciones editoriales; no se midieron con usuarios. Este cambio no resuelve las demás recomendaciones del benchmark. Pendiente revisión del usuario y autorización de publicación del candidato completo. No commit, push, PR, merge ni despliegue.

## Corrección tras prueba del usuario: avance sin escritura

Esta revisión sustituye las condiciones de bloqueo descritas arriba. El usuario informó que la experiencia se trababa para quien no escribe. El campo era opcional en código, pero el avance exigía acertar y comprobar las selecciones. Se retiró el campo de escritura y se eliminó el bloqueo por respuestas vacías o incorrectas. «Ver ejemplo explicado» y «Ver respuestas explicadas» permiten aprender leyendo, sin atribuir aciertos al visitante. Cierre neutral, sin afirmar competencias demostradas.

Validación: 12/12 pruebas focales (journey + library-pages), empaquetado correcto, diff sin errores. Navegador: recorrido ES completo sin escribir ni seleccionar respuestas, consultando explicaciones; recorrido EN completo sin responder y tras comprobar selección vacía. Se verificó «Continuar» habilitado con cero selecciones. Captura actual: practica-sin-escribir.jpg. Sin publicación.
