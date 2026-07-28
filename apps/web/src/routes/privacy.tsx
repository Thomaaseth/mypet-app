import { createFileRoute } from '@tanstack/react-router';
import { useLanguageContext } from '@/contexts/LanguageContext';
import { LegalPageLayout, LegalSection, LegalReviewNote } from '@/components/legal/LegalPageLayout';

export const Route = createFileRoute('/privacy')({
  component: PrivacyPage,
});

// TODO: replace [DATE] once this content is finalized, and confirm the
// account-deletion retention window before removing that placeholder too.
function PrivacyPageEn() {
  return (
    <LegalPageLayout
      title="Privacy Policy"
      lastUpdatedLabel="Last updated: [DATE]. Currently in beta, no paid features exist yet."
    >
      <LegalSection title="1. Who we are">
        <p>Pettr is operated by:</p>
        <ul className="list-disc pl-5">
          <li><strong>Thomas Demathieu</strong>, individual entrepreneur (micro-entrepreneur) under French law</li>
          <li>SIRET: 98784461000012</li>
          <li>Address: Paris 75020, France</li>
          <li>Contact: contact@pettr.life</li>
        </ul>
        <p>Thomas Demathieu is the data controller for the purposes of the GDPR.</p>
      </LegalSection>

      <LegalSection title="2. What data we collect">
        <ul className="list-disc pl-5">
          <li><strong>Account data</strong> — name, email address, password (hashed): to create and secure your account.</li>
          <li><strong>Pet profile data</strong> — pet name, species, birth date, neutered status, microchip number, photo, general notes: core functionality of the app.</li>
          <li><strong>Weight tracking</strong> — weight entries with the date recorded.</li>
          <li><strong>Food tracking</strong> — food brand/product name, daily feeding amount, bag size, start/end dates.</li>
          <li><strong>Veterinarian data</strong> — vet/clinic name, phone, email, website, address (as you enter them).</li>
          <li><strong>Appointments</strong> — appointment date, reason for visit, visit notes you record.</li>
          <li><strong>Free-text notes</strong> — any notes you write about a pet.</li>
          <li><strong>Technical/security data</strong> — IP address, user agent, session tokens: rate-limiting and abuse prevention.</li>
          <li><strong>Cookie consent records</strong> — a random consent ID, your accept/reject choices, IP, timestamp: to prove consent was properly obtained.</li>
        </ul>
        <p>We do not currently collect analytics or advertising data. See our Cookie Policy for detail on cookies specifically.</p>
      </LegalSection>

      <LegalSection title="3. Legal basis for processing">
        <ul className="list-disc pl-5">
          <li><strong>Account data &amp; pet data you enter</strong>: contract necessity &mdash; we need this data to provide the service you signed up for.</li>
          <li><strong>IP address for rate-limiting/security</strong>: legitimate interest &mdash; protecting the service and other users from abuse.</li>
          <li><strong>Cookie consent records</strong>: legal obligation (demonstrating compliance) combined with legitimate interest.</li>
        </ul>
        <LegalReviewNote>
          Note for legal review: confirm these legal-basis classifications, particularly whether any pet/health-adjacent data should instead be classified as a special category requiring explicit consent rather than contract necessity.
        </LegalReviewNote>
      </LegalSection>

      <LegalSection title="4. Who else sees your data (sub-processors)">
        <ul className="list-disc pl-5">
          <li><strong>Supabase</strong> — database hosting and file storage</li>
          <li><strong>Resend</strong> — transactional email delivery (e.g. password resets)</li>
          <li><strong>Cloudflare</strong> — CDN / DDoS protection for the website</li>
          <li><strong>[VPS provider — to be determined]</strong> — hosting for the backend API</li>
        </ul>
        <LegalReviewNote>
          Note for legal review: confirm data-residency/location for each of the above, and whether any require a Standard Contractual Clauses (SCC) reference for transfers outside the EEA — e.g. Resend is a US company.
        </LegalReviewNote>
        <p>We do not sell your data. We do not share it with advertisers, because we don&apos;t use advertising or marketing cookies.</p>
      </LegalSection>

      <LegalSection title="5. How long we keep your data">
        <p><strong>Account and pet data</strong>: kept for as long as your account is active. To delete your account and all associated data, contact contact@pettr.life — we will process the deletion within 24 hours. (Note: this is currently a manual, contact-based process; there is no self-service &quot;delete my account&quot; button yet.)</p>
        <p><strong>Cookie consent records</strong>: kept for audit purposes; we re-prompt for consent roughly every 6 months, per CNIL best practice, but retain the historical log longer as evidence of compliance.</p>
      </LegalSection>

      <LegalSection title="6. Your rights">
        <p>Under GDPR, you have the right to access, correct, delete, or export your data, object to certain processing, and lodge a complaint with the CNIL (France&apos;s data protection authority) or your local supervisory authority.</p>
        <p>To exercise any of these rights, contact contact@pettr.life.</p>
      </LegalSection>

      <LegalSection title="7. Children">
        <p>Pettr is not directed at, and should not be used by, anyone under 16 years old.</p>
      </LegalSection>

      <LegalSection title="8. Changes to this policy">
        <p>We may update this policy as the app evolves. We&apos;ll note the &quot;last updated&quot; date above, and for material changes, we&apos;ll make reasonable efforts to notify active users.</p>
      </LegalSection>

      <LegalSection title="9. Contact">
        <p>Questions about this policy: contact@pettr.life</p>
      </LegalSection>
    </LegalPageLayout>
  );
}

