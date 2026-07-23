import type en from '../en';
import type { TranslationShape } from '../../translation-shape';
import common from './common';
import auth from './auth';
import pets from './pets';
import weights from './weights';
import food from './food';

const fr: TranslationShape<typeof en> = {
  common,
  auth,
  pets,
  weights,
  food,
};

export default fr;