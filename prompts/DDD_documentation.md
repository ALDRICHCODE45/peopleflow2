**Cursor**

Para entidades complejas como `Vacancy` con 100+ campos y muchas reglas, no se maneja igual. Hay técnicas específicas para dominios complejos. Te explico:

## El problema con entidades gigantes

Si metes todo en una sola clase `Vacancy` con 100 campos y todas las reglas, tendrías:

```typescript
// ❌ MAL: Monolito gigante
class Vacancy {
  // 100+ campos...
  id: number;
  title: string;
  recruiterId: number;
  startDate: Date;
  endDate: Date;
  deliveryDate: Date;
  salary: number;
  fee: number;
  files: File[];
  candidates: Candidate[];
  // ... 90 campos más

  // 50+ métodos con lógica...
  assignRecruiter() { ... }
  addFile() { ... }
  addCandidate() { ... }
  validateDates() { ... }
  calculateFee() { ... }
  // ... 45 métodos más
}
```

Problemas:

- Clase difícil de mantener
- Responsabilidades mezcladas
- Difícil de testear
- Violación de Single Responsibility

## La solución: Domain-Driven Design (DDD)

Para dominios complejos, se aplican patrones de DDD:

### 1. Agregados (Aggregates) y Agregado Raíz (Aggregate Root)

Un Agregado agrupa entidades relacionadas. El Agregado Raíz controla el acceso y garantiza la consistencia.

```typescript
// Domain/entities/Vacancy.ts (Aggregate Root)
export class Vacancy {
  private readonly id: VacancyId;
  private recruiterId?: RecruiterId;
  private readonly files: VacancyFile[];
  private readonly candidates: Candidate[];
  private status: VacancyStatus;
  // ... otros campos

  constructor(
    id: VacancyId,
    private readonly title: VacancyTitle,
    private readonly salary: Salary,
    private readonly dates: VacancyDates,
    // ...
  ) {
    this.id = id;
    this.files = [];
    this.candidates = [];
    this.status = VacancyStatus.DRAFT;
  }

  // Solo métodos que mantienen la consistencia del agregado
  assignRecruiter(recruiterId: RecruiterId): void {
    // Validar reglas de negocio
    if (this.status !== VacancyStatus.DRAFT) {
      throw new Error(
        "Solo se puede asignar reclutador a vacantes en borrador",
      );
    }
    this.recruiterId = recruiterId;
    this.status = VacancyStatus.ASSIGNED;
  }

  addFile(file: VacancyFile): void {
    // Validar reglas del agregado
    if (this.files.length >= 10) {
      throw new Error("Máximo 10 archivos por vacante");
    }
    this.files.push(file);
  }

  addCandidate(candidate: Candidate): void {
    // Reglas de negocio
    if (!this.recruiterId) {
      throw new Error("Debe asignarse un reclutador primero");
    }
    this.candidates.push(candidate);
  }

  // Getters para acceso controlado
  getFiles(): ReadonlyArray<VacancyFile> {
    return [...this.files]; // Retornar copia
  }

  getCandidates(): ReadonlyArray<Candidate> {
    return [...this.candidates];
  }
}
```

### 2. Value Objects (Objetos de Valor)

Para campos complejos que tienen sus propias reglas, usa Value Objects:

```typescript
// Domain/value-objects/VacancyTitle.ts
export class VacancyTitle {
  private constructor(private readonly value: string) {
    if (!value || value.trim().length === 0) {
      throw new Error("El título no puede estar vacío");
    }
    if (value.length > 200) {
      throw new Error("El título no puede exceder 200 caracteres");
    }
  }

  static create(value: string): VacancyTitle {
    return new VacancyTitle(value);
  }

  getValue(): string {
    return this.value;
  }

  equals(other: VacancyTitle): boolean {
    return this.value === other.value;
  }
}

// Domain/value-objects/Salary.ts
export class Salary {
  private constructor(
    private readonly amount: number,
    private readonly currency: Currency,
  ) {
    if (amount <= 0) {
      throw new Error("El salario debe ser mayor a 0");
    }
  }

  static create(amount: number, currency: Currency): Salary {
    return new Salary(amount, currency);
  }

  getAmount(): number {
    return this.amount;
  }

  getCurrency(): Currency {
    return this.currency;
  }

  isGreaterThan(other: Salary): boolean {
    // Lógica de comparación considerando moneda
    return this.convertToUSD() > other.convertToUSD();
  }

  private convertToUSD(): number {
    // Lógica de conversión
    return this.amount * this.currency.getExchangeRate();
  }
}

// Domain/value-objects/VacancyDates.ts
export class VacancyDates {
  constructor(
    private readonly startDate: Date,
    private readonly endDate: Date,
    private readonly deliveryDate: Date,
  ) {
    this.validate();
  }

  private validate(): void {
    if (this.endDate <= this.startDate) {
      throw new Error("La fecha de fin debe ser posterior a la de inicio");
    }

    if (this.deliveryDate < this.startDate) {
      throw new Error("La fecha de entrega no puede ser anterior al inicio");
    }

    const maxDuration = 365; // días
    const duration =
      (this.endDate.getTime() - this.startDate.getTime()) /
      (1000 * 60 * 60 * 24);
    if (duration > maxDuration) {
      throw new Error("La duración máxima es 365 días");
    }
  }

  getStartDate(): Date {
    return new Date(this.startDate);
  }

  getEndDate(): Date {
    return new Date(this.endDate);
  }

  isActive(): boolean {
    const now = new Date();
    return now >= this.startDate && now <= this.endDate;
  }

  daysRemaining(): number {
    const now = new Date();
    if (now > this.endDate) return 0;
    return Math.ceil(
      (this.endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24),
    );
  }
}
```

### 3. Entidades dentro del Agregado

```typescript
// Domain/entities/VacancyFile.ts (Entidad dentro del agregado)
export class VacancyFile {
  constructor(
    private readonly id: FileId,
    private readonly name: string,
    private readonly url: string,
    private readonly type: FileType,
    private readonly uploadedAt: Date,
  ) {}

  getId(): FileId {
    return this.id;
  }

  getName(): string {
    return this.name;
  }

  // Lógica específica del archivo
  isPdf(): boolean {
    return this.type === FileType.PDF;
  }

  canBeDeleted(): boolean {
    // Reglas de negocio: no se pueden eliminar archivos después de X días
    const daysSinceUpload =
      (Date.now() - this.uploadedAt.getTime()) / (1000 * 60 * 60 * 24);
    return daysSinceUpload < 30;
  }
}

// Domain/entities/Candidate.ts (Entidad dentro del agregado)
export class Candidate {
  constructor(
    private readonly id: CandidateId,
    private readonly name: string,
    private readonly email: Email,
    private status: CandidateStatus,
    private readonly appliedAt: Date,
  ) {}

  // Lógica específica del candidato
  markAsInterviewed(): void {
    if (this.status !== CandidateStatus.APPLIED) {
      throw new Error("Solo candidatos aplicados pueden ser entrevistados");
    }
    this.status = CandidateStatus.INTERVIEWED;
  }

  reject(reason: string): void {
    this.status = CandidateStatus.REJECTED;
    // Podrías emitir un evento de dominio aquí
  }
}
```

### 4. Domain Services (Servicios de Dominio)

Para lógica que involucra múltiples agregados o no encaja en una sola entidad:

```typescript
// Domain/services/VacancyAssignmentService.ts
export class VacancyAssignmentService {
  constructor(
    private readonly vacancyRepository: IVacancyRepository,
    private readonly recruiterRepository: IRecruiterRepository,
  ) {}

  async assignRecruiterToVacancy(
    vacancyId: VacancyId,
    recruiterId: RecruiterId,
  ): Promise<void> {
    const vacancy = await this.vacancyRepository.findById(vacancyId);
    if (!vacancy) {
      throw new VacancyNotFoundError(vacancyId);
    }

    const recruiter = await this.recruiterRepository.findById(recruiterId);
    if (!recruiter) {
      throw new RecruiterNotFoundError(recruiterId);
    }

    // Validar reglas de negocio que involucran múltiples agregados
    const activeVacancies =
      await this.vacancyRepository.findByRecruiter(recruiterId);
    if (activeVacancies.length >= recruiter.getMaxVacancies()) {
      throw new Error("El reclutador ya tiene el máximo de vacantes asignadas");
    }

    // Lógica compleja que no pertenece a ninguna entidad individual
    if (!recruiter.hasRequiredSkills(vacancy.getRequiredSkills())) {
      throw new Error("El reclutador no tiene las habilidades requeridas");
    }

    // Delegar a la entidad
    vacancy.assignRecruiter(recruiterId);

    await this.vacancyRepository.save(vacancy);
  }
}
```

### 5. Casos de Uso (Orquestación)

