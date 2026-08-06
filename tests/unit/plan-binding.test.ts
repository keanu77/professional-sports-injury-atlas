/**
 * Plan-binding governance tests. Every test runs against a temporary fixture
 * tree (mkdtemp) and never touches the real authority files in this repository.
 */

import {
  mkdirSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  unlinkSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, describe, expect, it } from "vitest";

import { assertPlanAuthorized } from "../../scripts/assert-plan-authorized.ts";
import {
  authorizePlan,
  bindNonPlanDocument,
  bindPlanDocument,
  runBindCli,
} from "../../scripts/bind-authority-document.ts";
import { resolveActivePlan } from "../../scripts/resolve-active-plan.ts";
import { runValidateDecisionCli } from "../../scripts/validate-plan-execution-decision.ts";
import {
  BINDING_PATH,
  BOOTSTRAP_DECISION_PATH,
  CONTROLLER_PATH,
  PLATFORM_PLAN_PATH,
  SPEC_PATH,
  canonicalJsonText,
  parsePlanHeader,
  parseStrictJson,
  sha256Hex,
  validateBootstrapDecision,
  validatePlanExecutionDecision,
  verifyPlanBinding,
} from "../../scripts/verify-plan-binding.ts";

const NBA_PLAN_PATH =
  "docs/superpowers/plans/2026-08-06-nba-injury-case-source-discovery.md";
const NBA_PLAN_V2_PATH =
  "docs/superpowers/plans/2026-08-07-nba-injury-case-source-discovery-rev2.md";
const NBA_DECISION_PATH =
  "docs/decisions/2026-08-06-nba-source-discovery-authorization.v1.json";
const NBA_ROLE = "nba-injury-case-source-discovery";
const NBA_SCOPE = "nba-source-discovery-only";
const NBA_CLOSED_SCOPES_DECLARED = [
  "medical-content-authoring",
  "private-hosting",
  "public-release",
  "deployment",
];
const NBA_CLOSED_SCOPES_SORTED = [
  "deployment",
  "medical-content-authoring",
  "private-hosting",
  "public-release",
];
const T0 = "2026-08-06T00:20:00Z";

const cleanupRoots: string[] = [];

afterEach(() => {
  while (cleanupRoots.length > 0) {
    rmSync(cleanupRoots.pop() as string, { recursive: true, force: true });
  }
});

function planText(role: string, scope: string, closedScopes: string[]): string {
  const closed = closedScopes.map((scope) => `\`${scope}\``).join(", ");
  return [
    "# Fixture Plan",
    "",
    "## Scope and authority",
    "",
    `- Execution role: \`${role}\`; execution scope ID: \`${scope}\`; required closed scope IDs: ${closed}.`,
    "",
  ].join("\n");
}

function bootstrapText(root: string): string {
  const digest = (relPath: string): string =>
    sha256Hex(readFileSync(join(root, relPath)));
  return [
    "# Fixture Bootstrap Decision (G0)",
    "",
    "decisionSchemaVersion: 1",
    "redTeamSpecStatus: confirmed",
    "g0ExecutionStatus: authorized",
    "authorizedScope: local-git-and-platform-foundation-only",
    "authorizedBy: Fixture Reviewer",
    "authorizedAt: 2026-08-06T00:10:42Z",
    "sourceDiscoveryExecutionStatus: not-authorized",
    "medicalAuthoringExecutionStatus: not-authorized",
    "hostingExecutionStatus: not-authorized",
    "publicReleaseExecutionStatus: not-authorized",
    "deploymentExecutionStatus: not-authorized",
    `specSha256: ${digest(SPEC_PATH)}`,
    `executionIndexSha256: ${digest(CONTROLLER_PATH)}`,
    `platformPlanSha256: ${digest(PLATFORM_PLAN_PATH)}`,
    "",
  ].join("\n");
}

