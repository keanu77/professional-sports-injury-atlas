import {
  isPatientGuideApproved,
  patientGuideDigest,
  patientGuides,
} from "../../src/lib/patient/guides";

const requireApproval = process.argv.includes("--require-approval");
let missing = 0;
for (const guide of patientGuides) {
  const approved = isPatientGuideApproved(guide);
  console.log(
    `${guide.injuryCode}: ${approved ? "approved" : "needs-review"} ${patientGuideDigest(guide)}`,
  );
  if (!approved) missing++;
}
if (requireApproval && missing) {
  console.error(
    `Patient guide release blocked: ${missing} guide(s) require medical approval of their current text.`,
  );
  process.exitCode = 1;
}
