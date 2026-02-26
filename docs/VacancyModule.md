# [cite_start]Documento de Especificación de Requerimientos: Sistema de Seguimiento de Vacantes [cite: 50]

## [cite_start]Notas de Alcance General [cite: 51]

- [cite_start]**Unipersonalidad:** Cada vacante creada en el sistema corresponde a una sola posición a cubrir (1 Vacante = 1 Contratación)[cite: 53]. [cite_start]No se gestionan vacantes multiposición en un solo registro[cite: 54].
- [cite_start]**Roles y Permisos (RBAC):** El sistema debe contar con un control de acceso basado en roles[cite: 55]. [cite_start]Ciertas acciones críticas (como "Validar Terna" o autorizar retrocesos de estado) requieren permisos de usuario específicos (ej. Manager o Líder de Reclutamiento), distintos al del Reclutador estándar[cite: 56].

---

## [cite_start]1. Módulo de Vacantes (Configuración y Campos) [cite: 57]

[cite_start]Se divide en información general y detalles específicos[cite: 57]. [cite_start]Casi todos los campos son obligatorios por defecto, salvo indicación contraria en la configuración[cite: 58].

| Categoría          | Campo                      | Regla / Detalle                                                                                                                |
| :----------------- | :------------------------- | :----------------------------------------------------------------------------------------------------------------------------- |
| **Identificación** | Posición (String)          | [cite_start]Nombre de la vacante (ej. Full Stack Developer)[cite: 59].                                                         |
|                    | Reclutador                 | [cite_start]Relación con usuarios existentes en el sistema[cite: 59].                                                          |
| **Condiciones**    | Cliente                    | [cite_start]Relación con Base de Datos de Clientes (ID de Leads) para evitar duplicados[cite: 59].                             |
|                    | Tipo de Venta              | **Automático:** "Recompra" si el ID del cliente ya tiene histórico; [cite_start]"Nueva" si es su primera compra[cite: 59, 60]. |
|                    | Salario (Número/Rango)     | Al inicio permite rangos. [cite_start]En _Pre-placement_ el monto debe ser cerrado y exacto[cite: 60].                         |
|                    | Comisiones/Bonos           | [cite_start]Descripción de bonos adicionales a la posición[cite: 60].                                                          |
|                    | Prestaciones               | [cite_start]Descripción de las prestaciones[cite: 60].                                                                         |
|                    | Herramientas               | [cite_start]Herramientas de trabajo necesarias[cite: 60].                                                                      |
| **Logística**      | Modalidad/Horario          | [cite_start]Presencial, remoto, híbrido y horario laboral específico[cite: 60].                                                |
|                    | Ubicación                  | [cite_start]Dirección física o ciudad base[cite: 60].                                                                          |
|                    | Psicometría (Boolean)      | [cite_start]Checkbox para indicar si requiere pruebas[cite: 60].                                                               |
| **Fechas**         | Fecha Asignación           | Automática: Timestamp al crear la vacante. [cite_start]Inicio del SLA[cite: 60].                                               |
|                    | Fecha Tentativa de Entrega | Fecha pactada con el cliente. [cite_start]Meta del SLA del semáforo[cite: 60].                                                 |
|                    | Fecha Real de Entrega      | [cite_start]Automática: Timestamp cuando un usuario con permisos valida la terna[cite: 60].                                    |

---

## [cite_start]2. Flujo de Estados y Automatización (Workflow) [cite: 61]

[cite_start]El sistema gestiona el cambio de estados basado en triggers automáticos y restringe movimientos manuales si no se cumplen los requisitos[cite: 62].

### 2.1. [cite_start]Estados Principales [cite: 63]