function createFixtureRepo(): string {
  const root = mkdtempSync(join(tmpdir(), "plan-binding-"));
  cleanupRoots.push(root);
  for (const dir of [
    "docs/superpowers/specs",
    "docs/superpowers/plans",
    "docs/decisions",
  ]) {
    mkdirSync(join(root, dir), { recursive: true });
  }
  writeFileSync(join(root, SPEC_PATH), "# Fixture Specification\n");
  writeFileSync(
    join(root, CONTROLLER_PATH),
    "# Fixture Execution Controller\n",
  );
  writeFileSync(
    join(root, PLATFORM_PLAN_PATH),
    planText(
      "platform-foundation",
      "g0-local-repository-and-platform-foundation",
      [
        "nba-source-discovery",
        "medical-content-authoring",
        "private-hosting",
        "public-release",
        "deployment",
      ],
    ),
  );
  writeFileSync(
    join(root, NBA_PLAN_PATH),
    planText(NBA_ROLE, NBA_SCOPE, NBA_CLOSED_SCOPES_DECLARED),
  );
  writeFileSync(join(root, BOOTSTRAP_DECISION_PATH), bootstrapText(root));
  return root;
}

/** Binds the five initial authority documents the same way the real repo does. */
function bindInitialDocuments(root: string): void {
  bindNonPlanDocument(root, SPEC_PATH, "specification", { now: T0 });
  bindNonPlanDocument(root, CONTROLLER_PATH, "execution-controller", {
    now: T0,
  });
  bindPlanDocument(root, PLATFORM_PLAN_PATH, { now: T0 });
  bindPlanDocument(root, NBA_PLAN_PATH, { now: T0 });
  bindNonPlanDocument(root, BOOTSTRAP_DECISION_PATH, "decision", { now: T0 });
  authorizePlan(root, PLATFORM_PLAN_PATH, BOOTSTRAP_DECISION_PATH, { now: T0 });
}

function boundRepo(): string {
  const root = createFixtureRepo();
  bindInitialDocuments(root);
  return root;
}

function nbaDecisionValue(root: string): Record<string, unknown> {
  return {
    authorizedAt: "2026-08-06T01:00:00Z",
    authorizedBy: "Fixture Owner",
    closedScopeIds: [...NBA_CLOSED_SCOPES_SORTED],
    decisionType: "plan-execution",
    executionScopeId: NBA_SCOPE,
    executionStatus: "authorized",
    planPath: NBA_PLAN_PATH,
    planSha256: sha256Hex(readFileSync(join(root, NBA_PLAN_PATH))),
    role: NBA_ROLE,
    schemaVersion: 1,
  };
}

function writeNbaDecision(
  root: string,
  mutate?: (value: Record<string, unknown>) => void,
): string {
  const value = nbaDecisionValue(root);
  mutate?.(value);
  writeFileSync(join(root, NBA_DECISION_PATH), canonicalJsonText(value));
  return NBA_DECISION_PATH;
}

function readBindingBytes(root: string): Buffer {
  return readFileSync(join(root, BINDING_PATH));
}

function rewriteBinding(
  root: string,
  mutate: (binding: Record<string, unknown>) => void,
): void {
  const binding = JSON.parse(readBindingBytes(root).toString("utf8")) as Record<
    string,
    unknown
  >;
  mutate(binding);
  writeFileSync(join(root, BINDING_PATH), canonicalJsonText(binding));
}

describe("canonical JSON and strict parsing", () => {
  it("serializes with code-point-sorted keys, NFC strings, and one trailing newline", () => {
    const text = canonicalJsonText({ b: 1, a: ["x", { d: null, c: "é" }] });
    expect(text).toBe('{"a":["x",{"c":"é","d":null}],"b":1}\n');
  });

  it("rejects duplicate object keys", () => {
    expect(() => parseStrictJson('{"a":1,"a":2}')).toThrow(
      /duplicate object key/,
    );
  });

  it("rejects trailing content", () => {
    expect(() => parseStrictJson('{"a":1} {}')).toThrow(/trailing content/);
  });
});

