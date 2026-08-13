import type install from '../en/install';
import type { TranslationShape } from '../../translation-shape';

const fr: TranslationShape<typeof install> = {
  banner: {
    description: 'Installez Pettr pour une expérience plein écran, comme une application.',
    install: 'Ajouter à l\'écran d\'accueil',
    dismiss: 'Fermer',
  },
  ios: {
    title: 'Ajouter Pettr à votre écran d\'accueil',
    description: 'Installez Pettr en quelques touches pour une expérience plein écran, comme une application.',
    step1: 'Touchez le bouton Partager dans la barre d\'outils',
    step2: 'Faites défiler et touchez Sur l\'écran d\'accueil',
    step3: 'Touchez Ajouter en haut pour terminer.',
  },
};

export default fr;