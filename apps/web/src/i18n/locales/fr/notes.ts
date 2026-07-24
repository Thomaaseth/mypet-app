import type notes from '../en/notes';
import type { TranslationShape } from '../../translation-shape';

const fr: TranslationShape<typeof notes> = {
  widget: {
    title: 'Notes',
    addNote: 'Ajouter une note',
    emptyTitle: 'Aucune note pour le moment',
    emptyDescription: 'Ajoutez des choses que vous voulez retenir à propos de votre animal.',
    loadError: 'Échec du chargement des notes. Veuillez réessayer.',
    limitReached: 'Maximum de {{count}} notes atteint.',
  },
  charCount: '{{count}}/200 caractères',
  addDialog: {
    title: 'Ajouter une note',
    placeholder: 'Écrivez une note...',
    submit: 'Ajouter la note',
  },
  editDialog: {
    title: 'Modifier la note',
  },
  deleteDialog: {
    title: 'Supprimer la note',
    description: 'Êtes-vous sûr de vouloir supprimer cette note ? Cette action est irréversible.',
    deleting: 'Suppression en cours...',
  },
  validation: {
    contentRequired: 'La note ne peut pas être vide',
    contentTooLong: 'La note doit contenir moins de 200 caractères',
  },
};

export default fr;