describe("plan header parsing", () => {
  it("parses role, scope, and sorted closed scopes from the header line", () => {
    const header = parsePlanHeader(
      planText(NBA_ROLE, NBA_SCOPE, NBA_CLOSED_SCOPES_DECLARED),
      "p",
    );
    expect(header).toEqual({
      role: NBA_ROLE,
      executionScopeId: NBA_SCOPE,
      closedScopeIds: NBA_CLOSED_SCOPES_SORTED,
    });
  });

  it("rejects a plan without exactly one header line", () => {
    expect(() => parsePlanHeader("# No header\n", "p")).toThrow(
      /exactly one execution-role/,
    );
  });
});

describe("verify-plan-binding", () => {
  it("verifies a freshly generated binding with an authorized platform plan", () => {
    const root = boundRepo();
    const binding = verifyPlanBinding(root);
    expect(binding.documents).toHaveLength(5);
    const platform = binding.documents.find(
      (doc) => doc.path === PLATFORM_PLAN_PATH,
    );
    expect(platform?.executionAuthorization?.status).toBe("authorized");
    expect(platform?.executionAuthorization?.decisionPath).toBe(
      BOOTSTRAP_DECISION_PATH,
    );
  });

  it("fails when a bound document changed", () => {
    const root = boundRepo();
    writeFileSync(join(root, SPEC_PATH), "# Fixture Specification (edited)\n");
    expect(() => verifyPlanBinding(root)).toThrow(/has changed/);
  });

  it("fails when a bound document is missing", () => {
    const root = boundRepo();
    unlinkSync(join(root, CONTROLLER_PATH));
    expect(() => verifyPlanBinding(root)).toThrow(/absent/);
  });

  it("fails on an unbound extra controlled document", () => {
    const root = boundRepo();
    writeFileSync(
      join(root, "docs/superpowers/plans/extra-unbound-plan.md"),
      "# Extra\n",
    );
    expect(() => verifyPlanBinding(root)).toThrow(/not bound/);
  });

  it("fails on duplicate document entries", () => {
    const root = boundRepo();
    rewriteBinding(root, (binding) => {
      const documents = binding["documents"] as Record<string, unknown>[];
      documents.push({ ...(documents[0] as Record<string, unknown>) });
    });
    expect(() => verifyPlanBinding(root)).toThrow(/duplicate document path/);
  });

  it("fails when one role has two active plan entries", () => {
    const root = boundRepo();
    rewriteBinding(root, (binding) => {
      const documents = binding["documents"] as Record<string, unknown>[];
      const nba = documents.find(
        (doc) => doc["path"] === NBA_PLAN_PATH,
      ) as Record<string, unknown>;
      documents.push({ ...nba, path: NBA_PLAN_V2_PATH });
    });
    expect(() => verifyPlanBinding(root)).toThrow(
      /more than one active plan for role/,
    );
  });

  it("fails when the binding bytes are not canonical", () => {
    const root = boundRepo();
    const file = join(root, BINDING_PATH);
    writeFileSync(file, `${readFileSync(file).toString("utf8")}\n`);
    expect(() => verifyPlanBinding(root)).toThrow(/not canonical/);
  });

  it("fails when an authorized plan decision file is missing", () => {
    const root = boundRepo();
    writeNbaDecision(root);
    authorizePlan(root, NBA_PLAN_PATH, NBA_DECISION_PATH, { now: T0 });
    unlinkSync(join(root, NBA_DECISION_PATH));
    expect(() => verifyPlanBinding(root)).toThrow(/absent/);
  });

  it("re-verifies bootstrap snapshot hashes even when the plan entry digest is updated", () => {
    const root = boundRepo();
    const file = join(root, PLATFORM_PLAN_PATH);
    writeFileSync(
      file,
      `${readFileSync(file, "utf8")}\nEdited but same header.\n`,
    );
    // Forge the plan entry digest so the per-entry snapshot check passes; the
    // deep bootstrap re-verification must still catch the stale decision hash.
    rewriteBinding(root, (binding) => {
      const documents = binding["documents"] as Record<string, unknown>[];
      const platform = documents.find(
        (doc) => doc["path"] === PLATFORM_PLAN_PATH,
      ) as Record<string, unknown>;
      platform["sha256"] = sha256Hex(readFileSync(file));
    });
    expect(() => verifyPlanBinding(root)).toThrow(
      /platform plan digest mismatch/,
    );
  });
});

