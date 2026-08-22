import {
  Section,
  SectionInner,
  Stack,
  LandingHeading,
  LandingText,
  useRevealOnScroll,
} from './LandingSystem'
import { Venus, Syringe, Calendar, Scale, Cpu, Quote, MoreHorizontal } from 'lucide-react'

/* ---------------------------------------------------------------- */
/* Paw icon (brand mark, not lucide) — same mark used in LandingFAQ.  */
/* Worth hoisting into LandingSystem now that two sections use it.    */
/* ---------------------------------------------------------------- */

function PawIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 107.07 104.88" className={className} fill="currentColor">
      <path d="M63.68,80.13c-.68-2.76-1.45-5.89-2.08-9.02-.57-2.87-.18-5.51.18-8.07.46-3.12.88-6.07-.37-9.15-1.65-4.06-5.18-5.87-8.01-7.31-.51-.26-1-.51-1.46-.77-2.5-1.4-5.58-3.14-9.13-3.14-1.09,0-2.17.17-3.2.51-3.48,1.13-5.52,3.02-7.5,4.84-1.69,1.57-3.29,3.04-5.78,4.09-3.62,1.53-7.54,2.37-10.99,3.12-4.44.96-7.95,1.72-9.74,3.56-2.07,2.13-6.93,7.12-4.22,16.5.75,2.6,3.35,4.07,5.43,5.26l.15.08.81.45c1.79.99,3.84,1.63,5.91,1.87.9.1,1.77.19,2.61.27,4.77.49,8.54.87,13.27,3.44,1.73.99,3.22,2.06,4.65,3.37,2.02,1.91,3.65,4.03,5.54,6.48.44.57.89,1.16,1.37,1.77,1.27,1.61,2.85,2.96,4.7,4.01l.84.47c1.67.94,3.76,2.12,5.96,2.12.5,0,.99-.07,1.46-.19,7.7-2.06,11.14-8.78,11.54-11.57.02-.16.05-.33.07-.49.01-.13.03-.27.05-.39v-.05s.01-.04.01-.04c.26-2.61-.77-6.76-2.07-12.02ZM51.25,94.62h-.03s-.02-.03-.02-.03l-.81-.44c-.76-.44-1.43-1.01-1.91-1.62-.46-.59-.9-1.16-1.33-1.71-2.04-2.65-3.97-5.15-6.53-7.58l-.05-.05-.05-.04c-1.94-1.78-4.02-3.28-6.36-4.62l-.07-.04-.07-.04c-6.38-3.46-11.67-4-16.79-4.52-.8-.08-1.63-.16-2.5-.26-.86-.1-1.73-.37-2.48-.79l-.74-.4-.08-.05c-.4-.22-.94-.53-1.34-.78-.59-2.88.27-4.3,1.79-5.92,1.05-.42,3.56-.97,5.43-1.37,3.67-.79,8.22-1.78,12.65-3.64,3.99-1.69,6.48-3.98,8.48-5.83,1.75-1.62,2.59-2.35,4.06-2.83.11-.04.2-.05.31-.05,1.1,0,3.08,1.11,4.56,1.95l.04.02.04.02c.54.3,1.11.59,1.7.89,2.03,1.04,3.29,1.73,3.61,2.51.3.74.05,2.47-.22,4.31-.43,3.02-.98,6.78-.09,11.22.66,3.34,1.46,6.58,2.17,9.45.77,3.11,1.81,7.33,1.84,8.81-.02.12-.03.22-.04.31-.18.47-1.15,2.75-3.82,3.85-.46-.22-1.02-.54-1.35-.73Z" />
      <path d="M96.57,22.58c-2.98-2.34-6.54-3.57-10.31-3.57-5.06,0-10.05,2.22-14.04,6.24-4.45,4.45-6.85,11.73-5.84,17.72.64,3.76,2.58,6.61,5.48,8.02,2.09,1.01,4.49,1.53,7.13,1.53,5.73,0,12.12-2.51,16.69-6.56,3.99-3.54,6.2-8.32,6.05-13.11-.12-4.12-1.96-7.76-5.16-10.27ZM89.49,38.97c-2.89,2.56-7.01,4.21-10.5,4.21-1.17,0-2.21-.2-3.01-.57-1.01-1.22-.74-7.18,2.86-10.78,2.23-2.24,4.87-3.48,7.42-3.48,1.68,0,3.21.53,4.56,1.59,1.01.79,1.54,1.86,1.58,3.19.06,2.02-1,4.15-2.91,5.84Z" />
      <path d="M17.32,8.45c-1.2-.33-2.39-.5-3.53-.5-4.79,0-8.01,2.85-9.87,5.24C1.53,16.25.37,19.8.08,22.1c-.48,3.83,1.21,10.4,5.29,15.03,2.89,3.28,6.52,5.02,10.47,5.02,1.14,0,2.32-.15,3.51-.43,6.62-1.6,10.97-7.63,11.08-15.37.09-6.58-3.28-15.22-13.11-17.9ZM15.84,32.81c-.5,0-1.83,0-3.47-1.86-2.26-2.56-3.18-6.42-3.02-7.7.22-1.77,2.18-5.96,4.44-5.96.3,0,.65.05,1.07.17,6.03,1.64,6.25,7.58,6.23,8.76-.03,2.53-1.09,5.73-3.91,6.42-.48.11-.93.17-1.34.17Z" />
      <path d="M105.09,63.08c-2.88-4.33-8.33-6.81-12.17-7.29-.44-.06-.9-.09-1.39-.09-4.86,0-11.81,2.6-15.72,7.56-2.68,3.4-3.55,7.48-2.51,11.8,1.6,6.63,7.89,11.08,15.64,11.08,6.48,0,14.99-3.44,17.63-13.12,1-3.63.5-6.97-1.48-9.94ZM97.91,70.66c-1.31,4.79-5.49,6.5-8.97,6.5-2.72,0-6.17-1.1-6.92-4.19-.4-1.67-.15-2.91.83-4.15,2.1-2.67,6.46-4.14,8.68-4.14.16,0,.25.01.27.01,1.63.21,4.64,1.59,5.83,3.37.42.64.63,1.32.28,2.6Z" />
      <path d="M68.45,13.34c-.54-7.73-6.33-13.34-13.75-13.34-1.71,0-3.41.3-5.08.89-7.34,2.59-11.65,10.5-10.96,20.16.62,9.24,4.7,14.33,11.49,14.33,1.03,0,2.14-.12,3.29-.36,8.98-1.9,15.72-11.62,15.01-21.68ZM51.53,25.87c-.52.11-.99.17-1.38.17-.48,0-.65-.08-.65-.08-.24-.16-1.26-1.62-1.53-5.58-.38-5.34,1.49-9.54,4.76-10.69.66-.23,1.33-.35,1.97-.35.96,0,4.13.33,4.43,4.66.38,5.39-3.18,10.94-7.6,11.87Z" />
    </svg>
  )
}

