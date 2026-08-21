/**
 * Landing hero — "INTRO - approved block".
 * Values taken verbatim from the Elementor export for this section:
 *   - outer: 1500px boxed, shadow 0 5px 30px rgba(0,0,0,0.1), 80px side padding
 *   - photo card: 75vh min-height, 50px padding, 30px radius, background cover
 *   - overlay: linear-gradient(180deg, #602037D6 -> #0000006E) at 0.95 opacity
 *   - title: 84px (28px mobile) Bricolage, white, centered
 *   - subtitle: Montserrat (secondary), white, centered
 *   - button: 13px radius, 16px, accent bg / primary text, inverts on hover
 *
 * Omitted per instruction: navbar, footer, decorative paws.
 * Hero image lives at /public/landing/… and is served from the site root.
 */

const HERO_IMAGE = '/landing/pexels-2151973914-32553503-1-scaled-e1786633738314.jpg'

// 180deg burgundy (#602037 @ ~0.84) fading to black (@ ~0.43), whole layer at 0.95.
const HERO_OVERLAY =
  'linear-gradient(180deg, rgba(96,32,55,0.80) 0%, rgba(0,0,0,0.41) 100%)'

export function LandingHero() {
  return (
    <section
      className="mx-auto w-full max-w-[1500px] px-5 pt-2.5 sm:px-20"
      style={{ filter: 'drop-shadow(0 5px 30px rgba(0,0,0,0.1))' }}
    >
      <div
        className="relative flex min-h-[75vh] flex-col items-center justify-center overflow-hidden rounded-[30px] bg-cover bg-center p-8 text-center sm:p-[50px]"
        style={{ backgroundImage: `url(${HERO_IMAGE})` }}
      >
        {/* wine-tint → dark gradient overlay */}
        <div
          aria-hidden
          className="absolute inset-0"
          style={{ background: HERO_OVERLAY, opacity: 0.95 }}
        />

        <div className="relative z-10 mx-auto max-w-[1100px]">
          <h1 className="font-display text-[28px] font-bold leading-[1.05] text-white sm:text-[56px] lg:text-[84px]">
            Introducing The Only Vet-First Longevity <i>&amp;</i> Wellness Pet
            Health Tracking System
          </h1>

          <p className="mx-auto mt-8 max-w-2xl font-body text-lg text-white/90 sm:text-xl">
            The Pet Health Tracker That Grows With Your Pet <i>&amp;</i> With
            Your Vet.
          </p>

          <div className="mt-10">
            <a
              href="#"
              className="inline-flex items-center gap-2 rounded-[13px] border border-accent bg-accent px-6 py-3 text-base font-medium text-primary transition-colors hover:bg-primary hover:text-accent"
            >
              Sign up for the beta now
              <span aria-hidden>&rarr;</span>
            </a>
          </div>
        </div>
      </div>
    </section>
  )
}