describe("bootstrap markdown decision validation", () => {
  it("accepts a fully valid bootstrap decision", () => {
    const root = createFixtureRepo();
    const result = validateBootstrapDecision(root);
    expect(result.sha256).toBe(
      sha256Hex(readFileSync(join(root, BOOTSTRAP_DECISION_PATH))),
    );
  });

  it("rejects a missing anchored key", () => {
    const root = createFixtureRepo();
    const text = readFileSync(
      join(root, BOOTSTRAP_DECISION_PATH),
      "utf8",
    ).replace("g0ExecutionStatus: authorized\n", "");
    writeFileSync(join(root, BOOTSTRAP_DECISION_PATH), text);
    expect(() => validateBootstrapDecision(root)).toThrow(/g0ExecutionStatus/);
  });

  it("rejects a denial-worded authorization key", () => {
    const root = createFixtureRepo();
    const text = readFileSync(
      join(root, BOOTSTRAP_DECISION_PATH),
      "utf8",
    ).replace(
      "g0ExecutionStatus: authorized",
      "g0ExecutionStatus: not authorized",
    );
    writeFileSync(join(root, BOOTSTRAP_DECISION_PATH), text);
    expect(() => validateBootstrapDecision(root)).toThrow(/g0ExecutionStatus/);
  });

  it("rejects a snapshot digest that does not match current bytes", () => {
    const root = createFixtureRepo();
    writeFileSync(join(root, SPEC_PATH), "# Tampered Specification\n");
    expect(() => validateBootstrapDecision(root)).toThrow(
      /specification digest mismatch/,
    );
  });
});

