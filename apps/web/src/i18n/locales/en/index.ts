import common from './common';
import auth from './auth';
import pets from './pets';
import weights from './weights';

const en = {
  common,
  auth,
  pets,
  weights,
} as const;

export default en;