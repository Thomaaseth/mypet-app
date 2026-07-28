import { createFileRoute } from '@tanstack/react-router';
import { useLanguageContext } from '@/contexts/LanguageContext';
import { LegalPageLayout, LegalSection } from '@/components/legal/LegalPageLayout';

export const Route = createFileRoute('/cookies')({
  component: CookiePolicyPage,
});

function CookiePolicyPageEn() {
  return (
    <LegalPageLayout title="Cookie Policy" lastUpdatedLabel="Last updated: [DATE].">
      <LegalSection title="What cookies we use today">
        <p>Pettr currently uses one type of cookie:</p>
        <ul className="list-disc pl-5">
          <li><strong>Strictly necessary</strong>: keeps you signed in (session/authentication). Cannot be refused, it is required for the app to function, and exempt from consent requirements under GDPR/ePrivacy.</li>
        </ul>
      </LegalSection>

      <LegalSection title="What we don&apos;t use">
        <p>
          We do not currently use analytics cookies, advertising cookies, or any third-party tracking cookies.
          The &quot;Analytics&quot; option in our cookie preferences center exists so you can express a preference in
          advance. But as of today, nothing is collected under that category, because we haven&apos;t built any
          analytics integration yet. If that ever changes, this policy will be updated first, and the choice
          you already made will apply.
        </p>
      </LegalSection>

      <LegalSection title="Your choice">
        <p>
          When you first visit Pettr, you&apos;re asked to accept or reject non-essential cookies via a consent
          banner. You can change your choice at any time via &quot;Manage preferences&quot; in the site footer and that
          link stays available even after the initial banner is gone, so changing your mind doesn&apos;t require
          waiting for it to reappear. Your choice is stored locally in your browser, and — separately — we
          keep a record that consent was requested and what you chose, so that we can demonstrate compliance
          if ever asked to (see our Privacy Policy for detail on that record).
        </p>
        <p>We ask again roughly every 6 months, in line with recommended practice, even if you don&apos;t change anything in between.</p>
      </LegalSection>

      <LegalSection title="Third-party cookies">
        <p>We don&apos;t currently use any third-party cookies (no embedded ads, no third-party analytics scripts, no social media widgets that set cookies).</p>
      </LegalSection>

      <LegalSection title="Contact">
        <p>Questions about cookies: contact@pettr.life</p>
      </LegalSection>
    </LegalPageLayout>
  );
}

function CookiePolicyPageFr() {
  return (
    <LegalPageLayout title="Politique de cookies" lastUpdatedLabel="Dernière mise à jour : [DATE].">
      <LegalSection title="Quels cookies nous utilisons aujourd&apos;hui">
        <p>Pettr utilise actuellement un seul type de cookie :</p>
        <ul className="list-disc pl-5">
          <li><strong>Strictement nécessaire</strong> : vous garder connecté (session / authentification). Ne peut pas être refusé car est indispensable au fonctionnement de l&apos;application, et exempté de l&apos;obligation de consentement au titre du RGPD / de la directive ePrivacy.</li>
        </ul>
      </LegalSection>

      <LegalSection title="Ce que nous n&apos;utilisons pas">
        <p>
          Nous n&apos;utilisons actuellement aucun cookie analytique, publicitaire, ou de suivi tiers. L&apos;option
          « Analytiques » dans notre centre de préférences existe pour que vous puissiez exprimer un choix à
          l&apos;avance. Mais à ce jour, aucune donnée n&apos;est collectée sous cette catégorie, car nous n&apos;avons pas
          encore mis en place d&apos;outil d&apos;analyse. Si cela devait changer, cette politique sera mise à jour au
          préalable, et le choix que vous avez déjà fait s&apos;appliquera.
        </p>
      </LegalSection>

      <LegalSection title="Votre choix">
        <p>
          Lors de votre première visite sur Pettr, il vous est demandé d&apos;accepter ou de refuser les cookies
          non essentiels via une bannière de consentement. Vous pouvez modifier votre choix à tout moment via
          « Gérer les préférences » dans le pied de page du site et ce lien reste disponible même après la
          disparition de la bannière initiale, afin que changer d&apos;avis ne nécessite pas d&apos;attendre qu&apos;elle
          réapparaisse. Votre choix est stocké localement dans votre navigateur, et — séparément — nous
          conservons un registre attestant que le consentement a été demandé et de votre choix, afin de
          pouvoir démontrer notre conformité si cela nous est demandé (voir notre Politique de confidentialité
          pour plus de détails sur ce registre).
        </p>
        <p>Nous redemandons votre consentement environ tous les 6 mois, conformément aux bonnes pratiques recommandées, même si vous ne changez rien entre-temps.</p>
      </LegalSection>

      <LegalSection title="Cookies tiers">
        <p>Nous n&apos;utilisons actuellement aucun cookie tiers (pas de publicités intégrées, pas de scripts d&apos;analyse tiers, pas de widgets de réseaux sociaux déposant des cookies).</p>
      </LegalSection>

      <LegalSection title="Contact">
        <p>Questions relatives aux cookies : contact@pettr.life</p>
      </LegalSection>
    </LegalPageLayout>
  );
}

function CookiePolicyPage() {
  const { language } = useLanguageContext();
  return language === 'fr' ? <CookiePolicyPageFr /> : <CookiePolicyPageEn />;
}