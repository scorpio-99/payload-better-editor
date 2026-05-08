'use client'

import React from 'react'

type Props = {
  onClose: () => void
  onReset?: () => void
  children: React.ReactNode
}

type State = {
  error: Error | null
}

const isDev = process.env.NODE_ENV !== 'production'

export class OverlayErrorBoundary extends React.Component<Props, State> {
  state: State = { error: null }

  static getDerivedStateFromError(error: Error): State {
    return { error }
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error('[better-editor] overlay crashed', error, info)
  }

  private reset = () => {
    this.props.onReset?.()
    this.setState({ error: null })
  }

  render() {
    const { error } = this.state
    if (!error) return this.props.children

    return (
      <div className="better-editor better-editor--errored" role="alert">
        <div className="better-editor__error">
          <h3>Better Editor crashed</h3>
          <p>{error.message || 'Unknown error.'}</p>
          {isDev && error.stack ? <pre>{error.stack}</pre> : null}
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
}
