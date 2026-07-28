import { useEffect } from 'react';
import { Link } from '@tanstack/react-router';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { useLanguageContext } from '@/contexts/LanguageContext';
import { useCookieConsentContext } from '@/contexts/CookieConsentContext';
import { cn } from '@/lib/utils';
import type { Language } from '@/shared/validations/language';
import { useElementHeight } from '@/hooks/useElementHeight';

const LANGUAGE_LABELS: Record<Language, string> = {
  en: 'EN',
  fr: 'FR',
};

// Read by CookieConsentBanner so it can float just above the footer
// (whatever height the footer actually is, in either language) instead of
// the page reserving artificial padding sized to the banner's own height.
const FOOTER_HEIGHT_CSS_VAR = '--footer-height';

export function Footer() {
  const { t } = useTranslation();
  const { language, setLanguage, supportedLanguages } = useLanguageContext();
  const { openPreferencesDialog } = useCookieConsentContext();
  const [footerRef, footerHeight] = useElementHeight<HTMLElement>();

  useEffect(() => {
    document.documentElement.style.setProperty(FOOTER_HEIGHT_CSS_VAR, `${footerHeight}px`);
  }, [footerHeight]);

  return (
    <footer ref={footerRef} className="border-t bg-background">
      <div className="container mx-auto px-4 py-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-muted-foreground">
        <nav className="flex flex-wrap items-center justify-center gap-x-4 gap-y-2">
          <Link to="/privacy" search={{}} className="hover:text-foreground hover:underline">
            {t('footer.links.privacy')}
          </Link>
          <Link to="/terms" search={{}} className="hover:text-foreground hover:underline">
            {t('footer.links.terms')}
          </Link>
          <Link to="/legal-notice" search={{}} className="hover:text-foreground hover:underline">
            {t('footer.links.legalNotice')}
          </Link>
          <Link to="/cookies" search={{}} className="hover:text-foreground hover:underline">
            {t('footer.links.cookies')}
          </Link>
          {/* Persistent entry point — the banner's own "Manage preferences"
              button disappears once hasConsented is true (up to 6 months),
              but consent must remain changeable at any time (GDPR Art. 7(3)).
              Reuses the banner's translation key rather than duplicating it. */}
          <button
            type="button"
            onClick={openPreferencesDialog}
            className="hover:text-foreground hover:underline"
          >
            {t('cookies.banner.managePreferences')}
          </button>
        </nav>

        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1" aria-label={t('footer.language.label')}>
            {supportedLanguages.map((lng, index) => (
              <span key={lng} className="flex items-center gap-1">
                {index > 0 && <span className="text-muted-foreground/50">/</span>}
                <Button
                  variant="link"
                  size="sm"
                  onClick={() => setLanguage(lng)}
                  className={cn(
                    'h-auto p-0',
                    lng === language
                      ? 'font-semibold text-foreground no-underline hover:no-underline cursor-default'
                      : 'text-muted-foreground'
                  )}
                  disabled={lng === language}
                >
                  {LANGUAGE_LABELS[lng]}
                </Button>
              </span>
            ))}
          </div>

          <span>{t('footer.copyright', { year: new Date().getFullYear() })}</span>
        </div>
      </div>
    </footer>
  );
}