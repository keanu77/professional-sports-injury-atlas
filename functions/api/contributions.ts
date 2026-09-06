import { submitContribution } from "../../src/lib/video/contributions";
export const onRequest = ({ request }: { request: Request }) =>
  submitContribution(request);
