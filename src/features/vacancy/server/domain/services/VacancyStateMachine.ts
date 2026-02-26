import type { VacancyStatusType } from "@features/vacancy/frontend/types/vacancy.types";

// ---------------------------------------------------------------------------
// Context — all data needed to evaluate guards
// ---------------------------------------------------------------------------

/** Context passed to each guard — all data needed for validation */
export interface VacancyTransitionContext {
  vacancy: {
    id: string;
    status: VacancyStatusType;
    salaryFixed: number | null;
    entryDate: string | null; // ISO string or null
    checklistValidatedAt: string | null; // ISO string or null
    rollbackCount: number;
  };
  /** Counts/flags loaded by the use case before calling the machine */
  attachments: {
    hasJobDescription: boolean; // count of JOB_DESCRIPTION attachments > 0
    hasValidatedPerfilMuestra: boolean; // count of PERFIL_MUESTRA with isValidated=true > 0
  };
  candidates: {
    inTernaCount: number;
    finalistCount: number;
  };
  /** For transitions requiring text input */
  input: {
    reason?: string | null;
    newTargetDeliveryDate?: string | null; // ISO string
  };
}

// ---------------------------------------------------------------------------
// Guard interface
// ---------------------------------------------------------------------------

/** Each guard returns a result */
export interface GuardResult {
  passes: boolean;
  reason?: string; // human-readable message shown to the user when it fails
}

export type TransitionGuard = (ctx: VacancyTransitionContext) => GuardResult;

// ---------------------------------------------------------------------------
// Guard functions — pure, named (so .name works for debugging)
// ---------------------------------------------------------------------------

function HasJobDescriptionGuard(ctx: VacancyTransitionContext): GuardResult {
  return {
    passes: ctx.attachments.hasJobDescription,
    reason: "Se requiere subir el Job Description antes de iniciar la búsqueda",
  };
}

function HasValidatedPerfilMuestraGuard(
  ctx: VacancyTransitionContext
): GuardResult {
  return {
    passes: ctx.attachments.hasValidatedPerfilMuestra,
    reason:
      "Se requiere al menos un Perfil Muestra validado por un administrador",
  };
}

function HasValidatedChecklistGuard(
  ctx: VacancyTransitionContext
): GuardResult {
  return {
    passes: ctx.vacancy.checklistValidatedAt !== null,
    reason:
      "El checklist debe ser validado por un administrador antes de iniciar la búsqueda",
  };
}

function HasCandidatesInTernaGuard(
  ctx: VacancyTransitionContext
): GuardResult {
  return {
    passes: ctx.candidates.inTernaCount > 0,
    reason: "Debe seleccionar al menos un candidato para la terna",
  };
}

function HasFinalistWithSalaryGuard(
  ctx: VacancyTransitionContext
): GuardResult {
  return {
    passes:
      ctx.candidates.finalistCount > 0 &&
      ctx.vacancy.salaryFixed !== null &&
      ctx.vacancy.entryDate !== null,
    reason:
      "Debe seleccionar un finalista con salario fijo y fecha de ingreso",
  };
}

function HasReasonGuard(ctx: VacancyTransitionContext): GuardResult {
  return {
    passes: !!(ctx.input.reason && ctx.input.reason.trim().length > 0),
    reason: "Debe registrar el motivo del cambio de estado",
  };
}

function HasRollbackDateGuard(ctx: VacancyTransitionContext): GuardResult {
  return {
    passes: !!(ctx.input.newTargetDeliveryDate),
    reason:
      "Debe establecer una nueva fecha tentativa de entrega para el nuevo ciclo",
  };
}

// ---------------------------------------------------------------------------
// Transition rules map
// ---------------------------------------------------------------------------

/** Map: from → to → guards[]
 *  If no entry exists for a transition, it's invalid (not in map)
 */
type TransitionRulesMap = Partial<
  Record<VacancyStatusType, Partial<Record<VacancyStatusType, TransitionGuard[]>>>
>;

const TRANSITION_RULES: TransitionRulesMap = {
  QUICK_MEETING: {
    HUNTING: [
      HasJobDescriptionGuard,
      HasValidatedPerfilMuestraGuard,
      HasValidatedChecklistGuard,
    ],
    STAND_BY: [HasReasonGuard],
    CANCELADA: [HasReasonGuard],
    PERDIDA: [HasReasonGuard],
  },
  HUNTING: {
    FOLLOW_UP: [HasCandidatesInTernaGuard],
    STAND_BY: [HasReasonGuard],
    CANCELADA: [HasReasonGuard],
    PERDIDA: [HasReasonGuard],
  },
  FOLLOW_UP: {
    HUNTING: [HasReasonGuard, HasRollbackDateGuard], // rollback
    PRE_PLACEMENT: [HasFinalistWithSalaryGuard],
    STAND_BY: [HasReasonGuard],
    CANCELADA: [HasReasonGuard],
    PERDIDA: [HasReasonGuard],
  },
  PRE_PLACEMENT: {
    PLACEMENT: [], // no extra guards — confirmed via confirmPlacement action
    HUNTING: [HasReasonGuard, HasRollbackDateGuard], // rollback
    STAND_BY: [HasReasonGuard],
    CANCELADA: [HasReasonGuard],
    PERDIDA: [HasReasonGuard],
  },
  PLACEMENT: {}, // terminal
  STAND_BY: {
    QUICK_MEETING: [],
    HUNTING: [],
    FOLLOW_UP: [],
    PRE_PLACEMENT: [],
    CANCELADA: [HasReasonGuard],
    PERDIDA: [HasReasonGuard],
  },
  CANCELADA: {}, // terminal
  PERDIDA: {}, // terminal
};

// ---------------------------------------------------------------------------
// Evaluator
// ---------------------------------------------------------------------------

export interface EvaluationResult {
  valid: boolean;
  failedGuard?: string; // guard function name, for logging
  reason?: string; // human message for the user
}

/**
 * The machine evaluator — runs guards in order, fails fast.
 * Pure function: no side effects, no I/O.
 */
export function evaluateTransition(
  from: VacancyStatusType,
  to: VacancyStatusType,
  ctx: VacancyTransitionContext
): EvaluationResult {
  // Check if transition is structurally valid (exists in map)
  const fromRules = TRANSITION_RULES[from];
  if (!fromRules || !(to in fromRules)) {
    return {
      valid: false,
      reason: `No se puede cambiar el estado de "${from}" a "${to}"`,
    };
  }

  const guards = fromRules[to] ?? [];
  for (const guard of guards) {
    const result = guard(ctx);
    if (!result.passes) {
      return { valid: false, failedGuard: guard.name, reason: result.reason };
    }
  }
  return { valid: true };
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Returns true if this is a rollback transition (→ HUNTING from FOLLOW_UP / PRE_PLACEMENT) */
export function isRollbackTransition(
  from: VacancyStatusType,
  to: VacancyStatusType
): boolean {
  return to === "HUNTING" && (from === "FOLLOW_UP" || from === "PRE_PLACEMENT");
}

/** Returns the list of valid next states from the current state */
export function getValidTransitions(
  from: VacancyStatusType
): VacancyStatusType[] {
  return Object.keys(TRANSITION_RULES[from] ?? {}) as VacancyStatusType[];
}
