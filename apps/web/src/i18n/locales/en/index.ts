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
import cookies from './cookies';
import footer from './footer';
import nav from './nav';
import install from './install';

const en = {
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
  cookies,
  footer,
  nav,
  install,
} as const;

export default en;