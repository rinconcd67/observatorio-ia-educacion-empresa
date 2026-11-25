# Observatorios y redes: curación de fuentes externas

Fecha de revisión: 24 de noviembre de 2026, America/New_York.
Alcance: lectura de páginas primarias institucionales y de extractos de documentación. No se realizó lectura integral de todos los informes enlazados. No se contactó a ninguna institución ni se estableció asociación alguna.

## Resultado

Cuatro altas propuestas en `new-directory-items.json`, con el esquema de cada item de `src/content/official-sources.json`. Obvia e IFE son observatorios; Scientific AI Hub y AI Index se clasifican como investigación para no convertir un hub o programa de medición en un observatorio formal. Los registros existentes se conservan. El JSON no modifica el directorio principal.

| Fuente | Foco y valor complementario | Integración viable ahora | Vía pública de colaboración y límites |
|---|---|---|---|
| [Obvia](https://www.obvia.ca/collaborations) | Impactos sociales, éticos y ambientales; investigación y recursos para enseñanza superior y empresas. | Enlace institucional y reseñas propias de recursos concretos. API/RSS y licencia general no verificados. | `collaboration@obvia.ca`, publicado para proyectos, talleres y alianzas en [colaboraciones](https://www.obvia.ca/collaborations) y [contacto](https://www.obvia.ca/nous-joindre). Disponibilidad o costos sujetos a la institución. |
| [Observatorio IFE](https://observatorio.tec.mx/) | Innovación educativa en español e inglés; docencia, integridad académica y educación superior. | Enlaces a artículos, reportes y webinars con tipo de contenido y fecha. No equiparar opinión con investigación de impacto. API/RSS/licencia específica no verificados. | `observatorio@itesm.mx`, contacto publicado en [Acerca de](https://observatorio.tec.mx/acerca/). No se verificó convocatoria formal de membresía. |
| [JRC Scientific AI Hub](https://knowledge-for-policy.ec.europa.eu/scientific-ai-hub_en) | Estudios de adopción, investigación científica, sector público y supervisión. Fuente actual del JRC. | Enlaces a estudios y herramientas; extracción estadística requiere revisar cada metodología. API/RSS/licencia específica no verificados. | Formulario de contacto del hub. [Evento del 6 de noviembre de 2026](https://knowledge-for-policy.ec.europa.eu/event/scientific-ai-hub-bridging-ai-innovation-scientific-excellence_en) publicó `JRC-humaint@ec.europa.eu`; evento ya pasado, no convocatoria vigente. |
| [Stanford HAI AI Index](https://hai.stanford.edu/ai-index) | Evidencia transversal; edición 2026 incluye capítulos de educación, economía y gobernanza. | [Informe 2026](https://hai.stanford.edu/ai-index/2026-ai-index-report) con enlace a datos públicos. Reutilización exige revisar cada fuente original. | [Contacto oficial](https://hai.stanford.edu/contact-us): `hai-institute@stanford.edu`; educación: `hai-education@stanford.edu`. No implica acceso o afiliación a su programa. |

La portada Obvia y `/en/` devolvieron 403 al lector web; `/collaborations` y `/nous-joindre` fueron accesibles, por lo que se propone el enlace funcional verificado. Esto documenta el alcance de la consulta y no demuestra indisponibilidad general del sitio. Stanford y Scientific AI Hub se revisaron en sus páginas oficiales vigentes; no se copiaron sus gráficos o logotipos.

## Corrección de AI Watch

URL primaria recomendada: https://knowledge-for-policy.ec.europa.eu/projects-activities/ai-watch_en

La fuente institucional declara que el proyecto fue operativo entre 2018 y 2022 y que sus paneles no actualizan datos desde 2020. Identifica Scientific AI Hub como referencia para investigaciones recientes. Las fechas recientes de catalogación de publicaciones no actualizan los años de sus datos.

Título ES: AI Watch · Archivo europeo

Descripción ES: Proyecto del JRC operativo entre 2018 y 2022 sobre capacidades, políticas y adopción de IA en Europa. Sus paneles conservan datos sin actualizar desde 2020. Para investigaciones recientes, consultar Scientific AI Hub.

Título EN: AI Watch · European archive

Descripción EN: A JRC project active from 2018 to 2022 covering AI capacity, policies and uptake in Europe. Its dashboards retain data that have not been updated since 2020. For recent research, consult Scientific AI Hub.

## Oportunidades en fuentes ya incorporadas

- **UNESCO:** [Global CSO and Academic Network on AI Ethics and Policy](https://www.unesco.org/ethics-ai/en/civil-society-organizations?hub=48) ofrece un marco de colaboración para sociedad civil e instituciones académicas, con cinco subgrupos. No se verificó inscripción abierta actual; una posible participación debe presentarse como oportunidad, no membresía.
- **OECD.AI:** [Partners](https://oecd.ai/en/about/partners) invita a interesados en contribuir; [contacto](https://oecd.ai/en/contact): `ai@oecd.org`. Sus [condiciones](https://www.oecd.org/en/about/terms-conditions.html) distinguen documentos, datos y derechos de terceros. Enlazar fuentes no equivale a obtener una asociación ni permiso para utilizar logotipos.
- **CENIA/CEPAL ILIA:** [comunicado del 20 de octubre de 2026](https://www.cepal.org/es/comunicados/ilia-2026-america-latina-caribe-debe-apropiarse-la-inteligencia-artificial-generar-valor) confirma la cuarta edición y cobertura de 20 países. Advierte comparabilidad parcial con la edición previa y que las cifras de adopción empresarial son estimaciones econométricas. [Descargables](https://indicelatam.cl/descargables/) y [visualizador](https://indicelatam.cl/visualizador-de-datos/) son vías públicas; API y licencia de redistribución no verificadas. No sustituir la ficha existente sin cotejar identificador y edición.

## Reutilización y límites

- El [PDF del AI Index 2026](https://hai.stanford.edu/assets/files/ai_index_report_2026.pdf) declara Attribution-NoDerivatives 4.0 International para el informe. El acceso público a sus datos no demuestra una licencia homogénea para datos de terceros; mantener atribución por indicador y fuente.
- Las condiciones OCDE permiten determinados usos de datos con atribución, salvo restricciones adicionales; no extrapolar esto a todas las series de sus proveedores. No se verificó un endpoint específico de OECD.AI para automatizar ingestión.
- No se habilitó feed, API, suscripción, registro, envío o contacto. En la interfaz, estas entidades deben describirse como fuentes externas; cualquier asociación formal exige evidencia separada.

## Priorización editorial propuesta

1. IFE: utilidad inmediata para docentes y lectura en español.
2. Scientific AI Hub: actualización de la referencia europea y contexto sectorial.
3. Obvia: ampliación de enfoque social y posibilidad explícita de investigación conjunta.
4. Stanford AI Index: referencia global complementaria, con control de periodos y metodologías.

Verificación: siete fuentes/redes examinadas (cuatro altas, tres ya existentes), páginas primarias de las cuatro altas accesibles en las URLs elegidas, corrección histórica AI Watch verificada. No se auditó exhaustivamente la totalidad de cada catálogo, licencias individuales o disponibilidad de alianzas.
