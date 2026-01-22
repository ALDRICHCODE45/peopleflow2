# Estructura del Módulo de Leads

El sistema de Leads se divide en tres niveles de profundidad: **Entidad Lead (Empresa)**, **Contactos (Personas)** e **Interacciones (Seguimiento)**.

---

## 1. Definición del Lead (Nivel Empresa)

Representa a la empresa prospectada y contiene la información general del lead.

| Campo                  | Tipo de Dato           | Obligatorio | Notas                                      |
| :--------------------- | :--------------------- | :---------: | :----------------------------------------- |
| **Nombre**             | Texto                  |     Sí      | Nombre de la empresa prospectada.          |
| **Status**             | Lista (Dropdown)       |     Sí      | Estado actual en el embudo de ventas.      |
| **Fecha de Creación**  | Fecha/Hora             | Automático  | Se genera al momento de crear el registro. |
| **Sector**             | Relación (Sectores)    |     Sí      | Categoría industrial principal.            |
| **Subsector**          | Relación (Subsectores) |     Sí      | Categoría específica del sector.           |
| **Origen**             | Relación (Orígenes)    |     Sí      | Canal de entrada (ej. LinkedIn).           |
| **Suborigen**          | Texto                  |     No      | Detalle (ej. nombre de campaña o post).    |
| **Enlace**             | URL                    |     No      | Sitio web o perfil de la empresa.          |
| **Generador Asignado** | Relación (Vendedor)    |     Sí      | Usuario responsable del lead.              |

### 🔄 Estados Disponibles (Workflow)

- **Contacto Cálido:** Primer acercamiento o interés detectado.
- **Social Selling:** Interacción activa en redes sociales.
- **Cita Agendada:** Reunión programada.
- **Cita Atendida:** Se realizó la reunión.
- **Cita Validada:** El prospecto cumple con el perfil ideal.
- **Posiciones Asignadas:** Inicio de proceso operativo/comercial.
- **Stand By:** Pausado temporalmente.

### 1.1 🕒 Historial de Cambios de Estado

Esta sección registra cada movimiento del lead de forma automática para medir el rendimiento. **No es editable por el usuario.**

- **Estado Anterior:** (Ej: Contacto Cálido).
- **Estado Nuevo:** (Ej: Cita Agendada).
- **Fecha del Cambio:** Sello de tiempo exacto.
- **Días de Permanencia:** Cálculo automático de días transcurridos.

> **Objetivo de Medición:** Generar reportes de KPI como: _"El vendedor X tarda en promedio 14 días en pasar de Cita Atendida a Cita Validada"_.

---

## 2. Sección de Contactos (Nivel Personas)

Dentro de cada Lead (Empresa), se registran los tomadores de decisión.

- **Nombre completo:** (Obligatorio)
- **Posición:** (Obligatorio) Cargo dentro de la empresa.
- **Correo electrónico:** (Obligatorio)
- **Número telefónico:** (Obligatorio)
- **Perfil de LinkedIn:** (Obligatorio) URL del perfil personal.

---

## 3. Seguimiento e Interacciones (Nivel Ejecución)

Bitácora de actividad individual por cada contacto.

- **Mensaje:** Texto detallado sobre el avance de la negociación.
- **Adjuntos:** Archivos o capturas de pantalla que respaldan la interacción.

> **💡 Ejemplo de uso:** Si un vendedor contacta a 3 personas y solo la "Persona B" responde, el historial permite que un nuevo vendedor retome la conversación con el contexto exacto y las pruebas (capturas) del contacto previo.

---

## Resumen de Reglas de Negocio

- **Integridad de Datos:** No se puede crear un lead sin sector, origen, nombre, status y vendedor.
- **Trazabilidad Total:** Cada interacción debe validarse preferentemente con un adjunto.
- **Jerarquía de Datos:** 1 Lead → N Contactos → N Interacciones.
