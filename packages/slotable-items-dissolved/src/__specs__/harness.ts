// ─── Slotable Items: Tiny Spec Harness (assert-based, dependency-free) ─────────
//
// A ~describe/it/expect~ shim over assert + pcall. No TestEZ, no @trembus/logger — the
// package stays dependency-free. describe() registers groups at module load; the it()
// bodies are deferred and executed by runSpecs(), which returns a structured SpecReport
// (the test place formats it). Returning a non-zero `failed` count is the failure signal.

export interface SpecCase {
  readonly name: string;
  readonly pass: boolean;
  readonly message?: string;
}
export interface SpecGroup {
  readonly name: string;
  readonly cases: readonly SpecCase[];
}
export interface SpecReport {
  readonly groups: readonly SpecGroup[];
  readonly passed: number;
  readonly failed: number;
  readonly ok: boolean;
}

type Body = () => void;
interface PendingTest {
  name: string;
  body: Body;
}
interface PendingGroup {
  name: string;
  tests: PendingTest[];
}

const queue: PendingGroup[] = [];
let current: PendingGroup | undefined = undefined;

export function describe(name: string, body: () => void): void {
  const g: PendingGroup = { name, tests: [] };
  queue.push(g);
  const prev = current;
  current = g;
  body();
  current = prev;
}

export function it(name: string, body: Body): void {
  const g = current;
  if (g === undefined) error(`it("${name}") must be called inside describe()`);
  g.tests.push({ name, body });
}

export function expect(condition: boolean, message?: string): void {
  if (!condition) error(message ?? "expectation failed");
}

export function expectEqual<T>(actual: T, expected: T, message?: string): void {
  if (actual !== expected) {
    error(`${message ?? "expectEqual"}: expected ${tostring(expected)}, got ${tostring(actual)}`);
  }
}

export function expectApprox(actual: number, expected: number, eps: number, message?: string): void {
  if (math.abs(actual - expected) > eps) {
    error(`${message ?? "expectApprox"}: expected ~${tostring(expected)}, got ${tostring(actual)}`);
  }
}

/** Run every registered group/test, returning a structured report. Safe to call twice. */
export function runSpecs(): SpecReport {
  const groups: SpecGroup[] = [];
  let passed = 0;
  let failed = 0;
  for (const g of queue) {
    const cases: SpecCase[] = [];
    for (const t of g.tests) {
      const [ok, err] = pcall(t.body);
      if (ok) {
        cases.push({ name: t.name, pass: true });
        passed += 1;
      } else {
        cases.push({ name: t.name, pass: false, message: tostring(err) });
        failed += 1;
      }
    }
    groups.push({ name: g.name, cases });
  }
  return { groups, passed, failed, ok: failed === 0 };
}