describe("PlanExecutionDecisionV1 validation", () => {
  it("accepts a valid decision and returns the measured digest", () => {
    const root = boundRepo();
    writeNbaDecision(root);
    const result = validatePlanExecutionDecision(
      root,
      NBA_DECISION_PATH,
      NBA_PLAN_PATH,
    );
    expect(result.sha256).toBe(
      sha256Hex(readFileSync(join(root, NBA_DECISION_PATH))),
    );
  });

  it("preflight CLI prints the measured digest and does not require binding", () => {
    const root = boundRepo();
    writeNbaDecision(root);
    const code = runValidateDecisionCli(
      ["--decision", NBA_DECISION_PATH, "--plan", NBA_PLAN_PATH],
      root,
    );
    expect(code).toBe(0);
  });

  it("rejects a denial status", () => {
    const root = boundRepo();
    writeNbaDecision(root, (value) => {
      value["executionStatus"] = "not-authorized";
    });
    expect(() =>
      validatePlanExecutionDecision(root, NBA_DECISION_PATH, NBA_PLAN_PATH),
    ).toThrow(/executionStatus/);
  });

  it("rejects an ambiguous status", () => {
    const root = boundRepo();
    writeNbaDecision(root, (value) => {
      value["executionStatus"] = "authorized-with-conditions";
    });
    expect(() =>
      validatePlanExecutionDecision(root, NBA_DECISION_PATH, NBA_PLAN_PATH),
    ).toThrow(/executionStatus/);
  });

  it("rejects duplicate keys", () => {
    const root = boundRepo();
    writeNbaDecision(root);
    const file = join(root, NBA_DECISION_PATH);
    const text = readFileSync(file, "utf8").replace(
      '"schemaVersion":1}',
      '"schemaVersion":1,"schemaVersion":1}',
    );
    writeFileSync(file, text);
    expect(() =>
      validatePlanExecutionDecision(root, NBA_DECISION_PATH, NBA_PLAN_PATH),
    ).toThrow(/duplicate object key/);
  });

  it("rejects an unknown key", () => {
    const root = boundRepo();
    writeNbaDecision(root, (value) => {
      value["note"] = "looks fine";
    });
    expect(() =>
      validatePlanExecutionDecision(root, NBA_DECISION_PATH, NBA_PLAN_PATH),
    ).toThrow(/exactly the keys/);
  });

  it("rejects a missing key", () => {
    const root = boundRepo();
    writeNbaDecision(root, (value) => {
      delete value["role"];
    });
    expect(() =>
      validatePlanExecutionDecision(root, NBA_DECISION_PATH, NBA_PLAN_PATH),
    ).toThrow(/exactly the keys/);
  });

  it("rejects a whitespace-only identity", () => {
    const root = boundRepo();
    writeNbaDecision(root, (value) => {
      value["authorizedBy"] = "   ";
    });
    expect(() =>
      validatePlanExecutionDecision(root, NBA_DECISION_PATH, NBA_PLAN_PATH),
    ).toThrow(/authorizedBy/);
  });

  it("rejects an untrimmed identity", () => {
    const root = boundRepo();
    writeNbaDecision(root, (value) => {
      value["authorizedBy"] = " Fixture Owner ";
    });
    expect(() =>
      validatePlanExecutionDecision(root, NBA_DECISION_PATH, NBA_PLAN_PATH),
    ).toThrow(/authorizedBy/);
  });

  it("rejects a malformed timestamp", () => {
    const root = boundRepo();
    writeNbaDecision(root, (value) => {
      value["authorizedAt"] = "2026-08-06 01:00:00Z";
    });
    expect(() =>
      validatePlanExecutionDecision(root, NBA_DECISION_PATH, NBA_PLAN_PATH),
    ).toThrow(/authorizedAt/);
  });

  it("rejects an impossible calendar timestamp", () => {
    const root = boundRepo();
    writeNbaDecision(root, (value) => {
      value["authorizedAt"] = "2026-02-30T01:00:00Z";
    });
    expect(() =>
      validatePlanExecutionDecision(root, NBA_DECISION_PATH, NBA_PLAN_PATH),
    ).toThrow(/authorizedAt/);
  });

  it("rejects a wrong plan path", () => {
    const root = boundRepo();
    writeNbaDecision(root, (value) => {
      value["planPath"] = PLATFORM_PLAN_PATH;
    });
    expect(() =>
      validatePlanExecutionDecision(root, NBA_DECISION_PATH, NBA_PLAN_PATH),
    ).toThrow(/planPath/);
  });

  it("rejects a wrong role", () => {
    const root = boundRepo();
    writeNbaDecision(root, (value) => {
      value["role"] = "platform-foundation";
    });
    expect(() =>
      validatePlanExecutionDecision(root, NBA_DECISION_PATH, NBA_PLAN_PATH),
    ).toThrow(/role/);
  });

  it("rejects a non-SHA plan hash", () => {
    const root = boundRepo();
    writeNbaDecision(root, (value) => {
      value["planSha256"] = "not-a-sha";
    });
    expect(() =>
      validatePlanExecutionDecision(root, NBA_DECISION_PATH, NBA_PLAN_PATH),
    ).toThrow(/planSha256/);
  });

  it("rejects a wrong plan hash", () => {
    const root = boundRepo();
    writeNbaDecision(root, (value) => {
      value["planSha256"] = "a".repeat(64);
    });
    expect(() =>
      validatePlanExecutionDecision(root, NBA_DECISION_PATH, NBA_PLAN_PATH),
    ).toThrow(/does not match current plan bytes/);
  });

  it("rejects a wrong execution scope", () => {
    const root = boundRepo();
    writeNbaDecision(root, (value) => {
      value["executionScopeId"] = "wrong-scope";
    });
    expect(() =>
      validatePlanExecutionDecision(root, NBA_DECISION_PATH, NBA_PLAN_PATH),
    ).toThrow(/executionScopeId/);
  });

  it("rejects a missing closed scope", () => {
    const root = boundRepo();
    writeNbaDecision(root, (value) => {
      value["closedScopeIds"] = NBA_CLOSED_SCOPES_SORTED.slice(1);
    });
    expect(() =>
      validatePlanExecutionDecision(root, NBA_DECISION_PATH, NBA_PLAN_PATH),
    ).toThrow(/closedScopeIds/);
  });

  it("rejects an extra closed scope", () => {
    const root = boundRepo();
    writeNbaDecision(root, (value) => {
      value["closedScopeIds"] = [...NBA_CLOSED_SCOPES_SORTED, "zz-extra-scope"];
    });
    expect(() =>
      validatePlanExecutionDecision(root, NBA_DECISION_PATH, NBA_PLAN_PATH),
    ).toThrow(/closedScopeIds/);
  });

  it("rejects an unsorted closed scope list", () => {
    const root = boundRepo();
    writeNbaDecision(root, (value) => {
      value["closedScopeIds"] = [...NBA_CLOSED_SCOPES_SORTED].reverse();
    });
    expect(() =>
      validatePlanExecutionDecision(root, NBA_DECISION_PATH, NBA_PLAN_PATH),
    ).toThrow(/closedScopeIds/);
  });
});

