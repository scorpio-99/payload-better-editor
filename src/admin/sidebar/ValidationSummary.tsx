'use client'

import React, { useMemo } from 'react'
import { useAllFormFields } from '@payloadcms/ui'
import type { FormState } from 'payload'
import { collectFieldErrors } from './validation'

export type ValidationSummaryProps = {
  blocksField: string
  onSelectPath: (path: string | null) => void
}

// Sidebar banner listing invalid fields across all blocks.
export const ValidationSummary: React.FC<ValidationSummaryProps> = ({
  blocksField,
  onSelectPath,
}) => {
  const [fields] = useAllFormFields()
  const errors = useMemo(
    () => collectFieldErrors(fields as FormState, blocksField),
    [fields, blocksField],
  )

  if (errors.length === 0) return null

  return (
    <div className="better-editor-sidebar__errors" role="region" aria-label="Validation errors">
      <p className="better-editor-sidebar__errors-title">
        {errors.length === 1 ? '1 field needs attention' : `${errors.length} fields need attention`}
      </p>
      <ul className="better-editor-sidebar__errors-list">
        {errors.map((error) => (
          <li key={error.path} className="better-editor-sidebar__errors-item">
            {error.blockPath ? (
              <button
                type="button"
                className="better-editor-sidebar__errors-jump"
                onClick={() => onSelectPath(error.blockPath)}
              >
                {error.label}
              </button>
            ) : (
              <span className="better-editor-sidebar__errors-label">{error.label}</span>
            )}
            <span className="better-editor-sidebar__errors-message">{error.message}</span>
          </li>
        ))}
      </ul>
    </div>
  )
}
