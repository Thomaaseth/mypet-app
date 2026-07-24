import type profile from '../en/profile';
import type { TranslationShape } from '../../translation-shape';

const fr: TranslationShape<typeof profile> = {
  account: {
    title: 'Informations du compte',
    description: 'Les détails de votre compte et votre statut de vérification.',
    nameLabel: 'Nom',
    emailLabel: 'E-mail',
    emailNotVerified: 'E-mail non vérifié. Consultez votre boîte de réception pour le message de vérification.',
    loadError: 'Échec du chargement de votre profil. Veuillez rafraîchir la page.',
  },
  preferencesCard: {
    title: 'Date, heure et unités',
    description: 'Choisissez votre format de date/heure et votre système de mesure préférés.',
  },
  emailForm: {
    title: "Mettre à jour l'e-mail",
    description: 'Modifiez l\'adresse e-mail de votre compte.',
    newEmailLabel: 'Nouvelle adresse e-mail',
    newEmailPlaceholder: 'Entrez la nouvelle adresse e-mail',
    submitUpdating: 'Mise à jour en cours...',
    submitUpdate: "Mettre à jour l'e-mail",
  },
  passwordForm: {
    title: 'Modifier le mot de passe',
    description: 'Mettez à jour le mot de passe de votre compte pour plus de sécurité.',
    currentPasswordLabel: 'Mot de passe actuel',
    currentPasswordPlaceholder: 'Entrez le mot de passe actuel',
    newPasswordLabel: 'Nouveau mot de passe',
    newPasswordPlaceholder: 'Entrez le nouveau mot de passe',
    confirmPasswordLabel: 'Confirmer le nouveau mot de passe',
    confirmPasswordPlaceholder: 'Confirmez le nouveau mot de passe',
    submitChanging: 'Modification en cours...',
    submitChange: 'Modifier le mot de passe',
  },
};

export default fr;