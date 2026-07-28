import { createFileRoute } from '@tanstack/react-router';
import { useLanguageContext } from '@/contexts/LanguageContext';
import { LegalPageLayout, LegalSection, LegalReviewNote } from '@/components/legal/LegalPageLayout';

export const Route = createFileRoute('/terms')({
  component: TermsPage,
});

function TermsPageEn() {
  return (
    <LegalPageLayout title="Terms of Service" lastUpdatedLabel="Last updated: [DATE].">
      <LegalSection title="1. Acceptance of terms">
        <p>By creating an account or using Pettr, you agree to these Terms. If you don&apos;t agree, please don&apos;t use the app.</p>
      </LegalSection>

      <LegalSection title="2. What Pettr is, and what it is not">
        <p>Pettr helps you track your pets&apos; weight, food, veterinary appointments, and notes.</p>
        <p><strong>Pettr is not a substitute for professional veterinary care.</strong> Nothing in the app constitutes veterinary advice, diagnosis, or treatment. Always consult a licensed veterinarian for any health concern regarding your pet. Any notes, reminders, or tracking features are organizational tools only, not medical guidance.</p>
      </LegalSection>

      <LegalSection title="3. Beta status">
        <p>Pettr is currently in <strong>beta</strong>. Features may change, be added, or be removed without notice. We make no guarantee of uptime, data permanence, or feature stability during this period. We recommend not relying on Pettr as your sole record of critical veterinary information.</p>
      </LegalSection>

      <LegalSection title="4. Your account">
        <ul className="list-disc pl-5">
          <li>You&apos;re responsible for keeping your login credentials secure.</li>
          <li>You must provide accurate information when creating your account.</li>
          <li>You&apos;re responsible for all activity under your account.</li>
        </ul>
      </LegalSection>

      <LegalSection title="5. No payment currently">
        <p>Pettr does not currently charge for any features. If this changes in the future, we will update these Terms and notify users before introducing paid functionality.</p>
      </LegalSection>

      <LegalSection title="6. Your content">
        <p>You retain ownership of the data and content you enter (pet names, photos, notes, etc.). By using Pettr, you grant us a limited license to store, process, and display that content solely to provide the service to you.</p>
      </LegalSection>

      <LegalSection title="7. Acceptable use">
        <p>You agree not to:</p>
        <ul className="list-disc pl-5">
          <li>Use Pettr for any unlawful purpose</li>
          <li>Attempt to disrupt or gain unauthorized access to the service</li>
          <li>Upload content that infringes others&apos; rights or is unlawful</li>
        </ul>
      </LegalSection>

      <LegalSection title="8. Intellectual property">
        <p>The Pettr name, logo, and application (excluding your own content) are the property of Thomas Demathieu.</p>
      </LegalSection>

      <LegalSection title="9. Limitation of liability">
        <p>To the maximum extent permitted by law, Pettr and Thomas Demathieu are not liable for indirect, incidental, or consequential damages arising from your use of the app, including but not limited to loss of data or reliance on the app in place of professional veterinary care.</p>
        <LegalReviewNote>
          Note for legal review: this clause needs particular attention, enforceability and scope vary by jurisdiction, especially for US users where liability waivers are treated differently than under French law.
        </LegalReviewNote>
      </LegalSection>

      <LegalSection title="10. Termination">
        <p>You may stop using Pettr at any time. To delete your account and associated data, contact contact@pettr.life, see our Privacy Policy for the current process and timeline. We may suspend or terminate accounts that violate these Terms.</p>
      </LegalSection>

      <LegalSection title="11. Governing law">
        <p>These Terms are governed by French law. Courts of France have jurisdiction, without prejudice to any mandatory consumer-protection rights you may have under the law of your own country of residence.</p>
        <LegalReviewNote>
          Note for legal review: this clause, and its interaction with US consumer-protection law for US-based users, is the single item most worth confirming with a lawyer before scaling beyond beta.
        </LegalReviewNote>
      </LegalSection>

      <LegalSection title="12. Changes to these Terms">
        <p>We may update these Terms as the app evolves. Continued use after changes means you accept the updated Terms.</p>
      </LegalSection>

      <LegalSection title="13. Contact">
        <p>Questions about these Terms: contact@pettr.life</p>
      </LegalSection>
    </LegalPageLayout>
  );
}

