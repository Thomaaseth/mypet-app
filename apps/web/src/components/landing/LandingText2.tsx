import {
  Section,
  SectionInner,
  LandingText,
  useScrollParallax,
  useRevealOnScroll,
} from './LandingSystem'

const CATDOG2 = '/landing/Cat-and-dog_No-background-scaled-e1787140745404.png'

export function LandingText2() {
  // Poppier: speed 2.2, active range 0.05–0.95 (progress is clamped 0–1
  // internally, so anything past 1 as rangeEnd was previously a no-op).
  const catdog2Ref = useScrollParallax(2.2, 0.05, 0.95)
  const [copyRef, copyVisible] = useRevealOnScroll<HTMLDivElement>()
  const [catdog2WrapRef, catdog2Visible] = useRevealOnScroll<HTMLDivElement>()

  return (
    <Section>
      <SectionInner>
        <div className="mx-auto max-w-[1500px]">
          {/* Photo column wider than text (38fr/30fr), gap-0 — columns
              sit close together per your ask. */}
          <div className="grid grid-cols-[38fr_30fr] items-stretch gap-0">
            {/* LEFT — copy, drifts down into place. Heading written directly
                (not via LandingHeading) so it can run smaller on mobile to
                fit this narrower column; still Bricolage 700, same family/
                weight/tracking pattern, just its own scale. */}
            <div
              ref={copyRef}
              className={`flex flex-col justify-center gap-0 transition-all duration-[1400ms] ease-[cubic-bezier(0.16,1,0.3,1)] md:gap-8 ${
                copyVisible
                  ? 'translate-y-0 opacity-100'
                  : '-translate-y-8 opacity-0'
              }`}
            >
              <h2 className="font-display font-bold capitalize text-[28px] leading-[1.15] tracking-[-1px] md:text-[54px] md:leading-[1.2] md:tracking-[-2px] lg:text-[84px] lg:leading-[74px] lg:tracking-[-2.3px]">
                Keep your vet in the loop with all the things you tend to forget.
              </h2>
              <div className="max-w-lg">
                <LandingText>
                  Vets need a full picture of your pets health to treat them comprehensively and for longevity. Starting with food, weight, treatments, and timelines, Pettr continues to build features to make sure small things pet parents can sometimes forget are still being told to your vet. Small things add up and Pettr can help.
                </LandingText>
              </div>
            </div>

            {/* RIGHT — photo column. overflow-hidden clips anything the
                -25px shift or the contain-sized image would otherwise push
                past the box edge. self-stretch fills whatever height the
                text column ends up at. */}
            <div
              ref={catdog2WrapRef}
              className={`relative w-full min-h-[52vh] self-stretch overflow-hidden transition-all duration-[1200ms] ease-[cubic-bezier(1.16,1,0.3,1)] delay-[250ms] ${
                catdog2Visible
                  ? 'translate-y-0 scale-100 opacity-100'
                  : 'translate-y-8 scale-95 opacity-0'
              }`}
            >
              {/* ambient glow — neutral, fully desaturated. Fixed in the box
                  (not part of the moving group below). */}
              <div
                aria-hidden
                className="pointer-events-none absolute inset-0 motion-safe:animate-pulse"
                style={{
                  background:
                    'radial-gradient(60% 55% at 65% 45%, rgba(0,0,0,0.10) 0%, rgba(0,0,0,0) 40%)',
                  animationDuration: '3s',
                }}
              />

              {/* Moving group: 25px static upward shift, applied on this
                  wrapper so it doesn't fight the parallax hook's own
                  scroll-driven transform (set on the child below). */}
              <div className="absolute inset-0 -translate-y-[25px]">
                {/* Image carries its own fade via mask-image — top fade only
                    (0→15%), stays fully opaque through to 100% — lower
                    gradient removed per your last request. */}
                <div
                  ref={catdog2Ref}
                  className="absolute inset-0 bg-contain bg-[center_center] bg-no-repeat will-change-transform"
                  style={{
                    backgroundImage: `url(${CATDOG2})`,
                    maskImage:
                      'linear-gradient(180deg, transparent 0%, black 15%, black 100%)',
                    WebkitMaskImage:
                      'linear-gradient(180deg, transparent 0%, black 15%, black 100%)',
                    maskRepeat: 'no-repeat',
                    WebkitMaskRepeat: 'no-repeat',
                  }}
                />
              </div>
            </div>
          </div>
        </div>
      </SectionInner>
    </Section>
  )
}