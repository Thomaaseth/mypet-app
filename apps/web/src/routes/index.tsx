import { createFileRoute } from '@tanstack/react-router'
import {
  Accordion,
  AccordionItem,
  AccordionTrigger,
  AccordionContent,
} from '@/components/ui/accordion'
import { ScrollShowcase } from '@/components/landing/scrollShowcase'
import { LandingHero } from '@/components/landing/LandingHero'
import { LandingMockup } from '@/components/landing/Landingmockup'
import { LandingCofounder } from '@/components/landing/Landingcofounder'
import { LandingFAQ } from '@/components/landing/LandingFAQ'
import { LandinglargeCTA } from '@/components/landing/LandingLargeCTA'
import { LandingComingSoon } from '@/components/landing/LandingComingSoon'
import { LandingText2 } from '@/components/landing/LandingText2'
export const Route = createFileRoute('/')({
  component: LandingPage,
})

const HOST = 'https://mediumseagreen-mule-814823.hostingersite.com'
const UPLOADS = `${HOST}/wp-content/uploads/2026/08`
const LOGO = `${UPLOADS}/Pettr_Logo_Full-Color_Wine-Ginger-1024x352.png`
const PAW = `${UPLOADS}/Pettr-Paw_2026.png`
const SCREENSHOT = `${UPLOADS}/Screenshot-2026-08-18-at-14.49.13-e1787132313566.png`

/**
 * Faithful visual rebuild of the Elementor "pettr-landing" template,
 * including the container styling system (card radii, shadows, panels)
 * read directly from the template export.
 *
 * Design system extracted from the export:
 *   - Card-in-card: 30px-radius outer shell -> 15px-radius inner card
 *     with shadow `0 0 10px rgba(0,0,0,0.17)`. Used by hero, FAQ, final CTA.
 *   - Header: #602037 pill, 15px radius, 1px #0000002E border, soft shadow.
 *   - Roadmap: #602037 panel at 30px radius, 3 white 15px cards + 1px dividers.
 *   - Co-founder text card: accent fill, 15px radius, shadow.
 *   - Footer right column: 2px translucent-accent top border.
 *
 * Unresolved Elementor global color IDs — resolved from context, centralized
 * here so they're trivial to correct if any is wrong:
 *   3acf0985 -> accent (CTA card fill)   ef9a968 -> accent (beta button border)
 *   02754a5  -> primary (nav button bg)
 *
 * Still NOT wired this pass (per request): cookie consent + i18n.
 * Links are placeholders (`#`) — source used popup triggers with no URLs.
 * Decorative paws: ~26 in the export but their coords live in per-element CSS
 * not included in the JSON, so a hand-placed subset stands in.
 */

const CARD_SHADOW = '0 0 10px rgba(0,0,0,0.17)'
const SECTION_SHADOW = '0 5px 30px rgba(0,0,0,0.1)'
const HAIRLINE = '#0000002E'