function TermsPageFr() {
  return (
    <LegalPageLayout title="Conditions d&apos;utilisation" lastUpdatedLabel="Dernière mise à jour : [DATE].">
      <LegalSection title="1. Acceptation des conditions">
        <p>En créant un compte ou en utilisant Pettr, vous acceptez les présentes Conditions. Si vous n&apos;êtes pas d&apos;accord, merci de ne pas utiliser l&apos;application.</p>
      </LegalSection>

      <LegalSection title="2. Ce qu&apos;est Pettr, et ce qu&apos;il n&apos;est pas">
        <p>Pettr vous aide à suivre le poids, l&apos;alimentation, les rendez-vous vétérinaires et les notes concernant vos animaux.</p>
        <p><strong>Pettr ne remplace pas les soins vétérinaires professionnels.</strong> Rien dans l&apos;application ne constitue un avis vétérinaire, un diagnostic ou un traitement. Consultez toujours un vétérinaire diplômé pour toute question de santé concernant votre animal. Les notes, rappels et fonctionnalités de suivi sont uniquement des outils organisationnels, pas des conseils médicaux.</p>
      </LegalSection>

      <LegalSection title="3. Statut bêta">
        <p>Pettr est actuellement en <strong>version bêta</strong>. Les fonctionnalités peuvent être modifiées, ajoutées ou supprimées sans préavis. Nous ne garantissons ni disponibilité continue, ni permanence des données, ni stabilité des fonctionnalités durant cette période. Nous recommandons de ne pas faire de Pettr votre unique registre d&apos;informations vétérinaires critiques.</p>
      </LegalSection>

      <LegalSection title="4. Votre compte">
        <ul className="list-disc pl-5">
          <li>Vous êtes responsable de la sécurité de vos identifiants de connexion.</li>
          <li>Vous devez fournir des informations exactes lors de la création de votre compte.</li>
          <li>Vous êtes responsable de toute activité sous votre compte.</li>
        </ul>
      </LegalSection>

      <LegalSection title="5. Aucun paiement actuellement">
        <p>Pettr ne facture actuellement aucune fonctionnalité. Si cela devait changer, nous mettrons à jour ces Conditions et informerons les utilisateurs avant l&apos;introduction de toute fonctionnalité payante.</p>
      </LegalSection>

      <LegalSection title="6. Votre contenu">
        <p>Vous conservez la propriété des données et contenus que vous saisissez (noms d&apos;animaux, photos, notes, etc.). En utilisant Pettr, vous nous accordez une licence limitée pour stocker, traiter et afficher ce contenu uniquement afin de vous fournir le service.</p>
      </LegalSection>

      <LegalSection title="7. Utilisation acceptable">
        <p>Vous vous engagez à ne pas :</p>
        <ul className="list-disc pl-5">
          <li>Utiliser Pettr à des fins illégales</li>
          <li>Tenter de perturber le service ou d&apos;y accéder sans autorisation</li>
          <li>Télécharger du contenu portant atteinte aux droits d&apos;autrui ou illégal</li>
        </ul>
      </LegalSection>

      <LegalSection title="8. Propriété intellectuelle">
        <p>Le nom Pettr, le logo et l&apos;application (à l&apos;exclusion de votre propre contenu) sont la propriété de Thomas Demathieu.</p>
      </LegalSection>

      <LegalSection title="9. Limitation de responsabilité">
        <p>Dans la mesure maximale permise par la loi, Pettr et Thomas Demathieu ne sont pas responsables des dommages indirects, accessoires ou consécutifs résultant de votre utilisation de l&apos;application, y compris, sans s&apos;y limiter, la perte de données ou le fait de se fier à l&apos;application en lieu et place de soins vétérinaires professionnels.</p>
        <LegalReviewNote>
          Note pour relecture juridique : cette clause mérite une attention particulière, son applicabilité et sa portée varient selon les juridictions, notamment pour les utilisateurs américains.
        </LegalReviewNote>
      </LegalSection>

      <LegalSection title="10. Résiliation">
        <p>Vous pouvez cesser d&apos;utiliser Pettr à tout moment. Pour supprimer votre compte et les données associées, contactez contact@pettr.life, consultez notre Politique de confidentialité pour le processus et le délai actuels. Nous pouvons suspendre ou résilier les comptes qui enfreignent ces Conditions.</p>
      </LegalSection>

      <LegalSection title="11. Droit applicable">
        <p>Les présentes Conditions sont régies par le droit français. Les tribunaux français sont compétents, sans préjudice des droits impératifs de protection des consommateurs dont vous pourriez bénéficier en vertu du droit de votre pays de résidence.</p>
        <LegalReviewNote>
          Note pour relecture juridique : cette clause, et son interaction avec le droit américain de la protection des consommateurs pour les utilisateurs basés aux États-Unis, est l&apos;élément le plus important à faire confirmer par un avocat avant toute expansion au-delà de la bêta.
        </LegalReviewNote>
      </LegalSection>

      <LegalSection title="12. Modifications des présentes Conditions">
        <p>Nous pouvons mettre à jour ces Conditions à mesure que l&apos;application évolue. La poursuite de l&apos;utilisation après modification vaut acceptation des nouvelles Conditions.</p>
      </LegalSection>

      <LegalSection title="13. Contact">
        <p>Questions relatives à ces Conditions : contact@pettr.life</p>
      </LegalSection>
    </LegalPageLayout>
  );
}

function TermsPage() {
  const { language } = useLanguageContext();
  return language === 'fr' ? <TermsPageFr /> : <TermsPageEn />;
}