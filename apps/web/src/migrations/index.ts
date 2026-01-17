import * as migration_20260110_113243_initial from './20260110_113243_initial';
import * as migration_20260117_230853 from './20260117_230853';

export const migrations = [
  {
    up: migration_20260110_113243_initial.up,
    down: migration_20260110_113243_initial.down,
    name: '20260110_113243_initial',
  },
  {
    up: migration_20260117_230853.up,
    down: migration_20260117_230853.down,
    name: '20260117_230853'
  },
];
