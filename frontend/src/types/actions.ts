/**
 * Canonical contract for executable Copilot actions (Phase 1).
 *
 * Mirrors the backend `app/actions` schemas — the wire is camelCase.
 * `API_ACTION` suggested actions carry `{ operation, arguments }` in
 * `payload` and are routed through POST /v1/copilot/actions/preview.
 * Nothing here mutates data — confirmation is always explicit.
 */

export type ActionOperation =
  | 'CREATE_EXPENSE'
  | 'UPDATE_EXPENSE'
  | 'CREATE_BUDGET'
  | 'UPDATE_BUDGET'
  | 'CREATE_GOAL'
  | 'UPDATE_GOAL'
  | 'CREATE_INCOME'
  | 'UPDATE_INCOME'

export type ActionExecutionStatus =
  | 'PREVIEWED'
  | 'AWAITING_CONFIRMATION'
  | 'EXECUTING'
  | 'EXECUTED'
  | 'FAILED'
  | 'CANCELLED'
  | 'EXPIRED'
  | 'UNDONE'

/** Wire-level preview status — NEEDS_INPUT/NOT_SUPPORTED are never persisted. */
export type ActionPreviewStatus =
  | 'AWAITING_CONFIRMATION'
  | 'NEEDS_INPUT'
  | 'NOT_SUPPORTED'

export interface ActionFieldDiff {
  /** camelCase field names → values, displayed as before → after rows. */
  [field: string]: string | number | boolean | null
}

export interface ActionImpact {
  /** Deterministic engine metrics (before/after) + arithmetic deltas. */
  [key: string]: unknown
}

export interface ActionPreview {
  executionId: string | null
  operation: ActionOperation | null
  status: ActionPreviewStatus
  title: string
  entityName: string
  before: ActionFieldDiff | null
  after: ActionFieldDiff | null
  impact: ActionImpact
  affectedAreas: string[]
  requiresConfirmation: boolean
  expiresAt?: string | null
  missingFields: string[]
  clarificationQuestion?: string | null
  reason?: string
}

export interface ActionResult {
  executionId: string
  status: ActionExecutionStatus
  operation: ActionOperation
  title: string
  entityName: string
  result: {
    entityId: string | null
    before: ActionFieldDiff | null
    after: ActionFieldDiff | null
  }
  impact: ActionImpact
  affectedAreas: string[]
  undoAvailable: boolean
  message: string
}

export interface ActionHistoryItem {
  id: string
  operation: ActionOperation
  status: ActionExecutionStatus
  title: string
  entityName: string
  entityType: string | null
  createdAt: string | null
  executedAt: string | null
  undoAvailable: boolean
}

/** Payload shape carried by `SuggestedAction` chips of type API_ACTION. */
export interface ExecutableActionPayload {
  operation: ActionOperation
  arguments: Record<string, unknown>
}

export interface ActionPreviewRequest {
  operation: ActionOperation
  arguments: Record<string, unknown>
  sessionId?: string
}