/* ---------------------------------------------------------------- */
/* Content — swap for the real profile once it exists                */
/* ---------------------------------------------------------------- */

const FOUNDER = {
  name: 'Mindanao',
  nickname: 'Dao',
  photo: 'https://placehold.co/640x760/EDE7DD/602037?text=Photo+placeholder',
  sex: 'Female',
  fixed: 'Spayed/Neutered',
  age: '10 years, 6 months',
  weight: '4.77 kg',
  chip: '250268600207567',
  adopted: 'Adopted March 30, 2019',
}

const stats: { icon: typeof Venus; label: string }[] = [
  { icon: Venus, label: FOUNDER.sex },
  { icon: Syringe, label: FOUNDER.fixed },
  { icon: Calendar, label: FOUNDER.age },
  { icon: Scale, label: FOUNDER.weight },
  { icon: Cpu, label: FOUNDER.chip },
  { icon: Quote, label: FOUNDER.adopted },
]

/* ---------------------------------------------------------------- */
/* Profile card — the notch is a radial mask cut from the bottom      */
/* right corner, sized with clamp() so it scales with the viewport    */
/* instead of jumping at a breakpoint. A paw print sits behind the    */
/* card so it reads through the cut, no manual overlap/offset needed. */
/* ---------------------------------------------------------------- */

