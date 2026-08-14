import { useEffect } from 'react';
import { LegalLinks } from '@/components/LegalLinks';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { useLanguageContext } from '@/contexts/LanguageContext';
import { useSessionContext } from '@/contexts/SessionContext';
import { cn } from '@/lib/utils';
import type { Language } from '@/shared/validations/language';
import { useElementHeight } from '@/hooks/useElementHeight';

const LANGUAGE_LABELS: Record<Language, string> = {
  en: 'EN',
  fr: 'FR',
};

// Read by CookieConsentBanner so it can float just above the footer
const FOOTER_HEIGHT_CSS_VAR = '--footer-height';

export function Footer() {
  const { t } = useTranslation();
  const { language, setLanguage, supportedLanguages } = useLanguageContext();
  const { user } = useSessionContext();
  const [footerRef, footerHeight] = useElementHeight<HTMLElement>();

  useEffect(() => {
    document.documentElement.style.setProperty(FOOTER_HEIGHT_CSS_VAR, `${footerHeight}px`);
  }, [footerHeight]);

  // Logged-out users get the full legal/consent links here on every route.
  // Logged-in users get them relocated to the Profile "Legal & preferences" card
  const isLoggedIn = user !== null;

  return (
    <footer ref={footerRef} className="border-t bg-background">
      <div className={cn(
        "container mx-auto px-4 py-6 flex flex-col sm:flex-row items-center gap-4 text-sm text-muted-foreground",
        isLoggedIn ? "justify-center sm:justify-end" : "sm:justify-between"
      )}>
      {!isLoggedIn && <LegalLinks orientation="inline" />}

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