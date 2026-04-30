'use client'

import React from 'react'

type Props = {
  onClose: () => void
  /** Called before the boundary resets — used to clear stale state. */
  onReset?: () => void
  children: React.ReactNode
}

type State = {
  error: Error | null
}

/** Catches render errors inside the overlay; falls back to a recoverable UI. */
export class OverlayErrorBoundary extends React.Component<Props, State> {
  state: State = { error: null }

  static getDerivedStateFromError(error: Error): State {
    return { error }
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    if (typeof console !== 'undefined') {
      console.error('[better-editor] overlay crashed', error, info)
    }
  }

  reset = () => {
    this.props.onReset?.()
    this.setState({ error: null })
  }

  render() {
    if (this.state.error) {
      return (
        <div className="better-editor better-editor--errored" role="alert">
          <div className="better-editor__error">
            <h3>Better Editor crashed</h3>
            <p>{this.state.error.message || 'Unknown error.'}</p>
            <pre>{this.state.error.stack}</pre>
            <div className="better-editor__error-actions">
              <button type="button" onClick={this.reset}>
                Try again
              </button>
              <button type="button" onClick={this.props.onClose}>
                Close editor
              </button>
            </div>
          </div>
        </div>
      )
    }
    return this.props.children
  }
}