function ProfileCard() {
  const [ref, visible] = useRevealOnScroll<HTMLDivElement>()
  const notch =
    'radial-gradient(circle at 100% 100%, transparent 0 clamp(24px,5vw,52px), black clamp(25px,5vw,53px) 100%)'

  return (
    <div
      ref={ref}
      className="relative mx-auto w-full max-w-[420px] transition-all duration-700 ease-out lg:mx-0"
      style={{
        opacity: visible ? 1 : 0,
        transform: visible ? 'translateY(0)' : 'translateY(24px)',
      }}
    >
      {/* paw print reads through the notch */}
      <PawIcon className="pointer-events-none absolute bottom-3 right-3 h-24 w-24 text-[#E3A73E]/25 sm:h-28 sm:w-28" />

      <div
        className="relative overflow-hidden rounded-[26px] bg-white p-6 shadow-[0_30px_60px_-28px_rgba(20,16,15,0.28)] transition-transform duration-500 hover:-translate-y-1 sm:p-7"
        style={{ WebkitMaskImage: notch, maskImage: notch }}
      >
        <div className="flex items-start justify-between">
          <div>
            <h3 className="text-2xl font-black tracking-tight text-[#14100F]">
              {FOUNDER.name}
            </h3>
            <p className="mt-0.5 text-[15px] text-[#8a857d]">{FOUNDER.nickname}</p>
          </div>
          <button
            type="button"
            aria-label="Profile options"
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-black/10 text-[#3c3c3c] transition-colors hover:bg-black/[0.04]"
          >
            <MoreHorizontal className="h-4 w-4" />
          </button>
        </div>

        <div className="mt-5 aspect-[4/3.3] overflow-hidden rounded-2xl bg-[#EDE7DD]">
          <img
            src={FOUNDER.photo}
            alt={`${FOUNDER.name} the cat`}
            className="h-full w-full object-cover"
            loading="lazy"
          />
        </div>

        <ul className="mt-6 flex flex-col gap-3.5">
          {stats.map(({ icon: Icon, label }) => (
            <li key={label} className="flex items-center gap-3 text-[15px] text-[#14100F]">
              <Icon className="h-[18px] w-[18px] shrink-0 text-[#8a857d]" strokeWidth={1.75} />
              <span className="font-semibold">{label}</span>
            </li>
          ))}
        </ul>

        {/* bottom padding fills the space the notch mask carves away,
            so real content never sits under the cut corner */}
        <div className="h-8 sm:h-9" aria-hidden="true" />
      </div>
    </div>
  )
}

/* ---------------------------------------------------------------- */
/* Section                                                             */
/* ---------------------------------------------------------------- */

export function LandingCofounder() {
  const [copyRef, copyVisible] = useRevealOnScroll<HTMLDivElement>()

  return (
    <Section>
      <SectionInner>
        <div className="grid items-center gap-10 lg:grid-cols-[0.85fr_1.15fr] lg:gap-16">
          <ProfileCard />

          <div
            ref={copyRef}
            className="relative overflow-hidden rounded-[28px] bg-[#E3A73E] p-8 text-white transition-all duration-700 ease-out sm:p-12 lg:p-14"
            style={{
              opacity: copyVisible ? 1 : 0,
              transform: copyVisible ? 'translateY(0)' : 'translateY(24px)',
              transitionDelay: '120ms',
            }}
          >
            <PawIcon className="pointer-events-none absolute -right-6 -top-6 h-40 w-40 rotate-[18deg] text-white/[0.08]" />

            <Stack gap="md" >
              <LandingHeading as="h2">
                Meet our inspiration &amp; co-founder{' '}
                <em className="font-black italic">{FOUNDER.name}</em>
              </LandingHeading>
              <LandingText>
                We write a whole little paragraph about DaDao &lt;3 Talking points
                of managing her symptoms (we should use this even though the
                feature isn't ready), let's talk more about what the inspiration
                is behind it.
              </LandingText>
            </Stack>
          </div>
        </div>
      </SectionInner>
    </Section>
  )
}