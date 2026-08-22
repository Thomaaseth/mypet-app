import {
  Section,
  SectionInner,
  Stack,
  LandingHeading,
  LandingSubheading,
  LandingButton,
  shadowBoxStyle,
} from './LandingSystem'

const HERO_IMAGE =
  'landing/pexels-snapwire-46024-scaled.jpg'

/** Burgundy → dark overlay so white text stays legible over the photo. */
const HERO_OVERLAY =
  'linear-gradient(180deg, #0000006E 0%, #602037C7 100%)'

export function LandinglargeCTA() {
  return (
    <Section>
      <SectionInner>
        {/* Intro = 1300 shadow box. Photo + overlay live on THIS box div;
            bg-fixed = fixed-on-scroll; overflow-hidden keeps the 15px corners.
            text-white here → all children inherit it. */}
        <div
          className="relative flex min-h-[74vh] items-center justify-center overflow-hidden rounded-[30px] bg-cover bg-fixed bg-top p-[40px] text-center text-white lg:p-[70px]"
          style={{ backgroundImage: `url(${HERO_IMAGE})`, ...shadowBoxStyle }}
        >
          <div
            aria-hidden
            className="absolute inset-0"
            style={{ background: HERO_OVERLAY }}
          />

          <div className="relative z-10 mx-auto max-w-[1200px]">
            <Stack gap="lg" align="center">
              <LandingHeading as="h1">  <span className="lg:text-[84px] md:text-[54px]">  
                Join us on the journey to more aware vet-first pet care </span>
              </LandingHeading>

              <LandingSubheading> 
                Help your pet <i>&amp;</i> your vet bet one of the first to experience enhanced care with Pettr.
              </LandingSubheading>

              <LandingButton href="#" withArrow>
                Sign up for the beta now
              </LandingButton>
            </Stack>
          </div>
        </div>
      </SectionInner>
    </Section>
  )
}