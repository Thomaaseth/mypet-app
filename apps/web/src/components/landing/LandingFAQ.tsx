import {
  Section,
  SectionInner,
  Stack,
  LandingHeading,
  LandingSubheading,
  LandingEyebrow,
  LandingText,
  shadowBoxStyle,
  useRevealOnScroll,
} from './LandingSystem'


export function LandingFAQ() {
  return (
    <Section>
      <SectionInner>
        {/* Intro = 1300 shadow box, flat bg-primary. text-white here → all
            children (eyebrow/heading/subheading) inherit it; cards override
            back to text-black since they sit on a white surface. */}
        <div
          className="relative flex min-h-[65vh] items-center justify-center overflow-hidden rounded-[30px] bg-[#602037] p-[50px] text-center text-white lg:p-[70px]"
          style={shadowBoxStyle}
        >
          <div className="relative z-10 mx-auto max-w-[1200px]">
            <Stack gap="lg" align="center">
              <Stack gap="sm" align="center">
                <LandingEyebrow>ROADMAP</LandingEyebrow>
                <LandingHeading as="h1">Coming Soon To Pettr</LandingHeading>
                <LandingSubheading>
                  Take a double-you-aye-el-kay with us
                </LandingSubheading>
              </Stack>

              {/* Feature cards — fade up in as they enter view, staggered */}
              <div className="grid w-full gap-10 text-left md:grid-cols-3">
    
              </div>
            </Stack>
          </div>
        </div>
      </SectionInner>
    </Section>
  )
}