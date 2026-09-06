import { submitContribution } from "../../src/lib/video/contributions";
import {
  createContributionGuard,
  type ContributionDatabase,
} from "../../src/lib/video/contribution-limits";
export const onRequest = ({
  request,
  env,
}: {
  request: Request;
  env: { PLAYBACK_DB?: ContributionDatabase };
}) =>
  submitContribution(request, fetch, createContributionGuard(env.PLAYBACK_DB));
