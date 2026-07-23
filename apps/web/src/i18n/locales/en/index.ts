import common from './common';
import auth from './auth';
import pets from './pets';
import weights from './weights';
import food from './food';

const en = {
  common,
  auth,
  pets,
  weights,
  food,
} as const;

export default en;