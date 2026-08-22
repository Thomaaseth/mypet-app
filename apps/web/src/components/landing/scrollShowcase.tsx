import { useEffect, useRef } from 'react'
import './scroll-showcase.css'

/**
 * PETTR 4-quarter interactive scroll showcase.
 *
 * Faithful port of the original hand-rolled vanilla-JS engine from the
 * Elementor export. Behaviour preserved 1:1:
 *   - 340vh sticky track drives a smoothed scroll "progress" (0..1)
 *   - progress selects one of 3 stages (crossfaded text panes + photos)
 *   - the active white card glides across the 4-quarter grid
 *   - background colour interpolates between three brand colours
 *
 * Differences from the export, both intentional:
 *   - No `window.pettrSetStage` global; stage control is closured and the
 *     nav dots get their click handlers wired inside the effect.
 *   - Lenis (global smooth-scroll momentum) is NOT injected. It only added
 *     inertia to the *native* scroll and is not required for the showcase
 *     itself. If you want that feel, install the `lenis` npm package and
 *     initialise it once at the app root — do not re-add the CDN <script>.
 */

const BG_COLORS = ['#f8f8f8', '#EBAB42', '#602037'] as const
const SMOOTHING_RATE = 3.2
const STAGE_COUNT = 3

type Rgb = readonly [number, number, number]

function hexToRgb(hex: string): Rgb {
  let clean = hex.replace('#', '').trim()
  if (clean.length === 3) {
    clean = clean
      .split('')
      .map((c) => c + c)
      .join('')
  }
  clean = clean.padEnd(6, '0').slice(0, 6)
  return [
    parseInt(clean.substring(0, 2), 16) || 0,
    parseInt(clean.substring(2, 4), 16) || 0,
    parseInt(clean.substring(4, 6), 16) || 0,
  ]
}

function lerpColor(hex1: string, hex2: string, factor: number): string {
  const f = Math.min(Math.max(factor, 0), 1)
  const c1 = hexToRgb(hex1)
  const c2 = hexToRgb(hex2)
  const smoothF = (1 - Math.cos(f * Math.PI)) / 2
  const r = Math.round(c1[0] + (c2[0] - c1[0]) * smoothF)
  const g = Math.round(c1[1] + (c2[1] - c1[1]) * smoothF)
  const b = Math.round(c1[2] + (c2[2] - c1[2]) * smoothF)
  return `rgb(${r},${g},${b})`
}

