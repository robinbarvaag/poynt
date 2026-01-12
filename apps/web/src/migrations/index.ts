import * as migration_20260110_113243_initial from './20260110_113243_initial';

export const migrations = [
  {
    up: migration_20260110_113243_initial.up,
    down: migration_20260110_113243_initial.down,
    name: '20260110_113243_initial'
  },
];
