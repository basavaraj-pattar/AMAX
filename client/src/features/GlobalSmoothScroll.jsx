import { useEffect, useState } from 'react'
import { useLocation } from 'react-router-dom'
import { AnimatePresence, motion, useReducedMotion } from 'motion/react'
import { ArrowUp } from 'lucide-react'
import Lenis from 'lenis'

const exponentialEaseOut = progress => progress >= 1 ? 1 : 1 - (2 ** (-10 * progress))

// Shared so route changes and the floating control can steer the active instance.
let activeLenis = null

export function scrollPageToTop({ smooth = false } = {}) {
  if (activeLenis) {
    activeLenis.scrollTo(0, smooth
      ? { duration: 1.2, easing: exponentialEaseOut, lock: true }
      : { immediate: true, force: true })
    return
  }

  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
  window.scrollTo({ top: 0, left: 0, behavior: smooth && !reducedMotion ? 'smooth' : 'auto' })
}

function isScrollablePanel(target) {
  if (!(target instanceof Element)) return false

  for (let element = target; element && element !== document.body && element !== document.documentElement; element = element.parentElement) {
    if (element.hasAttribute('data-lenis-prevent')) return true
    const { overflowY } = window.getComputedStyle(element)
    if ((overflowY === 'auto' || overflowY === 'scroll') && element.scrollHeight > element.clientHeight + 1) return true
  }

  return false
}

export default function GlobalSmoothScroll() {
  const { pathname } = useLocation()
  const prefersReducedMotion = useReducedMotion()
  const [showScrollTop, setShowScrollTop] = useState(() => window.scrollY > 300)

  useEffect(() => {
    const reducedMotionQuery = window.matchMedia('(prefers-reduced-motion: reduce)')
    const mobileQuery = window.matchMedia('(max-width: 767px), (pointer: coarse)')
    let instance = null

    const stop = () => {
      if (!instance) return
      instance.destroy()
      if (activeLenis === instance) activeLenis = null
      instance = null
    }

    const syncMode = () => {
      stop()
      // The intro owns its pinned ScrollTrigger timeline. On mobile/reduced-motion,
      // that sequence uses native scroll instead of adding a second inertia layer.
      if (pathname === '/cinematic-intro' || reducedMotionQuery.matches || mobileQuery.matches) return

      instance = new Lenis({
        autoRaf: true,
        duration: 1.2,
        easing: exponentialEaseOut,
        smoothWheel: true,
        syncTouch: false,
        wheelMultiplier: 0.9,
        anchors: true,
        // Leave key events to the browser so Space, arrows and PageUp/PageDown stay native.
        prevent: isScrollablePanel
      })
      activeLenis = instance
    }

    syncMode()
    reducedMotionQuery.addEventListener?.('change', syncMode)
    mobileQuery.addEventListener?.('change', syncMode)

    return () => {
      reducedMotionQuery.removeEventListener?.('change', syncMode)
      mobileQuery.removeEventListener?.('change', syncMode)
      stop()
    }
  }, [pathname])

  useEffect(() => {
    const updateScrollTopVisibility = () => {
      const shouldShow = window.scrollY > 300
      setShowScrollTop(current => current === shouldShow ? current : shouldShow)
    }
    window.addEventListener('scroll', updateScrollTopVisibility, { passive: true })
    updateScrollTopVisibility()
    return () => window.removeEventListener('scroll', updateScrollTopVisibility)
  }, [])

  return <AnimatePresence>
    {showScrollTop && pathname !== '/cinematic-intro' && <motion.button
      key="scroll-to-top"
      className="scroll-to-top-button"
      type="button"
      aria-label="Scroll to top"
      title="Scroll to top"
      initial={prefersReducedMotion ? false : { opacity: 0, y: 14, scale: 0.92 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={prefersReducedMotion ? { opacity: 0 } : { opacity: 0, y: 10, scale: 0.94 }}
      whileHover={prefersReducedMotion ? undefined : { scale: 1.04 }}
      whileTap={prefersReducedMotion ? undefined : { scale: 0.96 }}
      transition={prefersReducedMotion
        ? { duration: 0 }
        : { type: 'spring', stiffness: 360, damping: 30, mass: 0.72 }}
      onClick={() => scrollPageToTop({ smooth: true })}
    >
      <ArrowUp size={18} strokeWidth={2.1} aria-hidden="true" />
    </motion.button>}
  </AnimatePresence>
}