export function ScrollShowcase() {
  const rootRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const root = rootRef.current
    if (!root) return

    // Scoped lookups so ids never collide with the rest of the document.
    const q = <T extends HTMLElement>(id: string): T | null =>
      root.querySelector<T>(`#${id}`)

    const heroText = q<HTMLHeadingElement>('pettr-hero-text')
    const activeBox = q<HTMLDivElement>('pettr-active-box')
    const progressText = q<HTMLSpanElement>('pettr-progress-text')

    const cols: Array<HTMLElement | null> = [
      q('pettr-col-0'),
      q('pettr-col-1'),
      q('pettr-col-2'),
      q('pettr-col-3'),
    ]

    let currentActiveStage = -1

    const setStage = (stageIdx: number): void => {
      if (stageIdx === currentActiveStage) return
      currentActiveStage = stageIdx

      for (let i = 0; i < STAGE_COUNT; i++) {
        q(`pettr-text-${i}`)?.classList.toggle('active', i === stageIdx)
        q(`pettr-photo-${i}`)?.classList.toggle('active', i === stageIdx)
        q(`pettr-dot-${i}`)?.classList.toggle('active', i === stageIdx)
        q(`pettr-bar-${i}`)?.classList.toggle('active', i === stageIdx)
      }

      if (activeBox && window.innerWidth > 1024) {
        if (stageIdx === 0) {
          activeBox.style.transform = 'translate3d(0, 0, 0)'
        } else if (stageIdx === 1) {
          activeBox.style.transform = 'translate3d(calc(50% + 12px), 0, 0)'
        } else {
          activeBox.style.transform = 'translate3d(calc(100% + 24px), 0, 0)'
        }
      }

      if (cols[0]) cols[0].style.opacity = stageIdx >= 1 ? '0.75' : '0'
      if (cols[1]) cols[1].style.opacity = stageIdx === 2 ? '0.75' : '0'
      if (cols[2]) cols[2].style.opacity = stageIdx === 0 ? '0.75' : '0'
      if (cols[3]) cols[3].style.opacity = stageIdx <= 1 ? '0.75' : '0'
    }

    let targetProgress = 0
    let currentProgress = 0
    let isTicking = false
    let lastFrameTime = performance.now()
    let rafId = 0

    const renderLoop = (now: number): void => {
      const dt = Math.min((now - lastFrameTime) / 1000, 0.05)
      lastFrameTime = now

      const diff = targetProgress - currentProgress

      if (Math.abs(diff) > 0.0002) {
        const smoothFactor = 1 - Math.exp(-SMOOTHING_RATE * dt)
        currentProgress += diff * smoothFactor

        if (progressText) {
          progressText.textContent = `SCROLL PROGRESS: ${Math.round(
            currentProgress * 100,
          )}%`
        }

        let currentBg: string
        if (currentProgress <= 0.22) {
          currentBg = BG_COLORS[0]
        } else if (currentProgress < 0.36) {
          const f = (currentProgress - 0.22) / 0.14
          currentBg = lerpColor(BG_COLORS[0], BG_COLORS[1], f)
        } else if (currentProgress <= 0.48) {
          currentBg = BG_COLORS[1]
        } else if (currentProgress < 0.62) {
          const f = (currentProgress - 0.48) / 0.14
          currentBg = lerpColor(BG_COLORS[1], BG_COLORS[2], f)
        } else {
          currentBg = BG_COLORS[2]
        }
        root.style.backgroundColor = currentBg

        if (heroText) {
          heroText.style.color = currentProgress < 0.29 ? '#000000' : '#ffffff'
        }

        if (currentProgress < 0.3) {
          setStage(0)
        } else if (currentProgress < 0.55) {
          setStage(1)
        } else {
          setStage(2)
        }

        rafId = requestAnimationFrame(renderLoop)
      } else {
        currentProgress = targetProgress
        isTicking = false
      }
    }

    const updateScrollTarget = (): void => {
      const rect = root.getBoundingClientRect()
      const totalDist = root.offsetHeight - window.innerHeight
      if (totalDist <= 0) return
      targetProgress = Math.min(Math.max(-rect.top / totalDist, 0), 1)

      if (!isTicking) {
        isTicking = true
        lastFrameTime = performance.now()
        rafId = requestAnimationFrame(renderLoop)
      }
    }

    // Wire the nav dots (replaces the original inline onclick -> window global).
    const dotHandlers: Array<{ el: HTMLElement; handler: () => void }> = []
    for (let i = 0; i < STAGE_COUNT; i++) {
      const dot = q<HTMLButtonElement>(`pettr-dot-${i}`)
      if (dot) {
        const handler = () => setStage(i)
        dot.addEventListener('click', handler)
        dotHandlers.push({ el: dot, handler })
      }
    }

    window.addEventListener('scroll', updateScrollTarget, { passive: true })
    window.addEventListener('resize', updateScrollTarget, { passive: true })
    updateScrollTarget()
    setStage(0)

    return () => {
      window.removeEventListener('scroll', updateScrollTarget)
      window.removeEventListener('resize', updateScrollTarget)
      cancelAnimationFrame(rafId)
      for (const { el, handler } of dotHandlers) {
        el.removeEventListener('click', handler)
      }
    }
  }, [])

  return (
    <div
      id="pettr-scroll-root"
      ref={rootRef}
      className="pettr-showcase-container"
    >
      {/* <div className="pettr-header-spacer" /> */}

      <div className="pettr-sticky-track">
        <div className="pettr-viewport-sticky">
          <h1 className="pettr-hero-heading" id="pettr-hero-text">
            Ready. Pet. Go.
          </h1>

          <div className="pettr-grid-stage" id="pettr-grid-row">
            {/* Background layer: 4 static muted column slots */}
            <div className="pettr-card-col pettr-inactive-card" id="pettr-col-0">
              <h2 className="pettr-card-title">
                Treatment Info &amp; Timelines At A Moment&apos;s Notice
              </h2>
              <p className="pettr-card-body">
                Making sure your pet is protected without a second thought.
              </p>
            </div>
            <div className="pettr-card-col pettr-inactive-card" id="pettr-col-1">
              <h2 className="pettr-card-title">
                Weight &amp; Feeding Insights You&apos;d Normally Miss.
              </h2>
              <p className="pettr-card-body">
                See trends over time without digging through notes. Pettr sees
                it all.
              </p>
            </div>
            <div className="pettr-card-col pettr-inactive-card" id="pettr-col-2">
              <h2 className="pettr-card-title">
                Weight &amp; Feeding Insights You&apos;d Normally Miss.
              </h2>
              <p className="pettr-card-body">
                See trends over time without digging through notes. Pettr sees
                it all.
              </p>
            </div>
            <div className="pettr-card-col pettr-inactive-card" id="pettr-col-3">
              <h2 className="pettr-card-title">
                All Your Vet Info In One Place, No More Email Hunting.
              </h2>
              <p className="pettr-card-body">
                Who, what, when, where, and why - all in one place.
              </p>
            </div>

            {/* Foreground: single persistent gliding active card */}
            <div className="pettr-active-stage" id="pettr-active-box">
              <div className="pettr-inner-textbox">
                <div className="pettr-text-stage">
                  <div className="pettr-text-pane active" id="pettr-text-0">
                    <h2 className="pettr-active-title">
                      Treatment Info &amp; Timelines At A Moment&apos;s Notice
                    </h2>
                    <p className="pettr-active-body">
                      Making sure your pet is protected without a second
                      thought.
                    </p>
                  </div>
                  <div className="pettr-text-pane" id="pettr-text-1">
                    <h2 className="pettr-active-title">
                      Weight &amp; Feeding Insights You&apos;d Normally Miss.
                    </h2>
                    <p className="pettr-active-body">
                      See trends over time without digging through notes. Pettr
                      sees it all.
                    </p>
                  </div>
                  <div className="pettr-text-pane" id="pettr-text-2">
                    <h2 className="pettr-active-title">
                      All Your Vet Info In One Place, No More Email Hunting.
                    </h2>
                    <p className="pettr-active-body">
                      Who, what, when, where, and why - all in one place.
                    </p>
                  </div>
                </div>

                <div className="pettr-step-bars">
                  <div className="pettr-step-bar active" id="pettr-bar-0" />
                  <div className="pettr-step-bar" id="pettr-bar-1" />
                  <div className="pettr-step-bar" id="pettr-bar-2" />
                </div>
              </div>

              <div className="pettr-photo-wrap">
                <img
                  id="pettr-photo-0"
                  src="https://images.unsplash.com/photo-1576201836106-db1758fd1c97?auto=format&fit=crop&w=1200&q=80"
                  alt="Luna • Vaccine & Flea Shield Active"
                  className="pettr-photo-layer active"
                  loading="eager"
                  decoding="async"
                />
                <img
                  id="pettr-photo-1"
                  src="https://images.unsplash.com/photo-1543466835-00a7907e9de1?auto=format&fit=crop&w=1200&q=80"
                  alt="Rex • Golden Retriever (4.77 kg)"
                  className="pettr-photo-layer"
                  loading="eager"
                  decoding="async"
                />
                <img
                  id="pettr-photo-2"
                  src="https://images.unsplash.com/photo-1628009368231-7bb7cfcb0def?auto=format&fit=crop&w=1200&q=80"
                  alt="Oakwood Vet Clinic • Dr. Smith"
                  className="pettr-photo-layer"
                  loading="eager"
                  decoding="async"
                />
              </div>
            </div>
          </div>

          <div className="pettr-timeline-bar">
            <div className="pettr-progress-pill">
              <span className="pettr-pulse-dot" />
              <span id="pettr-progress-text">SCROLL PROGRESS: 0%</span>
            </div>
            <div className="pettr-stage-nav">
              <button
                type="button"
                className="pettr-stage-dot active"
                id="pettr-dot-0"
                aria-label="Stage 1"
              />
              <button
                type="button"
                className="pettr-stage-dot"
                id="pettr-dot-1"
                aria-label="Stage 2"
              />
              <button
                type="button"
                className="pettr-stage-dot"
                id="pettr-dot-2"
                aria-label="Stage 3"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}