# Módulo de Leads - Documentación Técnica

## Resumen

El módulo de Leads implementa un sistema de gestión de prospectos comerciales siguiendo los principios de **Domain-Driven Design (DDD)**. Este documento explica la arquitectura, patrones utilizados y cómo extender el sistema.

---

## Arquitectura DDD

### Estructura de Capas

```
src/features/Leads/
├── server/
│   ├── domain/           # Capa de Dominio (núcleo del negocio)
│   ├── application/      # Capa de Aplicación (casos de uso)
│   ├── infrastructure/   # Capa de Infraestructura (repositorios)
│   └── presentation/     # Capa de Presentación (server actions)
└── frontend/             # UI Components y Hooks
```

### Flujo de Datos

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│   Frontend  │ ──▶ │   Server    │ ──▶ │  Use Case   │ ──▶ │ Repository  │
│  Component  │     │   Action    │     │             │     │             │
└─────────────┘     └─────────────┘     └─────────────┘     └─────────────┘
       ▲                                       │                    │
       │                                       ▼                    ▼
       │                               ┌─────────────┐     ┌─────────────┐
       └────────────────────────────── │   Domain    │     │   Prisma    │
                                       │   Entity    │     │     DB      │
                                       └─────────────┘     └─────────────┘
```

---

## Capa de Dominio

### Lead como Aggregate Root

El **Lead** es el Aggregate Root del módulo. Esto significa que:

1. **Controla la consistencia** de todas sus entidades hijas (Contact, Interaction)
2. **Es el único punto de entrada** para modificar el agregado
3. **Garantiza las invariantes de negocio** del agregado completo

```typescript
// src/features/Leads/server/domain/entities/Lead.ts

export class Lead {
  private readonly _id: string;
  private _companyName: string;
  private _status: LeadStatusVO;
  private _contacts: Contact[];
  // ... más propiedades

  // El Lead controla la adición de contactos
  public addContact(contactData: ContactCreateData): void {
    const contact = Contact.create(contactData);
    this._contacts.push(contact);
  }

  // El Lead controla los cambios de estado con validaciones
  public changeStatus(newStatus: LeadStatusType): void {
    if (!this._status.canTransitionTo(newStatus)) {
      throw new Error(
        `Transición no válida: ${this._status.value} → ${newStatus}`,
      );
    }
    this._status = LeadStatusVO.create(newStatus);
  }

  // Getters inmutables para proteger el estado
  public getContacts(): ReadonlyArray<Contact> {
    return [...this._contacts];
  }
}
```

### Value Objects

Los Value Objects encapsulan validaciones y lógica de dominio. Cada VO sigue el patrón:

- Constructor privado
- Método estático `create()` que lanza error si la validación falla
- Método `getValue()` para obtener el valor primitivo
- Método `equals()` para comparar VOs

```
src/features/Leads/server/domain/value-objects/
├── index.ts              # Re-export de todos los VOs
├── LeadStatus.ts         # Estado del lead + transiciones válidas
├── CompanyName.ts        # Nombre de empresa (2-200 chars)
├── RFC.ts                # RFC mexicano (max 13 chars, nullable)
├── URL.ts                # URLs (max 500 chars, nullable)
├── Email.ts              # Email con validación regex (nullable)
├── PersonName.ts         # Nombre + Apellido (2-100 chars c/u)
├── InteractionType.ts    # Enum de tipos de interacción
└── InteractionSubject.ts # Asunto de interacción (2-200 chars)
```

**Ejemplo de uso en Use Cases:**

```typescript
// Antes (validaciones hardcoded en el Use Case)
if (companyName.length < 2) {
  return { success: false, error: "El nombre..." };
}

// Después (validaciones encapsuladas en VOs)
try {
  const companyName = CompanyNameVO.create(input.companyName);
  const rfc = RFCVO.create(input.rfc);
  const email = EmailVO.create(input.email);
  // Los VOs lanzan errores descriptivos si la validación falla
} catch (error) {
  return { success: false, error: error.message };
}
```

**LeadStatusVO** - Controla las transiciones de estado válidas:

```typescript
export class LeadStatusVO {
  private static readonly VALID_TRANSITIONS: Record<
    LeadStatusType,
    LeadStatusType[]
  > = {
    CONTACTO_CALIDO: ["SOCIAL_SELLING", "CITA_AGENDADA", "STAND_BY"],
    SOCIAL_SELLING: ["CITA_AGENDADA", "STAND_BY"],
    CITA_AGENDADA: ["CITA_ATENDIDA", "STAND_BY"],
    CITA_ATENDIDA: ["CITA_VALIDADA", "STAND_BY"],
    CITA_VALIDADA: ["POSICIONES_ASIGNADAS", "STAND_BY"],
    POSICIONES_ASIGNADAS: ["STAND_BY"],
    STAND_BY: ["CONTACTO_CALIDO", "SOCIAL_SELLING"],
  };

