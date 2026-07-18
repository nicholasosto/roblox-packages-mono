// ─── Slotable Items: Spec Runner Entry ────────────────────────────────────────
// Importing built-ins guarantees the five built-in kinds are registered before the
// suite runs, regardless of how the runner is reached. Importing the spec module
// registers its describe groups. runSlotableItemSpecs() executes them.

import "../built-ins";
import "./slotable.spec";
import { runSpecs } from "./harness";
import type { SpecReport } from "./harness";

export type { SpecReport, SpecGroup, SpecCase } from "./harness";

/** Run the full headless spec suite and return a structured report. */
export function runSlotableItemSpecs(): SpecReport {
  return runSpecs();
}
