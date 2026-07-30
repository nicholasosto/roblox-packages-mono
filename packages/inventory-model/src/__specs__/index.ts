// ─── Inventory Model: Spec Runner Entry ───────────────────────────────────────
// Importing the spec module registers its describe groups; runInventoryModelSpecs()
// executes them and returns a structured report for a test place to format.

import "./backpack.spec";
import { runSpecs } from "./harness";
import type { SpecReport } from "./harness";

export type { SpecReport, SpecGroup, SpecCase } from "./harness";

/** Run the full headless spec suite and return a structured report. */
export function runInventoryModelSpecs(): SpecReport {
  return runSpecs();
}