  public canTransitionTo(newStatus: LeadStatusType): boolean {
    return LeadStatusVO.VALID_TRANSITIONS[this._value].includes(newStatus);
  }
}
```

### Entidades del Agregado

**Contact** e **Interaction** son entidades que pertenecen al agregado Lead:

- Tienen identidad propia (ID)
- Solo pueden ser accedidas a través del Aggregate Root
- Su ciclo de vida está ligado al Lead

```typescript
// Jerarquía del Agregado
Lead (Aggregate Root)
├── Contact (Entity)
│   └── Interaction (Entity) - asociada al Contact
└── LeadStatusHistory (Entity) - historial de cambios
```

---

## Capa de Aplicación (Use Cases)

Los casos de uso orquestan la lógica de negocio y **siempre usan repositorios**:

```typescript
// src/features/Leads/server/application/use-cases/UpdateLeadStatusUseCase.ts

export class UpdateLeadStatusUseCase {
  constructor(
    private readonly leadRepository: ILeadRepository,
    private readonly historyRepository: ILeadStatusHistoryRepository,
  ) {}

  async execute(input: UpdateLeadStatusInput): Promise<UpdateLeadStatusOutput> {
    // 1. Obtener el Lead (vía repositorio, NUNCA Prisma directo)
    const lead = await this.leadRepository.findById(
      input.leadId,
      input.tenantId,
    );
    if (!lead) {
      return { success: false, error: "Lead no encontrado" };
    }

    // 2. Validar transición en el dominio
    const oldStatus = lead.status;
    if (!LeadStatusVO.create(oldStatus).canTransitionTo(input.newStatus)) {
      return { success: false, error: "Transición de estado no válida" };
    }

    // 3. Actualizar (vía repositorio)
    const updatedLead = await this.leadRepository.updateStatus(
      input.leadId,
      input.tenantId,
      input.newStatus,
    );

    // 4. Crear historial para KPIs (vía repositorio)
    await this.historyRepository.create({
      leadId: input.leadId,
      tenantId: input.tenantId,
      previousStatus: oldStatus,
      newStatus: input.newStatus,
      changedById: input.userId,
    });

    return { success: true, lead: updatedLead };
  }
}
```

### Regla Crítica: Siempre Usar Repositorios

```typescript
// ❌ INCORRECTO - Nunca llamar a Prisma directamente
const lead = await prisma.lead.create({ data: {...} });

// ✅ CORRECTO - Siempre usar el repositorio
const lead = await this.leadRepository.create(leadData);
```

**¿Por qué?**

- Desacopla el dominio de la infraestructura
- Facilita testing con mocks
- Permite cambiar la base de datos sin afectar la lógica de negocio
- Centraliza las queries y mapeos

---

## Capa de Infraestructura (Repositorios)

Los repositorios implementan las interfaces del dominio y manejan Prisma:

```typescript
// src/features/Leads/server/infrastructure/repositories/PrismaLeadRepository.ts

export class PrismaLeadRepository implements ILeadRepository {
  async findById(id: string, tenantId: string): Promise<Lead | null> {
    const data = await prisma.lead.findFirst({
      where: { id, tenantId, isDeleted: false },
      include: {
        sector: true,
        subsector: true,
        origin: true,
        assignedTo: true,
        createdBy: true,
        contacts: true,
      },
    });

    if (!data) return null;

    // Mapear de Prisma a Entidad de Dominio
    return this.toDomain(data);
  }

  private toDomain(data: PrismaLead): Lead {
    return Lead.reconstitute({
      id: data.id,
      companyName: data.companyName,
      status: data.status as LeadStatusType,
      // ... mapeo completo
    });
  }
}
```

---

## Capa de Presentación (Server Actions)

Los Server Actions son el punto de entrada desde el frontend:

```typescript
// src/features/Leads/server/presentation/actions/lead.actions.ts

"use server";

