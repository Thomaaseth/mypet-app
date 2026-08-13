import type install from '../en/install';
import type { TranslationShape } from '../../translation-shape';

const fr: TranslationShape<typeof install> = {
  banner: {
    description: 'Installez Pettr pour une expérience plein écran, comme une application.',
    install: 'Ajouter à l\'écran d\'accueil',
    dismiss: 'Fermer',
    iosInstruction: 'Touchez le bouton Partager, puis Sur l\'écran d\'accueil.',
  },
};

export default fr;