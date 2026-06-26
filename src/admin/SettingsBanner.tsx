'use client'

import React from 'react'
import { BugIcon, GithubIcon, StarIcon } from './icons'
import { VERSION } from '../version'
import { useBetterEditorT } from '../i18n/useBetterEditorT'
import '../styles/settings-banner.css'

const REPO = 'scorpio-99/payload-better-editor'
const AUTHOR = 'scorpio-99'

const BANNER = {
  author: AUTHOR,
  repoUrl: `https://github.com/${REPO}`,
  issuesUrl: `https://github.com/${REPO}/issues/new`,
  authorUrl: `https://github.com/${AUTHOR}`,
  starBadgeUrl: `https://img.shields.io/github/stars/${REPO}?style=flat&label=&color=27272a&labelColor=27272a&logo=github&logoColor=white`,
}

export const SettingsBanner: React.FC = () => {
  const t = useBetterEditorT()
  return (
    <div className="better-editor-banner">
      <div className="better-editor-banner__header">
        <div className="better-editor-banner__heading">
          <div className="better-editor-banner__title">
            <span>payload-better-editor</span>
            <span className="better-editor-banner__version">v{VERSION}</span>
          </div>
          <div className="better-editor-banner__subtitle">
            Built by{' '}
            <a href={BANNER.authorUrl} target="_blank" rel="noreferrer noopener">
              {BANNER.author}
            </a>
            . {t.banner.builtBy}
          </div>
        </div>
      </div>
      <div className="better-editor-banner__actions">
        <a
          href={BANNER.repoUrl}
          target="_blank"
          rel="noreferrer noopener"
          className="better-editor-banner__link"
        >
          <StarIcon />
          <span>{t.banner.star}</span>
          <img src={BANNER.starBadgeUrl} alt="" className="better-editor-banner__star-badge" />
        </a>
        <a
          href={BANNER.repoUrl}
          target="_blank"
          rel="noreferrer noopener"
          className="better-editor-banner__link"
        >
          <GithubIcon />
          <span>{t.banner.github}</span>
        </a>
        <a
          href={BANNER.issuesUrl}
          target="_blank"
          rel="noreferrer noopener"
          className="better-editor-banner__link"
        >
          <BugIcon />
          <span>{t.banner.reportBug}</span>
        </a>
      </div>
    </div>
  )
}
