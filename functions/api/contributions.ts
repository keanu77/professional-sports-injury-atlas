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
  submitContribution(
    request,
    async (input, init) => {
      try {
        const response = await fetch(input, init);
        console.info(
          JSON.stringify({
            event: "contribution-upstream",
            httpStatus: response.status,
          }),
        );
        return response;
      } catch (error) {
        console.info(
          JSON.stringify({
            event: "contribution-upstream",
            errorName: error instanceof Error ? error.name : "unknown",
          }),
        );
        throw error;
      }
    },
    createContributionGuard(env.PLAYBACK_DB),
  );
