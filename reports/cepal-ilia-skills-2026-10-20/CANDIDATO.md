# Candidato CEPAL, ILIA y Skills — 20 de octubre de 2026

**STATE | Iteración 2 | Memory Tag cargado.** Candidato local construido desde main `42097ff0d3c677271d103067509bfb58f05eb0e2`, en copia aislada `Observatorio_CEPAL_Candidato_2026-10-20`. No publicado. El checkout original conserva sus 175 archivos, estado Git y HEAD.

**PLAN completado.** Importación y catálogos implementados por separado; revisión crítica independiente; integración y QA del navegador en español, inglés y móvil. La autorización de esta fase cubre el candidato y sus validaciones.

## Qué puedes revisar

- [Tres series CEPAL](http://127.0.0.1:4182/?view=education#cepal-context).
- [Biblioteca](http://127.0.0.1:4182/biblioteca/) — filtrar organismo CEPAL.
- [Skills](http://127.0.0.1:4182/skills/).
- [Python, complemento técnico](http://127.0.0.1:4182/skills/santander-python-introduction/).

El servidor está limitado a 127.0.0.1; estos enlaces son una vista local de revisión, no una publicación web.

## Resultado implementado

| Incorporación | Resultado |
|---|---|
| CEPALSTAT 4052 | 1.532 registros, 16 países, 2000–2023, incluidos 132 agregados regionales |
| CEPALSTAT 4891 | 704 registros, 16 países, 2000–2023, incluidos 44 agregados regionales |
| CEPALSTAT 3816 | 869 registros, 36 países/territorios, 2007–2025, incluidos 44 agregados regionales y dos ausencias |
| Biblioteca | Dos documentos ILIA añadidos; total 28 fichas bilingües |
| Skills | Tres cursos de IA en español y Python como complemento; total 14 fichas, 12 en español y 2 en inglés |
| Páginas | 106 URL únicas en el sitemap; 38 corresponden a Skills |

Las tres API se recuperaron en vivo. Total: 3.105 registros, incluidos 220 agregados; 3.103 valores y dos ausencias explícitas. Los agregados permanecen separados de los países/territorios; las filas cuentan desagregaciones, no personas ni instituciones únicas. Los períodos no son paneles completos. No se calculan promedios propios ni se modifican los indicadores globales de adopción de IA.

Los dos valores recibidos como cero con nota 12256 se muestran como ausencia: Nicaragua/secundaria básica/2022 y Venezuela/primaria/2022. Se conserva el literal recibido y la nota de la fuente. La vista permite seleccionar serie, año, categoría y países/territorios frente a agregados; una selección sin filas no se presenta como cero.

Los nuevos documentos son ILIA 2025 Rev.1 y el complemento de fichas nacionales/metodología publicado en marzo de 2026. Declaran lectura de secciones seleccionadas, no íntegra, e incluyen fechas, símbolo de edición y enlace al PDF oficial. No se aloja el PDF. ILIA 2026 se menciona como nueva edición pendiente de revisión documental; sus cifras no se importan.

Los nuevos cursos son Cisco Introducción a la IA moderna (6h, insignia), Santander prompting responsable (8h), Santander Reglas de la IA (8h) y Python (8h). Todos se imparten en español y la formación es gratuita según las fuentes verificadas el 20/10. Se distinguen credenciales, cuentas, posibles costos de herramientas y oferta abierta hasta diciembre en Santander, sin inferir expiración del acceso. Python está identificado como complemento técnico en tarjetas y fichas ES/EN. Se preservan las diez fichas anteriores y las cuatro rutas.

## Validaciones ejecutadas

- `npm ci --no-audit --no-fund`: dependencias fijadas instaladas sólo en la copia.
- `npm run build`: correcto; HTML, catálogos, descargas y controles de sitemap generados.
- `npm run check`: **99 pruebas aprobadas, 0 fallos, 0 omitidas**, y validación de datos correcta. Para completar la integridad de datos antiguos se copiaron sólo en el candidato once archivos raw públicos de la copia anterior, después de verificar sus SHA-256 contra el registro versionado. Los raw siguen ignorados por Git.
- `npm run check:publication`: correcto para los indicadores globales; snapshot global y sus 5.280 observaciones permanecen idénticos. Este gate no sustituye las pruebas específicas de la capa CEPAL, los catálogos ni la decisión de publicación.
- `git diff --check`: correcto.
- HTTP local: **106/106 páginas devuelven 200**. Los JSON de datos, biblioteca y Skills servidos coinciden byte a byte con los procesados.
- Sitemap: 106 URL únicas bajo la subcarpeta autorizada; XML principal y copia idénticos; controles básico y de texto con el mismo inventario. No se envió nada a Search Console.
- Navegador: tres series, cambios de año/categoría, agregado regional, selección vacía, dos ausencias reales, filtro CEPAL en biblioteca, lectura ILIA ES/EN, filtros Skills y navegación desde tarjeta visible a Python.
- Móvil 390×844: fichas y panel CEPAL sin desbordamiento horizontal del documento; tablas con desplazamiento interno. Tamaño del navegador restablecido después de la prueba. Sin errores de consola observados.
- Fechas: consulta CEPAL mostrada con zona America/New_York; noticias, biblioteca y datos globales tienen fechas separadas para evitar atribuir a todos un refresco común.
- Preservación: inventario, SHA-256 de 175 archivos, estado Git y HEAD del checkout original idénticos a la referencia inicial de esta fase. La referencia detallada y capturas se mantienen fuera del repositorio.

## Límites y mantenimiento

Las fuentes son instantáneas fechadas, no consulta en tiempo real. `npm run import:cepal` permite recuperarlas manualmente; no se cambió el calendario de automatizaciones. No se ha cursado la formación ni probado una matrícula. La lectura completa de ILIA 2026 y las reservas de la propuesta no forman parte de estas incorporaciones. No se fusiona un índice ILIA con AIPI u Oxford.

**OUTPUT.** Candidato local listo para revisión humana; datos, documentos y formación visibles en ambas versiones.

**VERIFY | 9/10 para revisión del candidato.** Q1 y Q2 sin fallos críticos conocidos; se conservan límites de cobertura, lectura, herramientas y credenciales. La verificación pública y la indexación sólo podrán comprobarse después de una publicación autorizada.

**DECISION | FINAL de la preparación local.** Sin stage, commit, push, PR, despliegue ni solicitud de indexación. Próximo hito: revisión del candidato por el usuario y autorización específica de publicación.
