import {
  readFileSync,
  mkdirSync,
  writeFileSync,
  existsSync,
  lstatSync,
  statSync,
} from "node:fs";
import { dirname, resolve } from "node:path";
import { assessReaderRound } from "./lib/reader-results";

const args = process.argv.slice(2);
let rosterPath =
  "docs/reviews/2026-11-18-followup/reader-testing/round-template.json";
let outputPath = "output/reader-testing/assessment.json";
let requireAcceptance = false;
const sessionPaths: string[] = [];
for (let i = 0; i < args.length; i++) {
  const arg = args[i];
  if (arg === "--require-acceptance") requireAcceptance = true;
  else if (["--roster", "--session", "--output"].includes(arg!)) {
    const value = args[++i];
    if (!value || value.startsWith("--"))
      throw new Error(`Missing value for ${arg}`);
    if (arg === "--roster") rosterPath = value;
    else if (arg === "--output") outputPath = value;
    else sessionPaths.push(value);
  } else throw new Error(`Unknown argument: ${arg}`);
}
const existingOutput = existsSync(outputPath) ? statSync(outputPath) : null;
if (existsSync(outputPath) && lstatSync(outputPath).isSymbolicLink())
  throw new Error("Assessment output must not be a symbolic link");
if (
  [rosterPath, ...sessionPaths].some((path) => {
    if (resolve(path) === resolve(outputPath)) return true;
    if (!existingOutput || !existsSync(path)) return false;
    const input = statSync(path);
    return input.dev === existingOutput.dev && input.ino === existingOutput.ino;
  })
)
  throw new Error("Assessment output must not overwrite input evidence");
const read = (path: string): unknown => JSON.parse(readFileSync(path, "utf8"));
try {
  const report = assessReaderRound(read(rosterPath), sessionPaths.map(read));
  mkdirSync(dirname(outputPath), { recursive: true });
  writeFileSync(outputPath, JSON.stringify(report, null, 2) + "\n");
  console.log(
    JSON.stringify(
      {
        status: report.status,
        received: report.receivedParticipants,
        reviewed: report.reviewedParticipants,
        expected: report.expectedParticipants,
        successRate: report.successRate,
        acceptancePassed: report.acceptancePassed,
        outputPath,
      },
      null,
      2,
    ),
  );
  if (requireAcceptance && !report.acceptancePassed) process.exitCode = 1;
} catch (error) {
  // Invalidate a previous report so an input error cannot leave a stale passing result.
  mkdirSync(dirname(outputPath), { recursive: true });
  writeFileSync(
    outputPath,
    JSON.stringify(
      {
        status: "invalid-input",
        acceptancePassed: false,
        clinicalApproval: false,
        publicationApproval: false,
      },
      null,
      2,
    ) + "\n",
  );
  console.error(
    error instanceof Error ? error.message : "Invalid reader evidence",
  );
  process.exitCode = 1;
}
