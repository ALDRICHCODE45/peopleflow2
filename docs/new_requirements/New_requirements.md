# **Documentación de Proceso: Módulo de Facturación**

## **1\. Disparadores de Facturación (Triggers)**

La factura podrá generarse desde dos estados del proceso de reclutamiento:

- **Placement:** Estado estándar cuando el candidato es contratado.
- **Pre-placement:** Estado excepcional para casos donde el cliente requiere pagar antes del ingreso real del candidato.

## **2\. Definición de Tipos de Factura**

El sistema debe manejar tres tipos de escenarios de facturación:

- **A. Factura de Anticipo:**
  - Se emite para respaldar cualquier ingreso previo de dinero.
  - Internamente, el campo `Anticipo` se marca como `False` (ya que ella misma es el anticipo), pero el tipo de factura es "Anticipo".
- **B. Factura Full (Sin anticipo):**
  - Se emite por el total del servicio cuando no hubo pagos previos. El flujo es lineal y estándar.
- **C. Factura de Liquidación (Full con anticipo):**
  - Se emite cuando existe un anticipo previo.
  - **Regla de Negocio:** Al marcar el campo `Anticipo` como `True`, el sistema **debe obligar** al usuario a seleccionar una factura de tipo "Anticipo" previamente creada y pagada para vincular el monto.

## **3\. Reglas Fiscales e Impuestos**

- **IVA:**
  - **Tasa estándar:** 16%.
  - **Excepción:** Si la transacción es en **Dólares (USD)**, el IVA aplicado será **0%**.
- **Formas de Pago y Complementos:**
  - **PUE (Pago en Una Exhibición):** No requiere pasos adicionales tras el pago.
  - **PPD (Pago en Parcialidades o Diferido):**
    - **Validación obligatoria:** El sistema no permitirá cambiar el estatus a "Pagado" ni ingresar una "Fecha de Pago" si no se ha capturado previamente el **Complemento de Pago**. Se debe mostrar un mensaje de alerta: _"Esta factura es PPD; debe ingresar el complemento antes de actualizar el estado"_.

## **4\. Diccionario de Campos (Data Map)**

| Campo                            | Origen de Datos / Regla                                         |
| :------------------------------- | :-------------------------------------------------------------- |
| **Sueldo**                       | Proviene de la Vacante.                                         |
| **Fee**                          | Configurado en la ficha del Cliente.                            |
| **Anticipo (Monto)**             | Monto a descontar (proviene de la factura de anticipo elegida). |
| **IVA**                          | 16% (Default) o 0% (si es en USD).                              |
| **Subtotal**                     | `Sueldo * Fee`.                                                 |
| **Total (Valor Factura)**        | `(Subtotal + IVA) - Anticipo`.                                  |
| **Cliente / RFC / CP**           | Proviene de la ficha del Cliente.                               |
| **Ubicación / Nombre Comercial** | Proviene de la ficha del Cliente.                               |
| **Esquema**                      | Proviene del Cliente (100% al éxito o Anticipo).                |
| **Posición / Candidato**         | Proviene de la Vacante vinculada.                               |
| **Hunter / Reclutador**          | Usuario asignado a la Vacante.                                  |
| **Fecha de Emisión**             | Ingresada manualmente por el usuario.                           |
| **Fecha de Pago**                | Ingresada manualmente (Sujeta a validación de PPD).             |
| **Estatus**                      | Opciones: Cancelado, Pagado, Por Cobrar.                        |
| **Banco**                        | Ingreso manual del banco receptor del pago.                     |
| **Régimen / Figura**             | _Proviene de la ficha del cliente._                             |
