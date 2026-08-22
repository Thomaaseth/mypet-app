import {
  Section,
  LandingText,
  LandingHeading,
  useScrollParallax,
  useRevealOnScroll,
  shadowBoxStyle,
} from './LandingSystem'

const PROFILE_CARD_IMAGE =
  '/landing/Screenshot-2026-08-18-at-14.49.13-e1787132313566.png' // confirm filename

export function LandingCofounder() {
  // Speed down from 2.2 -> 0.8, same active range — noticeably calmer drift.
  const cardRef = useScrollParallax(0.8, 0.05, 0.95)
  const [cardWrapRef, cardVisible] = useRevealOnScroll<HTMLDivElement>()

  const heading = (
    <LandingHeading>
      Meet our inspiration <i>&amp;</i> co-founder <i>Mindanao</i>
    </LandingHeading>
  )

  const body = (
    <LandingText>
      Talking points of managing her symptoms (we should use this even though
      the feature isn&apos;t ready, let&apos;s talk more about what the
      inspiration is behind it.
    </LandingText>
  )

  return (
    <Section>
      <div className="p-7 w-full max-w-[1300px]">
        <div
          className="relative overflow-visible rounded-[15px] bg-accent p-[30px] text-white lg:p-[50px]"
          style={shadowBoxStyle}
        >
          {/* DESKTOP (lg+): card overlaps ABOVE the box only (-mt-[80px]),
              left-aligned inside the row; text beside it. Both refs now
              merged onto the SAME element (via a callback ref), so the
              parallax transform moves the whole card — shadow, radius,
              border, everything — not just the image inside it. */}
          <div className="hidden lg:flex lg:items-start lg:gap-[50px]">
            <div
              ref={(node) => {
                cardWrapRef.current = node
                cardRef.current = node
              }}
              className={`-mt-[80px] w-[260px] shrink-0 overflow-hidden rounded-[15px] will-change-transform transition-all duration-[1200ms] ease-[cubic-bezier(1.16,1,0.3,1)] ${
                cardVisible
                  ? 'translate-y-0 scale-100 opacity-100'
                  : 'translate-y-8 scale-95 opacity-0'
              }`}
              style={shadowBoxStyle}
            >
              <img
                src={PROFILE_CARD_IMAGE}
                alt="Mindanao — pet profile card"
                className="block w-full"
              />
            </div>

            <div className="flex flex-1 flex-col gap-6 pt-2">
              {heading}
              {body}
            </div>
          </div>

          {/* TABLET (md–lg): same up-only overlap idea as desktop, scaled
              down — smaller card, smaller lift, tighter gap. No parallax
              here, unchanged from before. */}
          <div className="hidden md:flex md:items-start md:gap-[30px] lg:hidden">
            <div
              className="-mt-[50px] w-[180px] shrink-0 overflow-hidden rounded-[15px]"
              style={shadowBoxStyle}
            >
              <img
                src={PROFILE_CARD_IMAGE}
                alt="Mindanao — pet profile card"
                className="block w-full"
              />
            </div>
            <div className="flex flex-1 flex-col gap-6 pt-2">
              {heading}
              {body}
            </div>
          </div>

          {/* MOBILE (<md): card floats top-left, bled past the box's own
              corner via negative margin; heading wraps via float; body
              clears the float. Unchanged. */}
          <div className="md:hidden">
            <div
              className="float-left mr-4 mb-4 -mt-[100px] ml-[0px] w-[140px] overflow-hidden rounded-[15px]"
              style={shadowBoxStyle}
            >
              <img
                src={PROFILE_CARD_IMAGE}
                alt="Mindanao — pet profile card"
                className="block w-full"
              />
            </div>

            {heading}

            <div className="clear-left pt-0">{body}</div>
          </div>
        </div>
      </div>
    </Section>
  )
}