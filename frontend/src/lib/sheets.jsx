import { createContext, useCallback, useContext, useMemo, useState } from 'react'

/**
 * One sheet open at a time, app-wide. Pages and the command palette open forms with
 * openSheet('expense', existingExpense?) and the shell renders them.
 */
const SheetsContext = createContext(null)

export function SheetsProvider({ children }) {
  const [sheet, setSheet] = useState({ type: null, payload: null })

  const openSheet = useCallback((type, payload = null) => setSheet({ type, payload }), [])
  const closeSheet = useCallback(() => setSheet((s) => ({ type: null, payload: s.payload })), [])

  const value = useMemo(() => ({ sheet, openSheet, closeSheet }), [sheet, openSheet, closeSheet])
  return <SheetsContext.Provider value={value}>{children}</SheetsContext.Provider>
}

export function useSheets() {
  return useContext(SheetsContext)
}

/** Whether the sheet for `type` is currently editing the record with `id` (drives row→sheet morphs). */
export function useIsEditing(type, id) {
  const { sheet } = useSheets()
  return sheet.type === type && sheet.payload?.id === id
}
