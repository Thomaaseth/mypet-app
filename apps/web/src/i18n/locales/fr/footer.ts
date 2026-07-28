import type footer from '../en/footer';
import type { TranslationShape } from '../../translation-shape';

const fr: TranslationShape<typeof footer> = {
  links: {
    privacy: 'Politique de confidentialit\u00E9',
    terms: 'Conditions d\u2019utilisation',
    legalNotice: 'Mentions l\u00E9gales',
    cookies: 'Politique de cookies',
  },
  language: {
    label: 'Langue',
  },
  copyright: '\u00A9 {{year}} Pettr. Tous droits r\u00E9serv\u00E9s.',
};

export default fr;