import type preferences from '../en/preferences';
import type { TranslationShape } from '../../translation-shape';

const fr: TranslationShape<typeof preferences> = {
  dateTimeLocale: {
    frFR: {
      label: '24 heures',
      description: 'JJ/MM/AAAA · horloge 24h',
    },
    enUS: {
      label: '12 heures',
      description: 'MM/JJ/AAAA · horloge 12h',
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