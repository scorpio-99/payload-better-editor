'use client'

import React from 'react'
import { BugIcon, GithubIcon, StarIcon } from './icons'
import { VERSION } from '../version'
import '../styles/settings-banner.css'

const REPO = 'scorpio-99/payload-better-editor'
const REPO_URL = `https://github.com/${REPO}`
const ISSUES_URL = `${REPO_URL}/issues/new`
const AUTHOR = 'scorpio-99'
const AUTHOR_URL = `https://github.com/${AUTHOR}`
const STAR_BADGE_URL = `https://img.shields.io/github/stars/${REPO}?style=flat&label=&color=27272a&labelColor=27272a&logo=github&logoColor=white`

export const SettingsBanner: React.FC = () => (
  <div className="better-editor-banner">
    <div className="better-editor-banner__header">
      <div className="better-editor-banner__heading">
        <div className="better-editor-banner__title">
          <span>payload-better-editor</span>
          <span className="better-editor-banner__version">v{VERSION}</span>
        </div>
        <div className="better-editor-banner__subtitle">
          Built by{' '}
          <a href={AUTHOR_URL} target="_blank" rel="noreferrer noopener">
            {AUTHOR}
          </a>
          . If you find this plugin useful, please leave a star ⭐
        </div>
      </div>
    </div>
    <div className="better-editor-banner__actions">
      <a
        href={REPO_URL}
        target="_blank"
        rel="noreferrer noopener"
        className="better-editor-banner__link"
      >
        <StarIcon />
        <span>Star</span>
        <img src={STAR_BADGE_URL} alt="" className="better-editor-banner__star-badge" />
      </a>
      <a
        href={REPO_URL}
        target="_blank"
        rel="noreferrer noopener"
        className="better-editor-banner__link"
      >
        <GithubIcon />
        <span>GitHub</span>
      </a>
      <a
        href={ISSUES_URL}
        target="_blank"
        rel="noreferrer noopener"
        className="better-editor-banner__link"
      >
        <BugIcon />
        <span>Report a bug</span>
      </a>
    </div>
  </div>
)
