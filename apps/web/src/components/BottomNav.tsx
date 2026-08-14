import { useEffect } from 'react';
import { Link, useLocation } from '@tanstack/react-router';
import { Stethoscope, CircleUser } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { PawIcon } from '@/components/ui/PawIcon';
import { useElementHeight } from '@/hooks/useElementHeight';
import { cn } from '@/lib/utils';

const BOTTOM_NAV_HEIGHT_CSS_VAR = '--bottom-nav-height';

type NavIcon = typeof PawIcon | typeof Stethoscope | typeof CircleUser;

interface BottomNavItem {
  to: string;
  labelKey: 'nav.pets' | 'nav.vets' | 'nav.profile';
  Icon: NavIcon;
}

const NAV_ITEMS: readonly BottomNavItem[] = [
  { to: '/pets', labelKey: 'nav.pets', Icon: PawIcon },
  { to: '/vets', labelKey: 'nav.vets', Icon: Stethoscope },
  { to: '/profile', labelKey: 'nav.profile', Icon: CircleUser },
] as const;

export function BottomNav() {
  const { t } = useTranslation();
  const location = useLocation();
  const [navRef, navHeight] = useElementHeight<HTMLElement>();

  useEffect(() => {
    document.documentElement.style.setProperty(BOTTOM_NAV_HEIGHT_CSS_VAR, `${navHeight}px`);
  }, [navHeight]);

  // Reset on unmount (e.g. logout) so logged-out / desktop pages don't inherit
  // a stale nav height as phantom bottom padding.
  useEffect(() => {
    return () => {
      document.documentElement.style.setProperty(BOTTOM_NAV_HEIGHT_CSS_VAR, '0px');
    };
  }, []);

  const isActivePath = (to: string): boolean =>
    to === '/' ? location.pathname === '/' : location.pathname.startsWith(to);

  return (
    <nav
      ref={navRef}
      aria-label={t('nav.primary')}
      className="sticky bottom-0 z-50 border-t bg-background md:hidden"
      style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
    >
      <ul className="flex items-stretch justify-around">
        {NAV_ITEMS.map(({ to, labelKey, Icon }) => {
          const active = isActivePath(to);
          return (
            <li key={to} className="flex-1">
              <Link
                to={to}
                search={{}}
                aria-label={t(labelKey)}
                aria-current={active ? 'page' : undefined}
                className={cn(
                  'flex items-center justify-center py-3 transition-colors',
                  active ? 'text-accent' : 'text-muted-foreground hover:text-foreground'
                )}
              >
                <Icon className="h-6 w-6" />
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}