function LandingPage() {
  return (
    <div className="bg-[#F8F8F8] font-body text-foreground">
      {/* ============ HEADER — burgundy pill, gray/accent button borders ============ */}
      {/* <header
        className="sticky top-0 z-50"
        style={{ boxShadow: SECTION_SHADOW }}
      >
        <div className="bg-[#F8F8F8] px-4 py-3">
          <div
            className="mx-auto flex max-w-[1200px] items-center justify-between gap-4 rounded-[15px] bg-primary px-5 py-3"
            style={{ border: `1px solid ${HAIRLINE}`, boxShadow: CARD_SHADOW }}
          >
            <a href="#" className="flex items-center">
              <img
                src={LOGO}
                alt="Pettr"
                className="h-8 w-auto brightness-0 invert"
              />
            </a>
            <nav className="hidden items-center gap-2 sm:flex">
              <NavPill borderColor="#C0C0C0">Home</NavPill>
              <NavPill borderColor="var(--color-accent)">Beta</NavPill>
              <NavPill borderColor="#C0C0C0">Login</NavPill>
            </nav>
          </div>
        </div>
      </header> */}

      {/* ============ HERO — card-in-card (30px shell / 15px card) ============ */}
      <LandingHero />

      {/* ============ VALUE PROP — 75vh, overlaps showcase via -400px margin ============ */}
      <LandingMockup />

      {/* ============ INTERACTIVE SCROLL SHOWCASE — 1:1 from export ============ */}
      <ScrollShowcase />

      {/* ============ CO-FOUNDER — screenshot + accent text card ============ */}
      <LandingCofounder />

{/* ============ CO-FOUNDER — screenshot + accent text card ============ */}
      <LandingFAQ />

           {/* ============ CO-FOUNDER — screenshot + accent text card ============ */}
      <LandingComingSoon />

         {/* ============ CO-FOUNDER — screenshot + accent text card ============ */}
      <LandingText2 />


      {/* ============ FAQ — intro + accordion inside a 15px card ============ */}
      {/* <section className="flex min-h-[75vh] flex-col justify-center bg-[#F8F8F8] px-6 pt-[120px] pb-16 sm:px-20">
        <div
          className="mx-auto w-full max-w-[1200px] rounded-[15px] bg-white p-8 sm:p-12"
          style={{ boxShadow: CARD_SHADOW }}
        >
          <h2 className="font-display text-[36px] font-bold leading-[1.05] sm:text-[56px] lg:text-[84px]">
            <span className="bg-primary px-[5px] py-[2px] text-primary-foreground">
              We&apos;re&ensp;here&ensp;to&ensp;health.
            </span>
          </h2>
          <p className="mt-6 font-body text-lg text-muted-foreground sm:text-xl">
            <i>&amp;</i> to answer all your questions
          </p>

          <Accordion type="single" collapsible className="mt-10 w-full max-w-3xl">
            {FAQ_ITEMS.map((item, i) => (
              <AccordionItem key={i} value={`faq-${i}`}>
                <AccordionTrigger className="font-display text-lg font-semibold">
                  {item.q}
                </AccordionTrigger>
                <AccordionContent className="font-body text-base text-muted-foreground">
                  {item.a}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </section> */}

      {/* ============ ROADMAP — burgundy 30px panel, 3 white cards + dividers ============ */}
      {/* <section className="px-6 py-24 sm:px-20">
        <div className="mx-auto max-w-[1200px] rounded-[30px] bg-primary px-6 py-16 sm:px-12">
          <div className="text-center">
            <p className="font-display text-sm font-bold uppercase tracking-[0.2em] text-accent">
              Roadmap
            </p>
            <h2 className="mt-2 font-display text-[36px] font-bold leading-[1.05] text-white sm:text-[56px] lg:text-[64px]">
              Coming soon to Pettr
            </h2>
            <p className="mt-3 font-body text-lg text-white/70">
              Take a walk with us
            </p>
          </div>

          <div className="mt-14 grid gap-px overflow-hidden rounded-[15px] md:grid-cols-3">
            {ROADMAP.map((card, i) => (
              <div key={i} className="bg-white p-8">
                <span
                  className="inline-block rounded-full border px-3 py-1 text-[11px] font-medium uppercase tracking-widest"
                  style={{ borderColor: card.tone, color: card.tone }}
                >
                  {card.kicker}
                </span>
                <h3 className="mt-5 font-display text-2xl font-bold text-secondary">
                  {card.title}
                </h3>
                <p className="mt-3 font-body text-sm text-muted-foreground">
                  {card.body}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section> */}

  
      {/* ============ FINAL CTA — card-in-card (30px / 15px) ============ */}
      {/* <section className="px-6 py-24 sm:px-20">
        <div
          className="mx-auto max-w-[1000px] rounded-[30px]"
          style={{ boxShadow: SECTION_SHADOW }}
        >
          <div
            className="relative overflow-hidden rounded-[15px] bg-white px-6 py-16 text-center sm:px-16"
            style={{ boxShadow: CARD_SHADOW }}
          >
            <DecorPaws count={7} />
            <div className="relative mx-auto max-w-[820px]">
              <h2 className="font-display text-[36px] font-bold leading-[1.05] sm:text-[56px] lg:text-[72px]">
                Join us on the journey to more aware vet-first pet care
              </h2>
              <p className="mx-auto mt-6 max-w-2xl font-body text-lg text-secondary">
                Help your pet <i>&amp;</i> your vet be one of the first to
                experience enhanced care with Pettr.
              </p>
              <div className="mt-10">
                <BetaButton />
              </div>
            </div>
          </div>
        </div>
      </section> */}

       {/* ============ CO-FOUNDER — screenshot + accent text card ============ */}
      <LandinglargeCTA />

      {/* ============ FOOTER ============ */}
      <footer className="bg-[#F8F8F8] px-6 pt-[120px] pb-10 sm:px-20">
        <div className="mx-auto flex max-w-[1300px] flex-col gap-10 md:flex-row md:items-end md:justify-between">
          <div className="flex flex-col gap-6">
            <h1 className=" font-display font-bold capitalize text-[54px] leading-[1.2] tracking-[-2px] md:leading-[1] md:tracking-[-2.3px] lg:text-[84px] lg:leading-[88px]">
              Building a new generation of healthy pets
            </h1>
            <a
              href="#"
              className="inline-flex w-fit items-center rounded-[13px] border border-accent px-5 py-2 text-sm font-semibold text-accent transition-colors hover:bg-primary hover:text-primary-foreground"
            >
              Be the first to know more
            </a>
            <img src={LOGO} alt="Pettr" className="h-9 object-contain object-left" />
          </div>

          <div
            className="flex flex-col gap-4 pt-6 md:items-end"
            style={{ borderTop: '2px solid #EBAB4282' }}
          >
            <p className="max-w-sm font-body text-sm font-semibold uppercase tracking-widest text-accent md:text-right">
              Introducing the only vet-first longevity &amp; wellness pet health
              tracking system
            </p>
            <div className="flex gap-4 text-secondary">
              <SocialDot label="LinkedIn" />
              <SocialDot label="Instagram" />
              <SocialDot label="Resume" />
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}

/* ---------------- presentational helpers ---------------- */

function NavPill({
  children,
  borderColor,
}: {
  children: React.ReactNode
  borderColor: string
}) {
  return (
    <a
      href="#"
      className="rounded-[12px] px-4 py-1.5 text-[13px] font-normal text-accent transition-colors hover:bg-white/10"
      style={{ border: `1px solid ${borderColor}` }}
    >
      {children}
    </a>
  )
}

function BetaButton() {
  return (
    <a
      href="#"
      className="inline-flex items-center gap-2 rounded-[13px] border border-accent bg-accent px-6 py-3 text-base font-normal text-primary transition-colors hover:bg-primary hover:text-accent"
    >
      Sign up for the beta now
      <span aria-hidden>&rarr;</span>
    </a>
  )
}

function SocialDot({ label }: { label: string }) {
  return (
    <a
      href="#"
      aria-label={label}
      className="flex h-9 w-9 items-center justify-center rounded-full border border-current transition-colors hover:text-accent"
    >
      <span className="text-[10px] font-bold">{label.slice(0, 2)}</span>
    </a>
  )
}

/** Decorative scattered paws. Exact positions weren't in the export, so these
 *  are placed by hand at low opacity to echo the original without guessing. */
function DecorPaws({ count }: { count: number }) {
  const spots = [
    'left-[4%] top-[10%] rotate-[12deg]',
    'right-[6%] top-[18%] -rotate-[18deg]',
    'left-[12%] bottom-[14%] rotate-[24deg]',
    'right-[10%] bottom-[8%] -rotate-[10deg]',
    'left-[46%] top-[6%] rotate-[6deg]',
    'right-[24%] top-[44%] rotate-[40deg]',
    'left-[28%] bottom-[30%] -rotate-[28deg]',
  ]
  return (
    <div aria-hidden className="pointer-events-none absolute inset-0">
      {spots.slice(0, count).map((pos, i) => (
        <img
          key={i}
          src={PAW}
          alt=""
          className={`absolute w-[84px] opacity-[0.06] ${pos}`}
        />
      ))}
    </div>
  )
}

/* ---------------- content ---------------- */

const FAQ_ITEMS = [
  {
    q: 'What is different about Pettr?',
    a: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.',
  },
  {
    q: 'I already use a journal and go to the vet, why use Pettr?',
    a: 'Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.',
  },
  {
    q: 'What is different about Pettr?',
    a: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.',
  },
  {
    q: 'I already use a journal and go to the vet, why use Pettr?',
    a: 'Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.',
  },
  {
    q: 'My pet is in good health, can Pettr do anything for me?',
    a: 'Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat. Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod.',
  },
] as const

const ROADMAP = [
  {
    kicker: 'working with vets',
    title: 'Full Pet-Vet integration',
    body: 'A full vet dashboard to streamline vet appointments and make sure you both get the full picture of your pet\u2019s health.',
    tone: '#284D66',
  },
  {
    kicker: 'Helping pet parents take care',
    title: 'Heightened Document organization',
    body: 'Pettr becomes your pet\u2019s second home by holding and tracking every document with a quick organization system.',
    tone: '#602037',
  },
  {
    kicker: 'no missed symptoms',
    title: 'Full-scale Symptom tracking',
    body: 'More analytics by Pettr to make sure you don\u2019t miss the type or frequency of symptoms your pet has.',
    tone: '#EBAB42',
  },
] as const