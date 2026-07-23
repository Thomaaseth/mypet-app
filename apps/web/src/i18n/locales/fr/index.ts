import type en from '../en';
import type { TranslationShape } from '../../translation-shape';
import common from './common';
import auth from './auth';

const fr: TranslationShape<typeof en> = {
  common,
  auth,
};

export default fr;