function PrivacyPageFr() {
  return (
    <LegalPageLayout
      title="Politique de confidentialité"
      lastUpdatedLabel="Dernière mise à jour : [DATE]. Application actuellement en bêta — aucune fonctionnalité payante n&apos;existe à ce jour."
    >
      <LegalSection title="1. Qui sommes-nous">
        <p>Pettr est exploité par :</p>
        <ul className="list-disc pl-5">
          <li><strong>Thomas Demathieu</strong>, entrepreneur individuel (micro-entrepreneur)</li>
          <li>SIRET : 98784461000012</li>
          <li>Adresse : Paris 75020, France</li>
          <li>Contact : contact@pettr.life</li>
        </ul>
        <p>Thomas Demathieu est le responsable du traitement au sens du RGPD.</p>
      </LegalSection>

      <LegalSection title="2. Quelles données nous collectons">
        <ul className="list-disc pl-5">
          <li><strong>Données de compte</strong> — nom, adresse e-mail, mot de passe (haché) : créer et sécuriser votre compte.</li>
          <li><strong>Profil de l&apos;animal</strong> — nom, espèce, date de naissance, statut de stérilisation, numéro de puce, photo, notes générales.</li>
          <li><strong>Suivi de poids</strong> — entrées de poids avec la date d&apos;enregistrement.</li>
          <li><strong>Suivi alimentaire</strong> — marque/nom du produit, quantité quotidienne, taille du sac, dates de début/fin.</li>
          <li><strong>Données vétérinaires</strong> — nom du vétérinaire/de la clinique, téléphone, e-mail, site web, adresse (telles que vous les saisissez).</li>
          <li><strong>Rendez-vous</strong> — date du rendez-vous, motif de la visite, notes de visite que vous enregistrez.</li>
          <li><strong>Notes libres</strong> — toute note que vous rédigez concernant un animal.</li>
          <li><strong>Données techniques / sécurité</strong> — adresse IP, user agent, jetons de session : limitation de débit et prévention des abus.</li>
          <li><strong>Registre de consentement cookies</strong> — identifiant de consentement aléatoire, votre choix, IP, horodatage : pour prouver que le consentement a été correctement obtenu.</li>
        </ul>
        <p>Nous ne collectons pas de données d&apos;analyse ou publicitaires à ce jour. Voir notre Politique de cookies pour plus de détails.</p>
      </LegalSection>

      <LegalSection title="3. Base légale du traitement">
        <ul className="list-disc pl-5">
          <li><strong>Données de compte et données sur vos animaux</strong> : nécessité contractuelle — nous avons besoin de ces données pour fournir le service auquel vous avez souscrit.</li>
          <li><strong>Adresse IP pour la limitation de débit / sécurité</strong> : intérêt légitime — protection du service et des autres utilisateurs contre les abus.</li>
          <li><strong>Registre de consentement cookies</strong> : obligation légale (démontrer la conformité) combinée à l&apos;intérêt légitime.</li>
        </ul>
        <LegalReviewNote>
          Note pour relecture juridique : confirmer ces qualifications de base légale, en particulier si certaines données liées à la santé animale devraient plutôt relever d&apos;une catégorie nécessitant un consentement explicite.
        </LegalReviewNote>
      </LegalSection>

      <LegalSection title="4. Qui d&apos;autre voit vos données (sous-traitants)">
        <ul className="list-disc pl-5">
          <li><strong>Supabase</strong> — hébergement de la base de données et du stockage de fichiers</li>
          <li><strong>Resend</strong> — envoi d&apos;e-mails transactionnels (ex. réinitialisation de mot de passe)</li>
          <li><strong>Cloudflare</strong> — CDN / protection DDoS pour le site</li>
          <li><strong>[Hébergeur VPS — à déterminer]</strong> — hébergement du backend</li>
        </ul>
        <LegalReviewNote>
          Note pour relecture juridique : confirmer la localisation des données pour chacun des éléments ci-dessus, et si des clauses contractuelles types (CCT) sont nécessaires pour les transferts hors UE — Resend étant une société américaine.
        </LegalReviewNote>
        <p>Nous ne vendons pas vos données. Nous ne les partageons pas avec des annonceurs, car nous n&apos;utilisons pas de cookies publicitaires ou marketing.</p>
      </LegalSection>

      <LegalSection title="5. Durée de conservation">
        <p><strong>Données de compte et d&apos;animaux</strong> : conservées tant que votre compte est actif. Pour supprimer votre compte et l&apos;ensemble des données associées, contactez contact@pettr.life — nous traiterons la suppression sous 24 heures. (Remarque : il s&apos;agit actuellement d&apos;un processus manuel, sur demande ; il n&apos;existe pas encore de bouton de suppression en libre-service.)</p>
        <p><strong>Registre de consentement cookies</strong> : conservé à des fins d&apos;audit ; nous redemandons votre consentement environ tous les 6 mois, conformément aux recommandations de la CNIL, mais conservons l&apos;historique plus longtemps comme preuve de conformité.</p>
      </LegalSection>

      <LegalSection title="6. Vos droits">
        <p>En vertu du RGPD, vous disposez des droits d&apos;accès, de rectification, de suppression et de portabilité de vos données, d&apos;opposition à certains traitements, et de réclamation auprès de la CNIL ou de votre autorité de contrôle locale.</p>
        <p>Pour exercer l&apos;un de ces droits, contactez contact@pettr.life.</p>
      </LegalSection>

      <LegalSection title="7. Mineurs">
        <p>Pettr ne s&apos;adresse pas aux personnes de moins de 16 ans et ne doit pas être utilisé par elles.</p>
      </LegalSection>

      <LegalSection title="8. Modifications de cette politique">
        <p>Nous pouvons mettre à jour cette politique à mesure que l&apos;application évolue. La date de « dernière mise à jour » ci-dessus sera actualisée, et pour tout changement important, nous ferons des efforts raisonnables pour informer les utilisateurs actifs.</p>
      </LegalSection>

      <LegalSection title="9. Contact">
        <p>Questions relatives à cette politique : contact@pettr.life</p>
      </LegalSection>
    </LegalPageLayout>
  );
}

function PrivacyPage() {
  const { language } = useLanguageContext();
  return language === 'fr' ? <PrivacyPageFr /> : <PrivacyPageEn />;
}