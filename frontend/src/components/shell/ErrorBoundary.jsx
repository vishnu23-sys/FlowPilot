import { Component } from 'react'
import { TriangleAlert } from 'lucide-react'
import Button from '../ui/Button'

/** Contains a crashed page inside the shell so navigation keeps working. */
export default class ErrorBoundary extends Component {
  state = { error: null }

  static getDerivedStateFromError(error) {
    return { error }
  }

  componentDidCatch(error, info) {
    console.error('Page crashed', error, info.componentStack)
  }

  render() {
    if (!this.state.error) return this.props.children
    return (
      <div role="alert" className="mx-auto max-w-md py-24 text-center">
        <TriangleAlert size={20} className="mx-auto mb-4 text-warning" aria-hidden="true" />
        <p className="serif text-3xl">This page hit a problem</p>
        <p className="mt-2 text-sm text-muted">The rest of FlowPilot still works. Reload to try this page again.</p>
        <Button className="mt-6" onClick={() => window.location.reload()}>Reload page</Button>
      </div>
    )
  }
}
