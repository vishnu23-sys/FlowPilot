import toast from 'react-hot-toast'
import apiClient, { API_URL, errorMessage } from '../api/apiClient'
import { invalidateFinance } from '../api/queries'

const UNDO_MS = 5000
const pending = new Map()
let flushBound = false

/** Send any deletes still waiting on their undo window before the page goes away. */
function bindFlush() {
  if (flushBound) return
  flushBound = true
  window.addEventListener('pagehide', () => {
    const token = localStorage.getItem('token')
    for (const [key, job] of pending) {
      clearTimeout(job.timer)
      fetch(`${API_URL}${job.url}`, {
        method: job.method,
        keepalive: true,
        headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
        body: job.body ? JSON.stringify(job.body) : undefined,
      })
      pending.delete(key)
    }
  })
}

function UndoToast({ t, message, onUndo }) {
  return (
    <div className="flex items-center gap-4">
      <span>{message}</span>
      <button
        type="button"
        className="text-accent font-medium hover:underline underline-offset-2"
        onClick={() => { onUndo(); toast.dismiss(t.id) }}
      >
        Undo
      </button>
    </div>
  )
}

/**
 * Remove items from a cached list immediately and only call the API after the undo window.
 * `ids` are removed from the query at `queryKey` (an array of {id}).
 */
export function deleteWithUndo({ qc, queryKey, ids, message, url, method = 'DELETE', body }) {
  bindFlush()
  const snapshot = qc.getQueryData(queryKey)
  const idSet = new Set(ids)
  qc.setQueryData(queryKey, (list) => (Array.isArray(list) ? list.filter((x) => !idSet.has(x.id)) : list))

  const key = `${url}:${ids.join(',')}`
  const restore = () => {
    clearTimeout(pending.get(key)?.timer)
    pending.delete(key)
    qc.setQueryData(queryKey, snapshot)
  }

  const timer = setTimeout(async () => {
    pending.delete(key)
    try {
      await apiClient.request({ url, method, data: body })
      invalidateFinance(qc)
    } catch (err) {
      qc.setQueryData(queryKey, snapshot)
      toast.error(errorMessage(err, "Couldn't delete. It's been restored."))
    }
  }, UNDO_MS)
  pending.set(key, { timer, url, method, body })

  toast((t) => <UndoToast t={t} message={message} onUndo={restore} />, { duration: UNDO_MS, id: key })
}
