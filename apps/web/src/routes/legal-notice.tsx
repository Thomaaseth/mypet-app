import { createFileRoute } from '@tanstack/react-router';
import { useLanguageContext } from '@/contexts/LanguageContext';
import { LegalPageLayout, LegalSection, LegalReviewNote } from '@/components/legal/LegalPageLayout';

export const Route = createFileRoute('/legal-notice')({
  component: LegalNoticePage,
});

// The French version is the legally authoritative one (this page exists to
// satisfy LCEN Art. 6-III, a French-law-specific requirement), the English
// version is provided for consistency with the rest of the bilingual site.
function LegalNoticePageEn() {
  return (
    <LegalPageLayout
      title="Legal Notice"
      lastUpdatedLabel="Last updated: [DATE]. This page exists to satisfy a French legal requirement (LCEN, Art. 6-III); the French version is the legally authoritative one."
    >
      <LegalSection title="Site publisher">
        <ul className="list-disc pl-5">
          <li><strong>Name</strong>: Thomas Demathieu</li>
          <li><strong>Status</strong>: Individual entrepreneur (French micro-entrepreneur)</li>
          <li><strong>SIRET</strong>: 98784461000012</li>
          <li><strong>Address</strong>: Paris 75020, France</li>
          <li><strong>Contact</strong>: contact@pettr.life</li>
        </ul>
      </LegalSection>

      <LegalSection title="Publication director">
        <p>Thomas Demathieu</p>
      </LegalSection>

      <LegalSection title="Hosting">
        <ul className="list-disc pl-5">
          <li><strong>Frontend / CDN</strong>: Cloudflare</li>
          <li><strong>Database</strong>: Supabase</li>
          <li><strong>Backend</strong>: [VPS hosting provider to be added once selected]</li>
        </ul>
        <LegalReviewNote>
          Note for launch review: full hosting-provider contact details (name, address) must be added once the VPS is chosen, mandatory
        </LegalReviewNote>
      </LegalSection>

      <LegalSection title="Intellectual property">
        <p>All content on the Pettr site (structure, text, logos, excluding user-submitted content) belongs to Thomas Demathieu unless otherwise stated. Unauthorized reproduction is prohibited.</p>
      </LegalSection>

      <LegalSection title="Personal data">
        <p>For information on how your personal data is processed, see our Privacy Policy.</p>
      </LegalSection>

      <LegalSection title="Cookies">
        <p>For information on cookies used by the site, see our Cookie Policy.</p>
      </LegalSection>

      <LegalSection title="Disputes">
        <p>This notice is governed by French law. In the event of a dispute, French courts have jurisdiction, subject to any mandatory consumer-protection provisions that apply to you.</p>
      </LegalSection>
    </LegalPageLayout>
  );
}

function LegalNoticePageFr() {
  return (
    <LegalPageLayout title="Mentions légales" lastUpdatedLabel="Dernière mise à jour : [DATE].">
      <LegalSection title="Éditeur du site">
        <ul className="list-disc pl-5">
          <li><strong>Nom</strong> : Thomas Demathieu</li>
          <li><strong>Statut</strong> : Entrepreneur individuel (micro-entrepreneur)</li>
          <li><strong>SIRET</strong> : 98784461000012</li>
          <li><strong>Adresse</strong> : Paris 75020, France</li>
          <li><strong>Contact</strong> : contact@pettr.life</li>
        </ul>
      </LegalSection>

      <LegalSection title="Directeur de la publication">
        <p>Thomas Demathieu</p>
      </LegalSection>

      <LegalSection title="Hébergement">
        <ul className="list-disc pl-5">
          <li><strong>Frontend / CDN</strong> : Cloudflare</li>
          <li><strong>Base de données</strong> : Supabase</li>
          <li><strong>Backend</strong> : [Hébergeur VPS à déterminer]</li>
        </ul>
      </LegalSection>

      <LegalSection title="Propriété intellectuelle">
        <p>L&apos;ensemble du contenu du site Pettr (structure, textes, logos, à l&apos;exclusion du contenu soumis par les utilisateurs) est la propriété de Thomas Demathieu, sauf mention contraire. Toute reproduction non autorisée est interdite.</p>
      </LegalSection>

      <LegalSection title="Données personnelles">
        <p>Pour toute information sur le traitement de vos données personnelles, consultez notre Politique de confidentialité.</p>
      </LegalSection>

      <LegalSection title="Cookies">
        <p>Pour toute information sur les cookies utilisés par le site, consultez notre Politique de cookies.</p>
      </LegalSection>

      <LegalSection title="Litiges">
        <p>Les présentes mentions légales sont soumises au droit français. En cas de litige, les tribunaux français seront compétents, sous réserve des dispositions impératives applicables aux consommateurs.</p>
      </LegalSection>
      <LegalReviewNote>
          Note for launch review: full hosting-provider contact details (name, address) must be added once the VPS is chosen, mandatory
      </LegalReviewNote>
    </LegalPageLayout>
  );
}

function LegalNoticePage() {
  const { language } = useLanguageContext();
  return language === 'fr' ? <LegalNoticePageFr /> : <LegalNoticePageEn />;
}