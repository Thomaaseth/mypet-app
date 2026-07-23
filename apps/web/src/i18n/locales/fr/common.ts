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
  },
  errors: {
    generic: 'Une erreur est survenue. Veuillez réessayer.',
    network: 'Erreur réseau. Veuillez vérifier votre connexion et réessayer.',
  },
};

export default fr;