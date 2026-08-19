import type common from '../en/common';
import type { TranslationShape } from '../../translation-shape';

const fr: TranslationShape<typeof common> = {
  actions: {
    save: 'Enregistrer',
    cancel: 'Annuler',
    delete: 'Supprimer',
    edit: 'Modifier',
    add: 'Ajouter',
    close: 'Fermer',
    confirm: 'Confirmer',
    back: 'Retour',
    next: 'Suivant',
    submit: 'Valider',
    loading: 'Chargement...',
    tryAgain: 'Réessayer',
    renew: 'Renouveler',
  },
  errors: {
    generic: 'Une erreur est survenue. Veuillez réessayer.',
    network: 'Erreur réseau. Veuillez vérifier votre connexion et réessayer.',
    genericTitle: 'Une erreur est survenue',
    emailAlreadyInUseTitle: 'E-mail déjà utilisé',
    emailAlreadyInUseDescription: 'Essayez de vous connecter à la place, ou utilisez une autre adresse e-mail',
    invalidCredentialsTitle: 'Identifiants invalides',
    invalidCredentialsDescription: 'Veuillez vérifier votre e-mail et votre mot de passe',
  },
  datePicker: {
    selectDate: 'Sélectionner une date',
  },
};

export default fr;