'use client'

import { useRef, type MutableRefObject } from 'react'

/**
 * Mirror a value into a ref so long-lived listeners / effects can read the
 * latest value without re-binding.
 */
export const useLatestRef = <T>(value: T): MutableRefObject<T> => {
  const ref = useRef(value)
  ref.current = value
  return ref
}
