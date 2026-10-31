import { useCallback, useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Lenis from 'lenis'
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { apiRequest } from '../services/api'
import { useAuthSession } from '../context/AuthSession'

gsap.registerPlugin(ScrollTrigger)

const FRAME_COUNT = 300
const INITIAL_FRAME_COUNT = 14
const MAX_DECODED_FRAMES = 24
const FRAME_ROOT = '/cinematic-intro/frame-'
const INTRO_DURATION = 19.2

const QUOTES = [
  { text: 'If it can be written, or thought, it can be filmed.', emphasis: ['can', 'be', 'filmed.'], start: 0.2, exit: 2.7 },
  { text: 'The length of a film should be directly related to the endurance of the human bladder.', start: 2.45, exit: 5.2 },
  { text: "Don't try to understand it. Feel it.", start: 4.95, exit: 7.15 },
  { text: "I steal from every movie ever made. Great artists steal; they don't do homages.", emphasis: ['I', 'steal', 'from', 'every', 'movie', 'ever', 'made.'], start: 6.9, exit: 10.6 },
  { text: 'To be a filmmaker, you must have the stomach of a thief and the stamina of a horse.', start: 10.35, exit: 13.75 },
  { text: 'Film is like a battlefield... But in the end, a film is like a person. It is an emotional thing.', start: 13.5, exit: 17.05 }
]

const clamp = (value, min, max) => Math.min(max, Math.max(min, value))
const frameUrl = index => `${FRAME_ROOT}${String(index + 1).padStart(3, '0')}.webp`

function loadImageFallback(url) {
  return new Promise((resolve, reject) => {
    const image = new Image()
    const releaseObjectUrl = () => { if (url.startsWith('blob:')) URL.revokeObjectURL(url) }
    image.decoding = 'async'
    image.onload = () => { releaseObjectUrl(); resolve(image) }
    image.onerror = () => { releaseObjectUrl(); reject(new Error(`Could not load ${url}`)) }
    image.src = url
    if (image.decode) image.decode().then(() => { releaseObjectUrl(); resolve(image) }).catch(() => {})
  })
}

function splitQuote(text, emphasis = []) {
  const words = text.trim().split(/\s+/)
  const emphasizedWords = new Set(emphasis)
  return words.map((word, index) => {
    const isFirst = index === 0
    const isLast = index === words.length - 1
    const content = <>{isFirst && <span className="cinematic-intro-open-quote" aria-hidden="true">“</span>}{word}{isLast && '”'}</>
    return <span className="cinematic-intro-word-mask" key={`${word}-${index}`}>
      <span className={`cinematic-intro-word${isLast ? ' cinematic-intro-word-accent' : ''}`}>
        {emphasizedWords.has(word) ? <strong>{content}</strong> : content}
      </span>
    </span>
  })
}

export default function CinematicIntro({ onProgress = () => {} }) {
  const navigate = useNavigate()
  const { setUser } = useAuthSession()
  const stageRef = useRef(null)
  const stickyRef = useRef(null)
  const canvasRef = useRef(null)
  const copyRef = useRef(null)
  const titleRef = useRef(null)
  const loaderRef = useRef(null)
  const lenisRef = useRef(null)
  const triggerRef = useRef(null)
  const completeRef = useRef(false)
  const completionErrorRef = useRef(false)
  const progressRef = useRef(onProgress)
  const [loadingProgress, setLoadingProgress] = useState(0)
  const [loadError, setLoadError] = useState('')
  const [retryToken, setRetryToken] = useState(0)
  const [reducedMotion, setReducedMotion] = useState(() => window.matchMedia('(prefers-reduced-motion: reduce)').matches)
  const [mobileViewport, setMobileViewport] = useState(() => window.matchMedia('(max-width: 767px), (pointer: coarse)').matches)

  useEffect(() => { progressRef.current = onProgress }, [onProgress])

  useEffect(() => {
    const preference = window.matchMedia('(prefers-reduced-motion: reduce)')
    const updatePreference = event => setReducedMotion(event.matches)
    preference.addEventListener?.('change', updatePreference)
    return () => preference.removeEventListener?.('change', updatePreference)
  }, [])

  useEffect(() => {
    const viewport = window.matchMedia('(max-width: 767px), (pointer: coarse)')
    const updateViewport = event => setMobileViewport(event.matches)
    viewport.addEventListener?.('change', updateViewport)
    return () => viewport.removeEventListener?.('change', updateViewport)
  }, [])

  const finishIntro = useCallback(async () => {
    if (completeRef.current || completionErrorRef.current) return
    completeRef.current = true
    try {
      const user = await apiRequest('/auth/me/cinematic-intro/complete', { method: 'POST' })
      setUser(user)
      navigate('/', { replace: true })
    } catch (error) {
      completeRef.current = false
      completionErrorRef.current = true
      setLoadError(error.message || 'Could not finish the introduction. Please try again.')
    }
  }, [navigate, setUser])

  useEffect(() => {
    let disposed = false
    let lenis = null
    let lenisTick = null
    let context = null
    let resizeObserver = null
    const requestController = new AbortController()
    const cache = new Map()
    const pending = new Map()
    const canvas = canvasRef.current
    const stage = stageRef.current
    const sticky = stickyRef.current
    const copy = copyRef.current
    const title = titleRef.current
    const loader = loaderRef.current
    const dprCap = window.matchMedia('(max-width: 700px)').matches ? 1.4 : 2
    let targetFrame = 0
    let lastPrefetchAnchor = -100
    let lastTarget = 0
    let draw = () => {}
    let skewCopy = () => {}

    if (!canvas || !stage || !sticky || !copy || !title || !loader) return undefined
    setLoadError('')
    setLoadingProgress(0)
    loader.hidden = false
    progressRef.current(0)

    const context2d = canvas.getContext('2d', { alpha: false, desynchronized: true })
    const resizeCanvas = () => {
      if (!context2d || disposed) return
      const rect = canvas.getBoundingClientRect()
      const ratio = Math.min(window.devicePixelRatio || 1, dprCap)
      const width = Math.max(1, Math.round(rect.width * ratio))
      const height = Math.max(1, Math.round(rect.height * ratio))
      if (canvas.width !== width || canvas.height !== height) {
        canvas.width = width
        canvas.height = height
      }
      const image = cache.get(targetFrame)
      if (image) draw(targetFrame, image)
    }

    const evictFrames = () => {
      while (cache.size > MAX_DECODED_FRAMES) {
        let oldestIndex = -1
        let oldestDistance = -1
        for (const index of cache.keys()) {
          if (index === targetFrame) continue
          const distance = Math.abs(index - targetFrame)
          if (distance > oldestDistance) {
            oldestIndex = index
            oldestDistance = distance
          }
        }
        if (oldestIndex < 0) break
        const oldImage = cache.get(oldestIndex)
        if (oldImage && typeof oldImage.close === 'function') oldImage.close()
        cache.delete(oldestIndex)
      }
    }

    const remember = (index, image) => {
      if (disposed) {
        image?.close?.()
        return null
      }
      if (cache.has(index)) {
        const previous = cache.get(index)
        if (previous !== image) previous?.close?.()
        cache.delete(index)
      }
      cache.set(index, image)
      evictFrames()
      return image
    }

    const fetchFrame = async index => {
      if (cache.has(index)) {
        const image = cache.get(index)
        cache.delete(index)
        cache.set(index, image)
        return image
      }
      if (pending.has(index)) return pending.get(index)
      const promise = (async () => {
        const url = frameUrl(index)
        try {
          const response = await fetch(url, { signal: requestController.signal, cache: 'force-cache' })
          if (!response.ok) throw new Error(`Frame ${index + 1} returned ${response.status}`)
          const blob = await response.blob()
          const image = typeof createImageBitmap === 'function'
            ? await createImageBitmap(blob)
            : await loadImageFallback(URL.createObjectURL(blob))
          return remember(index, image)
        } catch (error) {
          if (error.name === 'AbortError') throw error
          // Direct image loading is a fallback for browsers that reject bitmap decoding.
          if (typeof createImageBitmap !== 'function') throw error
          const image = await loadImageFallback(url)
          return remember(index, image)
        } finally {
          pending.delete(index)
        }
      })()
      pending.set(index, promise)
      return promise
    }

    draw = (index, suppliedImage) => {
      const safeIndex = clamp(Math.round(index), 0, FRAME_COUNT - 1)
      targetFrame = safeIndex
      const image = suppliedImage || cache.get(safeIndex)
      if (!context2d || !image || disposed) return false
      const width = canvas.width
      const height = canvas.height
      const sourceWidth = image.width || image.naturalWidth
      const sourceHeight = image.height || image.naturalHeight
      if (!sourceWidth || !sourceHeight) return false
      // Cover scaling keeps the camera image edge-to-edge at every viewport ratio.
      const scale = Math.max(width / sourceWidth, height / sourceHeight)
      const drawWidth = sourceWidth * scale
      const drawHeight = sourceHeight * scale
      context2d.clearRect(0, 0, width, height)
      context2d.drawImage(image, (width - drawWidth) / 2, (height - drawHeight) / 2, drawWidth, drawHeight)
      return true
    }

    const requestFrame = index => {
      const safeIndex = clamp(Math.round(index), 0, FRAME_COUNT - 1)
      targetFrame = safeIndex
      if (safeIndex !== lastTarget) lastTarget = safeIndex
      const cached = cache.get(safeIndex)
      if (cached) draw(safeIndex, cached)
      else fetchFrame(safeIndex).then(image => {
        if (!disposed && image && targetFrame === safeIndex) draw(safeIndex, image)
      }).catch(() => {})

      // Keep a few frames ahead warm for smooth forward scrubbing, without decoding all 300 at once.
      if (Math.abs(safeIndex - lastPrefetchAnchor) >= 4) {
        const direction = safeIndex >= lastPrefetchAnchor ? 1 : -1
        lastPrefetchAnchor = safeIndex
        for (let offset = 1; offset <= 4; offset += 1) {
          const neighbour = safeIndex + direction * offset
          if (neighbour >= 0 && neighbour < FRAME_COUNT) fetchFrame(neighbour).catch(() => {})
        }
      }
    }

    resizeCanvas()
    resizeObserver = typeof ResizeObserver === 'function' ? new ResizeObserver(resizeCanvas) : null
    resizeObserver?.observe(sticky)
    window.addEventListener('resize', resizeCanvas, { passive: true })
    gsap.set(canvas, { autoAlpha: 0, scale: 1 })
    gsap.set(loader, { autoAlpha: 1, y: 0 })
    gsap.set(copy.querySelectorAll('.cinematic-intro-quote'), { autoAlpha: 0, y: 18, filter: 'blur(7px)' })
    gsap.set(title, { autoAlpha: reducedMotion ? 1 : 0, y: reducedMotion ? 0 : 20, filter: reducedMotion ? 'blur(0px)' : 'blur(8px)' })
    gsap.set(copy.querySelectorAll('.cinematic-intro-word'), { yPercent: 110, autoAlpha: 0, filter: 'blur(8px)' })

    const setupTimeline = () => {
      if (disposed) return
      const initialIndex = cache.has(0) ? 0 : targetFrame
      const timelineState = { frame: initialIndex }
      draw(initialIndex, cache.get(initialIndex))
      gsap.to(canvas, { autoAlpha: 1, duration: reducedMotion ? 0.01 : 0.8, ease: 'power3.out', overwrite: true })
      gsap.to(loader, { autoAlpha: 0, y: -8, duration: 0.45, ease: 'power2.in', onComplete: () => { if (!disposed) loader.hidden = true } })

      if (reducedMotion) {
        stage.classList.add('cinematic-intro-reduced')
        progressRef.current(0)
        return
      }

      stage.classList.remove('cinematic-intro-reduced')
      // Desktop uses inertial Lenis synced to GSAP; mobile keeps native scroll input.
      if (!mobileViewport) {
        lenis = new Lenis({ autoRaf: false, lerp: 0.085, smoothWheel: true, wheelMultiplier: 0.9, touchMultiplier: 1.05 })
        lenisRef.current = lenis
        lenis.on('scroll', ScrollTrigger.update)
        lenisTick = time => lenis?.raf(time * 1000)
        gsap.ticker.add(lenisTick)
        gsap.ticker.lagSmoothing(0)
      }
      skewCopy = gsap.quickTo(copy, 'skewY', { duration: 0.32, ease: 'power2.out' })

      context = gsap.context(() => {
        const timeline = gsap.timeline({
          defaults: { overwrite: 'auto' },
          scrollTrigger: {
            trigger: stage,
            start: 'top top',
            end: 'bottom bottom',
            pin: sticky,
            pinSpacing: false,
            scrub: 1.2,
            anticipatePin: 1,
            invalidateOnRefresh: true,
            onUpdate: self => {
              const velocity = clamp(self.getVelocity() / 6500, -1, 1)
              skewCopy(velocity * -0.75)
            },
            onScrubComplete: () => skewCopy(0)
          }
        })
        triggerRef.current = timeline.scrollTrigger
        const frameSegments = [
          // Adjust these frame ranges and durations to make key shots linger or transitions move faster.
          { label: 'opening-reveal', frame: 35, duration: 2.0, ease: 'power1.inOut' },
          { label: 'first-transition', frame: 100, duration: 1.8, ease: 'power2.inOut' },
          { label: 'camera-detail', frame: 145, duration: 2.4, ease: 'power1.inOut' },
          { label: 'second-transition', frame: 220, duration: 2.2, ease: 'power2.inOut' },
          { label: 'final-approach', frame: 260, duration: 2.8, ease: 'power1.inOut' },
          { label: 'hero-settle', frame: FRAME_COUNT - 1, duration: 4.2, ease: 'power2.inOut' }
        ]
        let cursor = 0
        frameSegments.forEach(segment => {
          timeline.addLabel(segment.label, cursor)
          timeline.to(timelineState, {
            frame: segment.frame,
            duration: segment.duration,
            ease: segment.ease,
            onUpdate: () => requestFrame(timelineState.frame)
          }, cursor)
          cursor += segment.duration
        })

        QUOTES.forEach((quote, index) => {
          const element = copy.querySelector(`.cinematic-intro-quote-${index + 1}`)
          if (!element) return
          const words = element.querySelectorAll('.cinematic-intro-word')
          // Masked word reveals use anticipation, a soft overshoot and staggered follow-through.
          timeline.fromTo(element,
            { autoAlpha: 0, y: 22, rotation: Number(element.dataset.angle || 0) - 1.2, filter: 'blur(8px)' },
            { autoAlpha: 1, y: 0, rotation: 0, filter: 'blur(0px)', duration: 0.54, ease: 'power3.out' },
            quote.start)
          timeline.fromTo(words,
            { yPercent: 110, autoAlpha: 0, filter: 'blur(8px)', letterSpacing: '.035em' },
            { yPercent: 0, autoAlpha: 1, filter: 'blur(0px)', letterSpacing: '0em', duration: 0.58, stagger: 0.065, ease: 'power3.out' },
            quote.start + 0.025)
          // Exit upward at a quicker pace while the following quote is already entering.
          timeline.to(words, { yPercent: -115, autoAlpha: 0, filter: 'blur(5px)', duration: 0.32, stagger: { each: 0.018, from: 'end' }, ease: 'power2.in' }, quote.exit)
          timeline.to(element, { autoAlpha: 0, y: -20, rotation: index % 2 ? -0.8 : 0.8, filter: 'blur(5px)', duration: 0.34, ease: 'power2.in' }, quote.exit)
        })

        timeline.addLabel('brand-title', 17.15)
        timeline.fromTo(title,
          { autoAlpha: 0, y: 24, scale: 0.985, filter: 'blur(8px)', letterSpacing: '-.005em' },
          { autoAlpha: 1, y: 0, scale: 1, filter: 'blur(0px)', letterSpacing: '-.025em', duration: 0.82, ease: 'power3.out' },
          'brand-title')
        // The home screen rises from below only in the last part of the scroll, after the camera lands.
        timeline.to({}, { duration: 0.01 }, 18.1)
        timeline.to({}, { duration: 0.01 }, INTRO_DURATION - 0.01)
        timeline.to(title, { autoAlpha: 0, y: -18, scale: 1.01, filter: 'blur(5px)', duration: 0.42, ease: 'power2.in' }, 18.55)
        timeline.to(canvas, { scale: 1.075, xPercent: -0.7, yPercent: 0.35, duration: INTRO_DURATION, ease: 'none' }, 0)
        // This separate drift gives the copy a different camera-relative speed for depth.
        timeline.to(copy, { y: -26, x: 8, duration: 17.8, ease: 'none' }, 0)
        timeline.eventCallback('onUpdate', () => {
          const progress = clamp(timeline.progress(), 0, 1)
          progressRef.current(progress)
          if (progress >= 0.999) finishIntro()
        })
        ScrollTrigger.refresh()
      }, stage)
    }

    const warmInitialFrames = async () => {
      let settled = 0
      const results = await Promise.allSettled(Array.from({ length: INITIAL_FRAME_COUNT }, (_, index) => fetchFrame(index).then(image => {
        settled += 1
        if (!disposed) setLoadingProgress(Math.round((settled / INITIAL_FRAME_COUNT) * 100))
        return image
      }).catch(error => {
        settled += 1
        if (!disposed) setLoadingProgress(Math.round((settled / INITIAL_FRAME_COUNT) * 100))
        throw error
      })))
      if (disposed) return
      const firstImageIndex = results.findIndex(result => result.status === 'fulfilled' && result.value)
      if (firstImageIndex < 0) {
        setLoadError('The camera frames could not be loaded. Check the local assets and try again.')
        return
      }
      targetFrame = firstImageIndex
      lastTarget = firstImageIndex
      requestFrame(firstImageIndex)
      setLoadingProgress(100)
      setupTimeline()
    }
    warmInitialFrames()

    return () => {
      disposed = true
      requestController.abort()
      resizeObserver?.disconnect()
      window.removeEventListener('resize', resizeCanvas)
      if (lenis) {
        lenis.off('scroll', ScrollTrigger.update)
        lenis.destroy()
        lenisRef.current = null
        if (lenisTick) gsap.ticker.remove(lenisTick)
        gsap.ticker.lagSmoothing(500, 33)
      }
      gsap.killTweensOf([canvas, loader, copy])
      context?.revert()
      triggerRef.current = null
      cache.forEach(image => image?.close?.())
      cache.clear()
      pending.clear()
      stage.classList.remove('cinematic-intro-reduced')
    }
  }, [finishIntro, mobileViewport, reducedMotion, retryToken])

  const retry = () => {
    if (completionErrorRef.current) {
      completionErrorRef.current = false
      setLoadError('')
      finishIntro()
      return
    }
    setRetryToken(value => value + 1)
  }

  const skipIntro = () => {
    if (reducedMotion) {
      finishIntro()
      return
    }
    const end = triggerRef.current?.end
    if (Number.isFinite(end)) {
      if (lenisRef.current) lenisRef.current.scrollTo(end, { duration: 1.2, easing: value => 1 - (1 - value) ** 3 })
      else window.scrollTo({ top: end, left: 0, behavior: 'auto' })
    }
  }

  return <section className="cinematic-intro" ref={stageRef} aria-label="Moire Vision Studio cinematic introduction">
    <div className="cinematic-intro-sticky" ref={stickyRef}>
      <canvas className="cinematic-intro-canvas" ref={canvasRef} aria-hidden="true" />
      <header className="cinematic-intro-header">
        <a className="cinematic-intro-brand" href="/" aria-label="Moire Vision Studio">
          <img src="/mv-logo.png" alt="" />
          <span><strong>MOIRE VISION</strong><small>studio</small></span>
        </a>
        <button className="cinematic-intro-skip" type="button" onClick={skipIntro}>{reducedMotion ? 'Continue' : 'Skip all'}<span aria-hidden="true">›</span></button>
      </header>
      <div className="cinematic-intro-copy" ref={copyRef}>
        {QUOTES.map((quote, index) => <p
          className={`cinematic-intro-quote cinematic-intro-quote-${index + 1}`}
          data-angle={index % 2 ? 1 : -1}
          aria-label={`“${quote.text}”`}
          key={quote.text}
        ><span className="cinematic-intro-words" aria-hidden="true">{splitQuote(quote.text, quote.emphasis)}</span></p>)}
      </div>
      <h1 className="cinematic-intro-title" ref={titleRef}>
        <span className="cinematic-intro-title-main">Welcome to the world</span>
        <span className="cinematic-intro-title-accent">Cinema</span>
      </h1>
      <div className="cinematic-intro-loading" ref={loaderRef} role="status" aria-live="polite">
        <span>Preparing camera · {loadingProgress}%</span>
        <i style={{ '--loading-progress': `${loadingProgress}%` }} />
      </div>
      {reducedMotion && !loadError && <button className="cinematic-intro-reduced-continue" type="button" onClick={finishIntro}>Continue to FilmVerse</button>}
      {!reducedMotion && <div className="cinematic-intro-scroll-cue" aria-hidden="true"><span>Scroll to begin</span><i/></div>}
      {loadError && <div className="cinematic-intro-error" role="alert"><span>{loadError}</span><button type="button" onClick={retry}>Try again</button></div>}
    </div>
  </section>
}
