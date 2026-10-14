import { Dialog } from '../ui/Overlay'
import { Kbd } from '../ui/Controls'
import { ALL_NAV } from './nav'

const GENERAL = [
  ['Search and commands', ['Ctrl', 'K']],
  ['New expense', ['N']],
  ['Collapse or expand sidebar', ['Ctrl', 'B']],
  ['Show shortcuts', ['?']],
  ['Close any panel', ['Esc']],
]

function Row({ label, keys }) {
  return (
    <div className="flex items-center justify-between py-1.5 text-sm">
      <span className="text-fg">{label}</span>
      <span className="flex gap-1">{keys.map((k) => <Kbd key={k}>{k}</Kbd>)}</span>
    </div>
  )
}

export default function ShortcutsDialog({ open, onOpenChange }) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange} title="Keyboard shortcuts" description="Plain-letter shortcuts are paused while you type in a field." width={520}>
      <div className="grid sm:grid-cols-2 gap-x-8">
        <div>
          <p className="text-xs text-muted mb-1">General</p>
          {GENERAL.map(([label, keys]) => <Row key={label} label={label} keys={keys} />)}
        </div>
        <div>
          <p className="text-xs text-muted mb-1 mt-4 sm:mt-0">Go to</p>
          {ALL_NAV.map((n) => <Row key={n.to} label={n.label} keys={['G', n.key.toUpperCase()]} />)}
        </div>
      </div>
    </Dialog>
  )
}