```typescript
// Application/usecases/CreateVacancyUseCase.ts
export class CreateVacancyUseCase {
  constructor(
    private readonly vacancyRepository: IVacancyRepository,
    private readonly assignmentService: VacancyAssignmentService,
  ) {}

  async execute(dto: CreateVacancyDTO): Promise<VacancyDTO> {
    // 1. Validaciones de aplicación
    if (dto.salary <= 0) {
      throw new ValidationError("El salario debe ser mayor a 0");
    }

    // 2. Crear Value Objects
    const title = VacancyTitle.create(dto.title);
    const salary = Salary.create(dto.salary, Currency.USD);
    const dates = new VacancyDates(
      dto.startDate,
      dto.endDate,
      dto.deliveryDate,
    );

    // 3. Crear Agregado Raíz
    const vacancy = new Vacancy(
      VacancyId.generate(),
      title,
      salary,
      dates,
      // ... otros parámetros
    );

    // 4. Si hay reclutador, usar Domain Service
    if (dto.recruiterId) {
      await this.assignmentService.assignRecruiterToVacancy(
        vacancy.getId(),
        dto.recruiterId,
      );
    }

    // 5. Persistir
    await this.vacancyRepository.save(vacancy);

    // 6. Convertir y retornar
    return VacancyMapper.toDTO(vacancy);
  }
}
```

## Estructura de carpetas para dominios complejos

```
src/domain/
├── entities/
│   ├── Vacancy.ts (Aggregate Root)
│   ├── VacancyFile.ts (Entidad dentro del agregado)
│   └── Candidate.ts (Entidad dentro del agregado)
├── value-objects/
│   ├── VacancyTitle.ts
│   ├── Salary.ts
│   ├── VacancyDates.ts
│   ├── Email.ts
│   └── Currency.ts
├── services/
│   ├── VacancyAssignmentService.ts
│   └── FeeCalculationService.ts
├── repositories/
│   └── IVacancyRepository.ts
└── events/
    └── VacancyAssignedEvent.ts (para eventos de dominio)
```

## Resumen: diferencias clave

| Aspecto      | Entidad Simple (Todo)           | Entidad Compleja (Vacancy)                                    |
| ------------ | ------------------------------- | ------------------------------------------------------------- |
| Estructura   | Una clase con campos primitivos | Agregado con Value Objects y Entidades anidadas               |
| Lógica       | Métodos simples en la entidad   | Lógica distribuida: Entidad + Value Objects + Domain Services |
| Campos       | 5-10 campos primitivos          | 100+ campos agrupados en Value Objects                        |
| Relaciones   | Referencias simples             | Agregados con entidades anidadas                              |
| Validaciones | En la entidad o caso de uso     | En Value Objects y Domain Services                            |
| Persistencia | Una tabla                       | Múltiples tablas (Vacancy, VacancyFiles, Candidates)          |

## Principios clave

1. Aggregate Root: `Vacancy` controla todo el agregado
2. Value Objects: Encapsulan validaciones y comportamientos
3. Domain Services: Para lógica que cruza agregados
4. Inmutabilidad: Value Objects y entidades inmutables cuando sea posible
5. Encapsulación: No exponer arrays internos directamente, usar métodos

## ¿Cuándo aplicar cada enfoque?

- Entidad simple: 5-15 campos, pocas reglas → Todo (como ahora)
- Entidad compleja: 50+ campos, muchas reglas, múltiples relaciones → Agregados + Value Objects + Domain Services

Para tu sistema de RH con `Vacancy`, definitivamente aplica DDD con Agregados, Value Objects y Domain Services. ¿Quieres que profundice en algún patrón específico o que muestre más ejemplos?

```typescript
// ❌ MAL: Monolito gigante
class Vacancy {
  // 100+ campos...
  id: number;
  title: string;
  recruiterId: number;
  startDate: Date;
  endDate: Date;
  deliveryDate: Date;
  salary: number;
  fee: number;
  files: File[];
  candidates: Candidate[];
  // ... 90 campos más

  // 50+ métodos con lógica...
  assignRecruiter() { ... }
  addFile() { ... }
  addCandidate() { ... }
  validateDates() { ... }
  calculateFee() { ... }
  // ... 45 métodos más
}
```