describe("bind-authority-document", () => {
  it("rejects binding a missing file", () => {
    const root = boundRepo();
    expect(() =>
      bindPlanDocument(root, "docs/superpowers/plans/does-not-exist.md"),
    ).toThrow(/missing plan file/);
  });

  it("rejects a duplicate plan entry", () => {
    const root = boundRepo();
    expect(() => bindPlanDocument(root, NBA_PLAN_PATH)).toThrow(
      /already bound/,
    );
  });

  it("rejects CLI role/scope/closed-scopes that disagree with the plan header", () => {
    const root = createFixtureRepo();
    expect(() =>
      bindPlanDocument(root, NBA_PLAN_PATH, { role: "wrong-role" }),
    ).toThrow(/--role/);
    expect(() =>
      bindPlanDocument(root, NBA_PLAN_PATH, { executionScopeId: "wrong" }),
    ).toThrow(/--scope/);
    expect(() =>
      bindPlanDocument(root, NBA_PLAN_PATH, { closedScopeIds: ["deployment"] }),
    ).toThrow(/--closed-scopes/);
  });

  it("accepts CLI parameters that match the plan header", () => {
    const root = createFixtureRepo();
    const entry = bindPlanDocument(root, NBA_PLAN_PATH, {
      role: NBA_ROLE,
      executionScopeId: NBA_SCOPE,
      closedScopeIds: NBA_CLOSED_SCOPES_DECLARED,
      now: T0,
    });
    expect(entry.executionAuthorization?.closedScopeIds).toEqual(
      NBA_CLOSED_SCOPES_SORTED,
    );
    expect(entry.executionAuthorization?.status).toBe("not-authorized");
  });

  it("refuses to mark a plan authorized without a bound user decision", () => {
    const root = boundRepo();
    const code = runBindCli([NBA_PLAN_PATH, "--status", "authorized"], root);
    expect(code).toBe(1);
    const binding = verifyPlanBinding(root);
    const nba = binding.documents.find((doc) => doc.path === NBA_PLAN_PATH);
    expect(nba?.executionAuthorization?.status).toBe("not-authorized");
  });

  it("authorizes a plan from a valid decision and passes the full gate chain", () => {
    const root = boundRepo();
    writeNbaDecision(root);
    const entry = authorizePlan(root, NBA_PLAN_PATH, NBA_DECISION_PATH, {
      now: T0,
    });
    expect(entry.executionAuthorization?.status).toBe("authorized");
    expect(entry.executionAuthorization?.decisionPath).toBe(NBA_DECISION_PATH);
    expect(entry.executionAuthorization?.decisionSha256).toBe(
      sha256Hex(readFileSync(join(root, NBA_DECISION_PATH))),
    );
    verifyPlanBinding(root);
    expect(assertPlanAuthorized(root, NBA_PLAN_PATH).path).toBe(NBA_PLAN_PATH);
  });

  it("fails when decision bytes change between validation and the atomic write", () => {
    const root = boundRepo();
    writeNbaDecision(root);
    const before = readBindingBytes(root);
    expect(() =>
      authorizePlan(root, NBA_PLAN_PATH, NBA_DECISION_PATH, {
        now: T0,
        beforeWrite: () => {
          writeNbaDecision(root, (value) => {
            value["authorizedAt"] = "2026-08-06T02:00:00Z";
          });
        },
      }),
    ).toThrow(/changed between validation and binding/);
    expect(readBindingBytes(root).equals(before)).toBe(true);
    expect(() => assertPlanAuthorized(root, NBA_PLAN_PATH)).toThrow(
      /not authorized/,
    );
  });

  it("leaves the binding untouched when the write step fails (rollback)", () => {
    const root = boundRepo();
    writeNbaDecision(root);
    const before = readBindingBytes(root);
    expect(() =>
      authorizePlan(root, NBA_PLAN_PATH, NBA_DECISION_PATH, {
        now: T0,
        beforeWrite: () => {
          throw new Error("simulated half-applied write failure");
        },
      }),
    ).toThrow(/simulated half-applied write failure/);
    expect(readBindingBytes(root).equals(before)).toBe(true);
    // A clean retry still succeeds, after which the whole binding verifies.
    authorizePlan(root, NBA_PLAN_PATH, NBA_DECISION_PATH, { now: T0 });
    verifyPlanBinding(root);
  });

  it("rejects a non-bootstrap markdown decision", () => {
    const root = boundRepo();
    const proseDecision = "docs/decisions/2026-08-06-free-prose-approval.md";
    writeFileSync(
      join(root, proseDecision),
      "I authorize this plan. Trust me.\n",
    );
    expect(() =>
      authorizePlan(root, NBA_PLAN_PATH, proseDecision, { now: T0 }),
    ).toThrow(/only the G0 bootstrap decision may be markdown/);
  });

  it("rejects the bootstrap markdown decision for a non-platform plan", () => {
    const root = boundRepo();
    expect(() =>
      authorizePlan(root, NBA_PLAN_PATH, BOOTSTRAP_DECISION_PATH, { now: T0 }),
    ).toThrow(/may authorize only the platform foundation plan/);
  });

  it("supersedes the previous active plan for a role append-only", () => {
    const root = boundRepo();
    writeFileSync(
      join(root, NBA_PLAN_V2_PATH),
      planText(NBA_ROLE, NBA_SCOPE, NBA_CLOSED_SCOPES_DECLARED),
    );
    bindPlanDocument(root, NBA_PLAN_V2_PATH, { now: T0 });
    const binding = verifyPlanBinding(root);
    expect(binding.documents).toHaveLength(6);
    const oldEntry = binding.documents.find(
      (doc) => doc.path === NBA_PLAN_PATH,
    );
    const newEntry = binding.documents.find(
      (doc) => doc.path === NBA_PLAN_V2_PATH,
    );
    expect(oldEntry?.lifecycle).toBe("superseded");
    expect(oldEntry?.executionAuthorization?.status).toBe("superseded");
    expect(newEntry?.lifecycle).toBe("active");
    expect(newEntry?.executionAuthorization?.status).toBe("not-authorized");
    expect(resolveActivePlan(root, NBA_ROLE)).toBe(NBA_PLAN_V2_PATH);
  });
});

