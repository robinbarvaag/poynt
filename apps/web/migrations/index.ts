import * as migration_20260110_113243_initial from "./20260110_113243_initial";
import * as migration_20260117_230853 from "./20260117_230853";
import * as migration_20260217_213443 from "./20260217_213443";
import * as migration_20260221_114858 from "./20260221_114858";

export const migrations = [
  {
    up: migration_20260110_113243_initial.up,
    down: migration_20260110_113243_initial.down,
    name: "20260110_113243_initial",
  },
  {
    up: migration_20260117_230853.up,
    down: migration_20260117_230853.down,
    name: "20260117_230853",
  },
  {
    up: migration_20260217_213443.up,
    down: migration_20260217_213443.down,
    name: "20260217_213443",
  },
  {
    up: migration_20260221_114858.up,
    down: migration_20260221_114858.down,
    name: "20260221_114858",
  },
];