export async function updateLeadStatusAction(
  leadId: string,
  newStatus: LeadStatus,
): Promise<UpdateLeadStatusResult> {
  // 1. Verificar autenticación
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) {
    return { error: "No autenticado", lead: undefined };
  }

  // 2. Verificar permisos
  const permissionCheck = await new CheckAnyPermissonUseCase().execute({
    userId: session.user.id,
    tenantId: session.session.activeOrganizationId!,
    permissions: [
      PermissionActions.leads.editar,
      PermissionActions.leads.gestionar,
    ],
  });

  if (!permissionCheck.hasPermission) {
    return { error: "Sin permisos", lead: undefined };
  }

  // 3. Ejecutar caso de uso
  const useCase = new UpdateLeadStatusUseCase(
    new PrismaLeadRepository(),
    new PrismaLeadStatusHistoryRepository(),
  );

  const result = await useCase.execute({
    leadId,
    newStatus,
    tenantId: session.session.activeOrganizationId!,
    userId: session.user.id,
  });

  // 4. Retornar resultado
  if (!result.success) {
    return { error: result.error ?? "Error desconocido", lead: undefined };
  }

  return { error: null, lead: result.lead };
}
```

---

## Historial de Estados para KPIs

Cada cambio de estado se registra automáticamente en `LeadStatusHistory`:

```typescript
// Modelo en Prisma
model LeadStatusHistory {
  id             String     @id @default(cuid())
  leadId         String
  lead           Lead       @relation(fields: [leadId], references: [id])
  previousStatus LeadStatus
  newStatus      LeadStatus
  changedById    String
  changedBy      User       @relation(fields: [changedById], references: [id])
  tenantId       String
  tenant         Tenant     @relation(fields: [tenantId], references: [id])
  createdAt      DateTime   @default(now())
}
```

**Casos de uso para KPIs:**

- Tiempo promedio en cada etapa del funnel
- Tasa de conversión entre estados
- Leads que pasaron a "Stand By" y luego reactivados
- Velocidad de avance por vendedor

---

## Multi-Tenancy

Todas las entidades incluyen `tenantId` para aislamiento de datos:

```typescript
// Cada query filtra por tenantId
const leads = await prisma.lead.findMany({
  where: {
    tenantId: session.session.activeOrganizationId,
    isDeleted: false,
  },
});
```

Los catálogos (Sector, Subsector, LeadOrigin) soportan:

- `tenantId = null` → Catálogo global (disponible para todos)
- `tenantId = "xxx"` → Catálogo específico del tenant

---

## Extender el Sistema de Archivos

El módulo incluye stubs preparados para DigitalOcean Spaces:

```typescript
// src/core/shared/services/file-upload/file-upload.service.ts