describe("assert-plan-authorized", () => {
  it("rejects an unauthorized plan", () => {
    const root = boundRepo();
    expect(() => assertPlanAuthorized(root, NBA_PLAN_PATH)).toThrow(
      /not authorized/,
    );
  });

  it("rejects an unbound plan", () => {
    const root = boundRepo();
    expect(() =>
      assertPlanAuthorized(root, "docs/superpowers/plans/ghost.md"),
    ).toThrow(/not bound/);
  });

  it("accepts the bootstrap-authorized platform plan and re-verifies everything", () => {
    const root = boundRepo();
    const entry = assertPlanAuthorized(root, PLATFORM_PLAN_PATH);
    expect(entry.executionAuthorization?.decisionPath).toBe(
      BOOTSTRAP_DECISION_PATH,
    );
  });

  it("rejects a missing decision file", () => {
    const root = boundRepo();
    writeNbaDecision(root);
    authorizePlan(root, NBA_PLAN_PATH, NBA_DECISION_PATH, { now: T0 });
    unlinkSync(join(root, NBA_DECISION_PATH));
    expect(() => assertPlanAuthorized(root, NBA_PLAN_PATH)).toThrow(
      /missing decision file/,
    );
  });

  it("rejects stale post-bind decision bytes", () => {
    const root = boundRepo();
    writeNbaDecision(root);
    authorizePlan(root, NBA_PLAN_PATH, NBA_DECISION_PATH, { now: T0 });
    writeNbaDecision(root, (value) => {
      value["authorizedAt"] = "2026-08-06T03:00:00Z";
    });
    expect(() => assertPlanAuthorized(root, NBA_PLAN_PATH)).toThrow(
      /bytes changed since binding/,
    );
    expect(() => verifyPlanBinding(root)).toThrow(/has changed/);
  });

  it("rejects a plan whose bytes changed after binding", () => {
    const root = boundRepo();
    const file = join(root, PLATFORM_PLAN_PATH);
    writeFileSync(file, `${readFileSync(file, "utf8")}\nEdited.\n`);
    expect(() => assertPlanAuthorized(root, PLATFORM_PLAN_PATH)).toThrow(
      /bytes changed since binding/,
    );
  });

  it("rejects a tampered bootstrap decision through the full re-verification", () => {
    const root = boundRepo();
    const file = join(root, BOOTSTRAP_DECISION_PATH);
    const bytes = readFileSync(file, "utf8");
    writeFileSync(
      file,
      bytes.replace(
        "g0ExecutionStatus: authorized",
        "g0ExecutionStatus: pending",
      ),
    );
    expect(() => assertPlanAuthorized(root, PLATFORM_PLAN_PATH)).toThrow(
      /bootstrap|changed/,
    );
  });
});

describe("resolve-active-plan", () => {
  it("resolves exactly one active bound path per role", () => {
    const root = boundRepo();
    expect(resolveActivePlan(root, "platform-foundation")).toBe(
      PLATFORM_PLAN_PATH,
    );
    expect(resolveActivePlan(root, NBA_ROLE)).toBe(NBA_PLAN_PATH);
  });

  it("fails for an unknown role", () => {
    const root = boundRepo();
    expect(() => resolveActivePlan(root, "no-such-role")).toThrow(/found 0/);
  });

  it("fails when the binding illegally holds two active plans for the role", () => {
    const root = boundRepo();
    rewriteBinding(root, (binding) => {
      const documents = binding["documents"] as Record<string, unknown>[];
      const nba = documents.find(
        (doc) => doc["path"] === NBA_PLAN_PATH,
      ) as Record<string, unknown>;
      documents.push({ ...nba, path: NBA_PLAN_V2_PATH });
    });
    expect(() => resolveActivePlan(root, NBA_ROLE)).toThrow(
      /more than one active plan/,
    );
  });
});