```typescript
// Domain/entities/Vacancy.ts (Aggregate Root)
export class Vacancy {
  private readonly id: VacancyId;
  private recruiterId?: RecruiterId;
  private readonly files: VacancyFile[];
  private readonly candidates: Candidate[];
  private status: VacancyStatus;
  // ... otros campos

  constructor(
    id: VacancyId,
    private readonly title: VacancyTitle,
    private readonly salary: Salary,
    private readonly dates: VacancyDates,
    // ...
  ) {
    this.id = id;
    this.files = [];
    this.candidates = [];
    this.status = VacancyStatus.DRAFT;
  }

  // Solo métodos que mantienen la consistencia del agregado
  assignRecruiter(recruiterId: RecruiterId): void {
    // Validar reglas de negocio
    if (this.status !== VacancyStatus.DRAFT) {
      throw new Error(
        "Solo se puede asignar reclutador a vacantes en borrador",
      );
    }
    this.recruiterId = recruiterId;
    this.status = VacancyStatus.ASSIGNED;
  }

  addFile(file: VacancyFile): void {
    // Validar reglas del agregado
    if (this.files.length >= 10) {
      throw new Error("Máximo 10 archivos por vacante");
    }
    this.files.push(file);
  }

  addCandidate(candidate: Candidate): void {
    // Reglas de negocio
    if (!this.recruiterId) {
      throw new Error("Debe asignarse un reclutador primero");
    }
    this.candidates.push(candidate);
  }

  // Getters para acceso controlado
  getFiles(): ReadonlyArray<VacancyFile> {
    return [...this.files]; // Retornar copia
  }

  getCandidates(): ReadonlyArray<Candidate> {
    return [...this.candidates];
  }
}
```

```typescript
// Domain/value-objects/VacancyTitle.ts
export class VacancyTitle {
  private constructor(private readonly value: string) {
    if (!value || value.trim().length === 0) {
      throw new Error("El título no puede estar vacío");
    }
    if (value.length > 200) {
      throw new Error("El título no puede exceder 200 caracteres");
    }
  }

  static create(value: string): VacancyTitle {
    return new VacancyTitle(value);
  }

  getValue(): string {
    return this.value;
  }

  equals(other: VacancyTitle): boolean {
    return this.value === other.value;
  }
}

// Domain/value-objects/Salary.ts
export class Salary {
  private constructor(
    private readonly amount: number,
    private readonly currency: Currency,
  ) {
    if (amount <= 0) {
      throw new Error("El salario debe ser mayor a 0");
    }
  }

  static create(amount: number, currency: Currency): Salary {
    return new Salary(amount, currency);
  }

  getAmount(): number {
    return this.amount;
  }

  getCurrency(): Currency {
    return this.currency;
  }

  isGreaterThan(other: Salary): boolean {
    // Lógica de comparación considerando moneda
    return this.convertToUSD() > other.convertToUSD();
  }

  private convertToUSD(): number {
    // Lógica de conversión
    return this.amount * this.currency.getExchangeRate();
  }
}

// Domain/value-objects/VacancyDates.ts
export class VacancyDates {
  constructor(
    private readonly startDate: Date,
    private readonly endDate: Date,
    private readonly deliveryDate: Date,
  ) {
    this.validate();
  }

  private validate(): void {
    if (this.endDate <= this.startDate) {
      throw new Error("La fecha de fin debe ser posterior a la de inicio");
    }

    if (this.deliveryDate < this.startDate) {
      throw new Error("La fecha de entrega no puede ser anterior al inicio");
    }

    const maxDuration = 365; // días
    const duration =
      (this.endDate.getTime() - this.startDate.getTime()) /
      (1000 * 60 * 60 * 24);
    if (duration > maxDuration) {
      throw new Error("La duración máxima es 365 días");
    }
  }

  getStartDate(): Date {
    return new Date(this.startDate);
  }

  getEndDate(): Date {
    return new Date(this.endDate);
  }

  isActive(): boolean {
    const now = new Date();
    return now >= this.startDate && now <= this.endDate;
  }

  daysRemaining(): number {
    const now = new Date();
    if (now > this.endDate) return 0;
    return Math.ceil(
      (this.endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24),
    );
  }
}
```

