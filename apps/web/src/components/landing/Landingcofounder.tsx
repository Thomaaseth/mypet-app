/**
 * Landing section — co-founder ("Meet Our inspiration & Co-Founder Mindanao").
 *
 * Spec:
 *   - section: flex, max-width 1500px; inner content 1200px; 50px row/col gaps;
 *     content aligned center.
 *   - left: pet-profile screenshot, ~33% width, border-radius 15px,
 *     shadow blur 10px rgba(0,0,0,0.17). Margins -200px top & -200px bottom
 *     with high z-index, so it overlaps the section above (the "Ready. Pet. Go.").
 *   - right: card, background #EBAB42, padding 60px (top/bottom) / 30px (l/r),
 *     border-radius 15px, same 10px shadow.
 *   - heading: "landing large heading size" (font-display, 84px desktop).
 *   - body: "landing secondary size" (font-body).
 *   - all text white.
 */

const PROFILE_IMG = '/landing/Screenshot-2026-08-18-at-14.49.13-e1787132313566.png'
const CARD_SHADOW = '0 0 10px rgba(0,0,0,0.17)'

export function LandingCofounder() {
  return (
    <section className="mx-auto flex w-full max-w-[1500px] justify-center px-6 py-[50px] sm:px-20">
      <div className="flex w-full max-w-[1200px] flex-col items-center gap-[50px] md:flex-row md:justify-between">
        {/* LEFT — pet profile screenshot, overlaps the section above */}
        <img
          src={PROFILE_IMG}
          alt="Mindanao — pet profile"
          className="relative z-10 -my-[200px] w-full shrink-0 rounded-[15px] md:w-1/3"
          style={{ boxShadow: CARD_SHADOW }}
        />

        {/* RIGHT — orange card */}
        <div
          className="w-full rounded-[15px] bg-accent px-[30px] py-[60px]"
          style={{ boxShadow: CARD_SHADOW }}
        >
          <h2 className="font-display text-[28px] font-bold leading-[1.05] text-white sm:text-[56px] lg:text-[84px]">
            Meet Our inspiration &amp; Co-Founder <i>Mindanao</i>
          </h2>
          <p className="mt-6 font-body text-lg text-white sm:text-xl">
            Talking points of managing her symptoms (we should use this even
            though the feature isn&apos;t ready, let&apos;s talk more about what
            the inspiration is behind it.
          </p>
        </div>
      </div>
    </section>
  )
}