import * as migration_20260620_104354_initial_baseline from './20260620_104354_initial_baseline';
import * as migration_20260620_111743 from './20260620_111743';
import * as migration_20260620_172625 from './20260620_172625';
import * as migration_20260620_222718 from './20260620_222718';

export const migrations = [
  {
    up: migration_20260620_104354_initial_baseline.up,
    down: migration_20260620_104354_initial_baseline.down,
    name: '20260620_104354_initial_baseline',
  },
  {
    up: migration_20260620_111743.up,
    down: migration_20260620_111743.down,
    name: '20260620_111743',
  },
  {
    up: migration_20260620_172625.up,
    down: migration_20260620_172625.down,
    name: '20260620_172625',
  },
  {
    up: migration_20260620_222718.up,
    down: migration_20260620_222718.down,
    name: '20260620_222718'
  },
];
