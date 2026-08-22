import { useEffect, useRef, useState, type ReactNode } from 'react'

/**
 * Landing style contract — single source of truth for this page's typography,
 * boxing, spacing, the "shadow box" surface, the amber button, and shared
 * motion hooks.
 * Breakpoints (Tailwind v4 defaults): base = mobile, md = tablet, lg = desktop.
 * Sizes are arbitrary px (immune to the app's 90% root font-size).
 * Color/alignment are set by a wrapper in the section file and inherited here,
 * which is why these primitives take no className.
 */

export const LANDING_BG = '#F8F8F8'
export const shadowBoxStyle = { boxShadow: '0 0 10px rgba(0,0,0,0.17)' } as const

/* ── Layout ─────────────────────────────────────────────────────────── */

/** Outer boxed container: 1500px max, 20/50/80px side padding, 50px soft
 *  vertical spacing (padding, not margin — no collapse). Owns <section>. */
export function Section({ children }: { children: ReactNode }) {
  return (
    <section className="mx-auto w-full max-w-[1500px] px-[20px] py-[50px] md:px-[50px] lg:px-[80px]">
      {children}
    </section>
  )
}

/** Inner content cap: 1300px, centered. */
export function SectionInner({ children }: { children: ReactNode }) {
  return <div className="mx-auto w-full max-w-[1300px]">{children}</div>
}

/** Vertical rhythm for content via children. Tokened gaps so spacing can't
 *  drift: sm 20 / md 30 / lg 50 px. align='center' also centers text. */
const STACK_GAP = { sm: 'gap-[20px]', md: 'gap-[30px]', lg: 'gap-[50px]' } as const

export function Stack({
  gap = 'md',
  align = 'stretch',
  children,
}: {
  gap?: keyof typeof STACK_GAP
  align?: 'stretch' | 'center'
  children: ReactNode
}) {
  return (
    <div
      className={`flex flex-col ${STACK_GAP[gap]} ${
        align === 'center' ? 'items-center text-center' : ''
      }`}
    >
      {children}
    </div>
  )
}

/* ── Typography ─────────────────────────────────────────────────────── */

/** Large header — Bricolage 700, capitalize.
 *  54px (lh1.2/-2px) → md (lh1/-2.3px) → lg 84px (lh74px). */
export function LandingHeading({
  as: Tag = 'h2',
  children,
}: {
  as?: 'h1' | 'h2'
  children: ReactNode
}) {
  return (
    <Tag className="font-display font-bold capitalize text-[54px] leading-[1.2] tracking-[-2px] md:leading-[1] md:tracking-[-2.3px] lg:text-[84px] lg:leading-[88px]">
      {children}
    </Tag>
  )
}

/** Second header — Bricolage 700 (no 400 file). 18px → lg 24px, lh 26px. */
export function LandingSubheading({
  as: Tag = 'p',
  children,
}: {
  as?: 'h2' | 'h3' | 'p'
  children: ReactNode
}) {
  return (
    <Tag className="font-display font-bold text-[18px] leading-[26px] lg:text-[24px]">
      {children}
    </Tag>
  )
}

/** Small text / body — Montserrat 400. 14px → lg 16px, lh 24px. */
export function LandingText({ children }: { children: ReactNode }) {
  return (
    <p className="font-sans font-normal text-[14px] leading-[24px] lg:text-[16px]">
      {children}
    </p>
  )
}

/** Eyebrow ("ROADMAP") — Bricolage 700, 14px, -0.2px, accent. */
export function LandingEyebrow({ children }: { children: ReactNode }) {
  return (
    <p className="font-display font-bold text-[14px] tracking-[-0.2px] text-accent">
      {children}
    </p>
  )
}

/* ── Button ─────────────────────────────────────────────────────────── */

/** Amber button — purple text on amber, inverts on hover. Montserrat 14→16px. */
export function LandingButton({
  href,
  children,
  withArrow = false,
}: {
  href: string
  children: ReactNode
  withArrow?: boolean
}) {
  return (
    <a
      href={href}
      className="inline-flex items-center gap-2 rounded-[13px] border border-accent bg-accent px-6 py-3 font-sans font-normal text-[14px] leading-[24px] text-primary transition-colors hover:bg-primary hover:text-accent lg:text-[16px]"
    >
      {children}
      {withArrow && <span aria-hidden>&rarr;</span>}
    </a>
  )
}

/* ── Motion hooks ───────────────────────────────────────────────────── */

/** Upward scroll parallax. Attach the returned ref to the moving layer.
 *  speed = intensity; range = the scroll-progress window it animates within. */
export function useScrollParallax(
  speed: number,
  rangeStart: number,
  rangeEnd: number,
) {
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return

    let rafId = 0
    let ticking = false

    const update = () => {
      ticking = false
      const rect = el.getBoundingClientRect()
      const vh = window.innerHeight
      const total = vh + rect.height
      const progress = Math.min(Math.max((vh - rect.top) / total, 0), 1)
      if (progress < rangeStart || progress > rangeEnd) return
      const local = (progress - rangeStart) / (rangeEnd - rangeStart)
      const translate = -(local - 0.5) * speed * 100
      el.style.transform = `translate3d(0, ${translate.toFixed(2)}px, 0)`
    }

    const onScroll = () => {
      if (!ticking) {
        ticking = true
        rafId = requestAnimationFrame(update)
      }
    }

    window.addEventListener('scroll', onScroll, { passive: true })
    window.addEventListener('resize', onScroll, { passive: true })
    update()

    return () => {
      window.removeEventListener('scroll', onScroll)
      window.removeEventListener('resize', onScroll)
      cancelAnimationFrame(rafId)
    }
  }, [speed, rangeStart, rangeEnd])

  return ref
}

/** Fade + rise into view once, when the element enters the viewport.
 *  Returns [ref, isVisible]; caller applies the transition classes.
 *  Reduced-motion → starts visible, no animation. */
export function useRevealOnScroll<T extends HTMLElement = HTMLDivElement>() {
  const ref = useRef<T>(null)
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      setVisible(true)
      return
    }
    const io = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            setVisible(true)
            io.disconnect()
          }
        }
      },
      { threshold: 0.2 },
    )
    io.observe(el)
    return () => io.disconnect()
  }, [])

  return [ref, visible] as const
}

