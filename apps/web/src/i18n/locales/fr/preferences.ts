import type preferences from '../en/preferences';
import type { TranslationShape } from '../../translation-shape';

const fr: TranslationShape<typeof preferences> = {
  dateFormat: {
    DMY: {
      label: 'Jour / Mois',
      description: 'JJ/MM/AAAA',
    },
    MDY: {
      label: 'Mois / Jour',
      description: 'MM/JJ/AAAA',
    },
  },
  timeFormat: {
    '24h': {
      label: '24 heures',
      description: '14:30',
    },
    '12h': {
      label: '12 heures',
      description: '2:30 PM',
    },
  },
  unitSystem: {
    metric: {
      label: 'Métrique',
      description: 'kg · grammes',
    },
    imperial: {
      label: 'Impérial',
      description: 'lbs · oz',
    },
  },
  banner: {
    description: 'Choisissez votre format de date/heure et vos unités préférés pour commencer. Vous pourrez modifier ces options à tout moment dans votre profil.',
    saving: 'Enregistrement en cours...',
  },
};

export default fr;