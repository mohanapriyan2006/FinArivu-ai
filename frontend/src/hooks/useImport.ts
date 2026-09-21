import { useCallback, useEffect, useRef, useState } from 'react'

import {
  cancelImport,
  confirmImport,
  decideCandidate,
  getImportChanges,
  getImportPreview,
  listImports,
  uploadImport,
} from '@/services/ImportService'
import type {
  CandidateDecision,
  ImportCandidate,
  ImportPreview,
  ImportResult,
  ImportSummary,
} from '@/types/imports'

// ── History list (Import Center) ────────────────────────────────────────

export type ImportCenterState =
  | { kind: 'loading' }
  | { kind: 'ready'; items: ImportSummary[] }
  | { kind: 'error'; message: string }

export function useImportCenter() {
  const [state, setState] = useState<ImportCenterState>({ kind: 'loading' })
  const [isBusy, setIsBusy] = useState(false)
  const mounted = useRef(true)

  useEffect(() => {
    mounted.current = true
    return () => {
      mounted.current = false
    }
  }, [])

  const refresh = useCallback(async () => {
    setIsBusy(true)
    try {
      const items = await listImports()
      if (mounted.current) setState({ kind: 'ready', items })
    } catch (err) {
      if (mounted.current) {
        setState({
          kind: 'error',
          message:
            err instanceof Error ? err.message : 'Import history failed to load.',
        })
      }
    } finally {
      if (mounted.current) setIsBusy(false)
    }
  }, [])

  useEffect(() => {
    refresh()
  }, [refresh])

  /** Upload a document → returns the batchId to open in review. */
  const upload = useCallback(
    async (file: { uri: string; name: string; mimeType?: string; size?: number }) => {
      const preview = await uploadImport(file)
      await refresh()
      return preview.batch.id
    },
    [refresh],
  )

  return { state, items: state.kind === 'ready' ? state.items : [], isBusy, refresh, upload }
}

// ── Review (Import Review screen) ───────────────────────────────────────

export type ImportReviewState =
  | { kind: 'loading' }
  | { kind: 'ready'; preview: ImportPreview }
  | { kind: 'applying' }
  | { kind: 'applied'; result: ImportResult }
  | { kind: 'cancelled' }
  | { kind: 'error'; message: string }

export function useImportReview(batchId: string) {
  const [state, setState] = useState<ImportReviewState>({ kind: 'loading' })
  /** Non-fatal message surfaced alongside a ready preview (e.g. a stale
   * confirm that reloaded the candidates). */
  const [notice, setNotice] = useState<string | null>(null)
  const mounted = useRef(true)

  useEffect(() => {
    mounted.current = true
    return () => {
      mounted.current = false
    }
  }, [])

  const load = useCallback(async () => {
    try {
      const preview = await getImportPreview(batchId)
      if (!mounted.current) return
      if (
        preview.batch.status === 'APPLIED' ||
        preview.batch.status === 'PARTIALLY_APPLIED'
      ) {
        const result = await getImportChanges(batchId)
        if (mounted.current) setState({ kind: 'applied', result })
        return
      }
      if (preview.batch.status === 'CANCELLED') {
        setState({ kind: 'cancelled' })
        return
      }
      setState({ kind: 'ready', preview })
    } catch (err) {
      if (mounted.current) {
        setState({
          kind: 'error',
          message: err instanceof Error ? err.message : 'Review failed to load.',
        })
      }
    }
  }, [batchId])

  useEffect(() => {
    load()
  }, [load])

  const applyUpdated = useCallback((updated: ImportCandidate) => {
    setState((s) => {
      if (s.kind !== 'ready') return s
      return {
        kind: 'ready',
        preview: {
          ...s.preview,
          candidates: s.preview.candidates.map((c) =>
            c.id === updated.id ? { ...c, ...updated } : c,
          ),
        },
      }
    })
  }, [])

  const decide = useCallback(
    async (
      candidateId: string,
      decision?: CandidateDecision,
      editedValue?: unknown,
    ) => {
      try {
        const updated = await decideCandidate(batchId, candidateId, {
          decision,
          editedValue,
        })
        applyUpdated(updated as ImportCandidate)
        // Every decision rotates the confirm token server-side —
        // refresh so confirm() always sends the current one.
        const preview = await getImportPreview(batchId)
        if (mounted.current) setState({ kind: 'ready', preview })
        return updated
      } catch (err) {
        if (mounted.current) {
          setState({
            kind: 'error',
            message:
              err instanceof Error ? err.message : 'Could not update the candidate.',
          })
        }
        return null
      }
    },
    [applyUpdated, batchId],
  )

  const confirm = useCallback(async () => {
    if (state.kind !== 'ready') return null
    setState({ kind: 'applying' })
    try {
      const result = await confirmImport(
        batchId,
        state.preview.batch.confirmToken,
      )
      if (mounted.current) setState({ kind: 'applied', result })
      return result
    } catch (err) {
      if (mounted.current) {
        const message =
          err instanceof Error ? err.message : 'The import could not be applied.'
        // A stale preview means the underlying data changed — reload so the
        // user sees the fresh candidate set instead of an error dead-end.
        await load()
        setNotice(message)
        setState((s) => (s.kind === 'ready' ? s : { kind: 'error', message }))
      }
      return null
    }
  }, [batchId, state, load])

  const cancel = useCallback(async () => {
    try {
      await cancelImport(batchId)
      if (mounted.current) setState({ kind: 'cancelled' })
    } catch (err) {
      if (mounted.current) {
        setState({
          kind: 'error',
          message:
            err instanceof Error ? err.message : 'The import could not be cancelled.',
        })
      }
    }
  }, [batchId])

  return {
    state,
    preview: state.kind === 'ready' ? state.preview : null,
    notice,
    reload: load,
    decide,
    confirm,
    cancel,
  }
}
