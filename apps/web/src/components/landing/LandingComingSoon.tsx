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

interface RoadmapCard {
  badgeLabel: string
  badgeColor: string
  badgeBg: string
  badgeBorder: string
  heading: string
  description: string
}

/** Three feature cards from the Elementor "Coming soon" roadmap block. */
const ROADMAP_CARDS: RoadmapCard[] = [
  {
    badgeLabel: 'working with vets',
    badgeColor: '#284D66',
    badgeBg: '#284D661F',
    badgeBorder: '#284D66',
    heading: 'Full Pet-Vet integration',
    description:
      "A full vet dashboard to streamline vet appointments and make sure they you both get the full picture of your pets health.",
  },
  {
    badgeLabel: 'Helping pet parents take care',
    badgeColor: '#DA921D',
    badgeBg: '#EBAB421F',
    badgeBorder: '#EBAB42',
    heading: 'Heightened Document organization',
    description:
      "Pettr becomes your pet's second home by holding and tracking every document with a quick organization system.",
  },
  {
    badgeLabel: 'no missed symptoms',
    badgeColor: '#602037',
    badgeBg: '#60203724',
    badgeBorder: '#284D66',
    heading: 'Full-scale Symptom tracking',
    description:
      "More analytics by pettr to make sure you don't miss the type or frequency of symptoms your pet has.",
  },
]

export function LandingComingSoon() {
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
                {ROADMAP_CARDS.map((card, i) => (
                  <RoadmapCardItem key={card.heading} card={card} delayMs={i * 150} />
                ))}
              </div>
            </Stack>
          </div>
        </div>
      </SectionInner>
    </Section>
  )
}

function RoadmapCardItem({
  card,
  delayMs,
}: {
  card: RoadmapCard
  delayMs: number
}) {
  const [ref, visible] = useRevealOnScroll<HTMLDivElement>()

  return (
    <div
      ref={ref}
      className="flex flex-col items-start gap-6 rounded-2xl bg-white p-10 text-black transition-all"
      style={{
        ...shadowBoxStyle,
        opacity: visible ? 1 : 0,
        transform: visible ? 'translateY(0)' : 'translateY(14px)',
        transitionDuration: '900ms',
        transitionTimingFunction: 'cubic-bezier(0.16, 1, 0.3, 1)',
        transitionDelay: `${delayMs}ms`,
      }}
    >
      <span
        className="rounded-full border px-2.5 py-1 text-[11px] font-medium capitalize"
        style={{
          color: card.badgeColor,
          backgroundColor: card.badgeBg,
          borderColor: card.badgeBorder,
        }}
      >
        {card.badgeLabel}
      </span>
      <LandingSubheading as="h3">{card.heading}</LandingSubheading>
      <LandingText>{card.description}</LandingText>
    </div>
  )
}