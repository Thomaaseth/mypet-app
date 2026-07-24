import type en from '../en';
import type { TranslationShape } from '../../translation-shape';
import common from './common';
import auth from './auth';
import pets from './pets';
import weights from './weights';
import food from './food';
import notes from './notes';
import toasts from './toasts';
import vets from './vets';
import appointments from './appointments';
import preferences from './preferences';
import profile from './profile';

const fr: TranslationShape<typeof en> = {
  common,
  auth,
  pets,
  weights,
  food,
  notes,
  toasts,
  vets,
  appointments,
  preferences,
  profile,
};

export default fr;