export class FileUploadService implements IFileUploadService {
  async upload(file: File, config: UploadConfig): Promise<UploadResult> {
    // TODO: Implementar conexión a DigitalOcean Spaces
    // 1. Configurar cliente S3-compatible
    // 2. Generar nombre único para el archivo
    // 3. Subir al bucket
    // 4. Guardar metadata en tabla Attachment
    // 5. Retornar URL pública o presignada
  }
}
```

**Para implementar:**

1. Instalar SDK de AWS S3 (compatible con DO Spaces):

   ```bash
   bun add @aws-sdk/client-s3 @aws-sdk/s3-request-presigner
   ```

2. Configurar variables de entorno:

   ```env
   DO_SPACES_KEY=tu_key
   DO_SPACES_SECRET=tu_secret
   DO_SPACES_ENDPOINT=nyc3.digitaloceanspaces.com
   DO_SPACES_BUCKET=tu_bucket
   ```

3. Implementar el servicio real reemplazando los stubs

---

## Estructura de Archivos Completa

```
src/features/Leads/
├── server/
│   ├── domain/
│   │   ├── entities/
│   │   │   ├── Lead.ts              # Aggregate Root
│   │   │   ├── Contact.ts
│   │   │   └── Interaction.ts
│   │   ├── value-objects/
│   │   │   ├── index.ts             # Re-export de todos los VOs
│   │   │   ├── LeadStatus.ts        # Estado + transiciones
│   │   │   ├── CompanyName.ts       # 2-200 chars
│   │   │   ├── RFC.ts               # max 13 chars, nullable
│   │   │   ├── URL.ts               # max 500 chars, nullable
│   │   │   ├── Email.ts             # regex validation, nullable
│   │   │   ├── PersonName.ts        # firstName + lastName
│   │   │   ├── InteractionType.ts   # enum validation
│   │   │   └── InteractionSubject.ts # 2-200 chars
│   │   └── interfaces/
│   │       ├── ILeadRepository.ts
│   │       ├── IContactRepository.ts
│   │       ├── IInteractionRepository.ts
│   │       ├── ICatalogRepository.ts
│   │       └── ILeadStatusHistoryRepository.ts
│   ├── application/
│   │   └── use-cases/
│   │       ├── CreateLeadUseCase.ts
│   │       ├── UpdateLeadUseCase.ts
│   │       ├── DeleteLeadUseCase.ts
│   │       ├── GetLeadByIdUseCase.ts
│   │       ├── GetPaginatedLeadsUseCase.ts
│   │       ├── UpdateLeadStatusUseCase.ts
│   │       ├── AddContactToLeadUseCase.ts
│   │       ├── UpdateContactUseCase.ts
│   │       ├── DeleteContactUseCase.ts
│   │       ├── GetContactsByLeadUseCase.ts
│   │       ├── AddInteractionUseCase.ts
│   │       ├── GetInteractionsByLeadUseCase.ts
│   │       ├── GetSectorsUseCase.ts
│   │       ├── GetSubsectorsBySectorUseCase.ts
│   │       └── GetLeadOriginsUseCase.ts
│   ├── infrastructure/
│   │   └── repositories/
│   │       ├── PrismaLeadRepository.ts
│   │       ├── PrismaContactRepository.ts
│   │       ├── PrismaInteractionRepository.ts
│   │       ├── PrismaLeadStatusHistoryRepository.ts
│   │       └── PrismaCatalogRepository.ts
│   └── presentation/
│       └── actions/
│           ├── lead.actions.ts
│           ├── getPaginatedLeadsAction.action.ts
│           ├── contact.actions.ts
│           ├── interaction.actions.ts
│           └── catalog.actions.ts
└── frontend/
    ├── types/
    │   └── index.ts
    ├── hooks/
    │   ├── useLeads.ts
    │   ├── usePaginatedLeadsQuery.ts
    │   ├── useContacts.ts
    │   ├── useInteractions.ts
    │   └── useCatalogs.ts
    ├── components/
    │   ├── LeadStatusBadge.tsx
    │   ├── LeadSheetForm.tsx
    │   ├── LeadForm.tsx
    │   ├── LeadDetailSheet.tsx
    │   ├── DeleteLeadAlertDialog.tsx
    │   ├── ContactsSection.tsx
    │   ├── ContactForm.tsx
    │   ├── InteractionsTimeline.tsx
    │   ├── InteractionForm.tsx
    │   ├── columns/
    │   │   ├── LeadColumns.tsx
    │   │   └── LeadRowActions.tsx
    │   └── tableConfig/
    │       ├── LeadsTableConfig.tsx
    │       ├── LeadsTableFilters.tsx
    │       ├── hooks/
    │       │   └── useLeadsTableFilters.ts
    │       └── types/
    │           └── leadStatusOptions.ts
    └── pages/
        └── LeadsListPage.tsx
```

---

## Comandos Útiles

```bash
# Generar cliente Prisma
bun run prisma:generate

# Reset de BD (desarrollo)
bunx prisma migrate reset --force

# Crear migración
bunx prisma migrate dev --name "add_lead_management_module"

# Ejecutar seed
bunx prisma db seed

# Build de producción
bun run build
```

---

## Permisos Utilizados

Los permisos ya existían en el sistema:

```typescript
PermissionActions.leads.acceder; // "leads:acceder"
PermissionActions.leads.crear; // "leads:crear"
PermissionActions.leads.editar; // "leads:editar"
PermissionActions.leads.eliminar; // "leads:eliminar"
PermissionActions.leads.gestionar; // "leads:gestionar"
```

---

## Workflow de Estados

```
┌─────────────────┐
│ CONTACTO_CALIDO │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ SOCIAL_SELLING  │◄──────────────────┐
└────────┬────────┘                   │
         │                            │
         ▼                            │
┌─────────────────┐                   │
│ CITA_AGENDADA   │                   │
└────────┬────────┘                   │
         │                            │
         ▼                            │
┌─────────────────┐    ┌──────────┐   │
│ CITA_ATENDIDA   │───▶│ STAND_BY │───┘
└────────┬────────┘    └──────────┘
         │
         ▼
┌─────────────────┐
│ CITA_VALIDADA   │
└────────┬────────┘
         │
         ▼
┌─────────────────────┐
│ POSICIONES_ASIGNADAS│
└─────────────────────┘
```

Desde cualquier estado se puede pasar a STAND_BY, y desde STAND_BY se puede reactivar a CONTACTO_CALIDO o SOCIAL_SELLING.
