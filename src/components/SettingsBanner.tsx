'use client'

import React from 'react'
import { BugIcon, GithubIcon, StarIcon } from '../icons'
import { VERSION } from '../version'

const REPO = 'scorpio-99/payload-better-editor'
const REPO_URL = `https://github.com/${REPO}`
const ISSUES_URL = `${REPO_URL}/issues/new`
const AUTHOR = 'scorpio-99'
const AUTHOR_URL = `https://github.com/${AUTHOR}`
const STAR_BADGE_URL = `https://img.shields.io/github/stars/${REPO}?style=flat&label=&color=27272a&labelColor=27272a&logo=github&logoColor=white`

const cardStyle: React.CSSProperties = {
  marginBottom: 24,
  border: '1px solid var(--theme-elevation-150)',
  borderRadius: 8,
  background: 'var(--theme-elevation-50)',
  overflow: 'hidden',
}

const headerStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: 12,
  padding: '14px 18px',
  borderBottom: '1px solid var(--theme-elevation-150)',
}

const titleStyle: React.CSSProperties = {
  margin: 0,
  fontSize: 14,
  fontWeight: 600,
  color: 'var(--theme-text)',
  display: 'flex',
  alignItems: 'center',
  gap: 8,
}

const versionTagStyle: React.CSSProperties = {
  fontSize: 11,
  fontWeight: 500,
  color: 'var(--theme-elevation-500)',
  padding: '2px 6px',
  border: '1px solid var(--theme-elevation-200)',
  borderRadius: 4,
  fontFamily: 'var(--font-mono, ui-monospace, monospace)',
}

const subtitleStyle: React.CSSProperties = {
  margin: 0,
  fontSize: 12,
  color: 'var(--theme-elevation-500)',
}

const actionsStyle: React.CSSProperties = {
  display: 'flex',
  flexWrap: 'wrap',
  gap: 8,
  padding: '12px 18px',
}

const linkStyle: React.CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  gap: 6,
  padding: '6px 10px',
  border: '1px solid var(--theme-elevation-200)',
  borderRadius: 6,
  background: 'var(--theme-input-bg, var(--theme-elevation-0))',
  color: 'var(--theme-text)',
  fontSize: 13,
  fontWeight: 500,
  textDecoration: 'none',
}

export const SettingsBanner: React.FC = () => (
  <div style={cardStyle}>
    <div style={headerStyle}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
        <div style={titleStyle}>
          <span>payload-better-editor</span>
          <span style={versionTagStyle}>v{VERSION}</span>
        </div>
        <div style={subtitleStyle}>
          Built by{' '}
          <a href={AUTHOR_URL} target="_blank" rel="noreferrer noopener">
            {AUTHOR}
          </a>
          . If you find this plugin useful, please leave a star ⭐
        </div>
      </div>
    </div>
    <div style={actionsStyle}>
      <a href={REPO_URL} target="_blank" rel="noreferrer noopener" style={linkStyle}>
        <StarIcon />
        <span>Star</span>
        <img src={STAR_BADGE_URL} alt="" style={{ height: 16, display: 'block' }} />
      </a>
      <a href={REPO_URL} target="_blank" rel="noreferrer noopener" style={linkStyle}>
        <GithubIcon />
        <span>GitHub</span>
      </a>
      <a href={ISSUES_URL} target="_blank" rel="noreferrer noopener" style={linkStyle}>
        <BugIcon />
        <span>Report a bug</span>
      </a>
    </div>
  </div>
)
