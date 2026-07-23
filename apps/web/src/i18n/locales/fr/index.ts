import type en from '../en';
import type { TranslationShape } from '../../translation-shape';
import common from './common';
import auth from './auth';
import pets from './pets';
import weights from './weights';

const fr: TranslationShape<typeof en> = {
  common,
  auth,
  pets,
  weights,
};

export default fr;