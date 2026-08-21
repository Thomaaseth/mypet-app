import { useEffect, useRef } from 'react'

/**
 * Landing section — "Mockup -- approved block".
 * Export values: section 75vh / 80px pad / 1500px boxed / #F8F8F8;
 * left 50% Bricolage heading (black) + Montserrat sub;
 * right 50% (800px) phone as background image, position BOTTOM RIGHT,
 * size contain, with:
 *   - upward scroll parallax (translateY negative, speed 1.9, range 14%–72%)
 *   - overlay gradient fade: transparent -> #F8F8F8 between 80% and 87%
 *     (softens the wrist into the page — this is the "blur" from the design;
 *      the export uses a fade, not a Gaussian blur).
 *
 * Phone asset: transparent PNG at /public/landing/Pettr-landing-phone.png
 */

const PHONE = '/landing/Pettr-landing-phone.png'

function useScrollParallax(speed: number, rangeStart: number, rangeEnd: number) {
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

export function LandingMockup() {
  const phoneRef = useScrollParallax(1.9, 0.14, 0.72)

  return (
    <section className="mx-auto w-full max-w-[1500px] bg-[#F8F8F8] px-6 py-20 sm:px-20">
      <div className="mx-auto grid w-full max-w-[1400px] grid-cols-1 items-center gap-8 md:grid-cols-2">
        {/* LEFT — copy */}
        <div className="flex flex-col justify-center">
          <h2 className="font-display text-[40px] font-bold leading-[1.02] tracking-tight text-black sm:text-[64px] lg:text-[84px]">
            Built Around What Pet Parents Forget &amp; What Vets Actually Ask For
          </h2>
          <p className="mt-8 max-w-md font-body text-lg text-foreground/70">
            Pettr helps your vets find missed or lost data, helping your pet
            live longer (change copy and make this a cta box probably.
          </p>
        </div>

        {/* RIGHT — phone, BOTTOM-right anchored, upward parallax, wrist fade */}
        <div className="relative min-h-[560px] w-full overflow-hidden md:min-h-[800px]">
          <div
            ref={phoneRef}
            className="absolute inset-0 bg-contain bg-[right_bottom] bg-no-repeat will-change-transform"
            style={{ backgroundImage: `url(${PHONE})` }}
          />
          {/* full-height fade: transparent until 80%, blends to #F8F8F8 by 87% */}
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0"
            style={{
              background:
                'linear-gradient(180deg, rgba(248,248,248,0) 80%, #F8F8F8 87%)',
            }}
          />
        </div>
      </div>
    </section>
  )
}