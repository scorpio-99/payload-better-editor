'use client'

import React from 'react'
import { useBetterEditorT } from '../i18n/useBetterEditorT.js'
import type { BetterEditorTranslations } from '../i18n/types.js'

type Props = {
  onClose: () => void
  onReset?: () => void
  children: React.ReactNode
}

type InnerProps = Props & { labels: BetterEditorTranslations['error'] }

type State = {
  error: Error | null
}

const isDev = process.env.NODE_ENV !== 'production'

class OverlayErrorBoundaryInner extends React.Component<InnerProps, State> {
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

    const { labels } = this.props
    return (
      <div className="better-editor better-editor--errored" role="alert">
        <div className="better-editor__error">
          <h3>{labels.heading}</h3>
          <p>{error.message || labels.unknown}</p>
          {isDev && error.stack ? <pre>{error.stack}</pre> : null}
          <div className="better-editor__error-actions">
            <button type="button" onClick={this.reset}>
              {labels.tryAgain}
            </button>
            <button type="button" onClick={this.props.onClose}>
              {labels.closeEditor}
            </button>
          </div>
        </div>
      </div>
    )
  }
}

export const OverlayErrorBoundary: React.FC<Props> = (props) => {
  const t = useBetterEditorT()
  return <OverlayErrorBoundaryInner {...props} labels={t.error} />
}
