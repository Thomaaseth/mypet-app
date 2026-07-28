import type cookies from '../en/cookies';
import type { TranslationShape } from '../../translation-shape';

const fr: TranslationShape<typeof cookies> = {
  banner: {
    description: 'Nous utilisons des cookies pour vous garder connect\u00E9.',
    acceptAll: 'Tout accepter',
    rejectNonEssential: 'Refuser les cookies non essentiels',
    managePreferences: 'G\u00E9rer les pr\u00E9f\u00E9rences',
  },
  dialog: {
    title: 'Pr\u00E9f\u00E9rences des cookies',
    description: 'Choisissez les cookies que vous acceptez. Vous pouvez modifier ce choix \u00E0 tout moment.',
    necessary: {
      label: 'Strictement n\u00E9cessaires',
      description: 'N\u00E9cessaires pour vous garder connect\u00E9. Ne peuvent pas \u00EAtre d\u00E9sactiv\u00E9s.',
    },
    analytics: {
      label: 'Analytiques',
      description: 'Nous aide \u00E0 comprendre l\u2019usage de l\u2019application. Nous ne les utilisons pas encore, mais vous pouvez accepter \u00E0 l\u2019avance.',
    },
    save: 'Enregistrer les pr\u00E9f\u00E9rences',
  },
};

export default fr;