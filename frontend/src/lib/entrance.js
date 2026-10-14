import { useRef } from 'react'
import { useLocation } from 'react-router-dom'
import { staggerContainer } from './motion'

const visited = new Set()

/**
 * Props for a page's root motion element: staggered entrance on the first visit this session,
 * no entrance on revisits (data is cached, so content appears immediately).
 */
export function usePageEntrance() {
  const { pathname } = useLocation()
  const first = useRef(!visited.has(pathname))
  visited.add(pathname)
  return {
    variants: staggerContainer,
    initial: first.current ? 'initial' : false,
    animate: 'animate',
  }
}
