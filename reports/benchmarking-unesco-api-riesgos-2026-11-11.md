# Informe de Benchmarking Internacional y Mejoras Estratégicas: Alineación UNESCO, Micro-API REST v1 y Taxonomía de Riesgos

**Observatorio Global de Inteligencia Artificial en Educación y Empresa (v0.5.0)**  
**Investigador Principal:** César David Rincón Godoy · [ORCID: 0009-0003-2112-3851](https://orcid.org/0009-0003-2112-3851)  
**Filiación Académica:** Broward International University  
**Soporte Tecnológico:** Google Antigravity (*Antigravity by Google*)  
**DOI Persistente:** [10.5281/zenodo.24140002](https://doi.org/10.5281/zenodo.24140002) · **Concept DOI:** [10.5281/zenodo.24140001](https://doi.org/10.5281/zenodo.24140001)  
**Fecha de Registro:** 11 de noviembre de 2026 · **Licencia:** Creative Commons Atribución 4.0 Internacional (CC-BY-4.0)

---

## 1. Resumen Ejecutivo

Este documento formaliza y registra la culminación de las tres fases estratégicas derivadas del **Benchmarking Internacional** realizado al *Observatorio Global de Inteligencia Artificial en Educación y Empresa*, contrastándolo contra los referentes multilaterales de mayor impacto global:
1. **UNESCO:** *Global Observatory on the Ethics of AI* y directrices de *UNESCO IESALC*.
2. **OCDE:** *OECD.AI Policy Observatory*.
3. **Stanford HAI:** *AI Index Report* y *Global AI Vibrancy Tool*.
4. **CEPAL / CENIA:** *Índice Latinoamericano de Inteligencia Artificial (ILIA)*.

El resultado posiciona al Observatorio en el **cuartil superior de reproducibilidad técnica, velocidad y rigor metodológico**, combinando la velocidad y seguridad de una arquitectura *serverless* estática con el cumplimiento estricto de los estándares internacionales de datos abiertos y gobernanza algorítmica.

---

## 2. Fase 1: Alineación Taxonómica UNESCO / ODS 4 y Estrategias Nacionales de IA (ENIA)

### 2.1. Taxonomía de Educación, Docentes y Competencias
* **Vista Educación (`shell.html` y `i18n.json`):**  
  Se actualizó el encabezado editorial y la metanavegación para vincular explícitamente los indicadores educativos con:
  * **ODS 4 (Educación de Calidad):** Meta 4.4 (aumento de jóvenes y adultos con competencias técnicas y profesionales) y Meta 4.c (oferta de docentes calificados).
  * **Recomendación sobre la Ética de la IA de la UNESCO (2021):** Ámbito de actuación sobre educación e investigación (Artículos 89 a 96), enfocado en la alfabetización crítica en IA, la formación docente continua y la salvaguarda de la agencia cognitiva del estudiante.
* **Insignia Oficial en el Expediente 360°:**  
  La primera tarjeta del expediente nacional adoptó la insignia bilingüe:  
  `ODS 4.4 / 4.c · UNESCO Ética Art. 89-96 · TALIS` (*ES*) / `SDG 4.4 / 4.c · UNESCO Ethics Art. 89-96 · TALIS` (*EN*).

### 2.2. Catálogo Maestro de Estrategias Nacionales de IA (ENIA)
Se implementó el archivo `src/content/national-ai-strategies.json` que sistematiza la información institucional de 15 países clave:
* **América Latina:** Colombia (`COL` - CONPES 3975 y Hoja de Ruta 2024), Chile (`CHL` - Política Nacional y primer informe RAM UNESCO de Sudamérica), Brasil (`BRA` - EBIA / PBIA 2024-2028), México (`MEX` - ANIA), Argentina (`ARG`), Uruguay (`URY` - Evaluación RAM pionera), Perú (`PER`), Costa Rica (`CRI`).
* **Europa y Norteamérica:** España (`ESP` - ENIA y Agencia AESIA), Estados Unidos (`USA` - Executive Order 14110 y NIST AI RMF), Reino Unido (`GBR` - National AI Strategy), Francia (`FRA` - Stratégie France 2030), Alemania (`DEU` - KI-Strategie).
* **Asia-Pacífico:** Japón (`JPN` - Proceso de Hiroshima G7), Singapur (`SGP` - NAIS 2.0 y AI Verify Foundation).

### 2.3. Cuarta Tarjeta en el Expediente 360° (`country-360-dossier`)
* Despliegue de los campos: Estrategia, Autoridad rectora, Estado de vigencia, Marco ético y Estado de la metodología RAM de UNESCO.
* Enlace dinámico directo a la comparativa de gobernanza e índices (`?view=governance`).
* Cuadrícula responsiva ampliada a 4 columnas en escritorio, 2x2 en tabletas y 1 columna en teléfonos inteligentes.

---

## 3. Fase 2: Micro-API REST v1 de Datos Abiertos para Investigadores

Con el objetivo de solventar la barrera de "datos atrapados en interfaces web", se diseñó y desplegó una arquitectura de API REST pública estática sin costo de infraestructura, altamente reproducible y lista para consumo automatizado en scripts de ciencia de datos:

### 3.1. Especificación de Endpoints
| Endpoint | Tipo | Descripción | Cobertura |
| :--- | :---: | :--- | :---: |
| `/api/v1/index.json` | JSON Schema | Especificación general, licencia CC-BY-4.0, DOI, autoría y ejemplos de código | Global |
| `/api/v1/countries.json` | Catálogo | Directorio estructurado con URLs a los endpoints individuales | 218 países |
| `/api/v1/countries/{iso3}.json` | Expediente | Expediente 360° normalizado por país con citación individual integrada | 218 archivos |
| `/api/v1/risk-taxonomy.json` | Taxonomía | Matriz armonizada de riesgos (EU AI Act, UNESCO, OCDE) | Global |

### 3.2. Estructura de Datos por País (`{iso3}.json`)
Cada endpoint contiene 6 bloques estandarizados:
1. `country`: Códigos ISO3/ISO2, denominación oficial en español e inglés, región geográfica y grupo de ingreso según el Banco Mundial.
2. `macro_indicators`: Puntuación y componentes del índice AIPI (FMI), índice de preparación gubernamental Oxford Insights 2025 (6 pilares) e indicadores de contexto (PIB per cápita, penetración de Internet y matrícula terciaria).
3. `sectoral_ai_adoption`: Adopción en empresas, educación formal, uso estudiantil, uso individual de GenAI y brecha empresa-educación.
4. `national_ai_strategy`: Metadata completa de la ENIA, autoridad y marco ético.
5. `complementary_evidence`: Microdatos docentes TALIS 2024, Cetic.br en escuelas básicas, aprendizajes PISA CIMA, gasto educativo UNESCO UIS y series de conectividad CEPALSTAT.
6. `author` y `citation`: Identificación académica, ORCID, DOI inmutable y texto de citación en formato APA/BibTeX.

---

## 4. Fase 3: Matriz de Taxonomía Global de Riesgos de IA

Se construyó una matriz conceptual y visual que armoniza el marco normativo vinculante más avanzado del mundo (**Reglamento UE 2024/1689 - EU AI Act**) con las directrices globales de la **UNESCO** y la **OCDE**, aterrizada específicamente a los ámbitos de **Educación** y **Empresa**:

1. **Riesgo Inaceptable (Prácticas Prohibidas - Art. 5 EU AI Act):**  
   Prohibición de reconocimiento de emociones en aulas y lugares de trabajo, y de puntuación social de menores.
2. **Alto Riesgo en Educación y Formación Profesional (Art. 6 & Anexo III Punto 3):**  
   Sistemas de admisión, evaluación del aprendizaje, exámenes y supervisión remota (*proctoring*). Obligación de auditoría de sesgo y supervisión humana (*human-in-the-loop*).
3. **Alto Riesgo en Empleo y Gestión Laboral (Art. 6 & Anexo III Punto 4):**  
   Cribado de candidaturas, entrevistas algorítmicas, asignación de turnos y evaluación de desempeño. Evaluación obligatoria de impacto en derechos fundamentales (FRIA).
4. **Riesgo Específico de Transparencia — IA Generativa y GPAI (Art. 50 & 53):**  
   Notificación obligatoria de agentes artificiales, preservación de la agencia y pensamiento crítico del estudiante, y marcado legible por máquina de contenidos sintéticos.

Esta taxonomía se expone de forma interactiva en la vista **Gobernanza** (`risk-taxonomy-grid`) y se distribuye como endpoint abierto en `/api/v1/risk-taxonomy.json`.

---

## 5. Trazabilidad de Ingeniería, Pruebas y Control de Cambios

### 5.1. Pull Requests Integrados en GitHub
* **PR #85 (`feat/unesco-sdg4-enia-alignment`):** Merge `19a991a` a `main`.
* **PR #86 (`feat/micro-api-risk-taxonomy`):** Merge `f2d683b` a `main`.

### 5.2. Métricas de Calidad de Código
* **Pruebas Automatizadas:** 152 pruebas unitarias e integrales aprobadas al 100% (`npm test`).
* **Validación Analítica:** `npm run validate` certifica la inmutabilidad de los 5.280 registros base, integridad de 218 países, huellas SHA-256 idénticas en contratos analíticos y empaquetado autocontenido bilingüe.
