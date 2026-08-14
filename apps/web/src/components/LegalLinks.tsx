import { Link } from '@tanstack/react-router';
import { useTranslation } from 'react-i18next';
import { useCookieConsentContext } from '@/contexts/CookieConsentContext';
import { cn } from '@/lib/utils';

interface LegalLinksProps {
  // 'inline' → wrapping row (footer); 'stacked' → vertical list (Profile card).
  orientation?: 'inline' | 'stacked';
}

// Single source of truth for the legal/consent links. Rendered in the footer
// (logged-out) and in the Profile "Legal & preferences" card (logged-in)
export function LegalLinks({ orientation = 'inline' }: LegalLinksProps) {
  const { t } = useTranslation();
  const { openPreferencesDialog } = useCookieConsentContext();

  const linkClassName = 'hover:text-foreground hover:underline';

  return (
    <nav
      className={cn(
        orientation === 'inline'
          ? 'flex flex-wrap items-center justify-center gap-x-4 gap-y-2'
          : 'flex flex-col items-start gap-2'
      )}
    >
      <Link to="/privacy" search={{}} className={linkClassName}>
        {t('footer.links.privacy')}
      </Link>
      <Link to="/terms" search={{}} className={linkClassName}>
        {t('footer.links.terms')}
      </Link>
      <Link to="/legal-notice" search={{}} className={linkClassName}>
        {t('footer.links.legalNotice')}
      </Link>
      <Link to="/cookies" search={{}} className={linkClassName}>
        {t('footer.links.cookies')}
      </Link>
      {/* Persistent entry point; the banner's own "Manage preferences" button
          disappears once hasConsented is true (up to 6 months), but consent
          must remain changeable at any time. */}
      <button type="button" onClick={openPreferencesDialog} className={cn(linkClassName, 'text-left')}>
        {t('cookies.banner.managePreferences')}
      </button>
    </nav>
  );
}