```typescript
// Domain/entities/VacancyFile.ts (Entidad dentro del agregado)
export class VacancyFile {
  constructor(
    private readonly id: FileId,
    private readonly name: string,
    private readonly url: string,
    private readonly type: FileType,
    private readonly uploadedAt: Date,
  ) {}

  getId(): FileId {
    return this.id;
  }

  getName(): string {
    return this.name;
  }

  // Lógica específica del archivo
  isPdf(): boolean {
    return this.type === FileType.PDF;
  }

  canBeDeleted(): boolean {
    // Reglas de negocio: no se pueden eliminar archivos después de X días
    const daysSinceUpload =
      (Date.now() - this.uploadedAt.getTime()) / (1000 * 60 * 60 * 24);
    return daysSinceUpload < 30;
  }
}

// Domain/entities/Candidate.ts (Entidad dentro del agregado)
export class Candidate {
  constructor(
    private readonly id: CandidateId,
    private readonly name: string,
    private readonly email: Email,
    private status: CandidateStatus,
    private readonly appliedAt: Date,
  ) {}

  // Lógica específica del candidato
  markAsInterviewed(): void {
    if (this.status !== CandidateStatus.APPLIED) {
      throw new Error("Solo candidatos aplicados pueden ser entrevistados");
    }
    this.status = CandidateStatus.INTERVIEWED;
  }

  reject(reason: string): void {
    this.status = CandidateStatus.REJECTED;
    // Podrías emitir un evento de dominio aquí
  }
}
```

```typescript
// Domain/services/VacancyAssignmentService.ts
export class VacancyAssignmentService {
  constructor(
    private readonly vacancyRepository: IVacancyRepository,
    private readonly recruiterRepository: IRecruiterRepository,
  ) {}

  async assignRecruiterToVacancy(
    vacancyId: VacancyId,
    recruiterId: RecruiterId,
  ): Promise<void> {
    const vacancy = await this.vacancyRepository.findById(vacancyId);
    if (!vacancy) {
      throw new VacancyNotFoundError(vacancyId);
    }

    const recruiter = await this.recruiterRepository.findById(recruiterId);
    if (!recruiter) {
      throw new RecruiterNotFoundError(recruiterId);
    }

    // Validar reglas de negocio que involucran múltiples agregados
    const activeVacancies =
      await this.vacancyRepository.findByRecruiter(recruiterId);
    if (activeVacancies.length >= recruiter.getMaxVacancies()) {
      throw new Error("El reclutador ya tiene el máximo de vacantes asignadas");
    }

    // Lógica compleja que no pertenece a ninguna entidad individual
    if (!recruiter.hasRequiredSkills(vacancy.getRequiredSkills())) {
      throw new Error("El reclutador no tiene las habilidades requeridas");
    }

    // Delegar a la entidad
    vacancy.assignRecruiter(recruiterId);

    await this.vacancyRepository.save(vacancy);
  }
}
```

```typescript
// Application/usecases/CreateVacancyUseCase.ts
export class CreateVacancyUseCase {
  constructor(
    private readonly vacancyRepository: IVacancyRepository,
    private readonly assignmentService: VacancyAssignmentService,
  ) {}

  async execute(dto: CreateVacancyDTO): Promise<VacancyDTO> {
    // 1. Validaciones de aplicación
    if (dto.salary <= 0) {
      throw new ValidationError("El salario debe ser mayor a 0");
    }

    // 2. Crear Value Objects
    const title = VacancyTitle.create(dto.title);
    const salary = Salary.create(dto.salary, Currency.USD);
    const dates = new VacancyDates(
      dto.startDate,
      dto.endDate,
      dto.deliveryDate,
    );

    // 3. Crear Agregado Raíz
    const vacancy = new Vacancy(
      VacancyId.generate(),
      title,
      salary,
      dates,
      // ... otros parámetros
    );

    // 4. Si hay reclutador, usar Domain Service
    if (dto.recruiterId) {
      await this.assignmentService.assignRecruiterToVacancy(
        vacancy.getId(),
        dto.recruiterId,
      );
    }

    // 5. Persistir
    await this.vacancyRepository.save(vacancy);

    // 6. Convertir y retornar
    return VacancyMapper.toDTO(vacancy);
  }
}
```

```plaintext
src/domain/
├── entities/
│   ├── Vacancy.ts (Aggregate Root)
│   ├── VacancyFile.ts (Entidad dentro del agregado)
│   └── Candidate.ts (Entidad dentro del agregado)
├── value-objects/
│   ├── VacancyTitle.ts
│   ├── Salary.ts
│   ├── VacancyDates.ts
│   ├── Email.ts
│   └── Currency.ts
├── services/
│   ├── VacancyAssignmentService.ts
│   └── FeeCalculationService.ts
├── repositories/
│   └── IVacancyRepository.ts
└── events/
    └── VacancyAssignedEvent.ts (para eventos de dominio)
```