1.  [cite_start]**Quick Meeting (Estado Inicial):** Se activa al crear la vacante[cite: 64, 65]. [cite_start]Tiene un SLA de 24h (configurable) para entender la posición[cite: 66].
2.  [cite_start]**Hunting:** Se activa automáticamente al validar Checklist + Perfil muestra + Job Description + Detalles básicos[cite: 67, 68, 69]. [cite_start]Bloquea movimientos manuales sin estos requisitos[cite: 70].
3.  [cite_start]**Follow Up (Seguimiento):** Se activa mediante el trigger de **Validación de Terna**[cite: 71, 72]. [cite_start]Un usuario con permisos selecciona los candidatos a presentar al cliente (1 o más); esto registra la "Fecha Real de Entrega"[cite: 73, 74].
4.  [cite_start]**Pre-placement:** Requiere seleccionar al candidato finalista[cite: 77, 79]. [cite_start]Es obligatorio capturar el sueldo final cerrado (sin rangos) y la fecha exacta de ingreso[cite: 80, 81, 82, 83].
5.  [cite_start]**Placement (Contratación):** Al llegar la fecha de ingreso, el sistema lanza una alerta preguntando si el candidato ingresó[cite: 84, 85].
    - [cite_start]**Si:** Actualiza a Placement, confirma salario final y ofrece enviar correo de felicitaciones[cite: 87, 88]. [cite_start]Genera comisión el día 15 del mes siguiente[cite: 89].
    - [cite_start]**No:** Se mantiene en Pre-placement para definir siguientes pasos[cite: 90, 91].

### 2.2. [cite_start]Flujo de Retroceso (Rollback) [cite: 92, 94]

- [cite_start]**Escenario:** El candidato se cae o el cliente rechaza la terna[cite: 96].
- [cite_start]**Acción:** Un usuario con permisos autoriza el regreso al estado **Hunting**[cite: 97].
- [cite_start]**Requisitos:** Es obligatorio registrar el motivo del regreso en un diálogo[cite: 99, 100].
- [cite_start]**Impacto en SLA:** Se mantiene el registro de la primera entrega (histórico)[cite: 102]. [cite_start]Al regresar a Hunting, se solicita una **nueva Fecha Tentativa de Entrega** para un nuevo ciclo de semáforo[cite: 104, 105]. [cite_start]El sistema incrementa un **Contador de Intentos**[cite: 106].

---

## [cite_start]3. Gestión de Candidatos y Checklist [cite: 108]

### 3.1. [cite_start]Checklist de la Vacante [cite: 109]

[cite_start]Permite definir $N$ requisitos específicos (ej. "Inglés Intermedio")[cite: 110, 111].

### 3.2. [cite_start]Perfil del Candidato [cite: 112]

[cite_start]Incluye datos básicos, situación laboral detallada (empresa actual, sueldo bruto, expectativa, ubicación, etc.) y adjunto de CV en PDF[cite: 115, 116, 117, 118, 119].

### 3.3. [cite_start]Funcionalidad de Match Qualitativo [cite: 120]

[cite_start]Interfaz de comparación visual: a la izquierda los requisitos de la vacante y a la derecha campos de texto libre para feedback[cite: 121, 122, 123]. [cite_start]No es un puntaje automático, es una validación cualitativa del reclutador[cite: 124].

---

## [cite_start]4. Indicadores y Reglas de Negocio (SLA) [cite: 125]

- [cite_start]**Semáforo de Entrega:** Mide el desempeño basándose en la "Fecha Real de Entrega de Terna" contra la "Fecha Tentativa"[cite: 126, 133, 134].
- [cite_start]**Corte de Tiempo:** El cronómetro se detiene al presionar "Validar Terna" por primera vez[cite: 131].
- [cite_start]**Tiempo Total:** Se calcula desde la "Fecha de Asignación" hasta el "Placement", sin reiniciarse por retrocesos[cite: 138, 139].
- [cite_start]**Configuraciones:** Permite ajustar la obligatoriedad de campos y los tiempos de Quick Meeting por cliente[cite: 141, 142].

---

[cite_start]**ADJUNTOS:** Referencia de interfaz para validación cualitativa de requisitos (Checklist)[cite: 144, 145, 146].
